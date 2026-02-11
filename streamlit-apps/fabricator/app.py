#!/usr/bin/env python3
"""
SecuBox Fabricator - Widget & Component Constructor
Multi-tab Streamlit app for building SecuBox components
"""

import streamlit as st
import json
import subprocess
import os
from datetime import datetime

st.set_page_config(
    page_title="SecuBox Fabricator",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS
st.markdown("""
<style>
    #MainMenu, header, footer, .stDeployButton {display: none !important;}
    .block-container {padding: 0.5rem 1rem !important; max-width: 100% !important;}
    .stApp { background: #0a0a12; color: #e0e0e0; }
    .title { font-size: 2rem; font-weight: 700; text-align: center;
             background: linear-gradient(90deg, #00d4aa, #ff00ff);
             -webkit-background-clip: text; -webkit-text-fill-color: transparent;
             margin-bottom: 1rem; }
    .card { background: #12121a; border-radius: 12px; padding: 1rem; margin: 0.5rem 0;
            border-left: 4px solid #00d4aa; }
    .success { border-left-color: #00ff88 !important; }
    .warning { border-left-color: #ffaa00 !important; }
    .error { border-left-color: #ff4444 !important; }
    .code-preview { background: #1a1a24; border-radius: 8px; padding: 1rem;
                    font-family: monospace; font-size: 0.8rem; overflow-x: auto; }
</style>
""", unsafe_allow_html=True)

def run_cmd(cmd, timeout=30):
    """Run shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip(), result.returncode == 0
    except subprocess.TimeoutExpired:
        return "Command timed out", False
    except Exception as e:
        return str(e), False

def ssh_cmd(cmd, timeout=30):
    """Run command on router via SSH"""
    return run_cmd(f'ssh -o ConnectTimeout=5 root@192.168.255.1 "{cmd}"', timeout)

# Main title
st.markdown('<h1 class="title">🔧 SecuBox Fabricator</h1>', unsafe_allow_html=True)

# Tab navigation
tabs = st.tabs(["📊 Collectors", "🚀 Apps", "📝 Blogs", "🌐 Statics", "🔌 Services", "🧩 Widgets", "🪟 Embedder"])

# ============== TAB 1: COLLECTORS ==============
with tabs[0]:
    st.subheader("Stats Collector Builder")
    st.markdown("Create custom stats collection scripts")

    col1, col2 = st.columns([1, 1])

    with col1:
        collector_name = st.text_input("Collector Name", value="my-collector", key="coll_name")
        collector_type = st.selectbox("Template", ["Custom", "CrowdSec", "mitmproxy", "Firewall", "Network"])
        data_source = st.text_input("Data Source", value="/var/log/myservice.log", key="coll_src")
        output_path = st.text_input("Output JSON", value=f"/tmp/secubox/{collector_name}.json", key="coll_out")
        cron_schedule = st.selectbox("Update Frequency", ["*/5 * * * *", "*/1 * * * *", "*/15 * * * *", "0 * * * *"])

        # Template-based script generation
        if collector_type == "Custom":
            script_template = f'''#!/bin/sh
# {collector_name} - Custom Stats Collector
OUTPUT="{output_path}"
SRC="{data_source}"

# Parse your data source here
count=$(wc -l < "$SRC" 2>/dev/null | tr -cd '0-9')
[ -z "$count" ] && count=0

cat > "$OUTPUT" << EOF
{{
  "count": $count,
  "last_update": "$(date -Iseconds)"
}}
EOF
'''
        elif collector_type == "CrowdSec":
            script_template = f'''#!/bin/sh
# {collector_name} - CrowdSec Stats
OUTPUT="{output_path}"
bans=$(cscli decisions list -o json 2>/dev/null | jsonfilter -e "@[*]" 2>/dev/null | wc -l)
[ -z "$bans" ] && bans=0
cat > "$OUTPUT" << EOF
{{ "bans": $bans, "last_update": "$(date -Iseconds)" }}
EOF
'''
        elif collector_type == "mitmproxy":
            script_template = f'''#!/bin/sh
# {collector_name} - mitmproxy WAF Stats
OUTPUT="{output_path}"
threats=$(wc -l < /srv/mitmproxy/threats.log 2>/dev/null | tr -cd '0-9')
[ -z "$threats" ] && threats=0
cat > "$OUTPUT" << EOF
{{ "threats": $threats, "last_update": "$(date -Iseconds)" }}
EOF
'''
        elif collector_type == "Firewall":
            script_template = f'''#!/bin/sh
# {collector_name} - Firewall Stats
OUTPUT="{output_path}"
dropped=$(nft list chain inet fw4 input_wan 2>/dev/null | grep -oE 'packets [0-9]+' | awk '{{sum+=$2}}END{{print sum+0}}')
cat > "$OUTPUT" << EOF
{{ "dropped": ${{dropped:-0}}, "last_update": "$(date -Iseconds)" }}
EOF
'''
        else:
            script_template = f'''#!/bin/sh
# {collector_name} - Network Stats
OUTPUT="{output_path}"
conns=$(wc -l < /proc/net/nf_conntrack 2>/dev/null | tr -cd '0-9')
cat > "$OUTPUT" << EOF
{{ "connections": ${{conns:-0}}, "last_update": "$(date -Iseconds)" }}
EOF
'''

    with col2:
        st.markdown("**Generated Script:**")
        script_code = st.text_area("Script", value=script_template, height=300, key="coll_script")

        if st.button("🚀 Deploy Collector", key="deploy_coll"):
            script_path = f"/usr/sbin/{collector_name}.sh"
            # Save script
            with open(f"/tmp/{collector_name}.sh", "w") as f:
                f.write(script_code)
            os.system(f"scp /tmp/{collector_name}.sh root@192.168.255.1:{script_path}")
            os.system(f"ssh root@192.168.255.1 'chmod +x {script_path}'")
            # Add cron
            cron_entry = f"{cron_schedule} {script_path} >/dev/null 2>&1"
            os.system(f'ssh root@192.168.255.1 "grep -q \\"{collector_name}\\" /etc/crontabs/root || echo \\"{cron_entry}\\" >> /etc/crontabs/root"')
            st.success(f"Deployed {collector_name} to {script_path}")

# ============== TAB 2: APPS ==============
with tabs[1]:
    st.subheader("Streamlit App Deployer")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("**Create New App**")
        app_name = st.text_input("App Name", value="myapp", key="app_name")
        app_port = st.number_input("Port", min_value=8500, max_value=9999, value=8520, key="app_port")

        app_template = st.selectbox("Template", ["Basic", "Dashboard", "Form", "Data Viewer"])

        templates = {
            "Basic": '''import streamlit as st
st.set_page_config(page_title="{name}", page_icon="🚀")
st.title("{name}")
st.write("Welcome to {name}!")
''',
            "Dashboard": '''import streamlit as st
import json
st.set_page_config(page_title="{name}", page_icon="📊", layout="wide")
st.title("📊 {name} Dashboard")
col1, col2, col3 = st.columns(3)
with col1: st.metric("Metric 1", "100")
with col2: st.metric("Metric 2", "200")
with col3: st.metric("Metric 3", "300")
''',
            "Form": '''import streamlit as st
st.set_page_config(page_title="{name}", page_icon="📝")
st.title("📝 {name}")
with st.form("main_form"):
    name = st.text_input("Name")
    email = st.text_input("Email")
    if st.form_submit_button("Submit"):
        st.success(f"Submitted: {{name}}, {{email}}")
''',
            "Data Viewer": '''import streamlit as st
import json
st.set_page_config(page_title="{name}", page_icon="📈", layout="wide")
st.title("📈 {name}")
data_path = st.text_input("JSON Path", "/tmp/secubox/health-status.json")
if st.button("Load Data"):
    try:
        with open(data_path) as f:
            st.json(json.load(f))
    except Exception as e:
        st.error(str(e))
'''
        }

        app_code = templates[app_template].format(name=app_name)

    with col2:
        st.markdown("**App Code:**")
        final_code = st.text_area("Code", value=app_code, height=300, key="app_code")

        if st.button("🚀 Deploy App", key="deploy_app"):
            app_path = f"/srv/streamlit/apps/{app_name}"
            with open(f"/tmp/{app_name}_app.py", "w") as f:
                f.write(final_code)
            os.system(f"ssh root@192.168.255.1 'mkdir -p {app_path}'")
            os.system(f"scp /tmp/{app_name}_app.py root@192.168.255.1:{app_path}/app.py")
            # Register in UCI
            os.system(f'ssh root@192.168.255.1 "uci set streamlit.{app_name}=instance && uci set streamlit.{app_name}.name={app_name} && uci set streamlit.{app_name}.app={app_name}/app.py && uci set streamlit.{app_name}.port={app_port} && uci set streamlit.{app_name}.enabled=1 && uci commit streamlit"')
            st.success(f"Deployed {app_name} on port {app_port}")

    st.markdown("---")
    st.markdown("**Running Instances:**")
    output, _ = ssh_cmd("streamlitctl list 2>/dev/null | head -20")
    st.code(output or "No instances found")

# ============== TAB 3: BLOGS ==============
with tabs[2]:
    st.subheader("MetaBlogizer Sites")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("**Create Blog Site**")
        blog_name = st.text_input("Site Name", value="myblog", key="blog_name")
        blog_domain = st.text_input("Domain", value="myblog.example.com", key="blog_domain")
        blog_port = st.number_input("Port", min_value=8900, max_value=9999, value=8920, key="blog_port")
        blog_theme = st.selectbox("Theme", ["paper", "ananke", "book", "even", "stack"])

        if st.button("🚀 Create Blog", key="create_blog"):
            cmd = f'metablogizerctl create {blog_name} {blog_domain} {blog_port} {blog_theme} 2>&1'
            output, success = ssh_cmd(cmd, timeout=60)
            if success:
                st.success(f"Created blog: {blog_name}")
            else:
                st.error(output)

    with col2:
        st.markdown("**Existing Sites:**")
        sites_output, _ = ssh_cmd("metablogizerctl list 2>/dev/null")
        st.code(sites_output or "No sites found")

        st.markdown("**Quick Actions:**")
        site_select = st.text_input("Site to manage", key="blog_manage")
        action_col1, action_col2, action_col3 = st.columns(3)
        with action_col1:
            if st.button("Build", key="blog_build"):
                output, _ = ssh_cmd(f"metablogizerctl build {site_select}")
                st.info(output)
        with action_col2:
            if st.button("Serve", key="blog_serve"):
                output, _ = ssh_cmd(f"metablogizerctl serve {site_select}")
                st.info(output)
        with action_col3:
            if st.button("Emancipate", key="blog_emancipate"):
                output, _ = ssh_cmd(f"metablogizerctl emancipate {site_select}")
                st.info(output)

# ============== TAB 4: STATICS ==============
with tabs[3]:
    st.subheader("Static Site Generator")

    page_name = st.text_input("Page Name", value="mypage", key="static_name")
    page_title = st.text_input("Title", value="My Page", key="static_title")

    page_template = st.selectbox("Template", ["Landing", "Status", "Dashboard", "Portal"])

    templates = {
        "Landing": '''<!DOCTYPE html>
<html><head><title>{title}</title>
<style>body{{background:#0a0a0f;color:#fff;font-family:sans-serif;text-align:center;padding:2rem;}}
h1{{background:linear-gradient(90deg,#0ff,#f0f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}}
</style></head>
<body><h1>{title}</h1><p>Welcome to {title}</p></body></html>''',
        "Status": '''<!DOCTYPE html>
<html><head><title>{title}</title>
<style>body{{background:#0a0a0f;color:#fff;font-family:monospace;padding:1rem;}}
.status{{background:#111;padding:1rem;border-radius:8px;margin:0.5rem 0;}}
</style></head>
<body><h1>{title}</h1>
<div class="status" id="status">Loading...</div>
<script>
fetch('/secubox-status.json').then(r=>r.json()).then(d=>{{
  document.getElementById('status').innerHTML = '<pre>'+JSON.stringify(d,null,2)+'</pre>';
}});
</script></body></html>''',
        "Dashboard": '''<!DOCTYPE html>
<html><head><title>{title}</title>
<style>body{{background:#0a0a0f;color:#fff;font-family:monospace;padding:1rem;}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;}}
.card{{background:#111;padding:1rem;border-radius:8px;text-align:center;}}
</style></head>
<body><h1>{title}</h1>
<div class="grid" id="grid"></div>
<script>
fetch('/secubox-status.json').then(r=>r.json()).then(d=>{{
  const r = d.resources || {{}};
  document.getElementById('grid').innerHTML =
    '<div class="card"><h3>CPU</h3>'+(r.cpu_load||'?')+'</div>'+
    '<div class="card"><h3>MEM</h3>'+(r.memory_percent||'?')+'%</div>'+
    '<div class="card"><h3>DISK</h3>'+(r.storage_percent||'?')+'%</div>';
}});
</script></body></html>''',
        "Portal": '''<!DOCTYPE html>
<html><head><title>{title}</title>
<style>body{{background:#0a0a0f;color:#fff;font-family:monospace;padding:1rem;}}
.links{{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;}}
a{{background:#222;color:#0ff;padding:1rem 2rem;border-radius:8px;text-decoration:none;}}
a:hover{{background:#333;}}
</style></head>
<body><h1>{title}</h1>
<div class="links">
<a href="/cgi-bin/luci/">LuCI Console</a>
<a href="https://gk2.secubox.in">SecuBox Portal</a>
<a href="https://glances.maegia.tv">Glances</a>
</div></body></html>'''
    }

    html_code = templates[page_template].format(title=page_title)
    final_html = st.text_area("HTML Code", value=html_code, height=300, key="static_html")

    if st.button("🚀 Deploy Page", key="deploy_static"):
        with open(f"/tmp/{page_name}.html", "w") as f:
            f.write(final_html)
        os.system(f"scp /tmp/{page_name}.html root@192.168.255.1:/www/{page_name}.html")
        st.success(f"Deployed to /www/{page_name}.html")

# ============== TAB 5: SERVICES ==============
with tabs[4]:
    st.subheader("Service Exposure (Emancipate)")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("**Local Services Scan**")
        if st.button("🔍 Scan Services", key="scan_svc"):
            output, _ = ssh_cmd("netstat -tln | grep LISTEN | awk '{print $4}' | sort -u | head -20")
            st.code(output or "No services found")

        st.markdown("**Expose Service**")
        svc_port = st.number_input("Port", min_value=1, max_value=65535, value=8080, key="svc_port")
        svc_domain = st.text_input("Domain", value="myservice.example.com", key="svc_domain")
        svc_backend = st.text_input("Backend Name", value="myservice", key="svc_backend")

        expose_options = st.multiselect("Exposure Channels", ["HAProxy/SSL", "Tor", "Mesh"])

    with col2:
        if st.button("🔌 Emancipate Service", key="emancipate_svc"):
            # Create HAProxy backend and vhost
            if "HAProxy/SSL" in expose_options:
                cmds = [
                    f'uci set haproxy.{svc_backend}=backend',
                    f'uci set haproxy.{svc_backend}.name="{svc_backend}"',
                    f'uci set haproxy.{svc_backend}.mode="http"',
                    f'uci set haproxy.{svc_backend}.balance="roundrobin"',
                    f'uci set haproxy.{svc_backend}.enabled="1"',
                    f'uci set haproxy.{svc_backend}.server="srv 192.168.255.1:{svc_port} check"',
                    f'uci set haproxy.{svc_domain.replace(".", "_")}=vhost',
                    f'uci set haproxy.{svc_domain.replace(".", "_")}.domain="{svc_domain}"',
                    f'uci set haproxy.{svc_domain.replace(".", "_")}.backend="{svc_backend}"',
                    f'uci set haproxy.{svc_domain.replace(".", "_")}.ssl="1"',
                    f'uci set haproxy.{svc_domain.replace(".", "_")}.https_redirect="1"',
                    f'uci set haproxy.{svc_domain.replace(".", "_")}.enabled="1"',
                    'uci commit haproxy',
                    'haproxyctl generate && haproxyctl reload'
                ]
                for cmd in cmds:
                    ssh_cmd(cmd)
                st.success(f"HAProxy vhost created for {svc_domain}")

            if "Tor" in expose_options:
                output, _ = ssh_cmd(f"torctl add {svc_backend} {svc_port}")
                st.info(f"Tor: {output}")

            if "Mesh" in expose_options:
                output, _ = ssh_cmd(f"vortexctl mesh publish {svc_backend} {svc_domain}")
                st.info(f"Mesh: {output}")

# ============== TAB 6: WIDGETS ==============
with tabs[5]:
    st.subheader("Widget Designer")

    widget_name = st.text_input("Widget Name", value="mywidget", key="widget_name")
    widget_type = st.selectbox("Type", ["Metric", "Chart", "Status", "List"])
    data_source = st.text_input("Data JSON Path", value="/secubox-status.json", key="widget_data")
    data_field = st.text_input("Data Field", value="resources.cpu_load", key="widget_field")

    widget_templates = {
        "Metric": '''<div class="widget metric" id="{name}">
  <div class="value">--</div>
  <div class="label">{name}</div>
</div>
<style>
.widget.metric {{ background:#111; padding:1rem; border-radius:8px; text-align:center; }}
.widget .value {{ font-size:2rem; font-weight:bold; color:#0f0; }}
.widget .label {{ font-size:0.8rem; color:#666; }}
</style>
<script>
fetch('{source}').then(r=>r.json()).then(d=>{{
  const v = '{field}'.split('.').reduce((o,k)=>o&&o[k], d);
  document.querySelector('#{name} .value').textContent = v || '--';
}});
</script>''',
        "Status": '''<div class="widget status" id="{name}">
  <span class="dot"></span> {name}
</div>
<style>
.widget.status {{ background:#111; padding:0.5rem 1rem; border-radius:20px; display:inline-flex; align-items:center; gap:0.5rem; }}
.widget .dot {{ width:10px; height:10px; border-radius:50%; background:#f00; }}
.widget .dot.on {{ background:#0f0; box-shadow:0 0 8px #0f0; }}
</style>
<script>
fetch('{source}').then(r=>r.json()).then(d=>{{
  const v = '{field}'.split('.').reduce((o,k)=>o&&o[k], d);
  if(v) document.querySelector('#{name} .dot').classList.add('on');
}});
</script>''',
        "Chart": '''<div class="widget chart" id="{name}">
  <canvas id="{name}-canvas"></canvas>
</div>
<style>.widget.chart {{ background:#111; padding:1rem; border-radius:8px; }}</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>/* Add chart.js code here */</script>''',
        "List": '''<div class="widget list" id="{name}">
  <ul></ul>
</div>
<style>
.widget.list {{ background:#111; padding:1rem; border-radius:8px; }}
.widget.list ul {{ list-style:none; margin:0; padding:0; }}
.widget.list li {{ padding:0.3rem 0; border-bottom:1px solid #222; }}
</style>
<script>
fetch('{source}').then(r=>r.json()).then(d=>{{
  const items = '{field}'.split('.').reduce((o,k)=>o&&o[k], d) || [];
  const ul = document.querySelector('#{name} ul');
  items.forEach(i => {{ ul.innerHTML += '<li>'+JSON.stringify(i)+'</li>'; }});
}});
</script>'''
    }

    widget_code = widget_templates[widget_type].format(
        name=widget_name,
        source=data_source,
        field=data_field
    )

    st.markdown("**Preview:**")
    st.markdown(f'<div style="background:#0a0a0f;padding:1rem;border-radius:8px;">{widget_code.split("<script")[0]}</div>', unsafe_allow_html=True)

    st.markdown("**Generated Code:**")
    st.code(widget_code, language="html")

    if st.button("📋 Copy to Clipboard", key="copy_widget"):
        st.info("Code ready - copy from the code block above")

# ============== TAB 7: EMBEDDER ==============
with tabs[6]:
    st.subheader("Service Embedder Portal")
    st.markdown("Create unified portal pages embedding multiple services")

    col1, col2 = st.columns([1, 2])

    with col1:
        portal_name = st.text_input("Portal Name", value="myportal", key="embed_name")
        portal_title = st.text_input("Portal Title", value="My SecuBox Portal", key="embed_title")
        layout = st.selectbox("Layout", ["Grid", "Tabs", "Sidebar"], key="embed_layout")
        cols_num = st.slider("Grid Columns", 1, 4, 2, key="embed_cols")

        st.markdown("---")
        st.markdown("**Available Sources:**")

        # Fetch available services
        apps_json, _ = ssh_cmd("cat /www/streamlit-instances.json 2>/dev/null")
        blogs_json, _ = ssh_cmd("cat /www/metablogizer-sites.json 2>/dev/null")

        try:
            apps = json.loads(apps_json) if apps_json else []
            blogs = json.loads(blogs_json).get("sites", []) if blogs_json else []
        except:
            apps, blogs = [], []

        # Streamlit apps selection
        app_options = [f"{a['name']} (:{a['port']})" for a in apps if a.get('running')]
        selected_apps = st.multiselect("Streamlit Apps", app_options, key="embed_apps")

        # MetaBlogizer sites selection
        blog_options = [f"{b['name']} ({b['domain']})" for b in blogs]
        selected_blogs = st.multiselect("Blog Sites", blog_options, key="embed_blogs")

        # Custom URLs
        custom_urls = st.text_area("Custom URLs (one per line)", placeholder="https://glances.maegia.tv\nhttps://grafana.local:3000", key="embed_custom")

    with col2:
        # Build embed items
        embed_items = []

        for app_str in selected_apps:
            name = app_str.split(" (")[0]
            app = next((a for a in apps if a['name'] == name), None)
            if app:
                embed_items.append({
                    "name": app['name'],
                    "url": f"http://192.168.255.1:{app['port']}",
                    "type": "streamlit"
                })

        for blog_str in selected_blogs:
            name = blog_str.split(" (")[0]
            blog = next((b for b in blogs if b['name'] == name), None)
            if blog:
                embed_items.append({
                    "name": blog['name'],
                    "url": f"https://{blog['domain']}",
                    "type": "blog"
                })

        for url in (custom_urls or "").strip().split("\n"):
            if url.strip():
                name = url.strip().split("//")[-1].split("/")[0].split(":")[0]
                embed_items.append({
                    "name": name,
                    "url": url.strip(),
                    "type": "custom"
                })

        # Generate portal HTML based on layout
        if layout == "Grid":
            items_html = "\n".join([
                f'<div class="embed-item"><div class="embed-title">{item["name"]}</div>'
                f'<iframe src="{item["url"]}" frameborder="0"></iframe></div>'
                for item in embed_items
            ])
            portal_html = f'''<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{portal_title}</title>
<style>
:root {{ --bg:#0a0a0f; --card:#12121a; --accent:#00d4aa; --accent2:#ff00ff; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:#e0e0e0; font-family:monospace; padding:1rem; }}
h1 {{ text-align:center; background:linear-gradient(90deg,var(--accent),var(--accent2));
     -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:1rem; }}
.grid {{ display:grid; grid-template-columns:repeat({cols_num}, 1fr); gap:1rem; }}
.embed-item {{ background:var(--card); border-radius:12px; overflow:hidden; }}
.embed-title {{ padding:0.5rem 1rem; background:#1a1a24; font-weight:bold; color:var(--accent); }}
.embed-item iframe {{ width:100%; height:500px; background:#000; }}
@media (max-width:800px) {{ .grid {{ grid-template-columns:1fr; }} }}
</style>
</head><body>
<h1>{portal_title}</h1>
<div class="grid">
{items_html}
</div>
</body></html>'''

        elif layout == "Tabs":
            tabs_html = "\n".join([f'<button class="tab" onclick="showTab(\'{item["name"]}\')">{item["name"]}</button>' for item in embed_items])
            frames_html = "\n".join([f'<iframe id="frame-{item["name"]}" class="frame" src="{item["url"]}" style="display:none"></iframe>' for item in embed_items])
            portal_html = f'''<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>{portal_title}</title>
<style>
body {{ background:#0a0a0f; color:#e0e0e0; font-family:monospace; margin:0; }}
.header {{ background:#12121a; padding:1rem; text-align:center; }}
h1 {{ background:linear-gradient(90deg,#00d4aa,#ff00ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }}
.tabs {{ display:flex; gap:0.5rem; justify-content:center; margin-top:1rem; flex-wrap:wrap; }}
.tab {{ background:#1a1a24; border:none; color:#888; padding:0.5rem 1rem; border-radius:20px; cursor:pointer; }}
.tab:hover, .tab.active {{ background:#00d4aa; color:#000; }}
.frame {{ width:100%; height:calc(100vh - 120px); border:none; background:#000; }}
</style>
</head><body>
<div class="header">
<h1>{portal_title}</h1>
<div class="tabs">{tabs_html}</div>
</div>
{frames_html}
<script>
function showTab(name) {{
  document.querySelectorAll('.frame').forEach(f => f.style.display = 'none');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('frame-' + name).style.display = 'block';
  event.target.classList.add('active');
}}
if (document.querySelector('.tab')) document.querySelector('.tab').click();
</script>
</body></html>'''

        else:  # Sidebar
            first_url = embed_items[0]['url'] if embed_items else 'about:blank'
            nav_html = "\n".join([f'<a href="#" onclick="loadFrame(\'{item["url"]}\');return false;">{item["name"]}</a>' for item in embed_items])
            portal_html = f'''<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>{portal_title}</title>
<style>
body {{ background:#0a0a0f; color:#e0e0e0; font-family:monospace; margin:0; display:flex; }}
.sidebar {{ width:200px; background:#12121a; height:100vh; padding:1rem; }}
.sidebar h2 {{ font-size:1rem; color:#00d4aa; margin-bottom:1rem; }}
.sidebar a {{ display:block; color:#888; text-decoration:none; padding:0.5rem; border-radius:6px; margin:0.2rem 0; }}
.sidebar a:hover {{ background:#1a1a24; color:#fff; }}
.main {{ flex:1; }}
.main iframe {{ width:100%; height:100vh; border:none; background:#000; }}
</style>
</head><body>
<div class="sidebar">
<h2>{portal_title}</h2>
{nav_html}
</div>
<div class="main">
<iframe id="mainframe" src="{first_url}"></iframe>
</div>
<script>
function loadFrame(url) {{ document.getElementById('mainframe').src = url; }}
</script>
</body></html>'''

        st.markdown("**Preview:**")
        if embed_items:
            st.markdown(f"Embedding {len(embed_items)} services: {', '.join(i['name'] for i in embed_items)}")
            st.code(portal_html[:2000] + ("..." if len(portal_html) > 2000 else ""), language="html")
        else:
            st.info("Select services to embed")

        if st.button("🚀 Deploy Portal", key="deploy_portal"):
            if embed_items:
                with open(f"/tmp/{portal_name}.html", "w") as f:
                    f.write(portal_html)
                os.system(f"scp /tmp/{portal_name}.html root@192.168.255.1:/www/{portal_name}.html")
                st.success(f"Deployed portal to /www/{portal_name}.html")
                st.markdown(f"**Access:** http://192.168.255.1/{portal_name}.html")
            else:
                st.warning("Please select at least one service to embed")

# Footer
st.markdown("---")
st.markdown(f'<div style="text-align:center;color:#444;font-size:0.7rem;">SecuBox Fabricator • {datetime.now().strftime("%H:%M:%S")}</div>', unsafe_allow_html=True)
