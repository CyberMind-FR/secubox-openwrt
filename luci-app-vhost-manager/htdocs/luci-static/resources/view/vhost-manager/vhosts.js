'use strict';
'require view';
'require ui';
'require form';
'require vhost-manager/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts()
		]);
	},

	render: function(data) {
		var vhosts = data[0] || [];

		var m = new form.Map('vhost_manager', _('Virtual Hosts'), 
			_('Manage nginx reverse proxy virtual hosts'));

		var s = m.section(form.GridSection, 'vhost', _('Virtual Hosts'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		s.modaltitle = function(section_id) {
			return _('Edit VHost: ') + section_id;
		};

		var o;

		o = s.option(form.Value, 'domain', _('Domain'));
		o.rmempty = false;
		o.placeholder = 'example.com';
		o.description = _('Domain name for this virtual host');

		o = s.option(form.Value, 'backend', _('Backend URL'));
		o.rmempty = false;
		o.placeholder = 'http://192.168.1.100:8080';
		o.description = _('Backend server URL to proxy to');

		// Test backend button
		o.renderWidget = function(section_id, option_index, cfgvalue) {
			var widget = form.Value.prototype.renderWidget.apply(this, [section_id, option_index, cfgvalue]);
			
			var testBtn = E('button', {
				'class': 'cbi-button cbi-button-action',
				'style': 'margin-left: 10px',
				'click': function(ev) {
					ev.preventDefault();
					var backend = this.parentNode.querySelector('input').value;
					
					if (!backend) {
						ui.addNotification(null, E('p', _('Please enter a backend URL')), 'warning');
						return;
					}

					ui.addNotification(null, E('p', _('Testing backend connectivity...')), 'info');
					
					API.testBackend(backend).then(function(result) {
						if (result.reachable) {
							ui.addNotification(null, E('p', '✓ ' + _('Backend is reachable')), 'info');
						} else {
							ui.addNotification(null, E('p', '✗ ' + _('Backend is unreachable')), 'error');
						}
					});
				}
			}, _('Test'));

			widget.appendChild(testBtn);
			return widget;
		};

		o = s.option(form.Flag, 'ssl', _('Enable SSL'));
		o.default = o.disabled;
		o.description = _('Enable HTTPS (requires valid SSL certificate)');

		o = s.option(form.Flag, 'auth', _('Enable Authentication'));
		o.default = o.disabled;
		o.description = _('Require HTTP basic authentication');

		o = s.option(form.Value, 'auth_user', _('Auth Username'));
		o.depends('auth', '1');
		o.placeholder = 'admin';

		o = s.option(form.Value, 'auth_pass', _('Auth Password'));
		o.depends('auth', '1');
		o.password = true;

		o = s.option(form.Flag, 'websocket', _('WebSocket Support'));
		o.default = o.disabled;
		o.description = _('Enable WebSocket protocol upgrade headers');

		// Custom actions
		s.addModalOptions = function(s, section_id, ev) {
			// Get form values
			var domain = this.section.formvalue(section_id, 'domain');
			var backend = this.section.formvalue(section_id, 'backend');
			var ssl = this.section.formvalue(section_id, 'ssl') === '1';
			var auth = this.section.formvalue(section_id, 'auth') === '1';
			var websocket = this.section.formvalue(section_id, 'websocket') === '1';

			if (!domain || !backend) {
				ui.addNotification(null, E('p', _('Domain and backend are required')), 'error');
				return;
			}

			// Call API to add vhost
			API.addVHost(domain, backend, ssl, auth, websocket).then(function(result) {
				if (result.success) {
					ui.addNotification(null, E('p', _('VHost created successfully')), 'info');
					
					if (result.reload_required) {
						ui.showModal(_('Reload Nginx?'), [
							E('p', {}, _('Configuration changed. Reload nginx to apply?')),
							E('div', { 'class': 'right' }, [
								E('button', {
									'class': 'cbi-button cbi-button-neutral',
									'click': ui.hideModal
								}, _('Later')),
								E('button', {
									'class': 'cbi-button cbi-button-positive',
									'click': function() {
										API.reloadNginx().then(function(reload_result) {
											ui.hideModal();
											if (reload_result.success) {
												ui.addNotification(null, E('p', '✓ ' + _('Nginx reloaded')), 'info');
											} else {
												ui.addNotification(null, E('p', '✗ ' + reload_result.message), 'error');
											}
										});
									}
								}, _('Reload Now'))
							])
						]);
					}
				} else {
					ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
				}
			});
		};

		return m.render();
	}
});
