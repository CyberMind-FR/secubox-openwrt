'use strict';
'require baseclass';
'require secubox-admin.api as API';
'require secubox-admin.chart-utils as ChartUtils';
'require secubox-admin.realtime-client as RealtimeClient';
'require poll';

function WidgetRendererInstance(options) {
	options = options || {};

	this.containerId = options.containerId || 'widget-container';
	this.apps = options.apps || [];
	this.defaultRefreshInterval = options.defaultRefreshInterval || 30;
	this.gridMode = options.gridMode || 'auto';
	this.widgets = [];
	this.pollHandles = [];
	this.templates = {};
	this.realtimeSubscriptions = [];

	// Initialize real-time client
	this.realtime = Object.create(RealtimeClient);
	this.realtime.init({
		enableWebSocket: true,
		enablePolling: true,
		pollInterval: this.defaultRefreshInterval * 1000,
		debug: true
	});

	this.registerBuiltInTemplates();
}

WidgetRendererInstance.prototype = {
	registerBuiltInTemplates: function() {
		var self = this;

		this.registerTemplate('default', {
			render: function(container, app, data) {
				container.innerHTML = '';
				container.appendChild(E('div', { 'class': 'widget-default' }, [
					E('div', { 'class': 'widget-icon' }, app.icon || '📊'),
					E('div', { 'class': 'widget-title' }, app.name || 'Application'),
					E('div', { 'class': 'widget-status' },
						data && data.widget_enabled ? 'Widget Enabled' : 'No widget data'
					)
				]));
			}
		});

		this.registerTemplate('security', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data && data.metrics ? data.metrics : [];
				var status = data && data.status ? data.status : 'unknown';
				var statusClass = status === 'ok' ? 'status-success' :
					status === 'warning' ? 'status-warning' :
					status === 'error' ? 'status-error' : 'status-unknown';

				container.appendChild(E('div', { 'class': 'widget-security' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '🔒'),
						E('div', { 'class': 'widget-title' }, app.name || 'Security'),
						E('div', { 'class': 'widget-status-indicator ' + statusClass })
					]),
					E('div', { 'class': 'widget-metrics' },
						metrics.map(function(metric) {
							return self.renderMetric(metric || {});
						})
					),
					data && data.last_event ? E('div', { 'class': 'widget-last-event' }, [
						E('span', { 'class': 'event-label' }, 'Last Event: '),
						E('span', { 'class': 'event-time' }, self.formatTimestamp(data.last_event))
					]) : null
				]));
			}
		});

		this.registerTemplate('network', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data && data.metrics ? data.metrics : [];
				var connections = data && data.active_connections ? data.active_connections : 0;
				var bandwidth = data && data.bandwidth ? data.bandwidth : { up: 0, down: 0 };

				container.appendChild(E('div', { 'class': 'widget-network' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '🌐'),
						E('div', { 'class': 'widget-title' }, app.name || 'Network')
					]),
					E('div', { 'class': 'widget-metrics' }, [
						E('div', { 'class': 'metric-row' }, [
							E('span', { 'class': 'metric-label' }, 'Connections:'),
							E('span', { 'class': 'metric-value' }, connections.toString())
						]),
						E('div', { 'class': 'metric-row' }, [
							E('span', { 'class': 'metric-label' }, 'Up/Down:'),
							E('span', { 'class': 'metric-value' },
								self.formatBandwidth(bandwidth.up || 0) + ' / ' +
								self.formatBandwidth(bandwidth.down || 0))
						])
					].concat(metrics.map(function(metric) {
						return self.renderMetric(metric || {});
					})))
				]));
			}
		});

		this.registerTemplate('monitoring', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data && data.metrics ? data.metrics : [];
				var status = data && data.status ? data.status : 'unknown';
				var statusClass = status === 'healthy' ? 'status-success' :
					status === 'degraded' ? 'status-warning' :
					status === 'down' ? 'status-error' : 'status-unknown';

				container.appendChild(E('div', { 'class': 'widget-monitoring' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '📈'),
						E('div', { 'class': 'widget-title' }, app.name || 'Monitoring'),
						E('div', { 'class': 'widget-status-badge ' + statusClass }, status)
					]),
					E('div', { 'class': 'widget-metrics-grid' },
						metrics.map(function(metric) {
							return self.renderMetricCard(metric || {});
						})
					),
					data && data.uptime ? E('div', { 'class': 'widget-uptime' }, [
						E('span', { 'class': 'uptime-label' }, 'Uptime: '),
						E('span', { 'class': 'uptime-value' }, self.formatUptime(data.uptime))
					]) : null
				]));
			}
		});

		this.registerTemplate('hosting', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var metrics = data && data.metrics ? data.metrics : [];
				var services = data && data.services ? data.services : [];

				container.appendChild(E('div', { 'class': 'widget-hosting' }, [
					E('div', { 'class': 'widget-header' }, [
						E('div', { 'class': 'widget-icon' }, app.icon || '🖥️'),
						E('div', { 'class': 'widget-title' }, app.name || 'Hosting')
					]),
					E('div', { 'class': 'widget-services' },
						services.map(function(service) {
							var running = service && service.running;
							var statusClass = running ? 'service-running' : 'service-stopped';
							return E('div', { 'class': 'service-item ' + statusClass }, [
								E('span', { 'class': 'service-name' }, (service && service.name) || 'Service'),
								E('span', { 'class': 'service-status' }, running ? '✓' : '✗')
							]);
						})
					),
					metrics.length > 0 ? E('div', { 'class': 'widget-metrics' },
						metrics.map(function(metric) {
							return self.renderMetric(metric || {});
						})
					) : null
				]));
			}
		});

		this.registerTemplate('compact', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var primaryMetric = data && data.primary_metric ? data.primary_metric : {};

				container.appendChild(E('div', { 'class': 'widget-compact' }, [
					E('div', { 'class': 'widget-icon-small' }, app.icon || '📊'),
					E('div', { 'class': 'widget-content' }, [
						E('div', { 'class': 'widget-title-small' }, app.name || 'Metric'),
						E('div', { 'class': 'widget-value-large' }, primaryMetric.value || '0'),
						E('div', { 'class': 'widget-label-small' }, primaryMetric.label || '')
					])
				]));
			}
		});

		this.registerTemplate('chart-timeseries', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var chartContainer = E('div', { 'class': 'cyber-chart-container cyber-chart-container--md' }, [
					E('div', { 'class': 'cyber-chart-header' }, [
						E('div', {}, [
							E('div', { 'class': 'cyber-chart-title' }, app.name || 'Timeseries'),
							E('div', { 'class': 'cyber-chart-subtitle' }, (data && data.subtitle) || 'Time Series Data')
						])
					]),
					E('div', { 'class': 'cyber-chart-canvas' }, [
						E('canvas', { 'id': 'chart-' + app.id })
					])
				]);

				container.appendChild(chartContainer);

				var canvas = chartContainer.querySelector('canvas');
				var chartData = {
					labels: data && data.labels ? data.labels : [],
					datasets: (data && data.datasets ? data.datasets : []).map(function(ds) {
						return {
							label: ds && ds.label ? ds.label : 'Dataset',
							data: ds && ds.data ? ds.data : []
						};
					})
				};

				ChartUtils.createLineChart(canvas, chartData, {}).catch(function(err) {
					console.error('[WIDGET] Chart error:', err);
				});
			}
		});

		this.registerTemplate('chart-gauge', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var value = data && data.value ? data.value : 0;
				var max = data && data.max ? data.max : 100;
				var percentage = max > 0 ? Math.round((value / max) * 100) : 0;

				var chartContainer = E('div', { 'class': 'cyber-chart-container cyber-chart-container--sm' }, [
					E('div', { 'class': 'cyber-chart-header' }, [
						E('div', { 'class': 'cyber-chart-title' }, app.name || 'Gauge')
					]),
					E('div', { 'class': 'cyber-chart-metrics' }, [
						E('div', { 'class': 'cyber-chart-metric' }, [
							E('div', { 'class': 'cyber-chart-metric-label' }, (data && data.label) || 'Usage'),
							E('div', { 'class': 'cyber-chart-metric-value' }, percentage + '%')
						])
					]),
					E('div', { 'class': 'cyber-chart-canvas' }, [
						E('canvas', { 'id': 'chart-' + app.id })
					])
				]);

				container.appendChild(chartContainer);

				var canvas = chartContainer.querySelector('canvas');
				ChartUtils.createGaugeChart(canvas, percentage, {}).catch(function(err) {
					console.error('[WIDGET] Gauge error:', err);
				});
			}
		});

		this.registerTemplate('sparkline', {
			render: function(container, app, data) {
				container.innerHTML = '';

				var values = data && data.values ? data.values : [];
				var currentValue = values.length ? values[values.length - 1] : 0;
				var previousValue = values.length > 1 ? values[values.length - 2] : 0;
				var change = currentValue - previousValue;
				var trendClass = change > 0 ? 'cyber-sparkline-trend--up' : 'cyber-sparkline-trend--down';

				var sparklineContainer = E('div', { 'class': 'cyber-sparkline' }, [
					E('div', { 'class': 'cyber-sparkline-canvas' }, [
						E('canvas', { 'id': 'sparkline-' + app.id })
					]),
					E('div', { 'class': 'cyber-sparkline-value' }, currentValue.toString()),
					E('div', { 'class': 'cyber-sparkline-trend ' + trendClass },
						change > 0 ? '↑ ' + change : '↓ ' + Math.abs(change))
				]);

				container.appendChild(sparklineContainer);

				var canvas = sparklineContainer.querySelector('canvas');
				ChartUtils.createSparkline(canvas, values).catch(function(err) {
					console.error('[WIDGET] Sparkline error:', err);
				});
			}
		});
	},

	registerTemplate: function(name, template) {
		this.templates[name] = template;
	},

	renderMetric: function(metric) {
		var valueClass = 'metric-value';
		if (metric.status === 'warning') valueClass += ' value-warning';
		if (metric.status === 'error') valueClass += ' value-error';

		return E('div', { 'class': 'metric-row' }, [
			E('span', { 'class': 'metric-label' }, (metric.label || 'Metric') + ':'),
			E('span', { 'class': valueClass }, getMetricValue(metric))
		]);
	},

	renderMetricCard: function(metric) {
		var valueClass = 'metric-card-value';
		if (metric.status === 'warning') valueClass += ' value-warning';
		if (metric.status === 'error') valueClass += ' value-error';

		return E('div', { 'class': 'metric-card' }, [
			E('div', { 'class': 'metric-card-label' }, metric.label || 'Metric'),
			E('div', { 'class': valueClass }, getMetricValue(metric)),
			metric.unit ? E('div', { 'class': 'metric-card-unit' }, metric.unit) : null
		]);
	},

	render: function() {
		var container = document.getElementById(this.containerId);
		if (!container) {
			console.error('Widget container not found:', this.containerId);
			return;
		}

		container.innerHTML = '';
		container.className = 'widget-grid widget-grid-' + this.gridMode;

		var widgetApps = this.apps.filter(function(app) {
			return app && app.widget && app.widget.enabled;
		});

		if (widgetApps.length === 0) {
			container.appendChild(E('div', { 'class': 'no-widgets' }, [
				E('div', { 'class': 'no-widgets-icon' }, '📊'),
				E('h3', {}, 'No Active Widgets'),
				E('p', {}, 'Install and enable apps with widget support to see live metrics here.')
			]));
			return;
		}

		var self = this;
		widgetApps.forEach(function(app) {
			self.renderWidget(container, app);
		});
	},

	renderWidget: function(container, app) {
		var self = this;
		var widgetConfig = app.widget || {};
		var templateName = widgetConfig.template || 'default';
		var refreshInterval = widgetConfig.refresh_interval || this.defaultRefreshInterval;

		var widgetElement = E('div', {
			'class': 'widget-item widget-' + (app.category || 'general'),
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

		this.widgets.push({
			app: app,
			element: widgetElement,
			contentElement: document.getElementById('widget-content-' + app.id)
		});

		this.updateWidget(app, templateName);

		if (refreshInterval > 0) {
			var channel = 'widget.' + app.id;

			// Subscribe to real-time updates
			var unsubscribe = this.realtime.subscribe(channel, function(data) {
				console.log('[WIDGET] Real-time update for', app.id, data);
				var contentElement = document.getElementById('widget-content-' + app.id);
				if (!contentElement) return;

				var templateObj = self.templates[templateName] || self.templates['default'];

				try {
					templateObj.render(contentElement, app, data || {});
				} catch (error) {
					console.error('Widget render error for', app.id, error);
					contentElement.innerHTML = '';
					contentElement.appendChild(E('div', { 'class': 'widget-error' }, [
						E('div', { 'class': 'error-icon' }, '⚠️'),
						E('div', { 'class': 'error-message' }, 'Widget Error'),
						E('div', { 'class': 'error-details' }, error.message || 'Render failure')
					]));
				}
			});

			this.realtimeSubscriptions.push({
				channel: channel,
				unsubscribe: unsubscribe
			});

			// Keep poll as fallback (realtime-client will use it if WebSocket unavailable)
			var pollHandle = poll.add(function() {
				return self.updateWidget(app, templateName);
			}, refreshInterval);

			this.pollHandles.push(pollHandle);
		}
	},

	updateWidget: function(app, templateName) {
		var self = this;
		return API.getWidgetData(app.id).then(function(data) {
			var contentElement = document.getElementById('widget-content-' + app.id);
			if (!contentElement) {
				return;
			}

			var template = self.templates[templateName] || self.templates.default;

			try {
				template.render(contentElement, app, data || {});
			} catch (error) {
				console.error('Widget render error for', app.id, error);
				contentElement.innerHTML = '';
				contentElement.appendChild(E('div', { 'class': 'widget-error' }, [
					E('div', { 'class': 'error-icon' }, '⚠️'),
					E('div', { 'class': 'error-message' }, 'Widget Error'),
					E('div', { 'class': 'error-details' }, error.message || 'Render failure')
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

	destroy: function() {
		var container = document.getElementById(this.containerId);
		if (container) {
			container.innerHTML = '';
		}

		// Cleanup real-time subscriptions
		this.realtimeSubscriptions.forEach(function(sub) {
			if (sub && sub.unsubscribe) {
				sub.unsubscribe();
			}
		});
		this.realtimeSubscriptions = [];

		// Disconnect real-time client
		if (this.realtime) {
			this.realtime.disconnect();
		}

		// Cleanup polling fallback
		this.pollHandles.forEach(function(handle) {
			poll.remove(handle);
		});
		this.pollHandles = [];
		this.widgets = [];
	},

	formatBandwidth: function(bytesPerSec) {
		if (bytesPerSec < 1024) return bytesPerSec + ' B/s';
		if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
		if (bytesPerSec < 1024 * 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
		return (bytesPerSec / (1024 * 1024 * 1024)).toFixed(2) + ' GB/s';
	},

	formatUptime: function(seconds) {
		var totalSeconds = parseInt(seconds, 10) || 0;
		var days = Math.floor(totalSeconds / 86400);
		var hours = Math.floor((totalSeconds % 86400) / 3600);
		var mins = Math.floor((totalSeconds % 3600) / 60);

		if (days > 0) return days + 'd ' + hours + 'h ' + mins + 'm';
		if (hours > 0) return hours + 'h ' + mins + 'm';
		return mins + 'm';
	},

	formatTimestamp: function(timestamp) {
		if (!timestamp) {
			return 'Unknown';
		}

		var date = typeof timestamp === 'number' ?
			new Date(timestamp * 1000) : new Date(timestamp);
		var now = new Date();
		var diffMs = now.getTime() - date.getTime();
		var diffSecs = Math.floor(diffMs / 1000);

		if (diffSecs < 60) return 'Just now';
		if (diffSecs < 3600) return Math.floor(diffSecs / 60) + ' min ago';
		if (diffSecs < 86400) return Math.floor(diffSecs / 3600) + ' hr ago';
		return Math.floor(diffSecs / 86400) + ' days ago';
	}
};

function getMetricValue(metric) {
	if (metric.formatted_value) {
		return metric.formatted_value;
	}

	if (metric.value === 0 || metric.value) {
		return metric.value.toString();
	}

	return '0';
}

return baseclass.extend({
	create: function(options) {
		return new WidgetRendererInstance(options);
	}
});
