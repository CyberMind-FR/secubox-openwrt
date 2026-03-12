'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.routes-status',
	method: 'status',
	params: ['offset', 'limit'],
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
	allVhosts: [],
	currentOffset: 0,
	pageSize: 50,
	totalVhosts: 0,
	statusData: null,

	load: function() {
		return callStatus(0, 50);
	},

	// Emoji-based status pill
	pill: function(emoji, label, ok) {
		return E('span', {
			'class': 'vhost-pill' + (ok ? ' ok' : ' warn'),
			'title': label
		}, emoji);
	},

	handleSync: function() {
		ui.showModal(_('Syncing...'), [
			E('p', { 'class': 'spinning' }, _('Syncing routes from HAProxy...'))
		]);

		callSyncRoutes().then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', {}, '✅ ' + _('Routes synchronized')), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, '❌ ' + (res.error || 'Sync failed')), 'error');
			}
		});
	},

	handleAddRoute: function(domain, port) {
		var self = this;

		ui.showModal(_('Add Route'), [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', {}, _('Add mitmproxy route for: ') + domain),
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin: 12px 0;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted); min-width: 80px;' }, _('Port')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'number', 'id': 'route-port', 'value': port || '443', 'style': 'width:80px;' })
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var p = parseInt(document.getElementById('route-port').value, 10);
						if (p > 0) {
							ui.hideModal();
							self.doAddRoute(domain, p);
						}
					},
					'style': 'margin-left:8px;'
				}, _('Add'))
			])
		]);
	},

	doAddRoute: function(domain, port) {
		ui.showModal(_('Adding...'), [
			E('p', { 'class': 'spinning' }, _('Adding route...'))
		]);

		callAddRoute(domain, port).then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', {}, '✅ ' + _('Route added')), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, '❌ ' + (res.error || 'Failed')), 'error');
			}
		});
	},

	handleLoadMore: function() {
		var self = this;
		var btn = document.getElementById('load-more-btn');
		var spinner = document.getElementById('load-spinner');

		if (btn) btn.style.display = 'none';
		if (spinner) spinner.style.display = 'block';

		this.currentOffset += this.pageSize;

		callStatus(this.currentOffset, this.pageSize).then(function(data) {
			if (spinner) spinner.style.display = 'none';

			var newVhosts = data.vhosts || [];
			if (newVhosts.length > 0) {
				self.allVhosts = self.allVhosts.concat(newVhosts);

				var tbody = document.getElementById('vhosts-tbody');
				if (tbody) {
					newVhosts.forEach(function(v) {
						tbody.appendChild(self.renderRow(v));
					});
				}

				var counter = document.getElementById('vhosts-count');
				if (counter) {
					counter.textContent = self.allVhosts.length + '/' + self.totalVhosts;
				}
			}

			if (self.allVhosts.length < self.totalVhosts && btn) {
				btn.style.display = 'inline-block';
			}
		});
	},

	renderRow: function(v) {
		var self = this;
		var needsRoute = !v.has_route_out || !v.has_route_in;

		return E('tr', { 'class': 'vhost-row' }, [
			// Domain
			E('td', {}, [
				E('a', {
					'href': 'https://' + v.domain,
					'target': '_blank',
					'class': 'vhost-domain'
				}, v.domain)
			]),
			// Status indicators (emoji-based)
			E('td', { 'class': 'vhost-status' }, [
				// Routes
				this.pill(v.has_route_out && v.has_route_in ? '🔗' : '⚠️',
					'Routes: ' + (v.has_route_out ? 'OUT✓' : 'OUT✗') + ' ' + (v.has_route_in ? 'IN✓' : 'IN✗'),
					v.has_route_out && v.has_route_in),
				// SSL
				this.pill(v.ssl_status === 'valid' ? '🔒' : v.ssl_status === 'expiring' ? '⏰' : '🔓',
					'SSL: ' + v.ssl_status,
					v.ssl_status === 'valid'),
				// WAF
				this.pill(v.waf_bypass ? '🚫' : '🛡️',
					v.waf_bypass ? 'WAF Bypass' : 'WAF Active',
					!v.waf_bypass),
				// Active
				this.pill(v.active ? '✅' : '⏸️',
					v.active ? 'Active' : 'Inactive',
					v.active)
			]),
			// Action
			E('td', {}, [
				needsRoute ? E('button', {
					'class': 'btn btn-sm',
					'click': function() { self.handleAddRoute(v.domain, v.backend_port || 443); }
				}, '➕') : null
			])
		]);
	},

	render: function(data) {
		var self = this;
		var vhosts = data.vhosts || [];
		this.allVhosts = vhosts;
		this.totalVhosts = data.total || vhosts.length;
		this.currentOffset = data.offset || 0;
		this.statusData = data;

		// Quick stats from first page
		var stats = {
			active: vhosts.filter(function(v) { return v.active; }).length,
			missing: vhosts.filter(function(v) { return !v.has_route_out || !v.has_route_in; }).length,
			bypass: vhosts.filter(function(v) { return v.waf_bypass; }).length,
			ssl: vhosts.filter(function(v) { return v.ssl_status === 'valid'; }).length
		};

		var content = E('div', { 'class': 'vhosts-checker' }, [
			// Inline styles for dark theme compatibility
			E('style', {}, [
				'.vhosts-checker { font-family: system-ui, sans-serif; }',
				'.vhosts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }',
				'.vhosts-title { font-size: 1.4em; font-weight: 600; display: flex; align-items: center; gap: 8px; }',
				'.vhosts-stats { display: flex; gap: 16px; font-size: 0.9em; opacity: 0.8; }',
				'.vhosts-stat { display: flex; align-items: center; gap: 4px; }',
				'.services { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }',
				'.service-badge { padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 6px; font-size: 0.85em; background: rgba(255,255,255,0.1); }',
				'.service-badge.ok { background: rgba(76, 175, 80, 0.2); }',
				'.service-badge.err { background: rgba(244, 67, 54, 0.2); }',
				'.vhosts-table { width: 100%; border-collapse: collapse; }',
				'.vhosts-table th { text-align: left; padding: 8px; opacity: 0.7; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }',
				'.vhost-row td { padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }',
				'.vhost-domain { color: #64b5f6; text-decoration: none; }',
				'.vhost-domain:hover { text-decoration: underline; }',
				'.vhost-status { display: flex; gap: 6px; }',
				'.vhost-pill { font-size: 1.1em; cursor: help; opacity: 0.9; }',
				'.vhost-pill.warn { opacity: 0.6; }',
				'.load-more { text-align: center; padding: 16px; }',
				'.btn-sm { padding: 4px 8px; font-size: 0.9em; }'
			].join('\n')),

			// Header
			E('div', { 'class': 'vhosts-header' }, [
				E('div', { 'class': 'vhosts-title' }, [
					'🔀 ', _('VHosts Checker')
				]),
				E('div', { 'class': 'vhosts-stats' }, [
					E('span', { 'class': 'vhosts-stat' }, ['📊 ', this.totalVhosts, ' ', _('total')]),
					E('span', { 'class': 'vhosts-stat' }, ['✅ ', stats.active, '+', ' ', _('active')]),
					stats.missing > 0 ? E('span', { 'class': 'vhosts-stat' }, ['⚠️ ', stats.missing, ' ', _('missing routes')]) : null,
					stats.bypass > 0 ? E('span', { 'class': 'vhosts-stat' }, ['🚫 ', stats.bypass, ' ', _('WAF bypass')]) : null
				])
			]),

			// Service status badges
			E('div', { 'class': 'services' }, [
				E('span', { 'class': 'service-badge' + (data.haproxy_running ? ' ok' : ' err') }, [
					data.haproxy_running ? '✅' : '❌', ' HAProxy'
				]),
				E('span', { 'class': 'service-badge' + (data.mitmproxy_running ? ' ok' : ' err') }, [
					data.mitmproxy_running ? '✅' : '❌', ' mitmproxy'
				]),
				E('span', { 'class': 'service-badge' }, ['🖥️ ', data.host_ip || '192.168.255.1']),
				E('button', {
					'class': 'kiss-btn kiss-btn-cyan',
					'click': function() { self.handleSync(); },
					'style': 'margin-left: auto;'
				}, '🔄 ' + _('Sync'))
			]),

			// Table
			vhosts.length > 0 ?
				E('table', { 'class': 'vhosts-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Domain')),
							E('th', {}, _('Status')),
							E('th', { 'style': 'width: 50px;' }, '')
						])
					]),
					E('tbody', { 'id': 'vhosts-tbody' }, vhosts.map(function(v) { return self.renderRow(v); }))
				]) :
				E('p', { 'style': 'text-align: center; opacity: 0.6; padding: 20px;' }, _('No vhosts found.')),

			// Load more
			this.totalVhosts > vhosts.length ? E('div', { 'class': 'load-more' }, [
				E('button', {
					'id': 'load-more-btn',
					'class': 'kiss-btn',
					'click': function() { self.handleLoadMore(); }
				}, [
					'📥 ', _('Load More'),
					' (',
					E('span', { 'id': 'vhosts-count' }, vhosts.length + '/' + this.totalVhosts),
					')'
				]),
				E('p', { 'id': 'load-spinner', 'class': 'spinning', 'style': 'display: none;' }, _('Loading...'))
			]) : null
		]);

		return KissTheme.wrap([content], 'admin/status/vhosts-checker');
	}
});
