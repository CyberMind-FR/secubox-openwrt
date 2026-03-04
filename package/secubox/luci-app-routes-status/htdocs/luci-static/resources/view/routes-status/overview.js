'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require secubox/kiss-theme';

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

	renderPill: function(text, type) {
		var colors = {
			success: '#4CAF50',
			warning: '#ff9800',
			danger: '#f44336',
			info: '#2196F3',
			muted: '#9e9e9e'
		};
		return E('span', {
			'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:4px;color:#fff;background:' + (colors[type] || colors.muted) + ';font-size:0.8em;font-weight:500;'
		}, text);
	},

	handleSync: function() {
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

		ui.showModal(_('Add Route'), [
			E('div', { 'class': 'cbi-section' }, [
				E('p', {}, _('Add mitmproxy route for: %s').format(domain)),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Backend Port')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'number', 'id': 'route-port', 'value': port || '443', 'style': 'width:100px;' })
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var p = parseInt(document.getElementById('route-port').value, 10);
						if (p > 0) {
							ui.hideModal();
							self.doAddRoute(domain, p);
						}
					},
					'style': 'margin-left:10px;'
				}, _('Add Route'))
			])
		]);
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

		return E('tr', {}, [
			E('td', {}, [
				E('a', {
					'href': 'https://' + vhost.domain,
					'target': '_blank',
					'style': 'color:#1976D2;text-decoration:none;font-weight:500;'
				}, vhost.domain)
			]),
			E('td', {}, vhost.backend || '-'),
			E('td', {}, [
				vhost.has_route_out ? this.renderPill('OUT', 'success') : this.renderPill('OUT', 'warning'),
				vhost.has_route_in ? this.renderPill('IN', 'success') : this.renderPill('IN', 'warning')
			]),
			E('td', {}, [
				vhost.ssl_status === 'valid' ? this.renderPill('SSL', 'success') :
				vhost.ssl_status === 'expiring' ? this.renderPill('Expiring', 'warning') :
				vhost.ssl_status === 'expired' ? this.renderPill('Expired', 'danger') :
				this.renderPill('No SSL', 'muted')
			]),
			E('td', {}, [
				vhost.waf_bypass ? this.renderPill('Bypass', 'danger') : this.renderPill('WAF', 'info')
			]),
			E('td', {}, [
				vhost.active ? this.renderPill('Active', 'success') : this.renderPill('Inactive', 'muted'),
				missingRoutes ? E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.handleAddRoute(vhost.domain, vhost.backend_port); },
					'style': 'margin-left:8px;padding:2px 8px;font-size:0.8em;'
				}, _('+ Route')) : null
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

		// Stats
		var totalVhosts = vhosts.length;
		var activeVhosts = vhosts.filter(function(v) { return v.active; }).length;
		var missingRoutes = vhosts.filter(function(v) { return !v.has_route_out || !v.has_route_in; }).length;
		var wafBypassed = vhosts.filter(function(v) { return v.waf_bypass; }).length;
		var sslValid = vhosts.filter(function(v) { return v.ssl_status === 'valid'; }).length;

		var vhostRows = vhosts.map(function(v) { return self.renderVhostRow(v); });

		var content = E('div', { 'class': 'routes-status-page' }, [
			// KISS Header
			E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
				E('div', {}, [
					E('h2', { 'class': 'sh-page-title' }, [
						E('span', { 'class': 'sh-page-title-icon' }, '🔀'),
						_('Routes Status')
					]),
					E('p', { 'class': 'sh-page-subtitle' },
						_('HAProxy vhosts and mitmproxy route configuration overview.'))
				]),
				E('div', { 'class': 'sh-header-meta' }, [
					this.renderHeaderChip('🌐', _('Vhosts'), totalVhosts),
					this.renderHeaderChip('✅', _('Active'), activeVhosts),
					this.renderHeaderChip('⚠️', _('Missing Routes'), missingRoutes, missingRoutes > 0 ? 'warn' : ''),
					this.renderHeaderChip('🛡️', _('WAF Bypass'), wafBypassed, wafBypassed > 0 ? 'warn' : ''),
					this.renderHeaderChip('🔒', _('SSL Valid'), sslValid)
				])
			]),

			// Service Status Cards
			E('div', { 'class': 'sh-card-grid', 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:20px 0;' }, [
				E('div', { 'class': 'sh-card', 'style': 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);' }, [
					E('div', { 'style': 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' }, [
						E('span', { 'style': 'font-size:1.5em;' }, '⚖️'),
						E('strong', {}, 'HAProxy')
					]),
					data.haproxy_running ?
						this.renderPill('Running', 'success') :
						this.renderPill('Stopped', 'danger')
				]),
				E('div', { 'class': 'sh-card', 'style': 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);' }, [
					E('div', { 'style': 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' }, [
						E('span', { 'style': 'font-size:1.5em;' }, '🔍'),
						E('strong', {}, 'mitmproxy')
					]),
					data.mitmproxy_running ?
						this.renderPill('Running', 'success') :
						this.renderPill('Stopped', 'danger')
				]),
				E('div', { 'class': 'sh-card', 'style': 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);' }, [
					E('div', { 'style': 'display:flex;align-items:center;gap:8px;margin-bottom:8px;' }, [
						E('span', { 'style': 'font-size:1.5em;' }, '🖥️'),
						E('strong', {}, _('Host IP'))
					]),
					E('code', { 'style': 'background:#f5f5f5;padding:4px 8px;border-radius:4px;' }, data.host_ip || '192.168.255.1')
				])
			]),

			// Actions
			E('div', { 'style': 'margin:20px 0;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.handleSync(); },
					'style': 'margin-right:10px;'
				}, '🔄 ' + _('Sync Routes from HAProxy'))
			]),

			// Vhosts Table
			E('div', { 'class': 'sh-card', 'style': 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow-x:auto;' }, [
				E('h3', { 'style': 'margin:0 0 16px 0;' }, '🌐 ' + _('Virtual Hosts (%d)').format(totalVhosts)),
				vhosts.length > 0 ?
					E('table', { 'class': 'table', 'style': 'width:100%;border-collapse:collapse;' }, [
						E('thead', {}, [
							E('tr', { 'style': 'background:#f5f5f5;' }, [
								E('th', { 'style': 'padding:10px;text-align:left;' }, _('Domain')),
								E('th', { 'style': 'padding:10px;text-align:left;' }, _('Backend')),
								E('th', { 'style': 'padding:10px;text-align:left;' }, _('Routes')),
								E('th', { 'style': 'padding:10px;text-align:left;' }, _('SSL')),
								E('th', { 'style': 'padding:10px;text-align:left;' }, _('WAF')),
								E('th', { 'style': 'padding:10px;text-align:left;' }, _('Status'))
							])
						]),
						E('tbody', {}, vhostRows)
					]) :
					E('p', { 'style': 'color:#666;text-align:center;padding:20px;' }, _('No virtual hosts configured.'))
			])
		]);

		return KissTheme.wrap([content], 'admin/status/routes');
	}
});
