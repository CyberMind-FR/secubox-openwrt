"""
LXC Containers Manager - Phase 3
With auto-refresh, filtering, and permission-aware controls
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu, can_write
from lib.widgets import page_header, badge, auto_refresh_toggle, search_filter

st.set_page_config(page_title="Containers - SecuBox Control", page_icon="📦", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("Containers", "LXC container management", "📦")

# Permission check
has_write = can_write()
if not has_write:
    st.info("👁️ View-only mode. Login as root for container management.")

# Auto-refresh toggle
st.markdown("##### Controls")
col_refresh, col_search = st.columns([1, 2])

with col_refresh:
    auto_refresh_toggle("containers")

with col_search:
    search_query = st.text_input(
        "Filter",
        key="container_search",
        placeholder="Search by name...",
        label_visibility="collapsed"
    )

st.markdown("---")

# Fetch containers
with st.spinner("Loading containers..."):
    containers = ubus.lxc_list()

# Filter by search
if search_query:
    search_lower = search_query.lower()
    containers = [c for c in containers if search_lower in c.get("name", "").lower()]

# Sort by state (running first), then name
containers = sorted(containers, key=lambda x: (0 if x.get("state") == "RUNNING" else 1, x.get("name", "")))

# Stats
running = sum(1 for c in containers if c.get("state") == "RUNNING")
stopped = len(containers) - running

# Tabs for running vs stopped
tab_all, tab_running, tab_stopped = st.tabs([
    f"All ({len(containers)})",
    f"🟢 Running ({running})",
    f"⭕ Stopped ({stopped})"
])

def render_container_list(container_list, prefix=""):
    """Render list of containers with actions"""
    if not container_list:
        st.info("No containers match the filter")
        return

    for container in container_list:
        name = container.get("name", "unknown")
        state = container.get("state", "UNKNOWN")
        memory = container.get("memory", 0)
        ip = container.get("ip", "")

        is_running = state == "RUNNING"
        key_base = f"{prefix}_{name}"

        col1, col2, col3, col4 = st.columns([3, 1, 1, 2])

        with col1:
            st.markdown(f"**{name}**")
            if ip:
                st.caption(f"🌐 {ip}")

        with col2:
            if is_running:
                st.markdown(badge("running"), unsafe_allow_html=True)
            else:
                st.markdown(badge("stopped"), unsafe_allow_html=True)

        with col3:
            if memory:
                mem_mb = memory // 1024 // 1024
                if mem_mb > 0:
                    st.caption(f"💾 {mem_mb}MB")

        with col4:
            if has_write:
                c1, c2, c3 = st.columns(3)
                with c1:
                    if is_running:
                        if st.button("⏹️", key=f"stop_{key_base}", help="Stop"):
                            with st.spinner(f"Stopping {name}..."):
                                ubus.lxc_stop(name)
                            st.rerun()
                    else:
                        if st.button("▶️", key=f"start_{key_base}", help="Start", type="primary"):
                            with st.spinner(f"Starting {name}..."):
                                ubus.lxc_start(name)
                            st.rerun()
                with c2:
                    if st.button("🔄", key=f"restart_{key_base}", help="Restart", disabled=not is_running):
                        with st.spinner(f"Restarting {name}..."):
                            ubus.lxc_stop(name)
                            import time
                            time.sleep(1)
                            ubus.lxc_start(name)
                        st.rerun()
                with c3:
                    if st.button("ℹ️", key=f"info_{key_base}", help="Details"):
                        st.session_state[f"show_info_{name}"] = not st.session_state.get(f"show_info_{name}", False)
            else:
                # View only - just info button
                if st.button("ℹ️", key=f"info_{key_base}", help="Details"):
                    st.session_state[f"show_info_{name}"] = not st.session_state.get(f"show_info_{name}", False)

        # Info panel
        if st.session_state.get(f"show_info_{name}"):
            with st.container():
                st.markdown(f"##### 📋 {name} Details")

                # Show available info
                info_cols = st.columns(4)
                with info_cols[0]:
                    st.metric("State", state)
                with info_cols[1]:
                    mem_mb = memory // 1024 // 1024 if memory else 0
                    st.metric("Memory", f"{mem_mb}MB" if mem_mb else "N/A")
                with info_cols[2]:
                    st.metric("IP", ip or "N/A")
                with info_cols[3]:
                    autostart = container.get("autostart", "N/A")
                    st.metric("Autostart", autostart)

                # Raw data expander
                with st.expander("Raw Data", expanded=False):
                    st.json(container)

                if st.button("Close", key=f"close_info_{key_base}"):
                    st.session_state[f"show_info_{name}"] = False
                    st.rerun()

        st.markdown("---")


with tab_all:
    render_container_list(containers, "all")

with tab_running:
    running_containers = [c for c in containers if c.get("state") == "RUNNING"]
    render_container_list(running_containers, "running")

with tab_stopped:
    stopped_containers = [c for c in containers if c.get("state") != "RUNNING"]
    render_container_list(stopped_containers, "stopped")

# Summary stats at bottom
st.markdown("---")
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Running", running, delta=None)
with col2:
    st.metric("Stopped", stopped, delta=None)
with col3:
    st.metric("Total", len(containers), delta=None)
