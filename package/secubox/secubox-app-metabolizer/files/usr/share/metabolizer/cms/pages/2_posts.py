"""
Metabolizer CMS - Post Management
"""
import streamlit as st
from pathlib import Path
from datetime import datetime
import subprocess
import yaml
import os

st.set_page_config(page_title="Posts - Metabolizer", page_icon="📚", layout="wide")

# Paths
CONTENT_PATH = Path("/srv/metabolizer/content")
POSTS_PATH = CONTENT_PATH / "_posts"
DRAFTS_PATH = CONTENT_PATH / "_drafts"

st.title("📚 Post Management")

def parse_frontmatter(filepath):
    """Parse YAML front matter from markdown file"""
    try:
        content = filepath.read_text()
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                fm = yaml.safe_load(parts[1])
                body = parts[2].strip()
                return fm, body
    except Exception as e:
        pass
    return {}, ""

def get_posts(path):
    """Get all posts from a directory"""
    posts = []
    if path.exists():
        for f in sorted(path.glob("*.md"), reverse=True):
            fm, body = parse_frontmatter(f)
            posts.append({
                'filename': f.name,
                'path': f,
                'title': fm.get('title', f.stem),
                'date': fm.get('date', ''),
                'categories': fm.get('categories', []),
                'tags': fm.get('tags', []),
                'excerpt': fm.get('excerpt', body[:150] + '...' if len(body) > 150 else body),
                'body': body
            })
    return posts

def git_commit_push(message):
    """Commit and push to Gitea"""
    os.chdir(CONTENT_PATH)
    subprocess.run(['git', 'add', '-A'], capture_output=True)
    subprocess.run(['git', 'commit', '-m', message], capture_output=True)
    subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True)

# Tabs for Published and Drafts
tab1, tab2 = st.tabs(["📰 Published", "📝 Drafts"])

with tab1:
    posts = get_posts(POSTS_PATH)

    if not posts:
        st.info("No published posts yet. Create your first post in the Editor!")
    else:
        st.write(f"**{len(posts)} published posts**")

        for post in posts:
            with st.expander(f"📄 {post['title']}", expanded=False):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.caption(f"📅 {post['date']}")
                    if post['categories']:
                        st.caption(f"📁 {', '.join(post['categories'])}")
                    if post['tags']:
                        st.caption(f"🏷️ {', '.join(post['tags'])}")
                    st.markdown(post['excerpt'])

                with col2:
                    if st.button("✏️ Edit", key=f"edit_{post['filename']}"):
                        # Load into editor
                        st.session_state.post_title = post['title']
                        st.session_state.post_content = post['body']
                        st.switch_page("pages/1_editor.py")

                    if st.button("🗑️ Delete", key=f"del_{post['filename']}"):
                        post['path'].unlink()
                        git_commit_push(f"Delete post: {post['title']}")
                        st.success(f"Deleted: {post['filename']}")
                        st.rerun()

                    if st.button("📥 Unpublish", key=f"unpub_{post['filename']}"):
                        # Move to drafts
                        new_path = DRAFTS_PATH / post['filename']
                        post['path'].rename(new_path)
                        git_commit_push(f"Unpublish: {post['title']}")
                        st.success(f"Moved to drafts")
                        st.rerun()

with tab2:
    drafts = get_posts(DRAFTS_PATH)

    if not drafts:
        st.info("No drafts. Save a draft from the Editor!")
    else:
        st.write(f"**{len(drafts)} drafts**")

        for draft in drafts:
            with st.expander(f"📝 {draft['title']}", expanded=False):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.caption(f"📅 {draft['date']}")
                    st.markdown(draft['excerpt'])

                with col2:
                    if st.button("✏️ Edit", key=f"edit_draft_{draft['filename']}"):
                        st.session_state.post_title = draft['title']
                        st.session_state.post_content = draft['body']
                        st.switch_page("pages/1_editor.py")

                    if st.button("📤 Publish", key=f"pub_{draft['filename']}"):
                        # Move to posts
                        new_path = POSTS_PATH / draft['filename']
                        draft['path'].rename(new_path)
                        git_commit_push(f"Publish: {draft['title']}")
                        st.success(f"Published!")
                        st.rerun()

                    if st.button("🗑️ Delete", key=f"del_draft_{draft['filename']}"):
                        draft['path'].unlink()
                        st.success(f"Deleted")
                        st.rerun()

# Build action
st.divider()
col1, col2 = st.columns(2)

with col1:
    if st.button("🔄 Sync from Git", use_container_width=True):
        with st.spinner("Syncing..."):
            result = subprocess.run(
                ['/usr/sbin/metabolizerctl', 'sync'],
                capture_output=True, text=True
            )
            st.success("Synced!")
            st.rerun()

with col2:
    if st.button("🏗️ Rebuild Blog", use_container_width=True):
        with st.spinner("Building..."):
            result = subprocess.run(
                ['/usr/sbin/metabolizerctl', 'build'],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                st.success("Build complete!")
            else:
                st.error("Build failed")
