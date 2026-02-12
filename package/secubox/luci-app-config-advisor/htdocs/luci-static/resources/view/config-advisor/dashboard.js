'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.config-advisor',
	method: 'status',
	expect: {}
});

var callResults = rpc.declare({
	object: 'luci.config-advisor',
	method: 'results',
	expect: {}
});

var callCheck = rpc.declare({
	object: 'luci.config-advisor',
	method: 'check',
	expect: {}
});

var callHistory = rpc.declare({
	object: 'luci.config-advisor',
	method: 'history',
	params: ['count'],
	expect: {}
});

function formatTimestamp(ts) {
	if (!ts || ts === 0) return 'Never';
	var d = new Date(ts * 1000);
	return d.toLocaleString();
}

function getGradeColor(grade) {
	switch(grade) {
		case 'A': return '#22c55e';
		case 'B': return '#84cc16';
		case 'C': return '#eab308';
		case 'D': return '#f97316';
		case 'F': return '#ef4444';
		default: return '#6b7280';
	}
}

function getRiskColor(level) {
	switch(level) {
		case 'minimal': return '#22c55e';
		case 'low': return '#84cc16';
		case 'medium': return '#eab308';
		case 'high': return '#f97316';
		case 'critical': return '#ef4444';
		default: return '#6b7280';
	}
}

function getStatusIcon(status) {
	switch(status) {
		case 'pass': return '<span style="color:#22c55e">&#x2714;</span>';
		case 'fail': return '<span style="color:#ef4444">&#x2718;</span>';
		case 'warn': return '<span style="color:#eab308">&#x26A0;</span>';
		case 'info': return '<span style="color:#3b82f6">&#x2139;</span>';
		default: return '<span style="color:#6b7280">&#x2212;</span>';
	}
}

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callResults(),
			callHistory(10)
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var resultsData = data[1] || {};
		var historyData = data[2] || {};

		var results = resultsData.results || [];
		var history = historyData.history || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Config Advisor Dashboard'),
			E('p', { 'class': 'cbi-map-descr' },
				'ANSSI CSPN compliance checking and security configuration analysis.')
		]);

		// Score Card
		var scoreCard = E('div', {
			'style': 'display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;'
		});

		// Grade circle
		var gradeColor = getGradeColor(status.grade || '?');
		scoreCard.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:12px; padding:1.5rem; text-align:center;'
		}, [
			E('div', {
				'style': 'width:100px; height:100px; border-radius:50%; border:8px solid ' + gradeColor + '; margin:0 auto 1rem; display:flex; align-items:center; justify-content:center;'
			}, [
				E('span', { 'style': 'font-size:48px; font-weight:bold; color:' + gradeColor }, status.grade || '?')
			]),
			E('div', { 'style': 'font-size:14px; color:#94a3b8' }, 'Security Grade'),
			E('div', { 'style': 'font-size:24px; font-weight:bold; color:#f1f5f9; margin-top:0.5rem' },
				(status.score || 0) + '/100')
		]));

		// Risk Level
		var riskColor = getRiskColor(status.risk_level || 'unknown');
		scoreCard.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:12px; padding:1.5rem; text-align:center;'
		}, [
			E('div', {
				'style': 'font-size:48px; margin-bottom:1rem; color:' + riskColor
			}, status.risk_level === 'critical' ? '&#x26A0;' :
			   status.risk_level === 'high' ? '&#x26A0;' :
			   status.risk_level === 'minimal' ? '&#x2714;' : '&#x2139;'),
			E('div', { 'style': 'font-size:14px; color:#94a3b8' }, 'Risk Level'),
			E('div', {
				'style': 'font-size:20px; font-weight:bold; color:' + riskColor + '; margin-top:0.5rem; text-transform:capitalize'
			}, status.risk_level || 'Unknown')
		]));

		// Compliance Rate
		scoreCard.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:12px; padding:1.5rem; text-align:center;'
		}, [
			E('div', {
				'style': 'font-size:48px; margin-bottom:1rem; color:#3b82f6'
			}, '&#x2611;'),
			E('div', { 'style': 'font-size:14px; color:#94a3b8' }, 'ANSSI Compliance'),
			E('div', { 'style': 'font-size:24px; font-weight:bold; color:#f1f5f9; margin-top:0.5rem' },
				(status.compliance_rate || 0) + '%')
		]));

		// Last Check
		scoreCard.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:12px; padding:1.5rem; text-align:center;'
		}, [
			E('div', {
				'style': 'font-size:48px; margin-bottom:1rem; color:#8b5cf6'
			}, '&#x1F550;'),
			E('div', { 'style': 'font-size:14px; color:#94a3b8' }, 'Last Check'),
			E('div', { 'style': 'font-size:14px; color:#f1f5f9; margin-top:0.5rem' },
				formatTimestamp(status.last_check))
		]));

		view.appendChild(scoreCard);

		// Run Check Button
		var runBtn = E('button', {
			'class': 'cbi-button cbi-button-apply',
			'click': ui.createHandlerFn(this, function() {
				return callCheck().then(function() {
					ui.addNotification(null, E('p', 'Security check completed. Refreshing...'));
					window.location.reload();
				});
			})
		}, 'Run Security Check');

		view.appendChild(E('div', { 'style': 'margin-bottom:1.5rem' }, runBtn));

		// Results Table
		view.appendChild(E('h3', { 'style': 'margin-top:2rem' }, 'Check Results'));

		if (results.length > 0) {
			var table = E('table', { 'class': 'table', 'style': 'width:100%' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'Status'),
					E('th', { 'class': 'th' }, 'Check ID'),
					E('th', { 'class': 'th' }, 'Message'),
					E('th', { 'class': 'th' }, 'Details')
				])
			]);

			results.forEach(function(r) {
				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'style': 'text-align:center' }, getStatusIcon(r.status)),
					E('td', { 'class': 'td' }, E('code', {}, r.id || '-')),
					E('td', { 'class': 'td' }, r.message || '-'),
					E('td', { 'class': 'td', 'style': 'color:#94a3b8' }, r.details || '-')
				]));
			});

			view.appendChild(table);
		} else {
			view.appendChild(E('p', { 'style': 'color:#94a3b8' },
				'No check results available. Run a security check first.'));
		}

		// Score History
		if (history.length > 0) {
			view.appendChild(E('h3', { 'style': 'margin-top:2rem' }, 'Score History'));

			var historyTable = E('table', { 'class': 'table', 'style': 'width:100%' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'Date'),
					E('th', { 'class': 'th' }, 'Score'),
					E('th', { 'class': 'th' }, 'Grade'),
					E('th', { 'class': 'th' }, 'Risk Level')
				])
			]);

			history.slice().reverse().forEach(function(h) {
				historyTable.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, formatTimestamp(h.timestamp)),
					E('td', { 'class': 'td' }, h.score + '/100'),
					E('td', { 'class': 'td' }, E('span', {
						'style': 'color:' + getGradeColor(h.grade) + '; font-weight:bold'
					}, h.grade)),
					E('td', { 'class': 'td' }, E('span', {
						'style': 'color:' + getRiskColor(h.risk_level) + '; text-transform:capitalize'
					}, h.risk_level))
				]));
			});

			view.appendChild(historyTable);
		}

		return KissTheme.wrap([view], 'admin/secubox/security/config-advisor');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
