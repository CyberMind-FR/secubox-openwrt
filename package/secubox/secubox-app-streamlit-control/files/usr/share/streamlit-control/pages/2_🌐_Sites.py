"""
Sites Manager - Metablogizer-style static site management
KISS design inspired by luci-app-metablogizer
"""

import streamlit as st
import sys
import os
import base64
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu
from lib.widgets import (
    page_header, badge, badges_html, status_card,
    health_check_panel, qr_code_image, share_buttons
)

st.set_page_config(
    page_title="Sites - SecuBox Control",
    page_icon="🌐",
    layout="wide"
)

# Require authentication
ubus = require_auth()

# Sidebar
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

# Page header
page_header("Sites", "Static site publisher with HAProxy vhosts and SSL", "🌐")

# ==========================================
# One-Click Deploy Section
# ==========================================

with st.expander("➕ **One-Click Deploy**", expanded=True):
    st.caption("Upload HTML/ZIP to create a new static site with auto-configured SSL")

    col1, col2, col3 = st.columns([1, 2, 2])

    with col1:
        deploy_name = st.text_input(
            "Site Name",
            placeholder="myblog",
            key="deploy_name",
            help="Lowercase letters, numbers, hyphens only"
        )

    with col2:
        deploy_domain = st.text_input(
            "Domain",
            placeholder="blog.gk2.secubox.in",
            key="deploy_domain"
        )

    with col3:
        deploy_file = st.file_uploader(
            "Content (optional)",
            type=["html", "htm", "zip"],
            key="deploy_file",
            help="HTML file or ZIP archive"
        )

    if st.button("🚀 Deploy", type="primary", key="deploy_btn"):
        if not deploy_name:
            st.error("Site name is required")
        elif not deploy_domain:
            st.error("Domain is required")
        else:
            # Validate name
            import re
            if not re.match(r'^[a-z0-9-]+$', deploy_name):
                st.error("Name must be lowercase letters, numbers, and hyphens only")
            else:
                with st.spinner("Creating site and configuring HAProxy..."):
                    # Create site
                    result = ubus.metablogizer_create_site(
                        name=deploy_name,
                        domain=deploy_domain
                    )

                    if result.get("success"):
                        site_id = result.get("id", f"site_{deploy_name}")

                        # Upload file if provided
                        if deploy_file:
                            content = base64.b64encode(deploy_file.read()).decode()
                            is_zip = deploy_file.name.lower().endswith('.zip')
                            ubus.metablogizer_upload_file(site_id, "index.html", content)

                        st.success(f"Site created: {deploy_domain}")
                        st.rerun()
                    else:
                        st.error(f"Failed: {result.get('error', 'Unknown error')}")

st.markdown("---")

# ==========================================
# Sites Table
# ==========================================

st.markdown("### 📋 Sites")

# Fetch sites data
with st.spinner("Loading sites..."):
    sites = ubus.metablogizer_list_sites()
    exposure = ubus.metablogizer_exposure_status()

# Build exposure map
exposure_map = {e.get("id"): e for e in exposure}

if not sites:
    st.info("No sites configured. Use One-Click Deploy above to create your first site.")
else:
    # Sites table
    for site in sites:
        site_id = site.get("id", "")
        name = site.get("name", "unknown")
        domain = site.get("domain", "")
        port = site.get("port", "")
        enabled = site.get("enabled", "1")

        exp = exposure_map.get(site_id, {})
        backend_running = exp.get("backend_running", False)
        vhost_exists = exp.get("vhost_exists", False)
        cert_status = exp.get("cert_status", "")
        auth_required = exp.get("auth_required", False)
        emancipated = exp.get("emancipated", False)
        has_content = exp.get("has_content", True)
        waf_enabled = site.get("waf_enabled", False)

        # Create expandable row for each site
        with st.container():
            col1, col2, col3, col4 = st.columns([3, 2, 2, 3])

            # Site info column
            with col1:
                st.markdown(f"**{name}**")
                if domain:
                    st.markdown(f"[{domain}](https://{domain})")
                if port:
                    st.caption(f"Port: {port}")

            # Status column
            with col2:
                badges = []
                if backend_running:
                    badges.append(badge("running"))
                else:
                    badges.append(badge("stopped"))
                if not has_content:
                    badges.append(badge("empty", "Empty"))
                st.markdown(badges_html(*badges), unsafe_allow_html=True)

            # Exposure column
            with col3:
                badges = []
                if vhost_exists and cert_status == "valid":
                    badges.append(badge("ssl_ok"))
                elif vhost_exists and cert_status == "warning":
                    badges.append(badge("ssl_warn"))
                elif vhost_exists:
                    badges.append(badge("ssl_none"))
                else:
                    badges.append(badge("private"))
                if auth_required:
                    badges.append(badge("auth"))
                if waf_enabled:
                    badges.append(badge("waf"))
                st.markdown(badges_html(*badges), unsafe_allow_html=True)

            # Actions column
            with col4:
                btn_col1, btn_col2, btn_col3, btn_col4, btn_col5 = st.columns(5)

                with btn_col1:
                    if st.button("📝", key=f"edit_{site_id}", help="Edit"):
                        st.session_state[f"edit_site_{site_id}"] = True

                with btn_col2:
                    if st.button("📤", key=f"share_{site_id}", help="Share"):
                        st.session_state[f"share_site_{site_id}"] = True

                with btn_col3:
                    if emancipated:
                        if st.button("🔒", key=f"unpub_{site_id}", help="Unpublish"):
                            st.session_state[f"unpublish_{site_id}"] = True
                    else:
                        if st.button("🌐", key=f"expose_{site_id}", help="Expose"):
                            st.session_state[f"expose_{site_id}"] = True

                with btn_col4:
                    if st.button("💊", key=f"health_{site_id}", help="Health"):
                        st.session_state[f"health_{site_id}"] = True

                with btn_col5:
                    if st.button("🗑️", key=f"del_{site_id}", help="Delete"):
                        st.session_state[f"delete_{site_id}"] = True

            st.markdown("---")

            # ==========================================
            # Modal Dialogs (using session state)
            # ==========================================

            # Edit Modal
            if st.session_state.get(f"edit_site_{site_id}"):
                with st.expander(f"✏️ Edit: {name}", expanded=True):
                    edit_name = st.text_input("Name", value=name, key=f"edit_name_{site_id}")
                    edit_domain = st.text_input("Domain", value=domain, key=f"edit_domain_{site_id}")
                    edit_desc = st.text_input("Description", value=site.get("description", ""), key=f"edit_desc_{site_id}")
                    edit_enabled = st.checkbox("Enabled", value=enabled != "0", key=f"edit_enabled_{site_id}")

                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("Cancel", key=f"edit_cancel_{site_id}"):
                            st.session_state[f"edit_site_{site_id}"] = False
                            st.rerun()
                    with col_b:
                        if st.button("Save", key=f"edit_save_{site_id}", type="primary"):
                            with st.spinner("Saving..."):
                                result = ubus.call("luci.metablogizer", "update_site", {
                                    "id": site_id,
                                    "name": edit_name,
                                    "domain": edit_domain,
                                    "description": edit_desc,
                                    "enabled": "1" if edit_enabled else "0"
                                })
                            st.session_state[f"edit_site_{site_id}"] = False
                            st.success("Site updated")
                            st.rerun()

            # Share Modal
            if st.session_state.get(f"share_site_{site_id}") and domain:
                with st.expander(f"📤 Share: {name}", expanded=True):
                    url = f"https://{domain}"
                    st.text_input("URL", value=url, disabled=True, key=f"share_url_{site_id}")

                    col_a, col_b = st.columns([1, 2])
                    with col_a:
                        qr_code_image(url, size=150)
                    with col_b:
                        st.markdown("**Share via:**")
                        share_buttons(url, name)

                    col_c, col_d = st.columns(2)
                    with col_c:
                        st.link_button("🔗 Visit Site", url, use_container_width=True)
                    with col_d:
                        if st.button("Close", key=f"share_close_{site_id}"):
                            st.session_state[f"share_site_{site_id}"] = False
                            st.rerun()

            # Expose Modal
            if st.session_state.get(f"expose_{site_id}"):
                with st.expander(f"🌐 Expose: {name}", expanded=True):
                    st.markdown("This will configure:")
                    st.markdown(f"- HAProxy vhost for **{domain}**")
                    st.markdown("- ACME SSL certificate")
                    st.markdown("- DNS + Vortex mesh publication")

                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("Cancel", key=f"expose_cancel_{site_id}"):
                            st.session_state[f"expose_{site_id}"] = False
                            st.rerun()
                    with col_b:
                        if st.button("🚀 Expose", key=f"expose_confirm_{site_id}", type="primary"):
                            st.session_state[f"expose_{site_id}"] = False

                            # Start emancipation
                            progress_placeholder = st.empty()
                            output_placeholder = st.empty()

                            progress_placeholder.info("Starting exposure workflow...")

                            result = ubus.metablogizer_emancipate(site_id)
                            if result.get("success"):
                                job_id = result.get("job_id")

                                # Poll for completion
                                for i in range(60):  # Max 2 minutes
                                    time.sleep(2)
                                    status = ubus.metablogizer_emancipate_status(job_id)

                                    if status.get("output"):
                                        output_placeholder.code(status["output"])

                                    if status.get("complete"):
                                        if status.get("status") == "success":
                                            st.success("Site exposed successfully!")
                                        else:
                                            st.error("Exposure failed")
                                        break

                                    progress_placeholder.info(f"Working... ({i*2}s)")

                            else:
                                st.error(f"Failed: {result.get('error', 'Unknown')}")

                            st.rerun()

            # Unpublish Modal
            if st.session_state.get(f"unpublish_{site_id}"):
                with st.expander(f"🔒 Unpublish: {name}", expanded=True):
                    st.warning("Remove public exposure? The site content will be preserved.")

                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("Cancel", key=f"unpub_cancel_{site_id}"):
                            st.session_state[f"unpublish_{site_id}"] = False
                            st.rerun()
                    with col_b:
                        if st.button("Unpublish", key=f"unpub_confirm_{site_id}", type="primary"):
                            with st.spinner("Unpublishing..."):
                                result = ubus.metablogizer_unpublish(site_id)
                            st.session_state[f"unpublish_{site_id}"] = False
                            if result.get("success"):
                                st.success("Site unpublished")
                            else:
                                st.error(f"Failed: {result.get('error', 'Unknown')}")
                            st.rerun()

            # Health Check Modal
            if st.session_state.get(f"health_{site_id}"):
                with st.expander(f"💊 Health: {name}", expanded=True):
                    with st.spinner("Checking health..."):
                        health = ubus.metablogizer_health_check(site_id)

                    health_check_panel(health)

                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("Close", key=f"health_close_{site_id}"):
                            st.session_state[f"health_{site_id}"] = False
                            st.rerun()
                    with col_b:
                        if st.button("🔧 Repair", key=f"health_repair_{site_id}", type="primary"):
                            with st.spinner("Repairing..."):
                                repair_result = ubus.metablogizer_repair(site_id)
                            if repair_result.get("success"):
                                st.success(f"Repairs: {repair_result.get('repairs', 'done')}")
                            else:
                                st.error(f"Failed: {repair_result.get('error', 'Unknown')}")
                            st.rerun()

            # Delete Modal
            if st.session_state.get(f"delete_{site_id}"):
                with st.expander(f"🗑️ Delete: {name}", expanded=True):
                    st.error("⚠️ This will remove the site, HAProxy vhost, and all files!")

                    delete_confirm = st.text_input(
                        f"Type '{name}' to confirm deletion:",
                        key=f"delete_confirm_{site_id}"
                    )

                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("Cancel", key=f"del_cancel_{site_id}"):
                            st.session_state[f"delete_{site_id}"] = False
                            st.rerun()
                    with col_b:
                        if st.button("Delete", key=f"del_confirm_{site_id}", type="primary",
                                    disabled=delete_confirm != name):
                            with st.spinner("Deleting..."):
                                result = ubus.metablogizer_delete_site(site_id)
                            st.session_state[f"delete_{site_id}"] = False
                            if result.get("success"):
                                st.success("Site deleted")
                            else:
                                st.error(f"Failed: {result.get('error', 'Unknown')}")
                            st.rerun()

# Footer
st.markdown("---")
st.caption(f"Total sites: {len(sites)}")
