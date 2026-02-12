'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require secubox/kiss-theme as KissTheme';
'require network';
'require form';
'require ui';
'require uci';
'require traffic-shaper/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.listClasses(),
			L.resolveDefault(L.network.getDevices(), [])
		]);
	},

	render: function(data) {
		var classes = data[0].classes || [];
		var devices = data[1] || [];

		var m, s, o;

		m = new form.Map('traffic-shaper', _('Traffic Classes'),
			_('Configure traffic classes for bandwidth allocation and prioritization. Each class defines guaranteed (rate) and maximum (ceil) bandwidth limits.'));

		s = m.section(form.GridSection, 'class', _('Traffic Classes'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '1';
		o.editable = true;

		o = s.option(form.Value, 'name', _('Name'));
		o.placeholder = _('Descriptive name');
		o.rmempty = false;

		o = s.option(form.ListValue, 'priority', _('Priority'));
		o.value('1', _('Highest (1)'));
		o.value('2', _('High (2)'));
		o.value('3', _('Medium-High (3)'));
		o.value('4', _('Medium (4)'));
		o.value('5', _('Normal (5)'));
		o.value('6', _('Medium-Low (6)'));
		o.value('7', _('Low (7)'));
		o.value('8', _('Lowest (8)'));
		o.default = '5';
		o.rmempty = false;

		o = s.option(form.Value, 'rate', _('Guaranteed Rate'));
		o.placeholder = '1mbit';
		o.datatype = 'string';
		o.rmempty = false;
		o.description = _('Minimum guaranteed bandwidth (e.g., 1mbit, 512kbit, 10mbit)');
		o.validate = function(section_id, value) {
			if (!value || !value.match(/^\d+[kmg]?bit$/i)) {
				return _('Invalid bandwidth format. Use format like: 1mbit, 512kbit, 10mbit');
			}
			return true;
		};

		o = s.option(form.Value, 'ceil', _('Maximum Rate (Ceil)'));
		o.placeholder = '10mbit';
		o.datatype = 'string';
		o.rmempty = false;
		o.description = _('Maximum allowed bandwidth (e.g., 10mbit, 1mbit, 100mbit)');
		o.validate = function(section_id, value) {
			if (!value || !value.match(/^\d+[kmg]?bit$/i)) {
				return _('Invalid bandwidth format. Use format like: 1mbit, 512kbit, 10mbit');
			}
			return true;
		};

		o = s.option(form.ListValue, 'interface', _('Interface'));
		o.value('wan', _('WAN'));
		o.value('lan', _('LAN'));
		devices.forEach(function(dev) {
			if (dev.getName() && dev.getName() !== 'lo') {
				o.value(dev.getName(), dev.getName());
			}
		});
		o.default = 'wan';
		o.rmempty = false;

		// Add priority color indicators
		s.modaltitle = function(section_id) {
			var name = this.cfgsections().indexOf(section_id);
			return _('Edit Traffic Class') + ' "' + (uci.get('traffic-shaper', section_id, 'name') || section_id) + '"';
		};

		// Custom rendering for priority visualization
		s.renderRowActions = function(section_id) {
			var priority = parseInt(uci.get('traffic-shaper', section_id, 'priority') || 5);
			var colorClass = API.getPriorityColor(priority);
			var actions = form.GridSection.prototype.renderRowActions.call(this, section_id);

			var row = actions.parentNode;
			if (row && row.classList) {
				row.classList.add(colorClass);
			}

			return actions;
		};

		return m.render().then(function(rendered) {
			// Add help text at the top
			var helpBox = E('div', {
				'class': 'cbi-section',
				'style': 'background: #e8f4f8; border-left: 4px solid #0088cc; padding: 1em; margin-bottom: 1em;'
			}, [
				E('h3', { 'style': 'margin-top: 0;' }, _('Traffic Class Guidelines')),
				E('ul', { 'style': 'margin-bottom: 0;' }, [
					E('li', {}, _('Priority 1-2: Critical traffic (VoIP, gaming, real-time)')),
					E('li', {}, _('Priority 3-4: Important traffic (video streaming, VPN)')),
					E('li', {}, _('Priority 5-6: Normal traffic (web browsing, email)')),
					E('li', {}, _('Priority 7-8: Bulk traffic (downloads, backups)')),
					E('li', {}, _('Rate: Guaranteed minimum bandwidth allocated to this class')),
					E('li', {}, _('Ceil: Maximum bandwidth this class can use when available'))
				])
			]);

			rendered.insertBefore(helpBox, rendered.firstChild);

			var content = E('div', {}, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				rendered
			]);

			return KissTheme.wrap([content], 'admin/network/traffic-shaper/classes');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
