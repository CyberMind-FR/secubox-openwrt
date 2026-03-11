"""
Security Dashboard - Phase 3
WAF, CrowdSec, Firewall with auto-refresh
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu
from lib.widgets import page_header, badge, status_card, auto_refresh_toggle

st.set_page_config(page_title="Security - SecuBox Control", page_icon="🛡️", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("Security", "WAF status, CrowdSec decisions, firewall", "🛡️")

# Auto-refresh
auto_refresh_toggle("security", intervals=[10, 30, 60])
st.markdown("---")

# Fetch status
with st.spinner("Loading security status..."):
    mitmproxy = ubus.mitmproxy_status()
    crowdsec = ubus.crowdsec_status()

# Parse CrowdSec status correctly
# The crowdsec_status() returns various formats depending on the RPCD handler
cs_state = crowdsec.get("crowdsec", crowdsec.get("status", "unknown"))
if isinstance(cs_state, str):
    cs_running = cs_state.lower() in ("running", "active", "ok")
else:
    cs_running = bool(cs_state)

# Get stats from crowdsec response
cs_decisions = crowdsec.get("active_decisions", crowdsec.get("decisions_count", 0))
cs_alerts = crowdsec.get("alerts_today", crowdsec.get("alerts", 0))
cs_bouncers = crowdsec.get("bouncers", crowdsec.get("bouncer_count", 0))

# WAF stats
waf_running = mitmproxy.get("running", False)
waf_threats = mitmproxy.get("threats_today", 0)
waf_blocked = mitmproxy.get("blocked_today", 0)
waf_port = mitmproxy.get("port", 22222)

# Status cards row
st.markdown("### 📊 Status Overview")
col1, col2, col3, col4 = st.columns(4)

with col1:
    status_card(
        "WAF (mitmproxy)",
        "Running" if waf_running else "Stopped",
        f"Port {waf_port}",
        "🛡️",
        "#10b981" if waf_running else "#ef4444"
    )

with col2:
    status_card(
        "Threats Today",
        f"{waf_threats:,}" if waf_threats else "0",
        f"{waf_blocked:,} blocked" if waf_blocked else "0 blocked",
        "⚠️",
        "#f59e0b" if waf_threats > 0 else "#10b981"
    )

with col3:
    status_card(
        "CrowdSec",
        "Running" if cs_running else "Stopped",
        f"{cs_decisions} active bans",
        "🚫",
        "#10b981" if cs_running else "#ef4444"
    )

with col4:
    status_card(
        "Firewall",
        "Active",
        "nftables",
        "🔥",
        "#10b981"
    )

st.markdown("---")

# Tabs for detailed views
tab1, tab2, tab3 = st.tabs(["🛡️ WAF Threats", "🚫 CrowdSec", "📈 Stats"])

with tab1:
    st.markdown("### Recent WAF Threats")

    threats = ubus.mitmproxy_threats(limit=30)

    if threats:
        # Summary
        st.markdown(f"Showing {len(threats)} most recent threats")

        # Headers
        col1, col2, col3, col4, col5 = st.columns([2, 3, 2, 1, 1])
        with col1:
            st.markdown("**Source IP**")
        with col2:
            st.markdown("**URL/Path**")
        with col3:
            st.markdown("**Category**")
        with col4:
            st.markdown("**Severity**")
        with col5:
            st.markdown("**Time**")

        st.markdown("---")

        for idx, threat in enumerate(threats):
            col1, col2, col3, col4, col5 = st.columns([2, 3, 2, 1, 1])

            with col1:
                ip = threat.get("ip", threat.get("source_ip", "unknown"))
                st.write(ip)

            with col2:
                url = threat.get("url", threat.get("path", threat.get("request", "")))
                # Truncate long URLs
                if len(url) > 50:
                    url = url[:47] + "..."
                st.write(url)

            with col3:
                category = threat.get("category", threat.get("type", "unknown"))
                st.write(category)

            with col4:
                severity = threat.get("severity", "low").lower()
                if severity == "critical":
                    st.markdown(badge("error", "CRIT"), unsafe_allow_html=True)
                elif severity == "high":
                    st.markdown(badge("warning", "HIGH"), unsafe_allow_html=True)
                elif severity == "medium":
                    st.markdown(badge("info", "MED"), unsafe_allow_html=True)
                else:
                    st.markdown(badge("success", "LOW"), unsafe_allow_html=True)

            with col5:
                timestamp = threat.get("timestamp", threat.get("time", ""))
                # Show just time portion if available
                if timestamp and " " in str(timestamp):
                    timestamp = str(timestamp).split(" ")[-1]
                st.caption(timestamp[:8] if timestamp else "-")
    else:
        st.success("✅ No recent threats detected")
        st.caption("The WAF is protecting your services. Check back later for threat activity.")

with tab2:
    st.markdown("### CrowdSec Security")

    # CrowdSec status details
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### Engine Status")
        st.markdown(f"- **Status**: {cs_state}")
        st.markdown(f"- **Active Decisions**: {cs_decisions}")
        st.markdown(f"- **Alerts Today**: {cs_alerts}")
        st.markdown(f"- **Bouncers**: {cs_bouncers}")

    with col2:
        st.markdown("#### Version Info")
        version = crowdsec.get("version", crowdsec.get("crowdsec_version", "N/A"))
        st.markdown(f"- **Version**: {version}")
        lapi = crowdsec.get("lapi_status", crowdsec.get("lapi", "N/A"))
        st.markdown(f"- **LAPI**: {lapi}")

    st.markdown("---")
    st.markdown("#### Active Decisions (Bans)")

    decisions = ubus.crowdsec_decisions(limit=30)

    if decisions:
        for decision in decisions:
            col1, col2, col3, col4 = st.columns([2, 3, 2, 1])

            with col1:
                value = decision.get("value", decision.get("ip", "unknown"))
                st.write(f"🚫 {value}")

            with col2:
                reason = decision.get("reason", decision.get("scenario", ""))
                st.write(reason)

            with col3:
                origin = decision.get("origin", decision.get("source", ""))
                st.caption(origin)

            with col4:
                duration = decision.get("duration", decision.get("remaining", ""))
                st.caption(duration)
    else:
        st.success("✅ No active bans")
        st.caption("All traffic is currently allowed through the firewall.")

with tab3:
    st.markdown("### Security Statistics")

    # Quick stats from available data
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### WAF Summary")
        st.metric("Threats Today", waf_threats)
        st.metric("Blocked Requests", waf_blocked)
        st.metric("Status", "🟢 Active" if waf_running else "🔴 Inactive")

    with col2:
        st.markdown("#### CrowdSec Summary")
        st.metric("Active Bans", cs_decisions)
        st.metric("Alerts Today", cs_alerts)
        st.metric("Status", "🟢 Active" if cs_running else "🔴 Inactive")

    st.markdown("---")

    # Raw data for debugging
    with st.expander("🔍 Raw Status Data", expanded=False):
        st.markdown("**mitmproxy response:**")
        st.json(mitmproxy)
        st.markdown("**crowdsec response:**")
        st.json(crowdsec)
