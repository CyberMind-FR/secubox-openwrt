'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

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

// Category icons and colors
var categoryConfig = {
	streaming: { icon: '🎬', color: '#e74c3c', label: 'Streaming' },
	conferencing: { icon: '📹', color: '#3498db', label: 'Conferencing' },
	apps: { icon: '📊', color: '#9b59b6', label: 'Apps' },
	display: { icon: '🪞', color: '#1abc9c', label: 'Display' },
	social: { icon: '🦣', color: '#e67e22', label: 'Social' },
	monitoring: { icon: '📡', color: '#2ecc71', label: 'Monitoring' }
};

// Status colors and icons
var statusConfig = {
	running: { color: '#27ae60', icon: '●', label: 'Running' },
	stopped: { color: '#e74c3c', icon: '○', label: 'Stopped' },
	not_installed: { color: '#95a5a6', icon: '◌', label: 'Not Installed' },
	unknown: { color: '#f39c12', icon: '?', label: 'Unknown' }
};

return view.extend({
	load: function() {
		return Promise.all([
			callMediaHubStatus(),
			callMediaHubServices()
		]);
	},

	renderStatusBar: function(status) {
		var total = status.total_services || 0;
		var installed = status.installed || 0;
		var running = status.running || 0;
		var stopped = status.stopped || 0;

		return E('div', { 'class': 'media-hub-status-bar' }, [
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #3498db' }, String(total)),
				E('span', { 'class': 'status-label' }, 'Total')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #9b59b6' }, String(installed)),
				E('span', { 'class': 'status-label' }, 'Installed')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #27ae60' }, String(running)),
				E('span', { 'class': 'status-label' }, 'Running')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #e74c3c' }, String(stopped)),
				E('span', { 'class': 'status-label' }, 'Stopped')
			])
		]);
	},

	renderServiceCard: function(service) {
		var self = this;
		var statusCfg = statusConfig[service.status] || statusConfig.unknown;
		var categoryCfg = categoryConfig[service.category] || { icon: '📦', color: '#7f8c8d', label: 'Other' };

		var controls = [];

		if (service.installed) {
			if (service.status === 'running') {
				controls.push(
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'style': 'margin-right: 5px; padding: 4px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(this, function() {
							return callServiceStop(service.id).then(function() {
								window.location.reload();
							});
						})
					}, '⏹ Stop'),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'padding: 4px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(this, function() {
							return callServiceRestart(service.id).then(function() {
								window.location.reload();
							});
						})
					}, '🔄 Restart')
				);
			} else if (service.status === 'stopped') {
				controls.push(
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'style': 'padding: 4px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(this, function() {
							return callServiceStart(service.id).then(function() {
								window.location.reload();
							});
						})
					}, '▶ Start')
				);
			}
		}

		// Add settings link
		if (service.url) {
			controls.push(
				E('a', {
					'href': service.url,
					'class': 'cbi-button cbi-button-neutral',
					'style': 'margin-left: 5px; padding: 4px 12px; font-size: 12px; text-decoration: none;'
				}, '⚙ Settings')
			);
		}

		return E('div', {
			'class': 'media-service-card',
			'data-status': service.status,
			'style': 'border-left: 4px solid ' + categoryCfg.color + ';'
		}, [
			E('div', { 'class': 'card-header' }, [
				E('span', { 'class': 'service-emoji' }, service.emoji || '📦'),
				E('div', { 'class': 'service-info' }, [
					E('span', { 'class': 'service-name' }, service.name),
					E('span', { 'class': 'service-category', 'style': 'color: ' + categoryCfg.color }, categoryCfg.label)
				]),
				E('span', {
					'class': 'service-status',
					'style': 'color: ' + statusCfg.color,
					'title': statusCfg.label
				}, statusCfg.icon + ' ' + statusCfg.label)
			]),
			E('div', { 'class': 'card-body' }, [
				E('p', { 'class': 'service-description' }, service.description),
				service.port > 0 ? E('p', { 'class': 'service-port' }, 'Port: ' + service.port) : E('span')
			]),
			E('div', { 'class': 'card-footer' }, controls)
		]);
	},

	renderCategorySection: function(category, services) {
		var categoryCfg = categoryConfig[category] || { icon: '📦', color: '#7f8c8d', label: category };
		var categoryServices = services.filter(function(s) { return s.category === category; });

		if (categoryServices.length === 0) return E('span');

		var self = this;
		return E('div', { 'class': 'media-category-section' }, [
			E('h3', { 'class': 'category-title', 'style': 'color: ' + categoryCfg.color }, [
				E('span', { 'class': 'category-icon' }, categoryCfg.icon),
				' ',
				categoryCfg.label,
				E('span', { 'class': 'category-count' }, ' (' + categoryServices.length + ')')
			]),
			E('div', { 'class': 'media-cards-grid' },
				categoryServices.map(function(service) {
					return self.renderServiceCard(service);
				})
			)
		]);
	},

	render: function(data) {
		var status = data[0];
		var services = data[1];

		// Sort by category then by name
		services.sort(function(a, b) {
			if (a.category !== b.category) {
				return a.category.localeCompare(b.category);
			}
			return a.name.localeCompare(b.name);
		});

		// Get unique categories in order
		var categories = ['streaming', 'conferencing', 'apps', 'display', 'social', 'monitoring'];

		var self = this;
		var view = E('div', { 'class': 'media-hub-dashboard' }, [
			E('style', {}, `
				.media-hub-dashboard {
					padding: 20px;
				}
				.media-hub-header {
					text-align: center;
					margin-bottom: 30px;
				}
				.media-hub-header h2 {
					font-size: 2em;
					margin-bottom: 10px;
				}
				.media-hub-header .subtitle {
					color: #666;
					font-size: 1.1em;
				}
				.media-hub-status-bar {
					display: flex;
					justify-content: center;
					gap: 40px;
					padding: 20px;
					background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
					border-radius: 12px;
					margin-bottom: 30px;
				}
				.status-item {
					text-align: center;
				}
				.status-value {
					display: block;
					font-size: 2.5em;
					font-weight: bold;
				}
				.status-label {
					color: #aaa;
					font-size: 0.9em;
					text-transform: uppercase;
				}
				.media-category-section {
					margin-bottom: 30px;
				}
				.category-title {
					font-size: 1.4em;
					margin-bottom: 15px;
					padding-bottom: 10px;
					border-bottom: 2px solid #333;
				}
				.category-icon {
					font-size: 1.2em;
				}
				.category-count {
					font-weight: normal;
					font-size: 0.8em;
					color: #666;
				}
				.media-cards-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
					gap: 20px;
				}
				.media-service-card {
					background: #1a1a2e;
					border-radius: 12px;
					padding: 20px;
					transition: transform 0.2s, box-shadow 0.2s;
				}
				.media-service-card:hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 25px rgba(0,0,0,0.3);
				}
				.media-service-card[data-status="running"] {
					background: linear-gradient(135deg, #1a2e1a 0%, #162e16 100%);
				}
				.media-service-card[data-status="stopped"] {
					background: linear-gradient(135deg, #2e1a1a 0%, #2e1616 100%);
				}
				.media-service-card[data-status="not_installed"] {
					opacity: 0.7;
				}
				.card-header {
					display: flex;
					align-items: center;
					margin-bottom: 15px;
				}
				.service-emoji {
					font-size: 2.5em;
					margin-right: 15px;
				}
				.service-info {
					flex: 1;
				}
				.service-name {
					display: block;
					font-size: 1.3em;
					font-weight: bold;
					color: #fff;
				}
				.service-category {
					font-size: 0.85em;
					text-transform: uppercase;
				}
				.service-status {
					font-size: 0.9em;
					font-weight: bold;
				}
				.card-body {
					margin-bottom: 15px;
				}
				.service-description {
					color: #aaa;
					font-size: 0.95em;
					margin-bottom: 8px;
				}
				.service-port {
					color: #666;
					font-size: 0.85em;
					font-family: monospace;
				}
				.card-footer {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
				}
				.card-footer button, .card-footer a {
					border-radius: 6px;
				}
				@media (max-width: 768px) {
					.media-hub-status-bar {
						flex-wrap: wrap;
						gap: 20px;
					}
					.media-cards-grid {
						grid-template-columns: 1fr;
					}
				}
			`),
			E('div', { 'class': 'media-hub-header' }, [
				E('h2', {}, '🎬 Media Services Hub'),
				E('p', { 'class': 'subtitle' }, 'Unified dashboard for all SecuBox media services')
			]),
			this.renderStatusBar(status)
		]);

		categories.forEach(function(category) {
			var section = self.renderCategorySection(category, services);
			if (section.tagName !== 'SPAN') {
				view.appendChild(section);
			}
		});

		// Setup polling for status updates
		poll.add(L.bind(function() {
			return callMediaHubServices().then(L.bind(function(services) {
				// Update status indicators without full reload
				services.forEach(function(service) {
					var card = document.querySelector('.media-service-card[data-status]');
					// Could update individual cards here for smooth updates
				});
			}, this));
		}, this), 30);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
