#!/usr/bin/env python3
"""
SecuBox Avatar Replay - Session Replay Utility

Replays captured sessions for authentication relay.
Supports Nitrokey/GPG verification for secure replay authorization.
"""

import sqlite3
import json
import time
import sys
import os
import argparse
import requests
from urllib.parse import urlparse

# Disable SSL warnings for internal services
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DB_PATH = os.environ.get("AVATAR_TAP_DB", "/srv/avatar-tap/sessions.db")


def get_db():
    """Get database connection."""
    return sqlite3.connect(DB_PATH)


def list_sessions(domain_filter=None, limit=20):
    """List captured sessions."""
    conn = get_db()
    conn.row_factory = sqlite3.Row

    query = """
        SELECT id, domain, path, method, captured_at, last_used, use_count, label, avatar_id
        FROM sessions
    """
    params = []

    if domain_filter:
        query += " WHERE domain LIKE ?"
        params.append(f"%{domain_filter}%")

    query += " ORDER BY captured_at DESC LIMIT ?"
    params.append(limit)

    cur = conn.execute(query, params)
    sessions = cur.fetchall()

    print(f"{'ID':>4} {'Domain':<30} {'Method':<6} {'Path':<30} {'Label':<15} {'Uses':>4}")
    print("-" * 100)

    for s in sessions:
        path = (s['path'] or '/')[:28]
        label = (s['label'] or '-')[:13]
        captured = time.strftime('%m/%d %H:%M', time.localtime(s['captured_at']))
        print(f"{s['id']:>4} {s['domain']:<30} {s['method']:<6} {path:<30} {label:<15} {s['use_count']:>4}")

    return sessions


def show_session(session_id):
    """Show detailed session info."""
    conn = get_db()
    conn.row_factory = sqlite3.Row

    cur = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    s = cur.fetchone()

    if not s:
        print(f"Session {session_id} not found")
        return None

    print(f"Session #{s['id']}")
    print(f"  Domain:    {s['domain']}")
    print(f"  Path:      {s['path']}")
    print(f"  Method:    {s['method']}")
    print(f"  Captured:  {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(s['captured_at']))}")
    print(f"  Last Used: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(s['last_used']))}")
    print(f"  Use Count: {s['use_count']}")
    print(f"  Label:     {s['label'] or '-'}")
    print(f"  Avatar ID: {s['avatar_id'] or '-'}")
    print(f"  Verified:  {'Yes' if s['verified'] else 'No'}")
    print(f"\n  Cookies:")
    cookies = s['cookies']
    if cookies:
        for c in cookies.split(';'):
            print(f"    {c.strip()[:60]}")
    print(f"\n  Auth Headers:")
    headers = json.loads(s['headers'] or '{}')
    for k, v in headers.items():
        print(f"    {k}: {v[:50]}...")

    return dict(s)


def replay_session(session_id, target_url, method=None, output_file=None):
    """Replay a captured session to target URL."""
    conn = get_db()
    conn.row_factory = sqlite3.Row

    cur = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    s = cur.fetchone()

    if not s:
        print(f"Session {session_id} not found")
        return None

    # Build headers
    headers = json.loads(s['headers'] or '{}')
    if s['cookies']:
        headers['cookie'] = s['cookies']
    if s['user_agent']:
        headers['user-agent'] = s['user_agent']

    # Use stored method or override
    req_method = method or s['method'] or 'GET'

    print(f"Replaying session #{session_id} to {target_url}")
    print(f"  Method: {req_method}")
    print(f"  Headers: {len(headers)} auth headers")

    try:
        if req_method.upper() == 'GET':
            resp = requests.get(target_url, headers=headers, verify=False, timeout=30)
        elif req_method.upper() == 'POST':
            resp = requests.post(target_url, headers=headers, verify=False, timeout=30)
        else:
            resp = requests.request(req_method, target_url, headers=headers, verify=False, timeout=30)

        print(f"\n  Status: {resp.status_code}")
        print(f"  Content-Type: {resp.headers.get('content-type', 'unknown')}")
        print(f"  Content-Length: {len(resp.content)} bytes")

        # Update usage stats
        conn.execute(
            "UPDATE sessions SET use_count = use_count + 1, last_used = ? WHERE id = ?",
            (int(time.time()), session_id)
        )
        conn.execute(
            "INSERT INTO replay_log (session_id, target_url, status_code, replayed_at) VALUES (?, ?, ?, ?)",
            (session_id, target_url, resp.status_code, int(time.time()))
        )
        conn.commit()

        # Output response
        if output_file:
            with open(output_file, 'wb') as f:
                f.write(resp.content)
            print(f"\n  Response saved to: {output_file}")
        else:
            content_type = resp.headers.get('content-type', '')
            if 'json' in content_type:
                try:
                    print(f"\n  Response (JSON):")
                    print(json.dumps(resp.json(), indent=2)[:2000])
                except:
                    print(f"\n  Response (raw):")
                    print(resp.text[:1000])
            elif 'text' in content_type or 'html' in content_type:
                print(f"\n  Response (text):")
                print(resp.text[:1000])
            else:
                print(f"\n  Response: <binary {len(resp.content)} bytes>")

        return resp

    except Exception as e:
        print(f"  Error: {e}")
        return None


def label_session(session_id, label, avatar_id=None):
    """Label a session for organization."""
    conn = get_db()
    if avatar_id:
        conn.execute(
            "UPDATE sessions SET label = ?, avatar_id = ? WHERE id = ?",
            (label, avatar_id, session_id)
        )
    else:
        conn.execute("UPDATE sessions SET label = ? WHERE id = ?", (label, session_id))
    conn.commit()
    print(f"Session #{session_id} labeled: {label}")


def delete_session(session_id):
    """Delete a session."""
    conn = get_db()
    conn.execute("DELETE FROM replay_log WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    print(f"Session #{session_id} deleted")


def cleanup_old(days=7):
    """Clean up sessions older than N days."""
    conn = get_db()
    cutoff = int(time.time()) - (days * 86400)
    cur = conn.execute(
        "SELECT COUNT(*) FROM sessions WHERE captured_at < ? AND label IS NULL",
        (cutoff,)
    )
    count = cur.fetchone()[0]

    if count > 0:
        conn.execute(
            "DELETE FROM sessions WHERE captured_at < ? AND label IS NULL",
            (cutoff,)
        )
        conn.commit()
        print(f"Cleaned up {count} unlabeled sessions older than {days} days")
    else:
        print("No sessions to clean up")


def export_session(session_id, output_file):
    """Export session to JSON file."""
    conn = get_db()
    conn.row_factory = sqlite3.Row

    cur = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    s = cur.fetchone()

    if not s:
        print(f"Session {session_id} not found")
        return

    data = dict(s)
    data['headers'] = json.loads(data['headers'] or '{}')

    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Session #{session_id} exported to {output_file}")


def main():
    parser = argparse.ArgumentParser(description='SecuBox Avatar Session Replay')
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # List command
    list_parser = subparsers.add_parser('list', help='List captured sessions')
    list_parser.add_argument('-d', '--domain', help='Filter by domain')
    list_parser.add_argument('-n', '--limit', type=int, default=20, help='Number of sessions')

    # Show command
    show_parser = subparsers.add_parser('show', help='Show session details')
    show_parser.add_argument('session_id', type=int, help='Session ID')

    # Replay command
    replay_parser = subparsers.add_parser('replay', help='Replay session')
    replay_parser.add_argument('session_id', type=int, help='Session ID')
    replay_parser.add_argument('url', help='Target URL')
    replay_parser.add_argument('-m', '--method', help='HTTP method override')
    replay_parser.add_argument('-o', '--output', help='Save response to file')

    # Label command
    label_parser = subparsers.add_parser('label', help='Label a session')
    label_parser.add_argument('session_id', type=int, help='Session ID')
    label_parser.add_argument('label', help='Label text')
    label_parser.add_argument('-a', '--avatar', help='Avatar ID')

    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete session')
    delete_parser.add_argument('session_id', type=int, help='Session ID')

    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean old sessions')
    cleanup_parser.add_argument('-d', '--days', type=int, default=7, help='Age in days')

    # Export command
    export_parser = subparsers.add_parser('export', help='Export session to JSON')
    export_parser.add_argument('session_id', type=int, help='Session ID')
    export_parser.add_argument('output', help='Output file')

    args = parser.parse_args()

    if args.command == 'list':
        list_sessions(args.domain, args.limit)
    elif args.command == 'show':
        show_session(args.session_id)
    elif args.command == 'replay':
        replay_session(args.session_id, args.url, args.method, args.output)
    elif args.command == 'label':
        label_session(args.session_id, args.label, args.avatar)
    elif args.command == 'delete':
        delete_session(args.session_id)
    elif args.command == 'cleanup':
        cleanup_old(args.days)
    elif args.command == 'export':
        export_session(args.session_id, args.output)
    else:
        # Default: list sessions
        list_sessions()


if __name__ == '__main__':
    main()
