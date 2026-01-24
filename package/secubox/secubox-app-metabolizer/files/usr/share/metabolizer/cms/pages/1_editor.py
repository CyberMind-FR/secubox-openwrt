"""
Metabolizer CMS - Markdown Editor with Live Preview
"""
import streamlit as st
from datetime import datetime
from pathlib import Path
import subprocess
import yaml
import os

st.set_page_config(page_title="Editor - Metabolizer", page_icon="✏️", layout="wide")

# Paths
CONTENT_PATH = Path("/srv/metabolizer/content")
POSTS_PATH = CONTENT_PATH / "_posts"
DRAFTS_PATH = CONTENT_PATH / "_drafts"

# Ensure directories exist
POSTS_PATH.mkdir(parents=True, exist_ok=True)
DRAFTS_PATH.mkdir(parents=True, exist_ok=True)

st.title("✏️ Post Editor")

# Initialize session state
if 'post_content' not in st.session_state:
    st.session_state.post_content = ""
if 'post_title' not in st.session_state:
    st.session_state.post_title = ""

# Two-column layout: Editor | Preview
col_edit, col_preview = st.columns(2)

with col_edit:
    st.subheader("Editor")

    # Front Matter Section
    with st.expander("📋 Front Matter", expanded=True):
        title = st.text_input("Title", value=st.session_state.post_title, key="title_input")

        col1, col2 = st.columns(2)
        with col1:
            date = st.date_input("Date", value=datetime.now())
        with col2:
            time = st.time_input("Time", value=datetime.now().time())

        categories = st.multiselect(
            "Categories",
            ["Security", "Tutorial", "News", "Tech", "Review", "Guide"],
            default=[]
        )

        tags = st.text_input("Tags (comma-separated)", placeholder="linux, security, howto")

        excerpt = st.text_area("Excerpt", height=60, placeholder="Brief summary of the post...")

    # Markdown Content
    st.markdown("**Content (Markdown)**")
    content = st.text_area(
        "content",
        value=st.session_state.post_content,
        height=400,
        placeholder="""Write your post in Markdown...

## Heading

Regular paragraph with **bold** and *italic* text.

```python
# Code block
print("Hello, World!")
```

- List item 1
- List item 2

> Blockquote

[Link text](https://example.com)

![Image alt](/images/example.jpg)
""",
        label_visibility="collapsed"
    )

    # Update session state
    st.session_state.post_content = content
    st.session_state.post_title = title

with col_preview:
    st.subheader("Preview")

    if title:
        st.markdown(f"# {title}")
        st.caption(f"📅 {date} | 🏷️ {', '.join(categories) if categories else 'Uncategorized'}")
        if excerpt:
            st.info(excerpt)
        st.divider()

    if content:
        st.markdown(content)
    else:
        st.markdown("*Start typing to see preview...*")

# Actions
st.divider()
col1, col2, col3, col4 = st.columns(4)

def generate_filename(title, date):
    """Generate Hexo-compatible filename"""
    slug = title.lower().replace(" ", "-").replace("'", "")
    slug = "".join(c for c in slug if c.isalnum() or c == "-")
    return f"{date}-{slug}.md"

def generate_frontmatter(title, date, time, categories, tags, excerpt):
    """Generate YAML front matter"""
    fm = {
        'title': title,
        'date': f"{date} {time.strftime('%H:%M:%S')}",
        'categories': categories,
        'tags': [t.strip() for t in tags.split(",")] if tags else [],
    }
    if excerpt:
        fm['excerpt'] = excerpt
    return "---\n" + yaml.dump(fm, default_flow_style=False) + "---\n\n"

def save_post(path, title, date, time, categories, tags, excerpt, content):
    """Save post to file"""
    filename = generate_filename(title, date)
    filepath = path / filename

    frontmatter = generate_frontmatter(title, date, time, categories, tags, excerpt)
    full_content = frontmatter + content

    filepath.write_text(full_content)
    return filepath

def git_commit_push(message):
    """Commit and push to Gitea"""
    os.chdir(CONTENT_PATH)
    subprocess.run(['git', 'add', '-A'], capture_output=True)
    subprocess.run(['git', 'commit', '-m', message], capture_output=True)
    subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True)

with col1:
    if st.button("💾 Save Draft", use_container_width=True):
        if title and content:
            filepath = save_post(DRAFTS_PATH, title, date, time, categories, tags, excerpt, content)
            st.success(f"Draft saved: {filepath.name}")
        else:
            st.error("Title and content required")

with col2:
    if st.button("📤 Publish", use_container_width=True, type="primary"):
        if title and content:
            filepath = save_post(POSTS_PATH, title, date, time, categories, tags, excerpt, content)

            # Commit and push
            with st.spinner("Publishing..."):
                git_commit_push(f"Add post: {title}")

            st.success(f"Published: {filepath.name}")
            st.info("Webhook will trigger rebuild automatically")
        else:
            st.error("Title and content required")

with col3:
    if st.button("🔄 Build Now", use_container_width=True):
        with st.spinner("Building..."):
            result = subprocess.run(
                ['/usr/sbin/metabolizerctl', 'build'],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                st.success("Build complete!")
            else:
                st.error(f"Build failed")

with col4:
    if st.button("🗑️ Clear", use_container_width=True):
        st.session_state.post_content = ""
        st.session_state.post_title = ""
        st.rerun()
