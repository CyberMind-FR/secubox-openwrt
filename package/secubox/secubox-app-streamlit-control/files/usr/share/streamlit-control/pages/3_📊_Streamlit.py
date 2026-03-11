"""
Streamlit Apps Manager - Phase 4
Deploy, manage, and expose Streamlit Forge applications
"""

import streamlit as st
import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu, can_write
from lib.widgets import page_header, badge, badges_html, auto_refresh_toggle

st.set_page_config(page_title="Streamlit Apps - SecuBox Control", page_icon="📊", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("Streamlit Apps", "Deploy and manage Streamlit Forge applications", "📊")

# Permission check
has_write = can_write()
if not has_write:
    st.info("👁️ View-only mode. Login as root for app management.")

# Auto-refresh
auto_refresh_toggle("streamlit_apps", intervals=[10, 30, 60])

# ==========================================
# One-Click Deploy Section (like metablogizer)
# ==========================================
if has_write:
    with st.expander("➕ **Create New App**", expanded=False):
        st.caption("Create a new Streamlit app from template or upload")

        col1, col2, col3 = st.columns([2, 2, 2])

        with col1:
            app_name = st.text_input(
                "App Name",
                placeholder="myapp",
                key="create_app_name",
                help="Lowercase letters, numbers, underscores only"
            )

        with col2:
            # Get available templates
            templates = ubus.streamlit_templates()
            template_names = [t.get("name", t) if isinstance(t, dict) else t for t in templates]
            if not template_names:
                template_names = ["basic", "dashboard", "data-viewer"]

            template = st.selectbox(
                "Template",
                options=template_names,
                key="create_template",
                help="Choose a starter template"
            )

        with col3:
            expose_domain = st.text_input(
                "Domain (optional)",
                placeholder="myapp.gk2.secubox.in",
                key="create_domain",
                help="Auto-expose with HAProxy + SSL"
            )

        # Create button
        if st.button("🚀 Create App", type="primary", key="create_btn"):
            if not app_name:
                st.error("App name is required")
            elif not re.match(r'^[a-z0-9_]+$', app_name):
                st.error("Name must be lowercase letters, numbers, and underscores only")
            else:
                with st.spinner(f"Creating {app_name}..."):
                    result = ubus.streamlit_create(app_name, template)

                    if result.get("success"):
                        st.success(f"App '{app_name}' created!")

                        # Auto-expose if domain provided
                        if expose_domain:
                            with st.spinner(f"Exposing at {expose_domain}..."):
                                expose_result = ubus.streamlit_expose(app_name, expose_domain)
                                if expose_result.get("success"):
                                    st.success(f"Exposed at https://{expose_domain}")
                                else:
                                    st.warning(f"Created but expose failed: {expose_result.get('error', 'Unknown')}")

                        st.rerun()
                    else:
                        st.error(f"Failed: {result.get('error', 'Unknown error')}")

st.markdown("---")

# ==========================================
# Apps List
# ==========================================

# Fetch apps
with st.spinner("Loading apps..."):
    apps = ubus.streamlit_list()

if not apps:
    st.info("No Streamlit apps configured.")
    if has_write:
        st.markdown("Use **Create New App** above to get started!")
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

    # Filter
    search = st.text_input("Filter apps", placeholder="Search by name...", key="app_search")
    if search:
        search_lower = search.lower()
        apps = [a for a in apps if search_lower in a.get("name", "").lower()]

    for idx, app in enumerate(apps):
        app_id = app.get("id", "") or app.get("name", "") or f"app_{idx}"
        name = app.get("name", "unknown")
        port = app.get("port", "")
        status = app.get("status", "stopped")
        domain = app.get("domain", "")
        enabled = app.get("enabled", "0")

        # Create unique key
        key_base = f"{idx}_{name}"
        is_running = status == "running"

        col1, col2, col3, col4, col5 = st.columns([3, 1, 1, 1, 2])

        with col1:
            st.markdown(f"**{name}**")
            if port:
                st.caption(f"Port: {port}")
            if domain:
                st.caption(f"🌐 {domain}")

        with col2:
            if is_running:
                st.markdown(badge("running"), unsafe_allow_html=True)
            else:
                st.markdown(badge("stopped"), unsafe_allow_html=True)

        with col3:
            if domain:
                st.markdown(badge("ssl_ok", "Exposed"), unsafe_allow_html=True)
            else:
                st.markdown(badge("private", "Private"), unsafe_allow_html=True)

        with col4:
            if is_running and port:
                st.link_button("🔗", f"http://192.168.255.1:{port}", help="Open app")
            elif is_running and domain:
                st.link_button("🔗", f"https://{domain}", help="Open app")

        with col5:
            if has_write:
                c1, c2, c3, c4 = st.columns(4)
                with c1:
                    if is_running:
                        if st.button("⏹️", key=f"stop_{key_base}", help="Stop"):
                            with st.spinner(f"Stopping {name}..."):
                                ubus.streamlit_stop(name)
                            st.rerun()
                    else:
                        if st.button("▶️", key=f"start_{key_base}", help="Start"):
                            with st.spinner(f"Starting {name}..."):
                                ubus.streamlit_start(name)
                            st.rerun()
                with c2:
                    if st.button("🔄", key=f"restart_{key_base}", help="Restart"):
                        with st.spinner(f"Restarting {name}..."):
                            ubus.streamlit_restart(name)
                        st.rerun()
                with c3:
                    if domain:
                        if st.button("🔒", key=f"hide_{key_base}", help="Hide"):
                            st.session_state[f"hide_{name}"] = True
                    else:
                        if st.button("🌐", key=f"expose_{key_base}", help="Expose"):
                            st.session_state[f"expose_{name}"] = True
                with c4:
                    if st.button("🗑️", key=f"del_{key_base}", help="Delete"):
                        st.session_state[f"confirm_delete_{name}"] = True
            else:
                st.caption("View only")

        # ==========================================
        # Modal Dialogs
        # ==========================================

        # Expose Modal
        if st.session_state.get(f"expose_{name}"):
            with st.container():
                st.markdown(f"##### 🌐 Expose: {name}")
                new_domain = st.text_input(
                    "Domain",
                    value=f"{name}.gk2.secubox.in",
                    key=f"expose_domain_{key_base}"
                )
                col_a, col_b = st.columns(2)
                with col_a:
                    if st.button("Cancel", key=f"expose_cancel_{key_base}"):
                        st.session_state[f"expose_{name}"] = False
                        st.rerun()
                with col_b:
                    if st.button("Expose", key=f"expose_confirm_{key_base}", type="primary"):
                        with st.spinner(f"Exposing at {new_domain}..."):
                            result = ubus.streamlit_expose(name, new_domain)
                        st.session_state[f"expose_{name}"] = False
                        if result.get("success"):
                            st.success(f"Exposed at https://{new_domain}")
                        else:
                            st.error(f"Failed: {result.get('error', 'Unknown')}")
                        st.rerun()

        # Hide Modal
        if st.session_state.get(f"hide_{name}"):
            st.warning(f"Remove public exposure for {name}?")
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("Cancel", key=f"hide_cancel_{key_base}"):
                    st.session_state[f"hide_{name}"] = False
                    st.rerun()
            with col_b:
                if st.button("Hide", key=f"hide_confirm_{key_base}", type="primary"):
                    with st.spinner(f"Hiding {name}..."):
                        result = ubus.streamlit_hide(name)
                    st.session_state[f"hide_{name}"] = False
                    if result.get("success"):
                        st.success("App is now private")
                    else:
                        st.error(f"Failed: {result.get('error', 'Unknown')}")
                    st.rerun()

        # Delete confirmation
        if st.session_state.get(f"confirm_delete_{name}"):
            st.error(f"⚠️ Delete {name}? This cannot be undone.")
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("Cancel", key=f"cancel_del_{key_base}"):
                    st.session_state[f"confirm_delete_{name}"] = False
                    st.rerun()
            with col_b:
                if st.button("Delete", key=f"confirm_del_{key_base}", type="primary"):
                    with st.spinner(f"Deleting {name}..."):
                        ubus.streamlit_delete(name)
                    st.session_state[f"confirm_delete_{name}"] = False
                    st.rerun()

        st.markdown("---")

# Footer
st.caption(f"Total apps: {len(apps)}")
