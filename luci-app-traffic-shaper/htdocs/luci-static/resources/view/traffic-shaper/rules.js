'use strict';
'require view';
'require form';
'require uci';
'require traffic-shaper/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.listRules(),
			API.listClasses()
		]);
	},

	render: function(data) {
		var rules = data[0].rules || [];
		var classes = data[1].classes || [];

		var m, s, o;

		m = new form.Map('traffic-shaper', _('Classification Rules'),
			_('Define rules to classify traffic into different classes based on ports, IP addresses, or DSCP markings.'));

		s = m.section(form.GridSection, 'rule', _('Rules'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '1';
		o.editable = true;

		o = s.option(form.ListValue, 'class', _('Traffic Class'));
		o.rmempty = false;
		classes.forEach(function(cls) {
			o.value(cls['.name'], cls.name || cls['.name']);
		});
		if (classes.length === 0) {
			o.value('', _('No classes defined'));
		}
		o.description = _('Assign matching traffic to this class');

		o = s.option(form.ListValue, 'match_type', _('Match Type'));
		o.value('dport', _('Destination Port'));
		o.value('sport', _('Source Port'));
		o.value('dst', _('Destination IP'));
		o.value('src', _('Source IP'));
		o.value('dscp', _('DSCP Marking'));
		o.value('protocol', _('Protocol'));
		o.default = 'dport';
		o.rmempty = false;

		o = s.option(form.Value, 'match_value', _('Match Value'));
		o.placeholder = '80,443';
		o.rmempty = false;
		o.description = _('Value to match (e.g., port: 80,443 | IP: 192.168.1.0/24 | DSCP: EF)');
		o.validate = function(section_id, value) {
			if (!value || value.trim() === '') {
				return _('Match value is required');
			}

			var matchType = uci.get('traffic-shaper', section_id, 'match_type');

			// Basic validation based on match type
			if (matchType === 'dport' || matchType === 'sport') {
				// Port validation - allow single port or comma-separated list
				if (!value.match(/^\d+(,\d+)*$/)) {
					return _('Invalid port format. Use: 80 or 80,443,8080');
				}
			} else if (matchType === 'dst' || matchType === 'src') {
				// IP validation - basic check for IP or CIDR
				if (!value.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/)) {
					return _('Invalid IP format. Use: 192.168.1.1 or 192.168.1.0/24');
				}
			}

			return true;
		};

		o = s.option(form.DummyValue, '_summary', _('Rule Summary'));
		o.modalonly = false;
		o.cfgvalue = function(section_id) {
			var matchType = uci.get('traffic-shaper', section_id, 'match_type') || '';
			var matchValue = uci.get('traffic-shaper', section_id, 'match_value') || '';
			var className = uci.get('traffic-shaper', section_id, 'class') || '';

			var typeNames = {
				'dport': _('Dest Port'),
				'sport': _('Src Port'),
				'dst': _('Dest IP'),
				'src': _('Src IP'),
				'dscp': _('DSCP'),
				'protocol': _('Protocol')
			};

			// Find class name
			var cls = classes.find(function(c) { return c['.name'] === className; });
			var clsName = cls ? (cls.name || cls['.name']) : className;

			return E('span', {}, [
				E('strong', {}, typeNames[matchType] || matchType),
				' = ',
				E('code', {}, matchValue),
				' → ',
				E('span', { 'class': 'ts-status-badge active' }, clsName)
			]);
		};

		return m.render().then(function(rendered) {
			// Add help text at the top
			var helpBox = E('div', {
				'class': 'cbi-section',
				'style': 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 1em; margin-bottom: 1em;'
			}, [
				E('h3', { 'style': 'margin-top: 0;' }, _('Classification Examples')),
				E('table', { 'class': 'table', 'style': 'background: white;' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Match Type')),
							E('th', {}, _('Example Value')),
							E('th', {}, _('Description'))
						])
					]),
					E('tbody', {}, [
						E('tr', {}, [
							E('td', {}, E('strong', {}, _('Destination Port'))),
							E('td', {}, E('code', {}, '80,443')),
							E('td', {}, _('HTTP/HTTPS traffic'))
						]),
						E('tr', {}, [
							E('td', {}, E('strong', {}, _('Destination Port'))),
							E('td', {}, E('code', {}, '22')),
							E('td', {}, _('SSH traffic'))
						]),
						E('tr', {}, [
							E('td', {}, E('strong', {}, _('Source IP'))),
							E('td', {}, E('code', {}, '192.168.1.0/24')),
							E('td', {}, _('All traffic from LAN subnet'))
						]),
						E('tr', {}, [
							E('td', {}, E('strong', {}, _('Destination IP'))),
							E('td', {}, E('code', {}, '8.8.8.8')),
							E('td', {}, _('Traffic to specific server'))
						]),
						E('tr', {}, [
							E('td', {}, E('strong', {}, _('DSCP'))),
							E('td', {}, E('code', {}, 'EF')),
							E('td', {}, _('Expedited Forwarding (VoIP)'))
						]),
						E('tr', {}, [
							E('td', {}, E('strong', {}, _('Protocol'))),
							E('td', {}, E('code', {}, 'udp')),
							E('td', {}, _('All UDP traffic'))
						])
					])
				])
			]);

			rendered.insertBefore(helpBox, rendered.firstChild);
			return rendered;
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
