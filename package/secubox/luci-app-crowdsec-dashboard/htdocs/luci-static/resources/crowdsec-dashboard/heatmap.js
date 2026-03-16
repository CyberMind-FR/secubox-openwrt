'use strict';
'require baseclass';

/* global baseclass */

/**
 * CrowdSec Heatmap Component
 * Renders threat origins as colored dots on a world map
 */

// Country centroids (approximate lat/long for major countries)
var CENTROIDS = {
	'US': [39.8, -98.5], 'CN': [35.0, 105.0], 'RU': [61.5, 105.0],
	'DE': [51.0, 9.0], 'FR': [46.0, 2.0], 'GB': [54.0, -2.0],
	'JP': [36.0, 138.0], 'BR': [-14.0, -51.0], 'IN': [20.0, 77.0],
	'AU': [-25.0, 133.0], 'CA': [56.0, -106.0], 'KR': [36.0, 128.0],
	'NL': [52.0, 5.5], 'IT': [42.0, 12.0], 'ES': [40.0, -4.0],
	'PL': [52.0, 19.0], 'UA': [49.0, 32.0], 'ID': [-5.0, 120.0],
	'TR': [39.0, 35.0], 'SA': [24.0, 45.0], 'MX': [23.0, -102.0],
	'TH': [15.0, 100.0], 'VN': [16.0, 108.0], 'PH': [13.0, 122.0],
	'SG': [1.3, 103.8], 'MY': [4.0, 101.0], 'HK': [22.3, 114.2],
	'TW': [23.5, 121.0], 'AR': [-34.0, -64.0], 'CL': [-33.0, -70.0],
	'CO': [4.0, -72.0], 'PE': [-10.0, -76.0], 'VE': [7.0, -66.0],
	'ZA': [-29.0, 24.0], 'EG': [27.0, 30.0], 'NG': [10.0, 8.0],
	'KE': [-1.0, 38.0], 'MA': [32.0, -6.0], 'IR': [32.0, 53.0],
	'PK': [30.0, 69.0], 'BD': [24.0, 90.0], 'SE': [62.0, 15.0],
	'NO': [62.0, 10.0], 'FI': [64.0, 26.0], 'DK': [56.0, 10.0],
	'CH': [47.0, 8.0], 'AT': [47.5, 14.5], 'BE': [50.5, 4.5],
	'CZ': [49.8, 15.5], 'PT': [39.5, -8.0], 'GR': [39.0, 22.0],
	'RO': [46.0, 25.0], 'HU': [47.0, 20.0], 'IL': [31.0, 35.0],
	'AE': [24.0, 54.0], 'NZ': [-41.0, 174.0], 'IE': [53.0, -8.0]
};

// Convert lat/long to SVG coordinates (Mercator-ish projection)
function toSvgCoords(lat, lon, width, height) {
	var x = (lon + 180) * (width / 360);
	var latRad = lat * Math.PI / 180;
	var mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
	var y = (height / 2) - (width * mercN / (2 * Math.PI));
	return [x, Math.max(0, Math.min(height, y))];
}

// Calculate dot radius based on count (logarithmic scale)
function dotRadius(count, maxCount) {
	if (count <= 0) return 4;
	var normalized = Math.log(count + 1) / Math.log(maxCount + 1);
	return 4 + normalized * 16; // 4px to 20px
}

return baseclass.extend({
	/**
	 * Render heatmap
	 * @param {Object} data - { local: [{country, count}], capi: [...], waf: [...] }
	 * @param {Object} options - { width, height, showLegend }
	 */
	render: function(data, options) {
		var width = options && options.width || 600;
		var height = options && options.height || 300;
		var showLegend = options && options.showLegend !== false;

		// Find max count for scaling
		var maxCount = 1;
		['local', 'capi', 'waf'].forEach(function(key) {
			if (data[key]) {
				data[key].forEach(function(item) {
					if (item.count > maxCount) maxCount = item.count;
				});
			}
		});

		// Create SVG element
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
		svg.setAttribute('class', 'cs-heatmap-svg');
		svg.style.width = '100%';
		svg.style.height = 'auto';

		// Add world outline background
		var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		bg.setAttribute('width', width);
		bg.setAttribute('height', height);
		bg.setAttribute('fill', 'var(--kiss-bg2, #1a1d21)');
		svg.appendChild(bg);

		// Simple continent outlines (simplified paths)
		var continents = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		continents.setAttribute('d', this.getContinentPaths(width, height));
		continents.setAttribute('fill', 'none');
		continents.setAttribute('stroke', 'var(--kiss-border, #2d3139)');
		continents.setAttribute('stroke-width', '0.5');
		svg.appendChild(continents);

		// Render dots by layer (CAPI first, then local, then WAF on top)
		var layers = [
			{ key: 'capi', color: 'var(--kiss-cyan, #00bcd4)', label: 'CAPI Blocklist' },
			{ key: 'local', color: 'var(--kiss-orange, #ff9800)', label: 'Local Bans' },
			{ key: 'waf', color: 'var(--kiss-red, #f44336)', label: 'WAF Threats' }
		];

		var self = this;
		layers.forEach(function(layer) {
			if (!data[layer.key]) return;
			data[layer.key].forEach(function(item) {
				var centroid = CENTROIDS[item.country];
				if (!centroid) return;

				var coords = toSvgCoords(centroid[0], centroid[1], width, height);
				var radius = dotRadius(item.count, maxCount);

				var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				circle.setAttribute('cx', coords[0]);
				circle.setAttribute('cy', coords[1]);
				circle.setAttribute('r', radius);
				circle.setAttribute('fill', layer.color);
				circle.setAttribute('opacity', '0.7');
				circle.setAttribute('class', 'cs-heatmap-dot');
				circle.setAttribute('data-country', item.country);
				circle.setAttribute('data-count', item.count);
				circle.setAttribute('data-source', layer.key);

				// Tooltip on hover
				var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
				title.textContent = item.country + ': ' + item.count + ' (' + layer.label + ')';
				circle.appendChild(title);

				svg.appendChild(circle);
			});
		});

		// Container with legend
		var container = E('div', { 'class': 'cs-heatmap-container' }, [svg]);

		if (showLegend) {
			var legend = E('div', { 'class': 'cs-heatmap-legend' }, layers.map(function(l) {
				return E('span', { 'class': 'cs-heatmap-legend-item' }, [
					E('span', {
						'class': 'cs-heatmap-legend-dot',
						'style': 'background:' + l.color
					}),
					' ' + l.label
				]);
			}));
			container.appendChild(legend);
		}

		return container;
	},

	// Simplified continent outline paths
	getContinentPaths: function(w, h) {
		// Simplified world outline - major landmasses
		var scale = w / 600;
		return [
			// North America
			'M50,80 Q80,60 120,70 L150,90 Q140,120 100,140 L60,130 Q40,110 50,80',
			// South America
			'M100,160 Q120,150 130,170 L140,220 Q130,260 110,280 L90,260 Q80,200 100,160',
			// Europe
			'M280,60 Q320,50 350,60 L360,90 Q340,100 300,95 L280,80 Z',
			// Africa
			'M280,120 Q320,100 350,120 L360,180 Q340,220 300,230 L270,200 Q260,150 280,120',
			// Asia
			'M360,50 Q450,30 520,50 L550,100 Q530,140 480,150 L400,130 Q370,100 360,50',
			// Australia
			'M480,200 Q520,190 540,210 L550,240 Q530,260 500,260 L480,240 Q470,220 480,200'
		].join(' ');
	},

	/**
	 * Parse geo data from various formats
	 */
	parseGeoData: function(raw) {
		if (!raw) return [];
		if (typeof raw === 'string') {
			try { raw = JSON.parse(raw); } catch(e) { return []; }
		}
		if (!Array.isArray(raw)) return [];
		return raw.filter(function(item) {
			return item && item.country && typeof item.count === 'number';
		});
	}
});
