"""
Metabolizer CMS - Media Library
"""
import streamlit as st
from pathlib import Path
import subprocess
import os
import shutil

st.set_page_config(page_title="Media - Metabolizer", page_icon="🖼️", layout="wide")

# Paths
CONTENT_PATH = Path("/srv/metabolizer/content")
MEDIA_PATH = CONTENT_PATH / "images"

# Ensure directory exists
MEDIA_PATH.mkdir(parents=True, exist_ok=True)

st.title("🖼️ Media Library")

def git_commit_push(message):
    """Commit and push to Gitea"""
    os.chdir(CONTENT_PATH)
    subprocess.run(['git', 'add', '-A'], capture_output=True)
    subprocess.run(['git', 'commit', '-m', message], capture_output=True)
    subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True)

def get_media_files():
    """Get all media files"""
    files = []
    if MEDIA_PATH.exists():
        for ext in ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg']:
            files.extend(MEDIA_PATH.glob(ext))
            files.extend(MEDIA_PATH.glob(ext.upper()))
    return sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)

# Upload Section
st.subheader("📤 Upload")

uploaded_files = st.file_uploader(
    "Choose images",
    type=['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
    accept_multiple_files=True
)

if uploaded_files:
    for uploaded_file in uploaded_files:
        save_path = MEDIA_PATH / uploaded_file.name

        # Save file
        with open(save_path, 'wb') as f:
            f.write(uploaded_file.getbuffer())

        st.success(f"Uploaded: {uploaded_file.name}")

        # Show markdown code
        st.code(f"![{uploaded_file.name}](/images/{uploaded_file.name})")

    # Commit to git
    git_commit_push(f"Add {len(uploaded_files)} media files")
    st.rerun()

st.divider()

# Media Gallery
st.subheader("📁 Library")

media_files = get_media_files()

if not media_files:
    st.info("No media files yet. Upload some images above!")
else:
    st.write(f"**{len(media_files)} files**")

    # Display in grid
    cols = st.columns(4)

    for idx, media_file in enumerate(media_files):
        col = cols[idx % 4]

        with col:
            # Display image
            try:
                st.image(str(media_file), use_container_width=True)
            except:
                st.write(f"📄 {media_file.name}")

            # File info
            size = media_file.stat().st_size
            size_str = f"{size / 1024:.1f} KB" if size < 1024 * 1024 else f"{size / 1024 / 1024:.1f} MB"
            st.caption(f"{media_file.name} ({size_str})")

            # Copy markdown button
            markdown_code = f"![{media_file.name}](/images/{media_file.name})"

            col1, col2 = st.columns(2)
            with col1:
                if st.button("📋 Copy", key=f"copy_{media_file.name}"):
                    st.code(markdown_code)
                    st.info("Copy the code above")

            with col2:
                if st.button("🗑️", key=f"del_{media_file.name}"):
                    media_file.unlink()
                    git_commit_push(f"Delete: {media_file.name}")
                    st.rerun()

# Sync action
st.divider()
if st.button("🔄 Sync Media to Blog", use_container_width=True):
    with st.spinner("Syncing..."):
        result = subprocess.run(
            ['/usr/sbin/metabolizerctl', 'build'],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            st.success("Media synced to blog!")
        else:
            st.error("Sync failed")
