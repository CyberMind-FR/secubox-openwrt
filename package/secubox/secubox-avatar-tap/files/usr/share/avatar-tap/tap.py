"""
SecuBox Avatar Tap - Passive Session Capture Addon for mitmproxy

Captures authentication-related headers and cookies for session replay.
Designed to work with Nitrokey/GPG for secure authentication relay.
"""

from mitmproxy import http, ctx
import sqlite3
import json
import time
import os
import hashlib

DB_PATH = os.environ.get("AVATAR_TAP_DB", "/srv/avatar-tap/sessions.db")

# Headers to capture for authentication
AUTH_HEADERS = [
    "authorization",
    "x-auth-token",
    "x-access-token",
    "x-api-key",
    "x-csrf-token",
    "x-xsrf-token",
    "bearer",
    "www-authenticate",
]

def init_db():
    """Initialize SQLite database for session storage."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_hash TEXT UNIQUE,
        domain TEXT NOT NULL,
        path TEXT,
        method TEXT,
        cookies TEXT,
        headers TEXT,
        user_agent TEXT,
        captured_at INTEGER,
        last_used INTEGER,
        use_count INTEGER DEFAULT 0,
        label TEXT,
        avatar_id TEXT,
        verified INTEGER DEFAULT 0
    )''')
    conn.execute('''CREATE INDEX IF NOT EXISTS idx_domain ON sessions(domain)''')
    conn.execute('''CREATE INDEX IF NOT EXISTS idx_captured ON sessions(captured_at)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS replay_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        target_url TEXT,
        status_code INTEGER,
        replayed_at INTEGER,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )''')
    conn.commit()
    return conn


def compute_session_hash(domain, cookies, auth_headers):
    """Compute unique hash for session deduplication."""
    data = f"{domain}:{cookies}:{json.dumps(auth_headers, sort_keys=True)}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


class AvatarTap:
    """Mitmproxy addon for passive session capture."""

    def __init__(self):
        self.db = init_db()
        ctx.log.info(f"[AvatarTap] Initialized with DB: {DB_PATH}")

    def request(self, flow: http.HTTPFlow):
        """Capture authentication data from requests."""
        domain = flow.request.host
        path = flow.request.path
        method = flow.request.method

        # Extract cookies
        cookies = flow.request.headers.get("cookie", "")

        # Extract auth-related headers
        auth_headers = {}
        for header in AUTH_HEADERS:
            value = flow.request.headers.get(header)
            if value:
                auth_headers[header] = value

        # Also capture custom headers that look like tokens
        for key, value in flow.request.headers.items():
            key_lower = key.lower()
            if any(x in key_lower for x in ["token", "auth", "session", "key", "bearer"]):
                if key_lower not in auth_headers:
                    auth_headers[key_lower] = value

        # Skip if no auth data
        if not cookies and not auth_headers:
            return

        # Compute session hash for deduplication
        session_hash = compute_session_hash(domain, cookies, auth_headers)

        # Get user agent
        user_agent = flow.request.headers.get("user-agent", "")

        try:
            # Check if session already exists
            cur = self.db.execute(
                "SELECT id FROM sessions WHERE session_hash = ?",
                (session_hash,)
            )
            existing = cur.fetchone()

            if existing:
                # Update last seen
                self.db.execute(
                    "UPDATE sessions SET last_used = ? WHERE id = ?",
                    (int(time.time()), existing[0])
                )
            else:
                # Insert new session
                self.db.execute(
                    """INSERT INTO sessions
                       (session_hash, domain, path, method, cookies, headers, user_agent, captured_at, last_used)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (session_hash, domain, path, method, cookies,
                     json.dumps(auth_headers), user_agent,
                     int(time.time()), int(time.time()))
                )
                ctx.log.info(f"[AvatarTap] Captured session for {domain} ({method} {path[:50]})")

            self.db.commit()
        except Exception as e:
            ctx.log.error(f"[AvatarTap] DB error: {e}")

    def response(self, flow: http.HTTPFlow):
        """Capture Set-Cookie headers from responses."""
        set_cookies = flow.response.headers.get_all("set-cookie")
        if set_cookies:
            domain = flow.request.host
            ctx.log.debug(f"[AvatarTap] Captured {len(set_cookies)} Set-Cookie for {domain}")


addons = [AvatarTap()]
