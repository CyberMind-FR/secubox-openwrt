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
		critical: '#e74c3c',
		high: '#e67e22',
		medium: '#f1c40f',
		low: '#3498db'
	};
	var color = colors[severity] || '#95a5a6';
	return E('span', {
		'style': 'display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;color:#fff;background:' + color
	}, severity || 'unknown');
}

function trustBadge(trust) {
	var colors = {
		direct: '#27ae60',
		transitive: '#f39c12',
		unknown: '#95a5a6',
		self: '#3498db'
	};
	var icons = {
		direct: '\u2714',
		transitive: '\u2194',
		unknown: '?',
		self: '\u2605'
	};
	var color = colors[trust] || '#95a5a6';
	return E('span', {
		'style': 'display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;color:#fff;background:' + color
	}, (icons[trust] || '') + ' ' + (trust || 'unknown'));
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

		var content = E('div', { 'class': 'cbi-map', 'style': 'padding:20px;' }, [
			this.renderHeader(),
			this.renderSummaryCards(),
			this.renderActions(),
			this.renderPeerTable(),
			this.renderIOCTable()
		]);

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

		return KissTheme.wrap(content, 'admin/secubox/p2p/threat-hub');
	},

	renderHeader: function() {
		var enabled = this.status.enabled !== false;
		return E('div', { 'style': 'margin-bottom:24px;' }, [
			E('h2', { 'style': 'margin:0 0 8px;color:#ecf0f1;font-size:24px;' },
				'Threat Intelligence Hub'),
			E('p', { 'style': 'margin:0;color:#95a5a6;font-size:14px;' },
				'Decentralized IOC sharing across mesh nodes via CrowdSec + mitmproxy'),
			E('div', { 'style': 'margin-top:8px;' }, [
				E('span', {
					'style': 'display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;color:#fff;background:' + (enabled ? '#27ae60' : '#e74c3c')
				}, enabled ? 'ACTIVE' : 'DISABLED'),
				this.status.auto_apply ?
					E('span', { 'style': 'display:inline-block;margin-left:8px;padding:4px 12px;border-radius:12px;font-size:12px;color:#fff;background:#2980b9;' }, 'Auto-Apply ON') : null
			])
		]);
	},

	renderSummaryCards: function() {
		var s = this.status;
		var cards = [
			{ id: 'card-local', label: 'Local IOCs Shared', value: s.local_iocs || 0, icon: '\uD83D\uDCE4', color: '#3498db' },
			{ id: 'card-received', label: 'Received from Mesh', value: s.received_iocs || 0, icon: '\uD83D\uDCE5', color: '#e67e22' },
			{ id: 'card-applied', label: 'Applied to Firewall', value: s.applied_iocs || 0, icon: '\uD83D\uDEE1', color: '#27ae60' },
			{ id: 'card-peers', label: 'Peer Contributors', value: s.peer_contributors || 0, icon: '\uD83D\uDC65', color: '#9b59b6' },
			{ id: 'card-chain', label: 'Chain Blocks', value: s.chain_threat_blocks || 0, icon: '\u26D3', color: '#1abc9c' }
		];

		return E('div', {
			'id': 'summary-cards',
			'style': 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:24px;'
		}, cards.map(function(c) {
			return E('div', {
				'id': c.id,
				'style': 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center;border-left:4px solid ' + c.color + ';'
			}, [
				E('div', { 'style': 'font-size:28px;margin-bottom:4px;' }, c.icon),
				E('div', {
					'class': 'card-value',
					'style': 'font-size:32px;font-weight:bold;color:' + c.color + ';'
				}, String(c.value)),
				E('div', { 'style': 'font-size:12px;color:#95a5a6;margin-top:4px;' }, c.label)
			]);
		}));
	},

	renderActions: function() {
		var self = this;

		var publishBtn = E('button', {
			'class': 'cbi-button cbi-button-action',
			'style': 'margin-right:12px;padding:8px 20px;',
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
		}, 'Publish Now');

		var applyBtn = E('button', {
			'class': 'cbi-button cbi-button-apply',
			'style': 'padding:8px 20px;',
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
		}, 'Apply Pending');

		return E('div', { 'style': 'margin-bottom:24px;padding:16px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.08);' }, [
			E('h3', { 'style': 'margin:0 0 12px;color:#ecf0f1;font-size:16px;' }, 'Actions'),
			E('div', {}, [publishBtn, applyBtn])
		]);
	},

	renderPeerTable: function() {
		var peers = this.peers || [];

		var rows = peers.map(function(p) {
			return E('tr', {}, [
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;font-size:13px;color:#ecf0f1;' },
					(p.node || '').substring(0, 12) + '...'),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' },
					trustBadge(p.trust)),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#ecf0f1;text-align:center;' },
					String(p.ioc_count || 0)),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#ecf0f1;text-align:center;' },
					String(p.applied_count || 0)),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
					timeAgo(p.last_seen))
			]);
		});

		if (rows.length === 0) {
			rows = [E('tr', {}, [
				E('td', { 'colspan': '5', 'style': 'padding:24px;text-align:center;color:#95a5a6;' },
					'No peer contributions yet. IOCs from mesh nodes will appear here after sync.')
			])];
		}

		return E('div', { 'style': 'margin-bottom:24px;' }, [
			E('h3', { 'style': 'margin:0 0 12px;color:#ecf0f1;font-size:16px;' }, 'Peer Contributions'),
			E('div', { 'style': 'overflow-x:auto;' }, [
				E('table', {
					'id': 'peer-table',
					'class': 'table',
					'style': 'width:100%;border-collapse:collapse;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.08);'
				}, [
					E('thead', {}, [
						E('tr', { 'style': 'background:rgba(255,255,255,0.05);' }, [
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Node'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Trust'),
							E('th', { 'style': 'padding:10px 12px;text-align:center;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'IOCs'),
							E('th', { 'style': 'padding:10px 12px;text-align:center;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Applied'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Last Seen')
						])
					]),
					E('tbody', {}, rows)
				])
			])
		]);
	},

	renderIOCTable: function() {
		var iocs = this.iocs || [];

		var rows = iocs.slice(0, 50).map(function(ioc) {
			return E('tr', {}, [
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;font-size:13px;color:#ecf0f1;' },
					ioc.ip || '-'),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' },
					severityBadge(ioc.severity)),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
					ioc.source || '-'),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
					ioc.scenario || '-'),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;font-size:11px;color:#7f8c8d;' },
					(ioc.node || '').substring(0, 12)),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' },
					trustBadge(ioc.trust)),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;' },
					ioc.applied ?
						E('span', { 'style': 'color:#27ae60;font-weight:bold;' }, '\u2714') :
						E('span', { 'style': 'color:#95a5a6;' }, '\u2013')),
				E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
					timeAgo(ioc.ts))
			]);
		});

		if (rows.length === 0) {
			rows = [E('tr', {}, [
				E('td', { 'colspan': '8', 'style': 'padding:24px;text-align:center;color:#95a5a6;' },
					'No IOCs received from mesh yet.')
			])];
		}

		return E('div', {}, [
			E('h3', { 'style': 'margin:0 0 4px;color:#ecf0f1;font-size:16px;' }, 'Received IOCs'),
			E('p', { 'style': 'margin:0 0 12px;color:#7f8c8d;font-size:12px;' },
				'Showing up to 50 most recent. Total: ' + (this.iocs || []).length),
			E('div', { 'style': 'overflow-x:auto;' }, [
				E('table', {
					'id': 'ioc-table',
					'class': 'table',
					'style': 'width:100%;border-collapse:collapse;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.08);'
				}, [
					E('thead', {}, [
						E('tr', { 'style': 'background:rgba(255,255,255,0.05);' }, [
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'IP'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Severity'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Source'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Scenario'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Origin'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Trust'),
							E('th', { 'style': 'padding:10px 12px;text-align:center;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Applied'),
							E('th', { 'style': 'padding:10px 12px;text-align:left;color:#95a5a6;font-size:12px;text-transform:uppercase;' }, 'Age')
						])
					]),
					E('tbody', {}, rows)
				])
			])
		]);
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
				E('td', { 'colspan': '5', 'style': 'padding:24px;text-align:center;color:#95a5a6;' },
					'No peer contributions yet.')
			]) :
			peers.map(function(p) {
				return E('tr', {}, [
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;font-size:13px;color:#ecf0f1;' },
						(p.node || '').substring(0, 12) + '...'),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' },
						trustBadge(p.trust)),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#ecf0f1;text-align:center;' },
						String(p.ioc_count || 0)),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#ecf0f1;text-align:center;' },
						String(p.applied_count || 0)),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
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
		var countEl = table.parentNode.parentNode.querySelector('p');
		if (countEl) countEl.textContent = 'Showing up to 50 most recent. Total: ' + (this.iocs || []).length;

		dom.content(tbody, iocs.length === 0 ?
			E('tr', {}, [
				E('td', { 'colspan': '8', 'style': 'padding:24px;text-align:center;color:#95a5a6;' },
					'No IOCs received from mesh yet.')
			]) :
			iocs.map(function(ioc) {
				return E('tr', {}, [
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;font-size:13px;color:#ecf0f1;' },
						ioc.ip || '-'),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' },
						severityBadge(ioc.severity)),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
						ioc.source || '-'),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
						ioc.scenario || '-'),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;font-size:11px;color:#7f8c8d;' },
						(ioc.node || '').substring(0, 12)),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);' },
						trustBadge(ioc.trust)),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;' },
						ioc.applied ?
							E('span', { 'style': 'color:#27ae60;font-weight:bold;' }, '\u2714') :
							E('span', { 'style': 'color:#95a5a6;' }, '\u2013')),
					E('td', { 'style': 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);color:#95a5a6;font-size:12px;' },
						timeAgo(ioc.ts))
				]);
			})
		);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
