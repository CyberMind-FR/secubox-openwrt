'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require form';
'require ui';
'require client-guardian/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getPolicy(),
			API.getStatus(),
			L.resolveDefault(uci.load('client-guardian'), {})
		]);
	},

	render: function(data) {
		var policy = data[0] || {};
		var status = data[1] || {};

		var m, s, o;

		m = new form.Map('client-guardian', _('Client Guardian Settings'),
			_('Configure default network access policy and captive portal behavior.'));

		// General Settings
		s = m.section(form.NamedSection, 'config', 'client-guardian', _('General Settings'));

		o = s.option(form.Flag, 'enabled', _('Enable Client Guardian'));
		o.default = '1';
		o.rmempty = false;
		o.description = _('Enable or disable the Client Guardian access control system');

		o = s.option(form.ListValue, 'default_policy', _('Default Policy'));
		o.value('open', _('Open - Allow all clients'));
		o.value('captive', _('Captive Portal - Require portal authentication'));
		o.value('whitelist', _('Whitelist Only - Allow only approved clients'));
		o.default = 'captive';
		o.rmempty = false;
		o.description = _('Default behavior for new/unknown clients');

		o = s.option(form.Flag, 'auto_approve', _('Auto-Approve Known Devices'));
		o.default = '0';
		o.depends('default_policy', 'whitelist');
		o.description = _('Automatically approve devices that have connected before');

		o = s.option(form.Value, 'session_timeout', _('Session Timeout'));
		o.datatype = 'uinteger';
		o.default = '86400';
		o.placeholder = '86400';
		o.description = _('Maximum session duration in seconds (default: 86400 = 24 hours)');

		// Captive Portal Settings
		s = m.section(form.NamedSection, 'portal', 'portal', _('Captive Portal'));

		o = s.option(form.Flag, 'enabled', _('Enable Captive Portal'));
		o.default = '1';
		o.rmempty = false;
		o.description = _('Enable nodogsplash captive portal for guest authentication');

		o = s.option(form.Value, 'title', _('Portal Title'));
		o.default = 'Welcome';
		o.placeholder = 'Welcome';
		o.description = _('Main title displayed on the portal page');

		o = s.option(form.Value, 'subtitle', _('Portal Subtitle'));
		o.default = 'Please authenticate to access the network';
		o.placeholder = 'Please authenticate to access the network';
		o.description = _('Subtitle or welcome message');

		o = s.option(form.ListValue, 'auth_method', _('Authentication Method'));
		o.value('click', _('Click to Continue'));
		o.value('password', _('Password'));
		o.value('voucher', _('Voucher Code'));
		o.value('email', _('Email Verification'));
		o.default = 'click';
		o.description = _('Method used to authenticate users');

		o = s.option(form.Value, 'guest_password', _('Guest Password'));
		o.depends('auth_method', 'password');
		o.password = true;
		o.placeholder = 'Enter password';
		o.description = _('Password required for guest access');

		o = s.option(form.Value, 'accent_color', _('Accent Color'));
		o.default = '#0088cc';
		o.placeholder = '#0088cc';
		o.datatype = 'string';
		o.description = _('Hex color code for portal branding');

		o = s.option(form.Flag, 'require_terms', _('Require Terms Acceptance'));
		o.default = '0';
		o.description = _('Require users to accept terms and conditions');

		o = s.option(form.Flag, 'allow_registration', _('Allow Self-Registration'));
		o.default = '0';
		o.description = _('Allow users to register their own devices');

		o = s.option(form.Flag, 'registration_approval', _('Require Registration Approval'));
		o.default = '1';
		o.depends('allow_registration', '1');
		o.description = _('Administrator must approve self-registered devices');

		// Advanced Settings
		s = m.section(form.NamedSection, 'config', 'client-guardian', _('Advanced Settings'));

		o = s.option(form.Flag, 'mac_filtering', _('Enable MAC Filtering'));
		o.default = '1';
		o.description = _('Use MAC addresses for client identification and blocking');

		o = s.option(form.Flag, 'log_connections', _('Log Connection Events'));
		o.default = '1';
		o.description = _('Log client connections and authentication events');

		o = s.option(form.Value, 'log_retention', _('Log Retention (days)'));
		o.datatype = 'uinteger';
		o.default = '30';
		o.depends('log_connections', '1');
		o.description = _('Number of days to keep connection logs');

		o = s.option(form.Flag, 'block_tor', _('Block Tor Exit Nodes'));
		o.default = '0';
		o.description = _('Automatically block known Tor exit nodes');

		o = s.option(form.Flag, 'block_vpn', _('Block VPN Detection'));
		o.default = '0';
		o.description = _('Attempt to detect and block VPN connections');

		return m.render().then(function(rendered) {
			// Add policy info box at the top
			var infoBox = E('div', {
				'class': 'cbi-section',
				'style': 'background: #e8f4f8; border-left: 4px solid #0088cc; padding: 1em; margin-bottom: 1em;'
			}, [
				E('h3', { 'style': 'margin-top: 0;' }, _('Current Policy: ') + E('span', { 'style': 'color: #0088cc;' }, policy.default_policy || 'captive')),
				E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 1em;' }, [
					E('div', {}, [
						E('strong', {}, _('Portal Enabled:')),
						' ',
						E('span', { 'class': 'badge', 'style': 'background: ' + (policy.portal_enabled ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;' },
							policy.portal_enabled ? _('Yes') : _('No'))
					]),
					E('div', {}, [
						E('strong', {}, _('Session Timeout:')),
						' ',
						E('span', {}, (policy.session_timeout || 86400) + ' ' + _('seconds'))
					])
				]),
				E('div', { 'style': 'margin-top: 1em; padding: 0.75em; background: white; border-radius: 4px;' }, [
					E('strong', {}, _('Policy Descriptions:')),
					E('ul', { 'style': 'margin: 0.5em 0;' }, [
						E('li', {}, [
							E('strong', {}, _('Open:')),
							' ',
							_('All clients can access the network without authentication. Not recommended for public networks.')
						]),
						E('li', {}, [
							E('strong', {}, _('Captive Portal:')),
							' ',
							_('New clients are redirected to a captive portal for authentication. Recommended for guest networks.')
						]),
						E('li', {}, [
							E('strong', {}, _('Whitelist Only:')),
							' ',
							_('Only explicitly approved clients can access the network. Highest security.')
						])
					])
				])
			]);

			rendered.insertBefore(infoBox, rendered.firstChild);
			return rendered;
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
