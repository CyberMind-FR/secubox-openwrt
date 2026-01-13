'use strict';
'require view';
'require poll';
'require ui';
'require media-flow/api as API';
'require media-flow/nav as NavHelper';
'require secubox-portal/header as SbHeader';

return view.extend({
	title: _('Media Flow Dashboard'),
	pollInterval: 5,

	// Initialize SecuBox dark theme
	initTheme: function() {
		// Set dark theme on document
		document.documentElement.setAttribute('data-theme', 'dark');
		document.body.classList.add('secubox-mode');

		// Apply dark background to body for SecuBox styling
		if (!document.getElementById('mf-theme-styles')) {
			var themeStyle = document.createElement('style');
			themeStyle.id = 'mf-theme-styles';
			themeStyle.textContent = `
				body.secubox-mode { background: #0a0a0f !important; }
				body.secubox-mode .main-right,
				body.secubox-mode #maincontent,
				body.secubox-mode .container { background: transparent !important; }
			`;
			document.head.appendChild(themeStyle);
		}
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	},

	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getActiveStreams(),
			API.getStatsByService()
		]);
	},

	render: function(data) {
		var self = this;

		// Initialize SecuBox dark theme
		this.initTheme();

		var status = data[0] || {};
		var streamsData = data[1] || {};
		var statsByService = data[2] || {};

		var dpiSource = status.dpi_source || 'none';
		var isNdpid = dpiSource === 'ndpid';
		var isNetifyd = dpiSource === 'netifyd';
		var streams = streamsData.streams || [];
		var flowCount = streamsData.flow_count || status.active_flows || status.ndpid_flows || 0;

		// Inject CSS
		var css = `
.mf-dashboard { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e4e4e7; }
.mf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%); border-radius: 16px; border: 1px solid rgba(236, 72, 153, 0.3); }
.mf-logo { display: flex; align-items: center; gap: 12px; }
.mf-logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.mf-logo-text { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.mf-status { display: flex; align-items: center; gap: 16px; }
.mf-status-badge { padding: 8px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.mf-status-badge.running { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
.mf-status-badge.stopped { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.mf-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

.mf-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
@media (max-width: 768px) { .mf-stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .mf-stats-grid { grid-template-columns: 1fr; } }
.mf-stat-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.2s; }
.mf-stat-card:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.12); }
.mf-stat-icon { font-size: 1.5rem; margin-bottom: 8px; }
.mf-stat-value { font-size: 2rem; font-weight: 700; margin-bottom: 4px; }
.mf-stat-value.cyan { color: #06b6d4; }
.mf-stat-value.pink { color: #ec4899; }
.mf-stat-value.green { color: #22c55e; }
.mf-stat-value.yellow { color: #fbbf24; }
.mf-stat-label { font-size: 0.875rem; color: #a1a1aa; }

.mf-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
.mf-card-header { padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; }
.mf-card-title { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.mf-card-badge { font-size: 0.75rem; padding: 4px 10px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; color: #a1a1aa; }
.mf-card-body { padding: 20px; }

.mf-notice { padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.mf-notice.success { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #e4e4e7; }
.mf-notice.warning { background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #e4e4e7; }
.mf-notice.error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #e4e4e7; }
.mf-notice-icon { font-size: 1.25rem; }
.mf-notice-text strong { color: #22c55e; }
.mf-notice.warning .mf-notice-text strong { color: #fbbf24; }
.mf-notice.error .mf-notice-text strong { color: #ef4444; }

.mf-empty { text-align: center; padding: 48px 20px; color: #71717a; }
.mf-empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; }
.mf-empty-text { font-size: 1rem; }

.mf-streams-table { width: 100%; border-collapse: collapse; overflow-x: auto; }
@media (max-width: 768px) { .mf-streams-table { font-size: 0.85rem; } .mf-streams-table th, .mf-streams-table td { padding: 10px 8px; } }
@media (max-width: 480px) { .mf-card-body { padding: 12px; overflow-x: auto; } .mf-streams-table { font-size: 0.75rem; } .mf-streams-table th, .mf-streams-table td { padding: 8px 4px; } }
.mf-streams-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; color: #71717a; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.mf-streams-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.mf-streams-table tr:hover td { background: rgba(255, 255, 255, 0.03); }
.mf-quality-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: white; }

.mf-btn { padding: 10px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
.mf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.mf-btn.spinning::after { content: ''; animation: spin 1s linear infinite; display: inline-block; margin-left: 8px; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.mf-loading { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.mf-btn-primary { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; }
.mf-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.mf-btn-secondary { background: rgba(255, 255, 255, 0.1); color: #e4e4e7; border: 1px solid rgba(255, 255, 255, 0.2); }
.mf-btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }

.mf-controls { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
`;

		var view = E('div', { 'class': 'mf-dashboard' }, [
			E('style', {}, css),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('media-flow/common.css') }),
			NavHelper.renderTabs('dashboard'),

			// Header
			E('div', { 'class': 'mf-header' }, [
				E('div', { 'class': 'mf-logo' }, [
					E('div', { 'class': 'mf-logo-icon' }, '🎬'),
					E('span', { 'class': 'mf-logo-text' }, 'Media Flow')
				]),
				E('div', { 'class': 'mf-status' }, [
					E('div', { 'class': 'mf-status-badge ' + (isNdpid || isNetifyd ? 'running' : 'stopped') }, [
						E('span', { 'class': 'mf-status-dot' }),
						isNdpid ? 'nDPId Active' : (isNetifyd ? 'Netifyd Active' : 'No DPI')
					])
				])
			]),

			// Stats Grid
			E('div', { 'class': 'mf-stats-grid' }, [
				E('div', { 'class': 'mf-stat-card' }, [
					E('div', { 'class': 'mf-stat-icon' }, '📊'),
					E('div', { 'class': 'mf-stat-value cyan', 'id': 'mf-total-flows' }, String(flowCount)),
					E('div', { 'class': 'mf-stat-label' }, 'Total Flows')
				]),
				E('div', { 'class': 'mf-stat-card' }, [
					E('div', { 'class': 'mf-stat-icon' }, '🎬'),
					E('div', { 'class': 'mf-stat-value pink', 'id': 'mf-stream-count' }, String(streams.length)),
					E('div', { 'class': 'mf-stat-label' }, 'Active Streams')
				]),
				E('div', { 'class': 'mf-stat-card' }, [
					E('div', { 'class': 'mf-stat-icon' }, '🔍'),
					E('div', { 'class': 'mf-stat-value green' }, status.ndpid_running ? '✓' : '✗'),
					E('div', { 'class': 'mf-stat-label' }, 'nDPId')
				]),
				E('div', { 'class': 'mf-stat-card' }, [
					E('div', { 'class': 'mf-stat-icon' }, '📡'),
					E('div', { 'class': 'mf-stat-value yellow' }, status.netifyd_running ? '✓' : '✗'),
					E('div', { 'class': 'mf-stat-label' }, 'Netifyd')
				])
			]),

			// DPI Notice
			isNdpid ? E('div', { 'class': 'mf-notice success' }, [
				E('span', { 'class': 'mf-notice-icon' }, '✅'),
				E('span', { 'class': 'mf-notice-text' }, [
					E('strong', {}, 'nDPId Active: '),
					'Using local deep packet inspection. No cloud subscription required.'
				])
			]) : (isNetifyd ? E('div', { 'class': 'mf-notice warning' }, [
				E('span', { 'class': 'mf-notice-icon' }, '⚠️'),
				E('span', { 'class': 'mf-notice-text' }, [
					E('strong', {}, 'Netifyd Active: '),
					'Cloud subscription may be required for full app detection.'
				])
			]) : E('div', { 'class': 'mf-notice error' }, [
				E('span', { 'class': 'mf-notice-icon' }, '❌'),
				E('span', { 'class': 'mf-notice-text' }, [
					E('strong', {}, 'No DPI Engine: '),
					'Start nDPId or Netifyd for streaming detection.'
				]),
				E('div', { 'class': 'mf-controls' }, [
					E('button', {
						'class': 'mf-btn mf-btn-primary',
						'click': function() {
							ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Starting nDPId...'))]);
							API.startNdpid().then(function(res) {
								ui.hideModal();
								if (res && res.success) {
									ui.addNotification(null, E('p', {}, 'nDPId started'), 'success');
									setTimeout(function() { window.location.reload(); }, 2000);
								} else {
									ui.addNotification(null, E('p', {}, res.message || 'Failed'), 'error');
								}
							});
						}
					}, 'Start nDPId'),
					E('button', {
						'class': 'mf-btn mf-btn-secondary',
						'click': function() {
							ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Starting Netifyd...'))]);
							API.startNetifyd().then(function(res) {
								ui.hideModal();
								if (res && res.success) {
									ui.addNotification(null, E('p', {}, 'Netifyd started'), 'success');
									setTimeout(function() { window.location.reload(); }, 2000);
								} else {
									ui.addNotification(null, E('p', {}, res.message || 'Failed'), 'error');
								}
							});
						}
					}, 'Start Netifyd')
				])
			])),

			// Active Streams Card
			E('div', { 'class': 'mf-card' }, [
				E('div', { 'class': 'mf-card-header' }, [
					E('div', { 'class': 'mf-card-title' }, [
						E('span', {}, '🎬'),
						'Active Streams'
					]),
					E('div', { 'class': 'mf-card-badge', 'id': 'mf-streams-badge' }, streams.length + ' streaming')
				]),
				E('div', { 'class': 'mf-card-body', 'id': 'mf-streams-container' },
					streams.length > 0 ?
					E('table', { 'class': 'mf-streams-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, 'Service'),
								E('th', {}, 'Client'),
								E('th', {}, 'Quality'),
								E('th', {}, 'Data')
							])
						]),
						E('tbody', {},
							streams.slice(0, 15).map(function(s) {
								var qualityColors = { '4K': '#9333ea', 'FHD': '#2563eb', 'HD': '#059669', 'SD': '#d97706' };
								var totalBytes = (s.bytes_rx || 0) + (s.bytes_tx || 0);
								return E('tr', {}, [
									E('td', {}, E('strong', {}, s.app || 'Unknown')),
									E('td', {}, s.client || s.src_ip || '-'),
									E('td', {}, s.quality ? E('span', { 'class': 'mf-quality-badge', 'style': 'background:' + (qualityColors[s.quality] || '#6b7280') }, s.quality) : '-'),
									E('td', {}, self.formatBytes(totalBytes))
								]);
							})
						)
					]) :
					E('div', { 'class': 'mf-empty' }, [
						E('div', { 'class': 'mf-empty-icon' }, '📺'),
						E('div', { 'class': 'mf-empty-text' }, isNdpid ? 'No streaming activity detected' : 'Waiting for streaming data...')
					])
				)
			])
		]);

		// Start polling
		poll.add(L.bind(function() {
			return API.getActiveStreams().then(L.bind(function(data) {
				var el = document.getElementById('mf-total-flows');
				if (el) el.textContent = String(data.flow_count || 0);
				var el2 = document.getElementById('mf-stream-count');
				if (el2) el2.textContent = String((data.streams || []).length);
				var badge = document.getElementById('mf-streams-badge');
				if (badge) badge.textContent = (data.streams || []).length + ' streaming';
			}, this));
		}, this), this.pollInterval);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(view);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
