'use strict';
'require view';
'require ui';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';
'require secubox/kiss-theme';

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

function daysUntil(dateStr) {
	if (!dateStr)
		return null;
	var ts = Date.parse(dateStr);
	if (isNaN(ts))
		return null;
	return Math.round((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
	if (!dateStr)
		return _('N/A');
	try {
		return new Date(dateStr).toLocaleString();
	} catch (err) {
		return dateStr;
	}
}

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listCerts(),
			API.getStatus()
		]);
	},

	render: function(data) {
		var certs = normalizeCerts(data[0]);
		var status = data[1] || {};

		return KissTheme.wrap([
			E('div', { 'class': 'vhost-page' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
				VHostUI.renderTabs('certificates'),
				this.renderHeader(certs, status),
				this.renderRequestCard(),
				this.renderCertTable(certs)
			])
		], 'admin/services/vhost/certificates');
	},

	renderHeader: function(certs, status) {
		var expiringSoon = certs.filter(function(cert) {
			var days = daysUntil(cert.expires);
			return days !== null && days <= 30;
		}).length;

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🔐'),
					_('SSL Certificates')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Request Let\'s Encrypt certificates and monitor expiry across all proxies.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStatBadge(certs.length, _('Installed')),
				this.renderStatBadge(expiringSoon, _('Expiring < 30d')),
				this.renderStatBadge(status.acme_available ? _('ACME Ready') : _('ACME Missing'), _('Automation')),
				this.renderStatBadge(status.nginx_running ? _('Nginx OK') : _('Nginx down'), _('Web server'))
			])
		]);
	},

	renderStatBadge: function(value, label) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderRequestCard: function() {
		var domainInput = E('input', { 'type': 'text', 'placeholder': 'cloud.example.com' });
		var emailInput = E('input', { 'type': 'email', 'placeholder': 'admin@example.com' });

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['🪄', _('Request Certificate')]),
			E('p', { 'class': 'vhost-card-meta' }, _('Issue a Let\'s Encrypt certificate using HTTP-01 validation.')),
			E('div', { 'class': 'vhost-form-grid' }, [
				E('div', {}, [
					E('label', {}, _('Domain')),
					domainInput
				]),
				E('div', {}, [
					E('label', {}, _('Contact Email')),
					emailInput
				])
			]),
			E('div', { 'class': 'vhost-actions' }, [
				E('button', {
					'class': 'sh-btn-primary',
					'click': this.requestCert.bind(this, domainInput, emailInput)
				}, _('Request certificate'))
			])
		]);
	},

	renderCertTable: function(certs) {
		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['📋', _('Installed Certificates')]),
			certs.length ? E('table', { 'class': 'vhost-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, _('Domain')),
					E('th', {}, _('Issuer')),
					E('th', {}, _('Expires')),
					E('th', {}, _('Status')),
					E('th', {}, _('Actions'))
				])),
				E('tbody', {},
					certs.map(this.renderCertRow, this))
			]) : E('div', { 'class': 'vhost-empty' }, _('No certificates issued yet.'))
		]);
	},

	renderCertRow: function(cert) {
		var days = daysUntil(cert.expires);
		var pill = 'success';
		var label = _('Valid');

		if (days === null) {
			pill = 'danger';
			label = _('Unknown');
		} else if (days <= 7) {
			pill = 'danger';
			label = _('Expiring in %d days').format(days);
		} else if (days <= 30) {
			pill = 'warn';
			label = _('Renew soon (%d days)').format(days);
		}

		return E('tr', {}, [
			E('td', {}, cert.domain),
			E('td', {}, cert.issuer || _('Unknown')),
			E('td', {}, formatDate(cert.expires)),
			E('td', {}, E('span', { 'class': 'vhost-pill ' + pill }, label)),
			E('td', {}, E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function(ev) {
					ev.preventDefault();
					ui.showModal(_('Certificate Details'), [
						E('p', {}, [
							E('strong', {}, _('Domain: ')),
							E('span', {}, cert.domain)
						]),
						E('p', {}, [
							E('strong', {}, _('Subject: ')),
							E('span', {}, cert.subject || _('Unknown'))
						]),
						E('p', {}, [
							E('strong', {}, _('Issuer: ')),
							E('span', {}, cert.issuer || _('Unknown'))
						]),
						E('p', {}, [
							E('strong', {}, _('Expires: ')),
							E('span', {}, formatDate(cert.expires))
						]),
						E('div', { 'class': 'right' }, [
							E('button', {
								'class': 'cbi-button cbi-button-neutral',
								'click': ui.hideModal
							}, _('Close'))
						])
					]);
				}
			}, _('Details')))
		]);
	},

	requestCert: function(domainInput, emailInput, ev) {
		if (ev)
			ev.preventDefault();

		var domain = domainInput.value.trim();
		var email = emailInput.value.trim();

		if (!domain || !email) {
			ui.addNotification(null, E('p', _('Domain and email are required')), 'error');
			return;
		}

		ui.addNotification(null, E('p', _('Requesting certificate... This may take a few minutes.')), 'info');

		API.requestCert(domain, email).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '✓ ' + _('Certificate obtained successfully')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', '✗ ' + (result.message || _('Request failed'))), 'error');
			}
		});
	}
});
