'use strict';
'require view';
'require ui';
'require form';
'require poll';
'require uci';
'require dom';
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
	vhostsData: [],
	certsData: [],

	load: function() {
		return Promise.all([
			API.listVHosts(),
			API.listCerts()
		]);
	},

	render: function(data) {
		this.vhostsData = data[0] || [];
		this.certsData = normalizeCerts(data[1]);

		var m, s, o;

		m = new form.Map('vhosts', null, null);

		// Add custom dashboard section at the top
		s = m.section(form.NamedSection, '_dashboard', 'dashboard', null);
		s.anonymous = true;
		s.render = L.bind(function() {
			return E('div', {}, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
				VHostUI.renderTabs('vhosts'),
				E('div', { 'id': 'vhosts-dashboard' }, [
					this.renderHeader(this.vhostsData),
					this.renderList(this.vhostsData, this.certsData)
				])
			]);
		}, this);

		// Add VHost configuration section
		s = m.section(form.GridSection, 'vhost', _('Virtual Hosts'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;
		s.modaltitle = function(section_id) {
			return _('Edit VHost: ') + section_id;
		};

		o = s.option(form.Value, 'domain', _('Domain'));
		o.rmempty = false;
		o.placeholder = 'app.example.com';
		o.description = _('Public hostname for this proxy.');

		o = s.option(form.Value, 'upstream', _('Backend URL'));
		o.rmempty = false;
		o.placeholder = 'http://192.168.1.100:8080';
		o.description = _('Upstream origin (HTTP/HTTPS/WebSocket).');

		o = s.option(form.ListValue, 'tls', _('TLS Mode'));
		o.value('off', _('Disabled (HTTP only)'));
		o.value('acme', _('Automatic (acme.sh)'));
		o.value('manual', _('Manual certificate'));
		o.default = 'acme';
		o.description = _('Select how nginx obtains TLS certificates.');

		o = s.option(form.Value, 'cert_path', _('Certificate Path'));
		o.placeholder = '/etc/custom/fullchain.pem';
		o.depends('tls', 'manual');

		o = s.option(form.Value, 'key_path', _('Private Key Path'));
		o.placeholder = '/etc/custom/privkey.pem';
		o.depends('tls', 'manual');

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

		// Start auto-refresh polling
		poll.add(L.bind(this.pollData, this), 10);

		return m.render();
	},

	pollData: function() {
		return Promise.all([
			API.listVHosts(),
			API.listCerts()
		]).then(L.bind(function(data) {
			this.vhostsData = data[0] || [];
			this.certsData = normalizeCerts(data[1]);
			this.updateDisplay();
		}, this));
	},

	updateDisplay: function() {
		var dashboard = document.getElementById('vhosts-dashboard');
		if (!dashboard) return;

		dom.content(dashboard, [
			this.renderHeader(this.vhostsData),
			this.renderList(this.vhostsData, this.certsData)
		]);
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
				E('div', { 'class': 'vhost-empty' }, _('No vhosts yet — add your first reverse proxy using the form below.'))
			]);
		}

		return E('div', { 'class': 'vhost-card-grid' },
			vhosts.map(function(vhost) {
				return this.renderVhostCard(vhost, certMap[vhost.domain]);
			}, this)
		);
	},

	renderVhostCard: function(vhost, cert) {
		var enabled = isEnabled(vhost);
		var pills = [];

		if (!enabled) {
			pills.push(E('span', { 'class': 'vhost-pill danger' }, _('Disabled')));
		} else {
			pills.push(E('span', { 'class': 'vhost-pill success' }, _('Active')));
		}

		if (vhost.ssl) pills.push(E('span', { 'class': 'vhost-pill success' }, '🔒 TLS'));
		if (vhost.auth) pills.push(E('span', { 'class': 'vhost-pill warn' }, '🔐 Auth'));
		if (vhost.websocket) pills.push(E('span', { 'class': 'vhost-pill' }, '⚡ WebSocket'));
		if (vhost.tls_mode === 'manual') {
			pills.push(E('span', { 'class': 'vhost-pill' }, _('Manual cert')));
		}

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['🌐', vhost.domain || _('Unnamed')]),
			pills.length ? E('div', { 'class': 'vhost-filter-tags' }, pills) : '',
			E('div', { 'class': 'vhost-card-meta' }, [
				E('strong', {}, _('Backend: ')),
				E('span', {}, vhost.backend || _('No backend defined'))
			]),
			E('div', { 'class': 'vhost-card-meta' }, [
				E('strong', {}, _('TLS: ')),
				E('span', {}, formatTlsMode(vhost))
			]),
			cert ? E('div', { 'class': 'vhost-card-meta' }, [
				E('strong', {}, _('Certificate: ')),
				E('span', {}, _('Expires %s').format(formatDate(cert.expires)))
			]) : E('div', { 'class': 'vhost-card-meta' }, _('No certificate detected')),
			E('div', { 'class': 'vhost-actions', 'style': 'margin-top: 1rem; display: flex; gap: 0.5rem;' }, [
				E('button', {
					'class': 'sh-btn-secondary',
					'click': L.bind(this.handleEditVHost, this, vhost)
				}, _('Edit')),
				E('button', {
					'class': enabled ? 'sh-btn-warning' : 'sh-btn-success',
					'click': L.bind(this.handleToggleVHost, this, vhost)
				}, enabled ? _('Disable') : _('Enable')),
				E('button', {
					'class': 'sh-btn-negative',
					'click': L.bind(this.handleRemoveVHost, this, vhost)
				}, _('Remove'))
			])
		]);
	},

	handleEditVHost: function(vhost, ev) {
		var section = vhost.section || vhost['.name'];
		if (!section) {
			ui.addNotification(null, E('p', _('Cannot edit: VHost section name not found')), 'error');
			return;
		}

		// Scroll to form and open modal for this section
		var formCard = document.querySelector('.cbi-section-table');
		if (formCard) {
			formCard.scrollIntoView({ behavior: 'smooth' });
		}
		ui.addNotification(null, E('p', _('Use the table below to edit %s').format(vhost.domain)), 'info');
	},

	handleToggleVHost: function(vhost, ev) {
		var section = vhost.section || vhost['.name'];
		var enabled = isEnabled(vhost);
		var newState = !enabled;

		ui.showModal(_('Confirm Toggle'), [
			E('p', {}, enabled ?
				_('Are you sure you want to disable this virtual host?') :
				_('Are you sure you want to enable this virtual host?')),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, vhost.domain || section)
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': newState ? 'btn cbi-button-positive' : 'btn cbi-button-warning',
					'click': L.bind(function() {
						ui.hideModal();
						this.toggleVHost(section, newState);
					}, this)
				}, newState ? _('Enable') : _('Disable'))
			])
		], 'cbi-modal');
	},

	handleRemoveVHost: function(vhost, ev) {
		var section = vhost.section || vhost['.name'];

		ui.showModal(_('Remove Virtual Host'), [
			E('p', {}, _('Are you sure you want to remove this virtual host?')),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, vhost.domain || section),
				E('p', {}, _('Backend: %s').format(vhost.backend || _('N/A')))
			]),
			E('p', { 'style': 'color: #d9534f;' },
				_('This will delete the VHost configuration. Nginx will be reloaded automatically.')),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.deleteVHost(section);
					}, this)
				}, _('Remove'))
			])
		], 'cbi-modal');
	},

	toggleVHost: function(section, enabled) {
		ui.showModal(_('Updating...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return uci.load('vhosts')
			.then(L.bind(function() {
				uci.set('vhosts', section, 'enabled', enabled ? '1' : '0');
				return uci.save();
			}, this))
			.then(L.bind(function() {
				return uci.apply();
			}, this))
			.then(L.bind(function() {
				return API.reloadNginx();
			}, this))
			.then(L.bind(function(result) {
				ui.hideModal();
				if (result && result.success) {
					ui.addNotification(null, E('p', _('Virtual host %s successfully').format(enabled ? _('enabled') : _('disabled'))), 'info');
					this.pollData();
				} else {
					ui.addNotification(null, E('p', _('Failed to reload nginx: %s').format(result.message || _('Unknown error'))), 'error');
				}
			}, this))
			.catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
			});
	},

	deleteVHost: function(section) {
		ui.showModal(_('Removing...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return uci.load('vhosts')
			.then(L.bind(function() {
				uci.remove('vhosts', section);
				return uci.save();
			}, this))
			.then(L.bind(function() {
				return uci.apply();
			}, this))
			.then(L.bind(function() {
				return API.reloadNginx();
			}, this))
			.then(L.bind(function(result) {
				ui.hideModal();
				if (result && result.success) {
					ui.addNotification(null, E('p', _('Virtual host removed successfully')), 'info');
					this.pollData();
				} else {
					ui.addNotification(null, E('p', _('Failed to reload nginx after removal')), 'error');
				}
			}, this))
			.catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
			});
	}
});
