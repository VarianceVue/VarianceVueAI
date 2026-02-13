"""
Schedule Agent Web — FastAPI backend.
Exposes VueLogic (scheduling-agent) via chat API using the skill as system prompt.
"""
from pathlib import Path
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
    description="VueLogic — CPM, WBS, DCMA 14-Point, re-sequencing, what-if scenarios",
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
    scope_instruction = (
        "You are VueLogic. You must ONLY answer questions about project scheduling (CPM, WBS, logic, "
        "baselines, P6, delays, re-sequencing, critical path, what-if, DCMA 14-Point). "
        "For any other topic, politely decline and say you only help with scheduling questions.\n\n"
    )
    if not SKILL_PATH.exists():
        return (
            scope_instruction
            + "You help with CPM schedules, WBS, logic, DCMA 14-Point, re-sequencing, and what-if analysis. "
            "Skill file not found; using default behavior."
        )
    return scope_instruction + SKILL_PATH.read_text(encoding="utf-8", errors="replace")


SYSTEM_PROMPT = None


def get_system_prompt_cached() -> str:
    global SYSTEM_PROMPT
    if SYSTEM_PROMPT is None:
        SYSTEM_PROMPT = get_system_prompt()
    return SYSTEM_PROMPT


def get_system_prompt_with_context(session_id: str | None = None) -> str:
    """Base skill + lessons learned + trust score + uploaded files (for persistence)."""
    base = get_system_prompt_cached()
    try:
        from schedule_agent_web.store import get_lessons, get_trust_score, is_persistence_available, get_files, get_file_content
        if not is_persistence_available():
            return base
        lessons = get_lessons()
        trust = get_trust_score()
        parts = [base]
        if lessons:
            parts.append("\n\n## Current lessons learned (use when proposing options)\n")
            for i, le in enumerate(lessons[-20:], 1):  # last 20
                parts.append(f"- [{i}] {le.get('event', '')}: {le.get('lesson', '')}\n")
        parts.append("\n\n## Trust score (HITL)\n")
        parts.append(f"Approvals: {trust.get('approvals', 0)}, Total proposals: {trust.get('total_proposals', 0)}, AI_Agency_Score: {trust.get('ai_agency_score', 0)}. Level 1 (Autonomous) only if score ≥ 0.8; otherwise propose (Level 2/3).\n")
        # Include uploaded files if session_id provided
        if session_id:
            files = get_files(session_id)
            if files:
                parts.append("\n\n## Uploaded project files (use when answering questions)\n")
                for f in files:
                    filename = f.get("filename", "")
                    content = get_file_content(session_id, filename)
                    if content:
                        is_xer = filename.lower().endswith(".xer")
                        file_note = " (Primavera P6 export)" if is_xer else ""
                        # For .xer files, show more content (up to 200KB) since they contain schedule data
                        max_preview = 200000 if is_xer else 50000
                        preview = content[:max_preview] if len(content) > max_preview else content
                        parts.append(f"\n### File: {filename}{file_note}\n```\n{preview}\n```\n")
                        if len(content) > max_preview:
                            parts.append(f"\n(File truncated; showing first {max_preview//1000}KB of {len(content)//1000}KB)\n")
        return "".join(parts)
    except Exception:
        return base


class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []
    session_id: str | None = None


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
    d = get_status_dict()
    try:
        from schedule_agent_web.store import is_persistence_available
        d["persistence_available"] = is_persistence_available()
    except Exception:
        d["persistence_available"] = False
    return d


@app.get("/api/conversation")
def api_get_conversation(session_id: str = ""):
    """Return stored conversation for this session_id (persistence)."""
    if not session_id:
        return []
    try:
        from schedule_agent_web.store import get_conversation as store_get_conv
        return store_get_conv(session_id)
    except Exception:
        return []


@app.get("/api/lessons")
def api_get_lessons():
    """Return lessons learned list."""
    try:
        from schedule_agent_web.store import get_lessons
        return get_lessons()
    except Exception:
        return []


class LessonEntry(BaseModel):
    event: str = ""
    what_happened: str = ""
    outcome: str = ""
    lesson: str = ""
    recommendation: str = ""


@app.post("/api/lessons")
def api_append_lesson(entry: LessonEntry):
    """Append one lesson learned."""
    try:
        from schedule_agent_web.store import append_lesson
        append_lesson(entry.model_dump())
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trust_score")
def api_get_trust_score():
    """Return trust score (approvals, total_proposals, ai_agency_score)."""
    try:
        from schedule_agent_web.store import get_trust_score
        return get_trust_score()
    except Exception:
        return {"approvals": 0, "total_proposals": 0, "ai_agency_score": 0.0}


class TrustScoreUpdate(BaseModel):
    approved: bool


@app.post("/api/trust_score")
def api_record_proposal(update: TrustScoreUpdate):
    """Record one proposal outcome (e.g. user approved or declined)."""
    try:
        from schedule_agent_web.store import record_proposal, get_trust_score
        record_proposal(update.approved)
        return get_trust_score()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/files")
def api_get_files(session_id: str = ""):
    """Return list of uploaded files for this session."""
    if not session_id:
        return []
    try:
        from schedule_agent_web.store import get_files
        return get_files(session_id)
    except Exception:
        return []


@app.post("/api/upload")
async def api_upload_file(session_id: str = Form(""), file: UploadFile = File(...)):
    """Upload a file (CSV, MD, TXT, XER, etc.) for this session. Max 10MB."""
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        # .xer files are text-based (Primavera P6 export), decode as UTF-8
        text = content.decode("utf-8", errors="replace")
        from schedule_agent_web.store import save_file
        result = save_file(session_id, file.filename or "upload.txt", text)
        if not result:
            raise HTTPException(status_code=500, detail="Failed to save file")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/files")
def api_delete_file(session_id: str = "", filename: str = ""):
    """Delete one uploaded file."""
    if not session_id or not filename:
        raise HTTPException(status_code=400, detail="session_id and filename required")
    try:
        from schedule_agent_web.store import delete_file
        if delete_file(session_id, filename):
            return {"status": "ok"}
        raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    """Send a message to the Schedule Agent (VueLogic). Persists conversation if session_id and Redis set."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    if not get_status_dict().get("has_api_key"):
        raise HTTPException(
            status_code=503,
            detail="Set OPENAI_API_KEY or ANTHROPIC_API_KEY in environment.",
        )
    system = get_system_prompt_with_context(request.session_id)
    messages_for_llm = []
    for h in request.history:
        role = h.get("role")
        content = h.get("content") or ""
        if role in ("user", "assistant"):
            messages_for_llm.append({"role": role, "content": content})
    messages_for_llm.append({"role": "user", "content": request.message.strip()})
    reply, err = _call_llm(system, messages_for_llm)
    if request.session_id and not err:
        try:
            from schedule_agent_web.store import append_to_conversation
            append_to_conversation(request.session_id, "user", request.message.strip())
            append_to_conversation(request.session_id, "assistant", reply)
        except Exception:
            pass
    return ChatResponse(reply=reply, error=err)


def handle_chat_json(message: str, history: list, session_id: str | None = None) -> dict:
    """Callable from api/chat.py: returns {"reply": str, "error": str|None}. Persists conversation if session_id and Redis set."""
    if not (message or "").strip():
        return {"reply": "", "error": "message is required"}
    if not get_status_dict().get("has_api_key"):
        return {"reply": "", "error": "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel Environment Variables."}
    system = get_system_prompt_with_context(session_id)
    messages_for_llm = []
    for h in (history or []):
        role = h.get("role")
        content = h.get("content") or ""
        if role in ("user", "assistant"):
            messages_for_llm.append({"role": role, "content": content})
    messages_for_llm.append({"role": "user", "content": message.strip()})
    reply, err = _call_llm(system, messages_for_llm)
    if session_id and not err:
        try:
            from schedule_agent_web.store import append_to_conversation
            append_to_conversation(session_id, "user", message.strip())
            append_to_conversation(session_id, "assistant", reply)
        except Exception:
            pass
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
