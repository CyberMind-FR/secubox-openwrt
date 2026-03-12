'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

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

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/photoprism/overview' },
			{ name: 'Settings', path: 'admin/services/photoprism/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	formatNumber: function(n) {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return String(n);
	},

	renderStats: function(stats, indexProgress) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(this.formatNumber(indexProgress.sidecar_count || 0), 'Indexed', c.blue),
			KissTheme.stat(this.formatNumber(indexProgress.thumbnail_count || 0), 'Thumbnails', c.purple),
			KissTheme.stat(this.formatNumber(stats.photo_count || 0), 'Photos', c.green),
			KissTheme.stat(this.formatNumber(stats.video_count || 0), 'Videos', c.orange)
		];
	},

	renderInstallWizard: function() {
		var self = this;

		return KissTheme.card('Install PhotoPrism', E('div', {}, [
			E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, 'Self-hosted Google Photos alternative with AI-powered face recognition, search, and albums.'),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 12px;' }, 'Features'),
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'AI-powered face recognition and clustering'),
					E('li', {}, 'Automatic image classification'),
					E('li', {}, 'Location mapping and search'),
					E('li', {}, 'RAW photo support and conversion'),
					E('li', {}, 'Video transcoding and playback'),
					E('li', {}, 'Albums and sharing')
				])
			]),
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': function() {
					ui.showModal('Installing...', [E('p', { 'class': 'spinning' }, 'Installing PhotoPrism...')]);
					callInstall().then(function(res) {
						ui.hideModal();
						if (res.success) {
							ui.addNotification(null, E('p', 'PhotoPrism installed successfully!'), 'success');
							window.location.reload();
						} else {
							ui.addNotification(null, E('p', 'Installation failed: ' + (res.output || 'Unknown error')), 'error');
						}
					});
				}
			}, 'Install PhotoPrism')
		]));
	},

	renderHealth: function(status, stats) {
		var checks = [
			{ label: 'Container', ok: status.installed, value: status.installed ? (status.running ? 'Running' : 'Stopped') : 'Not Installed' },
			{ label: 'Face Recognition', ok: status.face_recognition, value: status.face_recognition ? 'Enabled' : 'Disabled' },
			{ label: 'Object Detection', ok: status.object_detection, value: status.object_detection ? 'Enabled' : 'Disabled' },
			{ label: 'Places/Maps', ok: status.places, value: status.places ? 'Enabled' : 'Disabled' },
			{ label: 'Domain', ok: !!status.domain, value: status.domain || 'Not configured' }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					c.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, c.value)
				])
			]);
		}));
	},

	renderControls: function(status) {
		var self = this;
		var running = status.running;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			// Service controls
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				running ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						callStop().then(function() { window.location.reload(); });
					}
				}, 'Stop') : E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						callStart().then(function() { window.location.reload(); });
					}
				}, 'Start'),
				E('button', {
					'class': 'kiss-btn',
					'disabled': !running,
					'click': function() {
						ui.showModal('Indexing...', [E('p', { 'class': 'spinning' }, 'Starting index...')]);
						callIndex().then(function(res) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Indexing started'), 'success');
						});
					}
				}, 'Index Photos'),
				E('button', {
					'class': 'kiss-btn',
					'disabled': !running,
					'click': function() {
						ui.showModal('Importing...', [E('p', { 'class': 'spinning' }, 'Importing photos...')]);
						callImport().then(function(res) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Import complete'), 'success');
							window.location.reload();
						});
					}
				}, 'Import')
			]),

			// Open Gallery
			running ? E('a', {
				'href': 'http://' + window.location.hostname + ':' + (status.port || 2342),
				'target': '_blank',
				'class': 'kiss-btn kiss-btn-blue',
				'style': 'text-decoration: none; text-align: center;'
			}, 'Open Gallery') : '',

			// Uninstall
			E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'click': function() {
					if (confirm('Remove PhotoPrism container? Photos will be preserved.')) {
						callUninstall().then(function() {
							ui.addNotification(null, E('p', 'PhotoPrism uninstalled'), 'success');
							window.location.reload();
						});
					}
				}
			}, 'Uninstall')
		]);
	},

	renderIndexProgress: function(indexProgress) {
		if (!indexProgress.indexing) {
			return E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', { 'style': 'color: var(--kiss-green);' }, '\u2713 Ready'),
				E('span', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, 'DB: ' + (indexProgress.db_size || '0'))
			]);
		}

		return E('div', {}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 8px;' }, [
				E('span', { 'style': 'color: var(--kiss-orange);' }, 'Indexing...'),
				E('span', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-muted);' }, indexProgress.current_file || 'Processing...')
			]),
			E('div', { 'style': 'height: 6px; background: var(--kiss-bg); border-radius: 3px; overflow: hidden;' }, [
				E('div', { 'style': 'width: 100%; height: 100%; background: linear-gradient(90deg, var(--kiss-orange), var(--kiss-purple)); animation: pulse 1.5s infinite;' })
			])
		]);
	},

	renderStorage: function(stats, config) {
		var self = this;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 24px; font-weight: 700; color: var(--kiss-cyan);' }, stats.originals_size || '0'),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Originals')
				]),
				E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 24px; font-weight: 700; color: var(--kiss-purple);' }, stats.storage_size || '0'),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Cache')
				])
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', {
					'type': 'text',
					'id': 'originals-path',
					'value': config.originals_path || '/srv/photoprism/originals',
					'placeholder': '/mnt/PHOTO',
					'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn',
					'click': function() {
						var path = document.getElementById('originals-path').value;
						if (!path) {
							ui.addNotification(null, E('p', 'Please enter a path'), 'warning');
							return;
						}
						callSetConfig(path).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', 'Path updated. Restart to apply.'), 'success');
							}
						});
					}
				}, 'Save Path')
			])
		]);
	},

	renderEmancipate: function(status) {
		var self = this;
		var domain = status.domain || '';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Expose your photo gallery publicly with SSL.'),
			domain ? E('div', { 'style': 'padding: 12px; background: rgba(0,200,83,0.1); border-radius: 6px;' }, [
				E('span', {}, 'Gallery at: '),
				E('a', { 'href': 'https://' + domain, 'target': '_blank', 'style': 'color: var(--kiss-cyan);' }, 'https://' + domain)
			]) : E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', {
					'type': 'text',
					'id': 'emancipate-domain',
					'placeholder': 'photos.example.com',
					'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var d = document.getElementById('emancipate-domain').value;
						if (!d) {
							ui.addNotification(null, E('p', 'Please enter a domain'), 'warning');
							return;
						}
						ui.showModal('Configuring...', [E('p', { 'class': 'spinning' }, 'Setting up public exposure...')]);
						callEmancipate(d).then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', 'Gallery exposed at ' + res.url), 'success');
								window.location.reload();
							}
						});
					}
				}, 'Emancipate')
			])
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.stats = data[1] || {};
		this.config = data[2] || {};
		this.indexProgress = data[3] || {};

		var status = this.status;
		var stats = this.stats;
		var config = this.config;
		var indexProgress = this.indexProgress;
		var c = KissTheme.colors;

		if (!status.installed) {
			var content = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
						E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'PhotoPrism'),
						KissTheme.badge('NOT INSTALLED', 'yellow')
					]),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'AI-powered photo gallery')
				]),
				this.renderNav('overview'),
				this.renderInstallWizard()
			];
			return KissTheme.wrap(content, 'admin/services/photoprism/overview');
		}

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'PhotoPrism'),
					KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'AI-powered photo gallery')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'photoprism-stats', 'style': 'margin: 20px 0;' }, this.renderStats(stats, indexProgress)),

			// Index progress
			KissTheme.card('Index Status', E('div', { 'id': 'index-progress' }, this.renderIndexProgress(indexProgress))),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('AI Features', this.renderHealth(status, stats)),
				KissTheme.card('Controls', this.renderControls(status))
			]),

			// Storage and Emancipate
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Storage', this.renderStorage(stats, config)),
				KissTheme.card('Public Exposure', this.renderEmancipate(status))
			])
		];

		poll.add(function() {
			return Promise.all([callStatus(), callGetStats(), callGetConfig(), callGetIndexProgress()]).then(function(results) {
				self.status = results[0] || {};
				self.stats = results[1] || {};
				self.config = results[2] || {};
				self.indexProgress = results[3] || {};

				var statsEl = document.getElementById('photoprism-stats');
				if (statsEl) {
					statsEl.innerHTML = '';
					self.renderStats(self.stats, self.indexProgress).forEach(function(el) { statsEl.appendChild(el); });
				}

				var indexEl = document.getElementById('index-progress');
				if (indexEl) {
					indexEl.innerHTML = '';
					indexEl.appendChild(self.renderIndexProgress(self.indexProgress));
				}
			});
		}, 5);

		return KissTheme.wrap(content, 'admin/services/photoprism/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
