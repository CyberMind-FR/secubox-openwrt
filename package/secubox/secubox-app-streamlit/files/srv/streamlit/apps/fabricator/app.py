"""
SecuBox Fabricator - Universal Constructor for SecuBox Components
"""
import streamlit as st
import subprocess
import json
import os
import requests

st.set_page_config(
    page_title="SecuBox Fabricator",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown('''
<style>
    .stApp { background-color: #0a0a0f; }
    .main-header { font-size: 2.5rem; background: linear-gradient(90deg, #00ffff, #ff00ff); 
                   -webkit-background-clip: text; -webkit-text-fill-color: transparent; 
                   text-align: center; margin-bottom: 1rem; }
    .stat-box { background: #111; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #333; }
    .stat-value { font-size: 2rem; color: #0ff; font-weight: bold; }
    .stat-label { color: #666; font-size: 0.8rem; text-transform: uppercase; }
</style>
''', unsafe_allow_html=True)

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.stdout.strip()
    except Exception as e:
        return str(e)

def load_json(path):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except:
        return {}

def count_uci(config, type_name):
    out = run_cmd(f'uci show {config} 2>/dev/null | grep -c "={type_name}"')
    try:
        return int(out)
    except:
        return 0

# Header
st.markdown('<div class="main-header">SecuBox Fabricator</div>', unsafe_allow_html=True)
st.markdown('<p style="text-align:center; color:#666">Universal Constructor for SecuBox Components</p>', unsafe_allow_html=True)

# Load live stats
health = load_json('/tmp/secubox/health-status.json')
crowdsec = load_json('/tmp/secubox/crowdsec-stats.json')
mitmproxy = load_json('/tmp/secubox/mitmproxy-stats.json')

# Count actual resources
streamlit_instances = count_uci('streamlit', 'instance')
streamlit_apps = int(run_cmd('ls -1d /srv/streamlit/apps/*/ 2>/dev/null | wc -l') or '0')
blog_sites = count_uci('metablogizer', 'site')
haproxy_vhosts = count_uci('haproxy', 'vhost')
collectors = int(run_cmd('ls /tmp/secubox/*.json 2>/dev/null | wc -l') or '0')

# Stats row 1
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value" style="color:#ff00ff">{streamlit_instances}</div>
        <div class="stat-label">Streamlit Instances</div>
    </div>
    ''', unsafe_allow_html=True)

with col2:
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value" style="color:#00ff88">{blog_sites}</div>
        <div class="stat-label">Blog Sites</div>
    </div>
    ''', unsafe_allow_html=True)

with col3:
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value" style="color:#ffaa00">{haproxy_vhosts}</div>
        <div class="stat-label">HAProxy Vhosts</div>
    </div>
    ''', unsafe_allow_html=True)

with col4:
    score = health.get('score', 0)
    color = '#0f0' if score >= 80 else '#fa0' if score >= 50 else '#f00'
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value" style="color:{color}">{score}</div>
        <div class="stat-label">Health Score</div>
    </div>
    ''', unsafe_allow_html=True)

# Stats row 2
col1, col2, col3, col4 = st.columns(4)

with col1:
    bans = crowdsec.get('bans', 0)
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value" style="color:#f00">{bans}</div>
        <div class="stat-label">CrowdSec Bans</div>
    </div>
    ''', unsafe_allow_html=True)

with col2:
    threats = mitmproxy.get('threats_24h', 0)
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value" style="color:#fa0">{threats}</div>
        <div class="stat-label">WAF Threats (24h)</div>
    </div>
    ''', unsafe_allow_html=True)

with col3:
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value">{streamlit_apps}</div>
        <div class="stat-label">Installed Apps</div>
    </div>
    ''', unsafe_allow_html=True)

with col4:
    st.markdown(f'''
    <div class="stat-box">
        <div class="stat-value">{collectors}</div>
        <div class="stat-label">Stats Collectors</div>
    </div>
    ''', unsafe_allow_html=True)

st.markdown('---')

# Quick Actions
st.subheader('⚡ Quick Actions')
col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.button('📊 Refresh Stats', use_container_width=True):
        run_cmd('/usr/sbin/secubox-stats-collector.sh all')
        run_cmd('/usr/sbin/secubox-heartbeat-status > /tmp/secubox/heartbeat.json')
        st.success('Stats refreshed!')
        st.rerun()

with col2:
    if st.button('🔄 Reload HAProxy', use_container_width=True):
        run_cmd('haproxyctl reload')
        st.success('HAProxy reloaded!')

with col3:
    if st.button('📡 Sync DNS', use_container_width=True):
        run_cmd('dnsctl sync')
        st.success('DNS synced!')

with col4:
    if st.button('🔒 CrowdSec Reload', use_container_width=True):
        run_cmd('/etc/init.d/crowdsec reload')
        st.success('CrowdSec reloaded!')

st.markdown('---')

# Service Status
st.subheader('🔌 Service Status')

services = health.get('services', {})
col1, col2, col3, col4, col5 = st.columns(5)

def svc_status(name, status):
    icon = '🟢' if status else '🔴'
    return f"{icon} {name}"

with col1:
    st.markdown(svc_status('DNS', services.get('dns', 0)))
with col2:
    st.markdown(svc_status('BIND', services.get('bind', 0)))
with col3:
    st.markdown(svc_status('CrowdSec', services.get('crowdsec', 0)))
with col4:
    st.markdown(svc_status('HAProxy', services.get('haproxy', 0)))
with col5:
    st.markdown(svc_status('mitmproxy', services.get('mitmproxy', 0)))

st.markdown('---')
st.info('👈 Use the sidebar to access: **Collectors** | **Apps** | **Blogs** | **Services** | **Widgets**')
