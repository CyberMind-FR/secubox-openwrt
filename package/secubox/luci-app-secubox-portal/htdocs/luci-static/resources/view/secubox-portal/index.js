'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require fs';
'require ui';

/**
 * SecuBox C3BOX Portal - Generative KISS Theme System
 *
 * Architecture:
 * - CSS Variables for theming (supports light/dark/custom)
 * - Component functions return DOM elements (generative-friendly)
 * - Multi-screen navigation with sidebar
 * - Dual-mode: LuCI addon or standalone sandbox
 * - Double-buffered cache for instant rendering
 *
 * Theme tokens: --bg, --card, --line, --text, --muted, --green, --red, --blue, --cyan
 */

// ========== ASYNC PROGRESSIVE CACHE SYSTEM ==========
var C3_CACHE = {
	STORAGE_KEY: 'c3box_cache',
	data: null,

	// Load from localStorage instantly
	init: function() {
		try {
			var stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				this.data = JSON.parse(stored);
				return true;
			}
		} catch (e) {}
		this.data = this.getDefaults();
		return false;
	},

	// Get cached value or default
	get: function(key) {
		return (this.data && this.data[key]) || this.getDefaults()[key];
	},

	// Update single key and persist
	set: function(key, value) {
		if (!this.data) this.data = this.getDefaults();
		this.data[key] = value;
		this.data._ts = Date.now();
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
		} catch (e) {}
	},

	// Get default/fallback data structure
	getDefaults: function() {
		return {
			boardInfo: { hostname: 'SecuBox', model: 'C3BOX' },
			sysInfo: { uptime: 0, load: [0, 0, 0], memory: { total: 8000000000, free: 4000000000 } },
			services: [],
			health: {},
			modules: { modules: [] },
			initServices: {},
			_ts: 0
		};
	}
};

// ========== DOM UPDATE HELPERS ==========
function updateText(selector, text) {
	var el = document.querySelector(selector);
	if (el && el.textContent !== text) el.textContent = text;
}

function updateAttr(selector, attr, value) {
	var el = document.querySelector(selector);
	if (el) el.setAttribute(attr, value);
}

// ========== RPC DECLARATIONS ==========
var callSystemBoard = rpc.declare({ object: 'system', method: 'board' });
var callSystemInfo = rpc.declare({ object: 'system', method: 'info' });
var callGetServices = rpc.declare({ object: 'luci.secubox', method: 'get_services', expect: {} });
var callGetHealth = rpc.declare({ object: 'luci.system-hub', method: 'get_health', expect: {} });
var callGetModules = rpc.declare({ object: 'luci.secubox', method: 'getModules', expect: {} });

// ========== THEME SYSTEM ==========
var C3_THEME = {
	// Core palette
	bg: '#0a0e17',
	bg2: '#111827',
	card: '#161e2e',
	cardHover: '#1c2640',
	line: '#1e293b',
	text: '#e2e8f0',
	muted: '#94a3b8',
	// Accent colors
	green: '#00C853',
	greenGlow: '#00E676',
	red: '#FF1744',
	blue: '#2979FF',
	blueGlow: '#448AFF',
	cyan: '#22d3ee',
	purple: '#a78bfa',
	orange: '#fb923c',
	pink: '#f472b6',
	yellow: '#fbbf24',
	dark: '#37474F',
	// Layout
	sidebarW: '240px',
	topbarH: '56px',
	// Fonts (fallback-safe)
	fontDisplay: "'Orbitron', 'Segoe UI', sans-serif",
	fontMono: "'JetBrains Mono', 'Consolas', monospace",
	fontBody: "'Outfit', 'Segoe UI', sans-serif"
};

// ========== NAVIGATION CONFIG ==========
var NAV_ITEMS = [
	{ id: 'hero', icon: '\uD83C\uDFE0', label: 'Home', section: 'Main' },
	{ id: 'dashboard', icon: '\uD83D\uDCCA', label: 'System Hub', section: 'Main' },
	{ id: 'security', icon: '\uD83D\uDEE1\uFE0F', label: 'DNS Guard', section: 'Security' },
	{ id: 'services', icon: '\uD83D\uDCE6', label: 'Services', section: 'Security' },
	{ id: 'cloning', icon: '\uD83D\uDCE5', label: 'Cloning Station', section: 'Deploy' },
	{ id: 'mesh', icon: '\uD83D\uDCE1', label: 'Mesh MaaS', section: 'Deploy' }
];

var SCREEN_TITLES = {
	hero: '\uD83C\uDFE0 SecuBox Home',
	dashboard: '\uD83D\uDCCA System Control Center',
	security: '\uD83D\uDEE1\uFE0F DNS Guard',
	services: '\uD83D\uDCE6 Services Stack',
	cloning: '\uD83D\uDCE5 Cloning Station',
	mesh: '\uD83D\uDCE1 Mesh Federation'
};

// ========== CSS GENERATOR ==========
function generateCSS(theme) {
	var t = theme || C3_THEME;
	return `
/* C3BOX Portal - Generated Theme */
:root {
	--bg: ${t.bg}; --bg2: ${t.bg2}; --card: ${t.card}; --card-hover: ${t.cardHover};
	--line: ${t.line}; --text: ${t.text}; --muted: ${t.muted};
	--green: ${t.green}; --green-glow: ${t.greenGlow}; --red: ${t.red};
	--blue: ${t.blue}; --blue-glow: ${t.blueGlow}; --cyan: ${t.cyan};
	--purple: ${t.purple}; --orange: ${t.orange}; --pink: ${t.pink};
	--yellow: ${t.yellow}; --dark: ${t.dark};
	--sidebar-w: ${t.sidebarW}; --topbar-h: ${t.topbarH};
	--font-display: ${t.fontDisplay}; --font-mono: ${t.fontMono}; --font-body: ${t.fontBody};
}
* { margin: 0; padding: 0; box-sizing: border-box; }
.c3-root {
	background: var(--bg); color: var(--text); font-family: var(--font-body);
	min-height: 100vh; overflow-x: hidden;
}
/* Noise overlay */
.c3-root::before {
	content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
	background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
}
/* Sidebar */
.c3-sidebar {
	position: fixed; left: 0; top: 0; bottom: 0; width: var(--sidebar-w);
	background: linear-gradient(180deg, #0d1321 0%, var(--bg) 100%);
	border-right: 1px solid var(--line); z-index: 100;
	display: flex; flex-direction: column; transition: transform 0.3s ease;
}
.c3-sidebar-logo {
	padding: 20px 20px 16px; border-bottom: 1px solid var(--line); text-align: center;
}
.c3-logo-text {
	font-family: var(--font-display); font-weight: 900; font-size: 28px; letter-spacing: -1px;
}
.c3-logo-c { color: var(--green); }
.c3-logo-3 { color: var(--red); font-size: 16px; vertical-align: super; position: relative; top: -6px; }
.c3-logo-b { color: var(--blue); }
.c3-logo-o { color: var(--dark); }
.c3-logo-x { color: var(--green); }
.c3-logo-sub {
	font-family: var(--font-mono); font-size: 10px; color: var(--muted);
	letter-spacing: 2px; margin-top: 4px;
}
.c3-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.c3-nav-section {
	padding: 8px 16px 4px; font-size: 10px; letter-spacing: 2px;
	text-transform: uppercase; color: var(--muted); font-family: var(--font-mono);
}
.c3-nav-item {
	display: flex; align-items: center; gap: 12px; padding: 10px 20px;
	cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted);
	transition: all 0.2s ease; border-left: 3px solid transparent;
}
.c3-nav-item:hover { background: rgba(255,255,255,0.03); color: var(--text); }
.c3-nav-item.active {
	color: var(--green); background: rgba(0,200,83,0.05); border-left-color: var(--green);
}
.c3-nav-icon { font-size: 18px; width: 24px; text-align: center; }
.c3-sidebar-footer {
	padding: 16px; border-top: 1px solid var(--line); text-align: center;
}
.c3-morph {
	font-family: var(--font-display); font-size: 13px; font-weight: 700;
	letter-spacing: 2px; min-height: 20px;
}
.c3-morph-secu {
	background: linear-gradient(90deg, var(--green), var(--blue), var(--green));
	background-size: 200%; -webkit-background-clip: text; background-clip: text;
	-webkit-text-fill-color: transparent; animation: gradShift 3s ease-in-out infinite;
}
.c3-footer-ver { font-size: 10px; color: var(--muted); font-family: var(--font-mono); margin-top: 4px; }
/* Topbar */
.c3-topbar {
	position: fixed; top: 0; left: var(--sidebar-w); right: 0; height: var(--topbar-h);
	background: rgba(10,14,23,0.85); backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--line); z-index: 90;
	display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
}
.c3-topbar-left { display: flex; align-items: center; gap: 12px; }
.c3-topbar-title { font-family: var(--font-body); font-weight: 700; font-size: 18px; }
.c3-topbar-right { display: flex; align-items: center; gap: 16px; }
.c3-badge {
	font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px;
	padding: 4px 10px; border-radius: 4px;
}
.c3-badge-green { color: var(--green); background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.25); }
.c3-badge-red { color: var(--red); background: rgba(255,23,68,0.1); border: 1px solid rgba(255,23,68,0.25); animation: pulse 2s infinite; }
.c3-badge-blue { color: var(--blue); background: rgba(41,121,255,0.1); border: 1px solid rgba(41,121,255,0.25); }
.c3-hamburger { display: none; cursor: pointer; font-size: 22px; color: var(--text); background: none; border: none; }
/* Main content */
.c3-main {
	margin-left: var(--sidebar-w); margin-top: var(--topbar-h);
	padding: 28px; min-height: calc(100vh - var(--topbar-h));
}
.c3-screen { display: none; animation: fadeIn 0.4s ease; }
.c3-screen.active { display: block; }
/* Hero screen */
.c3-hero {
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	min-height: calc(100vh - var(--topbar-h) - 56px); text-align: center;
}
.c3-cube-wrap { perspective: 800px; width: 200px; height: 200px; margin-bottom: 40px; }
.c3-cube {
	width: 100%; height: 100%; position: relative;
	transform-style: preserve-3d; animation: cubeRotate 18s ease-in-out infinite;
}
.c3-cube-face {
	position: absolute; width: 200px; height: 200px;
	display: flex; align-items: center; justify-content: center;
	border: 1px solid rgba(0,200,83,0.15); background: rgba(6,10,18,0.88);
	backdrop-filter: blur(4px);
}
.face-front { transform: translateZ(100px); }
.face-back { transform: rotateY(180deg) translateZ(100px); }
.face-right { transform: rotateY(90deg) translateZ(100px); }
.face-left { transform: rotateY(-90deg) translateZ(100px); }
.face-top { transform: rotateX(90deg) translateZ(100px); }
.face-bottom { transform: rotateX(-90deg) translateZ(100px); }
.c3-cube-logo { font-family: var(--font-display); font-weight: 900; font-size: 42px; }
.c3-cube-text { font-family: var(--font-display); font-weight: 700; opacity: 0.15; }
.c3-hero-title {
	font-family: var(--font-display); font-weight: 900; font-size: clamp(32px, 5vw, 56px);
	letter-spacing: -2px; margin-bottom: 12px;
	background: linear-gradient(135deg, var(--green), var(--cyan), var(--blue));
	-webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.c3-hero-sub { font-size: 18px; color: var(--muted); font-weight: 300; max-width: 550px; margin: 0 auto 8px; }
.c3-hero-tagline { font-family: var(--font-mono); font-size: 14px; color: var(--muted); margin-top: 12px; }
.c3-hero-tagline em { color: var(--red); font-style: normal; }
.c3-hero-stats { display: flex; gap: 24px; margin-top: 36px; flex-wrap: wrap; justify-content: center; }
.c3-hero-stat {
	background: var(--card); border: 1px solid var(--line); border-radius: 12px;
	padding: 18px 28px; text-align: center; transition: all 0.3s;
}
.c3-hero-stat:hover { border-color: rgba(0,200,83,0.3); transform: translateY(-3px); }
.c3-hero-stat-val { font-family: var(--font-display); font-weight: 900; font-size: 28px; color: var(--green); }
.c3-hero-stat-label {
	font-size: 11px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase;
	margin-top: 4px; font-family: var(--font-mono);
}
/* Dashboard cards */
.c3-dash-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.c3-dash-card {
	background: var(--card); border: 1px solid var(--line); border-radius: 14px;
	padding: 20px; display: flex; align-items: center; gap: 16px; transition: all 0.3s;
}
.c3-dash-card:hover { border-color: rgba(0,200,83,0.2); transform: translateY(-2px); }
.c3-dash-card-icon {
	width: 48px; height: 48px; border-radius: 12px;
	display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.c3-dash-card-val { font-family: var(--font-display); font-weight: 700; font-size: 22px; }
.c3-dash-card-label { font-size: 12px; color: var(--muted); }
.c3-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.c3-panel {
	background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 20px;
}
.c3-panel-title { font-weight: 700; font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
/* Resource bars */
.c3-resource { margin-bottom: 16px; }
.c3-resource-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.c3-resource-track { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.c3-resource-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
/* Quick actions */
.c3-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.c3-btn {
	padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
	cursor: pointer; border: 1px solid var(--line); background: var(--bg2);
	color: var(--text); transition: all 0.2s; display: flex; align-items: center; gap: 6px;
}
.c3-btn:hover { border-color: rgba(0,200,83,0.3); background: rgba(0,200,83,0.05); }
/* Services table */
.c3-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.c3-table th {
	text-align: left; padding: 10px 16px; font-size: 11px; letter-spacing: 1px;
	text-transform: uppercase; color: var(--muted); font-family: var(--font-mono);
	border-bottom: 1px solid var(--line);
}
.c3-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.c3-table tr:hover td { background: rgba(255,255,255,0.02); }
.c3-status {
	font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; font-family: var(--font-mono);
}
.c3-status-running { color: var(--green); background: rgba(0,200,83,0.12); }
.c3-status-stopped { color: var(--red); background: rgba(255,23,68,0.12); }
/* Defense chain */
.c3-chain {
	display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
	margin-bottom: 24px; padding: 16px; background: var(--card);
	border: 1px solid var(--line); border-radius: 14px;
}
.c3-chain-node {
	display: flex; flex-direction: column; align-items: center; gap: 4px;
	padding: 12px 16px; border-radius: 10px; background: var(--bg2);
	border: 1px solid var(--line); min-width: 80px; text-align: center; transition: all 0.3s;
}
.c3-chain-node:hover { transform: scale(1.05); }
.c3-chain-icon { font-size: 24px; }
.c3-chain-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.c3-chain-sub { font-size: 9px; color: var(--muted); }
.c3-chain-arrow { font-size: 16px; color: var(--orange); font-weight: 700; }
/* Services grid */
.c3-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.c3-svc-item {
	background: var(--card); border: 1px solid var(--line); border-radius: 12px;
	padding: 14px; display: flex; align-items: center; gap: 12px; transition: all 0.3s; cursor: default;
}
.c3-svc-item:hover { border-color: rgba(244,114,182,0.3); transform: translateY(-2px); }
.c3-svc-icon { font-size: 26px; }
.c3-svc-name { font-size: 13px; font-weight: 700; }
.c3-svc-cat { font-size: 10px; color: var(--muted); font-family: var(--font-mono); }
/* 3-Loop summary */
.c3-loops { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 24px; }
.c3-loop {
	background: var(--card); border: 1px solid; border-radius: 12px; padding: 18px; transition: all 0.3s;
}
.c3-loop:hover { transform: translateY(-3px); }
.c3-loop-icon { font-size: 26px; margin-bottom: 8px; }
.c3-loop-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
.c3-loop-detail { font-size: 12px; color: var(--muted); line-height: 1.6; font-family: var(--font-mono); }
/* Mesh */
.c3-mesh-hero { text-align: center; margin-bottom: 32px; }
.c3-mesh-hero h2 { font-family: var(--font-display); font-size: 28px; font-weight: 900; color: var(--yellow); margin-bottom: 8px; }
.c3-mesh-hero p { color: var(--muted); max-width: 600px; margin: 0 auto; }
.c3-mesh-formula {
	background: linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,146,60,0.1));
	border: 1px solid rgba(251,191,36,0.2); border-radius: 14px; padding: 20px;
	text-align: center; font-family: var(--font-display); font-size: 20px;
	font-weight: 700; margin-bottom: 28px;
}
.c3-mesh-nodes { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
.c3-mesh-node {
	background: var(--card); border: 1px solid var(--line); border-radius: 16px;
	padding: 24px; width: 160px; text-align: center; position: relative; transition: all 0.3s;
}
.c3-mesh-node:hover { border-color: rgba(251,191,36,0.4); transform: translateY(-4px); }
.c3-mesh-node-icon { font-size: 36px; margin-bottom: 8px; }
.c3-mesh-node-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
.c3-mesh-node-status { font-size: 10px; font-family: var(--font-mono); }
.c3-mesh-feats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.c3-mesh-feat {
	background: var(--card); border: 1px solid var(--line); border-radius: 12px;
	padding: 18px; transition: all 0.3s;
}
.c3-mesh-feat:hover { border-color: rgba(251,191,36,0.3); }
.c3-mesh-feat-icon { font-size: 28px; margin-bottom: 10px; }
.c3-mesh-feat-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
.c3-mesh-feat-desc { font-size: 12px; color: var(--muted); line-height: 1.5; font-family: var(--font-mono); }
/* Clone station */
.c3-clone-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.c3-clone-stat {
	background: var(--card); border: 1px solid var(--line); border-left: 4px solid;
	border-radius: 10px; padding: 16px;
}
.c3-clone-stat-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.c3-clone-stat-val { font-family: var(--font-display); font-weight: 700; font-size: 20px; }
.c3-uboot {
	background: var(--card); border-left: 4px solid var(--green);
	border-radius: 0 12px 12px 0; padding: 20px; margin-bottom: 24px;
}
.c3-uboot-title { font-weight: 700; font-size: 16px; margin-bottom: 4px; }
.c3-uboot-desc { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
.c3-uboot-code {
	background: #0d1117; border-radius: 8px; padding: 16px;
	font-family: var(--font-mono); font-size: 13px; color: var(--green);
	line-height: 1.8; overflow-x: auto; white-space: pre;
}
/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes gradShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes cubeRotate {
	0% { transform: rotateX(-8deg) rotateY(0deg); }
	25% { transform: rotateX(5deg) rotateY(90deg); }
	50% { transform: rotateX(-3deg) rotateY(180deg); }
	75% { transform: rotateX(8deg) rotateY(270deg); }
	100% { transform: rotateX(-8deg) rotateY(360deg); }
}
/* Responsive */
@media (max-width: 900px) {
	.c3-sidebar { transform: translateX(-100%); }
	.c3-sidebar.open { transform: translateX(0); }
	.c3-main, .c3-topbar { margin-left: 0 !important; left: 0 !important; }
	.c3-dash-cards, .c3-clone-stats { grid-template-columns: repeat(2, 1fr); }
	.c3-mesh-feats, .c3-loops { grid-template-columns: 1fr 1fr; }
	.c3-dash-grid { grid-template-columns: 1fr; }
	.c3-hamburger { display: flex !important; }
}
@media (max-width: 600px) {
	.c3-dash-cards, .c3-clone-stats, .c3-loops { grid-template-columns: 1fr; }
	.c3-mesh-feats { grid-template-columns: 1fr; }
}
`;
}

// ========== COMPONENT LIBRARY ==========
// All components are pure functions returning DOM elements (generative-friendly)

function C(tag, attrs, children) {
	// Shorthand DOM builder
	var el = document.createElement(tag);
	if (attrs) {
		for (var k in attrs) {
			if (k === 'style' && typeof attrs[k] === 'object') {
				for (var s in attrs[k]) el.style[s] = attrs[k][s];
			} else if (k.startsWith('on') && typeof attrs[k] === 'function') {
				el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
			} else {
				el.setAttribute(k, attrs[k]);
			}
		}
	}
	if (children) {
		(Array.isArray(children) ? children : [children]).forEach(function(c) {
			if (c == null) return;
			el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
		});
	}
	return el;
}

function Logo() {
	return C('div', { 'class': 'c3-logo-text' }, [
		C('span', { 'class': 'c3-logo-c' }, 'C'),
		C('span', { 'class': 'c3-logo-3' }, '3'),
		C('span', { 'class': 'c3-logo-b' }, 'B'),
		C('span', { 'class': 'c3-logo-o' }, 'O'),
		C('span', { 'class': 'c3-logo-x' }, 'X')
	]);
}

function Badge(text, type) {
	return C('span', { 'class': 'c3-badge c3-badge-' + (type || 'green') }, text);
}

function Panel(title, children) {
	return C('div', { 'class': 'c3-panel' }, [
		C('div', { 'class': 'c3-panel-title' }, title),
		C('div', {}, children)
	]);
}

function ResourceBar(label, value, max, percent) {
	var pct = percent || Math.round((value / max) * 100);
	return C('div', { 'class': 'c3-resource' }, [
		C('div', { 'class': 'c3-resource-head' }, [
			C('span', {}, label),
			C('span', {}, value + ' / ' + max)
		]),
		C('div', { 'class': 'c3-resource-track' }, [
			C('div', {
				'class': 'c3-resource-fill',
				'style': 'width:' + pct + '%;background:linear-gradient(90deg,var(--green),var(--cyan));'
			})
		]),
		C('div', { 'style': 'text-align:right;font-size:12px;color:var(--muted);margin-top:4px;' }, pct + '%')
	]);
}

function Button(icon, label, onClick) {
	return C('button', { 'class': 'c3-btn', 'onClick': onClick }, [
		icon ? C('span', {}, icon) : null,
		label
	]);
}

function StatusBadge(status) {
	var cls = status === 'running' ? 'c3-status-running' : 'c3-status-stopped';
	var text = status === 'running' ? 'Running' : 'Stopped';
	return C('span', { 'class': 'c3-status ' + cls }, text);
}

function ChainNode(icon, label, sub, color) {
	var style = color ? 'border-color:' + color : '';
	var labelStyle = color ? 'color:' + color : '';
	return C('div', { 'class': 'c3-chain-node', 'style': style }, [
		C('span', { 'class': 'c3-chain-icon' }, icon),
		C('span', { 'class': 'c3-chain-label', 'style': labelStyle }, label),
		C('span', { 'class': 'c3-chain-sub' }, sub)
	]);
}

function ChainArrow() {
	return C('span', { 'class': 'c3-chain-arrow' }, '\u2192');
}

function ServiceItem(icon, name, cat, status) {
	return C('div', { 'class': 'c3-svc-item' }, [
		C('span', { 'class': 'c3-svc-icon' }, icon),
		C('div', {}, [
			C('div', { 'class': 'c3-svc-name' }, name),
			C('div', { 'class': 'c3-svc-cat' }, cat)
		]),
		status ? C('div', { 'class': 'c3-status ' + (status === 'running' ? 'c3-status-running' : 'c3-status-stopped'), 'style': 'margin-left:auto;' }, status === 'running' ? '\u25CF' : '\u25CB') : null
	]);
}

function LoopCard(icon, title, detail, borderColor) {
	return C('div', { 'class': 'c3-loop', 'style': 'border-color:' + borderColor }, [
		C('div', { 'class': 'c3-loop-icon' }, icon),
		C('div', { 'class': 'c3-loop-title', 'style': 'color:' + borderColor.replace('0.2', '1') }, title),
		C('div', { 'class': 'c3-loop-detail' }, detail)
	]);
}

function MeshNode(icon, name, status, statusColor) {
	return C('div', { 'class': 'c3-mesh-node' }, [
		C('div', { 'class': 'c3-mesh-node-icon' }, icon),
		C('div', { 'class': 'c3-mesh-node-name' }, name),
		C('div', { 'class': 'c3-mesh-node-status', 'style': 'color:' + statusColor }, '\u25CF ' + status)
	]);
}

function MeshFeat(icon, name, desc) {
	return C('div', { 'class': 'c3-mesh-feat' }, [
		C('div', { 'class': 'c3-mesh-feat-icon' }, icon),
		C('div', { 'class': 'c3-mesh-feat-name' }, name),
		C('div', { 'class': 'c3-mesh-feat-desc' }, desc)
	]);
}

// ========== MAIN VIEW ==========
return view.extend({
	currentScreen: 'hero',

	load: function() {
		// Initialize cache - returns instantly
		C3_CACHE.init();
		// Return cached data immediately for instant render
		return Promise.resolve([true]);
	},

	render: function() {
		var self = this;

		// Get cached data for instant render (no waiting)
		var boardInfo = C3_CACHE.get('boardInfo');
		var sysInfo = C3_CACHE.get('sysInfo');
		var healthData = C3_CACHE.get('health');
		var modulesData = C3_CACHE.get('modules');
		var initServices = C3_CACHE.get('initServices');

		// Hide LuCI navigation for full-screen portal
		this.hideNavigation();

		// Inject CSS
		this.injectCSS();

		// Build the portal instantly from cache
		var root = C('div', { 'class': 'c3-root', 'id': 'c3-portal' }, [
			this.renderSidebar(boardInfo),
			this.renderTopbar(),
			C('main', { 'class': 'c3-main' }, [
				this.renderHeroScreen(boardInfo, sysInfo, initServices, modulesData),
				this.renderDashboardScreen(boardInfo, sysInfo, healthData, initServices),
				this.renderSecurityScreen(),
				this.renderServicesScreen(modulesData, initServices),
				this.renderCloningScreen(),
				this.renderMeshScreen()
			])
		]);

		// Fire async fetches - each updates DOM on completion
		this.asyncFetchAll();

		// Start live updates
		poll.add(function() { self.updateLiveData(); }, 5);

		// Start morph animation
		this.startMorphAnimation();

		return root;
	},

	// ========== ASYNC PROGRESSIVE FETCH ==========
	asyncFetchAll: function() {
		var self = this;

		// Fire all fetches in parallel - each updates DOM on completion
		callSystemBoard().then(function(data) {
			C3_CACHE.set('boardInfo', data);
			updateText('[data-stat="hostname"]', data.hostname || 'SecuBox');
			updateText('[data-stat="model"]', data.model || 'C3BOX');
		}).catch(function() {});

		callSystemInfo().then(function(data) {
			C3_CACHE.set('sysInfo', data);
			self.updateSysInfo(data);
		}).catch(function() {});

		callGetHealth().then(function(data) {
			C3_CACHE.set('health', data);
		}).catch(function() {});

		callGetModules().then(function(data) {
			C3_CACHE.set('modules', data);
			var count = (data.modules || []).length || 38;
			updateText('[data-stat="modules"]', String(count));
		}).catch(function() {});

		callGetServices().then(function(data) {
			C3_CACHE.set('services', data);
		}).catch(function() {});
	},

	updateSysInfo: function(sysInfo) {
		var self = this;
		if (!sysInfo) return;

		// Uptime
		updateText('[data-stat="uptime"]', this.formatUptime(sysInfo.uptime || 0));

		// CPU load
		if (sysInfo.load) {
			updateText('[data-stat="cpu-load"]', (sysInfo.load[0] / 65536).toFixed(2));
		}

		// Memory
		var mem = sysInfo.memory || {};
		if (mem.total) {
			var memPct = Math.round((mem.total - mem.free) / mem.total * 100);
			var memUsedGB = ((mem.total - mem.free) / 1024 / 1024 / 1024).toFixed(1);
			var memTotalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
			updateText('[data-stat="mem-percent"]', memPct + '%');
			updateText('[data-stat="mem-used"]', memUsedGB + ' GB');
			updateText('[data-stat="mem-total"]', memTotalGB + ' GB');
		}
	},

	hideNavigation: function() {
		document.body.classList.add('c3-portal-mode');
		['#mainmenu', '.main-left', 'header.main-header', 'nav[role="navigation"]', 'aside'].forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.style.display = 'none';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (main) {
			main.style.marginLeft = '0';
			main.style.width = '100%';
			main.style.padding = '0';
		}
	},

	injectCSS: function() {
		if (document.querySelector('#c3-theme-css')) return;
		var style = document.createElement('style');
		style.id = 'c3-theme-css';
		style.textContent = generateCSS(C3_THEME);
		document.head.appendChild(style);
	},

	renderSidebar: function(boardInfo) {
		var self = this;
		var currentSection = '';

		var navItems = NAV_ITEMS.map(function(item) {
			var items = [];
			if (item.section !== currentSection) {
				currentSection = item.section;
				items.push(C('div', { 'class': 'c3-nav-section' }, item.section));
			}
			items.push(C('div', {
				'class': 'c3-nav-item' + (item.id === self.currentScreen ? ' active' : ''),
				'data-screen': item.id,
				'onClick': function() { self.switchScreen(item.id); }
			}, [
				C('span', { 'class': 'c3-nav-icon' }, item.icon),
				item.label
			]));
			return items;
		}).flat();

		return C('nav', { 'class': 'c3-sidebar', 'id': 'c3-sidebar' }, [
			C('div', { 'class': 'c3-sidebar-logo' }, [
				Logo(),
				C('div', { 'class': 'c3-logo-sub' }, 'SECUBOX \u00B7 CYBERMIND.FR')
			]),
			C('div', { 'class': 'c3-nav' }, navItems),
			C('div', { 'class': 'c3-sidebar-footer' }, [
				C('div', { 'class': 'c3-morph', 'id': 'c3-morph' }),
				C('div', { 'class': 'c3-footer-ver' }, 'OpenWrt 24.10 \u00B7 v0.20')
			])
		]);
	},

	renderTopbar: function() {
		var self = this;
		return C('header', { 'class': 'c3-topbar' }, [
			C('div', { 'class': 'c3-topbar-left' }, [
				C('button', {
					'class': 'c3-hamburger',
					'onClick': function() {
						document.getElementById('c3-sidebar').classList.toggle('open');
					}
				}, '\u2630'),
				C('span', { 'class': 'c3-topbar-title', 'id': 'c3-topbar-title' }, SCREEN_TITLES[this.currentScreen])
			]),
			C('div', { 'class': 'c3-topbar-right' }, [
				Badge('\uD83D\uDD12 SHIELD ACTIVE', 'green'),
				Badge('\uD83D\uDCE1 MESH CONNECTED', 'blue'),
				C('span', { 'class': 'c3-badge c3-badge-green', 'id': 'c3-refresh-badge' }, '\u27F3 LIVE')
			])
		]);
	},

	switchScreen: function(screenId) {
		this.currentScreen = screenId;

		// Update nav
		document.querySelectorAll('.c3-nav-item').forEach(function(el) {
			el.classList.toggle('active', el.dataset.screen === screenId);
		});

		// Update screens
		document.querySelectorAll('.c3-screen').forEach(function(el) {
			el.classList.toggle('active', el.id === 'c3-screen-' + screenId);
		});

		// Update topbar title
		var titleEl = document.getElementById('c3-topbar-title');
		if (titleEl) titleEl.textContent = SCREEN_TITLES[screenId] || '';

		// Close mobile sidebar
		document.getElementById('c3-sidebar').classList.remove('open');
	},

	startMorphAnimation: function() {
		var morphEl = document.getElementById('c3-morph');
		if (!morphEl) return;
		var showSecu = false;
		function update() {
			showSecu = !showSecu;
			if (showSecu) {
				morphEl.innerHTML = '<span class="c3-morph-secu">SecuBox</span>';
			} else {
				morphEl.innerHTML = '<span class="c3-logo-c">C</span><span class="c3-logo-3">3</span><span class="c3-logo-b">B</span><span class="c3-logo-o">O</span><span class="c3-logo-x">X</span>';
			}
		}
		update();
		setInterval(update, 3000);
	},

	// ========== SCREEN RENDERERS ==========

	renderHeroScreen: function(boardInfo, sysInfo, initServices, modulesData) {
		var running = Object.values(initServices).filter(function(s) { return s === 'running'; }).length;
		var modules = (modulesData.modules || []).length || 38;

		return C('section', { 'class': 'c3-screen active', 'id': 'c3-screen-hero' }, [
			C('div', { 'class': 'c3-hero' }, [
				// 3D Cube
				C('div', { 'class': 'c3-cube-wrap' }, [
					C('div', { 'class': 'c3-cube' }, [
						C('div', { 'class': 'c3-cube-face face-front' }, [
							C('div', { 'class': 'c3-cube-logo' }, [
								C('span', { 'class': 'c3-logo-c' }, 'C'),
								C('span', { 'class': 'c3-logo-3' }, '3'),
								C('span', { 'class': 'c3-logo-b' }, 'B'),
								C('span', { 'class': 'c3-logo-o' }, 'O'),
								C('span', { 'class': 'c3-logo-x' }, 'X')
							])
						]),
						C('div', { 'class': 'c3-cube-face face-back' }, [
							C('div', { 'class': 'c3-cube-text', 'style': 'font-size:60px;color:var(--green);' }, 'C\u00B3')
						]),
						C('div', { 'class': 'c3-cube-face face-right' }, [
							C('div', { 'class': 'c3-cube-text', 'style': 'font-size:60px;color:var(--red);' }, '\u00B3')
						]),
						C('div', { 'class': 'c3-cube-face face-left' }, [
							C('div', { 'class': 'c3-cube-text', 'style': 'font-size:50px;' }, '\uD83D\uDEE1\uFE0F')
						]),
						C('div', { 'class': 'c3-cube-face face-top' }, [
							C('div', { 'class': 'c3-cube-text', 'style': 'font-size:28px;color:var(--green);' }, 'SecuBox')
						]),
						C('div', { 'class': 'c3-cube-face face-bottom' }, [
							C('div', { 'class': 'c3-cube-text', 'style': 'font-size:12px;letter-spacing:2px;color:var(--muted);' }, 'CyberMind.FR')
						])
					])
				]),
				// Title
				C('h1', { 'class': 'c3-hero-title' }, 'SecuBox Security Suite'),
				C('p', { 'class': 'c3-hero-sub' }, 'From bare hardware to full mesh protection \u2014 the OpenWrt-based security suite by CyberMind.FR'),
				C('p', { 'class': 'c3-hero-tagline' }, [
					'C au cube \u2014 ',
					C('em', {}, 'S\u00E9cube'),
					' \u2014 SecuBox',
					C('br'),
					'Triple couche. Une seule box.'
				]),
				// Stats
				C('div', { 'class': 'c3-hero-stats' }, [
					C('div', { 'class': 'c3-hero-stat' }, [
						C('div', { 'class': 'c3-hero-stat-val', 'data-stat': 'modules' }, String(modules)),
						C('div', { 'class': 'c3-hero-stat-label' }, 'Modules')
					]),
					C('div', { 'class': 'c3-hero-stat' }, [
						C('div', { 'class': 'c3-hero-stat-val', 'data-stat': 'services' }, String(running)),
						C('div', { 'class': 'c3-hero-stat-label' }, 'Services Running')
					]),
					C('div', { 'class': 'c3-hero-stat' }, [
						C('div', { 'class': 'c3-hero-stat-val' }, '16'),
						C('div', { 'class': 'c3-hero-stat-label' }, 'Arch Targets')
					]),
					C('div', { 'class': 'c3-hero-stat' }, [
						C('div', { 'class': 'c3-hero-stat-val' }, '5'),
						C('div', { 'class': 'c3-hero-stat-label' }, 'Network Modes')
					]),
					C('div', { 'class': 'c3-hero-stat' }, [
						C('div', { 'class': 'c3-hero-stat-val' }, 'N\u00B2'),
						C('div', { 'class': 'c3-hero-stat-label' }, 'Mesh Protection')
					])
				])
			])
		]);
	},

	renderDashboardScreen: function(boardInfo, sysInfo, healthData, initServices) {
		var self = this;
		var running = Object.values(initServices).filter(function(s) { return s === 'running'; }).length;
		var total = Object.keys(initServices).length;

		var mem = sysInfo.memory || {};
		var memUsedMB = Math.round((mem.total - mem.free - (mem.buffered || 0)) / 1024 / 1024 * 10) / 10;
		var memTotalMB = Math.round(mem.total / 1024 / 1024 * 10) / 10;
		var memPct = mem.total ? Math.round((mem.total - mem.free) / mem.total * 100) : 0;

		var uptime = this.formatUptime(sysInfo.uptime || 0);
		var load = sysInfo.load ? (sysInfo.load[0] / 65536).toFixed(2) : '0.00';

		// Top services for table
		var topServices = Object.keys(initServices).slice(0, 15).map(function(name) {
			return { name: name, status: initServices[name] };
		});

		return C('section', { 'class': 'c3-screen', 'id': 'c3-screen-dashboard' }, [
			// Top cards
			C('div', { 'class': 'c3-dash-cards' }, [
				C('div', { 'class': 'c3-dash-card' }, [
					C('div', { 'class': 'c3-dash-card-icon', 'style': 'background:rgba(41,121,255,0.12);' }, '\uD83D\uDDA5\uFE0F'),
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--blue);' }, 'C3BOX'),
						C('div', { 'class': 'c3-dash-card-label' }, boardInfo.model || 'SecuBox')
					])
				]),
				C('div', { 'class': 'c3-dash-card' }, [
					C('div', { 'class': 'c3-dash-card-icon', 'style': 'background:rgba(0,200,83,0.12);' }, '\u23F1\uFE0F'),
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--green);', 'data-stat': 'uptime' }, uptime),
						C('div', { 'class': 'c3-dash-card-label' }, 'Uptime')
					])
				]),
				C('div', { 'class': 'c3-dash-card' }, [
					C('div', { 'class': 'c3-dash-card-icon', 'style': 'background:rgba(167,139,250,0.12);' }, '\u26A1'),
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--purple);', 'data-stat': 'services-count' }, String(running)),
						C('div', { 'class': 'c3-dash-card-label' }, 'Services')
					])
				]),
				C('div', { 'class': 'c3-dash-card' }, [
					C('div', { 'class': 'c3-dash-card-icon', 'style': 'background:rgba(251,146,60,0.12);' }, '\uD83D\uDD25'),
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--orange);', 'data-stat': 'cpu-load' }, load),
						C('div', { 'class': 'c3-dash-card-label' }, 'CPU Load')
					])
				])
			]),
			// Grid panels
			C('div', { 'class': 'c3-dash-grid' }, [
				Panel('\uD83D\uDCC8 Resource Usage', [
					C('div', { 'id': 'c3-resource-mem' }, [
						ResourceBar('\uD83D\uDCBE Memory', memUsedMB + ' GB', memTotalMB + ' GB', memPct)
					]),
					C('div', { 'id': 'c3-resource-disk' }, [
						ResourceBar('\uD83D\uDCBD Storage', '8%', '100%', 8)
					])
				]),
				Panel('\u26A1 Quick Actions', [
					C('div', { 'class': 'c3-actions' }, [
						Button('\u2699\uFE0F', 'System Settings'),
						Button('\uD83D\uDD04', 'Reboot'),
						Button('\uD83D\uDCBE', 'Backup/Flash'),
						Button('\uD83D\uDD0D', 'Diagnostics'),
						Button('\uD83D\uDC1B', 'Debug Console'),
						Button('\uD83D\uDCE1', 'Remote Mgmt')
					])
				])
			]),
			// Services table
			Panel('\uD83D\uDD27 Services (' + running + '/' + total + ' running)', [
				C('table', { 'class': 'c3-table' }, [
					C('thead', {}, [
						C('tr', {}, [
							C('th', {}, 'Service'),
							C('th', {}, 'Status'),
							C('th', {}, 'Enabled')
						])
					]),
					C('tbody', { 'id': 'c3-svc-tbody' }, topServices.map(function(svc) {
						return C('tr', {}, [
							C('td', {}, svc.name),
							C('td', {}, [StatusBadge(svc.status)]),
							C('td', {}, '\u2713')
						]);
					}))
				])
			])
		]);
	},

	renderSecurityScreen: function() {
		return C('section', { 'class': 'c3-screen', 'id': 'c3-screen-security' }, [
			// Tabs
			C('div', { 'style': 'display:flex;gap:8px;margin-bottom:24px;' }, [
				C('div', { 'class': 'c3-btn', 'style': 'border-color:var(--cyan);color:var(--cyan);' }, '\uD83D\uDEE1\uFE0F DNS Guard'),
				C('div', { 'class': 'c3-btn' }, '\uD83D\uDEE1\uFE0F CrowdSec'),
				C('div', { 'class': 'c3-btn' }, '\uD83D\uDD0D Threat Analyst'),
				C('div', { 'class': 'c3-btn' }, '\uD83D\uDD12 mitmproxy'),
				C('div', { 'class': 'c3-btn' }, '\uD83D\uDC64 Client Guardian')
			]),
			// Defense chain
			C('div', { 'class': 'c3-chain' }, [
				ChainNode('\uD83C\uDF00', 'DNS', 'Block before connect', 'rgba(251,146,60,0.4)'),
				ChainArrow(),
				ChainNode('\uD83E\uDDF1', 'Firewall', 'Filter IPs'),
				ChainArrow(),
				ChainNode('\uD83D\uDD0D', 'WAF', 'Inspect requests'),
				ChainArrow(),
				ChainNode('\uD83D\uDCE1', 'Mesh', 'Share alerts P2P'),
				ChainArrow(),
				ChainNode('\u2705', 'CLEAN', 'Safe traffic', 'rgba(34,211,238,0.4)')
			]),
			// DNS stats
			C('div', { 'class': 'c3-dash-cards', 'style': 'grid-template-columns:repeat(3,1fr);' }, [
				C('div', { 'class': 'c3-dash-card', 'style': 'border-top:3px solid var(--green);' }, [
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--green);font-family:var(--font-mono);' }, '9.9.9.9'),
						C('div', { 'class': 'c3-dash-card-label' }, 'PRIMARY DNS')
					])
				]),
				C('div', { 'class': 'c3-dash-card', 'style': 'border-top:3px solid var(--blue);' }, [
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--blue);font-family:var(--font-mono);' }, '149.112.112.112'),
						C('div', { 'class': 'c3-dash-card-label' }, 'SECONDARY DNS')
					])
				]),
				C('div', { 'class': 'c3-dash-card', 'style': 'border-top:3px solid var(--cyan);' }, [
					C('div', {}, [
						C('div', { 'class': 'c3-dash-card-val', 'style': 'color:var(--cyan);' }, 'quad9'),
						C('div', { 'class': 'c3-dash-card-label' }, 'PROVIDER')
					])
				])
			]),
			// Smart config
			C('div', { 'style': 'background:linear-gradient(135deg,rgba(0,200,83,0.08),rgba(34,211,238,0.08));border:1px solid rgba(0,200,83,0.2);border-radius:14px;padding:20px;margin-top:24px;' }, [
				C('div', { 'style': 'font-weight:700;font-size:16px;margin-bottom:8px;color:var(--green);' }, '\u26A1 Smart Config'),
				C('div', { 'style': 'font-size:14px;color:var(--muted);margin-bottom:12px;' }, 'Auto-detect the fastest uncensored DNS for your location'),
				Button('\uD83D\uDE80', 'Run Smart Config')
			])
		]);
	},

	renderServicesScreen: function(modulesData, initServices) {
		var modules = [
			{ icon: '\uD83D\uDEE1\uFE0F', name: 'CrowdSec', cat: 'security \u00B7 CTI' },
			{ icon: '\uD83D\uDD0D', name: 'Netifyd DPI', cat: 'security \u00B7 inspect' },
			{ icon: '\uD83C\uDF00', name: 'Vortex DNS', cat: 'security \u00B7 dns' },
			{ icon: '\uD83E\uDDF1', name: 'nftables FW', cat: 'security \u00B7 firewall' },
			{ icon: '\uD83D\uDD10', name: 'WireGuard', cat: 'network \u00B7 vpn' },
			{ icon: '\uD83D\uDD11', name: 'Auth Guardian', cat: 'security \u00B7 auth' },
			{ icon: '\uD83D\uDC64', name: 'Client Guardian', cat: 'network \u00B7 NAC' },
			{ icon: '\uD83D\uDCCA', name: 'Netdata', cat: 'monitor \u00B7 metrics' },
			{ icon: '\uD83C\uDFAC', name: 'Media Flow', cat: 'monitor \u00B7 streams' },
			{ icon: '\uD83D\uDEA6', name: 'Traffic Shaper', cat: 'network \u00B7 QoS' },
			{ icon: '\uD83D\uDCBE', name: 'CDN Cache', cat: 'network \u00B7 proxy' },
			{ icon: '\uD83C\uDF10', name: 'VHost Manager', cat: 'infra \u00B7 19 templates' },
			{ icon: '\uD83D\uDCF6', name: 'Bandwidth Mgr', cat: 'network \u00B7 8 levels' },
			{ icon: '\uD83C\uDFE0', name: 'System Hub', cat: 'core \u00B7 unified' },
			{ icon: '\uD83E\uDD16', name: 'AI Module', cat: 'ai \u00B7 detection' },
			{ icon: '\uD83D\uDCE1', name: 'IoT Guard', cat: 'iot \u00B7 isolation' },
			{ icon: '\uD83D\uDD12', name: 'mitmproxy', cat: 'security \u00B7 intercept' },
			{ icon: '\uD83D\uDCCB', name: 'Threat Analyst', cat: 'security \u00B7 analysis' }
		];

		return C('section', { 'class': 'c3-screen', 'id': 'c3-screen-services' }, [
			C('div', { 'style': 'margin-bottom:20px;' }, [
				C('h2', { 'style': 'font-size:22px;font-weight:700;margin-bottom:6px;' }, '\uD83D\uDCE6 38 Module Stack'),
				C('p', { 'style': 'color:var(--muted);font-size:14px;' }, 'Each module has its own LuCI dashboard, RPCD backend, UCI config, and procd service management. No cloud required.')
			]),
			// Services grid
			C('div', { 'class': 'c3-svc-grid' }, modules.map(function(m) {
				return ServiceItem(m.icon, m.name, m.cat);
			})),
			// Formula
			C('div', { 'style': 'background:linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.08));border:1px solid rgba(244,114,182,0.15);border-radius:12px;padding:16px 24px;text-align:center;font-family:var(--font-mono);font-size:14px;margin-top:20px;' }, [
				C('span', { 'style': 'color:var(--cyan);font-weight:700;' }, '38'),
				' modules \u00B7 ',
				C('span', { 'style': 'color:var(--cyan);font-weight:700;' }, '9'),
				' categories \u00B7 ',
				C('span', { 'style': 'color:var(--cyan);font-weight:700;' }, '40'),
				' active services \u00B7 ',
				C('em', { 'style': 'color:var(--purple);font-weight:700;font-style:normal;' }, '0 cloud dependencies'),
				' \u2601\uFE0F\u274C'
			]),
			// 3-Loop
			C('div', { 'class': 'c3-loops' }, [
				LoopCard('\u26A1', 'Loop 1 \u2014 Operational', 'ms \u2192 seconds\nnftables \u00B7 DPI \u00B7 Bouncer\n\uD83E\uDDF1 Immediate blocking', 'rgba(255,23,68,0.2)'),
				LoopCard('\uD83D\uDD04', 'Loop 2 \u2014 Tactical', 'minutes \u2192 hours\nPattern analysis\n\uD83D\uDCCA Adaptive defense', 'rgba(251,146,60,0.2)'),
				LoopCard('\uD83E\uDDE0', 'Loop 3 \u2014 Strategic', 'hours \u2192 days\nMesh intelligence\n\uD83D\uDCE1 Fleet-wide policy', 'rgba(41,121,255,0.2)')
			])
		]);
	},

	renderCloningScreen: function() {
		return C('section', { 'class': 'c3-screen', 'id': 'c3-screen-cloning' }, [
			// Status cards
			C('div', { 'class': 'c3-clone-stats' }, [
				C('div', { 'class': 'c3-clone-stat', 'style': 'border-left-color:var(--green);' }, [
					C('div', { 'class': 'c3-clone-stat-label' }, 'Device'),
					C('div', { 'class': 'c3-clone-stat-val', 'style': 'color:var(--green);' }, 'mochabin')
				]),
				C('div', { 'class': 'c3-clone-stat', 'style': 'border-left-color:var(--cyan);' }, [
					C('div', { 'class': 'c3-clone-stat-label' }, 'TFTP'),
					C('div', { 'class': 'c3-clone-stat-val', 'style': 'color:var(--cyan);' }, 'Running')
				]),
				C('div', { 'class': 'c3-clone-stat', 'style': 'border-left-color:var(--purple);' }, [
					C('div', { 'class': 'c3-clone-stat-label' }, 'Tokens'),
					C('div', { 'class': 'c3-clone-stat-val', 'style': 'color:var(--purple);' }, '0')
				]),
				C('div', { 'class': 'c3-clone-stat', 'style': 'border-left-color:var(--orange);' }, [
					C('div', { 'class': 'c3-clone-stat-label' }, 'Clones'),
					C('div', { 'class': 'c3-clone-stat-val', 'style': 'color:var(--orange);' }, '0')
				])
			]),
			// Quick actions
			Panel('\u26A1 Quick Actions', [
				C('div', { 'class': 'c3-actions' }, [
					C('button', { 'class': 'c3-btn', 'style': 'border-color:rgba(0,200,83,0.3);color:var(--green);' }, '\uD83D\uDD28 Build Image'),
					C('button', { 'class': 'c3-btn', 'style': 'border-color:rgba(255,23,68,0.3);color:var(--red);' }, '\u23F9\uFE0F Stop TFTP'),
					C('button', { 'class': 'c3-btn', 'style': 'border-color:rgba(41,121,255,0.3);color:var(--blue);' }, '\uD83D\uDD11 New Token'),
					C('button', { 'class': 'c3-btn', 'style': 'border-color:rgba(251,146,60,0.3);color:var(--orange);' }, '\u2705 Auto-Approve Token')
				])
			]),
			// U-Boot commands
			C('div', { 'class': 'c3-uboot', 'style': 'margin-top:20px;' }, [
				C('div', { 'class': 'c3-uboot-title' }, '\uD83D\uDD27 U-Boot Flash Commands'),
				C('div', { 'class': 'c3-uboot-desc' }, 'Run these commands in U-Boot (Marvell>> prompt) on the target device:'),
				C('div', { 'class': 'c3-uboot-code' }, 'setenv serverip 192.168.255.1\nsetenv ipaddr 192.168.255.100\ndhcp\ntftpboot 0x6000000 secubox-clone.img\nmmc dev 1\nmmc write 0x6000000 0 ${filesize}\nreset')
			])
		]);
	},

	renderMeshScreen: function() {
		return C('section', { 'class': 'c3-screen', 'id': 'c3-screen-mesh' }, [
			// Hero
			C('div', { 'class': 'c3-mesh-hero' }, [
				C('h2', {}, '\uD83D\uDCE1 MESH \u2014 MaaS Federation'),
				C('p', {}, 'Each SecuBox node joins the P2P mesh via WireGuard tunnels, sharing threat intelligence in real-time. Every new node makes the entire fleet stronger.')
			]),
			// Formula
			C('div', { 'class': 'c3-mesh-formula' }, [
				C('span', { 'style': 'color:var(--yellow);' }, 'N nodes'),
				C('span', { 'style': 'color:var(--muted);margin:0 8px;' }, '\u00D7'),
				C('span', { 'style': 'color:var(--yellow);' }, 'N peers'),
				C('span', { 'style': 'color:var(--muted);margin:0 8px;' }, '='),
				C('span', { 'style': 'color:var(--orange);' }, 'N\u00B2 protection \uD83D\uDEE1\uFE0F')
			]),
			// Nodes
			C('div', { 'class': 'c3-mesh-nodes' }, [
				MeshNode('\uD83C\uDFE0', 'Home GW', 'ONLINE', 'var(--green)'),
				MeshNode('\uD83C\uDFE2', 'Office HQ', 'ONLINE', 'var(--green)'),
				MeshNode('\uD83D\uDCE1', 'Edge Node', 'SYNCING', 'var(--yellow)'),
				MeshNode('\uD83C\uDF0D', 'Remote', 'ONLINE', 'var(--green)')
			]),
			// Features
			C('div', { 'class': 'c3-mesh-feats' }, [
				MeshFeat('\uD83D\uDD17', 'WireGuard Mesh', 'Auto-peering \uD83E\uDD1D\nKey rotation \uD83D\uDD11\nTrust scoring \u2B50\ndid:plc identity'),
				MeshFeat('\uD83E\uDDE0', 'Shared Intel', 'CrowdSec decisions \uD83D\uDCE4\nThreat feeds sync \uD83D\uDD04\nBlocklist fusion \uD83D\uDCCB\nReal-time alerts \uD83D\uDEA8'),
				MeshFeat('\uD83D\uDE80', 'MaaS Deploy', 'Master \u2192 fleet push \uD83D\uDCE1\nConfig sync \uD83D\uDD04\nLanding pages\ngk2.secubox.in \uD83C\uDF0D'),
				MeshFeat('\uD83C\uDFC5', 'ANSSI Path', 'CSPN certification\nENISA compliance \u2705\nAudit trail \uD83D\uDCDC\nSovereign \uD83C\uDDEB\uD83C\uDDF7')
			])
		]);
	},

	// ========== LIVE UPDATE (Async Progressive) ==========
	updateLiveData: function() {
		var self = this;

		// Async fetch - updates DOM on completion
		callSystemInfo().then(function(data) {
			C3_CACHE.set('sysInfo', data);
			self.updateSysInfo(data);
		}).catch(function() {});

		// Flash refresh badge
		var badge = document.getElementById('c3-refresh-badge');
		if (badge) {
			badge.style.opacity = badge.style.opacity === '0.3' ? '1' : '0.3';
		}
	},

	formatUptime: function(seconds) {
		if (!seconds) return '--';
		var d = Math.floor(seconds / 86400);
		var h = Math.floor((seconds % 86400) / 3600);
		var m = Math.floor((seconds % 3600) / 60);
		if (d > 0) return d + 'd ' + h + 'h';
		if (h > 0) return h + 'h ' + m + 'm';
		return m + 'm';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
