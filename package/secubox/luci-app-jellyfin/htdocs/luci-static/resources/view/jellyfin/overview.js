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
			if (status.media_paths && status.media_paths.length > 0)
				html += '<tr><td style="padding:2px 12px 2px 0;color:#8892b0;">Media:</td><td>' + status.media_paths.join('<br>') + '</td></tr>';
			html += '</table>';
			return html;
		};

		/* ---- Action Buttons ---- */
		o = s.option(form.DummyValue, '_actions', _('Actions'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '';
		};

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
