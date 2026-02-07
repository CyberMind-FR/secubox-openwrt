"""
Widgets - Dashboard Component Designer
"""
import streamlit as st
import subprocess
import json

st.set_page_config(page_title="Widgets - Fabricator", page_icon="🧩", layout="wide")

st.title('🧩 Widget Designer')
st.markdown('Create dashboard widgets and view live stats')

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
    except Exception as e:
        return None

# Available data sources
DATA_SOURCES = {
    'Health Status': '/tmp/secubox/health-status.json',
    'CrowdSec Stats': '/tmp/secubox/crowdsec-stats.json',
    'CrowdSec Overview': '/tmp/secubox/crowdsec-overview.json',
    'CrowdSec Detail': '/tmp/secubox/crowdsec-detail.json',
    'mitmproxy WAF': '/tmp/secubox/mitmproxy-stats.json',
    'Firewall Stats': '/tmp/secubox/firewall-stats.json',
    'Heartbeat': '/tmp/secubox/heartbeat.json',
    'Threats Detail': '/tmp/secubox/threats-detail.json',
    'System Capacity': '/tmp/secubox/capacity.json'
}

# Live Stats Dashboard
st.subheader('📊 Live Stats Cache')

col1, col2 = st.columns([1, 3])

with col1:
    selected_source = st.radio('Data Source', list(DATA_SOURCES.keys()))

with col2:
    if selected_source:
        path = DATA_SOURCES[selected_source]
        data = load_json(path)
        
        if data:
            st.json(data)
            
            # Quick stat extraction
            st.markdown("**Quick Stats:**")
            if selected_source == 'Health Status':
                score = data.get('score', 0)
                level = data.get('level', 'unknown')
                color = '#0f0' if level == 'healthy' else '#fa0' if level == 'degraded' else '#f00'
                st.markdown(f"<span style='font-size:2rem; color:{color}'>{score}</span> ({level})", unsafe_allow_html=True)
            
            elif selected_source == 'CrowdSec Stats':
                alerts = data.get('alerts', 0)
                bans = data.get('bans', 0)
                st.markdown(f"**Alerts:** {alerts} | **Bans:** {bans}")
            
            elif selected_source == 'mitmproxy WAF':
                threats = data.get('threats_24h', 0)
                blocked = data.get('blocked_ips', 0)
                st.markdown(f"**Threats (24h):** {threats} | **Blocked IPs:** {blocked}")
            
            elif selected_source == 'Firewall Stats':
                dropped = data.get('wan_dropped', 0)
                conns = data.get('active_connections', 0)
                st.markdown(f"**WAN Dropped:** {dropped} | **Active Connections:** {conns}")
            
            elif selected_source == 'Heartbeat':
                services = data.get('services', {})
                online = sum(1 for v in services.values() if v)
                total = len(services)
                st.markdown(f"**Services:** {online}/{total} online")
        else:
            st.warning(f'No data at {path}')
            if st.button('🔄 Generate Stats'):
                run_cmd('/usr/sbin/secubox-stats-collector.sh all')
                st.rerun()

st.markdown('---')

# Widget Builder
st.subheader('🔧 Widget Builder')

# Widget templates
WIDGET_TEMPLATES = {
    'stat_card': '''<div class="stat-box">
    <div class="stat-value" style="color:{color}">{value}</div>
    <div class="stat-label">{label}</div>
</div>''',
    'status_dot': '''<div class="health-indicator">
    <span class="health-dot {status_class}"></span>{label}
</div>''',
    'service_link': '''<div class="service">
    <a href="{url}" target="_blank">{name}</a>
    <div class="service-meta">{desc}</div>
</div>''',
    'progress_bar': '''<div class="progress-container">
    <div class="progress-label">{label}</div>
    <div class="progress-bar">
        <div class="progress-fill" style="width:{percent}%; background:{color}"></div>
    </div>
    <div class="progress-value">{value}</div>
</div>'''
}

col1, col2 = st.columns([1, 2])

with col1:
    widget_type = st.selectbox('Widget Type', list(WIDGET_TEMPLATES.keys()))
    
    if widget_type == 'stat_card':
        value = st.text_input('Value', value='100')
        label = st.text_input('Label', value='Health Score')
        color = st.color_picker('Color', value='#00ffff')
    elif widget_type == 'status_dot':
        label = st.text_input('Label', value='CrowdSec')
        status = st.selectbox('Status', ['green', 'yellow', 'red'])
    elif widget_type == 'service_link':
        name = st.text_input('Name', value='Console')
        url = st.text_input('URL', value='https://console.gk2.secubox.in')
        desc = st.text_input('Description', value='LuCI Admin')
    elif widget_type == 'progress_bar':
        label = st.text_input('Label', value='CPU Usage')
        percent = st.slider('Percent', 0, 100, 65)
        value = st.text_input('Value Text', value='65%')
        color = st.color_picker('Bar Color', value='#00ff88')

with col2:
    st.subheader('Preview')
    
    # Generate widget HTML
    if widget_type == 'stat_card':
        widget_html = WIDGET_TEMPLATES['stat_card'].format(value=value, label=label, color=color)
    elif widget_type == 'status_dot':
        status_class = f'health-{status}'
        widget_html = WIDGET_TEMPLATES['status_dot'].format(label=label, status_class=status_class)
    elif widget_type == 'service_link':
        widget_html = WIDGET_TEMPLATES['service_link'].format(name=name, url=url, desc=desc)
    elif widget_type == 'progress_bar':
        widget_html = WIDGET_TEMPLATES['progress_bar'].format(label=label, percent=percent, value=value, color=color)
    else:
        widget_html = '<div>Widget preview</div>'
    
    # CSS for preview
    css = '''
    <style>
    .stat-box { background: #111; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #333; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #666; font-size: 0.8rem; text-transform: uppercase; }
    .health-indicator { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; }
    .health-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .health-green { background: #0f0; box-shadow: 0 0 8px #0f0; }
    .health-yellow { background: #fa0; box-shadow: 0 0 8px #fa0; }
    .health-red { background: #f00; box-shadow: 0 0 8px #f00; }
    .service { background: rgba(255,255,255,0.05); border: 1px solid #333; border-radius: 6px; padding: 0.75rem; }
    .service a { color: #0ff; text-decoration: none; font-weight: bold; }
    .service-meta { font-size: 0.7rem; color: #666; margin-top: 0.25rem; }
    .progress-container { padding: 0.5rem; }
    .progress-label { font-size: 0.8rem; color: #aaa; margin-bottom: 0.25rem; }
    .progress-bar { background: #222; border-radius: 4px; height: 8px; overflow: hidden; }
    .progress-fill { height: 100%; transition: width 0.3s; }
    .progress-value { font-size: 0.7rem; color: #666; text-align: right; margin-top: 0.25rem; }
    </style>
    '''
    
    st.markdown(css + widget_html, unsafe_allow_html=True)
    
    st.subheader('Generated Code')
    st.code(widget_html, language='html')

st.markdown('---')

# All Stats Summary
st.subheader('📈 All Stats Summary')

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("**Health**")
    health = load_json('/tmp/secubox/health-status.json')
    if health:
        score = health.get('score', 0)
        color = '#0f0' if score >= 80 else '#fa0' if score >= 50 else '#f00'
        st.markdown(f"<div style='font-size:2rem; color:{color}'>{score}</div>", unsafe_allow_html=True)
        st.caption(health.get('level', 'unknown'))

with col2:
    st.markdown("**CrowdSec**")
    cs = load_json('/tmp/secubox/crowdsec-stats.json')
    if cs:
        st.metric("Alerts", cs.get('alerts', 0))
        st.metric("Bans", cs.get('bans', 0))

with col3:
    st.markdown("**WAF (mitmproxy)**")
    waf = load_json('/tmp/secubox/mitmproxy-stats.json')
    if waf:
        st.metric("Threats 24h", waf.get('threats_24h', 0))
        st.metric("Blocked IPs", waf.get('blocked_ips', 0))

st.markdown('---')

# Refresh all stats
if st.button('🔄 Refresh All Stats', use_container_width=True):
    with st.spinner('Collecting stats...'):
        run_cmd('/usr/sbin/secubox-stats-collector.sh all')
        run_cmd('/usr/sbin/secubox-heartbeat-status > /tmp/secubox/heartbeat.json')
    st.success('All stats refreshed!')
    st.rerun()
