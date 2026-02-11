'use strict';
'require view';
'require rpc';
'require ui';

var callResults = rpc.declare({
	object: 'luci.config-advisor',
	method: 'results',
	expect: {}
});

var callPending = rpc.declare({
	object: 'luci.config-advisor',
	method: 'pending',
	expect: {}
});

var callSuggest = rpc.declare({
	object: 'luci.config-advisor',
	method: 'suggest',
	params: ['check_id'],
	expect: {}
});

var callRemediate = rpc.declare({
	object: 'luci.config-advisor',
	method: 'remediate',
	params: ['check_id', 'dry_run'],
	expect: {}
});

var callRemediateSafe = rpc.declare({
	object: 'luci.config-advisor',
	method: 'remediate_safe',
	params: ['dry_run'],
	expect: {}
});

// Checks with available remediations
var remediableChecks = ['NET-002', 'NET-004', 'FW-001', 'FW-002', 'AUTH-003', 'CRYPT-001', 'LOG-002'];
var safeChecks = ['NET-004', 'FW-002', 'CRYPT-001', 'LOG-002'];

function getStatusColor(status) {
	switch(status) {
		case 'pass': return '#22c55e';
		case 'fail': return '#ef4444';
		case 'warn': return '#eab308';
		default: return '#6b7280';
	}
}

return view.extend({
	load: function() {
		return Promise.all([
			callResults(),
			callPending()
		]);
	},

	render: function(data) {
		var resultsData = data[0] || {};
		var pendingData = data[1] || {};

		var results = resultsData.results || [];
		var pending = pendingData.pending || [];

		// Filter to failed/warn checks
		var failedChecks = results.filter(function(r) {
			return r.status === 'fail' || r.status === 'warn';
		});

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Security Remediation'),
			E('p', { 'class': 'cbi-map-descr' },
				'Apply automated fixes for failed security checks.')
		]);

		// Quick Actions
		view.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:8px; padding:1.5rem; margin-bottom:2rem;'
		}, [
			E('h3', { 'style': 'margin-top:0' }, 'Quick Actions'),
			E('p', { 'style': 'color:#94a3b8; margin-bottom:1rem' },
				'Safe remediations are non-destructive changes that can be applied without risk.'),
			E('div', { 'style': 'display:flex; gap:1rem; flex-wrap:wrap;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.createHandlerFn(this, function() {
						return callRemediateSafe(true).then(function(res) {
							var msg = 'Dry run: Would apply ' + (res.applied || 0) + ' safe fixes.';
							ui.addNotification(null, E('p', msg));
						});
					})
				}, 'Preview Safe Fixes'),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': ui.createHandlerFn(this, function() {
						if (!confirm('Apply all safe remediations?')) return;
						return callRemediateSafe(false).then(function(res) {
							var msg = 'Applied ' + (res.applied || 0) + ' safe fixes.';
							ui.addNotification(null, E('p', msg));
							window.location.reload();
						});
					})
				}, 'Apply Safe Fixes')
			])
		]));

		// Failed Checks
		view.appendChild(E('h3', {}, 'Failed Checks (' + failedChecks.length + ')'));

		if (failedChecks.length === 0) {
			view.appendChild(E('div', {
				'style': 'background:#166534; border-radius:8px; padding:1.5rem; text-align:center;'
			}, [
				E('span', { 'style': 'font-size:48px;' }, '&#x2714;'),
				E('p', { 'style': 'margin:1rem 0 0; color:#f1f5f9;' }, 'All security checks passed!')
			]));
		} else {
			var table = E('table', { 'class': 'table', 'style': 'width:100%' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'Check ID'),
					E('th', { 'class': 'th' }, 'Status'),
					E('th', { 'class': 'th' }, 'Message'),
					E('th', { 'class': 'th' }, 'Actions')
				])
			]);

			var self = this;
			failedChecks.forEach(function(check) {
				var hasRemediation = remediableChecks.indexOf(check.id) !== -1;
				var isSafe = safeChecks.indexOf(check.id) !== -1;

				var actions = [];

				if (hasRemediation) {
					actions.push(E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'margin-right:0.5rem;',
						'click': ui.createHandlerFn(self, function() {
							return callRemediate(check.id, true).then(function(res) {
								if (res.error) {
									ui.addNotification(null, E('p', { 'style': 'color:#ef4444' }, res.error));
								} else {
									ui.addNotification(null, E('p', 'Preview: ' + (res.action || res)));
								}
							});
						})
					}, 'Preview'));

					actions.push(E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(self, function() {
							if (!confirm('Apply remediation for ' + check.id + '?')) return;
							return callRemediate(check.id, false).then(function(res) {
								if (res.error) {
									ui.addNotification(null, E('p', { 'style': 'color:#ef4444' }, res.error));
								} else {
									ui.addNotification(null, E('p', 'Applied: ' + (res.action || 'Remediation applied')));
									window.location.reload();
								}
							});
						})
					}, isSafe ? 'Apply (Safe)' : 'Apply'));
				}

				actions.push(E('button', {
					'class': 'cbi-button',
					'style': 'margin-left:0.5rem;',
					'click': ui.createHandlerFn(self, function() {
						return callSuggest(check.id).then(function(res) {
							var suggestion = res.suggestion || 'No suggestion available';
							var source = res.source || 'unknown';
							ui.showModal('Remediation Suggestion', [
								E('p', {}, [
									E('strong', {}, 'Check: '), check.id
								]),
								E('p', {}, [
									E('strong', {}, 'Source: '), source
								]),
								E('div', {
									'style': 'background:#1e293b; padding:1rem; border-radius:4px; margin-top:1rem;'
								}, suggestion),
								E('div', { 'class': 'right', 'style': 'margin-top:1rem;' }, [
									E('button', {
										'class': 'cbi-button',
										'click': ui.hideModal
									}, 'Close')
								])
							]);
						});
					})
				}, 'Suggest'));

				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, E('code', {}, check.id)),
					E('td', { 'class': 'td' }, E('span', {
						'style': 'color:' + getStatusColor(check.status) + '; text-transform:uppercase;'
					}, check.status)),
					E('td', { 'class': 'td' }, check.message || '-'),
					E('td', { 'class': 'td' }, actions)
				]));
			});

			view.appendChild(table);
		}

		// Pending Remediations
		if (pending.length > 0) {
			view.appendChild(E('h3', { 'style': 'margin-top:2rem' }, 'Pending Approvals'));

			var pendingTable = E('table', { 'class': 'table', 'style': 'width:100%' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'Check ID'),
					E('th', { 'class': 'th' }, 'Action'),
					E('th', { 'class': 'th' }, 'Queued'),
					E('th', { 'class': 'th' }, 'Status')
				])
			]);

			pending.forEach(function(p) {
				pendingTable.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, E('code', {}, p.check_id)),
					E('td', { 'class': 'td' }, p.action || '-'),
					E('td', { 'class': 'td' }, new Date(p.queued_at * 1000).toLocaleString()),
					E('td', { 'class': 'td' }, E('span', {
						'style': 'color:#eab308; text-transform:uppercase;'
					}, p.status || 'pending'))
				]));
			});

			view.appendChild(pendingTable);
		}

		// Legend
		view.appendChild(E('div', {
			'style': 'background:#1e293b; border-radius:8px; padding:1rem; margin-top:2rem;'
		}, [
			E('h4', { 'style': 'margin-top:0' }, 'Available Remediations'),
			E('ul', { 'style': 'color:#94a3b8; margin:0; padding-left:1.5rem;' }, [
				E('li', {}, E('strong', {}, 'NET-002: '), 'Restrict management access to LAN'),
				E('li', {}, E('strong', {}, 'NET-004: '), 'Enable SYN flood protection'),
				E('li', {}, E('strong', {}, 'FW-001: '), 'Set default deny policy on WAN'),
				E('li', {}, E('strong', {}, 'FW-002: '), 'Enable drop invalid packets'),
				E('li', {}, E('strong', {}, 'AUTH-003: '), 'Disable SSH password auth (requires SSH keys)'),
				E('li', {}, E('strong', {}, 'CRYPT-001: '), 'Enable HTTPS redirect'),
				E('li', {}, E('strong', {}, 'LOG-002: '), 'Configure log rotation')
			])
		]));

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
