"""
Streamlit Apps Manager - Phase 3
Manage Streamlit Forge applications with auto-refresh
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu, can_write
from lib.widgets import page_header, badge, badges_html, auto_refresh_toggle

st.set_page_config(page_title="Streamlit Apps - SecuBox Control", page_icon="📊", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("Streamlit Apps", "Manage Streamlit Forge applications", "📊")

# Permission check
has_write = can_write()
if not has_write:
    st.info("👁️ View-only mode. Login as root for app management.")

# Auto-refresh
auto_refresh_toggle("streamlit_apps", intervals=[10, 30, 60])
st.markdown("---")

# Fetch apps
with st.spinner("Loading apps..."):
    apps = ubus.streamlit_list()

if not apps:
    st.info("No Streamlit apps configured.")

    if has_write:
        st.markdown("**Create apps using CLI:**")
        st.code("slforge create myapp", language="bash")
else:
    # Stats
    running = sum(1 for app in apps if app.get("status") == "running")
    total = len(apps)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Running", running)
    with col2:
        st.metric("Stopped", total - running)
    with col3:
        st.metric("Total", total)

    st.markdown("---")

    for idx, app in enumerate(apps):
        app_id = app.get("id", "") or f"app_{idx}"
        name = app.get("name", "unknown")
        port = app.get("port", "")
        status = app.get("status", "stopped")
        url = app.get("url", "")

        # Create unique key combining index and app_id
        key_base = f"{idx}_{app_id}"
        is_running = status == "running"

        col1, col2, col3, col4 = st.columns([3, 1, 1, 2])

        with col1:
            st.markdown(f"**{name}**")
            if port:
                st.caption(f"Port: {port}")

        with col2:
            if is_running:
                st.markdown(badge("running"), unsafe_allow_html=True)
            else:
                st.markdown(badge("stopped"), unsafe_allow_html=True)

        with col3:
            if is_running and url:
                st.link_button("🔗 Open", url)
            elif is_running and port:
                st.link_button("🔗 Open", f"http://192.168.255.1:{port}")

        with col4:
            if has_write:
                c1, c2, c3 = st.columns(3)
                with c1:
                    if is_running:
                        if st.button("⏹️", key=f"stop_{key_base}", help="Stop"):
                            with st.spinner(f"Stopping {name}..."):
                                ubus.call("luci.streamlit-forge", "stop", {"id": app_id})
                            st.rerun()
                    else:
                        if st.button("▶️", key=f"start_{key_base}", help="Start"):
                            with st.spinner(f"Starting {name}..."):
                                ubus.call("luci.streamlit-forge", "start", {"id": app_id})
                            st.rerun()
                with c2:
                    if st.button("🔄", key=f"restart_{key_base}", help="Restart"):
                        with st.spinner(f"Restarting {name}..."):
                            ubus.call("luci.streamlit-forge", "stop", {"id": app_id})
                            import time
                            time.sleep(1)
                            ubus.call("luci.streamlit-forge", "start", {"id": app_id})
                        st.rerun()
                with c3:
                    if st.button("🗑️", key=f"del_{key_base}", help="Delete"):
                        st.session_state[f"confirm_delete_{app_id}"] = True

                # Delete confirmation
                if st.session_state.get(f"confirm_delete_{app_id}"):
                    st.warning(f"Delete {name}? This cannot be undone.")
                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("Cancel", key=f"cancel_del_{key_base}"):
                            st.session_state[f"confirm_delete_{app_id}"] = False
                            st.rerun()
                    with col_b:
                        if st.button("Confirm Delete", key=f"confirm_del_{key_base}", type="primary"):
                            with st.spinner(f"Deleting {name}..."):
                                ubus.call("luci.streamlit-forge", "delete", {"id": app_id})
                            st.session_state[f"confirm_delete_{app_id}"] = False
                            st.rerun()
            else:
                st.caption("View only")

        st.markdown("---")

st.caption(f"Total apps: {len(apps)}")
