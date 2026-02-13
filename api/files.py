# Vercel serverless: GET /api/files, POST /api/upload, DELETE /api/files
import json
from urllib.parse import parse_qs
from http.server import BaseHTTPRequestHandler


def read_body(handler):
    length = int(handler.headers.get("Content-Length", 0) or 0)
    if length == 0:
        return b""
    return handler.rfile.read(length)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            qs = parse_qs(self.path.split("?", 1)[1]) if "?" in self.path else {}
            session_id = (qs.get("session_id") or [""])[0].strip()
            from schedule_agent_web.store import get_files
            files = get_files(session_id) if session_id else []
            body = json.dumps(files).encode("utf-8")
        except Exception:
            body = json.dumps([]).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            # Vercel serverless: multipart/form-data parsing
            content_type = self.headers.get("Content-Type", "")
            if "multipart/form-data" not in content_type:
                raise ValueError("Expected multipart/form-data")
            raw = read_body(self)
            # Simple multipart parsing (boundary extraction)
            boundary = content_type.split("boundary=")[-1].strip()
            parts = raw.split(b"--" + boundary.encode())
            session_id = ""
            filename = ""
            file_content = b""
            for part in parts:
                if b"session_id" in part:
                    lines = part.split(b"\r\n")
                    for line in lines:
                        if b"session_id" in line and b"=" in line:
                            val = line.split(b"=", 1)[1].split(b"\r\n")[0].decode("utf-8", errors="replace").strip('"')
                            session_id = val
                if b"filename=" in part:
                    lines = part.split(b"\r\n")
                    for line in lines:
                        if b"filename=" in line:
                            fn = line.split(b"filename=", 1)[1].split(b"\r\n")[0].decode("utf-8", errors="replace").strip('"')
                            filename = fn
                    # Content is after headers
                    content_start = part.find(b"\r\n\r\n")
                    if content_start >= 0:
                        file_content = part[content_start + 4:].rstrip(b"\r\n--")
            if not session_id or not filename:
                raise ValueError("session_id and file required")
            text = file_content.decode("utf-8", errors="replace")
            if len(file_content) > 10 * 1024 * 1024:
                raise ValueError("File too large (max 10MB)")
            from schedule_agent_web.store import save_file
            result = save_file(session_id, filename, text)
            if not result:
                raise ValueError("Failed to save")
            body = json.dumps(result).encode("utf-8")
            status = 200
        except Exception as e:
            body = json.dumps({"error": str(e)}).encode("utf-8")
            status = 400
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_DELETE(self):
        try:
            qs = parse_qs(self.path.split("?", 1)[1]) if "?" in self.path else {}
            session_id = (qs.get("session_id") or [""])[0].strip()
            filename = (qs.get("filename") or [""])[0].strip()
            if not session_id or not filename:
                raise ValueError("session_id and filename required")
            from schedule_agent_web.store import delete_file
            if delete_file(session_id, filename):
                body = json.dumps({"status": "ok"}).encode("utf-8")
            else:
                body = json.dumps({"error": "not found"}).encode("utf-8")
            status = 200
        except Exception as e:
            body = json.dumps({"error": str(e)}).encode("utf-8")
            status = 400
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
