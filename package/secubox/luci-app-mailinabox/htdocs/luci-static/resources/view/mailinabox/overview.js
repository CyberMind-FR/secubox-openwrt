'use strict';
'require view';
'require ui';
'require rpc';
'require poll';

var callStatus = rpc.declare({ object: 'luci.mailinabox', method: 'status', expect: {} });
var callInstall = rpc.declare({ object: 'luci.mailinabox', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.mailinabox', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.mailinabox', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.mailinabox', method: 'restart', expect: {} });

var css = '.mb-container{max-width:900px;margin:0 auto}.mb-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);border-radius:16px;color:#fff;margin-bottom:1.5rem}.mb-header h2{margin:0;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}.mb-status{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:20px;font-size:.9rem}.mb-status.running{background:rgba(16,185,129,.2)}.mb-status.stopped{background:rgba(239,68,68,.2)}.mb-dot{width:10px;height:10px;border-radius:50%;animation:pulse 2s infinite}.mb-status.running .mb-dot{background:#10b981}.mb-status.stopped .mb-dot{background:#ef4444}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.mb-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:1rem}.mb-card-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.mb-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.mb-info-item{padding:1rem;background:#f8f9fa;border-radius:8px}.mb-info-label{font-size:.8rem;color:#666;margin-bottom:.25rem}.mb-info-value{font-size:1rem;font-weight:500}.mb-actions{display:flex;gap:.75rem;flex-wrap:wrap}.mb-btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .2s}.mb-btn-primary{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff}.mb-btn-success{background:#10b981;color:#fff}.mb-btn-danger{background:#ef4444;color:#fff}.mb-btn-secondary{background:#6b7280;color:#fff}.mb-btn:disabled{opacity:.5;cursor:not-allowed}.mb-ports{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1rem}.mb-port{padding:.5rem 1rem;background:#e0e7ff;border-radius:8px;font-size:.85rem}.mb-port-name{font-weight:600;color:#3b82f6}.mb-not-installed{text-align:center;padding:3rem}.mb-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin:1.5rem 0;text-align:left}.mb-feature{padding:.75rem;background:#eff6ff;border-radius:8px;font-size:.9rem}';

return view.extend({
	load: function() { return callStatus(); },

	handleInstall: function() {
		ui.showModal(_('Installing Mail Server'), [E('p', { 'class': 'spinning' }, _('Installing...'))]);
		callInstall().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', r.message || _('Started')));
			else ui.addNotification(null, E('p', _('Failed: ') + r.error), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStart: function() {
		ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Starting...'))]);
		callStart().then(function(r) { ui.hideModal(); ui.addNotification(null, E('p', _('Started'))); })
		.catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStop: function() {
		ui.showModal(_('Stopping...'), [E('p', { 'class': 'spinning' }, _('Stopping...'))]);
		callStop().then(function(r) { ui.hideModal(); ui.addNotification(null, E('p', _('Stopped'))); })
		.catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	render: function(status) {
		if (!document.getElementById('mb-mail-styles')) {
			var s = document.createElement('style'); s.id = 'mb-mail-styles'; s.textContent = css; document.head.appendChild(s);
		}

		if (!status.installed || !status.docker_available) {
			return E('div', { 'class': 'mb-container' }, [
				E('div', { 'class': 'mb-header' }, [
					E('h2', {}, ['\ud83d\udce7 ', _('Mail Server')]),
					E('div', { 'class': 'mb-status stopped' }, [E('span', { 'class': 'mb-dot' }), E('span', {}, _('Not Installed'))])
				]),
				E('div', { 'class': 'mb-card' }, [
					E('div', { 'class': 'mb-not-installed' }, [
						E('div', { 'style': 'font-size:4rem;margin-bottom:1rem' }, '\ud83d\udce7'),
						E('h3', {}, _('Mail-in-a-Box')),
						E('p', {}, _('Self-hosted email server with SMTP, IMAP, spam filtering, and webmail.')),
						E('div', { 'class': 'mb-features' }, [
							E('div', { 'class': 'mb-feature' }, '\ud83d\udce4 SMTP'),
							E('div', { 'class': 'mb-feature' }, '\ud83d\udce5 IMAP'),
							E('div', { 'class': 'mb-feature' }, '\ud83d\udee1 SpamAssassin'),
							E('div', { 'class': 'mb-feature' }, '\ud83d\udd12 SSL/TLS'),
							E('div', { 'class': 'mb-feature' }, '\ud83c\udf10 Webmail'),
							E('div', { 'class': 'mb-feature' }, '\ud83d\udc80 Fail2ban')
						]),
						!status.docker_available ? E('div', { 'style': 'color:#ef4444;margin-bottom:1rem' }, _('Docker required')) : '',
						E('button', { 'class': 'mb-btn mb-btn-primary', 'click': ui.createHandlerFn(this, 'handleInstall'), 'disabled': !status.docker_available }, _('Install Mail Server'))
					])
				])
			]);
		}

		return E('div', { 'class': 'mb-container' }, [
			E('div', { 'class': 'mb-header' }, [
				E('h2', {}, ['\ud83d\udce7 ', _('Mail Server')]),
				E('div', { 'class': 'mb-status ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'mb-dot' }),
					E('span', {}, status.running ? _('Running') : _('Stopped'))
				])
			]),
			E('div', { 'class': 'mb-card' }, [
				E('div', { 'class': 'mb-card-title' }, ['\u2139\ufe0f ', _('Configuration')]),
				E('div', { 'class': 'mb-info-grid' }, [
					E('div', { 'class': 'mb-info-item' }, [E('div', { 'class': 'mb-info-label' }, _('Hostname')), E('div', { 'class': 'mb-info-value' }, status.hostname)]),
					E('div', { 'class': 'mb-info-item' }, [E('div', { 'class': 'mb-info-label' }, _('Domain')), E('div', { 'class': 'mb-info-value' }, status.domain)]),
					E('div', { 'class': 'mb-info-item' }, [E('div', { 'class': 'mb-info-label' }, _('Data Path')), E('div', { 'class': 'mb-info-value' }, status.data_path)])
				]),
				E('div', { 'class': 'mb-ports' }, [
					E('div', { 'class': 'mb-port' }, [E('span', { 'class': 'mb-port-name' }, 'SMTP'), ' :' + status.smtp_port]),
					E('div', { 'class': 'mb-port' }, [E('span', { 'class': 'mb-port-name' }, 'IMAP'), ' :' + status.imap_port]),
					E('div', { 'class': 'mb-port' }, [E('span', { 'class': 'mb-port-name' }, 'IMAPS'), ' :' + status.imaps_port])
				])
			]),
			E('div', { 'class': 'mb-card' }, [
				E('div', { 'class': 'mb-card-title' }, ['\u26a1 ', _('Actions')]),
				E('div', { 'class': 'mb-actions' }, [
					E('button', { 'class': 'mb-btn mb-btn-success', 'click': ui.createHandlerFn(this, 'handleStart'), 'disabled': status.running }, _('Start')),
					E('button', { 'class': 'mb-btn mb-btn-danger', 'click': ui.createHandlerFn(this, 'handleStop'), 'disabled': !status.running }, _('Stop')),
					E('a', { 'href': L.url('admin', 'secubox', 'services', 'mailinabox', 'settings'), 'class': 'mb-btn mb-btn-secondary' }, _('Settings'))
				])
			])
		]);
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
