'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require rpc';

var callGetStatus = rpc.declare({
	object: 'luci.smtp-relay',
	method: 'get_status',
	expect: {}
});

var callGetConfig = rpc.declare({
	object: 'luci.smtp-relay',
	method: 'get_config',
	expect: {}
});

var callTestEmail = rpc.declare({
	object: 'luci.smtp-relay',
	method: 'test_email',
	params: ['recipient'],
	expect: {}
});

var callDetectLocal = rpc.declare({
	object: 'luci.smtp-relay',
	method: 'detect_local',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callGetStatus().catch(function() { return {}; }),
			callGetConfig().catch(function() { return {}; }),
			callDetectLocal().catch(function() { return {}; }),
			uci.load('smtp-relay')
		]);
	},

	handleTestEmail: function(ev) {
		var recipient = document.getElementById('test_recipient').value;
		var btn = ev.target;
		var resultDiv = document.getElementById('test_result');

		if (!recipient) {
			recipient = uci.get('smtp-relay', 'recipients', 'admin') || '';
		}

		if (!recipient) {
			ui.addNotification(null, E('p', _('Please enter a recipient email address')), 'warning');
			return;
		}

		btn.disabled = true;
		btn.textContent = _('Sending...');
		resultDiv.innerHTML = '';

		callTestEmail(recipient).then(function(res) {
			btn.disabled = false;
			btn.textContent = _('Send Test Email');

			if (res.success) {
				resultDiv.innerHTML = '<span style="color: #4caf50;">✓ ' + _('Test email sent successfully!') + '</span>';
				ui.addNotification(null, E('p', _('Test email sent to %s').format(recipient)), 'info');
			} else {
				resultDiv.innerHTML = '<span style="color: #f44336;">✗ ' + (res.error || _('Failed to send')) + '</span>';
				ui.addNotification(null, E('p', res.error || _('Failed to send test email')), 'error');
			}
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = _('Send Test Email');
			resultDiv.innerHTML = '<span style="color: #f44336;">✗ ' + err.message + '</span>';
		});
	},

	render: function(data) {
		var status = data[0] || {};
		var config = data[1] || {};
		var localDetect = data[2] || {};
		var m, s, o;

		m = new form.Map('smtp-relay', _('SMTP Relay'),
			_('Centralized outbound email configuration for all SecuBox services. Configure once, use everywhere.'));

		// Status section
		s = m.section(form.NamedSection, 'main', 'smtp_relay', _('Status'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_status', _('Current Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var modeText = {
				'external': _('External SMTP Server'),
				'local': _('Local Mailserver'),
				'direct': _('Direct Delivery')
			};
			var statusHtml = '<div style="display: flex; gap: 20px; flex-wrap: wrap;">';

			// Enabled status
			statusHtml += '<div><strong>' + _('Relay:') + '</strong> ';
			if (status.enabled) {
				statusHtml += '<span style="color: #4caf50;">●</span> ' + _('Enabled');
			} else {
				statusHtml += '<span style="color: #f44336;">●</span> ' + _('Disabled');
			}
			statusHtml += '</div>';

			// Mode
			statusHtml += '<div><strong>' + _('Mode:') + '</strong> ' + (modeText[status.mode] || status.mode || '-') + '</div>';

			// Server
			if (status.server) {
				statusHtml += '<div><strong>' + _('Server:') + '</strong> ' + status.server + ':' + status.port + '</div>';
			}

			// Transport
			statusHtml += '<div><strong>' + _('Transport:') + '</strong> ';
			if (status.msmtp_available) {
				statusHtml += '<span style="color: #4caf50;">msmtp</span>';
			} else if (status.sendmail_available) {
				statusHtml += '<span style="color: #ff9800;">sendmail</span>';
			} else {
				statusHtml += '<span style="color: #f44336;">' + _('None') + '</span>';
			}
			statusHtml += '</div>';

			// Local mailserver
			if (localDetect.detected) {
				statusHtml += '<div><strong>' + _('Local Mail:') + '</strong> ';
				if (localDetect.responding) {
					statusHtml += '<span style="color: #4caf50;">● ' + _('Available') + '</span>';
				} else {
					statusHtml += '<span style="color: #ff9800;">● ' + _('Not responding') + '</span>';
				}
				statusHtml += '</div>';
			}

			statusHtml += '</div>';
			return statusHtml;
		};

		// Main settings
		s = m.section(form.NamedSection, 'main', 'smtp_relay', _('General Settings'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable SMTP Relay'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'mode', _('Relay Mode'));
		o.value('external', _('External SMTP Server'));
		o.value('local', _('Local Mailserver'));
		o.value('direct', _('Direct Delivery (MTA)'));
		o.default = 'external';
		o.description = _('External: Use Gmail, SendGrid, etc. Local: Use secubox-app-mailserver. Direct: Send directly (requires port 25).');

		o = s.option(form.Flag, 'auto_detect', _('Auto-detect Local Mailserver'));
		o.description = _('Automatically use local mailserver if available and responding');
		o.default = '1';
		o.depends('mode', 'external');

		// External SMTP section
		s = m.section(form.NamedSection, 'external', 'external', _('External SMTP Settings'));
		s.anonymous = true;

		o = s.option(form.ListValue, '_preset', _('Provider Preset'));
		o.value('', _('-- Custom --'));
		o.value('gmail', 'Gmail / Google Workspace');
		o.value('sendgrid', 'SendGrid');
		o.value('mailgun', 'Mailgun');
		o.value('ses', 'Amazon SES (us-east-1)');
		o.value('mailjet', 'Mailjet');
		o.rmempty = true;
		o.write = function() {}; // Don't save, just triggers onchange

		o = s.option(form.Value, 'server', _('SMTP Server'));
		o.placeholder = 'smtp.example.com';
		o.rmempty = true;

		o = s.option(form.Value, 'port', _('Port'));
		o.datatype = 'port';
		o.default = '587';
		o.placeholder = '587';

		o = s.option(form.Flag, 'tls', _('Use STARTTLS'));
		o.default = '1';
		o.description = _('Use STARTTLS encryption (recommended for port 587)');

		o = s.option(form.Flag, 'ssl', _('Use SSL/TLS'));
		o.default = '0';
		o.description = _('Use implicit SSL/TLS (for port 465)');

		o = s.option(form.Flag, 'auth', _('Authentication Required'));
		o.default = '1';

		o = s.option(form.Value, 'user', _('Username'));
		o.depends('auth', '1');
		o.rmempty = true;

		o = s.option(form.Value, 'password', _('Password'));
		o.password = true;
		o.depends('auth', '1');
		o.rmempty = true;

		o = s.option(form.Value, 'from', _('From Address'));
		o.placeholder = 'secubox@example.com';
		o.datatype = 'email';
		o.rmempty = true;

		o = s.option(form.Value, 'from_name', _('From Name'));
		o.placeholder = 'SecuBox';
		o.default = 'SecuBox';
		o.rmempty = true;

		// Recipients section
		s = m.section(form.NamedSection, 'recipients', 'recipients', _('Default Recipients'));
		s.anonymous = true;

		o = s.option(form.Value, 'admin', _('Admin Email'));
		o.datatype = 'email';
		o.description = _('Default recipient for system notifications and test emails');

		// Test section
		s = m.section(form.NamedSection, 'main', 'smtp_relay', _('Connection Test'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_test', ' ');
		o.rawhtml = true;
		o.cfgvalue = function() {
			var adminEmail = uci.get('smtp-relay', 'recipients', 'admin') || '';
			return E('div', { 'style': 'display: flex; gap: 10px; align-items: center; flex-wrap: wrap;' }, [
				E('input', {
					'type': 'email',
					'id': 'test_recipient',
					'placeholder': adminEmail || _('recipient@example.com'),
					'value': adminEmail,
					'style': 'flex: 1; min-width: 200px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;'
				}),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, function(ev) {
						var view = document.querySelector('[data-page="smtp-relay/settings"]');
						if (view && view.handleTestEmail) {
							view.handleTestEmail(ev);
						} else {
							// Fallback
							var recipient = document.getElementById('test_recipient').value;
							var btn = ev.target;
							btn.disabled = true;
							btn.textContent = _('Sending...');

							callTestEmail(recipient).then(function(res) {
								btn.disabled = false;
								btn.textContent = _('Send Test Email');
								var resultDiv = document.getElementById('test_result');
								if (res.success) {
									resultDiv.innerHTML = '<span style="color: #4caf50;">✓ ' + _('Test email sent!') + '</span>';
								} else {
									resultDiv.innerHTML = '<span style="color: #f44336;">✗ ' + (res.error || _('Failed')) + '</span>';
								}
							}).catch(function(err) {
								btn.disabled = false;
								btn.textContent = _('Send Test Email');
							});
						}
					})
				}, _('Send Test Email')),
				E('div', { 'id': 'test_result', 'style': 'margin-left: 10px;' })
			]);
		};

		return m.render();
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
