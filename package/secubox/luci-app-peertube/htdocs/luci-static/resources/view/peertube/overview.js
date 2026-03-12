'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require form';
'require peertube.api as api';
'require secubox/kiss-theme';

return view.extend({
	handleAction: function(action, args) {
		var self = this;

		ui.showModal('Processing...', [
			E('p', { 'class': 'spinning' }, 'Processing request...')
		]);

		var promise;
		switch(action) {
			case 'start':
				promise = api.start();
				break;
			case 'stop':
				promise = api.stop();
				break;
			case 'install':
				promise = api.install();
				break;
			case 'uninstall':
				if (!confirm('This will remove the PeerTube container. Video data will be preserved. Continue?'))
					return ui.hideModal();
				promise = api.uninstall();
				break;
			case 'update':
				promise = api.update();
				break;
			case 'live_enable':
				promise = api.liveEnable();
				break;
			case 'live_disable':
				promise = api.liveDisable();
				break;
			case 'configure_haproxy':
				promise = api.configureHaproxy();
				break;
			case 'emancipate':
				var domain = args;
				if (!domain) {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Domain is required'), 'error');
					return;
				}
				promise = api.emancipate(domain);
				break;
			case 'import_video':
				var url = args;
				if (!url) {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Video URL is required'), 'error');
					return;
				}
				promise = api.importVideo(url).then(function(res) {
					if (res && res.success && res.job_id) {
						self.pollImportJob(res.job_id);
					}
					return res;
				});
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', res.message || 'Action completed'), 'success');
				self.load().then(function(data) {
					dom.content(document.querySelector('#peertube-content'), self.renderContent(data));
				});
			} else {
				ui.addNotification(null, E('p', res.error || 'Action failed'), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	pollImportJob: function(jobId) {
		var self = this;
		var statusDiv = document.getElementById('import-status');
		var pollCount = 0;
		var maxPolls = 120;

		var updateStatus = function(status, message, isError) {
			if (statusDiv) {
				statusDiv.style.display = 'block';
				statusDiv.style.background = isError ? 'rgba(255,23,68,0.1)' : (status === 'completed' ? 'rgba(0,200,83,0.1)' : 'rgba(0,176,255,0.1)');
				statusDiv.innerHTML = '<span style="color:' + (isError ? 'var(--kiss-red)' : (status === 'completed' ? 'var(--kiss-green)' : 'var(--kiss-cyan)')) + ';">' + message + '</span>';
			}
		};

		var poll = function() {
			api.importJobStatus(jobId).then(function(res) {
				pollCount++;

				switch(res.status) {
					case 'downloading':
						updateStatus('downloading', 'Downloading video...');
						break;
					case 'uploading':
						updateStatus('uploading', 'Uploading to PeerTube...');
						break;
					case 'completed':
						var videoUrl = res.video_uuid ?
							'https://' + (document.getElementById('emancipate-domain').value || 'tube.secubox.in') + '/w/' + res.video_uuid :
							'';
						updateStatus('completed', 'Import complete! ' + (videoUrl ? '<a href="' + videoUrl + '" target="_blank" style="color:var(--kiss-cyan);">View video</a>' : ''));
						ui.addNotification(null, E('p', 'Video imported successfully!'), 'success');
						return;
					case 'download_failed':
						updateStatus('error', 'Download failed', true);
						return;
					case 'upload_failed':
						updateStatus('error', 'Upload failed', true);
						return;
					case 'file_not_found':
						updateStatus('error', 'Downloaded file not found', true);
						return;
					default:
						if (pollCount >= maxPolls) {
							updateStatus('error', 'Timeout waiting for import', true);
							return;
						}
				}

				setTimeout(poll, 5000);
			}).catch(function(e) {
				updateStatus('error', 'Error: ' + e.message, true);
			});
		};

		updateStatus('starting', 'Starting import...');
		setTimeout(poll, 2000);
	},

	load: function() {
		return Promise.all([
			api.status(),
			uci.load('peertube')
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/peertube/overview' },
			{ name: 'Videos', path: 'admin/services/peertube/videos' },
			{ name: 'Settings', path: 'admin/services/peertube/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var running = status.running === 'true';
		var liveEnabled = status.live_enabled === '1';
		var haproxy = status.haproxy === '1';

		return [
			KissTheme.stat(running ? 'UP' : 'DOWN', 'Server', running ? c.green : c.red),
			KissTheme.stat(liveEnabled ? 'ON' : 'OFF', 'Live', liveEnabled ? c.orange : c.muted),
			KissTheme.stat(haproxy ? 'YES' : 'NO', 'HAProxy', haproxy ? c.blue : c.muted),
			KissTheme.stat(status.port || '9000', 'Port', c.cyan)
		];
	},

	renderInstallWizard: function() {
		var self = this;

		return KissTheme.card('Install PeerTube', E('div', {}, [
			E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, 'PeerTube is a free, decentralized and federated video streaming platform.'),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 12px;' }, 'Features'),
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'Self-hosted video hosting with HLS streaming'),
					E('li', {}, 'Live streaming with RTMP ingest'),
					E('li', {}, 'Automatic transcoding to multiple resolutions'),
					E('li', {}, 'Federation via ActivityPub protocol'),
					E('li', {}, 'User management and access controls'),
					E('li', {}, 'WebTorrent for distributed video delivery')
				])
			]),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, 'Requirements'),
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'Minimum 2GB RAM recommended'),
					E('li', {}, '10GB storage for system + additional for videos'),
					E('li', {}, 'Network access for container downloads')
				])
			]),
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': function() { self.handleAction('install'); }
			}, 'Install PeerTube')
		]));
	},

	renderHealth: function(status) {
		var running = status.running === 'true';
		var liveEnabled = status.live_enabled === '1';
		var haproxy = status.haproxy === '1';

		var checks = [
			{ label: 'Server', ok: running, value: running ? 'Running' : 'Stopped' },
			{ label: 'Live Streaming', ok: liveEnabled, value: liveEnabled ? 'Enabled' : 'Disabled' },
			{ label: 'HAProxy', ok: haproxy, value: haproxy ? 'Configured' : 'Not configured' },
			{ label: 'Domain', ok: !!status.domain, value: status.domain || 'Not configured' },
			{ label: 'Port', ok: true, value: status.port || '9000' }
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
		var running = status.running === 'true';
		var liveEnabled = status.live_enabled === '1';
		var haproxy = status.haproxy === '1';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			// Service controls
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				running ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleAction('stop'); }
				}, 'Stop') : E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAction('start'); }
				}, 'Start'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleAction('update'); }
				}, 'Update'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleAction('uninstall'); }
				}, 'Uninstall')
			]),

			// Feature toggles
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				liveEnabled ?
					E('button', {
						'class': 'kiss-btn',
						'click': function() { self.handleAction('live_disable'); }
					}, 'Disable Live') :
					E('button', {
						'class': 'kiss-btn kiss-btn-orange',
						'click': function() { self.handleAction('live_enable'); }
					}, 'Enable Live'),
				!haproxy ? E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleAction('configure_haproxy'); }
				}, 'Configure HAProxy') : ''
			]),

			// Access URL
			running && status.domain ? E('div', {}, [
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Access URL'),
				E('a', {
					'href': 'https://' + status.domain,
					'target': '_blank',
					'style': 'font-family: monospace; color: var(--kiss-green);'
				}, 'https://' + status.domain)
			]) : running ? E('div', {}, [
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Local URL'),
				E('a', {
					'href': 'http://192.168.255.1:' + (status.port || '9000'),
					'target': '_blank',
					'style': 'font-family: monospace; color: var(--kiss-cyan);'
				}, 'http://192.168.255.1:' + (status.port || '9000'))
			]) : ''
		]);
	},

	renderEmancipate: function(status) {
		var self = this;
		var domain = status.domain || '';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Make PeerTube publicly accessible with SSL certificate and DNS configuration.'),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', {
					'type': 'text',
					'id': 'emancipate-domain',
					'placeholder': 'peertube.example.com',
					'value': domain,
					'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var d = document.getElementById('emancipate-domain').value;
						self.handleAction('emancipate', d);
					}
				}, 'Emancipate')
			])
		]);
	},

	renderImport: function(status) {
		var self = this;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Download videos from YouTube, Vimeo, and 1000+ sites.'),
			E('div', { 'id': 'import-status', 'style': 'padding: 12px; border-radius: 6px; display: none;' }),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', {
					'type': 'text',
					'id': 'import-video-url',
					'placeholder': 'https://www.youtube.com/watch?v=...',
					'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() {
						var url = document.getElementById('import-video-url').value;
						self.handleAction('import_video', url);
					}
				}, 'Import'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() {
						api.importStatus().then(function(res) {
							var statusText = res.downloading === 'true' ?
								'Download in progress...' :
								'No download running';
							statusText += '\nVideos ready: ' + (res.video_count || 0);
							if (res.files) {
								statusText += '\n\n' + res.files;
							}
							ui.showModal('Import Status', [
								E('pre', { 'style': 'background: var(--kiss-bg); color: var(--kiss-text); padding: 16px; border-radius: 6px; max-height: 300px; overflow: auto; font-family: monospace; font-size: 12px;' }, statusText),
								E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 16px;' }, [
									E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
								])
							]);
						});
					}
				}, 'Status')
			]),
			E('p', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin: 8px 0 0 0;' }, [
				'Supported: YouTube, Vimeo, Dailymotion, Twitter, TikTok, and ',
				E('a', { 'href': 'https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md', 'target': '_blank', 'style': 'color: var(--kiss-cyan);' }, '1000+ more')
			])
		]);
	},

	renderContent: function(data) {
		var self = this;
		var status = data[0] || {};
		var c = KissTheme.colors;

		if (status.container_state === 'not_installed') {
			return this.renderInstallWizard();
		}

		return E('div', {}, [
			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('System Health', this.renderHealth(status)),
				KissTheme.card('Controls', this.renderControls(status))
			]),

			// Emancipate and Import
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Public Exposure', this.renderEmancipate(status)),
				KissTheme.card('Video Import', this.renderImport(status))
			])
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var running = status.running === 'true';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'PeerTube'),
					KissTheme.badge(running ? 'RUNNING' : (status.container_state === 'not_installed' ? 'NOT INSTALLED' : 'STOPPED'),
						running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Decentralized video streaming platform')
			]),

			// Navigation
			this.renderNav('overview'),

			// Content
			E('div', { 'id': 'peertube-content' }, this.renderContent(data))
		];

		poll.add(function() {
			return api.status().then(function(s) {
				// Status update
			});
		}, 10);

		return KissTheme.wrap(content, 'admin/services/peertube/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
