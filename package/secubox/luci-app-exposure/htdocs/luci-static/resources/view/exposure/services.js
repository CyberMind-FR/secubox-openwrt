'use strict';
'require view';
'require dom';
'require ui';
'require exposure/api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.scan(),
			api.torList(),
			api.sslList(),
			api.vhostList()
		]);
	},

	render: function(data) {
		var scanResult = data[0] || {};
		var torResult = data[1] || {};
		var sslResult = data[2] || {};
		var vhostResult = data[3] || {};

		var services = scanResult.services || [];
		var torServices = torResult.services || [];
		var sslBackends = sslResult.backends || [];
		var haproxyVhosts = vhostResult.haproxy || [];
		var uhttpdVhosts = vhostResult.uhttpd || [];
		var self = this;

		// Build tor lookup by port (with name fallback)
		var torByPort = {};
		torServices.forEach(function(t) {
			var port = self.parseBackendPort(t.backend);
			if (port) torByPort[port] = t;
		});
		var torByName = {};
		torServices.forEach(function(t) { torByName[t.service] = t; });

		// Build ssl lookup by port (with name fallback)
		var sslByPort = {};
		sslBackends.forEach(function(s) {
			var port = self.parseBackendPort(s.backend);
			if (port) sslByPort[port] = s;
		});
		var sslByName = {};
		sslBackends.forEach(function(s) { sslByName[s.service] = s; });

		// Build uhttpd name lookup by port
		var uhttpdByPort = {};
		uhttpdVhosts.forEach(function(u) {
			if (u.port) uhttpdByPort[u.port] = u;
		});

		// Build HAProxy domains lookup by backend_port (multiple domains per port)
		var domainsByPort = {};
		haproxyVhosts.forEach(function(v) {
			if (!v.enabled || !v.backend_port || !v.domain) return;
			if (!domainsByPort[v.backend_port]) domainsByPort[v.backend_port] = [];
			domainsByPort[v.backend_port].push(v);
		});

		// Inject CSS
		if (!document.querySelector('link[href*="exposure/dashboard.css"]')) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = L.resource('exposure/dashboard.css');
			document.head.appendChild(link);
		}

		var torCount = torServices.length;
		var sslCount = sslBackends.length;
		var domainCount = haproxyVhosts.filter(function(v) { return v.enabled; }).length;

		// Sort: services with DNS domains first (alphabetically), then by port
		services.sort(function(a, b) {
			var aDomains = domainsByPort[a.port] || [];
			var bDomains = domainsByPort[b.port] || [];
			var aHas = aDomains.length > 0;
			var bHas = bDomains.length > 0;
			if (aHas && !bHas) return -1;
			if (!aHas && bHas) return 1;
			if (aHas && bHas) {
				var aName = aDomains[0].domain.toLowerCase();
				var bName = bDomains[0].domain.toLowerCase();
				if (aName < bName) return -1;
				if (aName > bName) return 1;
			}
			return a.port - b.port;
		});

		var rows = services.map(function(svc) {
			var torInfo = torByPort[svc.port] || torByName[svc.name] || torByName[svc.process] || null;
			var sslInfo = sslByPort[svc.port] || sslByName[svc.name] || sslByName[svc.process] || null;
			var uhttpdInfo = uhttpdByPort[svc.port] || null;
			var domains = domainsByPort[svc.port] || [];
			var isExternal = svc.external;

			// Display name comes from enriched scan; show process as subtitle
			var displayName = svc.name || svc.process;
			var subName = (svc.name && svc.name !== svc.process) ? svc.process : null;

			// Exposure info fragments
			var infoItems = [];
			if (torInfo && torInfo.onion) {
				var onion = torInfo.onion;
				infoItems.push(E('span', { 'class': 'exp-badge exp-badge-tor', 'title': onion },
					onion.substring(0, 16) + '...'));
			}
			domains.forEach(function(v) {
				infoItems.push(E('span', {
					'class': 'exp-badge exp-badge-ssl',
					'title': v.domain + (v.acme ? ' (ACME)' : '')
				}, v.domain));
			});
			if (infoItems.length === 0 && sslInfo && sslInfo.domain) {
				infoItems.push(E('span', { 'class': 'exp-badge exp-badge-ssl' }, sslInfo.domain));
			}

			return E('tr', { 'class': isExternal ? '' : 'exp-row-internal' }, [
				E('td', { 'class': 'exp-mono' }, String(svc.port)),
				E('td', {}, [
					E('strong', {}, displayName),
					subName ? E('span', { 'class': 'exp-text-muted exp-small' }, ' (' + subName + ')') : null
				]),
				E('td', { 'class': 'exp-mono exp-text-muted' },
					svc.address.replace(/^.*:/, '').length < 4 ? svc.address : (isExternal ? '0.0.0.0' : '127.0.0.1')),
				// Tor toggle
				E('td', { 'style': 'text-align: center;' },
					isExternal ? self.makeToggle(!!torInfo, 'tor-slider',
						ui.createHandlerFn(self, 'handleTorToggle', svc, torInfo)
					) : E('span', { 'class': 'exp-text-muted' }, '-')
				),
				// SSL toggle
				E('td', { 'style': 'text-align: center;' },
					isExternal ? self.makeToggle(!!(sslInfo || domains.length > 0), 'ssl-slider',
						ui.createHandlerFn(self, 'handleSslToggle', svc, sslInfo, domains)
					) : E('span', { 'class': 'exp-text-muted' }, '-')
				),
				// Exposure info
				E('td', {}, infoItems.length > 0 ? infoItems :
					(isExternal ? E('span', { 'class': 'exp-text-muted' }, 'Not exposed') : E('span', { 'class': 'exp-text-muted' }, 'Local only')))
			]);
		});

		return E('div', { 'class': 'exposure-dashboard' }, [
			E('div', { 'class': 'exp-page-header' }, [
				E('h2', { 'style': 'margin: 0; color: var(--exp-text-primary);' }, 'Service Exposure'),
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
					E('span', { 'class': 'exp-badge exp-badge-tor' }, torCount + ' Tor'),
					E('span', { 'class': 'exp-badge exp-badge-ssl' }, domainCount + ' Domains'),
					E('button', {
						'class': 'exp-btn exp-btn-secondary',
						'click': function() { window.location.reload(); }
					}, 'Refresh')
				])
			]),

			services.length > 0 ?
				E('table', { 'class': 'exp-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', { 'style': 'width: 70px;' }, 'Port'),
							E('th', {}, 'Service'),
							E('th', { 'style': 'width: 100px;' }, 'Bind'),
							E('th', { 'style': 'width: 70px; text-align: center;' }, 'Tor'),
							E('th', { 'style': 'width: 70px; text-align: center;' }, 'SSL'),
							E('th', {}, 'Exposure')
						])
					]),
					E('tbody', {}, rows)
				]) :
				E('p', { 'class': 'exp-text-muted', 'style': 'text-align: center; padding: 2rem;' },
					'No listening services detected.')
		]);
	},

	makeToggle: function(checked, sliderClass, handler) {
		var cb = E('input', { 'type': 'checkbox', 'change': handler });
		cb.checked = checked;
		return E('label', { 'class': 'toggle-switch' }, [
			cb,
			E('span', { 'class': 'toggle-slider ' + sliderClass })
		]);
	},

	parseBackendPort: function(backend) {
		if (!backend) return null;
		var m = backend.match(/:(\d+)$/);
		return m ? parseInt(m[1]) : null;
	},

	handleTorToggle: function(svc, torInfo, ev) {
		var self = this;
		var cb = ev.target;

		if (cb.checked && !torInfo) {
			var serviceName = (svc.name || svc.process).toLowerCase().replace(/[^a-z0-9]/g, '');

			ui.showModal('Enable Tor Hidden Service', [
				E('p', {}, 'Create .onion address for ' + (svc.name || svc.process) + ' (port ' + svc.port + ')'),
				E('div', { 'style': 'margin: 1rem 0;' }, [
					E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Service Name'),
					E('input', {
						'type': 'text', 'id': 'tor-name', 'value': serviceName,
						'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px; margin-bottom: 12px;'
					}),
					E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Onion Port'),
					E('input', {
						'type': 'number', 'id': 'tor-onion-port', 'value': '80',
						'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
					})
				]),
				E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px;' }, [
					E('button', { 'class': 'btn', 'click': function() { cb.checked = false; ui.hideModal(); } }, 'Cancel'),
					E('button', { 'class': 'btn cbi-button-action', 'click': function() {
						var name = document.getElementById('tor-name').value;
						var onionPort = parseInt(document.getElementById('tor-onion-port').value) || 80;
						ui.hideModal();
						ui.showModal('Creating...', [E('p', { 'class': 'spinning' }, 'Creating Tor hidden service...')]);
						api.torAdd(name, svc.port, onionPort).then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Tor hidden service created' + (res.onion ? ': ' + res.onion : '')), 'info');
								window.location.reload();
							} else {
								cb.checked = false;
								ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
							}
						}).catch(function() { cb.checked = false; ui.hideModal(); });
					}}, 'Enable')
				])
			]);
		} else if (!cb.checked && torInfo) {
			ui.showModal('Disable Tor', [
				E('p', {}, 'Remove hidden service for ' + torInfo.service + '?'),
				E('p', { 'style': 'color: #e74c3c;' }, 'The .onion address will be permanently deleted.'),
				E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
					E('button', { 'class': 'btn', 'click': function() { cb.checked = true; ui.hideModal(); } }, 'Cancel'),
					E('button', { 'class': 'btn cbi-button-negative', 'click': function() {
						ui.hideModal();
						api.torRemove(torInfo.service).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Tor hidden service removed'), 'info');
								window.location.reload();
							} else {
								cb.checked = true;
								ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
							}
						}).catch(function() { cb.checked = true; });
					}}, 'Remove')
				])
			]);
		}
	},

	handleSslToggle: function(svc, sslInfo, domains, ev) {
		var self = this;
		var cb = ev.target;

		if (cb.checked && !sslInfo && (!domains || domains.length === 0)) {
			var serviceName = (svc.name || svc.process).toLowerCase().replace(/[^a-z0-9]/g, '');

			ui.showModal('Enable SSL Backend', [
				E('p', {}, 'Configure HTTPS reverse proxy for ' + (svc.name || svc.process) + ' (port ' + svc.port + ')'),
				E('div', { 'style': 'margin: 1rem 0;' }, [
					E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Service Name'),
					E('input', {
						'type': 'text', 'id': 'ssl-name', 'value': serviceName,
						'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px; margin-bottom: 12px;'
					}),
					E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Domain (FQDN)'),
					E('input', {
						'type': 'text', 'id': 'ssl-domain', 'placeholder': serviceName + '.example.com',
						'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
					})
				]),
				E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px;' }, [
					E('button', { 'class': 'btn', 'click': function() { cb.checked = false; ui.hideModal(); } }, 'Cancel'),
					E('button', { 'class': 'btn cbi-button-action', 'click': function() {
						var name = document.getElementById('ssl-name').value;
						var domain = document.getElementById('ssl-domain').value;
						if (!domain) {
							ui.addNotification(null, E('p', {}, 'Domain is required'), 'warning');
							return;
						}
						ui.hideModal();
						ui.showModal('Configuring...', [E('p', { 'class': 'spinning' }, 'Setting up SSL backend...')]);
						api.sslAdd(name, domain, svc.port).then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'SSL backend configured for ' + domain), 'info');
								window.location.reload();
							} else {
								cb.checked = false;
								ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
							}
						}).catch(function() { cb.checked = false; ui.hideModal(); });
					}}, 'Enable')
				])
			]);
		} else if (!cb.checked && (sslInfo || (domains && domains.length > 0))) {
			var backendName = sslInfo ? sslInfo.service : domains[0].backend;
			var domainName = (sslInfo && sslInfo.domain) ? sslInfo.domain : (domains && domains.length > 0 ? domains[0].domain : '');
			ui.showModal('Disable SSL Backend', [
				E('p', {}, 'Remove HAProxy backend for ' + backendName + '?'),
				domainName ? E('p', { 'style': 'color: #8892b0;' }, 'Domain: ' + domainName) : null,
				E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
					E('button', { 'class': 'btn', 'click': function() { cb.checked = true; ui.hideModal(); } }, 'Cancel'),
					E('button', { 'class': 'btn cbi-button-negative', 'click': function() {
						ui.hideModal();
						api.sslRemove(backendName).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'SSL backend removed'), 'info');
								window.location.reload();
							} else {
								cb.checked = true;
								ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
							}
						}).catch(function() { cb.checked = true; });
					}}, 'Remove')
				])
			]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
