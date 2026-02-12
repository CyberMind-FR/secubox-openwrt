'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.lyrion', method: 'status', expect: {} });
var callInstall = rpc.declare({ object: 'luci.lyrion', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.lyrion', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.lyrion', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.lyrion', method: 'restart', expect: {} });

var css = '.ly-container{max-width:900px;margin:0 auto}.ly-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);border-radius:16px;color:#fff;margin-bottom:1.5rem}.ly-header h2{margin:0;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}.ly-status{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:20px;font-size:.9rem}.ly-status.running{background:rgba(16,185,129,.2)}.ly-status.stopped{background:rgba(239,68,68,.2)}.ly-status.installing{background:rgba(245,158,11,.2)}.ly-dot{width:10px;height:10px;border-radius:50%;animation:pulse 2s infinite}.ly-status.running .ly-dot{background:#10b981}.ly-status.stopped .ly-dot{background:#ef4444}.ly-status.installing .ly-dot{background:#f59e0b}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.ly-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:1rem}.ly-card-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.ly-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}.ly-info-item{padding:1rem;background:#f8f9fa;border-radius:8px}.ly-info-label{font-size:.8rem;color:#666;margin-bottom:.25rem}.ly-info-value{font-size:1.1rem;font-weight:500}.ly-actions{display:flex;gap:.75rem;flex-wrap:wrap}.ly-btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .2s}.ly-btn-primary{background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff}.ly-btn-primary:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(139,92,246,.3)}.ly-btn-success{background:#10b981;color:#fff}.ly-btn-danger{background:#ef4444;color:#fff}.ly-btn-secondary{background:#6b7280;color:#fff}.ly-btn:disabled{opacity:.5;cursor:not-allowed}.ly-webui{display:flex;align-items:center;gap:1rem;padding:1rem;background:linear-gradient(135deg,rgba(236,72,153,.1),rgba(139,92,246,.1));border-radius:12px;margin-top:1rem}.ly-webui-icon{font-size:2rem}.ly-webui-info{flex:1}.ly-webui-url{font-family:monospace;color:#8b5cf6}.ly-not-installed{text-align:center;padding:3rem}.ly-not-installed h3{margin-bottom:1rem;color:#333}.ly-not-installed p{color:#666;margin-bottom:1.5rem}';

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
		var badge = document.querySelector('.ly-status');
		var dot = document.querySelector('.ly-dot');
		var statusText = document.querySelector('.ly-status-text');

		if (badge && statusText) {
			badge.className = 'ly-status ' + (status.running ? 'running' : 'stopped');
			statusText.textContent = status.running ? _('Running') : _('Stopped');
		}

		// Update info values
		var updates = {
			'.ly-val-runtime': status.detected_runtime || 'none',
			'.ly-val-port': status.port || '9000',
			'.ly-val-memory': status.memory_limit || '256M'
		};
		Object.keys(updates).forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.textContent = updates[sel];
		});
	},

	handleInstall: function() {
		var self = this;
		ui.showModal(_('Installing Lyrion'), [
			E('p', { 'class': 'spinning' }, _('Installing Lyrion Music Server. This may take several minutes...'))
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
		ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Starting Lyrion...'))]);
		callStart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', _('Lyrion started')));
			else ui.addNotification(null, E('p', _('Failed to start')), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStop: function() {
		ui.showModal(_('Stopping...'), [E('p', { 'class': 'spinning' }, _('Stopping Lyrion...'))]);
		callStop().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', _('Lyrion stopped')));
			else ui.addNotification(null, E('p', _('Failed to stop')), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleRestart: function() {
		ui.showModal(_('Restarting...'), [E('p', { 'class': 'spinning' }, _('Restarting Lyrion...'))]);
		callRestart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', _('Lyrion restarted')));
			else ui.addNotification(null, E('p', _('Failed to restart')), 'error');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	render: function(status) {
		var self = this;

		if (!document.getElementById('ly-styles')) {
			var s = document.createElement('style');
			s.id = 'ly-styles';
			s.textContent = css;
			document.head.appendChild(s);
		}

		// Not installed view
		if (!status.installed) {
			var content = E('div', { 'class': 'ly-container' }, [
				E('div', { 'class': 'ly-header' }, [
					E('h2', {}, ['\ud83c\udfb5 ', _('Lyrion Music Server')]),
					E('div', { 'class': 'ly-status stopped' }, [
						E('span', { 'class': 'ly-dot' }),
						E('span', { 'class': 'ly-status-text' }, _('Not Installed'))
					])
				]),
				E('div', { 'class': 'ly-card' }, [
					E('div', { 'class': 'ly-not-installed' }, [
						E('div', { 'style': 'font-size:4rem;margin-bottom:1rem' }, '\ud83c\udfb5'),
						E('h3', {}, _('Lyrion Music Server')),
						E('p', {}, _('Self-hosted music streaming with Squeezebox/Logitech Media Server compatibility. Stream your music library to any device.')),
						E('div', { 'class': 'ly-info-grid', 'style': 'margin-bottom:1.5rem;text-align:left' }, [
							E('div', { 'class': 'ly-info-item' }, [
								E('div', { 'class': 'ly-info-label' }, _('Runtime')),
								E('div', { 'class': 'ly-info-value' }, status.detected_runtime === 'lxc' ? 'LXC Container' : status.detected_runtime === 'docker' ? 'Docker' : _('None detected'))
							]),
							E('div', { 'class': 'ly-info-item' }, [
								E('div', { 'class': 'ly-info-label' }, _('Data Path')),
								E('div', { 'class': 'ly-info-value' }, status.data_path || '/srv/lyrion')
							]),
							E('div', { 'class': 'ly-info-item' }, [
								E('div', { 'class': 'ly-info-label' }, _('Media Path')),
								E('div', { 'class': 'ly-info-value' }, status.media_path || '/srv/media')
							])
						]),
						E('button', {
							'class': 'ly-btn ly-btn-primary',
							'click': ui.createHandlerFn(this, 'handleInstall'),
							'disabled': status.detected_runtime === 'none'
						}, _('Install Lyrion'))
					])
				])
			]);
			return KissTheme.wrap(content, 'admin/secubox/services/lyrion');
		}

		// Installed view
		this.startPolling();

		var content = E('div', { 'class': 'ly-container' }, [
			E('div', { 'class': 'ly-header' }, [
				E('h2', {}, ['\ud83c\udfb5 ', _('Lyrion Music Server')]),
				E('div', { 'class': 'ly-status ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'ly-dot' }),
					E('span', { 'class': 'ly-status-text' }, status.running ? _('Running') : _('Stopped'))
				])
			]),

			// Info Card
			E('div', { 'class': 'ly-card' }, [
				E('div', { 'class': 'ly-card-title' }, ['\u2139\ufe0f ', _('Service Information')]),
				E('div', { 'class': 'ly-info-grid' }, [
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, _('Runtime')),
						E('div', { 'class': 'ly-info-value ly-val-runtime' }, status.detected_runtime || 'auto')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, _('Port')),
						E('div', { 'class': 'ly-info-value ly-val-port' }, status.port || '9000')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, _('Memory Limit')),
						E('div', { 'class': 'ly-info-value ly-val-memory' }, status.memory_limit || '256M')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, _('Data Path')),
						E('div', { 'class': 'ly-info-value' }, status.data_path || '/srv/lyrion')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, _('Media Path')),
						E('div', { 'class': 'ly-info-value' }, status.media_path || '/srv/media')
					])
				]),

				// Web UI Link
				status.running && status.web_accessible ? E('div', { 'class': 'ly-webui' }, [
					E('div', { 'class': 'ly-webui-icon' }, '\ud83c\udf10'),
					E('div', { 'class': 'ly-webui-info' }, [
						E('div', { 'style': 'font-weight:600' }, _('Web Interface')),
						E('div', { 'class': 'ly-webui-url' }, status.web_url)
					]),
					E('a', {
						'href': status.web_url,
						'target': '_blank',
						'class': 'ly-btn ly-btn-primary'
					}, _('Open'))
				]) : ''
			]),

			// Actions Card
			E('div', { 'class': 'ly-card' }, [
				E('div', { 'class': 'ly-card-title' }, ['\u26a1 ', _('Actions')]),
				E('div', { 'class': 'ly-actions' }, [
					E('button', {
						'class': 'ly-btn ly-btn-success',
						'click': ui.createHandlerFn(this, 'handleStart'),
						'disabled': status.running
					}, _('Start')),
					E('button', {
						'class': 'ly-btn ly-btn-danger',
						'click': ui.createHandlerFn(this, 'handleStop'),
						'disabled': !status.running
					}, _('Stop')),
					E('button', {
						'class': 'ly-btn ly-btn-secondary',
						'click': ui.createHandlerFn(this, 'handleRestart'),
						'disabled': !status.running
					}, _('Restart')),
					E('a', {
						'href': L.url('admin', 'secubox', 'services', 'lyrion', 'settings'),
						'class': 'ly-btn ly-btn-secondary'
					}, _('Settings'))
				])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/lyrion');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
