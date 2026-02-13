"""
Persistence for VueLogic: conversation history, lessons learned, trust score.
Uses Upstash Redis (Vercel KV). If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
are not set, all functions no-op or return empty/defaults.
"""
import os
import json
from datetime import datetime

_redis = None

def _get_redis():
    global _redis
    if _redis is not None:
        return _redis
    url = os.environ.get("UPSTASH_REDIS_REST_URL") or os.environ.get("KV_REST_API_URL")
    token = os.environ.get("UPSTASH_REDIS_REST_TOKEN") or os.environ.get("KV_REST_API_TOKEN")
    if not url or not token:
        return None
    try:
        from upstash_redis import Redis
        _redis = Redis(url=url, token=token)
        return _redis
    except Exception:
        return None


# --- Conversation ---
CONV_KEY_PREFIX = "vuelogic:conv:"
CONV_MAX_LEN = 100

def get_conversation(session_id: str) -> list:
    """Return list of {role, content} for this session. Empty if no store or no data."""
    r = _get_redis()
    if not r or not session_id:
        return []
    try:
        raw = r.get(CONV_KEY_PREFIX + session_id)
        if not raw:
            return []
        return json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        return []


def append_to_conversation(session_id: str, role: str, content: str) -> None:
    """Append one message; keep last CONV_MAX_LEN messages."""
    r = _get_redis()
    if not r or not session_id:
        return
    try:
        conv = get_conversation(session_id)
        conv.append({"role": role, "content": content or ""})
        conv = conv[-CONV_MAX_LEN:]
        r.set(CONV_KEY_PREFIX + session_id, json.dumps(conv))
    except Exception:
        pass


def save_conversation(session_id: str, full_history: list) -> None:
    """Replace stored conversation with this list (e.g. after loading from client)."""
    r = _get_redis()
    if not r or not session_id:
        return
    try:
        r.set(CONV_KEY_PREFIX + session_id, json.dumps(full_history[-CONV_MAX_LEN:]))
    except Exception:
        pass


# --- Lessons learned ---
LESSONS_KEY = "vuelogic:lessons"

def get_lessons() -> list:
    """Return list of lesson dicts (date, event, what_happened, outcome, lesson, recommendation)."""
    r = _get_redis()
    if not r:
        return []
    try:
        raw = r.get(LESSONS_KEY)
        if not raw:
            return []
        return json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        return []


def append_lesson(entry: dict) -> None:
    """Append one lesson. entry should have event, what_happened, outcome, lesson, recommendation."""
    r = _get_redis()
    if not r:
        return
    try:
        lessons = get_lessons()
        entry = dict(entry)
        entry.setdefault("date", datetime.utcnow().strftime("%Y-%m-%d"))
        lessons.append(entry)
        r.set(LESSONS_KEY, json.dumps(lessons))
    except Exception:
        pass


# --- Trust score ---
TRUST_KEY = "vuelogic:trust_score"

def get_trust_score() -> dict:
    """Return { approvals, total_proposals, historical_accuracy, ai_agency_score }."""
    r = _get_redis()
    default = {"approvals": 0, "total_proposals": 0, "historical_accuracy": 1.0, "ai_agency_score": 0.0}
    if not r:
        return default
    try:
        raw = r.get(TRUST_KEY)
        if not raw:
            return default
        data = json.loads(raw) if isinstance(raw, str) else raw
        approvals = int(data.get("approvals", 0))
        total = int(data.get("total_proposals", 0))
        ha = float(data.get("historical_accuracy", 1.0))
        score = (approvals / total * ha) if total else 0.0
        data["ai_agency_score"] = round(score, 2)
        return data
    except Exception:
        return default


def record_proposal(approved: bool) -> None:
    """Record one proposal outcome: total_proposals += 1, approvals += 1 if approved."""
    r = _get_redis()
    if not r:
        return
    try:
        data = get_trust_score()
        data["total_proposals"] = data.get("total_proposals", 0) + 1
        if approved:
            data["approvals"] = data.get("approvals", 0) + 1
        r.set(TRUST_KEY, json.dumps(data))
    except Exception:
        pass


def is_persistence_available() -> bool:
    return _get_redis() is not None
