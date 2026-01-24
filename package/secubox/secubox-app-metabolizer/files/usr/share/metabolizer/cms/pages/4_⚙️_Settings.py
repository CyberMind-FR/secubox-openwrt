"""
Metabolizer CMS - Settings
"""
import streamlit as st
import subprocess
import os
from pathlib import Path

CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
GITEA_URL = os.environ.get('GITEA_URL', 'http://192.168.255.1:3000')

st.set_page_config(page_title="Settings", page_icon="⚙️", layout="wide")
st.title("⚙️ Settings")

def run_git(args):
    try:
        r = subprocess.run(['git'] + args, cwd=CONTENT_PATH, capture_output=True, text=True)
        return r.returncode == 0, r.stdout, r.stderr
    except Exception as e:
        return False, "", str(e)

# Status
st.subheader("📊 Status")
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Gitea", "External", delta="Host :3000")
with col2:
    st.metric("Streamlit", "Running", delta="OK")
with col3:
    st.metric("Content", "Local", delta=str(CONTENT_PATH))

st.divider()

# Repository
st.subheader("📁 Content Repository")

col1, col2 = st.columns(2)

with col1:
    st.text_input("Content Path", value=str(CONTENT_PATH), disabled=True)

    if (CONTENT_PATH / ".git").exists():
        ok, out, _ = run_git(['remote', '-v'])
        if ok and out:
            remote = out.split('\n')[0].split()[1] if out else "None"
            st.text_input("Remote", value=remote, disabled=True)

        ok, out, _ = run_git(['branch', '--show-current'])
        st.text_input("Branch", value=out.strip() if ok else "unknown", disabled=True)

        st.success("✅ Git repository initialized")
    else:
        st.warning("⚠️ Not a git repository")

with col2:
    posts = len(list((CONTENT_PATH / "_posts").glob("*.md"))) if (CONTENT_PATH / "_posts").exists() else 0
    drafts = len(list((CONTENT_PATH / "_drafts").glob("*.md"))) if (CONTENT_PATH / "_drafts").exists() else 0
    images = len(list((CONTENT_PATH / "images").glob("*"))) if (CONTENT_PATH / "images").exists() else 0

    st.metric("Posts", posts)
    st.metric("Drafts", drafts)
    st.metric("Images", images)

st.divider()

# Git Operations
st.subheader("🔗 Git Operations")

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Pull", use_container_width=True):
        ok, out, err = run_git(['pull'])
        if ok:
            st.success("Pulled!")
        else:
            st.error(err or "Pull failed")

with col2:
    if st.button("📊 Status", use_container_width=True):
        ok, out, _ = run_git(['status', '--short'])
        if out:
            st.code(out)
        else:
            st.info("Working tree clean")

with col3:
    if st.button("📤 Push", use_container_width=True):
        run_git(['add', '-A'])
        run_git(['commit', '-m', 'Update from CMS'])
        ok, _, err = run_git(['push'])
        if ok:
            st.success("Pushed!")
        else:
            st.error(err or "Push failed")

st.divider()

# Initialize Repository
st.subheader("🆕 Initialize Repository")

with st.expander("Clone from Gitea"):
    repo_url = st.text_input("Repository URL", placeholder=f"{GITEA_URL}/user/blog-content.git")

    if st.button("Clone", use_container_width=True):
        if repo_url:
            with st.spinner("Cloning..."):
                if CONTENT_PATH.exists():
                    import shutil
                    shutil.rmtree(CONTENT_PATH, ignore_errors=True)
                CONTENT_PATH.parent.mkdir(parents=True, exist_ok=True)
                r = subprocess.run(['git', 'clone', repo_url, str(CONTENT_PATH)], capture_output=True, text=True)
                if r.returncode == 0:
                    st.success("Cloned!")
                    st.rerun()
                else:
                    st.error(r.stderr)
        else:
            st.warning("Enter URL")

with st.expander("Initialize New"):
    if st.button("Initialize Empty Repo", use_container_width=True):
        CONTENT_PATH.mkdir(parents=True, exist_ok=True)
        (CONTENT_PATH / "_posts").mkdir(exist_ok=True)
        (CONTENT_PATH / "_drafts").mkdir(exist_ok=True)
        (CONTENT_PATH / "images").mkdir(exist_ok=True)
        run_git(['init'])
        st.success("Initialized!")
        st.rerun()

st.divider()

# Debug
with st.expander("🔧 Debug"):
    st.json({
        "CONTENT_PATH": str(CONTENT_PATH),
        "GITEA_URL": GITEA_URL,
        "PATH": os.environ.get('PATH', ''),
        "git_exists": (CONTENT_PATH / ".git").exists(),
    })
