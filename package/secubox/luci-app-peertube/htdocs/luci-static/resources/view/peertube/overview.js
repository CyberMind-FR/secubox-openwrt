'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require form';
'require peertube.api as api';

return view.extend({
	handleAction: function(action, args) {
		var self = this;
		var btn = document.activeElement;

		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Processing request...'))
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
				if (!confirm(_('This will remove the PeerTube container. Video data will be preserved. Continue?')))
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
					ui.addNotification(null, E('p', _('Domain is required')), 'error');
					return;
				}
				promise = api.emancipate(domain);
				break;
			case 'import_video':
				var url = args;
				if (!url) {
					ui.hideModal();
					ui.addNotification(null, E('p', _('Video URL is required')), 'error');
					return;
				}
				promise = api.importVideo(url).then(function(res) { if (res && res.success && res.job_id) { self.pollImportJob(res.job_id); } return res; });
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', res.message || _('Action completed')), 'success');
				self.load().then(function(data) {
					dom.content(document.querySelector('#peertube-content'), self.renderContent(data));
				});
			} else {
				ui.addNotification(null, E('p', res.error || _('Action failed')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	pollImportJob: function(jobId) {
		var self = this;
		var statusDiv = document.getElementById('import-status');
		var pollCount = 0;
		var maxPolls = 120; // 10 minutes max (5s intervals)

		var updateStatus = function(status, message, isError) {
			if (statusDiv) {
				statusDiv.style.display = 'block';
				statusDiv.style.background = isError ? '#ffebee' : (status === 'completed' ? '#e8f5e9' : '#e3f2fd');
				statusDiv.innerHTML = '<span style="color:' + (isError ? '#c62828' : (status === 'completed' ? '#2e7d32' : '#1565c0')) + ';">' + message + '</span>';
			}
		};

		var poll = function() {
			api.importJobStatus(jobId).then(function(res) {
				pollCount++;

				switch(res.status) {
					case 'downloading':
						updateStatus('downloading', _('⬇️ Downloading video...'));
						break;
					case 'uploading':
						updateStatus('uploading', _('⬆️ Uploading to PeerTube...'));
						break;
					case 'completed':
						var videoUrl = res.video_uuid ?
							'https://' + (document.getElementById('emancipate-domain').value || 'tube.gk2.secubox.in') + '/w/' + res.video_uuid :
							'';
						updateStatus('completed', _('✅ Import complete! ') + (videoUrl ? '<a href="' + videoUrl + '" target="_blank">' + _('View video') + '</a>' : ''));
						ui.addNotification(null, E('p', _('Video imported successfully!')), 'success');
						return;
					case 'download_failed':
						updateStatus('error', _('❌ Download failed'), true);
						return;
					case 'upload_failed':
						updateStatus('error', _('❌ Upload failed'), true);
						return;
					case 'file_not_found':
						updateStatus('error', _('❌ Downloaded file not found'), true);
						return;
					default:
						if (pollCount >= maxPolls) {
							updateStatus('error', _('❌ Timeout waiting for import'), true);
							return;
						}
				}

				// Continue polling
				setTimeout(poll, 5000);
			}).catch(function(e) {
				updateStatus('error', _('❌ Error: ') + e.message, true);
			});
		};

		// Start polling
		updateStatus('starting', _('🚀 Starting import...'));
		setTimeout(poll, 2000);
	},

	load: function() {
		return Promise.all([
			api.status(),
			uci.load('peertube')
		]);
	},

	renderInstallWizard: function() {
		var self = this;

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('PeerTube Video Platform')),
			E('p', {}, _('PeerTube is a free, decentralized and federated video streaming platform. Videos are stored locally and can be shared across the Fediverse using ActivityPub.')),
			E('div', { 'class': 'cbi-value' }, [
				E('h4', {}, _('Features')),
				E('ul', {}, [
					E('li', {}, _('Self-hosted video hosting with HLS streaming')),
					E('li', {}, _('Live streaming with RTMP ingest')),
					E('li', {}, _('Automatic transcoding to multiple resolutions')),
					E('li', {}, _('Federation via ActivityPub protocol')),
					E('li', {}, _('User management and access controls')),
					E('li', {}, _('WebTorrent for distributed video delivery'))
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('h4', {}, _('Requirements')),
				E('ul', {}, [
					E('li', {}, _('Minimum 2GB RAM recommended')),
					E('li', {}, _('10GB storage for system + additional for videos')),
					E('li', {}, _('Network access for container downloads'))
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': function() { self.handleAction('install'); }
				}, _('Install PeerTube'))
			])
		]);
	},

	renderStatusBadge: function(running) {
		var color = running === 'true' ? '#4CAF50' : '#f44336';
		var text = running === 'true' ? _('Running') : _('Stopped');
		return E('span', {
			'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + color
		}, text);
	},

	renderContent: function(data) {
		var self = this;
		var status = data[0] || {};

		if (status.container_state === 'not_installed') {
			return this.renderInstallWizard();
		}

		var running = status.running === 'true';
		var liveEnabled = status.live_enabled === '1';
		var haproxyConfigured = status.haproxy === '1';
		var domain = status.domain || '';

		var accessUrl = '';
		if (running) {
			if (domain && haproxyConfigured) {
				accessUrl = (status.https === '1' ? 'https://' : 'http://') + domain;
			} else {
				accessUrl = 'http://192.168.255.1:' + (status.port || '9000');
			}
		}

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('PeerTube Video Platform')),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Status')),
				E('div', { 'class': 'cbi-value-field' }, this.renderStatusBadge(status.running))
			]),

			running && accessUrl ? E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Access URL')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('a', { 'href': accessUrl, 'target': '_blank' }, accessUrl)
				])
			]) : '',

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Hostname')),
				E('div', { 'class': 'cbi-value-field' }, status.hostname || '-')
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Port')),
				E('div', { 'class': 'cbi-value-field' }, status.port || '9000')
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Live Streaming')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('span', {
						'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + (liveEnabled ? '#4CAF50' : '#9e9e9e')
					}, liveEnabled ? _('Enabled') : _('Disabled')),
					' ',
					liveEnabled ?
						E('button', {
							'class': 'btn cbi-button',
							'click': function() { self.handleAction('live_disable'); }
						}, _('Disable')) :
						E('button', {
							'class': 'btn cbi-button',
							'click': function() { self.handleAction('live_enable'); }
						}, _('Enable'))
				])
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('HAProxy')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('span', {
						'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + (haproxyConfigured ? '#4CAF50' : '#9e9e9e')
					}, haproxyConfigured ? _('Configured') : _('Not configured')),
					' ',
					!haproxyConfigured ? E('button', {
						'class': 'btn cbi-button',
						'click': function() { self.handleAction('configure_haproxy'); }
					}, _('Configure')) : ''
				])
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain')),
				E('div', { 'class': 'cbi-value-field' }, domain || _('Not configured'))
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Admin Email')),
				E('div', { 'class': 'cbi-value-field' }, status.admin_email || '-')
			]),

			E('hr'),

			E('h4', {}, _('Service Controls')),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin-bottom: 20px;' }, [
				running ?
					E('button', {
						'class': 'btn cbi-button cbi-button-negative',
						'click': function() { self.handleAction('stop'); }
					}, _('Stop')) :
					E('button', {
						'class': 'btn cbi-button cbi-button-positive',
						'click': function() { self.handleAction('start'); }
					}, _('Start')),
				' ',
				E('button', {
					'class': 'btn cbi-button',
					'click': function() { self.handleAction('update'); }
				}, _('Update')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': function() { self.handleAction('uninstall'); }
				}, _('Uninstall'))
			]),

			E('hr'),

			E('h4', {}, _('Emancipate (Public Exposure)')),
			E('p', {}, _('Make PeerTube publicly accessible with SSL certificate and DNS configuration.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'emancipate-domain',
						'class': 'cbi-input-text',
						'placeholder': 'peertube.example.com',
						'value': domain
					})
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': function() {
						var domainInput = document.getElementById('emancipate-domain');
						self.handleAction('emancipate', domainInput.value);
					}
				}, _('Emancipate'))
			]),

			E('hr'),

			E('h4', {}, _('Import Video (Auto-Upload)')),
			E('p', {}, _('Download videos from YouTube, Vimeo, and 1000+ sites. Videos are automatically uploaded to PeerTube.')),
			E('div', { 'id': 'import-status', 'style': 'padding: 10px; margin-bottom: 10px; border-radius: 4px; background: #f5f5f5; display: none;' }),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Video URL')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'import-video-url',
						'class': 'cbi-input-text',
						'placeholder': 'https://www.youtube.com/watch?v=...',
						'style': 'width: 100%; max-width: 500px;'
					})
				])
			]),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin-bottom: 15px;' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': function() {
						var urlInput = document.getElementById('import-video-url');
						self.handleAction('import_video', urlInput.value);
					}
				}, _('Import & Upload')),
				' ',
				E('button', {
					'class': 'btn cbi-button',
					'click': function() {
						api.importStatus().then(function(res) {
							var statusText = res.downloading === 'true' ?
								_('Download in progress...') :
								_('No download running');
							statusText += '\n' + _('Videos ready: ') + (res.video_count || 0);
							if (res.files) {
								statusText += '\n\n' + res.files;
							}
							ui.showModal(_('Import Status'), [
								E('pre', { 'style': 'white-space: pre-wrap; max-height: 300px; overflow: auto;' }, statusText),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						});
					}
				}, _('Check Status'))
			]),
			E('p', { 'style': 'font-size: 12px; color: #666;' }, [
				_('Supported sites: YouTube, Vimeo, Dailymotion, Twitter, TikTok, and '),
				E('a', { 'href': 'https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md', 'target': '_blank' }, _('1000+ more')),
				_('. Videos are saved to the import folder for manual upload via PeerTube admin.')
			]),

			E('hr'),

			E('h4', {}, _('Logs')),
			E('div', { 'id': 'peertube-logs' }, [
				E('pre', {
					'style': 'background:#1e1e1e;color:#d4d4d4;padding:10px;max-height:300px;overflow:auto;font-size:12px;border-radius:4px;'
				}, _('Loading logs...'))
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button',
					'click': function() {
						api.logs(100).then(function(res) {
							var logsEl = document.querySelector('#peertube-logs pre');
							if (logsEl) {
								logsEl.textContent = res.logs || _('No logs available');
							}
						});
					}
				}, _('Refresh Logs'))
			])
		]);
	},

	render: function(data) {
		var self = this;

		var content = E('div', { 'id': 'peertube-content' }, this.renderContent(data));

		// Load logs initially
		api.logs(50).then(function(res) {
			var logsEl = document.querySelector('#peertube-logs pre');
			if (logsEl) {
				logsEl.textContent = res.logs || _('No logs available');
			}
		});

		// Poll for status updates
		poll.add(function() {
			return api.status().then(function(status) {
				var statusBadge = document.querySelector('.cbi-value-field span');
				// Status badge is the first one - update if running state changed
			});
		}, 10);

		return content;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
