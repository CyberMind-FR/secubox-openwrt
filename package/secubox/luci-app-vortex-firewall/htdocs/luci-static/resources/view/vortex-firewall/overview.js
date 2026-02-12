'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'status',
	expect: {}
});

var callGetStats = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'get_stats',
	expect: {}
});

var callGetFeeds = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'get_feeds',
	expect: {}
});

var callGetBlocked = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'get_blocked',
	params: ['limit'],
	expect: {}
});

var callSearch = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'search',
	params: ['domain'],
	expect: {}
});

var callUpdateFeeds = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'update_feeds',
	expect: {}
});

var callBlockDomain = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'block_domain',
	params: ['domain', 'reason'],
	expect: {}
});

var callUnblockDomain = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'unblock_domain',
	params: ['domain'],
	expect: {}
});

function formatNumber(n) {
	if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
	if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
	return String(n || 0);
}

function getThreatBadge(threat) {
	var colors = {
		'malware': '#e74c3c',
		'phishing': '#f39c12',
		'c2': '#9b59b6',
		'spam': '#95a5a6',
		'manual': '#3498db',
		'dnsguard': '#1abc9c'
	};
	var color = colors[threat] || '#7f8c8d';
	return E('span', {
		'style': 'background:' + color + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;'
	}, threat || 'unknown');
}

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callGetStats(),
			callGetFeeds(),
			callGetBlocked(50)
		]);
	},

	renderStatusCards: function(status, stats) {
		var active = status.active;
		var domains = stats.domains || 0;
		var hits = stats.hits || 0;
		var x47 = stats.x47_impact || 0;

		return E('div', { 'class': 'vf-cards' }, [
			E('div', { 'class': 'vf-card' }, [
				E('div', { 'class': 'vf-card-icon', 'style': 'background:' + (active ? '#27ae60' : '#e74c3c') },
					active ? '\u2713' : '\u2717'),
				E('div', { 'class': 'vf-card-content' }, [
					E('div', { 'class': 'vf-card-value' }, active ? 'Active' : 'Inactive'),
					E('div', { 'class': 'vf-card-label' }, 'Firewall Status')
				])
			]),
			E('div', { 'class': 'vf-card' }, [
				E('div', { 'class': 'vf-card-icon', 'style': 'background:#3498db' }, '\uD83D\uDEE1'),
				E('div', { 'class': 'vf-card-content' }, [
					E('div', { 'class': 'vf-card-value', 'data-stat': 'domains' }, formatNumber(domains)),
					E('div', { 'class': 'vf-card-label' }, 'Blocked Domains')
				])
			]),
			E('div', { 'class': 'vf-card' }, [
				E('div', { 'class': 'vf-card-icon', 'style': 'background:#e74c3c' }, '\uD83D\uDEAB'),
				E('div', { 'class': 'vf-card-content' }, [
					E('div', { 'class': 'vf-card-value', 'data-stat': 'hits' }, formatNumber(hits)),
					E('div', { 'class': 'vf-card-label' }, 'Total Blocks')
				])
			]),
			E('div', { 'class': 'vf-card vf-card-highlight' }, [
				E('div', { 'class': 'vf-card-icon', 'style': 'background:#9b59b6' }, '\u00D747'),
				E('div', { 'class': 'vf-card-content' }, [
					E('div', { 'class': 'vf-card-value', 'data-stat': 'x47' }, formatNumber(x47)),
					E('div', { 'class': 'vf-card-label' }, 'Connections Prevented')
				])
			])
		]);
	},

	renderQuickActions: function() {
		var self = this;

		return E('div', { 'class': 'vf-section' }, [
			E('h3', {}, 'Quick Actions'),
			E('div', { 'class': 'vf-actions' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.handleUpdateFeeds(); }
				}, '\uD83D\uDD04 Update Feeds'),
				E('button', {
					'class': 'cbi-button cbi-button-add',
					'click': function() { self.handleBlockDomain(); }
				}, '\u2795 Block Domain'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { self.handleSearchDomain(); }
				}, '\uD83D\uDD0D Search Domain')
			])
		]);
	},

	renderFeedsTable: function(feeds) {
		var feedList = feeds.feeds || [];

		var rows = feedList.map(function(feed) {
			return E('tr', {}, [
				E('td', {}, feed.name || '-'),
				E('td', { 'style': 'text-align:right' }, formatNumber(feed.domains)),
				E('td', {}, feed.updated || '-'),
				E('td', {}, E('span', {
					'style': 'color:' + (feed.enabled ? '#27ae60' : '#e74c3c')
				}, feed.enabled ? '\u2713 Enabled' : '\u2717 Disabled'))
			]);
		});

		if (rows.length === 0) {
			rows.push(E('tr', {}, [
				E('td', { 'colspan': '4', 'style': 'text-align:center;color:#999' }, 'No feeds configured')
			]));
		}

		return E('div', { 'class': 'vf-section' }, [
			E('h3', {}, 'Threat Intelligence Feeds'),
			E('table', { 'class': 'table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Feed'),
					E('th', { 'style': 'text-align:right' }, 'Domains'),
					E('th', {}, 'Last Update'),
					E('th', {}, 'Status')
				])),
				E('tbody', {}, rows)
			])
		]);
	},

	renderBlockedTable: function(blocked) {
		var domainList = blocked.domains || [];

		var rows = domainList.slice(0, 25).map(function(d) {
			return E('tr', {}, [
				E('td', { 'style': 'font-family:monospace;font-size:12px' }, d.domain || '-'),
				E('td', {}, getThreatBadge(d.threat)),
				E('td', { 'style': 'text-align:center' }, String(d.confidence || 0) + '%'),
				E('td', { 'style': 'text-align:right' }, formatNumber(d.hits)),
				E('td', {}, d.source || '-')
			]);
		});

		if (rows.length === 0) {
			rows.push(E('tr', {}, [
				E('td', { 'colspan': '5', 'style': 'text-align:center;color:#999' }, 'No blocked domains yet')
			]));
		}

		return E('div', { 'class': 'vf-section' }, [
			E('h3', {}, 'Top Blocked Domains'),
			E('table', { 'class': 'table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Domain'),
					E('th', {}, 'Threat'),
					E('th', { 'style': 'text-align:center' }, 'Confidence'),
					E('th', { 'style': 'text-align:right' }, 'Hits'),
					E('th', {}, 'Source')
				])),
				E('tbody', { 'id': 'blocked-tbody' }, rows)
			])
		]);
	},

	renderThreatDistribution: function(stats) {
		var threats = stats.threats || {};
		var total = Object.values(threats).reduce(function(a, b) { return a + b; }, 0) || 1;

		var items = Object.entries(threats).map(function(entry) {
			var pct = Math.round((entry[1] / total) * 100);
			return E('div', { 'class': 'vf-dist-item' }, [
				E('div', { 'class': 'vf-dist-label' }, [
					getThreatBadge(entry[0]),
					E('span', { 'style': 'margin-left:8px' }, formatNumber(entry[1]))
				]),
				E('div', { 'class': 'vf-dist-bar' }, [
					E('div', {
						'class': 'vf-dist-fill',
						'style': 'width:' + pct + '%;background:' + (entry[0] === 'malware' ? '#e74c3c' : entry[0] === 'phishing' ? '#f39c12' : '#3498db')
					})
				])
			]);
		});

		if (items.length === 0) {
			items.push(E('div', { 'style': 'color:#999;text-align:center;padding:20px' }, 'No threat data available'));
		}

		return E('div', { 'class': 'vf-section' }, [
			E('h3', {}, 'Threat Distribution'),
			E('div', { 'class': 'vf-distribution' }, items)
		]);
	},

	handleUpdateFeeds: function() {
		var self = this;
		ui.showModal('Updating Feeds', [
			E('p', { 'class': 'spinning' }, 'Downloading threat intelligence feeds...')
		]);

		callUpdateFeeds().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || 'Feed update started'), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || 'Failed to update feeds'), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	handleBlockDomain: function() {
		var self = this;

		ui.showModal('Block Domain', [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Domain'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'block-domain-input', 'class': 'cbi-input-text', 'placeholder': 'malware.example.com' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Reason'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'block-reason-input', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'manual' }, 'Manual Block'),
							E('option', { 'value': 'malware' }, 'Malware'),
							E('option', { 'value': 'phishing' }, 'Phishing'),
							E('option', { 'value': 'c2' }, 'C2 Server'),
							E('option', { 'value': 'spam' }, 'Spam')
						])
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var domain = document.getElementById('block-domain-input').value.trim();
						var reason = document.getElementById('block-reason-input').value;
						if (!domain) {
							ui.addNotification(null, E('p', {}, 'Please enter a domain'), 'warning');
							return;
						}
						ui.hideModal();
						callBlockDomain(domain, reason).then(function(result) {
							if (result.success) {
								ui.addNotification(null, E('p', {}, result.message), 'success');
							} else {
								ui.addNotification(null, E('p', {}, result.message || 'Failed to block domain'), 'error');
							}
						});
					}
				}, 'Block')
			])
		]);
	},

	handleSearchDomain: function() {
		var self = this;

		ui.showModal('Search Domain', [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Domain'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'search-domain-input', 'class': 'cbi-input-text', 'placeholder': 'example.com' })
					])
				]),
				E('div', { 'id': 'search-result', 'style': 'padding:10px;display:none' })
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close'),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var domain = document.getElementById('search-domain-input').value.trim();
						var resultDiv = document.getElementById('search-result');
						if (!domain) {
							ui.addNotification(null, E('p', {}, 'Please enter a domain'), 'warning');
							return;
						}
						resultDiv.style.display = 'block';
						resultDiv.innerHTML = '<p class="spinning">Searching...</p>';
						callSearch(domain).then(function(result) {
							if (result.found && result.blocked) {
								resultDiv.innerHTML = '<div style="background:#fee;padding:10px;border-radius:4px;border:1px solid #e74c3c">' +
									'<strong style="color:#e74c3c">\u26A0 BLOCKED</strong><br>' +
									'<strong>Domain:</strong> ' + (result.domain || domain) + '<br>' +
									'<strong>Threat:</strong> ' + (result.threat || 'unknown') + '<br>' +
									'<strong>Confidence:</strong> ' + (result.confidence || 0) + '%<br>' +
									'<strong>Source:</strong> ' + (result.source || 'unknown') +
									'</div>';
							} else {
								resultDiv.innerHTML = '<div style="background:#efe;padding:10px;border-radius:4px;border:1px solid #27ae60">' +
									'<strong style="color:#27ae60">\u2713 NOT BLOCKED</strong><br>' +
									'Domain <strong>' + domain + '</strong> is not in the blocklist.' +
									'</div>';
							}
						});
					}
				}, 'Search')
			])
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var stats = data[1] || {};
		var feeds = data[2] || {};
		var blocked = data[3] || {};

		var self = this;

		// Start polling for live updates
		poll.add(function() {
			return Promise.all([callStatus(), callGetStats()]).then(function(results) {
				var s = results[0] || {};
				var st = results[1] || {};
				var domainsEl = document.querySelector('[data-stat="domains"]');
				var hitsEl = document.querySelector('[data-stat="hits"]');
				var x47El = document.querySelector('[data-stat="x47"]');
				if (domainsEl) domainsEl.textContent = formatNumber(st.domains || 0);
				if (hitsEl) hitsEl.textContent = formatNumber(st.hits || 0);
				if (x47El) x47El.textContent = formatNumber(st.x47_impact || 0);
			});
		}, 10);

		var dashboard = E('div', { 'class': 'vf-dashboard' }, [
			E('style', {}, [
				'.vf-dashboard { max-width: 1200px; }',
				'.vf-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }',
				'.vf-card { background: var(--kiss-card, #fff); border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--kiss-line, #eee); }',
				'.vf-card-highlight { background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: #fff; }',
				'.vf-card-highlight .vf-card-label { color: rgba(255,255,255,0.8); }',
				'.vf-card-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }',
				'.vf-card-value { font-size: 24px; font-weight: 700; }',
				'.vf-card-label { font-size: 12px; color: var(--kiss-muted, #666); text-transform: uppercase; letter-spacing: 0.5px; }',
				'.vf-section { background: var(--kiss-card, #fff); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--kiss-line, #eee); }',
				'.vf-section h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: var(--kiss-text, #333); }',
				'.vf-actions { display: flex; gap: 10px; flex-wrap: wrap; }',
				'.vf-distribution { display: flex; flex-direction: column; gap: 12px; }',
				'.vf-dist-item { display: flex; align-items: center; gap: 12px; }',
				'.vf-dist-label { min-width: 150px; display: flex; align-items: center; }',
				'.vf-dist-bar { flex: 1; height: 20px; background: var(--kiss-line, #eee); border-radius: 4px; overflow: hidden; }',
				'.vf-dist-fill { height: 100%; transition: width 0.3s; }',
				'.table { width: 100%; border-collapse: collapse; }',
				'.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--kiss-line, #eee); }',
				'.table th { background: var(--kiss-bg2, #f8f9fa); font-weight: 600; font-size: 12px; text-transform: uppercase; color: var(--kiss-muted, #666); }',
				'.table tbody tr:hover { background: rgba(255,255,255,0.02); }'
			].join('\n')),
			E('h2', { 'style': 'margin-bottom: 20px' }, [
				'\uD83C\uDF00 Vortex DNS Firewall'
			]),
			E('p', { 'style': 'color: var(--kiss-muted, #666); margin-bottom: 24px' },
				'DNS-level threat blocking with \u00D747 vitality multiplier. Each blocked DNS query prevents approximately 47 malicious connections.'),
			this.renderStatusCards(status, stats),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px;' }, [
				this.renderQuickActions(),
				this.renderThreatDistribution(stats)
			]),
			this.renderFeedsTable(feeds),
			this.renderBlockedTable(blocked)
		]);

		return KissTheme.wrap([dashboard], 'admin/secubox/security/vortex-firewall');
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
