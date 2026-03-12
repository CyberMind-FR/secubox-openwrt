'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callMediaHubStatus = rpc.declare({
	object: 'luci.media-hub',
	method: 'status',
	expect: { '': {} }
});

var callMediaHubServices = rpc.declare({
	object: 'luci.media-hub',
	method: 'services',
	expect: { services: [] }
});

var callServiceStart = rpc.declare({
	object: 'luci.media-hub',
	method: 'service_start',
	params: ['id']
});

var callServiceStop = rpc.declare({
	object: 'luci.media-hub',
	method: 'service_stop',
	params: ['id']
});

var callServiceRestart = rpc.declare({
	object: 'luci.media-hub',
	method: 'service_restart',
	params: ['id']
});

return view.extend({
	load: function() {
		return Promise.all([
			callMediaHubStatus(),
			callMediaHubServices()
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Dashboard', path: 'admin/services/media-hub/dashboard' },
			{ name: 'Settings', path: 'admin/services/media-hub/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var total = status.total_services || 0;
		var installed = status.installed || 0;
		var running = status.running || 0;
		var stopped = status.stopped || 0;

		return [
			KissTheme.stat(total, 'Total', c.blue),
			KissTheme.stat(installed, 'Installed', c.purple),
			KissTheme.stat(running, 'Running', c.green),
			KissTheme.stat(stopped, 'Stopped', c.red)
		];
	},

	renderServiceCard: function(service) {
		var self = this;
		var c = KissTheme.colors;

		var categoryColors = {
			streaming: c.red,
			conferencing: c.blue,
			apps: c.purple,
			display: c.cyan,
			social: c.orange,
			monitoring: c.green
		};

		var statusColor = service.status === 'running' ? c.green :
			service.status === 'stopped' ? c.red : c.muted;

		var catColor = categoryColors[service.category] || c.muted;

		var controls = [];
		if (service.installed) {
			if (service.status === 'running') {
				controls.push(
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': ui.createHandlerFn(this, function() {
							return callServiceStop(service.id).then(function() {
								window.location.reload();
							});
						})
					}, 'Stop'),
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': ui.createHandlerFn(this, function() {
							return callServiceRestart(service.id).then(function() {
								window.location.reload();
							});
						})
					}, 'Restart')
				);
			} else if (service.status === 'stopped') {
				controls.push(
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': ui.createHandlerFn(this, function() {
							return callServiceStart(service.id).then(function() {
								window.location.reload();
							});
						})
					}, 'Start')
				);
			}
		}

		if (service.url) {
			controls.push(
				E('a', {
					'href': service.url,
					'class': 'kiss-btn',
					'style': 'padding: 4px 10px; font-size: 11px; text-decoration: none;'
				}, 'Settings')
			);
		}

		var statusBg = service.status === 'running' ? 'rgba(0,200,83,0.1)' :
			service.status === 'stopped' ? 'rgba(255,23,68,0.1)' : 'rgba(128,128,128,0.1)';

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' + catColor + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px;' }, [
				E('span', { 'style': 'font-size: 2em;' }, service.emoji || ''),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 600; font-size: 14px;' }, service.name),
					E('div', { 'style': 'font-size: 11px; color: ' + catColor + '; text-transform: uppercase;' },
						service.category || 'Other')
				]),
				KissTheme.badge(service.status === 'running' ? 'RUNNING' :
					service.status === 'stopped' ? 'STOPPED' : 'N/A',
					service.status === 'running' ? 'green' : service.status === 'stopped' ? 'red' : 'gray')
			]),
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0 0 12px 0;' }, service.description || ''),
			service.port > 0 ? E('div', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-cyan); margin-bottom: 12px;' }, 'Port: ' + service.port) : '',
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, controls)
		]);
	},

	renderCategory: function(category, services, label) {
		var self = this;
		var c = KissTheme.colors;
		var categoryServices = services.filter(function(s) { return s.category === category; });

		if (categoryServices.length === 0) return null;

		var categoryColors = {
			streaming: c.red,
			conferencing: c.blue,
			apps: c.purple,
			display: c.cyan,
			social: c.orange,
			monitoring: c.green
		};

		return E('div', { 'style': 'margin-bottom: 24px;' }, [
			E('h3', { 'style': 'font-size: 16px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--kiss-line); color: ' + (categoryColors[category] || c.muted) + ';' }, [
				label,
				E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-left: 8px;' }, '(' + categoryServices.length + ')')
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;' },
				categoryServices.map(function(service) {
					return self.renderServiceCard(service);
				})
			)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0];
		var services = data[1];
		var c = KissTheme.colors;

		services.sort(function(a, b) {
			if (a.category !== b.category) {
				return a.category.localeCompare(b.category);
			}
			return a.name.localeCompare(b.name);
		});

		var categories = [
			{ id: 'streaming', label: 'Streaming' },
			{ id: 'conferencing', label: 'Conferencing' },
			{ id: 'apps', label: 'Apps' },
			{ id: 'display', label: 'Display' },
			{ id: 'social', label: 'Social' },
			{ id: 'monitoring', label: 'Monitoring' }
		];

		var categorySections = [];
		categories.forEach(function(cat) {
			var section = self.renderCategory(cat.id, services, cat.label);
			if (section) categorySections.push(section);
		});

		var runningCount = status.running || 0;
		var totalCount = status.total_services || 0;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Media Services Hub'),
					KissTheme.badge(runningCount + '/' + totalCount + ' RUNNING', runningCount > 0 ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Unified dashboard for all SecuBox media services')
			]),

			// Navigation
			this.renderNav('dashboard'),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'media-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Service categories
			E('div', {}, categorySections)
		];

		poll.add(L.bind(function() {
			return Promise.all([callMediaHubStatus(), callMediaHubServices()]).then(L.bind(function(res) {
				var statsEl = document.getElementById('media-stats');
				if (statsEl) {
					dom.content(statsEl, this.renderStats(res[0]));
				}
			}, this));
		}, this), 30);

		return KissTheme.wrap(content, 'admin/services/media-hub/dashboard');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
