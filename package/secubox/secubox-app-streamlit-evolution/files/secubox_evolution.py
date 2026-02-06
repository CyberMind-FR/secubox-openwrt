#!/usr/bin/env python3
"""
SecuBox Evolution Dashboard
Interactive Streamlit landing page showing project evolution, history, WIP, TODO, and README
"""

import streamlit as st
import requests
import re
from datetime import datetime
from collections import Counter

# Page config
st.set_page_config(
    page_title="SecuBox Evolution",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark cyberpunk theme
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap');

    .stApp {
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
    }

    .main-header {
        background: linear-gradient(90deg, #00d4aa, #00a0ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .sub-header {
        color: #808090;
        text-align: center;
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }

    .metric-card {
        background: #12121a;
        border: 1px solid #2a2a3a;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.3s ease;
    }

    .metric-card:hover {
        border-color: #00d4aa;
        transform: translateY(-2px);
    }

    .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #00d4aa;
        font-family: 'JetBrains Mono', monospace;
    }

    .metric-label {
        color: #808090;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .milestone-card {
        background: #12121a;
        border-left: 4px solid #00d4aa;
        padding: 1rem 1.5rem;
        margin: 0.5rem 0;
        border-radius: 0 8px 8px 0;
    }

    .milestone-date {
        color: #00d4aa;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.85rem;
    }

    .milestone-title {
        color: #e0e0e0;
        font-weight: 600;
        margin: 0.3rem 0;
    }

    .tag {
        display: inline-block;
        background: #00d4aa22;
        color: #00d4aa;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        margin: 0.2rem;
        font-family: 'JetBrains Mono', monospace;
    }

    .tag-wip {
        background: #ff6b6b22;
        color: #ff6b6b;
    }

    .tag-todo {
        background: #ffa50022;
        color: #ffa500;
    }

    .search-highlight {
        background: #00d4aa44;
        padding: 0 2px;
        border-radius: 2px;
    }

    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background: #12121a;
        padding: 0.5rem;
        border-radius: 12px;
    }

    .stTabs [data-baseweb="tab"] {
        background: transparent;
        color: #808090;
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }

    .stTabs [aria-selected="true"] {
        background: #00d4aa22;
        color: #00d4aa;
    }

    div[data-testid="stExpander"] {
        background: #12121a;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
    }

    .timeline-item {
        border-left: 2px solid #2a2a3a;
        padding-left: 1.5rem;
        margin-left: 0.5rem;
        padding-bottom: 1.5rem;
        position: relative;
    }

    .timeline-item::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 0;
        width: 10px;
        height: 10px;
        background: #00d4aa;
        border-radius: 50%;
    }
</style>
""", unsafe_allow_html=True)

# GitHub raw URLs
GITHUB_BASE = "https://raw.githubusercontent.com/gkerma/secubox-openwrt/master"
FILES = {
    "HISTORY": f"{GITHUB_BASE}/.claude/HISTORY.md",
    "WIP": f"{GITHUB_BASE}/.claude/WIP.md",
    "TODO": f"{GITHUB_BASE}/.claude/TODO.md",
    "README": f"{GITHUB_BASE}/README.md"
}

@st.cache_data(ttl=300)
def fetch_file(url):
    """Fetch file content from GitHub"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.text
        return None
    except:
        return None

def parse_history(content):
    """Parse HISTORY.md to extract milestones"""
    if not content:
        return []

    milestones = []
    # Match patterns like "1. **Title (2026-02-06)**" or "14. **P2P MirrorBox..."
    pattern = r'(\d+)\.\s+\*\*([^*]+)\*\*'

    for match in re.finditer(pattern, content):
        num = match.group(1)
        title = match.group(2).strip()

        # Extract date if present
        date_match = re.search(r'\((\d{4}-\d{2}-\d{2})\)', title)
        date = date_match.group(1) if date_match else None
        title_clean = re.sub(r'\s*\(\d{4}-\d{2}-\d{2}\)\s*', '', title)

        milestones.append({
            'num': int(num),
            'title': title_clean,
            'date': date
        })

    return milestones

def parse_packages(content):
    """Extract package names from content"""
    if not content:
        return []

    packages = set()
    # Match `package-name` or secubox-app-xxx patterns
    patterns = [
        r'`(secubox-[a-z0-9-]+)`',
        r'`(luci-app-[a-z0-9-]+)`',
        r'\*\*([a-z0-9-]+)\*\*:',
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, content):
            pkg = match.group(1)
            if len(pkg) > 3:
                packages.add(pkg)

    return list(packages)

def count_features(content):
    """Count features mentioned in content"""
    if not content:
        return {}

    features = {
        'AI/LocalAI': len(re.findall(r'LocalAI|AI-powered|LLM|agent', content, re.I)),
        'Security': len(re.findall(r'CrowdSec|WAF|firewall|threat|CVE|security', content, re.I)),
        'DNS': len(re.findall(r'DNS|Vortex|dnsctl|AdGuard', content, re.I)),
        'Mesh/P2P': len(re.findall(r'mesh|P2P|gossip|mirror|peer', content, re.I)),
        'Containers': len(re.findall(r'LXC|Docker|container', content, re.I)),
        'UI/LuCI': len(re.findall(r'LuCI|dashboard|UI|interface', content, re.I)),
    }
    return features

def main():
    # Header
    st.markdown('<h1 class="main-header">🛡️ SecuBox Evolution</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Real-time project tracking • History • WIP • TODO • Documentation</p>', unsafe_allow_html=True)

    # Fetch all files
    with st.spinner("Fetching latest data from GitHub..."):
        history = fetch_file(FILES["HISTORY"])
        wip = fetch_file(FILES["WIP"])
        todo = fetch_file(FILES["TODO"])
        readme = fetch_file(FILES["README"])

    # Parse data
    milestones = parse_history(history)
    packages = parse_packages(history or "")
    features = count_features(history or "")

    # Metrics row
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{len(milestones)}</div>
            <div class="metric-label">Milestones</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{len(packages)}</div>
            <div class="metric-label">Packages</div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        # Count TODO items
        todo_count = len(re.findall(r'^- \[[ x]\]', todo or "", re.M))
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{todo_count}</div>
            <div class="metric-label">TODO Items</div>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        # Latest date
        latest_date = "N/A"
        for m in reversed(milestones):
            if m['date']:
                latest_date = m['date']
                break
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value" style="font-size: 1.5rem;">{latest_date}</div>
            <div class="metric-label">Last Update</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Sidebar
    with st.sidebar:
        st.markdown("### 🔍 Search")
        search_query = st.text_input("Search in all files", placeholder="e.g., CrowdSec, HAProxy...")

        st.markdown("### 📊 Feature Distribution")
        if features:
            for feat, count in sorted(features.items(), key=lambda x: -x[1]):
                if count > 0:
                    st.progress(min(count / 50, 1.0), text=f"{feat}: {count}")

        st.markdown("### 🏷️ Recent Packages")
        for pkg in packages[-10:]:
            st.markdown(f'<span class="tag">{pkg}</span>', unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("### ⚡ Quick Links")
        st.markdown("[GitHub Repository](https://github.com/gkerma/secubox-openwrt)")
        st.markdown("[SecuBox Portal](https://secubox.in)")

        if st.button("🔄 Refresh Data"):
            st.cache_data.clear()
            st.rerun()

    # Main tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs(["📜 History", "🔧 WIP", "📋 TODO", "📖 README", "📈 Timeline"])

    with tab1:
        st.markdown("## 📜 Project History")

        if search_query and history:
            # Highlight search results
            highlighted = history.replace(search_query, f'**:green[{search_query}]**')
            st.markdown(highlighted)
        elif history:
            # Show milestones as cards
            for m in reversed(milestones[-20:]):
                date_str = f"📅 {m['date']}" if m['date'] else ""
                st.markdown(f"""
                <div class="milestone-card">
                    <span class="milestone-date">{date_str}</span>
                    <div class="milestone-title">{m['num']}. {m['title']}</div>
                </div>
                """, unsafe_allow_html=True)

            with st.expander("📄 View Full History"):
                st.markdown(history)
        else:
            st.error("Could not fetch HISTORY.md")

    with tab2:
        st.markdown("## 🔧 Work In Progress")

        if search_query and wip:
            highlighted = wip.replace(search_query, f'**:orange[{search_query}]**')
            st.markdown(highlighted)
        elif wip:
            st.markdown(wip)
        else:
            st.error("Could not fetch WIP.md")

    with tab3:
        st.markdown("## 📋 TODO List")

        if search_query and todo:
            highlighted = todo.replace(search_query, f'**:yellow[{search_query}]**')
            st.markdown(highlighted)
        elif todo:
            # Parse and display TODO items
            lines = todo.split('\n')
            completed = 0
            pending = 0

            for line in lines:
                if re.match(r'^- \[x\]', line):
                    completed += 1
                elif re.match(r'^- \[ \]', line):
                    pending += 1

            col1, col2 = st.columns(2)
            with col1:
                st.metric("✅ Completed", completed)
            with col2:
                st.metric("⏳ Pending", pending)

            if completed + pending > 0:
                progress = completed / (completed + pending)
                st.progress(progress, text=f"Progress: {progress*100:.1f}%")

            st.markdown("---")
            st.markdown(todo)
        else:
            st.error("Could not fetch TODO.md")

    with tab4:
        st.markdown("## 📖 README")

        if search_query and readme:
            highlighted = readme.replace(search_query, f'**:blue[{search_query}]**')
            st.markdown(highlighted)
        elif readme:
            st.markdown(readme)
        else:
            st.error("Could not fetch README.md")

    with tab5:
        st.markdown("## 📈 Evolution Timeline")

        if milestones:
            # Group by month
            months = {}
            for m in milestones:
                if m['date']:
                    month = m['date'][:7]  # YYYY-MM
                    if month not in months:
                        months[month] = []
                    months[month].append(m)

            # Display timeline
            for month in sorted(months.keys(), reverse=True):
                items = months[month]
                month_name = datetime.strptime(month, "%Y-%m").strftime("%B %Y")

                st.markdown(f"### 📅 {month_name}")

                for item in items:
                    st.markdown(f"""
                    <div class="timeline-item">
                        <strong>{item['title']}</strong><br>
                        <small style="color: #808090;">Milestone #{item['num']}</small>
                    </div>
                    """, unsafe_allow_html=True)

            # Chart
            st.markdown("### 📊 Milestones per Month")
            month_counts = {m: len(items) for m, items in months.items()}
            if month_counts:
                import pandas as pd
                df = pd.DataFrame(list(month_counts.items()), columns=['Month', 'Count'])
                df = df.sort_values('Month')
                st.bar_chart(df.set_index('Month'))
        else:
            st.info("No dated milestones found in history")

    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #808090; padding: 1rem;">
        <small>
            SecuBox Evolution Dashboard • Auto-synced with GitHub master branch<br>
            Data refreshes every 5 minutes •
            <a href="https://github.com/gkerma/secubox-openwrt" style="color: #00d4aa;">View on GitHub</a>
        </small>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
