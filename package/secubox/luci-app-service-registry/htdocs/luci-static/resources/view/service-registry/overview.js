'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require service-registry/api as api';

// Category icons
var catIcons = {
	'proxy': '🌐', 'privacy': '🧅', 'system': '⚙️', 'app': '📱',
	'media': '🎵', 'security': '🔐', 'container': '📦', 'services': '🖥️',
	'monitoring': '📊', 'other': '🔗'
};

// Health status icons
var healthIcons = {
	'dns': { 'ok': '🌐', 'failed': '❌', 'none': '⚪' },
	'cert': { 'ok': '🔒', 'warning': '⚠️', 'critical': '🔴', 'expired': '💀', 'missing': '⚪', 'none': '⚪' },
	'firewall': { 'ok': '✅', 'partial': '⚠️', 'closed': '🚫' }
};

// Generate QR code using QR Server API (free, reliable)
function generateQRCodeImg(data, size) {
	var url = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(data);
	return '<img src="' + url + '" alt="QR Code" style="display:block;" />';
}

return view.extend({
	title: _('Service Registry'),
	pollInterval: 30,
	healthData: null,

	load: function() {
		return api.getDashboardDataWithHealth();
	},

	render: function(data) {
		var self = this;
		var services = data.services || [];
		var providers = data.providers || {};

		// Store health data for service lookups
		this.healthData = data.health || {};

		// Load CSS
		var style = document.createElement('style');
		style.textContent = this.getStyles();
		document.head.appendChild(style);

		var published = services.filter(function(s) { return s.published; });
		var unpublished = services.filter(function(s) { return !s.published; });

		return E('div', { 'class': 'sr-compact' }, [
			this.renderHeader(services, providers, data.haproxy, data.tor),
			this.renderHealthSummary(data.health),
			this.renderUrlChecker(),
			this.renderSection('📡 Published Services', published, true),
			this.renderSection('🔍 Discovered Services', unpublished, false),
			this.renderLandingLink(data.landing)
		]);
	},

	renderHealthSummary: function(health) {
		if (!health || !health.firewall) return E('div');

		var firewallStatus = health.firewall.status || 'unknown';
		var firewallIcon = healthIcons.firewall[firewallStatus] || '❓';
		var haproxyStatus = health.haproxy && health.haproxy.status === 'running' ? '🟢' : '🔴';
		var torStatus = health.tor && health.tor.status === 'running' ? '🟢' : '🔴';

		// Count service health
		var services = health.services || [];
		var dnsOk = services.filter(function(s) { return s.dns_status === 'ok'; }).length;
		var certOk = services.filter(function(s) { return s.cert_status === 'ok'; }).length;
		var certWarn = services.filter(function(s) { return s.cert_status === 'warning' || s.cert_status === 'critical'; }).length;

		return E('div', { 'class': 'sr-health-bar' }, [
			E('span', { 'class': 'sr-health-item', 'title': 'Firewall ports 80/443' },
				firewallIcon + ' Firewall: ' + firewallStatus),
			E('span', { 'class': 'sr-health-item', 'title': 'HAProxy container' },
				haproxyStatus + ' HAProxy'),
			E('span', { 'class': 'sr-health-item', 'title': 'Tor daemon' },
				torStatus + ' Tor'),
			services.length > 0 ? E('span', { 'class': 'sr-health-item' },
				'🌐 DNS: ' + dnsOk + '/' + services.length) : null,
			services.length > 0 ? E('span', { 'class': 'sr-health-item' },
				'🔒 Certs: ' + certOk + '/' + services.length +
				(certWarn > 0 ? ' (⚠️ ' + certWarn + ')' : '')) : null
		].filter(Boolean));
	},

	renderUrlChecker: function() {
		var self = this;
		return E('div', { 'class': 'sr-wizard-card' }, [
			E('div', { 'class': 'sr-wizard-header' }, [
				E('span', { 'class': 'sr-wizard-icon' }, '🔍'),
				E('span', { 'class': 'sr-wizard-title' }, 'URL Readiness Checker'),
				E('span', { 'class': 'sr-wizard-desc' }, 'Check if a domain is ready to be hosted')
			]),
			E('div', { 'class': 'sr-wizard-form' }, [
				E('input', {
					'type': 'text',
					'id': 'url-check-domain',
					'placeholder': 'Enter domain (e.g., example.com)',
					'class': 'sr-wizard-input'
				}),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, 'handleUrlCheck')
				}, '🔍 Check')
			]),
			E('div', { 'id': 'url-check-results', 'class': 'sr-check-results' })
		]);
	},

	handleUrlCheck: function() {
		var self = this;
		var domain = document.getElementById('url-check-domain').value.trim();
		var resultsDiv = document.getElementById('url-check-results');

		if (!domain) {
			resultsDiv.innerHTML = '<div class="sr-check-error">Please enter a domain</div>';
			return;
		}

		// Clean domain (remove protocol if present)
		domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

		resultsDiv.innerHTML = '<div class="sr-check-loading">🔄 Checking ' + domain + '...</div>';

		api.checkServiceHealth('', domain).then(function(result) {
			if (!result.success) {
				resultsDiv.innerHTML = '<div class="sr-check-error">❌ Check failed: ' + (result.error || 'Unknown error') + '</div>';
				return;
			}

			var html = '<div class="sr-check-grid">';

			// DNS Status
			var dnsStatus = result.dns || {};
			var dnsIcon = healthIcons.dns[dnsStatus.status] || '❓';
			var dnsClass = dnsStatus.status === 'ok' ? 'sr-check-ok' : 'sr-check-fail';
			html += '<div class="sr-check-item ' + dnsClass + '">';
			html += '<span class="sr-check-icon">' + dnsIcon + '</span>';
			html += '<span class="sr-check-label">DNS Resolution</span>';
			if (dnsStatus.status === 'ok') {
				html += '<span class="sr-check-value">✅ Resolves to ' + dnsStatus.resolved_ip + '</span>';
			} else {
				html += '<span class="sr-check-value">❌ DNS not configured or not resolving</span>';
			}
			html += '</div>';

			// Firewall Status
			var fwStatus = result.firewall || {};
			var fwIcon = healthIcons.firewall[fwStatus.status] || '❓';
			var fwClass = fwStatus.status === 'ok' ? 'sr-check-ok' : (fwStatus.status === 'partial' ? 'sr-check-warn' : 'sr-check-fail');
			html += '<div class="sr-check-item ' + fwClass + '">';
			html += '<span class="sr-check-icon">' + fwIcon + '</span>';
			html += '<span class="sr-check-label">Firewall Ports</span>';
			var ports = [];
			if (fwStatus.http_open) ports.push('80');
			if (fwStatus.https_open) ports.push('443');
			html += '<span class="sr-check-value">' + (ports.length ? 'Open: ' + ports.join(', ') : '❌ Ports 80/443 not open') + '</span>';
			html += '</div>';

			// Certificate Status
			var certStatus = result.certificate || {};
			var certIcon = healthIcons.cert[certStatus.status] || '❓';
			var certClass = certStatus.status === 'ok' ? 'sr-check-ok' : (certStatus.status === 'warning' ? 'sr-check-warn' : 'sr-check-fail');
			html += '<div class="sr-check-item ' + certClass + '">';
			html += '<span class="sr-check-icon">' + certIcon + '</span>';
			html += '<span class="sr-check-label">SSL Certificate</span>';
			if (certStatus.status === 'ok' || certStatus.status === 'warning') {
				html += '<span class="sr-check-value">' + certStatus.days_left + ' days remaining</span>';
			} else if (certStatus.status === 'expired') {
				html += '<span class="sr-check-value">❌ Certificate expired</span>';
			} else if (certStatus.status === 'missing') {
				html += '<span class="sr-check-value">⚪ No certificate (request via HAProxy)</span>';
			} else {
				html += '<span class="sr-check-value">⚪ Not applicable</span>';
			}
			html += '</div>';

			// HAProxy Status
			var haStatus = result.haproxy || {};
			var haIcon = haStatus.status === 'running' ? '🟢' : '🔴';
			var haClass = haStatus.status === 'running' ? 'sr-check-ok' : 'sr-check-fail';
			html += '<div class="sr-check-item ' + haClass + '">';
			html += '<span class="sr-check-icon">' + haIcon + '</span>';
			html += '<span class="sr-check-label">HAProxy</span>';
			html += '<span class="sr-check-value">' + (haStatus.status === 'running' ? '✅ Running' : '❌ Not running') + '</span>';
			html += '</div>';

			html += '</div>';

			// Summary and recommendation
			var allOk = dnsStatus.status === 'ok' && fwStatus.status === 'ok' && haStatus.status === 'running';
			var needsCert = certStatus.status === 'missing';

			html += '<div class="sr-check-summary">';
			if (allOk && !needsCert) {
				html += '<div class="sr-check-ready">✅ ' + domain + ' is ready and serving!</div>';
			} else if (allOk && needsCert) {
				html += '<div class="sr-check-almost">⚠️ ' + domain + ' is ready - just need SSL certificate</div>';
				html += '<a href="/cgi-bin/luci/admin/services/haproxy/certificates" class="sr-check-action">📜 Request Certificate</a>';
			} else {
				html += '<div class="sr-check-notready">❌ ' + domain + ' needs configuration</div>';
				if (dnsStatus.status !== 'ok') {
					html += '<div class="sr-check-tip">💡 Point DNS A record to your public IP</div>';
				}
				if (fwStatus.status !== 'ok') {
					html += '<div class="sr-check-tip">💡 Open ports 80 and 443 in firewall</div>';
				}
				if (haStatus.status !== 'running') {
					html += '<div class="sr-check-tip">💡 Start HAProxy container</div>';
				}
			}
			html += '</div>';

			resultsDiv.innerHTML = html;
		}).catch(function(err) {
			resultsDiv.innerHTML = '<div class="sr-check-error">❌ Error: ' + err.message + '</div>';
		});
	},

	renderHeader: function(services, providers, haproxy, tor) {
		var published = services.filter(function(s) { return s.published; }).length;
		var running = services.filter(function(s) { return s.status === 'running'; }).length;
		var haproxyCount = providers.haproxy ? providers.haproxy.count : 0;
		var torCount = providers.tor ? providers.tor.count : 0;

		var haproxyStatus = haproxy && haproxy.container_running ? '🟢' : '🔴';
		var torStatus = tor && tor.running ? '🟢' : '🔴';

		return E('div', { 'class': 'sr-header' }, [
			E('div', { 'class': 'sr-title' }, [
				E('h2', {}, '🗂️ Service Registry'),
				E('span', { 'class': 'sr-subtitle' },
					published + ' published · ' + running + ' running · ' +
					haproxyCount + ' domains · ' + torCount + ' onion')
			]),
			E('div', { 'class': 'sr-providers-bar' }, [
				E('span', { 'class': 'sr-provider-badge' }, haproxyStatus + ' HAProxy'),
				E('span', { 'class': 'sr-provider-badge' }, torStatus + ' Tor'),
				E('span', { 'class': 'sr-provider-badge' }, '📊 ' + (providers.direct ? providers.direct.count : 0) + ' ports'),
				E('span', { 'class': 'sr-provider-badge' }, '📦 ' + (providers.lxc ? providers.lxc.count : 0) + ' LXC')
			])
		]);
	},

	renderSection: function(title, services, isPublished) {
		var self = this;

		if (services.length === 0) {
			return E('div', { 'class': 'sr-section' }, [
				E('h3', { 'class': 'sr-section-title' }, title),
				E('div', { 'class': 'sr-empty-msg' }, isPublished ?
					'No published services yet' : 'No discovered services')
			]);
		}

		// Group by category
		var grouped = {};
		services.forEach(function(svc) {
			var cat = svc.category || 'other';
			if (!grouped[cat]) grouped[cat] = [];
			grouped[cat].push(svc);
		});

		var lists = [];
		Object.keys(grouped).sort().forEach(function(cat) {
			var catIcon = catIcons[cat] || '🔗';
			lists.push(E('div', { 'class': 'sr-category' }, [
				E('div', { 'class': 'sr-cat-header' }, catIcon + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1)),
				E('div', { 'class': 'sr-list' },
					grouped[cat].map(function(svc) {
						return self.renderServiceRow(svc, isPublished);
					})
				)
			]));
		});

		return E('div', { 'class': 'sr-section' }, [
			E('h3', { 'class': 'sr-section-title' }, title + ' (' + services.length + ')'),
			E('div', { 'class': 'sr-categories' }, lists)
		]);
	},

	renderServiceRow: function(service, isPublished) {
		var self = this;
		var urls = service.urls || {};

		// Status indicators
		var healthIcon = service.status === 'running' ? '🟢' :
						 service.status === 'stopped' ? '🔴' : '🟡';
		var publishIcon = service.published ? '✅' : '⬜';

		// Build URL display
		var urlDisplay = '';
		if (urls.clearnet) {
			urlDisplay = urls.clearnet;
		} else if (urls.onion) {
			urlDisplay = urls.onion.substring(0, 25) + '...';
		} else if (urls.local) {
			urlDisplay = urls.local;
		}

		// Port display
		var portDisplay = service.local_port ? ':' + service.local_port : '';
		if (service.haproxy && service.haproxy.backend_port) {
			portDisplay = ':' + service.haproxy.backend_port;
		}

		// Get health status for this domain (if available)
		var healthBadges = [];
		var domain = service.haproxy && service.haproxy.domain;
		if (domain && this.healthData && this.healthData.services) {
			var svcHealth = this.healthData.services.find(function(h) {
				return h.domain === domain;
			});
			if (svcHealth) {
				// DNS badge
				var dnsIcon = healthIcons.dns[svcHealth.dns_status] || '❓';
				var dnsTitle = svcHealth.dns_status === 'ok' ?
					'DNS OK: ' + svcHealth.dns_ip : 'DNS: ' + svcHealth.dns_status;
				healthBadges.push(E('span', {
					'class': 'sr-badge sr-badge-dns sr-badge-' + svcHealth.dns_status,
					'title': dnsTitle
				}, dnsIcon));

				// Cert badge
				var certIcon = healthIcons.cert[svcHealth.cert_status] || '❓';
				var certTitle = svcHealth.cert_status === 'ok' || svcHealth.cert_status === 'warning' ?
					'Cert: ' + svcHealth.cert_days + ' days' : 'Cert: ' + svcHealth.cert_status;
				healthBadges.push(E('span', {
					'class': 'sr-badge sr-badge-cert sr-badge-' + svcHealth.cert_status,
					'title': certTitle
				}, certIcon));
			}
		}

		// SSL/Cert badge (fallback if no health data)
		if (healthBadges.length === 0 && service.haproxy) {
			if (service.haproxy.acme) {
				healthBadges.push(E('span', { 'class': 'sr-badge sr-badge-acme', 'title': 'ACME Certificate' }, '🔒'));
			} else if (service.haproxy.ssl) {
				healthBadges.push(E('span', { 'class': 'sr-badge sr-badge-ssl', 'title': 'SSL Enabled' }, '🔐'));
			}
		}

		// Tor badge
		if (service.tor && service.tor.enabled) {
			healthBadges.push(E('span', { 'class': 'sr-badge sr-badge-tor', 'title': 'Tor Hidden Service' }, '🧅'));
		}

		// QR button for published services with URLs
		var qrBtn = null;
		if (service.published && (urls.clearnet || urls.onion)) {
			qrBtn = E('button', {
				'class': 'sr-btn sr-btn-qr',
				'title': 'Show QR Code',
				'click': ui.createHandlerFn(this, 'handleShowQR', service)
			}, '📱');
		}

		// Health check button for published services with domains
		var checkBtn = null;
		if (isPublished && domain) {
			checkBtn = E('button', {
				'class': 'sr-btn sr-btn-check',
				'title': 'Check Health',
				'click': ui.createHandlerFn(this, 'handleServiceHealthCheck', service)
			}, '🔍');
		}

		// Action button
		var actionBtn;
		if (isPublished) {
			actionBtn = E('button', {
				'class': 'sr-btn sr-btn-unpublish',
				'title': 'Unpublish',
				'click': ui.createHandlerFn(this, 'handleUnpublish', service.id)
			}, '✖');
		} else {
			actionBtn = E('button', {
				'class': 'sr-btn sr-btn-publish',
				'title': 'Quick Publish',
				'click': ui.createHandlerFn(this, 'handleQuickPublish', service)
			}, '📤');
		}

		return E('div', { 'class': 'sr-row' }, [
			E('span', { 'class': 'sr-col-health', 'title': service.status || 'unknown' }, healthIcon),
			E('span', { 'class': 'sr-col-publish' }, publishIcon),
			E('span', { 'class': 'sr-col-name' }, [
				E('strong', {}, service.name || service.id),
				E('span', { 'class': 'sr-port' }, portDisplay)
			]),
			E('span', { 'class': 'sr-col-url' },
				urlDisplay ? E('a', { 'href': urlDisplay.startsWith('http') ? urlDisplay : 'http://' + urlDisplay, 'target': '_blank' }, urlDisplay) : '-'
			),
			E('span', { 'class': 'sr-col-badges' }, healthBadges),
			E('span', { 'class': 'sr-col-qr' }, [qrBtn, checkBtn].filter(Boolean)),
			E('span', { 'class': 'sr-col-action' }, actionBtn)
		]);
	},

	handleServiceHealthCheck: function(service) {
		var self = this;
		var domain = service.haproxy && service.haproxy.domain;
		if (!domain) return;

		document.getElementById('url-check-domain').value = domain;
		this.handleUrlCheck();

		// Scroll to the checker
		document.querySelector('.sr-wizard-card').scrollIntoView({ behavior: 'smooth' });
	},

	handleShowQR: function(service) {
		var urls = service.urls || {};
		var qrBoxes = [];

		if (urls.clearnet) {
			var qrDiv = E('div', { 'class': 'sr-qr-box' });
			qrDiv.innerHTML = '<div class="sr-qr-code">' + generateQRCodeImg(urls.clearnet, 150) + '</div>' +
				'<div class="sr-qr-label">🌐 Clearnet</div>' +
				'<div class="sr-qr-url">' + urls.clearnet + '</div>';
			qrBoxes.push(qrDiv);
		}

		if (urls.onion) {
			var qrDiv = E('div', { 'class': 'sr-qr-box' });
			qrDiv.innerHTML = '<div class="sr-qr-code">' + generateQRCodeImg(urls.onion, 150) + '</div>' +
				'<div class="sr-qr-label">🧅 Onion</div>' +
				'<div class="sr-qr-url">' + urls.onion + '</div>';
			qrBoxes.push(qrDiv);
		}

		ui.showModal('📱 ' + (service.name || service.id), [
			E('div', { 'class': 'sr-qr-modal' }, qrBoxes),
			E('div', { 'class': 'right', 'style': 'margin-top: 15px;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
			])
		]);
	},

	handleUnpublish: function(serviceId) {
		var self = this;
		if (!confirm('Unpublish this service?')) return;

		ui.showModal(_('Unpublishing'), [
			E('p', { 'class': 'spinning' }, _('Removing service...'))
		]);

		api.unpublishService(serviceId).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Service unpublished')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed to unpublish')), 'error');
			}
		});
	},

	handleQuickPublish: function(service) {
		var self = this;
		var name = service.name || service.id;
		var port = service.local_port || (service.haproxy ? service.haproxy.backend_port : 0);

		ui.showModal(_('Quick Publish: ' + name), [
			E('div', { 'class': 'sr-publish-form' }, [
				E('div', { 'class': 'sr-form-row' }, [
					E('label', {}, 'Domain (optional):'),
					E('input', { 'type': 'text', 'id': 'qp-domain', 'placeholder': 'example.com' })
				]),
				E('div', { 'class': 'sr-form-row' }, [
					E('label', {}, [
						E('input', { 'type': 'checkbox', 'id': 'qp-tor' }),
						' Enable Tor Hidden Service'
					])
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 15px;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': function() {
						var domain = document.getElementById('qp-domain').value.trim();
						var tor = document.getElementById('qp-tor').checked;
						ui.hideModal();
						ui.showModal(_('Publishing'), [
							E('p', { 'class': 'spinning' }, _('Creating endpoints...'))
						]);
						api.publishService(name, port, domain, tor, service.category || 'services', '').then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', '✅ ' + name + ' published!'), 'info');
								location.reload();
							} else {
								ui.addNotification(null, E('p', '❌ Failed: ' + (result.error || '')), 'error');
							}
						});
					}
				}, '📤 Publish')
			])
		]);
	},

	renderLandingLink: function(landing) {
		var exists = landing && landing.exists;
		return E('div', { 'class': 'sr-footer' }, [
			E('span', {}, '📄 Landing Page: '),
			exists ?
				E('a', { 'href': '/secubox-services.html', 'target': '_blank' }, '/secubox-services.html ↗') :
				E('span', { 'class': 'sr-muted' }, 'Not generated'),
			E('button', {
				'class': 'sr-btn sr-btn-regen',
				'click': ui.createHandlerFn(this, 'handleRegenLanding')
			}, '🔄 Regenerate')
		]);
	},

	handleRegenLanding: function() {
		ui.showModal(_('Generating'), [
			E('p', { 'class': 'spinning' }, _('Regenerating landing page...'))
		]);
		api.generateLandingPage().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', '✅ Landing page regenerated'), 'info');
			} else {
				ui.addNotification(null, E('p', '❌ Failed: ' + (result.error || '')), 'error');
			}
		});
	},

	getStyles: function() {
		return `
			.sr-compact { font-family: system-ui, -apple-system, sans-serif; }
			.sr-header { margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px; color: #fff; }
			.sr-title h2 { margin: 0 0 5px 0; font-size: 1.4em; }
			.sr-subtitle { font-size: 0.85em; opacity: 0.8; }
			.sr-providers-bar { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
			.sr-provider-badge { background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 12px; font-size: 0.8em; }

			/* Health Summary Bar */
			.sr-health-bar { display: flex; gap: 15px; margin-bottom: 15px; padding: 10px 15px; background: #f0f7ff; border-radius: 6px; border-left: 4px solid #0099cc; flex-wrap: wrap; }
			@media (prefers-color-scheme: dark) { .sr-health-bar { background: #1a2a3e; } }
			.sr-health-item { font-size: 0.9em; }

			/* URL Checker Wizard Card */
			.sr-wizard-card { background: linear-gradient(135deg, #0a192f 0%, #172a45 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; color: #fff; }
			.sr-wizard-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
			.sr-wizard-icon { font-size: 1.8em; }
			.sr-wizard-title { font-size: 1.2em; font-weight: 600; }
			.sr-wizard-desc { font-size: 0.85em; opacity: 0.7; margin-left: auto; }
			.sr-wizard-form { display: flex; gap: 10px; align-items: center; }
			.sr-wizard-input { flex: 1; padding: 10px 15px; border: 1px solid #334155; border-radius: 6px; background: #0f172a; color: #fff; font-size: 1em; }
			.sr-wizard-input::placeholder { color: #64748b; }

			/* Health Check Results */
			.sr-check-results { margin-top: 15px; }
			.sr-check-loading { text-align: center; padding: 20px; font-size: 1.1em; }
			.sr-check-error { background: #450a0a; padding: 12px 15px; border-radius: 6px; color: #fca5a5; }
			.sr-check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
			.sr-check-item { background: #0f172a; padding: 12px 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px; border-left: 3px solid #334155; }
			.sr-check-item.sr-check-ok { border-left-color: #22c55e; }
			.sr-check-item.sr-check-warn { border-left-color: #eab308; }
			.sr-check-item.sr-check-fail { border-left-color: #ef4444; }
			.sr-check-icon { font-size: 1.3em; }
			.sr-check-label { font-weight: 600; font-size: 0.9em; min-width: 100px; }
			.sr-check-value { font-size: 0.85em; opacity: 0.8; }
			.sr-check-summary { margin-top: 15px; padding: 15px; background: #0f172a; border-radius: 8px; text-align: center; }
			.sr-check-ready { font-size: 1.1em; color: #22c55e; font-weight: 600; }
			.sr-check-almost { font-size: 1.1em; color: #eab308; font-weight: 600; }
			.sr-check-notready { font-size: 1.1em; color: #ef4444; font-weight: 600; margin-bottom: 10px; }
			.sr-check-tip { font-size: 0.85em; opacity: 0.8; margin-top: 5px; }
			.sr-check-action { display: inline-block; margin-top: 10px; padding: 8px 16px; background: #0099cc; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.9em; }
			.sr-check-action:hover { background: #00b3e6; }

			.sr-section { margin-bottom: 25px; }
			.sr-section-title { font-size: 1.1em; margin: 0 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #0ff; color: #0ff; }
			.sr-empty-msg { color: #888; font-style: italic; padding: 15px; }

			.sr-category { margin-bottom: 15px; }
			.sr-cat-header { font-weight: 600; font-size: 0.9em; padding: 6px 10px; background: #f5f5f5; border-radius: 4px; margin-bottom: 5px; }
			@media (prefers-color-scheme: dark) { .sr-cat-header { background: #2a2a3e; } }

			.sr-list { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
			@media (prefers-color-scheme: dark) { .sr-list { border-color: #444; } }

			.sr-row { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #eee; gap: 10px; transition: background 0.15s; }
			.sr-row:last-child { border-bottom: none; }
			.sr-row:hover { background: rgba(0,255,255,0.05); }
			@media (prefers-color-scheme: dark) { .sr-row { border-bottom-color: #333; } }

			.sr-col-health { width: 24px; text-align: center; font-size: 0.9em; }
			.sr-col-publish { width: 24px; text-align: center; }
			.sr-col-name { flex: 1; min-width: 120px; }
			.sr-col-name strong { display: block; }
			.sr-port { font-size: 0.8em; color: #888; }
			.sr-col-url { flex: 2; min-width: 150px; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
			.sr-col-url a { color: #0099cc; text-decoration: none; }
			.sr-col-url a:hover { text-decoration: underline; }
			.sr-col-badges { width: 80px; display: flex; gap: 4px; }
			.sr-col-qr { width: 60px; display: flex; gap: 4px; }
			.sr-col-action { width: 36px; }

			.sr-badge { font-size: 0.85em; cursor: help; }
			.sr-badge-ok { opacity: 1; }
			.sr-badge-warning { animation: pulse 2s infinite; }
			.sr-badge-critical, .sr-badge-expired { animation: pulse 1s infinite; }
			.sr-badge-missing, .sr-badge-none { opacity: 0.5; }
			.sr-badge-failed { opacity: 1; }
			@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

			.sr-btn { border: none; background: transparent; cursor: pointer; font-size: 1em; padding: 4px 8px; border-radius: 4px; transition: all 0.15s; }
			.sr-btn:hover { background: rgba(0,0,0,0.1); }
			.sr-btn-publish { color: #22c55e; }
			.sr-btn-publish:hover { background: rgba(34,197,94,0.15); }
			.sr-btn-unpublish { color: #ef4444; }
			.sr-btn-unpublish:hover { background: rgba(239,68,68,0.15); }
			.sr-btn-qr { color: #0099cc; }
			.sr-btn-qr:hover { background: rgba(0,153,204,0.15); }
			.sr-btn-check { color: #8b5cf6; font-size: 0.9em; }
			.sr-btn-check:hover { background: rgba(139,92,246,0.15); }
			.sr-btn-regen { margin-left: 10px; font-size: 0.85em; }

			.sr-qr-modal { display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; padding: 20px 0; }
			.sr-qr-box { text-align: center; }
			.sr-qr-code { background: #fff; padding: 10px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
			.sr-qr-code svg { display: block; }
			.sr-qr-label { margin-top: 10px; font-weight: 600; font-size: 0.9em; }
			.sr-qr-url { margin-top: 5px; font-size: 0.75em; color: #666; max-width: 180px; word-break: break-all; }

			.sr-footer { margin-top: 20px; padding: 12px 15px; background: #f8f8f8; border-radius: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
			@media (prefers-color-scheme: dark) { .sr-footer { background: #1a1a2e; } }
			.sr-muted { color: #888; }

			.sr-publish-form { min-width: 300px; }
			.sr-form-row { margin-bottom: 12px; }
			.sr-form-row label { display: block; margin-bottom: 5px; }
			.sr-form-row input[type="text"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }

			@media (max-width: 768px) {
				.sr-row { flex-wrap: wrap; }
				.sr-col-url { flex-basis: 100%; order: 10; margin-top: 5px; }
				.sr-wizard-form { flex-direction: column; }
				.sr-wizard-input { width: 100%; }
			}
		`;
	}
});
