'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require uci';
'require secubox/kiss-theme';

var callGetStatus = rpc.declare({
	object: 'luci.smtp-relay',
	method: 'get_status',
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
			uci.load('smtp-relay')
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};

		// Start polling
		poll.add(function() {
			return callGetStatus().then(function(s) {
				self.updateStats(s);
			});
		}, 15);

		var modeLabels = {
			'external': 'External',
			'local': 'Local',
			'direct': 'Direct'
		};

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;' }, [
					E('span', {}, '\u2709'),
					'SMTP Relay'
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
					'Centralized outbound email for all SecuBox services')
			]),

			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, [
				this.statCard('Status', status.enabled ? 'Active' : 'Disabled',
					status.enabled ? 'var(--kiss-green)' : 'var(--kiss-red)', 'status'),
				this.statCard('Mode', modeLabels[status.mode] || 'N/A',
					status.mode === 'local' ? 'var(--kiss-green)' : 'var(--kiss-cyan)', 'mode'),
				this.statCard('Server', status.server || 'None', 'var(--kiss-purple)', 'server'),
				this.statCard('TLS', status.tls ? 'Enabled' : 'Off',
					status.tls ? 'var(--kiss-green)' : 'var(--kiss-yellow)', 'tls')
			]),

			// Quick Test Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\u26a1 Quick Actions']),
				E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap; align-items: center;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': ui.createHandlerFn(this, this.doDetectLocal)
					}, '\ud83d\udd0d Detect Local'),
					E('input', {
						'type': 'email',
						'id': 'test_recipient',
						'placeholder': 'test@example.com',
						'value': status.admin_recipient || '',
						'style': 'flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
					}),
					E('button', {
						'id': 'btn-test',
						'class': 'kiss-btn kiss-btn-green',
						'click': ui.createHandlerFn(this, this.doTestEmail)
					}, '\u2709 Send Test'),
					E('span', { 'id': 'test_result' }, '')
				])
			]),

			// Configuration Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\u2699 Configuration']),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;' }, [
					// Mode
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Relay Mode'),
						E('select', {
							'id': 'cfg_mode',
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						}, [
							E('option', { 'value': 'external', 'selected': status.mode === 'external' }, 'External SMTP'),
							E('option', { 'value': 'local', 'selected': status.mode === 'local' }, 'Local Mailserver'),
							E('option', { 'value': 'direct', 'selected': status.mode === 'direct' }, 'Direct Delivery')
						])
					]),
					// Server
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'SMTP Server'),
						E('input', {
							'type': 'text',
							'id': 'cfg_server',
							'placeholder': 'smtp.gmail.com',
							'value': status.server || '',
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						})
					]),
					// Port
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Port'),
						E('input', {
							'type': 'number',
							'id': 'cfg_port',
							'placeholder': '587',
							'value': status.port || 587,
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						})
					]),
					// TLS
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Use TLS'),
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'cfg_tls',
								'checked': status.tls,
								'style': 'width: 18px; height: 18px;'
							}),
							E('span', { 'style': 'color: var(--kiss-muted);' }, 'Enable STARTTLS')
						])
					]),
					// Username
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Username'),
						E('input', {
							'type': 'text',
							'id': 'cfg_user',
							'placeholder': 'user@gmail.com',
							'value': uci.get('smtp-relay', 'main', 'username') || '',
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						})
					]),
					// Password
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Password'),
						E('input', {
							'type': 'password',
							'id': 'cfg_pass',
							'placeholder': '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
							'value': '',
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						})
					]),
					// From Address
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'From Address'),
						E('input', {
							'type': 'email',
							'id': 'cfg_from',
							'placeholder': 'noreply@secubox.in',
							'value': status.from || '',
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						})
					]),
					// Admin Recipient
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Admin Email'),
						E('input', {
							'type': 'email',
							'id': 'cfg_admin',
							'placeholder': 'admin@example.com',
							'value': status.admin_recipient || '',
							'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
						})
					])
				]),
				E('div', { 'style': 'margin-top: 20px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': ui.createHandlerFn(this, this.doSaveConfig)
					}, '\u2714 Save Configuration')
				])
			]),

			// Quick Presets Card
			E('div', { 'class': 'kiss-card kiss-panel-blue' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\ud83d\udce7 Provider Presets']),
				E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
					this.presetButton('Gmail', 'smtp.gmail.com', 587, true),
					this.presetButton('SendGrid', 'smtp.sendgrid.net', 587, true),
					this.presetButton('Mailgun', 'smtp.mailgun.org', 587, true),
					this.presetButton('AWS SES', 'email-smtp.us-east-1.amazonaws.com', 587, true),
					this.presetButton('Local', '192.168.255.30', 25, false)
				]),
				E('p', { 'style': 'margin-top: 12px; color: var(--kiss-muted); font-size: 12px;' },
					'Click a preset to auto-fill server settings.')
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/system/smtp-relay');
	},

	statCard: function(label, value, color, dataAttr) {
		return E('div', { 'class': 'kiss-stat' }, [
			E('div', {
				'class': 'kiss-stat-value',
				'style': 'color: ' + color,
				'data-stat': dataAttr
			}, String(value)),
			E('div', { 'class': 'kiss-stat-label' }, label)
		]);
	},

	updateStats: function(status) {
		var statusEl = document.querySelector('[data-stat="status"]');
		var modeEl = document.querySelector('[data-stat="mode"]');
		var serverEl = document.querySelector('[data-stat="server"]');
		var tlsEl = document.querySelector('[data-stat="tls"]');

		if (statusEl) {
			statusEl.textContent = status.enabled ? 'Active' : 'Disabled';
			statusEl.style.color = status.enabled ? 'var(--kiss-green)' : 'var(--kiss-red)';
		}
		if (modeEl) {
			var labels = { 'external': 'External', 'local': 'Local', 'direct': 'Direct' };
			modeEl.textContent = labels[status.mode] || 'N/A';
		}
		if (serverEl) {
			serverEl.textContent = status.server || 'None';
		}
		if (tlsEl) {
			tlsEl.textContent = status.tls ? 'Enabled' : 'Off';
			tlsEl.style.color = status.tls ? 'var(--kiss-green)' : 'var(--kiss-yellow)';
		}
	},

	presetButton: function(name, server, port, tls) {
		return E('button', {
			'class': 'kiss-btn',
			'click': function() {
				document.getElementById('cfg_server').value = server;
				document.getElementById('cfg_port').value = port;
				document.getElementById('cfg_tls').checked = tls;
				document.getElementById('cfg_mode').value = name === 'Local' ? 'local' : 'external';
			}
		}, name);
	},

	doDetectLocal: function() {
		ui.showModal(_('Detecting Local Mailserver'), [
			E('p', { 'class': 'spinning' }, _('Scanning...'))
		]);

		callDetectLocal().then(function(res) {
			ui.hideModal();
			if (res.detected) {
				document.getElementById('cfg_server').value = res.server || '192.168.255.30';
				document.getElementById('cfg_port').value = res.port || 25;
				document.getElementById('cfg_mode').value = 'local';
				ui.addNotification(null, E('p', _('Local mailserver detected')), 'info');
			} else {
				ui.addNotification(null, E('p', _('No local mailserver found')), 'warning');
			}
		});
	},

	doTestEmail: function() {
		var recipient = document.getElementById('test_recipient').value;
		var btn = document.getElementById('btn-test');
		var result = document.getElementById('test_result');

		if (!recipient) {
			ui.addNotification(null, E('p', _('Enter a recipient email')), 'warning');
			return;
		}

		btn.disabled = true;
		btn.textContent = 'Sending...';
		result.innerHTML = '';

		callTestEmail(recipient).then(function(res) {
			btn.disabled = false;
			btn.textContent = '\u2709 Send Test';

			if (res.success) {
				result.innerHTML = '<span class="kiss-badge kiss-badge-green">Sent</span>';
			} else {
				result.innerHTML = '<span class="kiss-badge kiss-badge-red">Failed</span>';
				ui.addNotification(null, E('p', res.error || 'Send failed'), 'error');
			}
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = '\u2709 Send Test';
			result.innerHTML = '<span class="kiss-badge kiss-badge-red">Error</span>';
		});
	},

	doSaveConfig: function() {
		var mode = document.getElementById('cfg_mode').value;
		var server = document.getElementById('cfg_server').value;
		var port = document.getElementById('cfg_port').value;
		var user = document.getElementById('cfg_user').value;
		var pass = document.getElementById('cfg_pass').value;
		var tls = document.getElementById('cfg_tls').checked;
		var from = document.getElementById('cfg_from').value;
		var admin = document.getElementById('cfg_admin').value;

		uci.set('smtp-relay', 'main', 'mode', mode);
		uci.set('smtp-relay', 'main', 'server', server);
		uci.set('smtp-relay', 'main', 'port', port);
		if (user) uci.set('smtp-relay', 'main', 'username', user);
		if (pass) uci.set('smtp-relay', 'main', 'password', pass);
		uci.set('smtp-relay', 'main', 'tls', tls ? '1' : '0');
		if (from) uci.set('smtp-relay', 'main', 'from', from);
		uci.set('smtp-relay', 'recipients', 'admin', admin);

		uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			ui.addNotification(null, E('p', _('Configuration saved')), 'info');
		}).catch(function(err) {
			ui.addNotification(null, E('p', err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
