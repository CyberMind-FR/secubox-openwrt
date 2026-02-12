'use strict';
'require view';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.magicmirror2', method: 'status', expect: {} });
var callInstall = rpc.declare({ object: 'luci.magicmirror2', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.magicmirror2', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.magicmirror2', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.magicmirror2', method: 'restart', expect: {} });

var css = '.mm-container{max-width:900px;margin:0 auto}.mm-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;color:#fff;margin-bottom:1.5rem}.mm-header h2{margin:0;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}.mm-status{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:20px;font-size:.9rem}.mm-status.running{background:rgba(16,185,129,.2)}.mm-status.stopped{background:rgba(239,68,68,.2)}.mm-dot{width:10px;height:10px;border-radius:50%;animation:pulse 2s infinite}.mm-status.running .mm-dot{background:#10b981}.mm-status.stopped .mm-dot{background:#ef4444}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.mm-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:1rem}.mm-card-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.mm-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.mm-info-item{padding:1rem;background:#f8f9fa;border-radius:8px}.mm-info-label{font-size:.8rem;color:#666;margin-bottom:.25rem}.mm-info-value{font-size:1rem;font-weight:500}.mm-actions{display:flex;gap:.75rem;flex-wrap:wrap}.mm-btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .2s}.mm-btn-primary{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff}.mm-btn-success{background:#10b981;color:#fff}.mm-btn-danger{background:#ef4444;color:#fff}.mm-btn:disabled{opacity:.5;cursor:not-allowed}.mm-not-installed{text-align:center;padding:3rem}.mm-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin:1.5rem 0}.mm-feature{padding:.75rem;background:#e0e7ff;border-radius:8px;font-size:.9rem}';

return view.extend({
	load: function() { return callStatus(); },

	handleInstall: function() {
		ui.showModal(_('Installing MagicMirror'), [E('p', { 'class': 'spinning' }, _('Installing...'))]);
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
		if (!document.getElementById('mm-styles')) {
			var s = document.createElement('style'); s.id = 'mm-styles'; s.textContent = css; document.head.appendChild(s);
		}

		if (!status.installed || !status.docker_available) {
			var content = E('div', { 'class': 'mm-container' }, [
				E('div', { 'class': 'mm-header' }, [
					E('h2', {}, ['\uD83E\uDE9E ', _('MagicMirror')]),
					E('div', { 'class': 'mm-status stopped' }, [E('span', { 'class': 'mm-dot' }), _('Not Installed')])
				]),
				E('div', { 'class': 'mm-card' }, [
					E('div', { 'class': 'mm-not-installed' }, [
						E('div', { 'style': 'font-size:4rem;margin-bottom:1rem' }, '\uD83E\uDE9E'),
						E('h3', {}, _('MagicMirror\u00B2')),
						E('p', {}, _('Open source modular smart mirror platform with customizable widgets.')),
						E('div', { 'class': 'mm-features' }, [
							E('div', { 'class': 'mm-feature' }, '\u2600 Weather'),
							E('div', { 'class': 'mm-feature' }, '\uD83D\uDCC5 Calendar'),
							E('div', { 'class': 'mm-feature' }, '\uD83D\uDCF0 News'),
							E('div', { 'class': 'mm-feature' }, '\u23F0 Clock'),
							E('div', { 'class': 'mm-feature' }, '\uD83D\uDDE3 Compliments'),
							E('div', { 'class': 'mm-feature' }, '\uD83D\uDD0C Modules')
						]),
						!status.docker_available ? E('div', { 'style': 'color:#ef4444;margin-bottom:1rem' }, _('Docker required')) : '',
						E('button', { 'class': 'mm-btn mm-btn-primary', 'click': ui.createHandlerFn(this, 'handleInstall'), 'disabled': !status.docker_available }, _('Install MagicMirror'))
					])
				])
			]);
			return KissTheme.wrap([content], 'admin/services/magicmirror2/overview');
		}

		var content = E('div', { 'class': 'mm-container' }, [
			E('div', { 'class': 'mm-header' }, [
				E('h2', {}, ['\uD83E\uDE9E ', _('MagicMirror')]),
				E('div', { 'class': 'mm-status ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'mm-dot' }),
					status.running ? _('Running') : _('Stopped')
				])
			]),
			E('div', { 'class': 'mm-card' }, [
				E('div', { 'class': 'mm-card-title' }, ['\u2139\uFE0F ', _('Configuration')]),
				E('div', { 'class': 'mm-info-grid' }, [
					E('div', { 'class': 'mm-info-item' }, [E('div', { 'class': 'mm-info-label' }, _('Port')), E('div', { 'class': 'mm-info-value' }, String(status.port))]),
					E('div', { 'class': 'mm-info-item' }, [E('div', { 'class': 'mm-info-label' }, _('Data Path')), E('div', { 'class': 'mm-info-value' }, status.data_path)]),
					E('div', { 'class': 'mm-info-item' }, [E('div', { 'class': 'mm-info-label' }, _('Access')), E('div', { 'class': 'mm-info-value' }, [E('a', { 'href': 'http://' + window.location.hostname + ':' + status.port, 'target': '_blank' }, _('Open Mirror'))])])
				])
			]),
			E('div', { 'class': 'mm-card' }, [
				E('div', { 'class': 'mm-card-title' }, ['\u26A1 ', _('Actions')]),
				E('div', { 'class': 'mm-actions' }, [
					E('button', { 'class': 'mm-btn mm-btn-success', 'click': ui.createHandlerFn(this, 'handleStart'), 'disabled': status.running }, _('Start')),
					E('button', { 'class': 'mm-btn mm-btn-danger', 'click': ui.createHandlerFn(this, 'handleStop'), 'disabled': !status.running }, _('Stop'))
				])
			])
		]);
		return KissTheme.wrap([content], 'admin/services/magicmirror2/overview');
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
