'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require request';
'require secubox/kiss-theme';

var API_BASE = window.location.protocol + '//' + window.location.hostname + ':7331/api/threat-intel';

function fetchJSON(endpoint) {
	return request.get(API_BASE + '/' + endpoint, { timeout: 10000 })
		.then(function(res) {
			try { return res.json(); }
			catch(e) { return null; }
		})
		.catch(function() { return null; });
}

function postJSON(endpoint) {
	return request.post(API_BASE + '/' + endpoint, null, { timeout: 15000 })
		.then(function(res) {
			try { return res.json(); }
			catch(e) { return null; }
		})
		.catch(function() { return null; });
}

function timeAgo(ts) {
	if (!ts || ts === 0) return 'Never';
	var now = Math.floor(Date.now() / 1000);
	var diff = now - ts;
	if (diff < 60) return diff + 's ago';
	if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
	if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
	return Math.floor(diff / 86400) + 'd ago';
}

function severityBadge(severity) {
	var colors = {
		critical: 'red',
		high: 'orange',
		medium: 'purple',
		low: 'blue'
	};
	var colorType = colors[severity] || 'muted';
	return KissTheme.badge(severity || 'unknown', colorType);
}

function trustBadge(trust) {
	var colors = {
		direct: 'green',
		transitive: 'orange',
		unknown: 'muted',
		self: 'blue'
	};
	var icons = {
		direct: '\u2714',
		transitive: '\u2194',
		unknown: '?',
		self: '\u2605'
	};
	var colorType = colors[trust] || 'muted';
	return KissTheme.badge((icons[trust] || '') + ' ' + (trust || 'unknown'), colorType);
}

return view.extend({
	status: null,
	iocs: [],
	peers: [],

	load: function() {
		return Promise.all([
			fetchJSON('status'),
			fetchJSON('iocs'),
			fetchJSON('peers')
		]);
	},

	render: function(data) {
		this.status = data[0] || {};
		this.iocs = data[1] || [];
		this.peers = data[2] || [];

		var self = this;

		poll.add(function() {
			return Promise.all([
				fetchJSON('status'),
				fetchJSON('iocs'),
				fetchJSON('peers')
			]).then(function(fresh) {
				self.status = fresh[0] || self.status;
				self.iocs = fresh[1] || self.iocs;
				self.peers = fresh[2] || self.peers;
				self.updateCards();
				self.updatePeerTable();
				self.updateIOCTable();
			});
		}, 30);

		var content = [
			this.renderHeader(),
			this.renderSummaryCards(),
			this.renderActions(),
			this.renderPeerTable(),
			this.renderIOCTable()
		];

		return KissTheme.wrap(content, 'admin/secubox/p2p/threat-hub');
	},

	renderHeader: function() {
		var enabled = this.status.enabled !== false;
		return E('div', { 'style': 'margin-bottom: 24px;' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Threat Intelligence Hub'),
				KissTheme.badge(enabled ? 'Active' : 'Disabled', enabled ? 'green' : 'red'),
				this.status.auto_apply ? KissTheme.badge('Auto-Apply ON', 'blue') : null
			]),
			E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
				'Decentralized IOC sharing across mesh nodes via CrowdSec + mitmproxy')
		]);
	},

	renderStats: function() {
		var s = this.status;
		var c = KissTheme.colors;
		return [
			KissTheme.stat(s.local_iocs || 0, 'Local IOCs Shared', c.blue),
			KissTheme.stat(s.received_iocs || 0, 'Received from Mesh', c.orange),
			KissTheme.stat(s.applied_iocs || 0, 'Applied to Firewall', c.green),
			KissTheme.stat(s.peer_contributors || 0, 'Peer Contributors', c.purple)
		];
	},

	renderSummaryCards: function() {
		var s = this.status;
		var c = KissTheme.colors;
		var cards = [
			{ id: 'card-local', label: 'Local IOCs Shared', value: s.local_iocs || 0, color: c.blue },
			{ id: 'card-received', label: 'Received from Mesh', value: s.received_iocs || 0, color: c.orange },
			{ id: 'card-applied', label: 'Applied to Firewall', value: s.applied_iocs || 0, color: c.green },
			{ id: 'card-peers', label: 'Peer Contributors', value: s.peer_contributors || 0, color: c.purple },
			{ id: 'card-chain', label: 'Chain Blocks', value: s.chain_threat_blocks || 0, color: c.cyan }
		];

		return E('div', {
			'id': 'summary-cards',
			'class': 'kiss-grid kiss-grid-4',
			'style': 'margin-bottom: 24px;'
		}, cards.map(function(card) {
			return E('div', {
				'id': card.id,
				'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 12px; ' +
					'padding: 16px; text-align: center; border-left: 4px solid ' + card.color + ';'
			}, [
				E('div', {
					'class': 'card-value',
					'style': 'font-size: 32px; font-weight: bold; color: ' + card.color + ';'
				}, String(card.value)),
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-top: 4px;' }, card.label)
			]);
		}));
	},

	renderActions: function() {
		var self = this;

		return KissTheme.card('Actions',
			E('div', { 'style': 'display: flex; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() {
						this.disabled = true;
						this.textContent = 'Publishing...';
						var btn = this;
						postJSON('publish').then(function(res) {
							btn.disabled = false;
							btn.textContent = 'Publish Now';
							if (res && res.success)
								ui.addNotification(null, E('p', 'Published ' + (res.published || 0) + ' IOCs to chain'), 'info');
							else
								ui.addNotification(null, E('p', 'Publish failed'), 'error');
						});
					}
				}, 'Publish Now'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						this.disabled = true;
						this.textContent = 'Applying...';
						var btn = this;
						postJSON('apply').then(function(res) {
							btn.disabled = false;
							btn.textContent = 'Apply Pending';
							if (res && res.success)
								ui.addNotification(null, E('p', 'Applied ' + (res.applied || 0) + ' IOCs, skipped ' + (res.skipped || 0)), 'info');
							else
								ui.addNotification(null, E('p', 'Apply failed'), 'error');
						});
					}
				}, 'Apply Pending')
			])
		);
	},

	renderPeerTable: function() {
		var peers = this.peers || [];

		var rows = peers.map(function(p) {
			return E('tr', {}, [
				E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 13px;' },
					(p.node || '').substring(0, 12) + '...'),
				E('td', { 'style': 'padding: 10px 12px;' },
					trustBadge(p.trust)),
				E('td', { 'style': 'padding: 10px 12px; text-align: center;' },
					String(p.ioc_count || 0)),
				E('td', { 'style': 'padding: 10px 12px; text-align: center;' },
					String(p.applied_count || 0)),
				E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
					timeAgo(p.last_seen))
			]);
		});

		var tableContent;
		if (rows.length === 0) {
			tableContent = E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 24px;' },
				'No peer contributions yet. IOCs from mesh nodes will appear here after sync.');
		} else {
			tableContent = E('table', { 'id': 'peer-table', 'class': 'kiss-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', { 'style': 'padding: 10px 12px;' }, 'Node'),
					E('th', { 'style': 'padding: 10px 12px;' }, 'Trust'),
					E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, 'IOCs'),
					E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, 'Applied'),
					E('th', { 'style': 'padding: 10px 12px;' }, 'Last Seen')
				])),
				E('tbody', {}, rows)
			]);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Peer Contributions'),
				KissTheme.badge(peers.length + ' peers', 'purple')
			]),
			tableContent
		);
	},

	renderIOCTable: function() {
		var iocs = this.iocs || [];
		var c = KissTheme.colors;

		var rows = iocs.slice(0, 50).map(function(ioc) {
			return E('tr', {}, [
				E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 13px;' },
					ioc.ip || '-'),
				E('td', { 'style': 'padding: 10px 12px;' },
					severityBadge(ioc.severity)),
				E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
					ioc.source || '-'),
				E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
					ioc.scenario || '-'),
				E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 11px; color: var(--kiss-muted);' },
					(ioc.node || '').substring(0, 12)),
				E('td', { 'style': 'padding: 10px 12px;' },
					trustBadge(ioc.trust)),
				E('td', { 'style': 'padding: 10px 12px; text-align: center;' },
					ioc.applied ?
						E('span', { 'style': 'color: ' + c.green + '; font-weight: bold;' }, '\u2714') :
						E('span', { 'style': 'color: var(--kiss-muted);' }, '\u2013')),
				E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
					timeAgo(ioc.ts))
			]);
		});

		var tableContent;
		if (rows.length === 0) {
			tableContent = E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 24px;' },
				'No IOCs received from mesh yet.');
		} else {
			tableContent = E('div', {}, [
				E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0 0 12px 0;' },
					'Showing up to 50 most recent. Total: ' + (this.iocs || []).length),
				E('div', { 'style': 'overflow-x: auto;' }, [
					E('table', { 'id': 'ioc-table', 'class': 'kiss-table' }, [
						E('thead', {}, E('tr', {}, [
							E('th', { 'style': 'padding: 10px 12px;' }, 'IP'),
							E('th', { 'style': 'padding: 10px 12px;' }, 'Severity'),
							E('th', { 'style': 'padding: 10px 12px;' }, 'Source'),
							E('th', { 'style': 'padding: 10px 12px;' }, 'Scenario'),
							E('th', { 'style': 'padding: 10px 12px;' }, 'Origin'),
							E('th', { 'style': 'padding: 10px 12px;' }, 'Trust'),
							E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, 'Applied'),
							E('th', { 'style': 'padding: 10px 12px;' }, 'Age')
						])),
						E('tbody', {}, rows)
					])
				])
			]);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Received IOCs'),
				KissTheme.badge(iocs.length + ' total', 'orange')
			]),
			tableContent
		);
	},

	updateCards: function() {
		var s = this.status || {};
		var mapping = {
			'card-local': s.local_iocs || 0,
			'card-received': s.received_iocs || 0,
			'card-applied': s.applied_iocs || 0,
			'card-peers': s.peer_contributors || 0,
			'card-chain': s.chain_threat_blocks || 0
		};

		Object.keys(mapping).forEach(function(id) {
			var card = document.getElementById(id);
			if (card) {
				var valEl = card.querySelector('.card-value');
				if (valEl) valEl.textContent = String(mapping[id]);
			}
		});
	},

	updatePeerTable: function() {
		var table = document.getElementById('peer-table');
		if (!table) return;
		var tbody = table.querySelector('tbody');
		if (!tbody) return;

		var peers = this.peers || [];
		dom.content(tbody, peers.length === 0 ?
			E('tr', {}, [
				E('td', { 'colspan': '5', 'style': 'padding: 24px; text-align: center; color: var(--kiss-muted);' },
					'No peer contributions yet.')
			]) :
			peers.map(function(p) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 13px;' },
						(p.node || '').substring(0, 12) + '...'),
					E('td', { 'style': 'padding: 10px 12px;' },
						trustBadge(p.trust)),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' },
						String(p.ioc_count || 0)),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' },
						String(p.applied_count || 0)),
					E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
						timeAgo(p.last_seen))
				]);
			})
		);
	},

	updateIOCTable: function() {
		var table = document.getElementById('ioc-table');
		if (!table) return;
		var tbody = table.querySelector('tbody');
		if (!tbody) return;

		var iocs = (this.iocs || []).slice(0, 50);
		var c = KissTheme.colors;
		var countEl = table.parentNode.parentNode.querySelector('p');
		if (countEl) countEl.textContent = 'Showing up to 50 most recent. Total: ' + (this.iocs || []).length;

		dom.content(tbody, iocs.length === 0 ?
			E('tr', {}, [
				E('td', { 'colspan': '8', 'style': 'padding: 24px; text-align: center; color: var(--kiss-muted);' },
					'No IOCs received from mesh yet.')
			]) :
			iocs.map(function(ioc) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 13px;' },
						ioc.ip || '-'),
					E('td', { 'style': 'padding: 10px 12px;' },
						severityBadge(ioc.severity)),
					E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
						ioc.source || '-'),
					E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
						ioc.scenario || '-'),
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 11px; color: var(--kiss-muted);' },
						(ioc.node || '').substring(0, 12)),
					E('td', { 'style': 'padding: 10px 12px;' },
						trustBadge(ioc.trust)),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' },
						ioc.applied ?
							E('span', { 'style': 'color: ' + c.green + '; font-weight: bold;' }, '\u2714') :
							E('span', { 'style': 'color: var(--kiss-muted);' }, '\u2013')),
					E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-muted); font-size: 12px;' },
						timeAgo(ioc.ts))
				]);
			})
		);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
