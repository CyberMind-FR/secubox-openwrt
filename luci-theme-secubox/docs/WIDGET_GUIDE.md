# SecuBox Widget System Guide

Complete guide to creating widgets with charts and real-time data updates.

## Table of Contents
1. [Widget System Overview](#widget-system-overview)
2. [Built-in Widget Templates](#built-in-widget-templates)
3. [Creating Custom Widgets](#creating-custom-widgets)
4. [Chart Integration](#chart-integration)
5. [Real-Time Updates](#real-time-updates)
6. [Widget API Reference](#widget-api-reference)

---

## Widget System Overview

The SecuBox widget system allows apps to display live data on the dashboard.

### Architecture

```
Widget Renderer
├── Templates (rendering logic)
├── Chart Utils (visualization)
└── Realtime Client (live updates)
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Widget Renderer** | `widget-renderer.js` | Main widget rendering engine |
| **Chart Utils** | `chart-utils.js` | Chart.js wrapper utilities |
| **Realtime Client** | `realtime-client.js` | WebSocket + polling updates |

---

## Built-in Widget Templates

SecuBox includes 9 pre-built widget templates:

### 1. Default Template

Basic widget with icon, title, and status.

```javascript
{
	template: 'default',
	data: {
		widget_enabled: true
	}
}
```

**Displays**:
- App icon
- App name
- Status message

---

### 2. Security Template

Security monitoring widget with metrics and status indicator.

```javascript
{
	template: 'security',
	data: {
		status: 'ok',  // 'ok', 'warning', 'error', 'unknown'
		metrics: [
			{ label: 'Blocked IPs', value: 42 },
			{ label: 'Active Rules', value: 128 }
		],
		last_event: 1704448800  // Unix timestamp
	}
}
```

**Displays**:
- Status indicator (colored badge)
- Metrics grid
- Last event timestamp

---

### 3. Network Template

Network monitoring with connections and bandwidth.

```javascript
{
	template: 'network',
	data: {
		active_connections: 24,
		bandwidth: {
			up: 524288,    // bytes/sec
			down: 1048576  // bytes/sec
		},
		metrics: [
			{ label: 'Packets', value: 1234567 }
		]
	}
}
```

**Displays**:
- Active connections count
- Upload/download bandwidth
- Additional metrics

---

### 4. Monitoring Template

System monitoring with health status.

```javascript
{
	template: 'monitoring',
	data: {
		status: 'healthy',  // 'healthy', 'degraded', 'down'
		metrics: [
			{ label: 'CPU', value: '45%', status: 'ok' },
			{ label: 'Memory', value: '2.1 GB', status: 'warning' }
		],
		uptime: 86400  // seconds
	}
}
```

**Displays**:
- Status badge
- Metrics as cards
- Uptime

---

### 5. Hosting Template

Service hosting status widget.

```javascript
{
	template: 'hosting',
	data: {
		services: [
			{ name: 'nginx', running: true },
			{ name: 'mysql', running: true },
			{ name: 'php-fpm', running: false }
		],
		metrics: [
			{ label: 'Requests/sec', value: 42 }
		]
	}
}
```

**Displays**:
- Service list with status
- Service metrics

---

### 6. Compact Template

Minimal widget showing single metric.

```javascript
{
	template: 'compact',
	data: {
		primary_metric: {
			label: 'Users Online',
			value: '127'
		}
	}
}
```

**Displays**:
- Small icon
- Metric label
- Large value

---

### 7. Chart Timeseries Template

Line chart for time-series data.

```javascript
{
	template: 'chart-timeseries',
	data: {
		subtitle: 'Last 24 hours',
		labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
		datasets: [
			{
				label: 'Requests',
				data: [120, 150, 180, 220, 190, 160]
			}
		]
	}
}
```

**Displays**:
- Chart.js line chart
- Legend
- Responsive canvas

---

### 8. Chart Gauge Template

Gauge/progress chart for percentage metrics.

```javascript
{
	template: 'chart-gauge',
	data: {
		label: 'Disk Usage',
		value: 65,   // current value
		max: 100     // maximum value
	}
}
```

**Displays**:
- Semi-circle gauge
- Percentage display
- Color-coded status

---

### 9. Sparkline Template

Mini inline chart with trend.

```javascript
{
	template: 'sparkline',
	data: {
		values: [45, 52, 48, 61, 58, 67, 72, 69, 75]
	}
}
```

**Displays**:
- Tiny line chart (80x30px)
- Current value
- Trend indicator (↑/↓)

---

## Creating Custom Widgets

### Step 1: Define Widget in App Catalog

Edit `catalog.json`:

```json
{
	"id": "my-custom-app",
	"name": "My Custom App",
	"widget": {
		"enabled": true,
		"template": "custom-monitor",
		"refresh_interval": 30
	}
}
```

### Step 2: Register Custom Template

```javascript
// File: custom-widget-templates.js
'use strict';
'require secubox-admin.widget-renderer as WidgetRenderer';

// Get widget renderer instance
var renderer = WidgetRenderer.create({ containerId: 'widget-container' });

// Register custom template
renderer.registerTemplate('custom-monitor', {
	render: function(container, app, data) {
		container.innerHTML = '';

		// Create widget HTML
		container.appendChild(E('div', { 'class': 'widget-custom' }, [
			E('div', { 'class': 'widget-header' }, [
				E('span', { 'class': 'widget-icon' }, app.icon || '📊'),
				E('h3', {}, app.name)
			]),
			E('div', { 'class': 'widget-body' }, [
				E('div', { 'class': 'metric' }, [
					E('span', { 'class': 'label' }, 'Custom Metric:'),
					E('span', { 'class': 'value' }, data.customValue || 'N/A')
				])
			])
		]));
	}
});
```

### Step 3: Implement Data Provider

Create backend endpoint:

```lua
-- File: /usr/lib/lua/luci/controller/secubox/widget.lua
function get_widget_data()
	local app_id = luci.http.formvalue("app_id")

	if app_id == "my-custom-app" then
		luci.http.prepare_content("application/json")
		luci.http.write_json({
			customValue = "42",
			status = "running"
		})
	end
end
```

---

## Chart Integration

### Using Chart Utils

```javascript
'use strict';
'require secubox-admin.chart-utils as ChartUtils';

// Create line chart
ChartUtils.createLineChart(canvas, {
	labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
	datasets: [{
		label: 'Sales',
		data: [12, 19, 3, 5, 2]
	}]
}, {
	// Optional chart options
	responsive: true
}).then(function(chart) {
	console.log('Chart created:', chart);
});
```

### Available Chart Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `createLineChart(canvas, data, options)` | Line chart | Promise<Chart> |
| `createBarChart(canvas, data, options)` | Bar chart | Promise<Chart> |
| `createDoughnutChart(canvas, data, options)` | Doughnut/pie | Promise<Chart> |
| `createGaugeChart(canvas, value, options)` | Gauge (0-100) | Promise<Chart> |
| `createSparkline(canvas, values, color)` | Mini chart | Promise<Chart> |
| `destroyChart(chart)` | Destroy chart | void |
| `updateChart(chart, newData)` | Update data | void |

### Chart Data Format

```javascript
var chartData = {
	labels: ['Label 1', 'Label 2', 'Label 3'],
	datasets: [
		{
			label: 'Dataset 1',
			data: [10, 20, 30],
			borderColor: 'rgba(102, 126, 234, 1)',
			backgroundColor: 'rgba(102, 126, 234, 0.1)'
		}
	]
};
```

### Updating Charts

```javascript
// Update chart with new data
ChartUtils.updateChart(myChart, {
	labels: ['Updated 1', 'Updated 2'],
	datasets: [{
		label: 'New Data',
		data: [15, 25]
	}]
});
```

---

## Real-Time Updates

### WebSocket + Polling Fallback

The realtime client automatically:
1. Attempts WebSocket connection
2. Falls back to polling if WebSocket fails
3. Auto-reconnects on disconnect

### Subscribing to Widget Updates

```javascript
'use strict';
'require secubox-admin.realtime-client as RealtimeClient';

// Initialize realtime client
var realtime = Object.create(RealtimeClient);
realtime.init({
	enableWebSocket: true,
	enablePolling: true,
	pollInterval: 30000,  // 30 seconds
	debug: true
});

// Subscribe to widget channel
var unsubscribe = realtime.subscribe('widget.my-app-id', function(data) {
	console.log('Received update:', data);

	// Update UI with new data
	updateWidgetDisplay(data);
});

// Unsubscribe when done
// unsubscribe();
```

### Channel Naming Convention

Widget channels follow the pattern: `widget.{app-id}`

Examples:
- `widget.auth-guardian`
- `widget.crowdsec`
- `widget.my-custom-app`

### Publishing Updates (Server-side)

From your backend, push updates via WebSocket:

```lua
-- Lua example (ubus/WebSocket)
local data = {
	customValue = "updated-value",
	timestamp = os.time()
}

-- Broadcast to channel
websocket:send(json.encode({
	type = "data",
	channel = "widget.my-app-id",
	data = data
}))
```

### Realtime Client API

| Method | Description |
|--------|-------------|
| `init(options)` | Initialize client |
| `connect()` | Connect WebSocket |
| `disconnect()` | Disconnect |
| `subscribe(channel, callback)` | Subscribe to channel |
| `unsubscribe(channel, callback)` | Unsubscribe |
| `publish(channel, data)` | Publish data (if supported) |

### Configuration Options

```javascript
realtime.init({
	enableWebSocket: true,       // Try WebSocket first
	enablePolling: true,          // Fall back to polling
	pollInterval: 30000,          // Poll every 30s
	debug: true,                  // Console logging
	wsUrl: 'ws://custom-url/ws'   // Custom WebSocket URL
});
```

---

## Widget API Reference

### Widget Renderer Methods

```javascript
var renderer = WidgetRenderer.create({
	containerId: 'widget-container',
	apps: appsArray,
	defaultRefreshInterval: 30,
	gridMode: 'auto'
});
```

| Method | Description |
|--------|-------------|
| `render()` | Render all widgets |
| `renderWidget(container, app)` | Render single widget |
| `updateWidget(app, template)` | Update widget data |
| `destroy()` | Cleanup all widgets |
| `registerTemplate(name, template)` | Add custom template |

### Widget Configuration (catalog.json)

```json
{
	"widget": {
		"enabled": true,
		"template": "security",
		"refresh_interval": 30,
		"size": "medium"
	}
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Enable widget display |
| `template` | string | Template name |
| `refresh_interval` | number | Update interval (seconds) |
| `size` | string | Widget size hint |

---

## Complete Widget Example

### Example: CPU Monitor Widget

**1. App Configuration**

```json
{
	"id": "cpu-monitor",
	"name": "CPU Monitor",
	"widget": {
		"enabled": true,
		"template": "chart-timeseries",
		"refresh_interval": 5
	}
}
```

**2. Backend Data Provider**

```lua
function get_cpu_usage()
	local cpu_data = {
		labels = {},
		datasets = {{
			label = "CPU Usage %",
			data = {}
		}}
	}

	-- Collect last 12 data points (1 minute)
	for i = 1, 12 do
		table.insert(cpu_data.labels, tostring((i-1) * 5) .. "s")
		table.insert(cpu_data.datasets[1].data, get_current_cpu())
		nixio.nanosleep(0, 5000000000)  -- 5 seconds
	end

	return cpu_data
end
```

**3. Custom Template (Optional)**

```javascript
renderer.registerTemplate('cpu-monitor-custom', {
	render: function(container, app, data) {
		container.innerHTML = '';

		var chartContainer = E('div', { 'class': 'cyber-chart-container' }, [
			E('div', { 'class': 'cyber-chart-header' }, [
				E('div', { 'class': 'cyber-chart-title' }, 'CPU Usage')
			]),
			E('div', { 'class': 'cyber-chart-metrics' }, [
				E('div', { 'class': 'cyber-chart-metric' }, [
					E('div', { 'class': 'cyber-chart-metric-label' }, 'Current'),
					E('div', { 'class': 'cyber-chart-metric-value' },
						(data.datasets[0].data[data.datasets[0].data.length - 1] || 0) + '%'
					)
				])
			]),
			E('div', { 'class': 'cyber-chart-canvas' }, [
				E('canvas', { 'id': 'cpu-chart-' + app.id })
			])
		]);

		container.appendChild(chartContainer);

		var canvas = chartContainer.querySelector('canvas');
		ChartUtils.createLineChart(canvas, data, {});
	}
});
```

**4. Real-Time Integration**

```javascript
// Subscribe to real-time CPU updates
realtime.subscribe('widget.cpu-monitor', function(cpuData) {
	// Update chart with new data
	var chart = getChartInstance('cpu-chart-cpu-monitor');
	if (chart) {
		ChartUtils.updateChart(chart, cpuData);
	}
});
```

---

## Best Practices

### 1. Efficient Data Updates

```javascript
// ✅ Good: Only update changed data
if (newData.value !== oldData.value) {
	updateDisplay(newData);
}

// ❌ Bad: Always re-render everything
updateDisplay(newData);
```

### 2. Error Handling

```javascript
render: function(container, app, data) {
	try {
		// Validate data
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid widget data');
		}

		// Render widget
		// ...
	} catch (error) {
		console.error('Widget render error:', error);
		container.appendChild(E('div', { 'class': 'widget-error' }, [
			E('div', {}, '⚠️ Widget Error'),
			E('div', {}, error.message)
		]));
	}
}
```

### 3. Memory Management

```javascript
// Always cleanup on destroy
destroy: function() {
	// Unsubscribe from realtime
	this.realtimeSubscriptions.forEach(function(sub) {
		sub.unsubscribe();
	});

	// Destroy charts
	this.charts.forEach(function(chart) {
		ChartUtils.destroyChart(chart);
	});

	// Remove DOM elements
	this.container.innerHTML = '';
}
```

### 4. Responsive Widgets

Use responsive chart containers:

```css
.cyber-chart-container {
	width: 100%;
	height: 300px;
}

@media (max-width: 768px) {
	.cyber-chart-container {
		height: 200px;
	}
}
```

---

## Troubleshooting

### Widget Not Displaying

1. Check `widget.enabled` is `true` in catalog
2. Verify template name is registered
3. Check browser console for errors
4. Ensure data endpoint returns valid JSON

### Chart Not Rendering

1. Verify Chart.js is loaded: `console.log(window.Chart)`
2. Check canvas element exists: `document.querySelector('canvas')`
3. Ensure data format is correct (labels + datasets)

### Real-Time Not Working

1. Check WebSocket URL: `ws://host/ws/secubox`
2. Verify channel name: `widget.{app-id}`
3. Check console for connection errors
4. Test polling fallback is working

---

**Author**: SecuBox Team
**Version**: 1.0.0
**Last Updated**: 2026-01-05
