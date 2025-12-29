'use strict';
'require view';
'require ui';
'require form';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

function normalizeCerts(payload) {
	if (Array.isArray(payload))
		return payload;
	if (payload && Array.isArray(payload.certificates))
		return payload.certificates;
	return [];
}

function formatDate(value) {
	if (!value)
		return _('N/A');
	try {
		return new Date(value).toLocaleDateString();
	} catch (err) {
		return value;
	}
}

function isEnabled(vhost) {
	return !vhost || vhost.enabled !== false;
}

function formatTlsMode(vhost) {
	var mode = (vhost && vhost.tls_mode) || (vhost && vhost.ssl ? 'acme' : 'off');
	switch (mode) {
		case 'acme':
			return _('ACME (auto)');
		case 'manual':
			return _('Manual cert');
		default:
			return _('Disabled');
	}
}

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts(),
			API.listCerts()
		]);
	},

	render: function(data) {
		var vhosts = data[0] || [];
		var certs = normalizeCerts(data[1]);

		var m = this.buildForm();

		return E('div', { 'class': 'vhost-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
			VHostUI.renderTabs('vhosts'),
			this.renderHeader(vhosts),
			this.renderList(vhosts, certs),
			E('div', { 'class': 'vhost-card' }, [
				E('div', { 'class': 'vhost-card-title' }, ['📝', _('Virtual Host Form')]),
				m.render()
			])
		]);
	},

	buildForm: function() {
		var m = new form.Map('vhosts', null, null);
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
		o.placeholder = 'app.example.com';
		o.description = _('Public hostname for this proxy.');

		o = s.option(form.Value, 'backend', _('Backend URL'));
		o.rmempty = false;
		o.placeholder = 'http://192.168.1.100:8080';
		o.description = _('Upstream origin (HTTP/HTTPS/WebSocket).');

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

		o = s.option(form.ListValue, 'tls_mode', _('TLS Mode'));
		o.value('off', _('Disabled (HTTP only)'));
		o.value('acme', _('Automatic (acme.sh)'));
		o.value('manual', _('Manual certificate'));
		o.default = 'acme';
		o.description = _('Select how nginx obtains TLS certificates.');

		o = s.option(form.Value, 'cert_path', _('Certificate Path'));
		o.placeholder = '/etc/custom/fullchain.pem';
		o.depends('tls_mode', 'manual');

		o = s.option(form.Value, 'key_path', _('Private Key Path'));
		o.placeholder = '/etc/custom/privkey.pem';
		o.depends('tls_mode', 'manual');

		o = s.option(form.Flag, 'auth', _('Enable Authentication'));
		o.default = o.disabled;
		o.description = _('Protect with HTTP basic auth.');

		o = s.option(form.Value, 'auth_user', _('Auth Username'));
		o.depends('auth', '1');

		o = s.option(form.Value, 'auth_pass', _('Auth Password'));
		o.depends('auth', '1');
		o.password = true;

		o = s.option(form.Flag, 'websocket', _('WebSocket Support'));
		o.default = o.disabled;
		o.description = _('Forward upgrade headers for WS backends.');

		o = s.option(form.Flag, 'enabled', _('Enable Virtual Host'));
		o.default = '1';
		o.description = _('Toggle to disable without deleting configuration.');

		s.addModalOptions = function(s, section_id) {
			var domain = this.section.formvalue(section_id, 'domain');
			var backend = this.section.formvalue(section_id, 'backend');
			var tlsMode = this.section.formvalue(section_id, 'tls_mode') || 'off';
			var auth = this.section.formvalue(section_id, 'auth') === '1';
			var websocket = this.section.formvalue(section_id, 'websocket') === '1';
			var enabled = this.section.formvalue(section_id, 'enabled') !== '0';
			var certPath = this.section.formvalue(section_id, 'cert_path') || '';
			var keyPath = this.section.formvalue(section_id, 'key_path') || '';
			var authUser = this.section.formvalue(section_id, 'auth_user') || '';
			var authPass = this.section.formvalue(section_id, 'auth_pass') || '';

			if (!domain || !backend) {
				ui.addNotification(null, E('p', _('Domain and backend are required')), 'error');
				return;
			}

			if (auth && (!authUser || !authPass)) {
				ui.addNotification(null, E('p', _('Username and password required for authentication')), 'error');
				return;
			}

			if (tlsMode === 'manual' && (!certPath || !keyPath)) {
				ui.addNotification(null, E('p', _('Manual TLS requires certificate and key paths')), 'error');
				return;
			}

			API.addVHost(
				domain,
				backend,
				tlsMode,
				auth,
				auth ? authUser : null,
				auth ? authPass : null,
				websocket,
				enabled,
				tlsMode === 'manual' ? certPath : null,
				tlsMode === 'manual' ? keyPath : null
			).then(function(result) {
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

		return m;
	},

	renderHeader: function(vhosts) {
		var active = vhosts.filter(isEnabled);
		var sslEnabled = active.filter(function(v) { return v.ssl; }).length;
		var authEnabled = active.filter(function(v) { return v.auth; }).length;
		var websocketEnabled = active.filter(function(v) { return v.websocket; }).length;

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🗂️'),
					_('Virtual Hosts')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Publish LAN services through SecuBox with SSL, auth, and WebSocket support.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStatBadge(vhosts.length, _('Defined')),
				this.renderStatBadge(active.length, _('Enabled')),
				this.renderStatBadge(sslEnabled, _('TLS')),
				this.renderStatBadge(authEnabled, _('Auth')),
				this.renderStatBadge(websocketEnabled, _('WebSocket'))
			])
		]);
	},

	renderStatBadge: function(value, label) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderList: function(vhosts, certs) {
		var certMap = {};
		certs.forEach(function(cert) {
			certMap[cert.domain] = cert;
		});

		if (!vhosts.length) {
			return E('div', { 'class': 'vhost-card' }, [
				E('div', { 'class': 'vhost-card-title' }, ['📂', _('Configured VHosts')]),
				E('div', { 'class': 'vhost-empty' }, _('No vhosts yet — add your first reverse proxy below.'))
			]);
		}

		return E('div', { 'class': 'vhost-card-grid' },
			vhosts.map(function(vhost) {
				return this.renderVhostCard(vhost, certMap[vhost.domain]);
			}, this)
		);
	},

	renderVhostCard: function(vhost, cert) {
		var pills = [];
		if (!isEnabled(vhost)) {
			pills.push(E('span', { 'class': 'vhost-pill danger' }, _('Disabled')));
		} else if (vhost.ssl) {
			pills.push(E('span', { 'class': 'vhost-pill success' }, _('TLS')));
		}
		if (vhost.auth) pills.push(E('span', { 'class': 'vhost-pill warn' }, _('Auth')));
		if (vhost.websocket) pills.push(E('span', { 'class': 'vhost-pill' }, _('WebSocket')));
		if (vhost.tls_mode === 'manual') {
			pills.push(E('span', { 'class': 'vhost-pill' }, _('Manual cert')));
		}

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['🌐', vhost.domain || _('Unnamed')]),
			E('div', { 'class': 'vhost-card-meta' }, vhost.backend || _('No backend defined')),
			pills.length ? E('div', { 'class': 'vhost-filter-tags' }, pills) : '',
			E('div', { 'class': 'vhost-card-meta' }, _('TLS Mode: %s').format(formatTlsMode(vhost))),
			E('div', { 'class': 'vhost-card-meta' },
				cert ? _('Certificate expires %s').format(formatDate(cert.expires)) : _('No certificate detected'))
		]);
	}
});
