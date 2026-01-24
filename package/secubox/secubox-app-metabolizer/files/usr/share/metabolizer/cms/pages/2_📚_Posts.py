"""
Metabolizer CMS - Post Management
"""
import streamlit as st
from pathlib import Path
import subprocess
import os

CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
POSTS_PATH = CONTENT_PATH / "_posts"
DRAFTS_PATH = CONTENT_PATH / "_drafts"

st.set_page_config(page_title="Posts", page_icon="📚", layout="wide")
st.title("📚 Post Management")

def parse_post(filepath):
    """Parse markdown file with frontmatter"""
    try:
        text = filepath.read_text()
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                meta = {}
                for line in parts[1].strip().split('\n'):
                    if ':' in line:
                        k, v = line.split(':', 1)
                        meta[k.strip()] = v.strip().strip('"')
                return meta, parts[2].strip()
    except:
        pass
    return {'title': filepath.stem}, ""

def git_commit(msg):
    subprocess.run(['git', 'add', '-A'], cwd=CONTENT_PATH, capture_output=True)
    subprocess.run(['git', 'commit', '-m', msg], cwd=CONTENT_PATH, capture_output=True)
    subprocess.run(['git', 'push'], cwd=CONTENT_PATH, capture_output=True)

# Tabs
tab1, tab2 = st.tabs(["📰 Published", "📝 Drafts"])

with tab1:
    if POSTS_PATH.exists():
        posts = sorted(POSTS_PATH.glob("*.md"), reverse=True)
        st.caption(f"{len(posts)} published posts")

        for post in posts:
            meta, body = parse_post(post)
            with st.expander(f"📄 {meta.get('title', post.stem)}"):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.caption(f"📅 {meta.get('date', 'Unknown')}")
                    st.markdown(body[:200] + "..." if len(body) > 200 else body)
                with col2:
                    if st.button("🗑️ Delete", key=f"del_{post.name}"):
                        post.unlink()
                        git_commit(f"Delete: {post.name}")
                        st.rerun()
                    if st.button("📥 Unpublish", key=f"unpub_{post.name}"):
                        DRAFTS_PATH.mkdir(exist_ok=True)
                        post.rename(DRAFTS_PATH / post.name)
                        git_commit(f"Unpublish: {post.name}")
                        st.rerun()
    else:
        st.info("No published posts")

with tab2:
    if DRAFTS_PATH.exists():
        drafts = sorted(DRAFTS_PATH.glob("*.md"), reverse=True)
        st.caption(f"{len(drafts)} drafts")

        for draft in drafts:
            meta, body = parse_post(draft)
            with st.expander(f"📝 {meta.get('title', draft.stem)}"):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.markdown(body[:200] + "..." if len(body) > 200 else body)
                with col2:
                    if st.button("📤 Publish", key=f"pub_{draft.name}"):
                        POSTS_PATH.mkdir(exist_ok=True)
                        draft.rename(POSTS_PATH / draft.name)
                        git_commit(f"Publish: {draft.name}")
                        st.rerun()
                    if st.button("🗑️ Delete", key=f"deld_{draft.name}"):
                        draft.unlink()
                        st.rerun()
    else:
        st.info("No drafts")

# Sync
st.divider()
col1, col2 = st.columns(2)
with col1:
    if st.button("🔄 Pull from Git", use_container_width=True):
        subprocess.run(['git', 'pull'], cwd=CONTENT_PATH, capture_output=True)
        st.success("Synced!")
        st.rerun()
with col2:
    if st.button("📤 Push to Git", use_container_width=True):
        git_commit("Update posts")
        st.success("Pushed!")
