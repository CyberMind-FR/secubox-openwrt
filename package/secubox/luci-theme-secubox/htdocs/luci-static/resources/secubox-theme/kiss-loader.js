'use strict';

/**
 * KISS Mode Auto-Loader
 * Automatically enables KISS mode if previously enabled via localStorage
 * Include this script in the LuCI header/footer to enable global KISS mode
 */

(function() {
	// Check if KISS mode is enabled
	var kissEnabled = false;
	try {
		kissEnabled = window.localStorage.getItem('secubox.kissMode') === '1';
	} catch (e) {}

	// Early CSS injection for flicker-free loading
	if (kissEnabled) {
		var css = ':root{--kiss-bg:#0a0e17;--kiss-bg2:#111827;--kiss-card:#161e2e;--kiss-line:#1e293b;--kiss-text:#e2e8f0;--kiss-muted:#94a3b8;--kiss-green:#00C853}body{background:var(--kiss-bg)!important;color:var(--kiss-text)!important}#mainmenu,.main-left,header,footer,#topmenu,#tabmenu,nav[role="navigation"],aside{display:none!important}.main-right,#maincontent,.container{margin-left:200px!important;background:var(--kiss-bg)!important}';
		var style = document.createElement('style');
		style.id = 'kiss-early-css';
		style.textContent = css;
		document.head.appendChild(style);
	}

	// Full initialization after DOM ready
	function initKiss() {
		// Load the theme module and initialize KISS mode
		if (typeof L !== 'undefined' && L.require) {
			L.require('secubox-theme/theme').then(function(Theme) {
				Theme.initKissMode();
			}).catch(function() {
				// Fallback: manual initialization
				manualKissInit();
			});
		} else {
			manualKissInit();
		}
	}

	// Manual KISS initialization without LuCI loader
	function manualKissInit() {
		if (!kissEnabled) {
			addToggleOnly();
			return;
		}

		// Inject full CSS
		if (!document.querySelector('#kiss-global-css')) {
			var fullCss = '\
.kiss-sidebar{position:fixed;left:0;top:0;bottom:0;width:200px;background:linear-gradient(180deg,#0d1321 0%,var(--kiss-bg) 100%);border-right:1px solid var(--kiss-line);z-index:1000;display:flex;flex-direction:column;overflow-y:auto}\
.kiss-sidebar-logo{padding:16px;border-bottom:1px solid var(--kiss-line);text-align:center}\
.kiss-logo-text{font-weight:900;font-size:24px;letter-spacing:-1px}\
.kiss-logo-sub{font-size:9px;color:var(--kiss-muted);letter-spacing:2px;margin-top:4px}\
.kiss-nav{flex:1;padding:8px 0}\
.kiss-nav-section{padding:8px 12px 4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--kiss-muted)}\
.kiss-nav-item{display:flex;align-items:center;gap:10px;padding:8px 16px;text-decoration:none;font-size:13px;color:var(--kiss-muted);transition:all 0.2s;border-left:2px solid transparent}\
.kiss-nav-item:hover{background:rgba(255,255,255,0.03);color:var(--kiss-text)}\
.kiss-nav-item.active{color:var(--kiss-green);background:rgba(0,200,83,0.05);border-left-color:var(--kiss-green)}\
.kiss-nav-icon{font-size:16px;width:20px;text-align:center}\
body.kiss-mode .cbi-section{background:var(--kiss-card)!important;border:1px solid var(--kiss-line)!important;border-radius:12px!important;padding:20px!important}\
body.kiss-mode .table th,body.kiss-mode table th{background:var(--kiss-bg2)!important;color:var(--kiss-muted)!important;border-color:var(--kiss-line)!important}\
body.kiss-mode .table td,body.kiss-mode table td{border-color:var(--kiss-line)!important;color:var(--kiss-text)!important}\
body.kiss-mode .cbi-button,body.kiss-mode button{background:var(--kiss-bg2)!important;border:1px solid var(--kiss-line)!important;color:var(--kiss-text)!important;border-radius:8px!important}\
body.kiss-mode input,body.kiss-mode select{background:var(--kiss-bg2)!important;border:1px solid var(--kiss-line)!important;color:var(--kiss-text)!important;border-radius:6px!important}\
#kiss-toggle{position:fixed;top:10px;right:10px;z-index:99999;font-size:28px;cursor:pointer;opacity:0.7;transition:all 0.3s;background:rgba(0,0,0,0.6);border-radius:50%;width:46px;height:46px;display:flex;align-items:center;justify-content:center;border:1px solid var(--kiss-line)}\
#kiss-toggle:hover{opacity:1;transform:scale(1.1)}\
@media(max-width:768px){.kiss-sidebar{width:60px}.kiss-sidebar-logo,.kiss-nav-section{display:none}.kiss-nav-item{padding:12px;justify-content:center}.kiss-nav-item span:last-child{display:none}body.kiss-mode .main-right,body.kiss-mode #maincontent{margin-left:60px!important}}\
@media(max-width:480px){.kiss-sidebar{display:none}body.kiss-mode .main-right,body.kiss-mode #maincontent{margin-left:0!important}}\
';
			var style = document.createElement('style');
			style.id = 'kiss-global-css';
			style.textContent = fullCss;
			document.head.appendChild(style);
		}

		document.body.classList.add('kiss-mode');

		// Inject sidebar
		if (!document.querySelector('.kiss-sidebar')) {
			var nav = [
				{ cat: 'Main', items: [
					{ icon: '🏠', name: 'Home', path: 'admin/secubox-home' },
					{ icon: '📊', name: 'System Hub', path: 'admin/secubox/system/system-hub' }
				]},
				{ cat: 'Security', items: [
					{ icon: '🧙', name: 'InterceptoR', path: 'admin/secubox/interceptor/overview' },
					{ icon: '🛡️', name: 'CrowdSec', path: 'admin/secubox/security/crowdsec' },
					{ icon: '🔍', name: 'mitmproxy', path: 'admin/secubox/security/mitmproxy/status' }
				]},
				{ cat: 'Services', items: [
					{ icon: '📡', name: 'IoT Guard', path: 'admin/secubox/services/iot-guard' },
					{ icon: '💾', name: 'CDN Cache', path: 'admin/services/cdn-cache' },
					{ icon: '🔗', name: 'HAProxy', path: 'admin/services/haproxy' }
				]},
				{ cat: 'Navigate', items: [
					{ icon: '🌳', name: 'LuCI Tree', path: 'admin/secubox/luci-tree' },
					{ icon: '⚙️', name: 'System', path: 'admin/system/system' }
				]}
			];

			var currentPath = window.location.pathname.replace('/cgi-bin/luci/', '');
			var sidebar = document.createElement('nav');
			sidebar.className = 'kiss-sidebar';
			sidebar.innerHTML = '<div class="kiss-sidebar-logo"><div class="kiss-logo-text"><span style="color:#00C853">C</span><span style="color:#FF1744;font-size:14px;vertical-align:super">3</span><span style="color:#2979FF">B</span><span style="color:#37474F">O</span><span style="color:#00C853">X</span></div><div class="kiss-logo-sub">SECUBOX</div></div>';

			var navEl = document.createElement('div');
			navEl.className = 'kiss-nav';

			nav.forEach(function(cat) {
				navEl.innerHTML += '<div class="kiss-nav-section">' + cat.cat + '</div>';
				cat.items.forEach(function(item) {
					var isActive = currentPath.indexOf(item.path) !== -1;
					navEl.innerHTML += '<a href="/cgi-bin/luci/' + item.path + '" class="kiss-nav-item' + (isActive ? ' active' : '') + '"><span class="kiss-nav-icon">' + item.icon + '</span><span>' + item.name + '</span></a>';
				});
			});

			sidebar.appendChild(navEl);
			document.body.insertBefore(sidebar, document.body.firstChild);
		}

		addToggleOnly();
	}

	function addToggleOnly() {
		if (document.querySelector('#kiss-toggle')) return;

		var toggle = document.createElement('div');
		toggle.id = 'kiss-toggle';
		toggle.innerHTML = kissEnabled ? '👁️' : '👁️‍🗨️';
		toggle.title = 'Toggle KISS/LuCI mode (click to switch)';
		toggle.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;font-size:28px;cursor:pointer;opacity:0.7;transition:all 0.3s;background:rgba(0,0,0,0.6);border-radius:50%;width:46px;height:46px;display:flex;align-items:center;justify-content:center;border:1px solid #1e293b';
		toggle.onmouseover = function() { this.style.opacity = '1'; this.style.transform = 'scale(1.1)'; };
		toggle.onmouseout = function() { this.style.opacity = '0.7'; this.style.transform = 'scale(1)'; };
		toggle.onclick = function() {
			try {
				var newState = window.localStorage.getItem('secubox.kissMode') !== '1';
				window.localStorage.setItem('secubox.kissMode', newState ? '1' : '0');
			} catch (e) {}
			window.location.reload();
		};
		document.body.appendChild(toggle);
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initKiss);
	} else {
		initKiss();
	}
})();
