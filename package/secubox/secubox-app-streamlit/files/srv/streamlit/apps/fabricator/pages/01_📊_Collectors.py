"""
Collectors - Stats Collection Scripts Manager
"""
import streamlit as st
import subprocess
import json
import os

st.set_page_config(page_title="Collectors - Fabricator", page_icon="📊", layout="wide")

st.title('📊 Stats Collectors')
st.markdown('Manage stats collection scripts and JSON cache files')

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1

def load_json(path):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except:
        return None

def get_collectors():
    """List stats collector scripts"""
    collectors = []
    scripts = [
        '/usr/sbin/secubox-stats-collector.sh',
        '/usr/sbin/secubox-heartbeat-status',
        '/usr/sbin/crowdsec-stats-gen.sh',
        '/usr/sbin/mitmproxy-stats-gen.sh',
        '/usr/sbin/firewall-stats-gen.sh',
        '/usr/sbin/metablogizer-json.sh'
    ]
    for script in scripts:
        exists = os.path.exists(script)
        name = os.path.basename(script)
        collectors.append({
            'path': script,
            'name': name,
            'exists': exists
        })
    return collectors

def get_json_cache_files():
    """List JSON cache files in /tmp/secubox/"""
    cache = []
    out, _ = run_cmd('ls -la /tmp/secubox/*.json 2>/dev/null')
    for line in out.split('\n'):
        if '.json' in line and not line.startswith('l'):  # skip symlinks
            parts = line.split()
            if len(parts) >= 9:
                size = parts[4]
                time = ' '.join(parts[5:8])
                path = parts[8]
                name = os.path.basename(path)
                cache.append({
                    'path': path,
                    'name': name,
                    'size': size,
                    'time': time
                })
    return cache

# Installed Collectors
st.subheader('🔧 Installed Collector Scripts')

collectors = get_collectors()
for col in collectors:
    col1, col2, col3 = st.columns([3, 1, 1])
    
    with col1:
        status = '🟢' if col['exists'] else '🔴'
        st.markdown(f"**{status} {col['name']}**")
        st.caption(col['path'])
    
    with col2:
        if col['exists']:
            if st.button('▶️ Run', key=f"run_{col['name']}", use_container_width=True):
                with st.spinner('Running...'):
                    if 'heartbeat' in col['name']:
                        out, rc = run_cmd(f"{col['path']} > /tmp/secubox/heartbeat.json 2>&1")
                    else:
                        out, rc = run_cmd(f"{col['path']} all 2>&1")
                    if rc == 0:
                        st.success('Done!')
                    else:
                        st.error(f'Error: {out[:100]}')
    
    with col3:
        if col['exists']:
            if st.button('📝 View', key=f"view_{col['name']}", use_container_width=True):
                content, _ = run_cmd(f"head -50 {col['path']}")
                st.code(content, language='bash')

st.markdown('---')

# JSON Cache Files
st.subheader('📦 JSON Cache Files (/tmp/secubox/)')

cache_files = get_json_cache_files()

if cache_files:
    for cf in cache_files:
        col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
        
        with col1:
            st.markdown(f"**{cf['name']}**")
            st.caption(f"{cf['size']} bytes | {cf['time']}")
        
        with col2:
            if st.button('👁️ View', key=f"view_cache_{cf['name']}", use_container_width=True):
                data = load_json(cf['path'])
                if data:
                    st.json(data)
                else:
                    st.error('Failed to parse JSON')
        
        with col3:
            if st.button('🔄 Refresh', key=f"refresh_{cf['name']}", use_container_width=True):
                # Determine which collector generates this file
                if 'crowdsec' in cf['name']:
                    run_cmd('/usr/sbin/secubox-stats-collector.sh crowdsec')
                elif 'mitmproxy' in cf['name']:
                    run_cmd('/usr/sbin/secubox-stats-collector.sh mitmproxy')
                elif 'firewall' in cf['name']:
                    run_cmd('/usr/sbin/secubox-stats-collector.sh firewall')
                elif 'health' in cf['name']:
                    run_cmd('/usr/sbin/secubox-stats-collector.sh health')
                elif 'heartbeat' in cf['name']:
                    run_cmd('/usr/sbin/secubox-heartbeat-status > /tmp/secubox/heartbeat.json')
                st.success('Refreshed!')
                st.rerun()
        
        with col4:
            data = load_json(cf['path'])
            if data:
                st.caption(f"{len(data)} keys" if isinstance(data, dict) else f"{len(data)} items")
else:
    st.info('No cache files found')
    if st.button('🔄 Generate All Stats'):
        run_cmd('/usr/sbin/secubox-stats-collector.sh all')
        st.rerun()

st.markdown('---')

# Cron Jobs
st.subheader('⏰ Cron Schedule')

cron_out, _ = run_cmd('crontab -l 2>/dev/null | grep -E "(secubox|stats|heartbeat)"')
if cron_out:
    st.code(cron_out)
else:
    st.info('No stats-related cron jobs found')
    if st.button('➕ Add Default Cron Schedule'):
        run_cmd('(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/sbin/secubox-stats-collector.sh all >/dev/null 2>&1") | crontab -')
        run_cmd('(crontab -l 2>/dev/null; echo "* * * * * /usr/sbin/secubox-heartbeat-status > /tmp/secubox/heartbeat.json 2>/dev/null") | crontab -')
        st.success('Cron jobs added!')
        st.rerun()

st.markdown('---')

# Quick Actions
st.subheader('⚡ Quick Actions')
col1, col2, col3 = st.columns(3)

with col1:
    if st.button('🔄 Collect All Stats', type='primary', use_container_width=True):
        with st.spinner('Collecting...'):
            run_cmd('/usr/sbin/secubox-stats-collector.sh all')
            run_cmd('/usr/sbin/secubox-heartbeat-status > /tmp/secubox/heartbeat.json')
        st.success('All stats collected!')
        st.rerun()

with col2:
    if st.button('🧹 Clear Cache', use_container_width=True):
        run_cmd('rm -f /tmp/secubox/*.json')
        st.success('Cache cleared!')
        st.rerun()

with col3:
    if st.button('📊 View Summary', use_container_width=True):
        out, _ = run_cmd('ls -lh /tmp/secubox/*.json 2>/dev/null | awk \'{print $9 ": " $5}\'')
        st.code(out or 'No cache files')
