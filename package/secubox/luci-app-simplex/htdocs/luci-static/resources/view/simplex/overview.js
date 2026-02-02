'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require poll';
'require ui';

var callSimplexStatus = rpc.declare({
	object: 'luci.simplex',
	method: 'status',
	expect: { '': {} }
});

var callSimplexStart = rpc.declare({
	object: 'luci.simplex',
	method: 'start'
});

var callSimplexStop = rpc.declare({
	object: 'luci.simplex',
	method: 'stop'
});

var callSimplexRestart = rpc.declare({
	object: 'luci.simplex',
	method: 'restart'
});

var callSimplexInstall = rpc.declare({
	object: 'luci.simplex',
	method: 'install'
});

var callSimplexGetAddresses = rpc.declare({
	object: 'luci.simplex',
	method: 'get_addresses',
	expect: { '': {} }
});

var callSimplexGetStats = rpc.declare({
	object: 'luci.simplex',
	method: 'get_stats',
	expect: { '': {} }
});

var callSimplexInitCerts = rpc.declare({
	object: 'luci.simplex',
	method: 'init_certs',
	params: ['hostname']
});

function formatBytes(bytes, decimals) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var dm = decimals || 2;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function copyToClipboard(text) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text).then(function() {
			ui.addNotification(null, E('p', _('Address copied to clipboard')), 'success');
		});
	} else {
		var textarea = document.createElement('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		ui.addNotification(null, E('p', _('Address copied to clipboard')), 'success');
	}
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('simplex'),
			callSimplexStatus(),
			callSimplexGetAddresses(),
			callSimplexGetStats()
		]);
	},

	render: function(data) {
		var status = data[1];
		var addresses = data[2];
		var stats = data[3];
		var m, s, o;

		m = new form.Map('simplex', _('SimpleX Chat Server'),
			_('Privacy-focused self-hosted messaging infrastructure with SMP (message relay) and XFTP (file transfer) servers.'));

		// ==========================================
		// Status Section
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'simplex', _('Service Status'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_status', _('Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var html = '<div class="simplex-status" style="display:flex;gap:30px;flex-wrap:wrap;align-items:flex-start;">';

			// LXC/Container status
			html += '<div class="status-card" style="min-width:200px;">';
			html += '<h4 style="margin:0 0 10px 0;border-bottom:1px solid #ddd;padding-bottom:5px;">Container</h4>';

			if (!status.lxc_available) {
				html += '<p style="color:#c00;"><b>LXC not installed</b></p>';
				html += '<p><small>Install: opkg install lxc lxc-common</small></p>';
			} else if (!status.container_exists) {
				html += '<p style="color:#888;"><b>Not installed</b></p>';
				html += '<p><small>Click "Install" below</small></p>';
			} else {
				var containerColor = status.container_status === 'running' ? '#080' : '#c60';
				html += '<p><b>Status:</b> <span style="color:' + containerColor + '">' + status.container_status + '</span></p>';
			}
			html += '</div>';

			// SMP Server status
			if (status.smp_enabled) {
				html += '<div class="status-card" style="min-width:200px;">';
				html += '<h4 style="margin:0 0 10px 0;border-bottom:1px solid #ddd;padding-bottom:5px;">SMP Server</h4>';
				var smpColor = status.smp_status === 'running' ? '#080' : '#c00';
				html += '<p><b>Status:</b> <span style="color:' + smpColor + '">' + status.smp_status + '</span></p>';
				html += '<p><b>Port:</b> ' + status.smp_port + '/tcp</p>';
				if (status.smp_hostname) {
					html += '<p><b>Host:</b> ' + status.smp_hostname + '</p>';
				}
				html += '</div>';
			}

			// XFTP Server status
			if (status.xftp_enabled) {
				html += '<div class="status-card" style="min-width:200px;">';
				html += '<h4 style="margin:0 0 10px 0;border-bottom:1px solid #ddd;padding-bottom:5px;">XFTP Server</h4>';
				var xftpColor = status.xftp_status === 'running' ? '#080' : '#c00';
				html += '<p><b>Status:</b> <span style="color:' + xftpColor + '">' + status.xftp_status + '</span></p>';
				html += '<p><b>Port:</b> ' + status.xftp_port + '/tcp</p>';
				if (status.xftp_hostname) {
					html += '<p><b>Host:</b> ' + status.xftp_hostname + '</p>';
				}
				html += '</div>';
			}

			// Storage stats
			if (stats) {
				html += '<div class="status-card" style="min-width:200px;">';
				html += '<h4 style="margin:0 0 10px 0;border-bottom:1px solid #ddd;padding-bottom:5px;">Storage</h4>';
				html += '<p><b>Used:</b> ' + formatBytes(stats.storage_used || 0) + '</p>';
				html += '<p><b>Quota:</b> ' + formatBytes(stats.storage_quota || 0) + '</p>';
				html += '<p><b>Files:</b> ' + (stats.file_count || 0) + '</p>';
				if (stats.storage_quota > 0) {
					var pct = Math.round((stats.storage_used / stats.storage_quota) * 100);
					var barColor = pct > 80 ? '#c00' : (pct > 60 ? '#c60' : '#080');
					html += '<div style="background:#ddd;border-radius:3px;height:8px;margin-top:5px;">';
					html += '<div style="background:' + barColor + ';width:' + Math.min(pct, 100) + '%;height:100%;border-radius:3px;"></div>';
					html += '</div>';
					html += '<small>' + pct + '% used</small>';
				}
				html += '</div>';
			}

			html += '</div>';
			return html;
		};

		// Control buttons
		o = s.option(form.Button, '_start', _('Start'));
		o.inputtitle = _('Start');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return callSimplexStart().then(function() {
				window.location.reload();
			});
		};

		o = s.option(form.Button, '_stop', _('Stop'));
		o.inputtitle = _('Stop');
		o.inputstyle = 'remove';
		o.onclick = function() {
			return callSimplexStop().then(function() {
				window.location.reload();
			});
		};

		o = s.option(form.Button, '_restart', _('Restart'));
		o.inputtitle = _('Restart');
		o.inputstyle = 'reload';
		o.onclick = function() {
			return callSimplexRestart().then(function() {
				window.location.reload();
			});
		};

		// ==========================================
		// Server Addresses Section
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'simplex', _('Server Addresses'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_addresses', _('Addresses'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var html = '<div class="simplex-addresses" style="background:#f8f8f8;padding:15px;border-radius:5px;">';

			if (!addresses.smp_address && !addresses.xftp_address) {
				html += '<p style="color:#888;">Server addresses will appear here after installation and configuration.</p>';
				html += '<p><small>Set hostnames in the configuration below, then restart the service.</small></p>';
			} else {
				html += '<p style="margin-bottom:10px;"><small>Add these addresses to your SimpleX Chat app under Settings &gt; Network &amp; Servers</small></p>';

				if (addresses.smp_address) {
					html += '<div style="margin-bottom:15px;">';
					html += '<label style="font-weight:bold;display:block;margin-bottom:5px;">SMP Server (messaging):</label>';
					html += '<div style="display:flex;gap:10px;align-items:center;">';
					html += '<code style="flex:1;background:#fff;padding:8px;border:1px solid #ddd;border-radius:3px;word-break:break-all;font-size:12px;">' + addresses.smp_address + '</code>';
					html += '<button class="cbi-button" onclick="copyToClipboard(\'' + addresses.smp_address + '\')">Copy</button>';
					html += '</div>';
					html += '</div>';
				}

				if (addresses.xftp_address) {
					html += '<div>';
					html += '<label style="font-weight:bold;display:block;margin-bottom:5px;">XFTP Server (file transfer):</label>';
					html += '<div style="display:flex;gap:10px;align-items:center;">';
					html += '<code style="flex:1;background:#fff;padding:8px;border:1px solid #ddd;border-radius:3px;word-break:break-all;font-size:12px;">' + addresses.xftp_address + '</code>';
					html += '<button class="cbi-button" onclick="copyToClipboard(\'' + addresses.xftp_address + '\')">Copy</button>';
					html += '</div>';
					html += '</div>';
				}
			}

			html += '</div>';

			// Add copyToClipboard function to window
			html += '<script>window.copyToClipboard = ' + copyToClipboard.toString() + '</script>';

			return html;
		};

		// ==========================================
		// General Configuration
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'simplex', _('General Configuration'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable SimpleX Chat servers'));
		o.rmempty = false;

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path for server data and configuration'));
		o.default = '/srv/simplex';
		o.placeholder = '/srv/simplex';

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'),
			_('Container memory limit'));
		o.default = '256M';
		o.placeholder = '256M';

		// ==========================================
		// SMP Server Configuration
		// ==========================================
		s = m.section(form.NamedSection, 'smp', 'smp', _('SMP Server (Message Relay)'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable SMP server for message relay'));
		o.default = '1';

		o = s.option(form.Value, 'hostname', _('Hostname'),
			_('Public hostname or IP address for clients to connect'));
		o.placeholder = 'smp.example.com';
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Port'),
			_('TCP port for SMP connections'));
		o.datatype = 'port';
		o.default = '5223';

		o = s.option(form.Value, 'control_port', _('Control Port'),
			_('Local control port (admin API)'));
		o.datatype = 'port';
		o.default = '5224';

		o = s.option(form.Flag, 'store_log', _('Store Message Log'),
			_('Enable message store for offline delivery'));
		o.default = '1';

		o = s.option(form.Flag, 'daily_stats', _('Daily Statistics'),
			_('Collect daily usage statistics'));
		o.default = '1';

		o = s.option(form.Value, 'queue_password', _('Queue Password'),
			_('Optional: require password to create new message queues'));
		o.password = true;
		o.optional = true;

		// ==========================================
		// XFTP Server Configuration
		// ==========================================
		s = m.section(form.NamedSection, 'xftp', 'xftp', _('XFTP Server (File Transfer)'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable XFTP server for encrypted file sharing'));
		o.default = '1';

		o = s.option(form.Value, 'hostname', _('Hostname'),
			_('Public hostname or IP address for clients to connect'));
		o.placeholder = 'xftp.example.com';
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Port'),
			_('TCP port for XFTP connections'));
		o.datatype = 'port';
		o.default = '443';

		o = s.option(form.Value, 'control_port', _('Control Port'),
			_('Local control port (admin API)'));
		o.datatype = 'port';
		o.default = '5225';

		o = s.option(form.Value, 'storage_quota', _('Storage Quota'),
			_('Maximum storage for files (e.g., 10G, 500M)'));
		o.default = '10G';
		o.placeholder = '10G';

		o = s.option(form.Value, 'file_expiry', _('File Expiry'),
			_('Time before files are deleted (e.g., 48h, 7d)'));
		o.default = '48h';
		o.placeholder = '48h';

		o = s.option(form.Value, 'create_password', _('Upload Password'),
			_('Optional: require password to upload files'));
		o.password = true;
		o.optional = true;

		// ==========================================
		// TLS Configuration
		// ==========================================
		s = m.section(form.NamedSection, 'tls', 'tls', _('TLS Certificates'));
		s.anonymous = true;

		o = s.option(form.Flag, 'use_letsencrypt', _('Use Let\'s Encrypt'),
			_('Automatically obtain certificates from Let\'s Encrypt'));
		o.default = '0';

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Domain for TLS certificates'));
		o.placeholder = 'simplex.example.com';
		o.depends('use_letsencrypt', '1');

		o = s.option(form.Value, 'email', _('Email'),
			_('Email for Let\'s Encrypt notifications'));
		o.placeholder = 'admin@example.com';
		o.depends('use_letsencrypt', '1');

		o = s.option(form.Value, 'cert_path', _('Certificate Path'),
			_('Path to store TLS certificates'));
		o.default = '/srv/simplex/certs';

		// ==========================================
		// Actions Section
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'simplex', _('Actions'));
		s.anonymous = true;

		o = s.option(form.Button, '_install', _('Install Servers'));
		o.inputtitle = _('Install');
		o.inputstyle = 'apply';
		o.onclick = function() {
			if (confirm(_('This will download SimpleX binaries and create the LXC container. Continue?'))) {
				ui.showModal(_('Installing SimpleX'), [
					E('p', { 'class': 'spinning' }, _('Downloading binaries and setting up container...'))
				]);
				return callSimplexInstall().then(function(res) {
					ui.hideModal();
					if (res.success) {
						ui.addNotification(null, E('p', _('Installation completed successfully')), 'success');
					} else {
						ui.addNotification(null, E('p', _('Installation failed: ') + (res.output || 'Unknown error')), 'error');
					}
					window.location.reload();
				}).catch(function(err) {
					ui.hideModal();
					ui.addNotification(null, E('p', _('Installation failed: ') + err), 'error');
				});
			}
		};

		o = s.option(form.Button, '_init_certs', _('Generate Certificates'));
		o.inputtitle = _('Generate TLS Certs');
		o.inputstyle = 'reload';
		o.onclick = function() {
			var hostname = uci.get('simplex', 'smp', 'hostname') || uci.get('simplex', 'tls', 'domain');
			if (!hostname) {
				ui.addNotification(null, E('p', _('Please set a hostname first')), 'warning');
				return;
			}
			return callSimplexInitCerts(hostname).then(function(res) {
				if (res.success) {
					ui.addNotification(null, E('p', _('Certificates generated successfully')), 'success');
				} else {
					ui.addNotification(null, E('p', _('Certificate generation failed: ') + (res.output || 'Unknown error')), 'error');
				}
			});
		};

		// ==========================================
		// Help Section
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'simplex', _('About SimpleX'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_help');
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '<div style="background:#f5f5f5;padding:15px;border-radius:5px;">' +
				'<h4>What is SimpleX?</h4>' +
				'<p>SimpleX Chat is a privacy-focused messaging platform with no user identifiers. ' +
				'Self-hosting your own servers ensures your messages never pass through third-party infrastructure.</p>' +
				'<h4>Server Types:</h4>' +
				'<ul>' +
				'<li><b>SMP Server</b> - Message relay using Simple Messaging Protocol</li>' +
				'<li><b>XFTP Server</b> - Encrypted file transfer storage</li>' +
				'</ul>' +
				'<h4>Setup Steps:</h4>' +
				'<ol>' +
				'<li>Set hostnames for SMP and XFTP servers above</li>' +
				'<li>Click "Install Servers" to download binaries and create container</li>' +
				'<li>Enable the service and save configuration</li>' +
				'<li>Open firewall ports (5223 for SMP, 443 for XFTP)</li>' +
				'<li>Add server addresses to your SimpleX Chat mobile app</li>' +
				'</ol>' +
				'<h4>Resources:</h4>' +
				'<ul>' +
				'<li><a href="https://simplex.chat" target="_blank">SimpleX Chat Website</a></li>' +
				'<li><a href="https://github.com/simplex-chat/simplexmq" target="_blank">SimpleX Server Documentation</a></li>' +
				'</ul>' +
				'<h4>CLI Commands:</h4>' +
				'<code style="display:block;background:#fff;padding:10px;margin-top:10px;">' +
				'simplexctl status      # Show server status<br>' +
				'simplexctl get-address # Show server addresses<br>' +
				'simplexctl logs smp    # View SMP logs<br>' +
				'simplexctl shell       # Access container shell' +
				'</code>' +
				'</div>';
		};

		return m.render();
	}
});
