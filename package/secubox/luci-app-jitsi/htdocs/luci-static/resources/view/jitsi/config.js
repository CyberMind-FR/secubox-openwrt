'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callJitsiStatus = rpc.declare({
	object: 'luci.jitsi',
	method: 'status',
	expect: { '': {} }
});

var callJitsiStart = rpc.declare({
	object: 'luci.jitsi',
	method: 'start'
});

var callJitsiStop = rpc.declare({
	object: 'luci.jitsi',
	method: 'stop'
});

var callJitsiRestart = rpc.declare({
	object: 'luci.jitsi',
	method: 'restart'
});

var callJitsiInstall = rpc.declare({
	object: 'luci.jitsi',
	method: 'install'
});

var callJitsiGenerateConfig = rpc.declare({
	object: 'luci.jitsi',
	method: 'generate_config'
});

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('jitsi'),
			callJitsiStatus()
		]);
	},

	render: function(data) {
		var status = data[1];
		var m, s, o;

		m = new form.Map('jitsi', _('Jitsi Meet Video Conferencing'),
			_('Self-hosted video conferencing with end-to-end encryption.'));

		// Status section
		s = m.section(form.NamedSection, 'main', 'jitsi', _('Service Status'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_status', _('Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var html = '<div style="display:flex;gap:20px;flex-wrap:wrap;">';

			if (!status.docker_available) {
				html += '<span style="color:red;font-weight:bold;">Docker not available - Install docker package</span>';
			} else {
				// Container status
				var containers = status.containers || {};
				for (var name in containers) {
					var state = containers[name];
					var color = state === 'running' ? 'green' : (state === 'not_found' ? 'gray' : 'orange');
					html += '<span><b>' + name.replace('jitsi-', '') + ':</b> ';
					html += '<span style="color:' + color + '">' + state + '</span></span>';
				}

				// Stats
				if (status.stats) {
					html += '<span style="margin-left:20px;">';
					html += '<b>Active:</b> ' + (status.stats.conferences || 0) + ' conferences, ';
					html += (status.stats.participants || 0) + ' participants';
					html += '</span>';
				}
			}

			html += '</div>';
			return html;
		};

		// Control buttons
		o = s.option(form.Button, '_start', _('Start'));
		o.inputtitle = _('Start');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return callJitsiStart().then(function() {
				window.location.reload();
			});
		};

		o = s.option(form.Button, '_stop', _('Stop'));
		o.inputtitle = _('Stop');
		o.inputstyle = 'remove';
		o.onclick = function() {
			return callJitsiStop().then(function() {
				window.location.reload();
			});
		};

		o = s.option(form.Button, '_restart', _('Restart'));
		o.inputtitle = _('Restart');
		o.inputstyle = 'reload';
		o.onclick = function() {
			return callJitsiRestart().then(function() {
				window.location.reload();
			});
		};

		// Configuration section
		s = m.section(form.NamedSection, 'main', 'jitsi', _('General Configuration'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable Jitsi Meet service'));
		o.rmempty = false;

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Public domain for Jitsi Meet (e.g., meet.example.com)'));
		o.placeholder = 'meet.example.com';
		o.rmempty = false;

		o = s.option(form.Value, 'public_url', _('Public URL'),
			_('Full public URL (leave empty to auto-generate from domain)'));
		o.placeholder = 'https://meet.example.com';
		o.optional = true;

		o = s.option(form.ListValue, 'timezone', _('Timezone'));
		o.value('UTC', 'UTC');
		o.value('Europe/Paris', 'Europe/Paris');
		o.value('Europe/London', 'Europe/London');
		o.value('America/New_York', 'America/New York');
		o.value('America/Los_Angeles', 'America/Los Angeles');
		o.value('Asia/Tokyo', 'Asia/Tokyo');
		o.default = 'UTC';

		// Web settings
		s = m.section(form.NamedSection, 'web', 'jitsi', _('Web Interface'));
		s.anonymous = true;

		o = s.option(form.Value, 'port', _('HTTPS Port'),
			_('Port for web interface'));
		o.datatype = 'port';
		o.default = '8443';

		o = s.option(form.Flag, 'enable_guests', _('Allow Guests'),
			_('Allow users to join without authentication'));
		o.default = '1';

		o = s.option(form.Flag, 'enable_auth', _('Require Authentication'),
			_('Require login to create meetings'));
		o.default = '0';

		o = s.option(form.ListValue, 'default_language', _('Default Language'));
		o.value('en', 'English');
		o.value('fr', 'French');
		o.value('de', 'German');
		o.value('es', 'Spanish');
		o.value('it', 'Italian');
		o.value('pt', 'Portuguese');
		o.value('zh', 'Chinese');
		o.value('ja', 'Japanese');
		o.default = 'en';

		// JVB settings
		s = m.section(form.NamedSection, 'jvb', 'jitsi', _('Video Bridge (JVB)'));
		s.anonymous = true;

		o = s.option(form.Value, 'port', _('Media Port (UDP)'),
			_('UDP port for video/audio streams'));
		o.datatype = 'port';
		o.default = '10000';

		o = s.option(form.Flag, 'enable_tcp_fallback', _('Enable TCP Fallback'),
			_('Allow TCP fallback for restrictive networks'));
		o.default = '0';

		o = s.option(form.Value, 'tcp_port', _('TCP Fallback Port'),
			_('TCP port for fallback'));
		o.datatype = 'port';
		o.default = '4443';
		o.depends('enable_tcp_fallback', '1');

		o = s.option(form.Value, 'stun_servers', _('STUN Servers'),
			_('STUN servers for NAT traversal'));
		o.placeholder = 'meet-jit-si-turnrelay.jitsi.net:443';

		// Security settings
		s = m.section(form.NamedSection, 'security', 'jitsi', _('Security'));
		s.anonymous = true;

		o = s.option(form.Flag, 'lobby_enabled', _('Enable Lobby'),
			_('Require moderator approval to join'));
		o.default = '1';

		o = s.option(form.Flag, 'password_required', _('Require Room Password'),
			_('Prompt for password when creating rooms'));
		o.default = '0';

		o = s.option(form.Flag, 'jwt_enabled', _('Enable JWT Authentication'),
			_('Use JWT tokens for authentication'));
		o.default = '0';

		o = s.option(form.Value, 'jwt_app_id', _('JWT App ID'));
		o.depends('jwt_enabled', '1');

		o = s.option(form.Value, 'jwt_app_secret', _('JWT App Secret'));
		o.password = true;
		o.depends('jwt_enabled', '1');

		// TURN settings
		s = m.section(form.NamedSection, 'turn', 'jitsi', _('TURN Server'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Use External TURN'),
			_('Use external TURN server for better NAT traversal'));
		o.default = '0';

		o = s.option(form.Value, 'server', _('TURN Server'));
		o.placeholder = 'turn.example.com:443';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'username', _('Username'));
		o.depends('enabled', '1');

		o = s.option(form.Value, 'password', _('Password'));
		o.password = true;
		o.depends('enabled', '1');

		// Mesh integration
		s = m.section(form.NamedSection, 'mesh', 'jitsi', _('Mesh Integration'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Mesh Integration'),
			_('Announce Jitsi on SecuBox mesh network'));
		o.default = '0';

		o = s.option(form.Flag, 'announce_service', _('Announce Service'),
			_('Register with mesh DNS'));
		o.default = '1';
		o.depends('enabled', '1');

		// Actions
		s = m.section(form.NamedSection, 'main', 'jitsi', _('Actions'));
		s.anonymous = true;

		o = s.option(form.Button, '_install', _('Install Containers'));
		o.inputtitle = _('Install');
		o.inputstyle = 'apply';
		o.onclick = function() {
			if (confirm(_('This will download Docker images. Continue?'))) {
				return callJitsiInstall().then(function(res) {
					alert(res.output || 'Installation started');
					window.location.reload();
				});
			}
		};

		o = s.option(form.Button, '_regenerate', _('Regenerate Configuration'));
		o.inputtitle = _('Regenerate');
		o.inputstyle = 'reload';
		o.onclick = function() {
			return callJitsiGenerateConfig().then(function(res) {
				alert(res.output || 'Configuration regenerated');
			});
		};

		// Help section
		s = m.section(form.NamedSection, 'main', 'jitsi', _('Quick Start'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_help');
		o.rawhtml = true;
		o.cfgvalue = function() {
			var domain = uci.get('jitsi', 'main', 'domain') || 'meet.example.com';
			return '<div style="background:#f5f5f5;padding:15px;border-radius:5px;">' +
				'<h4>Setup Steps:</h4>' +
				'<ol>' +
				'<li>Set your domain above</li>' +
				'<li>Click "Install Containers" to download images</li>' +
				'<li>Enable the service and save</li>' +
				'<li>Configure HAProxy/DNS to point to this device</li>' +
				'</ol>' +
				'<h4>Access:</h4>' +
				'<p>Web: <a href="https://' + domain + '" target="_blank">https://' + domain + '</a></p>' +
				'<p>CLI: <code>jitsctl status</code></p>' +
				'</div>';
		};

		return KissTheme.wrap([m.render()], 'admin/services/jitsi');
	}
});
