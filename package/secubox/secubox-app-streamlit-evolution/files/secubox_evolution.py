#!/usr/bin/env python3
"""
SecuBox Evolution Dashboard
Interactive Streamlit landing page showing project evolution, history, WIP, TODO, and README
Real-time GitHub commits integration for development status tracking
"""

import streamlit as st
import requests
import re
from datetime import datetime, timedelta
from collections import Counter
import time

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

    .commit-card {
        background: #12121a;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
        transition: all 0.3s ease;
    }

    .commit-card:hover {
        border-color: #00a0ff;
        transform: translateX(4px);
    }

    .commit-hash {
        font-family: 'JetBrains Mono', monospace;
        color: #00a0ff;
        font-size: 0.85rem;
        background: #00a0ff22;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        display: inline-block;
    }

    .commit-message {
        color: #e0e0e0;
        font-weight: 500;
        margin: 0.5rem 0;
        word-break: break-word;
    }

    .commit-meta {
        color: #808090;
        font-size: 0.8rem;
    }

    .commit-author {
        color: #00d4aa;
    }

    .commit-time {
        color: #ffa500;
    }

    .live-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #00d4aa;
        font-size: 0.85rem;
    }

    .live-dot {
        width: 8px;
        height: 8px;
        background: #00d4aa;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
    }

    .devel-status {
        background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%);
        border: 1px solid #2a2a3a;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }

    .devel-title {
        color: #00a0ff;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .commit-type-feat { border-left: 3px solid #00d4aa; }
    .commit-type-fix { border-left: 3px solid #ff6b6b; }
    .commit-type-docs { border-left: 3px solid #ffa500; }
    .commit-type-refactor { border-left: 3px solid #a855f7; }
    .commit-type-chore { border-left: 3px solid #808090; }
</style>
""", unsafe_allow_html=True)

# GitHub raw URLs
GITHUB_BASE = "https://raw.githubusercontent.com/gkerma/secubox-openwrt/master"
GITHUB_API = "https://api.github.com/repos/gkerma/secubox-openwrt"
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

@st.cache_data(ttl=60)  # 1-minute cache for near real-time updates
def fetch_commits(limit=30):
    """Fetch recent commits from GitHub API"""
    try:
        response = requests.get(
            f"{GITHUB_API}/commits",
            params={"per_page": limit},
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []

@st.cache_data(ttl=60)
def fetch_repo_info():
    """Fetch repository information"""
    try:
        response = requests.get(
            GITHUB_API,
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        return {}
    except:
        return {}

def parse_commit_type(message):
    """Extract commit type from conventional commit message"""
    patterns = {
        'feat': r'^feat(\([^)]+\))?:',
        'fix': r'^fix(\([^)]+\))?:',
        'docs': r'^docs(\([^)]+\))?:',
        'refactor': r'^refactor(\([^)]+\))?:',
        'chore': r'^chore(\([^)]+\))?:',
        'test': r'^test(\([^)]+\))?:',
        'style': r'^style(\([^)]+\))?:',
        'perf': r'^perf(\([^)]+\))?:',
    }
    for ctype, pattern in patterns.items():
        if re.match(pattern, message, re.I):
            return ctype
    return 'other'

def format_time_ago(iso_date):
    """Convert ISO date to human-readable 'time ago' format"""
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo)
        diff = now - dt

        if diff.days > 30:
            return dt.strftime("%b %d, %Y")
        elif diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60}m ago"
        else:
            return "just now"
    except:
        return iso_date[:10]

def get_commit_stats(commits):
    """Calculate commit statistics"""
    if not commits:
        return {}

    stats = {
        'total': len(commits),
        'types': Counter(),
        'authors': Counter(),
        'today': 0,
        'this_week': 0,
    }

    now = datetime.now()
    for c in commits:
        commit = c.get('commit', {})
        message = commit.get('message', '').split('\n')[0]
        stats['types'][parse_commit_type(message)] += 1

        author = commit.get('author', {}).get('name', 'Unknown')
        stats['authors'][author] += 1

        try:
            date_str = commit.get('author', {}).get('date', '')
            if date_str:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                days_ago = (now - dt.replace(tzinfo=None)).days
                if days_ago == 0:
                    stats['today'] += 1
                if days_ago < 7:
                    stats['this_week'] += 1
        except:
            pass

    return stats

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
    st.markdown('<p class="sub-header">Live GitHub commits • History • WIP • TODO • Documentation</p>', unsafe_allow_html=True)

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

        st.markdown("---")
        st.markdown("### 🚀 Devel Status")
        st.markdown('<span class="live-indicator"><span class="live-dot"></span> Live</span>', unsafe_allow_html=True)

        if st.button("🔄 Refresh Data"):
            st.cache_data.clear()
            st.rerun()

    # Fetch commits for devel status
    commits = fetch_commits(30)
    commit_stats = get_commit_stats(commits)
    repo_info = fetch_repo_info()

    # Main tabs
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["🚀 Devel", "📜 History", "🔧 WIP", "📋 TODO", "📖 README", "📈 Timeline"])

    with tab1:
        st.markdown("## 🚀 Development Status")

        # Live indicator
        st.markdown("""
        <div class="live-indicator">
            <span class="live-dot"></span>
            Live GitHub Activity • Updates every minute
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Dev metrics row
        dcol1, dcol2, dcol3, dcol4 = st.columns(4)

        with dcol1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: #00a0ff;">{commit_stats.get('today', 0)}</div>
                <div class="metric-label">Commits Today</div>
            </div>
            """, unsafe_allow_html=True)

        with dcol2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: #a855f7;">{commit_stats.get('this_week', 0)}</div>
                <div class="metric-label">This Week</div>
            </div>
            """, unsafe_allow_html=True)

        with dcol3:
            contributors = len(commit_stats.get('authors', {}))
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: #ffa500;">{contributors}</div>
                <div class="metric-label">Contributors</div>
            </div>
            """, unsafe_allow_html=True)

        with dcol4:
            stars = repo_info.get('stargazers_count', 0)
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: #ffd700;">⭐ {stars}</div>
                <div class="metric-label">GitHub Stars</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Commit type distribution
        if commit_stats.get('types'):
            st.markdown("### 📊 Commit Types")
            type_colors = {
                'feat': '🟢', 'fix': '🔴', 'docs': '🟡',
                'refactor': '🟣', 'chore': '⚪', 'other': '⚫',
                'test': '🔵', 'style': '🟠', 'perf': '💜'
            }
            type_cols = st.columns(len(commit_stats['types']))
            for i, (ctype, count) in enumerate(sorted(commit_stats['types'].items(), key=lambda x: -x[1])):
                with type_cols[i % len(type_cols)]:
                    emoji = type_colors.get(ctype, '⚫')
                    st.metric(f"{emoji} {ctype}", count)

        st.markdown("---")

        # Recent commits list
        st.markdown("### 📝 Recent Commits")

        if commits:
            for c in commits[:15]:
                sha = c.get('sha', '')[:7]
                commit = c.get('commit', {})
                message = commit.get('message', '').split('\n')[0][:80]
                author = commit.get('author', {}).get('name', 'Unknown')
                date_str = commit.get('author', {}).get('date', '')
                time_ago = format_time_ago(date_str)
                url = c.get('html_url', '#')

                # Determine commit type for styling
                ctype = parse_commit_type(message)
                type_class = f"commit-type-{ctype}" if ctype != 'other' else ''

                st.markdown(f"""
                <div class="commit-card {type_class}">
                    <a href="{url}" target="_blank" style="text-decoration: none;">
                        <span class="commit-hash">{sha}</span>
                    </a>
                    <div class="commit-message">{message}</div>
                    <div class="commit-meta">
                        <span class="commit-author">👤 {author}</span>
                        &nbsp;•&nbsp;
                        <span class="commit-time">🕐 {time_ago}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            # Show more button
            with st.expander("📜 View All Commits (30)"):
                for c in commits[15:]:
                    sha = c.get('sha', '')[:7]
                    commit = c.get('commit', {})
                    message = commit.get('message', '').split('\n')[0][:80]
                    author = commit.get('author', {}).get('name', 'Unknown')
                    date_str = commit.get('author', {}).get('date', '')
                    time_ago = format_time_ago(date_str)

                    st.markdown(f"""
                    <div class="commit-card">
                        <span class="commit-hash">{sha}</span>
                        <div class="commit-message">{message}</div>
                        <div class="commit-meta">
                            <span class="commit-author">👤 {author}</span> • <span class="commit-time">🕐 {time_ago}</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
        else:
            st.warning("Could not fetch commits from GitHub API")

        # Repo quick stats
        if repo_info:
            st.markdown("---")
            st.markdown("### 📈 Repository Stats")
            rcol1, rcol2, rcol3 = st.columns(3)
            with rcol1:
                st.metric("🍴 Forks", repo_info.get('forks_count', 0))
            with rcol2:
                st.metric("👀 Watchers", repo_info.get('watchers_count', 0))
            with rcol3:
                st.metric("❗ Open Issues", repo_info.get('open_issues_count', 0))

    with tab2:
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

    with tab3:
        st.markdown("## 🔧 Work In Progress")

        if search_query and wip:
            highlighted = wip.replace(search_query, f'**:orange[{search_query}]**')
            st.markdown(highlighted)
        elif wip:
            st.markdown(wip)
        else:
            st.error("Could not fetch WIP.md")

    with tab4:
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

    with tab5:
        st.markdown("## 📖 README")

        if search_query and readme:
            highlighted = readme.replace(search_query, f'**:blue[{search_query}]**')
            st.markdown(highlighted)
        elif readme:
            st.markdown(readme)
        else:
            st.error("Could not fetch README.md")

    with tab6:
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
            Devel status: 1 min • Docs: 5 min •
            <a href="https://github.com/gkerma/secubox-openwrt" style="color: #00d4aa;">View on GitHub</a>
        </small>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
