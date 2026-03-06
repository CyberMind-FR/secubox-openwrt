'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.photoprism',
	method: 'status',
	expect: {}
});

var callGetStats = rpc.declare({
	object: 'luci.photoprism',
	method: 'get_stats',
	expect: {}
});

var callGetIndexProgress = rpc.declare({
	object: 'luci.photoprism',
	method: 'get_index_progress',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.photoprism',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.photoprism',
	method: 'stop',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.photoprism',
	method: 'install',
	expect: {}
});

var callUninstall = rpc.declare({
	object: 'luci.photoprism',
	method: 'uninstall',
	expect: {}
});

var callIndex = rpc.declare({
	object: 'luci.photoprism',
	method: 'index',
	expect: {}
});

var callImport = rpc.declare({
	object: 'luci.photoprism',
	method: 'import',
	expect: {}
});

var callEmancipate = rpc.declare({
	object: 'luci.photoprism',
	method: 'emancipate',
	params: ['domain'],
	expect: {}
});

var callGetConfig = rpc.declare({
	object: 'luci.photoprism',
	method: 'get_config',
	expect: {}
});

var callSetConfig = rpc.declare({
	object: 'luci.photoprism',
	method: 'set_config',
	params: ['originals_path'],
	expect: {}
});

return view.extend({
	css: `
		:root {
			--kiss-bg: #1a1a2e;
			--kiss-card: #16213e;
			--kiss-border: #0f3460;
			--kiss-accent: #e94560;
			--kiss-text: #eee;
			--kiss-muted: #888;
			--kiss-success: #00d26a;
			--kiss-warning: #ffc107;
		}
		.kiss-container {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: var(--kiss-bg);
			color: var(--kiss-text);
			padding: 20px;
			min-height: 100vh;
		}
		.kiss-header {
			display: flex;
			align-items: center;
			gap: 15px;
			margin-bottom: 25px;
			padding-bottom: 15px;
			border-bottom: 1px solid var(--kiss-border);
		}
		.kiss-header h2 {
			margin: 0;
			font-size: 1.8em;
			color: var(--kiss-text);
		}
		.kiss-badge {
			padding: 4px 12px;
			border-radius: 12px;
			font-size: 0.8em;
			font-weight: 600;
		}
		.kiss-badge-success { background: var(--kiss-success); color: #000; }
		.kiss-badge-danger { background: var(--kiss-accent); color: #fff; }
		.kiss-badge-warning { background: var(--kiss-warning); color: #000; }

		.kiss-stats-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 15px;
			margin-bottom: 25px;
		}
		@media (max-width: 768px) { .kiss-stats-grid { grid-template-columns: repeat(2, 1fr); } }
		.kiss-stat-card {
			background: var(--kiss-card);
			border: 1px solid var(--kiss-border);
			border-radius: 12px;
			padding: 20px;
			text-align: center;
		}
		.kiss-stat-value {
			font-size: 2em;
			font-weight: 700;
			color: var(--kiss-accent);
		}
		.kiss-stat-label {
			font-size: 0.85rem;
			color: var(--kiss-muted);
			margin-top: 5px;
		}

		.kiss-index-bar {
			background: var(--kiss-card);
			border: 1px solid var(--kiss-border);
			border-radius: 12px;
			padding: 15px 20px;
			margin-bottom: 25px;
		}
		.kiss-index-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10px;
		}
		.kiss-index-title {
			font-weight: 600;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.kiss-index-file {
			font-size: 0.8rem;
			color: var(--kiss-muted);
			font-family: monospace;
		}
		.kiss-progress-track {
			height: 8px;
			background: #333;
			border-radius: 4px;
			overflow: hidden;
		}
		.kiss-progress-bar {
			height: 100%;
			background: linear-gradient(90deg, var(--kiss-accent), #8b5cf6);
			border-radius: 4px;
			transition: width 0.5s;
		}
		.kiss-index-idle {
			color: var(--kiss-success);
		}
		.kiss-pulse {
			animation: pulse 1.5s infinite;
		}
		@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

		.kiss-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 15px;
			margin-bottom: 25px;
		}
		.kiss-card {
			background: var(--kiss-card);
			border: 1px solid var(--kiss-border);
			border-radius: 10px;
			padding: 20px;
		}
		.kiss-card h4 {
			margin: 0 0 10px 0;
			color: var(--kiss-muted);
			font-size: 0.9em;
			text-transform: uppercase;
		}
		.kiss-card .value {
			font-size: 2em;
			font-weight: 700;
			color: var(--kiss-text);
		}
		.kiss-card .value.accent { color: var(--kiss-accent); }
		.kiss-card .value.success { color: var(--kiss-success); }
		.kiss-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-bottom: 25px;
		}
		.kiss-btn {
			padding: 10px 20px;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-weight: 600;
			font-size: 0.9em;
			transition: all 0.2s;
		}
		.kiss-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.kiss-btn-primary {
			background: var(--kiss-accent);
			color: #fff;
		}
		.kiss-btn-primary:hover:not(:disabled) {
			background: #ff6b6b;
		}
		.kiss-btn-secondary {
			background: var(--kiss-border);
			color: var(--kiss-text);
		}
		.kiss-btn-secondary:hover:not(:disabled) {
			background: #1a4a7a;
		}
		.kiss-btn-success {
			background: var(--kiss-success);
			color: #000;
		}
		.kiss-btn-danger {
			background: #dc3545;
			color: #fff;
		}
		.kiss-section {
			margin-bottom: 25px;
		}
		.kiss-section h3 {
			margin: 0 0 15px 0;
			font-size: 1.2em;
			color: var(--kiss-text);
		}
		.kiss-features {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}
		.kiss-feature {
			padding: 8px 15px;
			background: var(--kiss-border);
			border-radius: 20px;
			font-size: 0.85em;
		}
		.kiss-feature.active {
			background: var(--kiss-success);
			color: #000;
		}
		.kiss-input-group {
			display: flex;
			gap: 10px;
			margin-top: 15px;
		}
		.kiss-input {
			flex: 1;
			padding: 10px 15px;
			border: 1px solid var(--kiss-border);
			border-radius: 6px;
			background: var(--kiss-bg);
			color: var(--kiss-text);
			font-size: 0.95em;
		}
		.kiss-link {
			color: var(--kiss-accent);
			text-decoration: none;
		}
		.kiss-link:hover {
			text-decoration: underline;
		}
		.kiss-install-card {
			text-align: center;
			padding: 40px;
		}
		.kiss-install-card h3 {
			margin-bottom: 15px;
		}
		.kiss-install-card p {
			color: var(--kiss-muted);
			margin-bottom: 25px;
		}
	`,

	status: null,
	stats: null,
	config: null,
	indexProgress: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callGetStats(),
			callGetConfig(),
			callGetIndexProgress()
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.stats = data[1] || {};
		this.config = data[2] || {};
		this.indexProgress = data[3] || {};

		var container = E('div', { 'class': 'kiss-container' }, [
			E('style', {}, this.css),
			this.renderHeader(),
			this.status.installed ? this.renderDashboard() : this.renderInstallPrompt()
		]);

		poll.add(function() {
			return Promise.all([callStatus(), callGetStats(), callGetConfig(), callGetIndexProgress()]).then(function(results) {
				self.status = results[0] || {};
				self.stats = results[1] || {};
				self.config = results[2] || {};
				self.indexProgress = results[3] || {};
				self.updateView();
			});
		}, 5);

		return container;
	},

	renderHeader: function() {
		var status = this.status;
		var badge = !status.installed
			? E('span', { 'class': 'kiss-badge kiss-badge-warning' }, 'Not Installed')
			: status.running
				? E('span', { 'class': 'kiss-badge kiss-badge-success' }, 'Running')
				: E('span', { 'class': 'kiss-badge kiss-badge-danger' }, 'Stopped');

		return E('div', { 'class': 'kiss-header' }, [
			E('h2', {}, 'PhotoPrism Gallery'),
			badge
		]);
	},

	renderInstallPrompt: function() {
		var self = this;

		return E('div', { 'class': 'kiss-card kiss-install-card' }, [
			E('h3', {}, 'PhotoPrism Not Installed'),
			E('p', {}, 'Self-hosted Google Photos alternative with AI-powered face recognition, search, and albums.'),
			E('button', {
				'class': 'kiss-btn kiss-btn-primary',
				'click': function() {
					this.disabled = true;
					this.textContent = 'Installing...';
					callInstall().then(function(res) {
						if (res.success) {
							ui.addNotification(null, E('p', {}, 'PhotoPrism installed successfully!'), 'success');
							window.location.reload();
						} else {
							ui.addNotification(null, E('p', {}, 'Installation failed: ' + (res.output || 'Unknown error')), 'error');
						}
					});
				}
			}, 'Install PhotoPrism')
		]);
	},

	formatNumber: function(n) {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return n.toString();
	},

	renderDashboard: function() {
		var self = this;
		var status = this.status;
		var stats = this.stats;
		var idx = this.indexProgress;

		return E('div', {}, [
			// Live Stats Grid
			E('div', { 'class': 'kiss-stats-grid', 'id': 'stats-grid' }, [
				E('div', { 'class': 'kiss-stat-card' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'sidecars' }, this.formatNumber(idx.sidecar_count || 0)),
					E('div', { 'class': 'kiss-stat-label' }, 'Indexed')
				]),
				E('div', { 'class': 'kiss-stat-card' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'thumbnails' }, this.formatNumber(idx.thumbnail_count || 0)),
					E('div', { 'class': 'kiss-stat-label' }, 'Thumbnails')
				]),
				E('div', { 'class': 'kiss-stat-card' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'photos' }, this.formatNumber(stats.photo_count || 0)),
					E('div', { 'class': 'kiss-stat-label' }, 'Photos')
				]),
				E('div', { 'class': 'kiss-stat-card' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'videos' }, this.formatNumber(stats.video_count || 0)),
					E('div', { 'class': 'kiss-stat-label' }, 'Videos')
				])
			]),

			// Index Progress Bar
			E('div', { 'class': 'kiss-index-bar', 'id': 'index-bar' },
				idx.indexing ?
					this.renderIndexProgress(idx) :
					E('div', { 'class': 'kiss-index-header' }, [
						E('span', { 'class': 'kiss-index-title kiss-index-idle' }, ['✓ ', 'Ready']),
						E('span', { 'class': 'kiss-index-file' }, 'DB: ' + (idx.db_size || '0'))
					])
			),

			// Storage Stats
			E('div', { 'class': 'kiss-grid' }, [
				E('div', { 'class': 'kiss-card' }, [
					E('h4', {}, 'Originals Size'),
					E('div', { 'class': 'value', 'data-stat': 'originals' }, stats.originals_size || '0')
				]),
				E('div', { 'class': 'kiss-card' }, [
					E('h4', {}, 'Cache Size'),
					E('div', { 'class': 'value', 'data-stat': 'cache' }, stats.storage_size || '0')
				])
			]),

			// Actions
			E('div', { 'class': 'kiss-section' }, [
				E('h3', {}, 'Actions'),
				E('div', { 'class': 'kiss-actions' }, [
					E('button', {
						'class': 'kiss-btn ' + (status.running ? 'kiss-btn-danger' : 'kiss-btn-success'),
						'data-action': 'toggle',
						'click': function() {
							var fn = status.running ? callStop : callStart;
							this.disabled = true;
							fn().then(function() {
								window.location.reload();
							});
						}
					}, status.running ? 'Stop' : 'Start'),
					E('button', {
						'class': 'kiss-btn kiss-btn-secondary',
						'disabled': !status.running,
						'click': function() {
							this.disabled = true;
							this.textContent = 'Indexing...';
							callIndex().then(function(res) {
								ui.addNotification(null, E('p', {}, 'Indexing started'), 'success');
							});
						}
					}, 'Index Photos'),
					E('button', {
						'class': 'kiss-btn kiss-btn-secondary',
						'disabled': !status.running,
						'click': function() {
							this.disabled = true;
							this.textContent = 'Importing...';
							callImport().then(function(res) {
								ui.addNotification(null, E('p', {}, 'Import complete'), 'success');
								window.location.reload();
							});
						}
					}, 'Import'),
					status.running ? E('a', {
						'class': 'kiss-btn kiss-btn-primary',
						'href': 'http://' + window.location.hostname + ':' + (status.port || 2342),
						'target': '_blank'
					}, 'Open Gallery') : E('span')
				])
			]),

			// Features
			E('div', { 'class': 'kiss-section' }, [
				E('h3', {}, 'AI Features'),
				E('div', { 'class': 'kiss-features' }, [
					E('span', { 'class': 'kiss-feature ' + (status.face_recognition ? 'active' : '') }, 'Face Recognition'),
					E('span', { 'class': 'kiss-feature ' + (status.object_detection ? 'active' : '') }, 'Object Detection'),
					E('span', { 'class': 'kiss-feature ' + (status.places ? 'active' : '') }, 'Places / Maps')
				])
			]),

			// Settings
			E('div', { 'class': 'kiss-section' }, [
				E('h3', {}, 'Storage Settings'),
				E('div', { 'class': 'kiss-input-group' }, [
					E('label', { 'style': 'color: var(--kiss-muted); margin-right: 10px;' }, 'Photos Path:'),
					E('input', {
						'class': 'kiss-input',
						'type': 'text',
						'id': 'originals-path',
						'value': self.config.originals_path || '/srv/photoprism/originals',
						'placeholder': '/mnt/PHOTO'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-secondary',
						'click': function() {
							var path = document.getElementById('originals-path').value;
							if (!path) {
								ui.addNotification(null, E('p', {}, 'Please enter a path'), 'warning');
								return;
							}
							this.disabled = true;
							this.textContent = 'Saving...';
							var btn = this;
							callSetConfig(path).then(function(res) {
								if (res.success) {
									ui.addNotification(null, E('p', {}, 'Path updated. Restart PhotoPrism to apply.'), 'success');
								}
								btn.disabled = false;
								btn.textContent = 'Save';
							});
						}
					}, 'Save')
				])
			]),

			// Emancipate
			E('div', { 'class': 'kiss-section' }, [
				E('h3', {}, 'Public Exposure'),
				status.domain
					? E('p', {}, ['Gallery available at: ', E('a', { 'class': 'kiss-link', 'href': 'https://' + status.domain, 'target': '_blank' }, 'https://' + status.domain)])
					: E('div', { 'class': 'kiss-input-group' }, [
						E('input', {
							'class': 'kiss-input',
							'type': 'text',
							'id': 'emancipate-domain',
							'placeholder': 'photos.example.com'
						}),
						E('button', {
							'class': 'kiss-btn kiss-btn-primary',
							'click': function() {
								var domain = document.getElementById('emancipate-domain').value;
								if (!domain) {
									ui.addNotification(null, E('p', {}, 'Please enter a domain'), 'warning');
									return;
								}
								this.disabled = true;
								this.textContent = 'Configuring...';
								callEmancipate(domain).then(function(res) {
									if (res.success) {
										ui.addNotification(null, E('p', {}, 'Gallery exposed at ' + res.url), 'success');
										window.location.reload();
									}
								});
							}
						}, 'Emancipate')
					])
			]),

			// Danger Zone
			E('div', { 'class': 'kiss-section' }, [
				E('h3', {}, 'Danger Zone'),
				E('button', {
					'class': 'kiss-btn kiss-btn-danger',
					'click': function() {
						if (confirm('Remove PhotoPrism container? Photos will be preserved.')) {
							this.disabled = true;
							callUninstall().then(function() {
								ui.addNotification(null, E('p', {}, 'PhotoPrism uninstalled'), 'success');
								window.location.reload();
							});
						}
					}
				}, 'Uninstall')
			])
		]);
	},

	renderIndexProgress: function(idx) {
		return E('div', {}, [
			E('div', { 'class': 'kiss-index-header' }, [
				E('span', { 'class': 'kiss-index-title' }, [
					E('span', { 'class': 'kiss-pulse' }, '⏳'),
					' Indexing...'
				]),
				E('span', { 'class': 'kiss-index-file' }, idx.current_file || 'Processing...')
			]),
			E('div', { 'class': 'kiss-progress-track' }, [
				E('div', { 'class': 'kiss-progress-bar', 'style': 'width: 100%' })
			])
		]);
	},

	updateView: function() {
		var stats = this.stats;
		var idx = this.indexProgress;

		// Update stat cards
		var sidecarEl = document.querySelector('[data-stat="sidecars"]');
		var thumbEl = document.querySelector('[data-stat="thumbnails"]');
		var photosEl = document.querySelector('[data-stat="photos"]');
		var videosEl = document.querySelector('[data-stat="videos"]');
		var originalsEl = document.querySelector('[data-stat="originals"]');
		var cacheEl = document.querySelector('[data-stat="cache"]');

		if (sidecarEl) sidecarEl.textContent = this.formatNumber(idx.sidecar_count || 0);
		if (thumbEl) thumbEl.textContent = this.formatNumber(idx.thumbnail_count || 0);
		if (photosEl) photosEl.textContent = this.formatNumber(stats.photo_count || 0);
		if (videosEl) videosEl.textContent = this.formatNumber(stats.video_count || 0);
		if (originalsEl) originalsEl.textContent = stats.originals_size || '0';
		if (cacheEl) cacheEl.textContent = stats.storage_size || '0';

		// Update index bar
		var indexBar = document.getElementById('index-bar');
		if (indexBar) {
			if (idx.indexing) {
				indexBar.innerHTML = '';
				indexBar.appendChild(this.renderIndexProgress(idx));
			} else {
				indexBar.innerHTML = '<div class="kiss-index-header"><span class="kiss-index-title kiss-index-idle">✓ Ready</span><span class="kiss-index-file">DB: ' + (idx.db_size || '0') + '</span></div>';
			}
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
