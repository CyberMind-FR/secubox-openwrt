#!/usr/bin/env python3
"""
SecuBox Control Panel - Grand-Mamy KISS Edition v4
FIXED: Reads service status from cache files (works inside LXC)
"""

import streamlit as st
import json
import time
from datetime import datetime

st.set_page_config(page_title="SecuBox Control", page_icon="🛡️", layout="wide", initial_sidebar_state="collapsed")

PRIORITY_LEVELS = {
    0: ("DESACTIVE", "#404050"), 3: ("NORMAL", "#00d4aa"), 6: ("CRITIQUE", "#ffa500"),
    7: ("URGENT", "#ff8c00"), 8: ("ALERTE", "#ff6b6b"), 9: ("DANGER", "#ff4d4d"), 10: ("PERMANENT", "#ff0000"),
}

st.markdown("""
<style>
    #MainMenu, header, footer, .stDeployButton {display: none !important;}
    .block-container {padding: 0.5rem 1rem !important; max-width: 100% !important;}
    .stApp { background: #0a0a12; color: #e0e0e0; }
    .main-title { font-size: 2rem; font-weight: 700; text-align: center; background: linear-gradient(90deg, #00d4aa, #00a0ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .time-display { text-align: center; color: #00d4aa; font-size: 1.5rem; font-family: monospace; margin-bottom: 0.5rem; }
    .status-card { background: #12121a; border-radius: 12px; padding: 1rem; margin: 0.3rem 0; border-left: 4px solid #2a2a3a; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .card-title { font-size: 1.2rem; font-weight: 600; color: #ffffff; }
    .priority-badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; font-weight: 700; }
    .metric-row { display: flex; gap: 0.8rem; margin-top: 0.5rem; flex-wrap: wrap; }
    .metric-item { background: #1a1a24; padding: 0.5rem 0.8rem; border-radius: 8px; text-align: center; min-width: 60px; }
    .metric-value { font-size: 1.4rem; font-weight: 700; color: #00d4aa; font-family: monospace; }
    .metric-label { font-size: 0.65rem; color: #808090; text-transform: uppercase; }
    .progress-container { background: #1a1a24; border-radius: 8px; height: 20px; overflow: hidden; }
    .progress-bar { height: 100%; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.8rem; }
    .progress-green { background: linear-gradient(90deg, #00d4aa, #00a080); }
    .progress-yellow { background: linear-gradient(90deg, #ffa500, #ff8c00); }
    .progress-red { background: linear-gradient(90deg, #ff4d4d, #cc0000); }
    .led-strip { display: flex; gap: 1rem; justify-content: center; margin: 0.5rem 0; }
    .led-indicator { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; box-shadow: 0 0 10px currentColor; animation: led-pulse 1.5s ease-in-out infinite; }
    @keyframes led-pulse { 0%, 100% { box-shadow: 0 0 10px currentColor; } 50% { box-shadow: 0 0 25px currentColor; } }
    .heartbeat { animation: heartbeat 1s ease-in-out infinite; display: inline-block; }
    @keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    .section-title { font-size: 1rem; color: #606070; margin: 0.5rem 0; padding-left: 0.5rem; border-left: 3px solid #00d4aa; }
</style>
""", unsafe_allow_html=True)

def read_cache(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return {}

def rgb_hex(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def badge(level):
    name, color = PRIORITY_LEVELS.get(level, ("NORMAL", "#00d4aa"))
    return f'<span class="priority-badge" style="background:{color}22;color:{color};">{name}</span>'

def progress(val):
    pct = min(100, int(val))
    c = "progress-green" if pct < 60 else "progress-yellow" if pct < 85 else "progress-red"
    return f'<div class="progress-container"><div class="progress-bar {c}" style="width:{pct}%">{pct}%</div></div>'

@st.cache_data(ttl=5)
def get_data():
    d = {"time": datetime.now().strftime("%H:%M:%S"), "date": datetime.now().strftime("%d/%m/%Y")}

    health = read_cache("/tmp/secubox/health.json")
    threat = read_cache("/tmp/secubox/threat.json")
    capacity = read_cache("/tmp/secubox/capacity.json")
    status = read_cache("/tmp/secubox/health-status.json")
    cs = read_cache("/tmp/secubox/crowdsec.json")
    mitm = read_cache("/tmp/secubox/mitmproxy.json")
    netif = read_cache("/tmp/secubox/netifyd.json")

    modules = status.get("modules", {})
    resources = status.get("resources", {})

    d["score"] = health.get("score", 100)
    d["svc_ok"] = modules.get("active", health.get("services_ok", 0))
    d["svc_total"] = modules.get("enabled", health.get("services_total", 0))
    d["threat"] = threat.get("level", 0)
    d["cpu"] = capacity.get("cpu_pct", 0)
    d["mem"] = resources.get("memory_percent", 50)
    d["disk"] = resources.get("storage_percent", 0)
    d["load"] = resources.get("cpu_load", "0")

    d["haproxy"] = modules.get("active", 0) > 0
    d["crowdsec"] = cs.get("running", 0) == 1
    d["cs_alerts"] = cs.get("alerts", 0)
    d["cs_bans"] = cs.get("bans", 0)
    d["mitmproxy"] = mitm.get("running", 0) == 1
    d["mitm_threats"] = mitm.get("threats_today", 0)
    d["netifyd"] = netif.get("running", 0) == 1

    d["p_haproxy"] = 3 if d["haproxy"] else 10
    d["p_crowdsec"] = 3 if d["crowdsec"] and d["cs_alerts"] == 0 else 7 if d["cs_alerts"] > 0 else 10
    d["p_mitmproxy"] = 3 if d["mitmproxy"] else 6

    d["led1"] = rgb_hex(0, 255 if d["score"] > 50 else 0, 0) if d["score"] > 80 else rgb_hex(255, 165, 0) if d["score"] > 50 else rgb_hex(255, 0, 0)
    d["led2"] = rgb_hex(0, 255, 0) if d["threat"] < 10 else rgb_hex(255, 165, 0) if d["threat"] < 50 else rgb_hex(255, 0, 0)
    d["led3"] = rgb_hex(0, 255, 0) if d["cpu"] < 60 else rgb_hex(255, 165, 0) if d["cpu"] < 85 else rgb_hex(255, 0, 0)

    return d

def main():
    d = get_data()

    st.markdown('<h1 class="main-title">SecuBox Control Panel</h1>', unsafe_allow_html=True)
    st.markdown(f'<div class="time-display"><span class="heartbeat">💚</span> {d["time"]} - {d["date"]} <span class="heartbeat">💚</span></div>', unsafe_allow_html=True)

    st.markdown(f'''
    <div class="status-card" style="border-left-color:#00d4aa;">
        <div class="card-header"><span class="card-title">💡 LED Status</span></div>
        <div class="led-strip">
            <div style="text-align:center"><div class="led-indicator" style="background:{d['led1']};color:#000;">Health</div><div style="font-size:0.7rem;color:#808090;">Score: {d['score']}</div></div>
            <div style="text-align:center"><div class="led-indicator" style="background:{d['led2']};color:#000;">Threat</div><div style="font-size:0.7rem;color:#808090;">Level: {d['threat']}</div></div>
            <div style="text-align:center"><div class="led-indicator" style="background:{d['led3']};color:#000;">{d['cpu']}%</div><div style="font-size:0.7rem;color:#808090;">CPU</div></div>
        </div>
    </div>
    ''', unsafe_allow_html=True)

    st.markdown('<div class="section-title">SERVICES</div>', unsafe_allow_html=True)
    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown(f'''
        <div class="status-card" style="border-left-color:{PRIORITY_LEVELS[d['p_haproxy']][1]};">
            <div class="card-header"><span class="card-title">⚡ HAProxy</span>{badge(d['p_haproxy'])}</div>
            <div class="metric-row"><div class="metric-item"><div class="metric-value">{'ON' if d['haproxy'] else 'OFF'}</div><div class="metric-label">Status</div></div></div>
        </div>
        ''', unsafe_allow_html=True)

    with c2:
        st.markdown(f'''
        <div class="status-card" style="border-left-color:{PRIORITY_LEVELS[d['p_crowdsec']][1]};">
            <div class="card-header"><span class="card-title">🛡️ CrowdSec</span>{badge(d['p_crowdsec'])}</div>
            <div class="metric-row">
                <div class="metric-item"><div class="metric-value">{d['cs_alerts']}</div><div class="metric-label">Alerts</div></div>
                <div class="metric-item"><div class="metric-value">{d['cs_bans']}</div><div class="metric-label">Bans</div></div>
            </div>
        </div>
        ''', unsafe_allow_html=True)

    with c3:
        st.markdown(f'''
        <div class="status-card" style="border-left-color:{PRIORITY_LEVELS[d['p_mitmproxy']][1]};">
            <div class="card-header"><span class="card-title">🔍 MITM</span>{badge(d['p_mitmproxy'])}</div>
            <div class="metric-row"><div class="metric-item"><div class="metric-value">{d['mitm_threats']}</div><div class="metric-label">Threats</div></div></div>
        </div>
        ''', unsafe_allow_html=True)

    st.markdown('<div class="section-title">SYSTEM</div>', unsafe_allow_html=True)
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.markdown(f'<div class="status-card"><div class="card-header"><span class="card-title">🖥️ CPU</span></div>{progress(d["cpu"])}</div>', unsafe_allow_html=True)
    with c2:
        st.markdown(f'<div class="status-card"><div class="card-header"><span class="card-title">🧠 Memory</span></div>{progress(d["mem"])}</div>', unsafe_allow_html=True)
    with c3:
        st.markdown(f'<div class="status-card"><div class="card-header"><span class="card-title">💾 Disk</span></div>{progress(d["disk"])}</div>', unsafe_allow_html=True)
    with c4:
        st.markdown(f'''
        <div class="status-card"><div class="card-header"><span class="card-title">⚙️ Services</span></div>
        <div class="metric-row"><div class="metric-item"><div class="metric-value">{d['svc_ok']}/{d['svc_total']}</div><div class="metric-label">Running</div></div></div></div>
        ''', unsafe_allow_html=True)

    score_color = "#00d4aa" if d["score"] >= 80 else "#ffa500" if d["score"] >= 50 else "#ff4d4d"
    st.markdown(f'''
    <div class="status-card" style="text-align:center;border-left-color:{score_color};">
        <div style="font-size:3rem;font-weight:700;color:{score_color};">{d['score']}</div>
        <div style="color:#808090;">SECURITY SCORE</div>
    </div>
    ''', unsafe_allow_html=True)

    time.sleep(10)
    st.rerun()

if __name__ == "__main__":
    main()
