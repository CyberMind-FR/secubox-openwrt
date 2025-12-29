'use strict';
'require view';
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

function daysUntil(dateStr) {
	if (!dateStr)
		return null;
	var ts = Date.parse(dateStr);
	if (isNaN(ts))
		return null;
	return Math.round((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.listVHosts(),
			API.listCerts()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var vhosts = data[1] || [];
		var certs = normalizeCerts(data[2]);

		return E('div', { 'class': 'vhost-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
			VHostUI.renderTabs('overview'),
			this.renderHeader(status, vhosts, certs),
			this.renderHealth(status),
			this.renderVhostTable(vhosts, certs),
			this.renderCertWatch(certs)
		]);
	},

	renderHeader: function(status, vhosts, certs) {
		var sslEnabled = vhosts.filter(function(v) { return v.ssl; }).length;
		var expiringSoon = certs.filter(function(cert) {
			var days = daysUntil(cert.expires);
			return days !== null && days <= 30;
		}).length;

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🌐'),
					_('VHost Manager')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Reverse proxy, SSL automation and hardened headers for SecuBox deployments.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip('🏷️', _('Version'), status.version || '0.4.1'),
				this.renderHeaderChip('📁', _('Virtual Hosts'), (status.vhost_count || vhosts.length)),
				this.renderHeaderChip('🔒', _('TLS Enabled'), sslEnabled),
				this.renderHeaderChip('⏳', _('Expiring'), expiringSoon, expiringSoon > 0 ? 'warn' : '')
			])
		]);
	},

	renderHeaderChip: function(icon, label, value, tone) {
		var display = (value == null ? '—' : value).toString();
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, display)
			])
		]);
	},

	renderHealth: function(status) {
		var items = [
			{ label: _('Nginx'), value: status.nginx_running ? _('Running') : _('Stopped'),
				pill: status.nginx_running ? 'success' : 'danger' },
			{ label: _('Version'), value: status.nginx_version || _('Unknown') },
			{ label: _('ACME'), value: status.acme_available ? _('Available') : _('Missing'),
				pill: status.acme_available ? 'success' : 'warn' }
		];

		return E('div', { 'class': 'vhost-card-grid' }, [
			E('div', { 'class': 'vhost-card' }, [
				E('div', { 'class': 'vhost-card-title' }, ['🧭', _('Control Center')]),
				E('p', { 'class': 'vhost-card-meta' },
					_('Quick navigation to key areas.')),
				E('div', { 'class': 'vhost-actions' }, [
					E('a', {
						'class': 'sh-btn-primary',
						'href': L.url('admin', 'secubox', 'services', 'vhosts', 'vhosts')
					}, _('Manage VHosts')),
					E('a', {
						'class': 'sh-btn-secondary',
						'href': L.url('admin', 'secubox', 'services', 'vhosts', 'certificates')
					}, _('Certificates')),
					E('a', {
						'class': 'sh-btn-secondary',
						'href': L.url('admin', 'secubox', 'services', 'vhosts', 'logs')
					}, _('Access Logs'))
				])
			]),
			E('div', { 'class': 'vhost-card' }, [
				E('div', { 'class': 'vhost-card-title' }, ['🩺', _('Runtime Health')]),
				E('div', { 'class': 'vhost-status-list' },
					items.map(function(item) {
						return E('div', { 'class': 'vhost-status-item' }, [
							E('span', {}, item.label),
							item.pill ? E('span', { 'class': 'vhost-pill ' + item.pill }, item.value) :
								E('strong', {}, item.value)
						]);
					})
				)
			])
		]);
	},

	renderVhostTable: function(vhosts, certs) {
		var certMap = {};
		certs.forEach(function(cert) {
			certMap[cert.domain] = cert;
		});

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['📁', _('Published Domains')]),
			vhosts.length ? E('table', { 'class': 'vhost-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, _('Domain')),
					E('th', {}, _('Backend')),
					E('th', {}, _('Features')),
					E('th', {}, _('Certificate'))
				])),
				E('tbody', {},
					vhosts.map(function(vhost) {
						var cert = certMap[vhost.domain];
						var features = [
							vhost.ssl ? _('SSL') : null,
							vhost.auth ? _('Auth') : null,
							vhost.websocket ? _('WebSocket') : null
						].filter(Boolean);

						return E('tr', {}, [
							E('td', {}, vhost.domain || _('Unnamed')),
							E('td', { 'class': 'vhost-card-meta' }, vhost.backend || '-'),
							E('td', {}, features.length ? features.join(' · ') : _('None')),
							E('td', {}, cert ? formatDate(cert.expires) : _('No cert'))
						]);
					})
				)
			]) : E('div', { 'class': 'vhost-empty' }, _('No virtual hosts configured yet.'))
		]);
	},

	renderCertWatch: function(certs) {
		if (!certs.length)
			return '';

		var top = certs.slice().sort(function(a, b) {
			return (Date.parse(a.expires) || 0) - (Date.parse(b.expires) || 0);
		}).slice(0, 3);

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['⏳', _('Certificate Watchlist')]),
			E('div', { 'class': 'vhost-card-grid' },
				top.map(function(cert) {
					var days = daysUntil(cert.expires);
					var pill = 'success';
					var label = _('Valid');

					if (days === null) {
						pill = 'danger';
						label = _('Unknown expiry');
					} else if (days <= 7) {
						pill = 'danger';
						label = _('Expiring in %d days').format(days);
					} else if (days <= 30) {
						pill = 'warn';
						label = _('Renew in %d days').format(days);
					}

					return E('div', { 'class': 'vhost-card' }, [
						E('div', { 'class': 'vhost-card-title' }, ['🔐', cert.domain]),
						E('div', { 'class': 'vhost-card-meta' }, cert.issuer || _('Unknown issuer')),
						E('div', { 'class': 'vhost-card-meta' }, formatDate(cert.expires)),
						E('span', { 'class': 'vhost-pill ' + pill }, label)
					]);
				})
			),
			E('div', { 'class': 'vhost-actions' }, [
				E('a', {
					'class': 'sh-btn-secondary',
					'href': L.url('admin', 'secubox', 'services', 'vhosts', 'certificates')
				}, _('View certificates'))
			])
		]);
	}
});
