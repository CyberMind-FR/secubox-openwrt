'use strict';
'require view';
'require ui';
'require rpc';

var callStatus = rpc.declare({ object: 'luci.mitmproxy', method: 'status', expect: {} });
var callInstall = rpc.declare({ object: 'luci.mitmproxy', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.mitmproxy', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.mitmproxy', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.mitmproxy', method: 'restart', expect: {} });

var css = '.mp-container{max-width:900px;margin:0 auto}.mp-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);border-radius:16px;color:#fff;margin-bottom:1.5rem}.mp-header h2{margin:0;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}.mp-status{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:20px;font-size:.9rem}.mp-status.running{background:rgba(16,185,129,.2)}.mp-status.stopped{background:rgba(239,68,68,.2)}.mp-dot{width:10px;height:10px;border-radius:50%;animation:pulse 2s infinite}.mp-status.running .mp-dot{background:#10b981}.mp-status.stopped .mp-dot{background:#ef4444}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.mp-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:1rem}.mp-card-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.mp-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.mp-info-item{padding:1rem;background:#f8f9fa;border-radius:8px}.mp-info-label{font-size:.8rem;color:#666;margin-bottom:.25rem}.mp-info-value{font-size:1rem;font-weight:500}.mp-actions{display:flex;gap:.75rem;flex-wrap:wrap}.mp-btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .2s}.mp-btn-primary{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff}.mp-btn-success{background:#10b981;color:#fff}.mp-btn-danger{background:#ef4444;color:#fff}.mp-btn:disabled{opacity:.5;cursor:not-allowed}.mp-not-installed{text-align:center;padding:3rem}.mp-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin:1.5rem 0}.mp-feature{padding:.75rem;background:#fff7ed;border-radius:8px;font-size:.9rem}.mp-warning{background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:1rem;margin-top:1rem;font-size:.9rem;color:#92400e}';

return view.extend({
	load: function() { return callStatus(); },

	handleInstall: function() {
		ui.showModal(_('Installing mitmproxy'), [E('p', { 'class': 'spinning' }, _('Installing...'))]);
		callInstall().then(function(r) {
			ui.hideModal();
			ui.addNotification(null, E('p', r.message || _('Installation started')));
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStart: function() {
		ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Starting...'))]);
		callStart().then(function() { ui.hideModal(); location.reload(); })
		.catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStop: function() {
		ui.showModal(_('Stopping...'), [E('p', { 'class': 'spinning' }, _('Stopping...'))]);
		callStop().then(function() { ui.hideModal(); location.reload(); })
		.catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	render: function(status) {
		if (!document.getElementById('mp-styles')) {
			var s = document.createElement('style'); s.id = 'mp-styles'; s.textContent = css; document.head.appendChild(s);
		}

		if (!status.installed || !status.docker_available) {
			return E('div', { 'class': 'mp-container' }, [
				E('div', { 'class': 'mp-header' }, [
					E('h2', {}, ['\uD83D\uDD0D ', _('mitmproxy')]),
					E('div', { 'class': 'mp-status stopped' }, [E('span', { 'class': 'mp-dot' }), _('Not Installed')])
				]),
				E('div', { 'class': 'mp-card' }, [
					E('div', { 'class': 'mp-not-installed' }, [
						E('div', { 'style': 'font-size:4rem;margin-bottom:1rem' }, '\uD83D\uDD0D'),
						E('h3', {}, _('mitmproxy')),
						E('p', {}, _('Interactive HTTPS proxy for debugging, testing, and security analysis.')),
						E('div', { 'class': 'mp-features' }, [
							E('div', { 'class': 'mp-feature' }, '\uD83D\uDCCA Web UI'),
							E('div', { 'class': 'mp-feature' }, '\uD83D\uDD12 HTTPS'),
							E('div', { 'class': 'mp-feature' }, '\uD83D\uDCDD Logging'),
							E('div', { 'class': 'mp-feature' }, '\uD83D\uDD04 Replay'),
							E('div', { 'class': 'mp-feature' }, '\u2699 Scripting'),
							E('div', { 'class': 'mp-feature' }, '\uD83D\uDCE6 Export')
						]),
						E('div', { 'class': 'mp-warning' }, _('Note: This is a security analysis tool. Only use for legitimate debugging and testing purposes.')),
						!status.docker_available ? E('div', { 'style': 'color:#ef4444;margin:1rem 0' }, _('Docker required')) : '',
						E('button', { 'class': 'mp-btn mp-btn-primary', 'style': 'margin-top:1rem', 'click': ui.createHandlerFn(this, 'handleInstall'), 'disabled': !status.docker_available }, _('Install mitmproxy'))
					])
				])
			]);
		}

		return E('div', { 'class': 'mp-container' }, [
			E('div', { 'class': 'mp-header' }, [
				E('h2', {}, ['\uD83D\uDD0D ', _('mitmproxy')]),
				E('div', { 'class': 'mp-status ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'mp-dot' }),
					status.running ? _('Running') : _('Stopped')
				])
			]),
			E('div', { 'class': 'mp-card' }, [
				E('div', { 'class': 'mp-card-title' }, ['\u2139\uFE0F ', _('Configuration')]),
				E('div', { 'class': 'mp-info-grid' }, [
					E('div', { 'class': 'mp-info-item' }, [E('div', { 'class': 'mp-info-label' }, _('Proxy Port')), E('div', { 'class': 'mp-info-value' }, String(status.proxy_port))]),
					E('div', { 'class': 'mp-info-item' }, [E('div', { 'class': 'mp-info-label' }, _('Web UI Port')), E('div', { 'class': 'mp-info-value' }, String(status.web_port))]),
					E('div', { 'class': 'mp-info-item' }, [E('div', { 'class': 'mp-info-label' }, _('Web UI')), E('div', { 'class': 'mp-info-value' }, [E('a', { 'href': 'http://' + window.location.hostname + ':' + status.web_port, 'target': '_blank' }, _('Open UI'))])])
				])
			]),
			E('div', { 'class': 'mp-card' }, [
				E('div', { 'class': 'mp-card-title' }, ['\u26A1 ', _('Actions')]),
				E('div', { 'class': 'mp-actions' }, [
					E('button', { 'class': 'mp-btn mp-btn-success', 'click': ui.createHandlerFn(this, 'handleStart'), 'disabled': status.running }, _('Start')),
					E('button', { 'class': 'mp-btn mp-btn-danger', 'click': ui.createHandlerFn(this, 'handleStop'), 'disabled': !status.running }, _('Stop'))
				])
			])
		]);
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
