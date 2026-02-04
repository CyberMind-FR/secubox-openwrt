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

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('jellyfin'),
			callStatus()
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var m, s, o;

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
	}
});
