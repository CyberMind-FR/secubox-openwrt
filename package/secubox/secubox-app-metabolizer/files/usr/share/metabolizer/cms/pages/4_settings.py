"""
Metabolizer CMS - Settings
"""
import streamlit as st
import subprocess
import json
import os
from pathlib import Path

st.set_page_config(page_title="Settings - Metabolizer", page_icon="⚙️", layout="wide")

st.title("⚙️ Settings")

# Paths
CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
GITEA_URL = os.environ.get('GITEA_URL', 'http://host.containers.internal:3000')

def git_command(args, cwd=None):
    """Run git command"""
    try:
        result = subprocess.run(
            ['git'] + args,
            cwd=cwd or CONTENT_PATH,
            capture_output=True, text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

# Pipeline Status
st.subheader("📊 Pipeline Status")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Gitea", "EXTERNAL", delta="Host")

with col2:
    st.metric("Streamlit", "RUNNING", delta="OK")

with col3:
    st.metric("HexoJS", "EXTERNAL", delta="Host")

st.divider()

# Content Repository
st.subheader("📁 Content Repository")

col1, col2 = st.columns(2)

with col1:
    st.text_input("Content Path", value=str(CONTENT_PATH), disabled=True)

    # Check if git repo exists
    if (CONTENT_PATH / '.git').exists():
        success, stdout, _ = git_command(['remote', '-v'])
        if success and stdout:
            remote = stdout.split('\n')[0] if stdout else "No remote"
            st.text_input("Remote", value=remote.split()[1] if '\t' in remote or ' ' in remote else remote, disabled=True)

        success, stdout, _ = git_command(['rev-parse', '--abbrev-ref', 'HEAD'])
        st.text_input("Branch", value=stdout.strip() if success else "unknown", disabled=True)
    else:
        st.warning("Content directory is not a git repository")

with col2:
    # Count posts
    posts_path = CONTENT_PATH / '_posts'
    post_count = len(list(posts_path.glob('*.md'))) if posts_path.exists() else 0
    st.metric("Posts", post_count)

    drafts_path = CONTENT_PATH / '_drafts'
    draft_count = len(list(drafts_path.glob('*.md'))) if drafts_path.exists() else 0
    st.metric("Drafts", draft_count)

# Git Operations
st.subheader("🔗 Git Operations")

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Pull Latest", use_container_width=True):
        with st.spinner("Pulling..."):
            success, stdout, stderr = git_command(['pull', 'origin', 'master'])
            if success:
                st.success("Pulled latest changes")
            else:
                st.error(f"Pull failed: {stderr}")

with col2:
    if st.button("📊 Git Status", use_container_width=True):
        success, stdout, stderr = git_command(['status', '--short'])
        if stdout:
            st.code(stdout)
        else:
            st.info("Working tree clean")

with col3:
    if st.button("📤 Push Changes", use_container_width=True):
        with st.spinner("Pushing..."):
            success, stdout, stderr = git_command(['push', 'origin', 'master'])
            if success:
                st.success("Pushed changes")
            else:
                st.error(f"Push failed: {stderr}")

st.divider()

# Initialize Repository
st.subheader("🆕 Initialize Content Repository")

with st.expander("Setup New Repository"):
    repo_url = st.text_input("Gitea Repository URL", placeholder="http://host:3000/user/blog-content.git")

    if st.button("Clone Repository", use_container_width=True):
        if repo_url:
            with st.spinner("Cloning..."):
                CONTENT_PATH.mkdir(parents=True, exist_ok=True)
                success, stdout, stderr = git_command(['clone', repo_url, str(CONTENT_PATH)], cwd='/srv')
                if success:
                    st.success("Repository cloned!")
                    st.rerun()
                else:
                    st.error(f"Clone failed: {stderr}")
        else:
            st.warning("Enter a repository URL")

st.divider()

# Environment Info
with st.expander("🔧 Debug: Environment"):
    st.json({
        "CONTENT_PATH": str(CONTENT_PATH),
        "GITEA_URL": GITEA_URL,
        "CWD": os.getcwd(),
        "PATH": os.environ.get('PATH', ''),
    })
