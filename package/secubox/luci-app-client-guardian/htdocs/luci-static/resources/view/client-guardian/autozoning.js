'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require client-guardian/api as API';
'require client-guardian/nav as CgNav';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			L.resolveDefault(uci.load('client-guardian'), {})
		]);
	},

	render: function(data) {
		var status = data[0] || {};

		var m, s, o;

		m = new form.Map('client-guardian', _('Auto-Zoning Rules'),
			_('Automatically assign new clients to zones based on device type, vendor, or hostname patterns.'));

		// Auto-Zoning / Auto-Parking Settings
		s = m.section(form.NamedSection, 'config', 'client-guardian', _('Auto-Zoning Settings'));

		o = s.option(form.Flag, 'auto_zoning_enabled', _('Enable Auto-Zoning'),
			_('Automatically assign clients to zones using matching rules. WARNING: May restrict network access for new devices!'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'auto_parking_zone', _('Auto-Parking Zone'),
			_('Default zone for clients that don\'t match any rule'));
		o.value('lan_private', _('LAN Private (Full Access)'));
		o.value('guest', _('Guest (Internet Only)'));
		o.value('iot', _('IoT (Isolated)'));
		o.value('quarantine', _('Quarantine (No Access - Dangerous!)'));
		o.default = 'lan_private';
		o.depends('auto_zoning_enabled', '1');

		o = s.option(form.Flag, 'auto_parking_approve', _('Auto-Approve Parked Clients'),
			_('Automatically approve clients placed in auto-parking zone'));
		o.default = '0';
		o.depends('auto_zoning_enabled', '1');

		// Auto-Zoning Rules Section
		s = m.section(form.GridSection, 'auto_zone_rule', _('Auto-Zoning Rules'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;
		s.description = _('Rules are evaluated in priority order. First match wins.');

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = '1';
		o.editable = true;

		o = s.option(form.Value, 'name', _('Rule Name'));
		o.rmempty = false;

		o = s.option(form.ListValue, 'match_type', _('Match Type'));
		o.value('vendor', _('Device Vendor (OUI)'));
		o.value('hostname', _('Hostname Pattern'));
		o.value('mac_prefix', _('MAC Prefix'));
		o.default = 'vendor';

		o = s.option(form.Value, 'match_value', _('Match Value/Pattern'));
		o.placeholder = _('e.g., Xiaomi, Apple, .*camera.*, aa:bb:cc');
		o.rmempty = false;

		o = s.option(form.ListValue, 'target_zone', _('Target Zone'));
		o.value('lan_private', _('LAN Private'));
		o.value('iot', _('IoT'));
		o.value('kids', _('Kids'));
		o.value('guest', _('Guest'));
		o.value('quarantine', _('Quarantine'));
		o.default = 'guest';

		o = s.option(form.Flag, 'auto_approve', _('Auto-Approve'));
		o.default = '0';

		o = s.option(form.Value, 'priority', _('Priority'));
		o.datatype = 'uinteger';
		o.placeholder = '50';
		o.default = '50';
		o.description = _('Lower numbers = higher priority');

		return m.render().then(function(rendered) {
			// Info box explaining auto-zoning
			var infoBox = E('div', {
				'class': 'cbi-section',
				'style': 'background: var(--cg-bg-secondary, #151b23); border-left: 4px solid var(--cg-accent, #6366f1); padding: 1em; margin-bottom: 1em; border-radius: 8px;'
			}, [
				E('h3', { 'style': 'margin-top: 0; color: var(--cg-text-primary, #e6edf3);' }, _('How Auto-Zoning Works')),
				E('ul', { 'style': 'margin: 0.5em 0; color: var(--cg-text-secondary, #8b949e);' }, [
					E('li', {}, _('When a new client connects, rules are evaluated in priority order (lowest number first).')),
					E('li', {}, _('The first matching rule determines which zone the client is assigned to.')),
					E('li', {}, _('If no rules match, the client goes to the Auto-Parking Zone.')),
					E('li', {}, [
						E('strong', { 'style': 'color: var(--cg-text-primary, #e6edf3);' }, _('Match Types: ')),
						_('Vendor uses MAC OUI database, Hostname uses regex patterns, MAC Prefix matches the start of MAC address.')
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
				CgNav.renderTabs('autozoning'),
				rendered
			]);

			wrapper.appendChild(view);
			return KissTheme.wrap(wrapper, 'admin/secubox/guardian/autozoning');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
