'use strict';
'require view';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callGetVendorRules = rpc.declare({
	object: 'luci.iot-guard',
	method: 'get_vendor_rules',
	expect: {}
});

var callAddVendorRule = rpc.declare({
	object: 'luci.iot-guard',
	method: 'add_vendor_rule',
	params: ['name', 'pattern', 'oui', 'class', 'risk', 'auto_isolate'],
	expect: {}
});

var callDeleteVendorRule = rpc.declare({
	object: 'luci.iot-guard',
	method: 'delete_vendor_rule',
	params: ['name'],
	expect: {}
});

var RISK_COLORS = {
	high: '#ff4444',
	medium: '#ffaa00',
	low: '#44cc44'
};

var DEVICE_CLASSES = ['camera', 'thermostat', 'lighting', 'plug', 'assistant', 'media', 'lock', 'sensor', 'diy', 'mixed'];
var RISK_LEVELS = ['low', 'medium', 'high'];

return view.extend({
	handleAddRule: function() {
		var self = this;

		var form = E('div', { 'style': 'min-width: 400px;' }, [
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px;' }, 'Rule Name'),
				E('input', { 'type': 'text', 'id': 'rule-name', 'style': 'width: 100%; padding: 8px;' })
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px;' }, 'Vendor Pattern (regex)'),
				E('input', { 'type': 'text', 'id': 'rule-pattern', 'style': 'width: 100%; padding: 8px;', 'placeholder': 'Ring|Amazon Ring' })
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px;' }, 'OUI Prefix'),
				E('input', { 'type': 'text', 'id': 'rule-oui', 'style': 'width: 100%; padding: 8px;', 'placeholder': '40:B4:CD' })
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px;' }, 'Device Class'),
				E('select', { 'id': 'rule-class', 'style': 'width: 100%; padding: 8px;' },
					DEVICE_CLASSES.map(function(c) { return E('option', { 'value': c }, c); })
				)
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px;' }, 'Risk Level'),
				E('select', { 'id': 'rule-risk', 'style': 'width: 100%; padding: 8px;' },
					RISK_LEVELS.map(function(r) { return E('option', { 'value': r }, r); })
				)
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', {}, [
					E('input', { 'type': 'checkbox', 'id': 'rule-auto-isolate', 'style': 'margin-right: 8px;' }),
					'Auto-isolate matching devices'
				])
			])
		]);

		ui.showModal('Add Vendor Rule', [
			form,
			E('div', { 'class': 'right', 'style': 'margin-top: 20px;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'margin-left: 10px;',
					'click': function() {
						var name = document.getElementById('rule-name').value.trim().replace(/[^a-z0-9_]/gi, '_');
						var pattern = document.getElementById('rule-pattern').value.trim();
						var oui = document.getElementById('rule-oui').value.trim();
						var deviceClass = document.getElementById('rule-class').value;
						var risk = document.getElementById('rule-risk').value;
						var autoIsolate = document.getElementById('rule-auto-isolate').checked ? '1' : '0';

						if (!name) {
							ui.addNotification(null, E('p', 'Rule name is required'), 'error');
							return;
						}

						ui.hideModal();
						callAddVendorRule(name, pattern, oui, deviceClass, risk, autoIsolate).then(function() {
							ui.addNotification(null, E('p', 'Rule added: ' + name), 'success');
							window.location.reload();
						});
					}
				}, 'Add Rule')
			])
		]);
	},

	handleDeleteRule: function(name) {
		if (!confirm('Delete rule "' + name + '"?')) return;
		callDeleteVendorRule(name).then(function() {
			ui.addNotification(null, E('p', 'Rule deleted'), 'success');
			window.location.reload();
		});
	},

	load: function() {
		return callGetVendorRules();
	},

	render: function(data) {
		var rules = (data && data.rules) || [];
		var self = this;

		var rows = rules.map(function(r) {
			var riskColor = RISK_COLORS[r.risk_level] || '#888';
			return E('tr', {}, [
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, r.name),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333; font-family: monospace;' }, r.pattern || '-'),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333; font-family: monospace;' }, r.oui_prefix || '-'),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, r.device_class),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333; color: ' + riskColor + ';' }, r.risk_level),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, r.auto_isolate ? 'Yes' : 'No'),
				E('td', { 'style': 'padding: 10px; border-bottom: 1px solid #333;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-negative btn-sm',
						'style': 'padding: 2px 8px; font-size: 12px;',
						'click': function() { self.handleDeleteRule(r.name); }
					}, 'Delete')
				])
			]);
		});

		var content = E('div', { 'class': 'cbi-map', 'style': 'padding: 20px;' }, [
			E('h2', {}, 'IoT Guard Policies'),
			E('p', { 'style': 'color: #888; margin-bottom: 20px;' },
				'Vendor classification rules determine how devices are identified and their default risk level.'),

			E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': L.bind(this.handleAddRule, this)
				}, 'Add Vendor Rule')
			]),

			E('h3', { 'style': 'margin-top: 25px;' }, 'Vendor Classification Rules'),

			rules.length === 0 ?
				E('div', { 'style': 'padding: 20px; color: #888; text-align: center;' },
					'No custom vendor rules defined. Using built-in classification.') :
				E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
					E('thead', {}, E('tr', { 'style': 'background: #222;' }, [
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Name'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Vendor Pattern'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'OUI Prefix'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Class'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Risk'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Auto-Isolate'),
						E('th', { 'style': 'padding: 10px; text-align: left;' }, 'Actions')
					])),
					E('tbody', {}, rows)
				]),

			E('h3', { 'style': 'margin-top: 30px;' }, 'Device Classes'),
			E('table', { 'style': 'width: 100%; border-collapse: collapse; margin-top: 10px;' }, [
				E('thead', {}, E('tr', { 'style': 'background: #222;' }, [
					E('th', { 'style': 'padding: 8px; text-align: left;' }, 'Class'),
					E('th', { 'style': 'padding: 8px; text-align: left;' }, 'Description'),
					E('th', { 'style': 'padding: 8px; text-align: left;' }, 'Default Risk')
				])),
				E('tbody', {}, [
					this.renderClassRow('camera', 'IP cameras, video doorbells', 'medium'),
					this.renderClassRow('thermostat', 'Smart thermostats, HVAC', 'low'),
					this.renderClassRow('lighting', 'Smart bulbs, LED strips', 'low'),
					this.renderClassRow('plug', 'Smart plugs, outlets', 'medium'),
					this.renderClassRow('assistant', 'Voice assistants', 'medium'),
					this.renderClassRow('media', 'TVs, streaming devices', 'medium'),
					this.renderClassRow('lock', 'Smart locks', 'high'),
					this.renderClassRow('sensor', 'Motion, door sensors', 'low'),
					this.renderClassRow('diy', 'ESP32, Raspberry Pi', 'high'),
					this.renderClassRow('mixed', 'Multi-function devices', 'high')
				])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/security/iot-guard/policies');
	},

	renderClassRow: function(name, desc, risk) {
		var color = RISK_COLORS[risk] || '#888';
		return E('tr', {}, [
			E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333;' }, name),
			E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333; color: #888;' }, desc),
			E('td', { 'style': 'padding: 8px; border-bottom: 1px solid #333; color: ' + color + ';' }, risk)
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
