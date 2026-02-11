'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';

var callStatus = rpc.declare({
	object: 'luci.jellyfin',
	method: 'status',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.jellyfin',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.jellyfin',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.jellyfin',
	method: 'restart',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.jellyfin',
	method: 'install',
	expect: {}
});

var callUninstall = rpc.declare({
	object: 'luci.jellyfin',
	method: 'uninstall',
	expect: {}
});

var callUpdate = rpc.declare({
	object: 'luci.jellyfin',
	method: 'update',
	expect: {}
});

var callConfigureHaproxy = rpc.declare({
	object: 'luci.jellyfin',
	method: 'configure_haproxy',
	expect: {}
});

var callBackup = rpc.declare({
	object: 'luci.jellyfin',
	method: 'backup',
	expect: {}
});

var callLogs = rpc.declare({
	object: 'luci.jellyfin',
	method: 'logs',
	params: ['lines'],
	expect: {}
});

var callGetWizardStatus = rpc.declare({
	object: 'luci.jellyfin',
	method: 'get_wizard_status',
	expect: {}
});

var callSetWizardComplete = rpc.declare({
	object: 'luci.jellyfin',
	method: 'set_wizard_complete',
	params: ['complete'],
	expect: {}
});

var callAddMediaPath = rpc.declare({
	object: 'luci.jellyfin',
	method: 'add_media_path',
	params: ['path', 'name', 'type'],
	expect: {}
});

var callRemoveMediaPath = rpc.declare({
	object: 'luci.jellyfin',
	method: 'remove_media_path',
	params: ['section'],
	expect: {}
});

var callGetMediaPaths = rpc.declare({
	object: 'luci.jellyfin',
	method: 'get_media_paths',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('jellyfin'),
			callStatus(),
			callGetWizardStatus(),
			callGetMediaPaths()
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var wizardStatus = data[2] || {};
		var mediaPaths = data[3] || {};
		var self = this;
		var m, s, o;

		// Store for wizard access
		this.status = status;
		this.wizardData = {
			mediaPaths: (mediaPaths.paths || []).slice(),
			domain: status.domain || '',
			haproxy: status.haproxy || false,
			acme: false
		};

		// Load wizard CSS
		if (!document.querySelector('link[href*="jellyfin/wizard.css"]')) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = L.resource('jellyfin/wizard.css');
			document.head.appendChild(link);
		}

		// Auto-show wizard on first run
		if (wizardStatus.show_wizard) {
			setTimeout(L.bind(this.showSetupWizard, this), 500);
		}

		m = new form.Map('jellyfin', _('Jellyfin Media Server'),
			_('Free media server for streaming movies, TV shows, music, and photos.'));

		/* ---- Status Section ---- */
		s = m.section(form.NamedSection, 'main', 'jellyfin', _('Service Status'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_status', _('Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var cs = status.container_status || 'unknown';
			var color = cs === 'running' ? '#27ae60' : (cs === 'stopped' ? '#e74c3c' : '#8892b0');
			var label = cs === 'running' ? 'Running' : (cs === 'stopped' ? 'Stopped' : 'Not Installed');
			var html = '<span style="color:' + color + '; font-weight: bold;">' + label + '</span>';
			if (cs === 'running' && status.container_uptime)
				html += ' <span style="color: #8892b0;">(' + status.container_uptime + ')</span>';
			return html;
		};

		o = s.option(form.DummyValue, '_docker', _('Docker'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			return status.docker_available
				? '<span style="color:#27ae60;">Available</span>'
				: '<span style="color:#e74c3c;">Not available</span>';
		};

		o = s.option(form.DummyValue, '_info', _('Details'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var port = status.port || 8096;
			var html = '<table style="border-collapse:collapse;">';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Image:</td><td>' + (status.image || '-') + '</td></tr>';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Port:</td><td>' + port + '</td></tr>';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Data:</td><td>' + (status.data_path || '-') + '</td></tr>';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Domain:</td><td>' + (status.domain || '-') + '</td></tr>';
			if (status.disk_usage)
				html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Disk:</td><td>' + status.disk_usage + '</td></tr>';
			if (status.media_paths && status.media_paths.length > 0)
				html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Media:</td><td>' + status.media_paths.join('<br>') + '</td></tr>';
			html += '</table>';
			return html;
		};

		/* ---- Integration Status ---- */
		o = s.option(form.DummyValue, '_integrations', _('Integrations'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var html = '<table style="border-collapse:collapse;">';

			// HAProxy
			var hc = '#8892b0', hl = 'Disabled';
			if (status.haproxy_status === 'configured') {
				hc = '#27ae60'; hl = 'Configured (' + (status.domain || '') + ')';
			} else if (status.haproxy_status === 'pending') {
				hc = '#f39c12'; hl = 'Enabled (not yet configured)';
			}
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">HAProxy:</td><td style="color:' + hc + ';">' + hl + '</td></tr>';

			// Mesh
			var mc = status.mesh_enabled ? '#27ae60' : '#8892b0';
			var ml = status.mesh_enabled ? 'Enabled' : 'Disabled';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Mesh P2P:</td><td style="color:' + mc + ';">' + ml + '</td></tr>';

			// Firewall
			var fc = status.firewall_wan ? '#27ae60' : '#8892b0';
			var fl = status.firewall_wan ? 'WAN access on port ' + (status.port || 8096) : 'LAN only';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Firewall:</td><td style="color:' + fc + ';">' + fl + '</td></tr>';

			html += '</table>';
			return html;
		};

		/* ---- Action Buttons ---- */
		var cs = status.container_status || 'not_installed';

		if (cs === 'not_installed') {
			o = s.option(form.Button, '_install', _('Install'));
			o.inputtitle = _('Install Jellyfin');
			o.inputstyle = 'apply';
			o.onclick = function() {
				ui.showModal(_('Installing...'), [
					E('p', { 'class': 'spinning' }, _('Pulling Docker image and configuring...'))
				]);
				return callInstall().then(function(res) {
					ui.hideModal();
					if (res && res.success) {
						ui.addNotification(null, E('p', {}, _('Jellyfin installed successfully.')), 'info');
					} else {
						ui.addNotification(null, E('p', {}, _('Installation failed: ') + (res.output || 'Unknown error')), 'danger');
					}
					window.location.href = window.location.pathname + '?' + Date.now();
				});
			};
		} else {
			if (cs === 'stopped') {
				o = s.option(form.Button, '_start', _('Start'));
				o.inputtitle = _('Start');
				o.inputstyle = 'apply';
				o.onclick = function() {
					return callStart().then(function() {
						window.location.href = window.location.pathname + '?' + Date.now();
					});
				};
			}

			if (cs === 'running') {
				o = s.option(form.Button, '_stop', _('Stop'));
				o.inputtitle = _('Stop');
				o.inputstyle = 'remove';
				o.onclick = function() {
					return callStop().then(function() {
						window.location.href = window.location.pathname + '?' + Date.now();
					});
				};

				o = s.option(form.Button, '_restart', _('Restart'));
				o.inputtitle = _('Restart');
				o.inputstyle = 'reload';
				o.onclick = function() {
					return callRestart().then(function() {
						window.location.href = window.location.pathname + '?' + Date.now();
					});
				};

				o = s.option(form.Button, '_webui', _('Web UI'));
				o.inputtitle = _('Open Web UI');
				o.inputstyle = 'action';
				o.onclick = function() {
					var port = status.port || 8096;
					window.open('http://' + window.location.hostname + ':' + port, '_blank');
				};
			}

			o = s.option(form.Button, '_update', _('Update'));
			o.inputtitle = _('Pull Latest Image');
			o.inputstyle = 'action';
			o.onclick = function() {
				ui.showModal(_('Updating...'), [
					E('p', { 'class': 'spinning' }, _('Pulling latest Docker image and restarting...'))
				]);
				return callUpdate().then(function(res) {
					ui.hideModal();
					if (res && res.success) {
						ui.addNotification(null, E('p', {}, _('Jellyfin updated successfully.')), 'info');
					} else {
						ui.addNotification(null, E('p', {}, _('Update failed: ') + (res.output || 'Unknown error')), 'danger');
					}
					window.location.href = window.location.pathname + '?' + Date.now();
				});
			};

			o = s.option(form.Button, '_backup', _('Backup'));
			o.inputtitle = _('Create Backup');
			o.inputstyle = 'action';
			o.onclick = function() {
				return callBackup().then(function(res) {
					if (res && res.success) {
						ui.addNotification(null, E('p', {}, _('Backup created: ') + (res.path || '')), 'info');
					} else {
						ui.addNotification(null, E('p', {}, _('Backup failed: ') + (res.output || 'Unknown error')), 'danger');
					}
				});
			};

			o = s.option(form.Button, '_uninstall', _('Uninstall'));
			o.inputtitle = _('Uninstall');
			o.inputstyle = 'remove';
			o.onclick = function() {
				if (!confirm(_('Are you sure you want to uninstall Jellyfin? Data will be preserved.')))
					return;
				ui.showModal(_('Uninstalling...'), [
					E('p', { 'class': 'spinning' }, _('Removing container and integrations...'))
				]);
				return callUninstall().then(function(res) {
					ui.hideModal();
					if (res && res.success) {
						ui.addNotification(null, E('p', {}, _('Jellyfin uninstalled.')), 'info');
					} else {
						ui.addNotification(null, E('p', {}, _('Uninstall failed: ') + (res.output || 'Unknown error')), 'danger');
					}
					window.location.href = window.location.pathname + '?' + Date.now();
				});
			};
		}

		/* ---- Configuration Section ---- */
		s = m.section(form.NamedSection, 'main', 'jellyfin', _('Configuration'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable the Jellyfin service.'));
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Port'),
			_('HTTP port for the Jellyfin web interface.'));
		o.datatype = 'port';
		o.placeholder = '8096';

		o = s.option(form.Value, 'image', _('Docker Image'),
			_('Docker image to use.'));
		o.placeholder = 'jellyfin/jellyfin:latest';

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path for Jellyfin config and cache data.'));
		o.placeholder = '/srv/jellyfin';

		o = s.option(form.Value, 'timezone', _('Timezone'));
		o.placeholder = 'Europe/Paris';

		/* ---- Network / Domain Section ---- */
		s = m.section(form.NamedSection, 'network', 'jellyfin', _('Network & Domain'));
		s.anonymous = true;

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Domain name for accessing Jellyfin via HAProxy reverse proxy.'));
		o.placeholder = 'jellyfin.secubox.local';

		o = s.option(form.Value, 'public_url', _('Public URL'),
			_('Full public URL if different from domain (e.g. https://media.example.com).'));
		o.placeholder = 'https://media.example.com';

		o = s.option(form.Flag, 'haproxy', _('HAProxy Integration'),
			_('Register Jellyfin as an HAProxy vhost for reverse proxy access.'));
		o.rmempty = false;

		o = s.option(form.Flag, 'haproxy_ssl', _('SSL'),
			_('Enable SSL for the HAProxy vhost.'));
		o.rmempty = false;
		o.depends('haproxy', '1');

		o = s.option(form.Flag, 'haproxy_ssl_redirect', _('Force HTTPS'),
			_('Redirect HTTP requests to HTTPS.'));
		o.rmempty = false;
		o.depends('haproxy', '1');

		o = s.option(form.Flag, 'firewall_wan', _('WAN Access'),
			_('Allow direct WAN access to the Jellyfin port (bypassing HAProxy).'));
		o.rmempty = false;

		o = s.option(form.Button, '_apply_haproxy', _('Apply HAProxy'));
		o.inputtitle = _('Configure HAProxy Now');
		o.inputstyle = 'action';
		o.depends('haproxy', '1');
		o.onclick = function() {
			return callConfigureHaproxy().then(function(res) {
				if (res && res.success) {
					ui.addNotification(null, E('p', {}, _('HAProxy configured successfully.')), 'info');
				} else {
					ui.addNotification(null, E('p', {}, _('HAProxy configuration failed: ') + (res.output || 'Unknown error')), 'danger');
				}
			});
		};

		/* ---- Media Libraries ---- */
		s = m.section(form.NamedSection, 'media', 'jellyfin', _('Media Libraries'));
		s.anonymous = true;

		o = s.option(form.DynamicList, 'media_path', _('Media Paths'),
			_('Directories containing your media files. Mounted read-only into the container.'));
		o.placeholder = '/mnt/media/movies';

		/* ---- Transcoding ---- */
		s = m.section(form.NamedSection, 'transcoding', 'jellyfin', _('Hardware Transcoding'));
		s.anonymous = true;

		o = s.option(form.Flag, 'hw_accel', _('Hardware Acceleration'),
			_('Enable GPU hardware transcoding. Requires a compatible GPU device.'));
		o.rmempty = false;

		o = s.option(form.Value, 'gpu_device', _('GPU Device'),
			_('Path to the GPU device for hardware transcoding.'));
		o.placeholder = '/dev/dri';
		o.depends('hw_accel', '1');

		/* ---- Mesh P2P Section ---- */
		s = m.section(form.NamedSection, 'mesh', 'jellyfin', _('Mesh P2P'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Mesh Integration'),
			_('Register Jellyfin with the SecuBox P2P mesh network for discovery by other nodes.'));
		o.rmempty = false;

		o = s.option(form.Flag, 'announce_service', _('Announce Service'),
			_('Announce this Jellyfin instance to mesh peers.'));
		o.rmempty = false;
		o.depends('enabled', '1');

		/* ---- Logs Section ---- */
		s = m.section(form.NamedSection, 'main', 'jellyfin', _('Logs'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_logs', ' ');
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '<div id="jellyfin-logs" style="background:#0a0a1a; color:#ccc; padding:8px; ' +
				'border-radius:4px; font-family:monospace; font-size:12px; max-height:300px; ' +
				'overflow-y:auto; white-space:pre-wrap; min-height:40px;">Click "Fetch Logs" to view container output.</div>';
		};

		o = s.option(form.Button, '_fetch_logs', _('Fetch Logs'));
		o.inputtitle = _('Fetch Logs');
		o.inputstyle = 'action';
		o.onclick = function() {
			var logsDiv = document.getElementById('jellyfin-logs');
			if (logsDiv) logsDiv.textContent = 'Loading...';
			return callLogs(50).then(function(res) {
				if (logsDiv) logsDiv.textContent = (res && res.logs) ? res.logs : 'No logs available.';
			});
		};

		return m.render();
	},

	/* ---- Setup Wizard ---- */
	showSetupWizard: function() {
		this.wizardStep = 1;
		this.updateWizardModal();
	},

	updateWizardModal: function() {
		var self = this;
		var steps = ['Welcome', 'Media', 'Network', 'Complete'];

		var content = E('div', { 'class': 'jf-wizard' }, [
			// Progress indicator
			E('div', { 'class': 'jf-wizard-steps' }, steps.map(function(label, idx) {
				var stepNum = idx + 1;
				var cls = 'jf-wizard-step';
				if (stepNum < self.wizardStep) cls += ' completed';
				if (stepNum === self.wizardStep) cls += ' active';
				return E('div', { 'class': cls }, [
					E('span', { 'class': 'jf-step-num' }, String(stepNum)),
					E('span', { 'class': 'jf-step-label' }, label)
				]);
			})),
			// Step content
			E('div', { 'class': 'jf-wizard-content' }, this.renderWizardStep())
		]);

		ui.showModal(_('Jellyfin Setup'), [
			content,
			E('div', { 'class': 'jf-wizard-buttons' }, this.renderWizardButtons())
		]);
	},

	renderWizardStep: function() {
		switch (this.wizardStep) {
			case 1: return this.renderStepWelcome();
			case 2: return this.renderStepMedia();
			case 3: return this.renderStepNetwork();
			case 4: return this.renderStepComplete();
		}
		return E('div', {}, 'Unknown step');
	},

	renderWizardButtons: function() {
		var self = this;
		var buttons = [];

		if (this.wizardStep > 1) {
			buttons.push(E('button', {
				'class': 'btn',
				'click': function() { self.wizardStep--; self.updateWizardModal(); }
			}, _('Back')));
		}

		buttons.push(E('button', {
			'class': 'btn',
			'click': function() { ui.hideModal(); }
		}, _('Skip Setup')));

		if (this.wizardStep < 4) {
			buttons.push(E('button', {
				'class': 'btn cbi-button-action',
				'click': L.bind(this.nextWizardStep, this)
			}, _('Next')));
		} else {
			buttons.push(E('button', {
				'class': 'btn cbi-button-action',
				'click': L.bind(this.finishWizard, this)
			}, _('Finish Setup')));
		}

		return buttons;
	},

	nextWizardStep: function() {
		// Save data from current step before advancing
		if (this.wizardStep === 3) {
			var domain = document.getElementById('jf-domain');
			var haproxy = document.getElementById('jf-haproxy');
			var acme = document.getElementById('jf-acme');
			if (domain) this.wizardData.domain = domain.value;
			if (haproxy) this.wizardData.haproxy = haproxy.checked;
			if (acme) this.wizardData.acme = acme.checked;
		}
		this.wizardStep++;
		this.updateWizardModal();
	},

	finishWizard: function() {
		var self = this;
		ui.hideModal();
		ui.showModal(_('Finishing Setup...'), [
			E('p', { 'class': 'spinning' }, _('Saving configuration...'))
		]);

		callSetWizardComplete(1).then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Jellyfin setup complete!')), 'info');
			window.location.href = window.location.pathname + '?' + Date.now();
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Failed to save wizard status.')), 'danger');
		});
	},

	renderStepWelcome: function() {
		var running = this.status && this.status.container_status === 'running';
		var installed = this.status && this.status.container_status !== 'not_installed';
		var self = this;

		var items = [
			E('p', { 'style': 'font-size: 16px; margin-bottom: 16px;' },
				_('Welcome to Jellyfin! This wizard will help you configure your media server.'))
		];

		// Docker check
		items.push(E('div', { 'class': 'jf-status-check' }, [
			E('span', { 'class': this.status.docker_available ? 'jf-check-ok' : 'jf-check-pending' },
				this.status.docker_available ? '\u2713' : '\u25CB'),
			' Docker is ' + (this.status.docker_available ? 'available' : 'not available')
		]));

		// Container check
		items.push(E('div', { 'class': 'jf-status-check', 'style': 'margin-top: 8px;' }, [
			E('span', { 'class': running ? 'jf-check-ok' : 'jf-check-pending' },
				running ? '\u2713' : '\u25CB'),
			' Jellyfin container is ' + (running ? 'running' : (installed ? 'stopped' : 'not installed'))
		]));

		// Action buttons
		if (!installed && this.status.docker_available) {
			items.push(E('button', {
				'class': 'btn cbi-button-action',
				'style': 'margin-top: 12px;',
				'click': function() {
					ui.hideModal();
					ui.showModal(_('Installing...'), [
						E('p', { 'class': 'spinning' }, _('Pulling Docker image and configuring...'))
					]);
					callInstall().then(function(res) {
						ui.hideModal();
						if (res && res.success) {
							self.status.container_status = 'running';
							self.showSetupWizard();
						} else {
							ui.addNotification(null, E('p', {}, _('Installation failed: ') + (res.output || 'Unknown')), 'danger');
						}
					});
				}
			}, _('Install Jellyfin')));
		} else if (installed && !running) {
			items.push(E('button', {
				'class': 'btn cbi-button-action',
				'style': 'margin-top: 12px;',
				'click': function() {
					callStart().then(function() {
						self.status.container_status = 'running';
						self.updateWizardModal();
					});
				}
			}, _('Start Jellyfin')));
		}

		return E('div', {}, items);
	},

	renderStepMedia: function() {
		var self = this;
		var paths = this.wizardData.mediaPaths || [];

		var items = [
			E('p', {}, _('Add your media library folders:'))
		];

		// Path list
		if (paths.length > 0) {
			items.push(E('div', { 'class': 'jf-media-list' }, paths.map(function(p) {
				return E('div', { 'class': 'jf-media-item' }, [
					E('span', { 'class': 'jf-media-icon' }, self.getMediaIcon(p.type)),
					E('span', { 'class': 'jf-media-name' }, p.name),
					E('span', { 'class': 'jf-media-path' }, p.path),
					E('button', {
						'class': 'btn btn-sm',
						'style': 'padding: 2px 8px;',
						'click': L.bind(self.removeMediaPath, self, p.section)
					}, '\u00D7')
				]);
			})));
		} else {
			items.push(E('p', { 'style': 'color: #888; font-style: italic;' },
				_('No media libraries configured yet.')));
		}

		// Add new path form
		items.push(E('div', { 'style': 'margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;' }, [
			E('select', { 'id': 'media-type', 'style': 'width: 110px; padding: 6px;' }, [
				E('option', { 'value': 'movies' }, 'Movies'),
				E('option', { 'value': 'tvshows' }, 'TV Shows'),
				E('option', { 'value': 'music' }, 'Music'),
				E('option', { 'value': 'photos' }, 'Photos')
			]),
			E('input', {
				'id': 'media-name', 'type': 'text', 'placeholder': _('Name'),
				'style': 'width: 120px; padding: 6px;'
			}),
			E('input', {
				'id': 'media-path', 'type': 'text', 'placeholder': '/srv/media/movies',
				'style': 'flex: 1; min-width: 150px; padding: 6px;'
			}),
			E('button', {
				'class': 'btn cbi-button-action',
				'click': L.bind(this.addMediaPath, this)
			}, _('Add'))
		]));

		// Presets
		items.push(E('div', { 'style': 'margin-top: 8px;' }, [
			E('span', { 'style': 'color: #888; font-size: 12px;' }, _('Presets: ')),
			E('button', { 'class': 'btn btn-sm', 'style': 'font-size: 11px;', 'click': function() {
				document.getElementById('media-path').value = '/srv/media';
			}}, '/srv/media'),
			' ',
			E('button', { 'class': 'btn btn-sm', 'style': 'font-size: 11px;', 'click': function() {
				document.getElementById('media-path').value = '/mnt/smbfs';
			}}, '/mnt/smbfs')
		]));

		return E('div', {}, items);
	},

	getMediaIcon: function(type) {
		switch(type) {
			case 'movies': return '\u{1F3AC}';
			case 'tvshows': return '\u{1F4FA}';
			case 'music': return '\u{1F3B5}';
			case 'photos': return '\u{1F4F7}';
			default: return '\u{1F4C1}';
		}
	},

	addMediaPath: function() {
		var self = this;
		var typeEl = document.getElementById('media-type');
		var nameEl = document.getElementById('media-name');
		var pathEl = document.getElementById('media-path');

		var type = typeEl ? typeEl.value : 'movies';
		var name = nameEl ? nameEl.value : '';
		var path = pathEl ? pathEl.value : '';

		if (!path) {
			ui.addNotification(null, E('p', {}, _('Path is required')), 'warning');
			return;
		}
		if (!name) {
			name = type.charAt(0).toUpperCase() + type.slice(1);
		}

		callAddMediaPath(path, name, type).then(function(res) {
			if (res && res.success) {
				self.wizardData.mediaPaths.push({
					section: res.section,
					path: path,
					name: name,
					type: type
				});
				if (nameEl) nameEl.value = '';
				if (pathEl) pathEl.value = '';
				self.updateWizardModal();
			} else {
				ui.addNotification(null, E('p', {}, _('Failed to add path: ') + (res.error || 'Unknown')), 'danger');
			}
		});
	},

	removeMediaPath: function(section) {
		var self = this;
		callRemoveMediaPath(section).then(function(res) {
			if (res && res.success) {
				self.wizardData.mediaPaths = self.wizardData.mediaPaths.filter(function(p) {
					return p.section !== section;
				});
				self.updateWizardModal();
			}
		});
	},

	renderStepNetwork: function() {
		return E('div', {}, [
			E('p', {}, _('Configure network access (optional):')),

			E('div', { 'class': 'jf-form-group' }, [
				E('label', {}, _('Domain (for HTTPS access)')),
				E('input', {
					'id': 'jf-domain', 'type': 'text',
					'placeholder': 'jellyfin.example.com',
					'value': this.wizardData.domain || '',
					'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; border-radius: 4px; color: #fff;'
				})
			]),

			E('div', { 'class': 'jf-form-group' }, [
				E('label', { 'class': 'jf-checkbox' }, [
					E('input', {
						'id': 'jf-haproxy', 'type': 'checkbox',
						'checked': this.wizardData.haproxy
					}),
					' ' + _('Enable HAProxy reverse proxy')
				])
			]),

			E('div', { 'class': 'jf-form-group' }, [
				E('label', { 'class': 'jf-checkbox' }, [
					E('input', {
						'id': 'jf-acme', 'type': 'checkbox',
						'checked': this.wizardData.acme
					}),
					' ' + _('Request SSL certificate (ACME)')
				])
			]),

			E('p', { 'style': 'color: #888; font-size: 12px; margin-top: 16px;' },
				_('You can configure these settings later from the Network & Domain section.'))
		]);
	},

	renderStepComplete: function() {
		var port = (this.status && this.status.port) || 8096;
		return E('div', { 'style': 'text-align: center;' }, [
			E('div', { 'style': 'font-size: 48px; margin-bottom: 16px; color: #27ae60;' }, '\u2713'),
			E('h3', { 'style': 'margin: 0 0 16px 0;' }, _('Setup Complete!')),
			E('p', {}, _('Jellyfin is ready. Open the web interface to complete initial configuration:')),
			E('a', {
				'href': 'http://' + window.location.hostname + ':' + port,
				'target': '_blank',
				'class': 'btn cbi-button-action',
				'style': 'margin-top: 16px; display: inline-block;'
			}, _('Open Jellyfin Web UI')),
			E('p', { 'style': 'color: #888; font-size: 12px; margin-top: 24px;' },
				_('Click "Finish Setup" to dismiss this wizard.'))
		]);
	}
});
