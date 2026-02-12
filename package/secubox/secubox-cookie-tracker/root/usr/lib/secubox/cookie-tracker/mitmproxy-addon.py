#!/usr/bin/env python3
"""
SecuBox Cookie Tracker Addon for mitmproxy
Extracts, classifies, and tracks HTTP cookies passing through the proxy.
Integrates with the cookie-tracker SQLite database.
"""

import sqlite3
import os
import re
import time
from datetime import datetime
from mitmproxy import http, ctx

# Database path
DB_PATH = "/var/lib/cookie-tracker/cookies.db"

# Known tracking cookie patterns
TRACKING_PATTERNS = {
    'analytics': [
        r'^_ga$', r'^_gid$', r'^_gat', r'^__utm',  # Google Analytics
        r'^_hjid', r'^_hjSession',  # Hotjar
        r'^ajs_user_id', r'^ajs_anonymous_id',  # Segment
        r'^mp_.*_mixpanel',  # Mixpanel
        r'^__hssc', r'^__hssrc', r'^__hstc', r'^hubspotutk',  # HubSpot
        r'^_pk_id', r'^_pk_ses',  # Matomo/Piwik
        r'^amplitude_id',  # Amplitude
        r'^_clck', r'^_clsk',  # Microsoft Clarity
        r'^__insp_',  # Inspectlet
        r'^_vwo_',  # VWO
        r'^optimizelyEndUserId',  # Optimizely
    ],
    'advertising': [
        r'^_fbp$', r'^_fbc$', r'^fr$', r'^datr$',  # Facebook
        r'^IDE$', r'^NID$', r'^ANID$',  # Google Ads/DoubleClick
        r'^_gcl_',  # Google Conversion Linker
        r'^_uetsid', r'^_uetvid',  # Microsoft Ads/Bing
        r'^_pin_unauth',  # Pinterest
        r'^__pdst',  # Pardot
        r'^li_sugr', r'^bcookie', r'^bscookie',  # LinkedIn
        r'^_tt_enable_cookie', r'^_ttp',  # TikTok
        r'^cto_bundle',  # Criteo
        r'^taboola_',  # Taboola
        r'^outbrain_',  # Outbrain
    ],
    'tracking': [
        r'^__cfduid',  # Cloudflare (legacy)
        r'^_dc_gtm_',  # Google Tag Manager
        r'^_gac_',  # Google Ads conversion
        r'^uuid$', r'^visitor_id',  # Generic tracking
        r'^_parsely',  # Parse.ly
        r'^__gads',  # Google Ads
        r'^_rdt_uuid',  # Reddit
        r'^_scid',  # Snap
        r'^_twclid',  # Twitter
        r'^_derived_epik',  # Pinterest
    ],
    'functional': [
        r'^lang$', r'^locale$', r'^language$',
        r'^timezone$', r'^tz$',
        r'^theme$', r'^dark_mode$',
        r'^remember_token$', r'^user_pref',
        r'^cookie_consent', r'^gdpr',
    ],
    'essential': [
        r'^session', r'^sess_', r'^PHPSESSID$', r'^JSESSIONID$',
        r'^csrf', r'^_csrf', r'^XSRF-TOKEN',
        r'^auth', r'^token$', r'^jwt$',
        r'^__Secure-', r'^__Host-',
    ],
}

# Known tracker domains
TRACKER_DOMAINS = {
    'analytics': [
        'google-analytics.com', 'analytics.google.com',
        'hotjar.com', 'segment.io', 'segment.com',
        'mixpanel.com', 'hubspot.com', 'hs-analytics.net',
        'matomo.cloud', 'amplitude.com', 'clarity.ms',
        'inspectlet.com', 'visualwebsiteoptimizer.com',
        'optimizely.com', 'fullstory.com', 'heap.io',
    ],
    'advertising': [
        'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
        'facebook.com', 'facebook.net', 'fbcdn.net',
        'ads.linkedin.com', 'ads.twitter.com', 'ads.pinterest.com',
        'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com',
        'adsrvr.org', 'adnxs.com', 'rubiconproject.com',
        'pubmatic.com', 'openx.net', 'casalemedia.com',
        'advertising.com', 'quantserve.com',
    ],
    'tracking': [
        'pixel.facebook.com', 'bat.bing.com', 'px.ads.linkedin.com',
        't.co', 'analytics.tiktok.com', 'sc-static.net',
        'ct.pinterest.com', 'snap.licdn.com',
    ],
}


class CookieTracker:
    def __init__(self):
        self.db_initialized = False
        self._init_db()
        ctx.log.info("Cookie Tracker addon loaded")

    def _init_db(self):
        """Initialize database connection and create tables if needed."""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

            conn = sqlite3.connect(DB_PATH)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cookies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    domain TEXT NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT DEFAULT 'unknown',
                    first_seen INTEGER DEFAULT (strftime('%s', 'now')),
                    last_seen INTEGER DEFAULT (strftime('%s', 'now')),
                    count INTEGER DEFAULT 1,
                    client_mac TEXT,
                    blocked INTEGER DEFAULT 0,
                    UNIQUE(domain, name)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tracker_domains (
                    domain TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    source TEXT DEFAULT 'manual',
                    added INTEGER DEFAULT (strftime('%s', 'now'))
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cookies_domain ON cookies(domain)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cookies_category ON cookies(category)")
            conn.commit()
            conn.close()
            self.db_initialized = True
            ctx.log.info(f"Cookie Tracker database ready: {DB_PATH}")
        except Exception as e:
            ctx.log.error(f"Failed to initialize database: {e}")

    def _classify_cookie(self, domain: str, name: str) -> str:
        """Classify a cookie based on name patterns and domain."""
        name_lower = name.lower()
        domain_lower = domain.lower()

        # Check name patterns first (most specific)
        for category, patterns in TRACKING_PATTERNS.items():
            for pattern in patterns:
                if re.match(pattern, name, re.IGNORECASE):
                    return category

        # Check domain against known trackers
        for category, domains in TRACKER_DOMAINS.items():
            for tracker_domain in domains:
                if tracker_domain in domain_lower:
                    return category

        # Check database for custom tracker domains
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.execute(
                "SELECT category FROM tracker_domains WHERE ? LIKE '%' || domain || '%'",
                (domain_lower,)
            )
            row = cursor.fetchone()
            conn.close()
            if row:
                return row[0]
        except Exception:
            pass

        return 'unknown'

    def _parse_set_cookie(self, header: str) -> dict:
        """Parse Set-Cookie header into components."""
        parts = header.split(';')
        if not parts:
            return None

        # First part is name=value
        name_value = parts[0].strip()
        if '=' not in name_value:
            return None

        name, value = name_value.split('=', 1)
        name = name.strip()
        value = value.strip()

        cookie = {
            'name': name,
            'value': value[:100],  # Truncate value
            'attributes': {}
        }

        # Parse attributes
        for part in parts[1:]:
            part = part.strip()
            if '=' in part:
                key, val = part.split('=', 1)
                cookie['attributes'][key.lower().strip()] = val.strip()
            else:
                cookie['attributes'][part.lower()] = True

        return cookie

    def _record_cookie(self, domain: str, cookie: dict, client_ip: str = None):
        """Record a cookie in the database."""
        if not self.db_initialized:
            return

        name = cookie['name']
        category = self._classify_cookie(domain, name)

        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.execute("""
                INSERT INTO cookies (domain, name, category, client_mac)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(domain, name) DO UPDATE SET
                    last_seen = strftime('%s', 'now'),
                    count = count + 1,
                    category = CASE
                        WHEN excluded.category != 'unknown' THEN excluded.category
                        ELSE cookies.category
                    END
            """, (domain, name, category, client_ip))
            conn.commit()
            conn.close()

            # Log tracking cookies
            if category in ('tracking', 'advertising'):
                ctx.log.warn(f"TRACKING COOKIE: {domain} - {name} [{category}]")
            else:
                ctx.log.debug(f"Cookie recorded: {domain}/{name} [{category}]")

        except Exception as e:
            ctx.log.error(f"Failed to record cookie: {e}")

    def response(self, flow: http.HTTPFlow):
        """Process response and extract Set-Cookie headers."""
        if not flow.response:
            return

        # Get domain from request
        domain = flow.request.host

        # Get client IP for tracking
        client_ip = None
        if flow.client_conn and flow.client_conn.peername:
            client_ip = flow.client_conn.peername[0]

        # Check for Set-Cookie headers
        cookies = flow.response.headers.get_all('set-cookie')
        if not cookies:
            return

        for cookie_header in cookies:
            cookie = self._parse_set_cookie(cookie_header)
            if cookie:
                self._record_cookie(domain, cookie, client_ip)

    def request(self, flow: http.HTTPFlow):
        """Process request and extract Cookie header."""
        if not flow.request:
            return

        domain = flow.request.host
        client_ip = None
        if flow.client_conn and flow.client_conn.peername:
            client_ip = flow.client_conn.peername[0]

        # Get Cookie header
        cookie_header = flow.request.headers.get('cookie')
        if not cookie_header:
            return

        # Parse cookies from request
        for cookie_str in cookie_header.split(';'):
            cookie_str = cookie_str.strip()
            if '=' in cookie_str:
                name, value = cookie_str.split('=', 1)
                cookie = {
                    'name': name.strip(),
                    'value': value.strip()[:100],
                    'attributes': {}
                }
                self._record_cookie(domain, cookie, client_ip)


addons = [CookieTracker()]
