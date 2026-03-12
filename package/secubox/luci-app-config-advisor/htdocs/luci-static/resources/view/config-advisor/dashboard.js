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
		case 'A': return 'green';
		case 'B': return 'cyan';
		case 'C': return 'orange';
		case 'D': return 'orange';
		case 'F': return 'red';
		default: return 'muted';
	}
}

function getRiskColor(level) {
	switch(level) {
		case 'minimal': return 'green';
		case 'low': return 'cyan';
		case 'medium': return 'orange';
		case 'high': return 'orange';
		case 'critical': return 'red';
		default: return 'muted';
	}
}

function getStatusBadge(status) {
	switch(status) {
		case 'pass': return KissTheme.badge('PASS', 'green');
		case 'fail': return KissTheme.badge('FAIL', 'red');
		case 'warn': return KissTheme.badge('WARN', 'orange');
		case 'info': return KissTheme.badge('INFO', 'blue');
		default: return KissTheme.badge('N/A', 'muted');
	}
}

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callResults(),
			callHistory(10)
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var gradeColor = {
			'A': c.green, 'B': c.cyan, 'C': c.orange, 'D': c.orange, 'F': c.red
		}[status.grade] || c.muted;
		var riskColor = {
			'minimal': c.green, 'low': c.cyan, 'medium': c.orange, 'high': c.orange, 'critical': c.red
		}[status.risk_level] || c.muted;

		return [
			KissTheme.stat(status.grade || '?', 'Grade', gradeColor),
			KissTheme.stat((status.score || 0) + '/100', 'Score', c.blue),
			KissTheme.stat((status.compliance_rate || 0) + '%', 'Compliance', c.purple),
			KissTheme.stat((status.risk_level || 'Unknown').charAt(0).toUpperCase() + (status.risk_level || 'Unknown').slice(1), 'Risk', riskColor)
		];
	},

	renderResultsTable: function(results) {
		if (results.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No check results available. Run a security check first.');
		}

		var rows = results.map(function(r) {
			return E('tr', {}, [
				E('td', { 'style': 'text-align: center;' }, getStatusBadge(r.status)),
				E('td', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, r.id || '-'),
				E('td', {}, r.message || '-'),
				E('td', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, r.details || '-')
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', { 'style': 'width: 80px;' }, 'Status'),
					E('th', { 'style': 'width: 150px;' }, 'Check ID'),
					E('th', {}, 'Message'),
					E('th', {}, 'Details')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	renderHistoryTable: function(history) {
		if (history.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No history available.');
		}

		var rows = history.slice().reverse().map(function(h) {
			return E('tr', {}, [
				E('td', { 'style': 'color: var(--kiss-muted);' }, formatTimestamp(h.timestamp)),
				E('td', {}, h.score + '/100'),
				E('td', {}, KissTheme.badge(h.grade, getGradeColor(h.grade))),
				E('td', {}, KissTheme.badge(h.risk_level, getRiskColor(h.risk_level)))
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Date'),
					E('th', {}, 'Score'),
					E('th', {}, 'Grade'),
					E('th', {}, 'Risk Level')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var resultsData = data[1] || {};
		var historyData = data[2] || {};

		var results = resultsData.results || [];
		var history = historyData.history || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Config Advisor'),
					KissTheme.badge(status.grade || '?', getGradeColor(status.grade))
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'ANSSI CSPN compliance checking and security configuration analysis')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Run Check Button
			E('div', { 'style': 'margin: 20px 0;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, function() {
						ui.showModal('Running Security Check', [
							E('p', { 'class': 'spinning' }, 'Analyzing system configuration...')
						]);
						return callCheck().then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Security check completed.'), 'success');
							window.location.reload();
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Check failed: ' + err.message), 'error');
						});
					})
				}, 'Run Security Check'),
				E('span', { 'style': 'margin-left: 16px; color: var(--kiss-muted); font-size: 12px;' },
					'Last check: ' + formatTimestamp(status.last_check))
			]),

			// Results Table
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Check Results'),
					KissTheme.badge(results.length + ' checks', 'blue')
				]),
				this.renderResultsTable(results)
			),

			// Score History
			history.length > 0 ? KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Score History'),
					KissTheme.badge(history.length + ' entries', 'purple')
				]),
				this.renderHistoryTable(history)
			) : ''
		];

		return KissTheme.wrap(content, 'admin/secubox/security/config-advisor');
	}
});
