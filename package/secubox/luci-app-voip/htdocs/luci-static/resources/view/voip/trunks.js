'use strict';
'require view';
'require ui';
'require uci';
'require form';
'require voip.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getTrunkStatus(),
			uci.load('voip')
		]);
	},

	render: function(data) {
		var status = data[0];
		var trunkStatus = data[1];
		var running = status.running === 'true';

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'SIP Trunks')
		]);

		// Trunk status section
		var registered = trunkStatus.registered === 'true';
		view.appendChild(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Trunk Status'),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Registration'),
					E('td', { 'class': 'td' }, [
						E('span', { 'class': 'badge ' + (registered ? 'success' : 'warning') },
							registered ? 'Registered' : 'Not Registered')
					])
				])
			]),
			trunkStatus.status ? E('pre', {
				'style': 'background: #f5f5f5; padding: 10px; font-size: 12px; overflow-x: auto;'
			}, trunkStatus.status) : ''
		]));

		// OVH Auto-provision section
		var ovhEnabled = uci.get('voip', 'ovh_telephony', 'enabled') === '1';
		var ovhAppKey = uci.get('voip', 'ovh_telephony', 'app_key') || '';

		view.appendChild(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'OVH Telephony'),
			E('p', {}, 'Auto-provision SIP trunk from OVH Telephony API'),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'API Credentials'),
					E('td', { 'class': 'td' }, ovhAppKey ? 'Configured' : 'Not configured')
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'disabled': !ovhAppKey || !running,
					'click': ui.createHandlerFn(this, function() {
						return this.handleOvhProvision();
					})
				}, 'Auto-Provision OVH Trunk')
			])
		]));

		// UCI configuration form
		var m, s, o;

		m = new form.Map('voip', null, null);

		s = m.section(form.NamedSection, 'ovh_telephony', 'ovh', 'OVH API Settings');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable OVH Integration');
		o.default = '0';

		o = s.option(form.ListValue, 'endpoint', 'API Endpoint');
		o.value('ovh-eu', 'OVH Europe');
		o.value('ovh-ca', 'OVH Canada');
		o.value('ovh-us', 'OVH US');
		o.default = 'ovh-eu';

		o = s.option(form.Value, 'app_key', 'Application Key');
		o.password = false;
		o.rmempty = true;

		o = s.option(form.Value, 'app_secret', 'Application Secret');
		o.password = true;
		o.rmempty = true;

		o = s.option(form.Value, 'consumer_key', 'Consumer Key');
		o.password = true;
		o.rmempty = true;

		o = s.option(form.Value, 'billing_account', 'Billing Account');
		o.rmempty = true;
		o.placeholder = '(auto-detected)';

		o = s.option(form.Value, 'service_name', 'Service Name (SIP Line)');
		o.rmempty = true;
		o.placeholder = '(auto-detected)';

		// Manual trunk section
		s = m.section(form.NamedSection, 'sip_trunk', 'trunk', 'Manual Trunk Configuration');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable Trunk');
		o.default = '0';

		o = s.option(form.Value, 'host', 'SIP Server');
		o.placeholder = 'sip.provider.com';

		o = s.option(form.Value, 'username', 'Username');

		o = s.option(form.Value, 'password', 'Password');
		o.password = true;

		o = s.option(form.Value, 'outbound_proxy', 'Outbound Proxy');
		o.rmempty = true;

		o = s.option(form.Value, 'codecs', 'Codecs');
		o.default = 'ulaw,alaw,g729';

		return m.render().then(function(formEl) {
			view.appendChild(formEl);
			return view;
		});
	},

	handleOvhProvision: function() {
		ui.showModal('Provisioning OVH Trunk', [
			E('p', { 'class': 'spinning' }, 'Connecting to OVH API and configuring SIP trunk...')
		]);

		return api.addOvhTrunk().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', res.message || 'OVH trunk provisioned'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Provisioning failed: ' + e.message), 'error');
		});
	}
});
