'use strict';
'require baseclass';
'require secubox-admin.api as API';
'require poll';

/**
 * SecuBox Widget Renderer
 *
 * Provides a flexible widget system for displaying app-specific metrics
 * and controls in a responsive grid layout with auto-refresh.
 */

var WidgetRenderer = baseclass.extend({
	/**
	 * Initialize widget renderer
	 * @param {Object} options - Configuration options
	 * @param {string} options.containerId - DOM element ID for widget container
	 * @param {Array} options.apps - Apps with widget configurations
	 * @param {number} options.defaultRefreshInterval - Default refresh interval in seconds (default: 30)
	 * @param {string} options.gridMode - Grid layout mode: 'auto', 'fixed-2', 'fixed-3', 'fixed-4' (default: 'auto')
	 */
	__init__: function(options) {
		this.containerId = options.containerId || 'widget-container';
		this.apps = options.apps || [];
		this.defaultRefreshInterval = options.defaultRefreshInterval || 30;
		this.gridMode = options.gridMode || 'auto';
		this.widgets = [];
		this.pollHandles = [];
		this.templates = {};

		// Register built-in templates
		this.registerBuiltInTemplates();
	},

	/**
	 * Register built-in widget templates
	 */
	registerBuiltInTemplates: function() {
		var self = this;

		// Default template - simple metric display
		this.registerTemplate('default', {
			render: function(container, app, data) {
				container.innerHTML = '';
				container.appendChild(E('div', { 'class': 'widget-default' }, [
					E('div', { 'class': 'widget-icon' }, app.icon || '📊'),
					E('div', { 'class': 'widget-title' }, app.name),
					E('div', { 'class': 'widget-status' },
						data.widget_enabled ? 'Widget Enabled' : 'No widget data'
					)
				]));
			}
		});

		// Security widget template
		this.registerTemplate('security', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data.metrics || [];
				var statusClass = data.status === 'ok' ? 'status-success' :
				                 data.status === 'warning' ? 'status-warning' :
				                 data.status === 'error' ? 'status-error' : 'status-unknown';

				container.appendChild(E('div', { 'class': 'widget-security' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '🔒'),
						E('div', { 'class': 'widget-title' }, app.name),
						E('div', { 'class': 'widget-status-indicator ' + statusClass })
					]),
					E('div', { 'class': 'widget-metrics' },
						metrics.map(function(metric) {
							return self.renderMetric(metric);
						})
					),
					data.last_event ? E('div', { 'class': 'widget-last-event' }, [
						E('span', { 'class': 'event-label' }, 'Last Event: '),
						E('span', { 'class': 'event-time' }, self.formatTimestamp(data.last_event))
					]) : null
				]));
			}
		});

		// Network widget template
		this.registerTemplate('network', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data.metrics || [];
				var connections = data.active_connections || 0;
				var bandwidth = data.bandwidth || { up: 0, down: 0 };

				container.appendChild(E('div', { 'class': 'widget-network' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '🌐'),
						E('div', { 'class': 'widget-title' }, app.name)
					]),
					E('div', { 'class': 'widget-metrics' }, [
						E('div', { 'class': 'metric-row' }, [
							E('span', { 'class': 'metric-label' }, 'Connections:'),
							E('span', { 'class': 'metric-value' }, connections.toString())
						]),
						E('div', { 'class': 'metric-row' }, [
							E('span', { 'class': 'metric-label' }, 'Up/Down:'),
							E('span', { 'class': 'metric-value' },
								self.formatBandwidth(bandwidth.up) + ' / ' + self.formatBandwidth(bandwidth.down))
						])
					].concat(metrics.map(function(metric) {
						return self.renderMetric(metric);
					})))
				]));
			}
		});

		// Monitoring widget template
		this.registerTemplate('monitoring', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data.metrics || [];
				var statusClass = data.status === 'healthy' ? 'status-success' :
				                 data.status === 'degraded' ? 'status-warning' :
				                 data.status === 'down' ? 'status-error' : 'status-unknown';

				container.appendChild(E('div', { 'class': 'widget-monitoring' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '📈'),
						E('div', { 'class': 'widget-title' }, app.name),
						E('div', { 'class': 'widget-status-badge ' + statusClass },
							data.status || 'unknown')
					]),
					E('div', { 'class': 'widget-metrics-grid' },
						metrics.map(function(metric) {
							return self.renderMetricCard(metric);
						})
					),
					data.uptime ? E('div', { 'class': 'widget-uptime' }, [
						E('span', { 'class': 'uptime-label' }, 'Uptime: '),
						E('span', { 'class': 'uptime-value' }, self.formatUptime(data.uptime))
					]) : null
				]));
			}
		});

		// Hosting widget template
		this.registerTemplate('hosting', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data.metrics || [];
				var services = data.services || [];

				container.appendChild(E('div', { 'class': 'widget-hosting' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '🖥️'),
						E('div', { 'class': 'widget-title' }, app.name)
					]),
					E('div', { 'class': 'widget-services' },
						services.map(function(service) {
							var statusClass = service.running ? 'service-running' : 'service-stopped';
							return E('div', { 'class': 'service-item ' + statusClass }, [
								E('span', { 'class': 'service-name' }, service.name),
								E('span', { 'class': 'service-status' },
									service.running ? '✓' : '✗')
							]);
						})
					),
					metrics.length > 0 ? E('div', { 'class': 'widget-metrics' },
						metrics.map(function(metric) {
							return self.renderMetric(metric);
						})
					) : null
				]));
			}
		});

		// Compact metric template
		this.registerTemplate('compact', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var primaryMetric = data.primary_metric || {};

				container.appendChild(E('div', { 'class': 'widget-compact' }, [
					E('div', { 'class': 'widget-icon-small' }, app.icon || '📊'),
					E('div', { 'class': 'widget-content' }, [
						E('div', { 'class': 'widget-title-small' }, app.name),
						E('div', { 'class': 'widget-value-large' },
							primaryMetric.value || '0'),
						E('div', { 'class': 'widget-label-small' },
							primaryMetric.label || '')
					])
				]));
			}
		});
	},

	/**
	 * Register a custom widget template
	 * @param {string} name - Template name
	 * @param {Object} template - Template object with render function
	 */
	registerTemplate: function(name, template) {
		this.templates[name] = template;
	},

	/**
	 * Render a single metric
	 * @param {Object} metric - Metric data
	 * @returns {Element} Metric DOM element
	 */
	renderMetric: function(metric) {
		var valueClass = 'metric-value';
		if (metric.status === 'warning') valueClass += ' value-warning';
		if (metric.status === 'error') valueClass += ' value-error';

		return E('div', { 'class': 'metric-row' }, [
			E('span', { 'class': 'metric-label' }, metric.label + ':'),
			E('span', { 'class': valueClass },
				metric.formatted_value || metric.value?.toString() || '0')
		]);
	},

	/**
	 * Render a metric as a card (for grid layouts)
	 * @param {Object} metric - Metric data
	 * @returns {Element} Metric card DOM element
	 */
	renderMetricCard: function(metric) {
		var valueClass = 'metric-card-value';
		if (metric.status === 'warning') valueClass += ' value-warning';
		if (metric.status === 'error') valueClass += ' value-error';

		return E('div', { 'class': 'metric-card' }, [
			E('div', { 'class': 'metric-card-label' }, metric.label),
			E('div', { 'class': valueClass },
				metric.formatted_value || metric.value?.toString() || '0'),
			metric.unit ? E('div', { 'class': 'metric-card-unit' }, metric.unit) : null
		]);
	},

	/**
	 * Initialize and render all widgets
	 */
	render: function() {
		var container = document.getElementById(this.containerId);
		if (!container) {
			console.error('Widget container not found:', this.containerId);
			return;
		}

		// Clear container
		container.innerHTML = '';
		container.className = 'widget-grid widget-grid-' + this.gridMode;

		// Filter apps that have widgets enabled
		var widgetApps = this.apps.filter(function(app) {
			return app.widget && app.widget.enabled;
		});

		if (widgetApps.length === 0) {
			container.appendChild(E('div', { 'class': 'no-widgets' }, [
				E('div', { 'class': 'no-widgets-icon' }, '📊'),
				E('h3', {}, 'No Active Widgets'),
				E('p', {}, 'Install and enable apps with widget support to see live metrics here.')
			]));
			return;
		}

		// Render each widget
		var self = this;
		widgetApps.forEach(function(app) {
			self.renderWidget(container, app);
		});
	},

	/**
	 * Render a single widget
	 * @param {Element} container - Parent container element
	 * @param {Object} app - App configuration with widget settings
	 */
	renderWidget: function(container, app) {
		var self = this;
		var widgetConfig = app.widget || {};
		var template = widgetConfig.template || 'default';
		var refreshInterval = widgetConfig.refresh_interval || this.defaultRefreshInterval;

		// Create widget container
		var widgetElement = E('div', {
			'class': 'widget-item widget-' + app.category,
			'data-app-id': app.id
		}, [
			E('div', { 'class': 'widget-content', 'id': 'widget-content-' + app.id }, [
				E('div', { 'class': 'widget-loading' }, [
					E('div', { 'class': 'spinner' }),
					E('p', {}, 'Loading...')
				])
			])
		]);

		container.appendChild(widgetElement);

		// Store widget reference
		this.widgets.push({
			app: app,
			element: widgetElement,
			contentElement: document.getElementById('widget-content-' + app.id)
		});

		// Initial data load
		this.updateWidget(app, template);

		// Setup auto-refresh if interval > 0
		if (refreshInterval > 0) {
			var pollHandle = poll.add(function() {
				return self.updateWidget(app, template);
			}, refreshInterval);

			this.pollHandles.push(pollHandle);
		}
	},

	/**
	 * Update widget data
	 * @param {Object} app - App configuration
	 * @param {string} templateName - Template to use for rendering
	 */
	updateWidget: function(app, templateName) {
		var self = this;

		return API.getWidgetData(app.id).then(function(data) {
			var contentElement = document.getElementById('widget-content-' + app.id);
			if (!contentElement) return;

			var template = self.templates[templateName] || self.templates['default'];

			try {
				template.render(contentElement, app, data);
			} catch (error) {
				console.error('Widget render error for', app.id, error);
				contentElement.innerHTML = '';
				contentElement.appendChild(E('div', { 'class': 'widget-error' }, [
					E('div', { 'class': 'error-icon' }, '⚠️'),
					E('div', { 'class': 'error-message' }, 'Widget Error'),
					E('div', { 'class': 'error-details' }, error.message)
				]));
			}
		}).catch(function(error) {
			console.error('Failed to load widget data for', app.id, error);
			var contentElement = document.getElementById('widget-content-' + app.id);
			if (contentElement) {
				contentElement.innerHTML = '';
				contentElement.appendChild(E('div', { 'class': 'widget-error' }, [
					E('div', { 'class': 'error-icon' }, '⚠️'),
					E('div', { 'class': 'error-message' }, 'Data Load Failed')
				]));
			}
		});
	},

	/**
	 * Destroy widget renderer and cleanup polling
	 */
	destroy: function() {
		// Remove all poll handles
		this.pollHandles.forEach(function(handle) {
			poll.remove(handle);
		});
		this.pollHandles = [];
		this.widgets = [];
	},

	/**
	 * Format bandwidth value
	 * @param {number} bytesPerSec - Bytes per second
	 * @returns {string} Formatted string
	 */
	formatBandwidth: function(bytesPerSec) {
		if (bytesPerSec < 1024) return bytesPerSec + ' B/s';
		if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
		if (bytesPerSec < 1024 * 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
		return (bytesPerSec / (1024 * 1024 * 1024)).toFixed(2) + ' GB/s';
	},

	/**
	 * Format uptime in seconds
	 * @param {number} seconds - Uptime in seconds
	 * @returns {string} Formatted string
	 */
	formatUptime: function(seconds) {
		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var mins = Math.floor((seconds % 3600) / 60);

		if (days > 0) return days + 'd ' + hours + 'h ' + mins + 'm';
		if (hours > 0) return hours + 'h ' + mins + 'm';
		return mins + 'm';
	},

	/**
	 * Format timestamp
	 * @param {string|number} timestamp - ISO timestamp or Unix timestamp
	 * @returns {string} Formatted relative time
	 */
	formatTimestamp: function(timestamp) {
		var date = typeof timestamp === 'number' ?
			new Date(timestamp * 1000) : new Date(timestamp);
		var now = new Date();
		var diffMs = now - date;
		var diffSecs = Math.floor(diffMs / 1000);

		if (diffSecs < 60) return 'Just now';
		if (diffSecs < 3600) return Math.floor(diffSecs / 60) + ' min ago';
		if (diffSecs < 86400) return Math.floor(diffSecs / 3600) + ' hr ago';
		return Math.floor(diffSecs / 86400) + ' days ago';
	}
});

return WidgetRenderer;
