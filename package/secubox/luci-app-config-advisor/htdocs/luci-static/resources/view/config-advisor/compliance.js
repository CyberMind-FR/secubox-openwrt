'use strict';
'require view';
'require rpc';
'require ui';

var callCompliance = rpc.declare({
	object: 'luci.config-advisor',
	method: 'compliance',
	expect: {}
});

var callCheck = rpc.declare({
	object: 'luci.config-advisor',
	method: 'check',
	expect: {}
});

function formatTimestamp(ts) {
	if (!ts || ts === 0) return 'Never';
	var d = new Date(ts * 1000);
	return d.toLocaleString();
}

function getSeverityColor(severity) {
	switch(severity) {
		case 'critical': return '#ef4444';
		case 'high': return '#f97316';
		case 'medium': return '#eab308';
		case 'low': return '#22c55e';
		case 'info': return '#3b82f6';
		default: return '#6b7280';
	}
}

function getStatusBadge(status) {
	var colors = {
		'pass': { bg: '#166534', text: '#22c55e' },
		'fail': { bg: '#7f1d1d', text: '#ef4444' },
		'warn': { bg: '#713f12', text: '#eab308' },
		'info': { bg: '#1e3a5f', text: '#3b82f6' },
		'skip': { bg: '#374151', text: '#9ca3af' }
	};
	var c = colors[status] || colors['skip'];
	return E('span', {
		'style': 'background:' + c.bg + '; color:' + c.text + '; padding:2px 8px; border-radius:4px; font-size:12px; text-transform:uppercase;'
	}, status);
}

return view.extend({
	load: function() {
		return callCompliance();
	},

	render: function(data) {
		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'ANSSI CSPN Compliance'),
			E('p', { 'class': 'cbi-map-descr' },
				'Compliance status against ANSSI CSPN security requirements.')
		]);

		if (data.error) {
			view.appendChild(E('div', {
				'style': 'background:#1e293b; padding:2rem; border-radius:8px; text-align:center;'
			}, [
				E('p', { 'style': 'color:#94a3b8; margin-bottom:1rem' }, data.error),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': ui.createHandlerFn(this, function() {
						return callCheck().then(function() {
							ui.addNotification(null, E('p', 'Compliance check completed. Refreshing...'));
							window.location.reload();
						});
					})
				}, 'Run Compliance Check')
			]));
			return view;
		}

		var summary = data.summary || {};
		var results = data.results || [];

		// Summary Cards
		var summaryGrid = E('div', {
			'style': 'display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:1rem; margin-bottom:2rem;'
		});

		var metrics = [
			{ label: 'Total Checks', value: summary.total || 0, color: '#f1f5f9' },
			{ label: 'Passed', value: summary.passed || 0, color: '#22c55e' },
			{ label: 'Failed', value: summary.failed || 0, color: '#ef4444' },
			{ label: 'Warnings', value: summary.warnings || 0, color: '#eab308' },
			{ label: 'Info', value: summary.info || 0, color: '#3b82f6' }
		];

		metrics.forEach(function(m) {
			summaryGrid.appendChild(E('div', {
				'style': 'background:#1e293b; border-radius:8px; padding:1rem; text-align:center;'
			}, [
				E('div', { 'style': 'font-size:32px; font-weight:bold; color:' + m.color }, m.value),
				E('div', { 'style': 'font-size:12px; color:#94a3b8; margin-top:0.5rem' }, m.label)
			]));
		});

		view.appendChild(summaryGrid);

		// Compliance Rate Progress Bar
		var rate = data.compliance_rate || 0;
		var rateColor = rate >= 80 ? '#22c55e' : rate >= 60 ? '#eab308' : '#ef4444';

		view.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:8px; padding:1.5rem; margin-bottom:2rem;'
		}, [
			E('div', { 'style': 'display:flex; justify-content:space-between; margin-bottom:0.5rem;' }, [
				E('span', { 'style': 'color:#f1f5f9; font-weight:bold;' }, 'Compliance Rate'),
				E('span', { 'style': 'color:' + rateColor + '; font-weight:bold;' }, rate + '%')
			]),
			E('div', {
				'style': 'background:#334155; border-radius:4px; height:12px; overflow:hidden;'
			}, [
				E('div', {
					'style': 'background:' + rateColor + '; height:100%; width:' + rate + '%; transition:width 0.3s;'
				})
			]),
			E('div', { 'style': 'font-size:12px; color:#94a3b8; margin-top:0.5rem;' },
				'Framework: ' + (data.framework || 'ANSSI CSPN') + ' | Generated: ' + formatTimestamp(data.timestamp))
		]));

		// Results by Category
		var categories = {};
		results.forEach(function(r) {
			var cat = r.category || 'other';
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push(r);
		});

		Object.keys(categories).sort().forEach(function(cat) {
			var catResults = categories[cat];

			view.appendChild(E('h3', {
				'style': 'margin-top:1.5rem; text-transform:capitalize; border-bottom:1px solid #334155; padding-bottom:0.5rem;'
			}, cat.replace(/_/g, ' ')));

			var table = E('table', { 'class': 'table', 'style': 'width:100%' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th', 'style': 'width:100px' }, 'Rule ID'),
					E('th', { 'class': 'th', 'style': 'width:80px' }, 'Severity'),
					E('th', { 'class': 'th', 'style': 'width:80px' }, 'Status')
				])
			]);

			catResults.forEach(function(r) {
				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, E('code', {}, r.rule_id || '-')),
					E('td', { 'class': 'td' }, E('span', {
						'style': 'color:' + getSeverityColor(r.severity) + '; text-transform:capitalize;'
					}, r.severity || 'medium')),
					E('td', { 'class': 'td' }, getStatusBadge(r.status))
				]));
			});

			view.appendChild(table);
		});

		// Action Buttons
		view.appendChild(E('div', { 'style': 'margin-top:2rem; display:flex; gap:1rem;' }, [
			E('button', {
				'class': 'cbi-button cbi-button-apply',
				'click': ui.createHandlerFn(this, function() {
					return callCheck().then(function() {
						ui.addNotification(null, E('p', 'Compliance check completed. Refreshing...'));
						window.location.reload();
					});
				})
			}, 'Re-run Compliance Check')
		]));

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
