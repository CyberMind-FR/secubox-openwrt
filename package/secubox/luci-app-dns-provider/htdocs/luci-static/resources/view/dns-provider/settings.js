'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require rpc';

var callGetConfig = rpc.declare({
	object: 'luci.dns-provider',
	method: 'get_config',
	expect: {}
});

var callTestCredentials = rpc.declare({
	object: 'luci.dns-provider',
	method: 'test_credentials',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callGetConfig(),
			L.resolveDefault(uci.load('dns-provider'), {})
		]);
	},

	render: function(data) {
		var config = data[0] || {};
		var m, s, o;

		m = new form.Map('dns-provider', _('DNS Provider Settings'),
			_('Configure DNS provider API credentials for programmatic DNS record management and ACME DNS-01 certificate issuance.'));

		// ── Main Settings ──
		s = m.section(form.NamedSection, 'main', 'dns_provider', _('General'));
		s.anonymous = false;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'provider', _('DNS Provider'));
		o.value('', _('-- Select --'));
		o.value('ovh', 'OVH');
		o.value('gandi', 'Gandi');
		o.value('cloudflare', 'Cloudflare');
		o.rmempty = true;

		o = s.option(form.Value, 'zone', _('DNS Zone'));
		o.placeholder = 'example.com';
		o.rmempty = true;
		o.description = _('The domain zone managed by this provider.');

		// ── OVH Configuration ──
		s = m.section(form.NamedSection, 'ovh', 'ovh', _('OVH API'));
		s.anonymous = false;

		o = s.option(form.DummyValue, '_ovh_info');
		o.rawhtml = true;
		o.default = '<em>' + _('Obtain API credentials from') +
			' <a href="https://api.ovh.com/createToken/" target="_blank">api.ovh.com/createToken</a></em>';

		o = s.option(form.ListValue, 'endpoint', _('API Endpoint'));
		o.value('ovh-eu', 'OVH Europe');
		o.value('ovh-ca', 'OVH Canada');
		o.value('ovh-us', 'OVH US');
		o.default = 'ovh-eu';

		o = s.option(form.Value, 'app_key', _('Application Key'));
		o.password = false;
		o.rmempty = true;

		o = s.option(form.Value, 'app_secret', _('Application Secret'));
		o.password = true;
		o.rmempty = true;

		o = s.option(form.Value, 'consumer_key', _('Consumer Key'));
		o.password = true;
		o.rmempty = true;

		// ── Gandi Configuration ──
		s = m.section(form.NamedSection, 'gandi', 'gandi', _('Gandi API'));
		s.anonymous = false;

		o = s.option(form.DummyValue, '_gandi_info');
		o.rawhtml = true;
		o.default = '<em>' + _('Obtain your Personal Access Token from') +
			' <a href="https://admin.gandi.net/organizations/account/pat" target="_blank">admin.gandi.net</a></em>';

		o = s.option(form.Value, 'api_key', _('API Key / PAT'));
		o.password = true;
		o.rmempty = true;

		// ── Cloudflare Configuration ──
		s = m.section(form.NamedSection, 'cloudflare', 'cloudflare', _('Cloudflare API'));
		s.anonymous = false;

		o = s.option(form.DummyValue, '_cf_info');
		o.rawhtml = true;
		o.default = '<em>' + _('Create an API Token with DNS:Edit permissions at') +
			' <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">dash.cloudflare.com</a></em>';

		o = s.option(form.Value, 'api_token', _('API Token'));
		o.password = true;
		o.rmempty = true;

		o = s.option(form.Value, 'zone_id', _('Zone ID'));
		o.password = false;
		o.rmempty = true;
		o.description = _('Found in the Cloudflare dashboard under your domain\'s Overview page.');

		return m.render().then(function(rendered) {
			// Add "Test Credentials" button after the form
			var testBtn = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Connection Test')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'style': 'display:flex; gap:1em; align-items:center;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function(ev) {
								var btn = ev.target;
								btn.disabled = true;
								btn.textContent = _('Testing...');

								callTestCredentials().then(function(res) {
									btn.disabled = false;
									btn.textContent = _('Test Credentials');

									if (res && res.success) {
										ui.addNotification(null,
											E('p', {}, _('Credentials are valid.')), 'info');
									} else {
										ui.addNotification(null,
											E('p', {}, _('Credential test failed: ') +
												(res ? res.error : _('Unknown error'))), 'danger');
									}
								}).catch(function(err) {
									btn.disabled = false;
									btn.textContent = _('Test Credentials');
									ui.addNotification(null,
										E('p', {}, _('RPC error: ') + err.message), 'danger');
								});
							}
						}, _('Test Credentials')),
						E('span', { 'id': 'test-result' }, '')
					])
				])
			]);

			var container = E('div', {}, [rendered, testBtn]);
			return container;
		});
	}
});
