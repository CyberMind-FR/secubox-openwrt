'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require client-guardian/api as API';
'require client-guardian/nav as CgNav';
'require secubox-portal/header as SbHeader';

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
			_('Configure default network access policy and client management.'));

		// General Settings
		s = m.section(form.NamedSection, 'config', 'client-guardian', _('General Settings'));

		o = s.option(form.Flag, 'enabled', _('Enable Client Guardian'));
		o.default = '1';
		o.rmempty = false;
		o.description = _('Enable or disable the Client Guardian access control system');

		o = s.option(form.ListValue, 'default_policy', _('Default Policy'));
		o.value('open', _('Open - Allow all clients'));
		o.value('quarantine', _('Quarantine - Require approval'));
		o.value('whitelist', _('Whitelist Only - Allow only approved clients'));
		o.default = 'quarantine';
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

		// Dashboard Reactiveness
		s = m.section(form.NamedSection, 'config', 'client-guardian', _('Dashboard Reactiveness'));

		o = s.option(form.Flag, 'auto_refresh', _('Enable Auto-Refresh'),
			_('Automatically refresh dashboard every few seconds'));
		o.default = o.enabled;
		o.rmempty = false;

		o = s.option(form.ListValue, 'refresh_interval', _('Refresh Interval'),
			_('How often to poll for updates'));
		o.value('5', _('Every 5 seconds'));
		o.value('10', _('Every 10 seconds (recommended)'));
		o.value('30', _('Every 30 seconds'));
		o.value('60', _('Every 60 seconds'));
		o.default = '10';
		o.depends('auto_refresh', '1');

		// Threat Intelligence Integration
		s = m.section(form.NamedSection, 'threat_policy', 'threat_policy', _('Threat Intelligence Integration'));

		o = s.option(form.Flag, 'enabled', _('Enable Threat Intelligence'),
			_('Correlate clients with Security Threats Dashboard data'));
		o.default = o.enabled;
		o.rmempty = false;

		o = s.option(form.Value, 'auto_ban_threshold', _('Auto-Ban Threshold'),
			_('Automatically ban clients with threat score above this value (0-100)'));
		o.datatype = 'range(1,100)';
		o.placeholder = '80';
		o.default = '80';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'auto_quarantine_threshold', _('Auto-Quarantine Threshold'),
			_('Automatically quarantine clients with threat score above this value (0-100)'));
		o.datatype = 'range(1,100)';
		o.placeholder = '60';
		o.default = '60';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'threat_check_interval', _('Threat Check Interval'),
			_('How often to check for threats (seconds)'));
		o.datatype = 'uinteger';
		o.placeholder = '60';
		o.default = '60';
		o.depends('enabled', '1');

		return m.render().then(function(rendered) {
			// Policy display names
			var policyNames = {
				'open': _('Open'),
				'quarantine': _('Quarantine'),
				'whitelist': _('Whitelist Only')
			};
			var currentPolicy = policy.default_policy || 'quarantine';
			var policyDisplay = policyNames[currentPolicy] || currentPolicy;

			// Add policy info box at the top
			var infoBox = E('div', {
				'class': 'cbi-section',
				'style': 'background: var(--cg-bg-secondary, #151b23); border-left: 4px solid var(--cg-accent, #6366f1); padding: 1em; margin-bottom: 1em; border-radius: 8px;'
			}, [
				E('h3', { 'style': 'margin-top: 0; color: var(--cg-text-primary, #e6edf3);' }, [
					_('Current Policy: '),
					E('span', { 'style': 'color: var(--cg-accent, #6366f1); font-weight: 600;' }, policyDisplay)
				]),
				E('div', { 'style': 'margin-top: 0.5em; color: var(--cg-text-secondary, #8b949e);' }, [
					E('strong', {}, _('Session Timeout: ')),
					E('span', {}, (policy.session_timeout || 86400) + ' ' + _('seconds'))
				]),
				E('div', { 'style': 'margin-top: 1em; padding: 0.75em; background: var(--cg-bg-tertiary, #1e2632); border-radius: 4px;' }, [
					E('strong', { 'style': 'color: var(--cg-text-primary, #e6edf3);' }, _('Policy Descriptions:')),
					E('ul', { 'style': 'margin: 0.5em 0; color: var(--cg-text-secondary, #8b949e);' }, [
						E('li', {}, [
							E('strong', { 'style': 'color: #22c55e;' }, _('Open: ')),
							_('All clients can access the network without authentication. Not recommended for public networks.')
						]),
						E('li', {}, [
							E('strong', { 'style': 'color: #f59e0b;' }, _('Quarantine: ')),
							_('New clients are placed in quarantine and require manual approval. Recommended for secure networks.')
						]),
						E('li', {}, [
							E('strong', { 'style': 'color: #ef4444;' }, _('Whitelist Only: ')),
							_('Only explicitly approved clients can access the network. Highest security.')
						])
					])
				])
			]);

			rendered.insertBefore(infoBox, rendered.firstChild);

			// Main wrapper with SecuBox header
			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(SbHeader.render());

			var view = E('div', { 'class': 'client-guardian-dashboard' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),
				CgNav.renderTabs('settings'),
				rendered
			]);

			wrapper.appendChild(view);
			return wrapper;
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
