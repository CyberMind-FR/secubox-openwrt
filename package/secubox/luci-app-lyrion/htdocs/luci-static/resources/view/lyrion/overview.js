'use strict';
'require view';
'require ui';
'require rpc';
'require poll';

var callStatus = rpc.declare({ object: 'luci.lyrion', method: 'status', expect: {} });
var callLibraryStats = rpc.declare({ object: 'luci.lyrion', method: 'get_library_stats', expect: {} });
var callInstall = rpc.declare({ object: 'luci.lyrion', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.lyrion', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.lyrion', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.lyrion', method: 'restart', expect: {} });
var callRescan = rpc.declare({ object: 'luci.lyrion', method: 'rescan', expect: {} });

var css = `
.ly-container{max-width:1000px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.ly-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%);border-radius:16px;color:#fff;margin-bottom:1.5rem}
.ly-header h2{margin:0;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}
.ly-status{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:20px;font-size:.9rem}
.ly-status.running{background:rgba(16,185,129,.3)}
.ly-status.stopped{background:rgba(239,68,68,.3)}
.ly-dot{width:10px;height:10px;border-radius:50%;animation:pulse 2s infinite}
.ly-status.running .ly-dot{background:#10b981}
.ly-status.stopped .ly-dot{background:#ef4444}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

.ly-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
@media(max-width:768px){.ly-stats-grid{grid-template-columns:repeat(2,1fr)}}
.ly-stat-card{background:linear-gradient(135deg,#1e1e2e,#2d2d44);border-radius:12px;padding:1.25rem;text-align:center;color:#fff}
.ly-stat-value{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#ec4899,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ly-stat-label{font-size:.85rem;color:#a0a0b0;margin-top:.25rem}

.ly-scan-bar{background:#1e1e2e;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.5rem;color:#fff}
.ly-scan-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}
.ly-scan-title{font-weight:600;display:flex;align-items:center;gap:.5rem}
.ly-scan-phase{font-size:.85rem;color:#a0a0b0}
.ly-progress-track{height:8px;background:#333;border-radius:4px;overflow:hidden}
.ly-progress-bar{height:100%;background:linear-gradient(90deg,#ec4899,#8b5cf6);border-radius:4px;transition:width .3s}
.ly-scan-idle{color:#10b981}

.ly-card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:1rem}
.ly-card-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.ly-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}
.ly-info-item{padding:1rem;background:#f8f9fa;border-radius:8px}
.ly-info-label{font-size:.8rem;color:#666;margin-bottom:.25rem}
.ly-info-value{font-size:1.1rem;font-weight:500}

.ly-actions{display:flex;gap:.75rem;flex-wrap:wrap}
.ly-btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-weight:500;transition:all .2s}
.ly-btn-primary{background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff}
.ly-btn-primary:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(139,92,246,.3)}
.ly-btn-success{background:#10b981;color:#fff}
.ly-btn-danger{background:#ef4444;color:#fff}
.ly-btn-secondary{background:#6b7280;color:#fff}
.ly-btn:disabled{opacity:.5;cursor:not-allowed}

.ly-webui{display:flex;align-items:center;gap:1rem;padding:1rem;background:linear-gradient(135deg,rgba(236,72,153,.1),rgba(139,92,246,.1));border-radius:12px;margin-top:1rem}
.ly-webui-icon{font-size:2rem}
.ly-webui-info{flex:1}
.ly-webui-url{font-family:monospace;color:#8b5cf6}

.ly-not-installed{text-align:center;padding:3rem}
.ly-not-installed h3{margin-bottom:1rem;color:#333}
.ly-not-installed p{color:#666;margin-bottom:1.5rem}
`;

return view.extend({
	pollActive: true,
	libraryStats: null,

	load: function() {
		return Promise.all([callStatus(), callLibraryStats()]);
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;
		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();
			return Promise.all([callStatus(), callLibraryStats()]).then(L.bind(function(results) {
				this.updateStatus(results[0]);
				this.updateLibraryStats(results[1]);
			}, this));
		}, this), 3);
	},

	updateStatus: function(status) {
		var badge = document.querySelector('.ly-status');
		var statusText = document.querySelector('.ly-status-text');

		if (badge && statusText) {
			badge.className = 'ly-status ' + (status.running ? 'running' : 'stopped');
			statusText.textContent = status.running ? 'Running' : 'Stopped';
		}
	},

	updateLibraryStats: function(stats) {
		if (!stats) return;
		this.libraryStats = stats;

		// Update stat cards
		var songEl = document.querySelector('.ly-stat-songs');
		var albumEl = document.querySelector('.ly-stat-albums');
		var artistEl = document.querySelector('.ly-stat-artists');
		var genreEl = document.querySelector('.ly-stat-genres');

		if (songEl) songEl.textContent = this.formatNumber(stats.songs || 0);
		if (albumEl) albumEl.textContent = this.formatNumber(stats.albums || 0);
		if (artistEl) artistEl.textContent = this.formatNumber(stats.artists || 0);
		if (genreEl) genreEl.textContent = this.formatNumber(stats.genres || 0);

		// Update scan progress
		var scanBar = document.querySelector('.ly-scan-bar');
		if (scanBar) {
			if (stats.scanning) {
				var pct = stats.scan_total > 0 ? Math.round((stats.scan_progress / stats.scan_total) * 100) : 0;
				scanBar.innerHTML = this.renderScanProgress(stats.scan_phase, pct, stats.scan_progress, stats.scan_total);
			} else {
				scanBar.innerHTML = '<div class="ly-scan-header"><span class="ly-scan-title ly-scan-idle">Library Ready</span><span class="ly-scan-phase">DB: ' + (stats.db_size || '0') + '</span></div>';
			}
		}
	},

	formatNumber: function(n) {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return n.toString();
	},

	renderScanProgress: function(phase, pct, done, total) {
		return '<div class="ly-scan-header">' +
			'<span class="ly-scan-title"><span style="animation:pulse 1s infinite">⏳</span> Scanning...</span>' +
			'<span class="ly-scan-phase">' + (phase || 'Processing') + ' (' + done + '/' + total + ')</span>' +
			'</div>' +
			'<div class="ly-progress-track"><div class="ly-progress-bar" style="width:' + pct + '%"></div></div>';
	},

	handleInstall: function() {
		var self = this;
		ui.showModal('Installing Lyrion', [
			E('p', { 'class': 'spinning' }, 'Installing Lyrion Music Server. This may take several minutes...')
		]);
		callInstall().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || 'Installation started'));
				self.startPolling();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown error')), 'error');
			}
		});
	},

	handleStart: function() {
		ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting Lyrion...')]);
		callStart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', 'Lyrion started'));
		});
	},

	handleStop: function() {
		ui.showModal('Stopping...', [E('p', { 'class': 'spinning' }, 'Stopping Lyrion...')]);
		callStop().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', 'Lyrion stopped'));
		});
	},

	handleRestart: function() {
		ui.showModal('Restarting...', [E('p', { 'class': 'spinning' }, 'Restarting Lyrion...')]);
		callRestart().then(function(r) {
			ui.hideModal();
			if (r.success) ui.addNotification(null, E('p', 'Lyrion restarted'));
		});
	},

	handleRescan: function() {
		callRescan().then(function(r) {
			if (r.success) ui.addNotification(null, E('p', 'Library rescan started'));
		});
	},

	render: function(data) {
		var status = data[0] || {};
		var stats = data[1] || {};
		this.libraryStats = stats;

		if (!document.getElementById('ly-styles')) {
			var s = document.createElement('style');
			s.id = 'ly-styles';
			s.textContent = css;
			document.head.appendChild(s);
		}

		// Not installed view
		if (!status.installed) {
			return E('div', { 'class': 'ly-container' }, [
				E('div', { 'class': 'ly-header' }, [
					E('h2', {}, ['🎵 ', 'Lyrion Music Server']),
					E('div', { 'class': 'ly-status stopped' }, [
						E('span', { 'class': 'ly-dot' }),
						E('span', { 'class': 'ly-status-text' }, 'Not Installed')
					])
				]),
				E('div', { 'class': 'ly-card' }, [
					E('div', { 'class': 'ly-not-installed' }, [
						E('div', { 'style': 'font-size:4rem;margin-bottom:1rem' }, '🎵'),
						E('h3', {}, 'Lyrion Music Server'),
						E('p', {}, 'Self-hosted music streaming with Squeezebox compatibility.'),
						E('button', {
							'class': 'ly-btn ly-btn-primary',
							'click': ui.createHandlerFn(this, 'handleInstall'),
							'disabled': status.detected_runtime === 'none'
						}, 'Install Lyrion')
					])
				])
			]);
		}

		// Installed view
		this.startPolling();

		return E('div', { 'class': 'ly-container' }, [
			E('div', { 'class': 'ly-header' }, [
				E('h2', {}, ['🎵 ', 'Lyrion Music Server']),
				E('div', { 'class': 'ly-status ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'ly-dot' }),
					E('span', { 'class': 'ly-status-text' }, status.running ? 'Running' : 'Stopped')
				])
			]),

			// Stats Grid
			E('div', { 'class': 'ly-stats-grid' }, [
				E('div', { 'class': 'ly-stat-card' }, [
					E('div', { 'class': 'ly-stat-value ly-stat-songs' }, this.formatNumber(stats.songs || 0)),
					E('div', { 'class': 'ly-stat-label' }, 'Songs')
				]),
				E('div', { 'class': 'ly-stat-card' }, [
					E('div', { 'class': 'ly-stat-value ly-stat-albums' }, this.formatNumber(stats.albums || 0)),
					E('div', { 'class': 'ly-stat-label' }, 'Albums')
				]),
				E('div', { 'class': 'ly-stat-card' }, [
					E('div', { 'class': 'ly-stat-value ly-stat-artists' }, this.formatNumber(stats.artists || 0)),
					E('div', { 'class': 'ly-stat-label' }, 'Artists')
				]),
				E('div', { 'class': 'ly-stat-card' }, [
					E('div', { 'class': 'ly-stat-value ly-stat-genres' }, this.formatNumber(stats.genres || 0)),
					E('div', { 'class': 'ly-stat-label' }, 'Genres')
				])
			]),

			// Scan Progress Bar
			E('div', { 'class': 'ly-scan-bar' },
				stats.scanning ?
					this.renderScanProgress(stats.scan_phase,
						stats.scan_total > 0 ? Math.round((stats.scan_progress / stats.scan_total) * 100) : 0,
						stats.scan_progress, stats.scan_total) :
					'<div class="ly-scan-header"><span class="ly-scan-title ly-scan-idle">✓ Library Ready</span><span class="ly-scan-phase">DB: ' + (stats.db_size || '0') + '</span></div>'
			),

			// Info Card
			E('div', { 'class': 'ly-card' }, [
				E('div', { 'class': 'ly-card-title' }, ['ℹ️ ', 'Service Information']),
				E('div', { 'class': 'ly-info-grid' }, [
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, 'Runtime'),
						E('div', { 'class': 'ly-info-value' }, status.detected_runtime || 'auto')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, 'Port'),
						E('div', { 'class': 'ly-info-value' }, status.port || '9000')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, 'Memory'),
						E('div', { 'class': 'ly-info-value' }, status.memory_limit || '256M')
					]),
					E('div', { 'class': 'ly-info-item' }, [
						E('div', { 'class': 'ly-info-label' }, 'Media Path'),
						E('div', { 'class': 'ly-info-value' }, status.media_path || '/srv/media')
					])
				]),

				// Web UI Link
				status.running && status.web_accessible ? E('div', { 'class': 'ly-webui' }, [
					E('div', { 'class': 'ly-webui-icon' }, '🌐'),
					E('div', { 'class': 'ly-webui-info' }, [
						E('div', { 'style': 'font-weight:600' }, 'Web Interface'),
						E('div', { 'class': 'ly-webui-url' }, status.web_url)
					]),
					E('a', {
						'href': status.web_url,
						'target': '_blank',
						'class': 'ly-btn ly-btn-primary'
					}, 'Open')
				]) : ''
			]),

			// Actions Card
			E('div', { 'class': 'ly-card' }, [
				E('div', { 'class': 'ly-card-title' }, ['⚡ ', 'Actions']),
				E('div', { 'class': 'ly-actions' }, [
					E('button', {
						'class': 'ly-btn ly-btn-success',
						'click': ui.createHandlerFn(this, 'handleStart'),
						'disabled': status.running
					}, 'Start'),
					E('button', {
						'class': 'ly-btn ly-btn-danger',
						'click': ui.createHandlerFn(this, 'handleStop'),
						'disabled': !status.running
					}, 'Stop'),
					E('button', {
						'class': 'ly-btn ly-btn-secondary',
						'click': ui.createHandlerFn(this, 'handleRestart'),
						'disabled': !status.running
					}, 'Restart'),
					E('button', {
						'class': 'ly-btn ly-btn-secondary',
						'click': ui.createHandlerFn(this, 'handleRescan'),
						'disabled': !status.running
					}, 'Rescan Library')
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
