'use strict';
'require view';
'require dom';
'require ui';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.routes-status',
	method: 'status',
	expect: { }
});

var callSyncRoutes = rpc.declare({
	object: 'luci.routes-status',
	method: 'sync_routes',
	expect: { }
});

var callAddRoute = rpc.declare({
	object: 'luci.routes-status',
	method: 'add_route',
	params: ['domain', 'port'],
	expect: { }
});

return view.extend({
	load: function() {
		return callStatus();
	},

	renderStatusBadge: function(running, label) {
		var color = running ? '#4CAF50' : '#f44336';
		return E('span', {
			'style': 'display:inline-block;padding:4px 12px;margin:4px;border-radius:4px;color:#fff;background:' + color + ';font-size:0.9em;font-weight:500;'
		}, label + ': ' + (running ? 'Running' : 'Stopped'));
	},

	renderRouteBadge: function(hasRoute, type) {
		if (hasRoute) {
			return E('span', {
				'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;color:#fff;background:#4CAF50;font-size:0.8em;'
			}, type);
		} else {
			return E('span', {
				'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;color:#fff;background:#ff9800;font-size:0.8em;'
			}, type + ' (missing)');
		}
	},

	renderSslBadge: function(status) {
		var color, text;
		if (status === 'missing') {
			color = '#9e9e9e';
			text = 'No SSL';
		} else if (status === 'expired') {
			color = '#f44336';
			text = 'Expired';
		} else if (status && status.indexOf('expiring:') === 0) {
			var days = status.split(':')[1];
			color = '#ff9800';
			text = 'Expires in ' + days + 'd';
		} else if (status && status.indexOf('valid:') === 0) {
			var days = status.split(':')[1];
			color = '#4CAF50';
			text = 'Valid (' + days + 'd)';
		} else {
			color = '#4CAF50';
			text = 'Valid';
		}

		return E('span', {
			'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;color:#fff;background:' + color + ';font-size:0.8em;'
		}, text);
	},

	renderWafBadge: function(bypass) {
		if (bypass) {
			return E('span', {
				'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;color:#fff;background:#f44336;font-size:0.8em;'
			}, 'WAF Bypass');
		} else {
			return E('span', {
				'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;color:#fff;background:#2196F3;font-size:0.8em;'
			}, 'WAF Protected');
		}
	},

	handleSync: function() {
		var self = this;

		ui.showModal(_('Syncing Routes...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		callSyncRoutes().then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', {}, _('Routes synchronized successfully')), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, _('Error: ') + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleAddRoute: function(domain, port) {
		var self = this;

		if (!port) {
			// Ask for port
			ui.showModal(_('Add Route'), [
				E('div', { 'class': 'cbi-section' }, [
					E('p', {}, _('Add mitmproxy route for: %s').format(domain)),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Backend Port')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('input', { 'type': 'number', 'id': 'route-port', 'value': '443', 'style': 'width:100px;' })
						])
					])
				]),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
					E('button', {
						'class': 'btn cbi-button-positive',
						'click': function() {
							var port = parseInt(document.getElementById('route-port').value, 10);
							if (port > 0) {
								ui.hideModal();
								self.doAddRoute(domain, port);
							}
						},
						'style': 'margin-left:10px;'
					}, _('Add Route'))
				])
			]);
		} else {
			this.doAddRoute(domain, parseInt(port, 10));
		}
	},

	doAddRoute: function(domain, port) {
		ui.showModal(_('Adding Route...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		callAddRoute(domain, port).then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', {}, _('Route added successfully')), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, _('Error: ') + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	renderVhostRow: function(vhost) {
		var self = this;
		var missingRoutes = !vhost.has_route_out || !vhost.has_route_in;

		return E('tr', { 'class': vhost.active ? '' : 'inactive' }, [
			E('td', {}, [
				E('a', {
					'href': 'https://' + vhost.domain,
					'target': '_blank',
					'style': 'color:#1976D2;text-decoration:none;'
				}, vhost.domain)
			]),
			E('td', {}, vhost.backend || '-'),
			E('td', { 'style': 'text-align:center;' }, vhost.backend_port || '-'),
			E('td', {}, [
				this.renderRouteBadge(vhost.has_route_out, 'OUT'),
				this.renderRouteBadge(vhost.has_route_in, 'IN')
			]),
			E('td', {}, this.renderSslBadge(vhost.ssl_status)),
			E('td', {}, this.renderWafBadge(vhost.waf_bypass)),
			E('td', {}, [
				vhost.active ?
					E('span', { 'style': 'color:#4CAF50;font-weight:bold;' }, 'Active') :
					E('span', { 'style': 'color:#9e9e9e;' }, 'Inactive'),
				missingRoutes ? E('button', {
					'class': 'btn cbi-button',
					'click': function() { self.handleAddRoute(vhost.domain, vhost.backend_port); },
					'style': 'margin-left:10px;font-size:0.8em;padding:2px 8px;'
				}, _('Add Route')) : null
			])
		]);
	},

	render: function(data) {
		var self = this;
		var vhosts = data.vhosts || [];

		// Sort by domain
		vhosts.sort(function(a, b) {
			return a.domain.localeCompare(b.domain);
		});

		// Count stats
		var totalVhosts = vhosts.length;
		var activeVhosts = vhosts.filter(function(v) { return v.active; }).length;
		var missingRoutes = vhosts.filter(function(v) { return !v.has_route_out || !v.has_route_in; }).length;
		var wafBypassed = vhosts.filter(function(v) { return v.waf_bypass; }).length;

		var content = [];

		// Header
		content.push(E('h2', {}, _('Routes Status Dashboard')));

		// Service Status
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Service Status')),
			E('div', { 'style': 'margin:10px 0;' }, [
				this.renderStatusBadge(data.haproxy_running, 'HAProxy'),
				this.renderStatusBadge(data.mitmproxy_running, 'mitmproxy')
			]),
			E('p', { 'style': 'color:#666;' }, _('Host IP: %s').format(data.host_ip || '192.168.255.1'))
		]));

		// Statistics
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Statistics')),
			E('div', { 'style': 'display:flex;gap:30px;margin:15px 0;' }, [
				E('div', { 'style': 'text-align:center;' }, [
					E('div', { 'style': 'font-size:2em;font-weight:bold;color:#1976D2;' }, String(totalVhosts)),
					E('div', { 'style': 'color:#666;' }, _('Total Vhosts'))
				]),
				E('div', { 'style': 'text-align:center;' }, [
					E('div', { 'style': 'font-size:2em;font-weight:bold;color:#4CAF50;' }, String(activeVhosts)),
					E('div', { 'style': 'color:#666;' }, _('Active'))
				]),
				E('div', { 'style': 'text-align:center;' }, [
					E('div', { 'style': 'font-size:2em;font-weight:bold;color:' + (missingRoutes > 0 ? '#ff9800' : '#4CAF50') + ';' }, String(missingRoutes)),
					E('div', { 'style': 'color:#666;' }, _('Missing Routes'))
				]),
				E('div', { 'style': 'text-align:center;' }, [
					E('div', { 'style': 'font-size:2em;font-weight:bold;color:' + (wafBypassed > 0 ? '#f44336' : '#4CAF50') + ';' }, String(wafBypassed)),
					E('div', { 'style': 'color:#666;' }, _('WAF Bypassed'))
				])
			])
		]));

		// Vhosts Table
		var vhostRows = vhosts.map(function(v) { return self.renderVhostRow(v); });

		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Virtual Hosts')),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin-bottom:15px;' }, [
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.handleSync(); }
				}, _('Sync Routes from HAProxy'))
			]),
			vhosts.length > 0 ?
				E('table', { 'class': 'table cbi-section-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Domain')),
						E('th', { 'class': 'th' }, _('Backend')),
						E('th', { 'class': 'th', 'style': 'text-align:center;' }, _('Port')),
						E('th', { 'class': 'th' }, _('Routes')),
						E('th', { 'class': 'th' }, _('SSL')),
						E('th', { 'class': 'th' }, _('WAF')),
						E('th', { 'class': 'th' }, _('Status'))
					])
				].concat(vhostRows)) :
				E('p', { 'style': 'color:#666;' }, _('No virtual hosts configured.'))
		]));

		return E('div', { 'class': 'cbi-map' }, content);
	}
});
