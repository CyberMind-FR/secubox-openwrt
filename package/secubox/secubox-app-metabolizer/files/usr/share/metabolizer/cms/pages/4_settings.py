"""
Metabolizer CMS - Settings
"""
import streamlit as st
import subprocess
import json

st.set_page_config(page_title="Settings - Metabolizer", page_icon="⚙️", layout="wide")

st.title("⚙️ Settings")

def get_status():
    """Get metabolizer status"""
    try:
        result = subprocess.run(
            ['/usr/sbin/metabolizerctl', 'status'],
            capture_output=True, text=True
        )
        return json.loads(result.stdout)
    except:
        return {}

def run_command(cmd):
    """Run metabolizerctl command"""
    result = subprocess.run(
        ['/usr/sbin/metabolizerctl'] + cmd,
        capture_output=True, text=True
    )
    return result.returncode == 0, result.stdout, result.stderr

# Get current status
status = get_status()

# Pipeline Status
st.subheader("📊 Pipeline Status")

col1, col2, col3 = st.columns(3)

with col1:
    gitea_status = status.get('gitea', {}).get('status', 'unknown')
    st.metric(
        "Gitea",
        gitea_status.upper(),
        delta="OK" if gitea_status == "running" else "DOWN"
    )

with col2:
    streamlit_status = status.get('streamlit', {}).get('status', 'unknown')
    st.metric(
        "Streamlit",
        streamlit_status.upper(),
        delta="OK" if streamlit_status == "running" else "DOWN"
    )

with col3:
    hexo_status = status.get('hexo', {}).get('status', 'unknown')
    st.metric(
        "HexoJS",
        hexo_status.upper(),
        delta="OK" if hexo_status == "running" else "DOWN"
    )

st.divider()

# Content Repository
st.subheader("📁 Content Repository")

content = status.get('content', {})
col1, col2 = st.columns(2)

with col1:
    st.text_input("Repository", value=content.get('repo', 'blog-content'), disabled=True)
    st.text_input("Path", value=content.get('path', '/srv/metabolizer/content'), disabled=True)

with col2:
    st.metric("Posts", content.get('post_count', 0))

# Git Operations
st.subheader("🔗 Git Operations")

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Pull Latest", use_container_width=True):
        with st.spinner("Pulling..."):
            success, stdout, stderr = run_command(['sync'])
            if success:
                st.success("Pulled latest changes")
            else:
                st.error(f"Pull failed: {stderr}")

with col2:
    if st.button("📊 Git Status", use_container_width=True):
        import os
        os.chdir("/srv/metabolizer/content")
        result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
        if result.stdout:
            st.code(result.stdout)
        else:
            st.info("Working tree clean")

with col3:
    github_url = st.text_input("Mirror from GitHub URL")
    if st.button("🔗 Mirror", use_container_width=True):
        if github_url:
            with st.spinner("Mirroring..."):
                success, stdout, stderr = run_command(['mirror', github_url])
                if success:
                    st.success(f"Mirrored: {stdout}")
                else:
                    st.error(f"Mirror failed: {stderr}")
        else:
            st.warning("Enter a GitHub URL")

st.divider()

# Portal Settings
st.subheader("🌐 Portal")

portal = status.get('portal', {})
col1, col2 = st.columns(2)

with col1:
    st.text_input("Blog URL", value=portal.get('url', 'http://router/blog/'), disabled=True)
    st.text_input("Static Path", value=portal.get('path', '/www/blog'), disabled=True)

with col2:
    if portal.get('enabled'):
        st.success("Portal Enabled")
        if st.button("🌐 View Blog", use_container_width=True):
            st.markdown(f"[Open Blog]({portal.get('url', '/blog/')})")
    else:
        st.warning("Portal Disabled")

st.divider()

# Build Actions
st.subheader("🏗️ Build Pipeline")

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🧹 Clean", use_container_width=True):
        with st.spinner("Cleaning..."):
            result = subprocess.run(
                ['/usr/sbin/hexoctl', 'clean'],
                capture_output=True, text=True
            )
            st.success("Cleaned build cache")

with col2:
    if st.button("🔨 Generate", use_container_width=True):
        with st.spinner("Generating..."):
            result = subprocess.run(
                ['/usr/sbin/hexoctl', 'generate'],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                st.success("Generated static site")
            else:
                st.error("Generation failed")

with col3:
    if st.button("📤 Publish", use_container_width=True):
        with st.spinner("Publishing..."):
            success, stdout, stderr = run_command(['publish'])
            if success:
                st.success("Published to portal")
            else:
                st.error(f"Publish failed: {stderr}")

# Full pipeline
if st.button("🚀 Full Pipeline (Clean → Generate → Publish)", use_container_width=True, type="primary"):
    with st.spinner("Running full pipeline..."):
        success, stdout, stderr = run_command(['build'])
        if success:
            st.success("Full pipeline complete!")
            st.balloons()
        else:
            st.error(f"Pipeline failed: {stderr}")

st.divider()

# Raw Status JSON
with st.expander("🔧 Debug: Raw Status"):
    st.json(status)
