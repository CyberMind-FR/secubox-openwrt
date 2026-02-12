'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.nextcloud', method: 'status', expect: {} });
var callInstall = rpc.declare({ object: 'luci.nextcloud', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.nextcloud', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.nextcloud', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.nextcloud', method: 'restart', expect: {} });

var css = '.nc-container{max-width:900px;margin:0 auto}.nc-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;background:linear-gradient(135deg,#0082c9 0%,#00639b 100%);border-radius:16px;color:#fff;margin-bottom:1.5rem}.nc-header h2{margin:0;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}.nc-status{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:20px;font-size:.9rem}.nc-status.running{background:rgba(16,185,129,.2)}.nc-status.stopped{background:rgba(239,68,68,.2)}.nc-dot{width:10px;height:10px;border-radius:50%;animation:pulse 2s infinite}.nc-status.running .nc-dot{background:#10b981}.nc-status.stopped .nc-dot{background:#ef4444}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.nc-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:1rem}.nc-card-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.nc-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}.nc-info-item{padding:1rem;background:#f8f9fa;border-radius:8px}.nc-info-label{font-size:.8rem;color:#666;margin-bottom:.25rem}.nc-info-value{font-size:1.1rem;font-weight:500}.nc-actions{display:flex;gap:.75rem;flex-wrap:wrap}.nc-btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .2s}.nc-btn-primary{background:linear-gradient(135deg,#0082c9,#00639b);color:#fff}.nc-btn-primary:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,130,201,.3)}.nc-btn-success{background:#10b981;color:#fff}.nc-btn-danger{background:#ef4444;color:#fff}.nc-btn-secondary{background:#6b7280;color:#fff}.nc-btn:disabled{opacity:.5;cursor:not-allowed}.nc-webui{display:flex;align-items:center;gap:1rem;padding:1rem;background:linear-gradient(135deg,rgba(0,130,201,.1),rgba(0,99,155,.1));border-radius:12px;margin-top:1rem}.nc-webui-icon{font-size:2rem}.nc-webui-info{flex:1}.nc-webui-url{font-family:monospace;color:#0082c9}.nc-not-installed{text-align:center;padding:3rem}.nc-not-installed h3{margin-bottom:1rem;color:#333}.nc-not-installed p{color:#666;margin-bottom:1.5rem}.nc-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin:1.5rem 0;text-align:left}.nc-feature{padding:.75rem;background:#f0f9ff;border-radius:8px;font-size:.9rem}';

return view.extend({
	pollActive: true,

	load: function() {
		return callStatus();
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;
		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();
			return callStatus().then(L.bind(function(status) {
				this.updateStatus(status);
			}, this));
		}, this), 5);
	},

	updateStatus: function(status) {
		var badge = document.querySelector('.nc-status');
		var statusText = document.querySelector('.nc-status-text');

		if (badge && statusText) {
			badge.className = 'nc-status ' + (status.running ? 'running' : 'stopped');
			statusText.textContent = status.running ? _('Running') : _('Stopped');
		}
	},

	handleInstall: function() {
		var self = this;
		ui.showModal(_('Installing Nextcloud'), [
			E('p', { 'class': 'spinning' }, _('Installing Nextcloud. This may take several minutes...'))
		]);
		callInstall().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || _('Installation started')));
				self.startPolling();
			} else {
				ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	handleStart: function() {
		ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Starting Nextcloud...'))]);
		callStart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', _('Nextcloud started')));
			else ui.addNotification(null, E('p', _('Failed to start')), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStop: function() {
		ui.showModal(_('Stopping...'), [E('p', { 'class': 'spinning' }, _('Stopping Nextcloud...'))]);
		callStop().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', _('Nextcloud stopped')));
			else ui.addNotification(null, E('p', _('Failed to stop')), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleRestart: function() {
		ui.showModal(_('Restarting...'), [E('p', { 'class': 'spinning' }, _('Restarting Nextcloud...'))]);
		callRestart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', _('Nextcloud restarted')));
			else ui.addNotification(null, E('p', _('Failed to restart')), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	render: function(status) {
		var self = this;

		if (!document.getElementById('nc-styles')) {
			var s = document.createElement('style');
			s.id = 'nc-styles';
			s.textContent = css;
			document.head.appendChild(s);
		}

		// Not installed view
		if (!status.installed || !status.docker_available) {
			var content = E('div', { 'class': 'nc-container' }, [
				E('div', { 'class': 'nc-header' }, [
					E('h2', {}, ['\u2601\ufe0f ', _('Nextcloud')]),
					E('div', { 'class': 'nc-status stopped' }, [
						E('span', { 'class': 'nc-dot' }),
						E('span', { 'class': 'nc-status-text' }, _('Not Installed'))
					])
				]),
				E('div', { 'class': 'nc-card' }, [
					E('div', { 'class': 'nc-not-installed' }, [
						E('div', { 'style': 'font-size:4rem;margin-bottom:1rem' }, '\u2601\ufe0f'),
						E('h3', {}, _('Nextcloud')),
						E('p', {}, _('Self-hosted productivity platform with file sync, calendar, contacts, and more.')),
						E('div', { 'class': 'nc-features' }, [
							E('div', { 'class': 'nc-feature' }, '\ud83d\udcc1 ' + _('File Sync')),
							E('div', { 'class': 'nc-feature' }, '\ud83d\udcc5 ' + _('Calendar')),
							E('div', { 'class': 'nc-feature' }, '\ud83d\udc65 ' + _('Contacts')),
							E('div', { 'class': 'nc-feature' }, '\ud83d\udcdd ' + _('Documents')),
							E('div', { 'class': 'nc-feature' }, '\ud83d\udcf7 ' + _('Photos')),
							E('div', { 'class': 'nc-feature' }, '\ud83d\udd12 ' + _('E2E Encryption'))
						]),
						!status.docker_available ? E('div', { 'style': 'color:#ef4444;margin-bottom:1rem' }, _('Docker is required but not available')) : '',
						E('button', {
							'class': 'nc-btn nc-btn-primary',
							'click': ui.createHandlerFn(this, 'handleInstall'),
							'disabled': !status.docker_available
						}, _('Install Nextcloud'))
					])
				])
			]);
			return KissTheme.wrap(content, 'admin/secubox/services/nextcloud');
		}

		// Installed view
		this.startPolling();

		var content = E('div', { 'class': 'nc-container' }, [
			E('div', { 'class': 'nc-header' }, [
				E('h2', {}, ['\u2601\ufe0f ', _('Nextcloud')]),
				E('div', { 'class': 'nc-status ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'nc-dot' }),
					E('span', { 'class': 'nc-status-text' }, status.running ? _('Running') : _('Stopped'))
				])
			]),

			// Info Card
			E('div', { 'class': 'nc-card' }, [
				E('div', { 'class': 'nc-card-title' }, ['\u2139\ufe0f ', _('Service Information')]),
				E('div', { 'class': 'nc-info-grid' }, [
					E('div', { 'class': 'nc-info-item' }, [
						E('div', { 'class': 'nc-info-label' }, _('Port')),
						E('div', { 'class': 'nc-info-value' }, status.port || '80')
					]),
					E('div', { 'class': 'nc-info-item' }, [
						E('div', { 'class': 'nc-info-label' }, _('Admin User')),
						E('div', { 'class': 'nc-info-value' }, status.admin_user || 'admin')
					]),
					E('div', { 'class': 'nc-info-item' }, [
						E('div', { 'class': 'nc-info-label' }, _('Trusted Domains')),
						E('div', { 'class': 'nc-info-value' }, status.trusted_domains || 'cloud.local')
					]),
					E('div', { 'class': 'nc-info-item' }, [
						E('div', { 'class': 'nc-info-label' }, _('Data Path')),
						E('div', { 'class': 'nc-info-value' }, status.data_path || '/srv/nextcloud')
					])
				]),

				// Web UI Link
				status.running && status.web_accessible ? E('div', { 'class': 'nc-webui' }, [
					E('div', { 'class': 'nc-webui-icon' }, '\ud83c\udf10'),
					E('div', { 'class': 'nc-webui-info' }, [
						E('div', { 'style': 'font-weight:600' }, _('Web Interface')),
						E('div', { 'class': 'nc-webui-url' }, status.web_url)
					]),
					E('a', {
						'href': status.web_url,
						'target': '_blank',
						'class': 'nc-btn nc-btn-primary'
					}, _('Open'))
				]) : ''
			]),

			// Actions Card
			E('div', { 'class': 'nc-card' }, [
				E('div', { 'class': 'nc-card-title' }, ['\u26a1 ', _('Actions')]),
				E('div', { 'class': 'nc-actions' }, [
					E('button', {
						'class': 'nc-btn nc-btn-success',
						'click': ui.createHandlerFn(this, 'handleStart'),
						'disabled': status.running
					}, _('Start')),
					E('button', {
						'class': 'nc-btn nc-btn-danger',
						'click': ui.createHandlerFn(this, 'handleStop'),
						'disabled': !status.running
					}, _('Stop')),
					E('button', {
						'class': 'nc-btn nc-btn-secondary',
						'click': ui.createHandlerFn(this, 'handleRestart'),
						'disabled': !status.running
					}, _('Restart')),
					E('a', {
						'href': L.url('admin', 'secubox', 'services', 'nextcloud', 'settings'),
						'class': 'nc-btn nc-btn-secondary'
					}, _('Settings'))
				])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/nextcloud');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
