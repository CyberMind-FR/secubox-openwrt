'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';

var callStatus = rpc.declare({
	object: 'luci.domoticz',
	method: 'status',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.domoticz',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.domoticz',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.domoticz',
	method: 'restart',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.domoticz',
	method: 'install',
	expect: {}
});

var callUninstall = rpc.declare({
	object: 'luci.domoticz',
	method: 'uninstall',
	expect: {}
});

var callUpdate = rpc.declare({
	object: 'luci.domoticz',
	method: 'update',
	expect: {}
});

var callConfigureMqtt = rpc.declare({
	object: 'luci.domoticz',
	method: 'configure_mqtt',
	expect: {}
});

var callConfigureHaproxy = rpc.declare({
	object: 'luci.domoticz',
	method: 'configure_haproxy',
	expect: {}
});

var callBackup = rpc.declare({
	object: 'luci.domoticz',
	method: 'backup',
	expect: {}
});

var callLogs = rpc.declare({
	object: 'luci.domoticz',
	method: 'logs',
	params: ['lines'],
	expect: {}
});

function statusColor(val) {
	if (val === 'running' || val === 'configured') return '#27ae60';
	if (val === 'stopped' || val === 'pending') return '#e74c3c';
	return '#8892b0';
}

function statusLabel(val) {
	if (val === 'running') return 'Running';
	if (val === 'stopped') return 'Stopped';
	if (val === 'not_installed') return 'Not Installed';
	if (val === 'configured') return 'Configured';
	if (val === 'pending') return 'Pending';
	if (val === 'disabled') return 'Disabled';
	return val || 'Unknown';
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('domoticz'),
			callStatus()
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var m, s, o;

		m = new form.Map('domoticz', _('Domoticz Home Automation'),
			_('Open-source home automation platform with IoT device management, MQTT bridge, and Zigbee integration.'));

		/* ---- Service Status ---- */
		s = m.section(form.NamedSection, 'main', 'domoticz', _('Service Status'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_status', _('Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var cs = status.container_status || 'unknown';
			var color = statusColor(cs);
			var label = statusLabel(cs);
			var html = '<span style="color:' + color + '; font-weight:bold;">' + label + '</span>';
			if (cs === 'running' && status.container_uptime)
				html += ' <span style="color:#8892b0;">(' + status.container_uptime + ')</span>';
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
			var port = status.port || 8080;
			var html = '<table style="border-collapse:collapse;">';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Image:</td><td>' + (status.image || '-') + '</td></tr>';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Port:</td><td>' + port + '</td></tr>';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Data:</td><td>' + (status.data_path || '-') + '</td></tr>';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Domain:</td><td>' + (status.domain || '-') + '</td></tr>';
			if (status.disk_usage)
				html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Disk:</td><td>' + status.disk_usage + '</td></tr>';
			if (status.usb_devices && status.usb_devices.length > 0)
				html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">USB:</td><td>' + status.usb_devices.join(', ') + '</td></tr>';
			html += '</table>';
			return html;
		};

		/* ---- IoT Integration Status ---- */
		o = s.option(form.DummyValue, '_iot', _('IoT Integration'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var html = '<table style="border-collapse:collapse;">';

			// Mosquitto
			var mc = statusColor(status.mosquitto_status);
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Mosquitto:</td>';
			html += '<td style="color:' + mc + ';">' + statusLabel(status.mosquitto_status) + '</td></tr>';

			// Zigbee2MQTT
			var zc = statusColor(status.z2m_status);
			var zl = statusLabel(status.z2m_status);
			if (status.z2m_status === 'running' && status.z2m_port)
				zl += ' (port ' + status.z2m_port + ')';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Zigbee2MQTT:</td>';
			html += '<td style="color:' + zc + ';">' + zl + '</td></tr>';

			// MQTT bridge
			var be = status.mqtt_enabled ? '#27ae60' : '#8892b0';
			var bl = status.mqtt_enabled
				? 'Enabled (' + (status.mqtt_broker || '127.0.0.1') + ':' + (status.mqtt_broker_port || 1883) + ')'
				: 'Disabled';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">MQTT Bridge:</td>';
			html += '<td style="color:' + be + ';">' + bl + '</td></tr>';

			html += '</table>';
			return html;
		};

		/* ---- Network Integration ---- */
		o = s.option(form.DummyValue, '_integrations', _('Network'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var html = '<table style="border-collapse:collapse;">';

			var hc = '#8892b0', hl = 'Disabled';
			if (status.haproxy_status === 'configured') {
				hc = '#27ae60'; hl = 'Configured (' + (status.domain || '') + ')';
			} else if (status.haproxy_status === 'pending') {
				hc = '#f39c12'; hl = 'Enabled (not yet configured)';
			}
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">HAProxy:</td><td style="color:' + hc + ';">' + hl + '</td></tr>';

			var meshc = status.mesh_enabled ? '#27ae60' : '#8892b0';
			var meshl = status.mesh_enabled ? 'Enabled' : 'Disabled';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Mesh P2P:</td><td style="color:' + meshc + ';">' + meshl + '</td></tr>';

			var fc = status.firewall_wan ? '#27ae60' : '#8892b0';
			var fl = status.firewall_wan ? 'WAN access on port ' + (status.port || 8080) : 'LAN only';
			html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Firewall:</td><td style="color:' + fc + ';">' + fl + '</td></tr>';

			html += '</table>';
			return html;
		};

		/* ---- Action Buttons ---- */
		var cs = status.container_status || 'not_installed';

		if (cs === 'not_installed') {
			o = s.option(form.Button, '_install', _('Install'));
			o.inputtitle = _('Install Domoticz');
			o.inputstyle = 'apply';
			o.onclick = function() {
				ui.showModal(_('Installing...'), [
					E('p', { 'class': 'spinning' }, _('Pulling Docker image and configuring...'))
				]);
				return callInstall().then(function(res) {
					ui.hideModal();
					if (res && res.success) {
						ui.addNotification(null, E('p', {}, _('Domoticz installed successfully.')), 'info');
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
				o.inputtitle = _('Open Domoticz UI');
				o.inputstyle = 'action';
				o.onclick = function() {
					var port = status.port || 8080;
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
						ui.addNotification(null, E('p', {}, _('Domoticz updated successfully.')), 'info');
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
				if (!confirm(_('Are you sure you want to uninstall Domoticz? Data will be preserved.')))
					return;
				ui.showModal(_('Uninstalling...'), [
					E('p', { 'class': 'spinning' }, _('Removing container and integrations...'))
				]);
				return callUninstall().then(function(res) {
					ui.hideModal();
					if (res && res.success) {
						ui.addNotification(null, E('p', {}, _('Domoticz uninstalled.')), 'info');
					} else {
						ui.addNotification(null, E('p', {}, _('Uninstall failed: ') + (res.output || 'Unknown error')), 'danger');
					}
					window.location.href = window.location.pathname + '?' + Date.now();
				});
			};
		}

		/* ---- Configuration Section ---- */
		s = m.section(form.NamedSection, 'main', 'domoticz', _('Configuration'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable the Domoticz service.'));
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Port'),
			_('HTTP port for the Domoticz web interface.'));
		o.datatype = 'port';
		o.placeholder = '8080';

		o = s.option(form.Value, 'image', _('Docker Image'),
			_('Docker image to use.'));
		o.placeholder = 'domoticz/domoticz:latest';

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path for Domoticz config and database.'));
		o.placeholder = '/srv/domoticz';

		o = s.option(form.Value, 'devices_path', _('Devices Path'),
			_('Path for USB device passthrough into container.'));
		o.placeholder = '/srv/devices';

		o = s.option(form.Value, 'timezone', _('Timezone'));
		o.placeholder = 'Europe/Paris';

		/* ---- MQTT & Zigbee Section ---- */
		s = m.section(form.NamedSection, 'mqtt', 'domoticz', _('MQTT & Zigbee'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('MQTT Bridge'),
			_('Auto-configure Domoticz MQTT connection to the local Mosquitto broker.'));
		o.rmempty = false;

		o = s.option(form.Value, 'broker', _('MQTT Broker'),
			_('Mosquitto broker address.'));
		o.placeholder = '127.0.0.1';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'broker_port', _('MQTT Port'),
			_('Mosquitto broker port.'));
		o.datatype = 'port';
		o.placeholder = '1883';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'topic_prefix', _('Domoticz Topic'),
			_('MQTT topic prefix for Domoticz messages.'));
		o.placeholder = 'domoticz';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'z2m_topic', _('Zigbee2MQTT Topic'),
			_('MQTT topic where Zigbee2MQTT publishes device data.'));
		o.placeholder = 'zigbee2mqtt';
		o.depends('enabled', '1');

		o = s.option(form.Button, '_setup_mqtt', _('Auto-Configure'));
		o.inputtitle = _('Setup MQTT Bridge');
		o.inputstyle = 'apply';
		o.depends('enabled', '1');
		o.onclick = function() {
			ui.showModal(_('Configuring MQTT...'), [
				E('p', { 'class': 'spinning' }, _('Setting up Mosquitto broker and Domoticz MQTT connection...'))
			]);
			return callConfigureMqtt().then(function(res) {
				ui.hideModal();
				if (res && res.success) {
					ui.addNotification(null, E('p', {}, _('MQTT bridge configured successfully.')), 'info');
				} else {
					ui.addNotification(null, E('p', {}, _('MQTT setup failed: ') + (res.output || 'Unknown error')), 'danger');
				}
				window.location.href = window.location.pathname + '?' + Date.now();
			});
		};

		/* ---- Network & Domain Section ---- */
		s = m.section(form.NamedSection, 'network', 'domoticz', _('Network & Domain'));
		s.anonymous = true;

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Domain name for accessing Domoticz via HAProxy reverse proxy.'));
		o.placeholder = 'domoticz.secubox.local';

		o = s.option(form.Flag, 'haproxy', _('HAProxy Integration'),
			_('Register Domoticz as an HAProxy vhost for reverse proxy access.'));
		o.rmempty = false;

		o = s.option(form.Flag, 'firewall_wan', _('WAN Access'),
			_('Allow direct WAN access to the Domoticz port.'));
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

		/* ---- Mesh P2P Section ---- */
		s = m.section(form.NamedSection, 'mesh', 'domoticz', _('Mesh P2P'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Mesh Integration'),
			_('Register Domoticz with the SecuBox P2P mesh network for discovery by other nodes.'));
		o.rmempty = false;

		/* ---- Logs Section ---- */
		s = m.section(form.NamedSection, 'main', 'domoticz', _('Logs'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_logs', ' ');
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '<div id="domoticz-logs" style="background:#0a0a1a; color:#ccc; padding:8px; ' +
				'border-radius:4px; font-family:monospace; font-size:12px; max-height:300px; ' +
				'overflow-y:auto; white-space:pre-wrap; min-height:40px;">Click "Fetch Logs" to view container output.</div>';
		};

		o = s.option(form.Button, '_fetch_logs', _('Fetch Logs'));
		o.inputtitle = _('Fetch Logs');
		o.inputstyle = 'action';
		o.onclick = function() {
			var logsDiv = document.getElementById('domoticz-logs');
			if (logsDiv) logsDiv.textContent = 'Loading...';
			return callLogs(50).then(function(res) {
				if (logsDiv) logsDiv.textContent = (res && res.logs) ? res.logs : 'No logs available.';
			});
		};

		return m.render();
	}
});
