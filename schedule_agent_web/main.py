"""
Schedule Agent Web — FastAPI backend.
Exposes the Sequence Architect (scheduling-agent) via chat API using the skill as system prompt.
"""
from pathlib import Path
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Optional: OpenAI and Anthropic (Claude)
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None

app = FastAPI(
    title="Schedule Agent API",
    description="Sequence Architect — CPM, WBS, DCMA 14-Point, re-sequencing, what-if scenarios",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths: assume repo root is parent of schedule_agent_web
REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL_PATH = REPO_ROOT / ".cursor" / "skills" / "scheduling-agent" / "SKILL.md"

# Override with env if set (e.g. in Docker)
if os.environ.get("SCHEDULE_AGENT_SKILL_PATH"):
    SKILL_PATH = Path(os.environ["SCHEDULE_AGENT_SKILL_PATH"])


def get_system_prompt() -> str:
    """Load scheduling-agent skill as system prompt."""
    if not SKILL_PATH.exists():
        return (
            "You are the Sequence Architect scheduling agent. "
            "You help with CPM schedules, WBS, logic, DCMA 14-Point, re-sequencing, and what-if analysis. "
            "Skill file not found; using default behavior."
        )
    return SKILL_PATH.read_text(encoding="utf-8", errors="replace")


SYSTEM_PROMPT = None


def get_system_prompt_cached() -> str:
    global SYSTEM_PROMPT
    if SYSTEM_PROMPT is None:
        SYSTEM_PROMPT = get_system_prompt()
    return SYSTEM_PROMPT


class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []


class ChatResponse(BaseModel):
    reply: str
    error: str | None = None


@app.get("/health")
def health():
    return {"status": "ok", "agent": "schedule-agent"}


def _get_openai_key():
    raw = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY_FILE")
    if raw and Path(raw).is_file():
        return Path(raw).read_text().strip()
    return raw or ""


def _get_anthropic_key():
    raw = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY_FILE")
    if raw and Path(raw).is_file():
        return Path(raw).read_text().strip()
    return raw or ""


def _use_claude():
    """Use Claude if Anthropic key is set (overrides OpenAI when both set)."""
    return bool(_get_anthropic_key() and len(_get_anthropic_key()) > 10 and Anthropic is not None)


def get_status_dict():
    """Debug: confirm API key and skill (callable from api/status.py)."""
    openai_key = _get_openai_key()
    anthropic_key = _get_anthropic_key()
    has_openai = bool(openai_key and len(openai_key) > 10)
    has_anthropic = bool(anthropic_key and len(anthropic_key) > 10)
    skill_ok = SKILL_PATH.exists()
    provider = "claude" if (has_anthropic and Anthropic) else ("openai" if (has_openai and OpenAI) else None)
    return {
        "status": "ok",
        "has_api_key": has_openai or has_anthropic,
        "has_anthropic_key": has_anthropic,
        "has_openai_key": has_openai,
        "provider": provider,
        "skill_loaded": skill_ok,
        "openai_installed": OpenAI is not None,
        "anthropic_installed": Anthropic is not None,
    }


@app.get("/api/status")
def api_status():
    return get_status_dict()


def _call_llm(system: str, messages_for_llm: list) -> tuple[str, str | None]:
    """Call OpenAI or Claude; returns (reply, error). Prefers Claude if ANTHROPIC_API_KEY set."""
    if _use_claude():
        key = _get_anthropic_key()
        # Try ANTHROPIC_MODEL first, then fallback models (404 = model not found on your account)
        default_models = ("claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-sonnet-4-20250514", "claude-3-haiku-20240307")
        model = os.environ.get("ANTHROPIC_MODEL") or default_models[0]
        models_to_try = [model] + [m for m in default_models if m != model]
        claude_messages = [{"role": m["role"], "content": m["content"]} for m in messages_for_llm if m["role"] in ("user", "assistant")]
        last_err = None
        for try_model in models_to_try:
            try:
                client = Anthropic(api_key=key)
                resp = client.messages.create(
                    model=try_model,
                    max_tokens=4096,
                    system=system,
                    messages=claude_messages,
                )
                text = (resp.content[0].text if resp.content else "").strip()
                return (text, None)
            except Exception as e:
                last_err = e
                if "404" in str(e) or "not_found" in str(e).lower():
                    continue  # try next model
                return ("", str(e))
        return ("", str(last_err) if last_err else "No Claude model available. Set ANTHROPIC_MODEL in Vercel to a model your account has (e.g. claude-3-haiku-20240307).")
    # OpenAI
    key = _get_openai_key()
    if not key or not OpenAI:
        return ("", "No API key or OpenAI not installed. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.")
    try:
        client = OpenAI(api_key=key)
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
            messages=[{"role": "system", "content": system}] + messages_for_llm,
            temperature=0.3,
            max_tokens=4096,
        )
        reply = (resp.choices[0].message.content or "").strip()
        return (reply, None)
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower() or "insufficient_quota" in err.lower():
            err += " Use Claude instead: in Vercel set ANTHROPIC_API_KEY (get a key at console.anthropic.com) and redeploy."
        return ("", err)


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Send a message to the Schedule Agent (Sequence Architect)."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    if not get_status_dict().get("has_api_key"):
        raise HTTPException(
            status_code=503,
            detail="Set OPENAI_API_KEY or ANTHROPIC_API_KEY in environment.",
        )
    system = get_system_prompt_cached()
    messages_for_llm = []
    for h in request.history:
        role = h.get("role")
        content = h.get("content") or ""
        if role in ("user", "assistant"):
            messages_for_llm.append({"role": role, "content": content})
    messages_for_llm.append({"role": "user", "content": request.message.strip()})
    reply, err = _call_llm(system, messages_for_llm)
    return ChatResponse(reply=reply, error=err)


def handle_chat_json(message: str, history: list) -> dict:
    """Callable from api/chat.py: returns {"reply": str, "error": str|None}. Uses Claude if ANTHROPIC_API_KEY set."""
    if not (message or "").strip():
        return {"reply": "", "error": "message is required"}
    if not get_status_dict().get("has_api_key"):
        return {"reply": "", "error": "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel Environment Variables."}
    system = get_system_prompt_cached()
    messages_for_llm = []
    for h in (history or []):
        role = h.get("role")
        content = h.get("content") or ""
        if role in ("user", "assistant"):
            messages_for_llm.append({"role": role, "content": content})
    messages_for_llm.append({"role": "user", "content": message.strip()})
    reply, err = _call_llm(system, messages_for_llm)
    return {"reply": reply, "error": err}


# Serve frontend locally (on Vercel, public/ is served by CDN)
if not os.environ.get("VERCEL"):
    static_dir = Path(__file__).resolve().parent / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        @app.get("/")
        def index():
            return FileResponse(static_dir / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
