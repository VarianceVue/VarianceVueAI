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

# Optional: OpenAI (will fail gracefully if not installed or no key)
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

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


def get_status_dict():
    """Debug: confirm API key and skill (callable from api/status.py)."""
    raw = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY_FILE")
    if raw and Path(raw).is_file():
        api_key = Path(raw).read_text().strip()
    else:
        api_key = raw or ""
    has_key = bool(api_key and len(api_key) > 10)
    skill_ok = SKILL_PATH.exists()
    return {
        "status": "ok",
        "has_api_key": has_key,
        "skill_loaded": skill_ok,
        "openai_installed": OpenAI is not None,
    }


@app.get("/api/status")
def api_status():
    return get_status_dict()


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Send a message to the Schedule Agent (Sequence Architect)."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message is required")

    if OpenAI is None:
        raise HTTPException(
            status_code=503,
            detail="OpenAI package not installed. Install with: pip install openai",
        )

    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY_FILE")
    if api_key and os.path.isfile(api_key):
        api_key = Path(api_key).read_text().strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY not set. Set it in .env or environment.",
        )

    system = get_system_prompt_cached()
    messages = [{"role": "system", "content": system}]

    for h in request.history:
        role = h.get("role")
        content = h.get("content") or ""
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": request.message.strip()})

    try:
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
        )
        reply = (resp.choices[0].message.content or "").strip()
        return ChatResponse(reply=reply)
    except Exception as e:
        return ChatResponse(reply="", error=str(e))


def handle_chat_json(message: str, history: list) -> dict:
    """Callable from api/chat.py: returns {"reply": str, "error": str|None} or raises with detail."""
    if not (message or "").strip():
        return {"reply": "", "error": "message is required"}
    if OpenAI is None:
        return {"reply": "", "error": "OpenAI package not installed"}
    raw = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY_FILE")
    if raw and Path(raw).is_file():
        api_key = Path(raw).read_text().strip()
    else:
        api_key = raw or ""
    if not api_key:
        return {"reply": "", "error": "OPENAI_API_KEY not set. Set it in Vercel Environment Variables."}
    system = get_system_prompt_cached()
    messages = [{"role": "system", "content": system}]
    for h in (history or []):
        role = h.get("role")
        content = h.get("content") or ""
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message.strip()})
    try:
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
        )
        reply = (resp.choices[0].message.content or "").strip()
        return {"reply": reply, "error": None}
    except Exception as e:
        return {"reply": "", "error": str(e)}


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
