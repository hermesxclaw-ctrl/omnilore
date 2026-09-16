"""Private localhost server for direct visual editing of Omnilore pages.

Never expose this server to a network. It accepts writes only to HTML files
inside the archive root and creates a timestamped backup before each save.
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKUPS = ROOT / "private-tools" / "backups"
MAX_BODY = 2_000_000


class AuthoringHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path != "/__omnilore_local_save":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BODY:
            self._json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "Invalid page size."})
            return
        try:
            payload = json.loads(self.rfile.read(length))
            requested = str(payload["path"]).replace("\\", "/")
            html = payload["html"]
            if not isinstance(html, str):
                raise ValueError("Page content must be text.")
            if not re.fullmatch(r"[A-Za-z0-9_./-]+\.html", requested):
                raise ValueError("Only archive HTML pages can be saved.")
            target = (ROOT / requested).resolve()
            target.relative_to(ROOT)
            if not target.is_file():
                raise ValueError("That page does not exist.")
        except (KeyError, TypeError, ValueError) as error:
            self._json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return

        BACKUPS.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
        backup = BACKUPS / f"{target.stem}-{stamp}.html"
        shutil.copy2(target, backup)
        target.write_text(html, encoding="utf-8", newline="\n")
        self._json(HTTPStatus.OK, {"saved": requested, "backup": str(backup.relative_to(ROOT)).replace("\\", "/")})

    def _json(self, status, body):
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 18766), AuthoringHandler).serve_forever()
