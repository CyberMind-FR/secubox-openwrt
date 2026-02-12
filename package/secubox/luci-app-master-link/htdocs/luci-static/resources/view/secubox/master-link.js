'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require rpc';
'require uci';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.master_link',
	method: 'status',
	expect: { '': {} }
});

var callPeers = rpc.declare({
	object: 'luci.master_link',
	method: 'peers',
	expect: { '': {} }
});

var callTree = rpc.declare({
	object: 'luci.master_link',
	method: 'tree',
	expect: { '': {} }
});

var callTokenGenerate = rpc.declare({
	object: 'luci.master_link',
	method: 'token_generate'
});

var callApprove = rpc.declare({
	object: 'luci.master_link',
	method: 'approve',
	params: ['fingerprint', 'action', 'reason']
});

var callTokenCleanup = rpc.declare({
	object: 'luci.master_link',
	method: 'token_cleanup'
});

function formatTime(ts) {
	if (!ts) return '-';
	var d = new Date(ts * 1000);
	return d.toLocaleString();
}

function roleBadge(role) {
	var colors = {
		'master': '#6366f1',
		'sub-master': '#818cf8',
		'peer': '#22c55e'
	};
	var color = colors[role] || '#94a3b8';
	return E('span', {
		'style': 'display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;color:#fff;background:' + color
	}, role || 'unknown');
}

function statusBadge(status) {
	var colors = {
		'pending': '#f59e0b',
		'approved': '#22c55e',
		'rejected': '#ef4444'
	};
	var textColors = {
		'pending': '#000'
	};
	var color = colors[status] || '#94a3b8';
	var textColor = textColors[status] || '#fff';
	return E('span', {
		'style': 'display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;color:' + textColor + ';background:' + color
	}, status || 'unknown');
}

function copyText(text) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text).then(function() {
			ui.addNotification(null, E('p', _('Copied to clipboard')), 'success');
		});
	}
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('master-link'),
			callStatus(),
			callPeers(),
			callTree()
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var peersData = data[2] || {};
		var treeData = data[3] || {};
		var peers = peersData.peers || [];
		var role = status.role || 'master';
		var isMaster = (role === 'master' || role === 'sub-master');

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('SecuBox Mesh Link')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Manage mesh node onboarding, peer approval, and hierarchy.'))
		]);

		// Tab navigation
		var tabs = E('div', {
			'style': 'display:flex;gap:0;border-bottom:2px solid #ddd;margin-bottom:20px;'
		});
		var tabContent = E('div', {});

		var tabNames = ['Overview', 'Join Requests', 'Mesh Tree'];
		var tabIds = ['tab-overview', 'tab-requests', 'tab-tree'];

		tabNames.forEach(function(name, i) {
			var btn = E('button', {
				'class': 'cbi-button' + (i === 0 ? ' cbi-button-positive' : ''),
				'style': 'border-radius:0;border-bottom:none;margin-bottom:-2px;' +
					(i === 0 ? 'border-bottom:2px solid #0069d9;font-weight:bold;' : ''),
				'data-tab': tabIds[i],
				'click': function() {
					tabs.querySelectorAll('button').forEach(function(b) {
						b.className = 'cbi-button';
						b.style.borderBottom = 'none';
						b.style.fontWeight = 'normal';
						b.style.marginBottom = '-2px';
						b.style.borderRadius = '0';
					});
					this.className = 'cbi-button cbi-button-positive';
					this.style.borderBottom = '2px solid #0069d9';
					this.style.fontWeight = 'bold';

					tabContent.querySelectorAll('.tab-panel').forEach(function(p) {
						p.style.display = 'none';
					});
					document.getElementById(this.getAttribute('data-tab')).style.display = 'block';
				}
			}, name);

			// Hide requests tab for peers
			if (i === 1 && !isMaster) {
				btn.style.display = 'none';
			}

			tabs.appendChild(btn);
		});

		view.appendChild(tabs);
		view.appendChild(tabContent);

		// =============================================
		// Tab 1: Overview
		// =============================================
		var overviewPanel = E('div', { 'class': 'tab-panel', 'id': 'tab-overview' });

		// Status cards
		var statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', { 'class': 'cbi-section-title' }, _('Node Status'))
		]);

		var statusGrid = E('div', {
			'style': 'display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;'
		});

		// Role card
		statusGrid.appendChild(E('div', {
			'style': 'flex:1;min-width:200px;background:#f8f8f8;padding:15px;border-radius:8px;border-left:4px solid #6366f1;'
		}, [
			E('div', { 'style': 'font-size:12px;color:#666;margin-bottom:4px;' }, _('Role')),
			E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
				roleBadge(role),
				E('span', { 'style': 'font-size:13px;color:#666;' },
					status.depth > 0 ? _('Depth: ') + status.depth : _('Root'))
			])
		]));

		// Fingerprint card
		statusGrid.appendChild(E('div', {
			'style': 'flex:1;min-width:200px;background:#f8f8f8;padding:15px;border-radius:8px;border-left:4px solid #22c55e;'
		}, [
			E('div', { 'style': 'font-size:12px;color:#666;margin-bottom:4px;' }, _('Fingerprint')),
			E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
				E('code', { 'style': 'font-size:14px;font-weight:600;letter-spacing:0.05em;' },
					status.fingerprint || '-'),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'padding:2px 8px;font-size:11px;',
					'click': function() { copyText(status.fingerprint); }
				}, _('Copy'))
			])
		]));

		// Peers card
		statusGrid.appendChild(E('div', {
			'style': 'flex:1;min-width:200px;background:#f8f8f8;padding:15px;border-radius:8px;border-left:4px solid #f59e0b;'
		}, [
			E('div', { 'style': 'font-size:12px;color:#666;margin-bottom:4px;' }, _('Peers')),
			E('div', { 'style': 'display:flex;gap:12px;' }, [
				E('div', {}, [
					E('span', { 'style': 'font-size:20px;font-weight:700;color:#22c55e;' },
						String(status.peers ? status.peers.approved : 0)),
					E('span', { 'style': 'font-size:11px;color:#666;margin-left:4px;' }, _('approved'))
				]),
				E('div', {}, [
					E('span', { 'style': 'font-size:20px;font-weight:700;color:#f59e0b;' },
						String(status.peers ? status.peers.pending : 0)),
					E('span', { 'style': 'font-size:11px;color:#666;margin-left:4px;' }, _('pending'))
				])
			])
		]));

		// Chain card
		statusGrid.appendChild(E('div', {
			'style': 'flex:1;min-width:200px;background:#f8f8f8;padding:15px;border-radius:8px;border-left:4px solid #94a3b8;'
		}, [
			E('div', { 'style': 'font-size:12px;color:#666;margin-bottom:4px;' }, _('Chain')),
			E('div', {}, [
				E('span', { 'style': 'font-size:20px;font-weight:700;' },
					String(status.chain_height || 0)),
				E('span', { 'style': 'font-size:11px;color:#666;margin-left:4px;' }, _('blocks')),
				E('span', { 'style': 'font-size:11px;color:#666;margin-left:12px;' },
					String(status.active_tokens || 0) + _(' active tokens'))
			])
		]));

		statusSection.appendChild(statusGrid);
		overviewPanel.appendChild(statusSection);

		// Upstream info (for peers/sub-masters)
		if (status.upstream) {
			overviewPanel.appendChild(E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, _('Upstream Master')),
				E('div', { 'style': 'background:#f8f8f8;padding:15px;border-radius:8px;' }, [
					E('p', {}, [
						E('b', {}, _('Address: ')),
						E('code', {}, status.upstream)
					])
				])
			]));
		}

		// Actions (master/sub-master only)
		if (isMaster) {
			var actionsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, _('Actions'))
			]);

			var actionBtns = E('div', { 'style': 'display:flex;gap:10px;flex-wrap:wrap;' });

			// Generate Token button
			var tokenBtn = E('button', {
				'class': 'cbi-button cbi-button-positive',
				'click': function() {
					this.disabled = true;
					this.textContent = _('Generating...');
					var self = this;
					callTokenGenerate().then(function(res) {
						self.disabled = false;
						self.textContent = _('Generate Token');
						if (res && res.token) {
							var url = res.url || '';
							ui.showModal(_('Join Token Generated'), [
								E('div', { 'style': 'margin-bottom:10px;' }, [
									E('p', { 'style': 'margin-bottom:8px;' }, _('Share this link with the new node:')),
									E('div', {
										'style': 'background:#f0f0f0;padding:10px;border-radius:4px;word-break:break-all;font-family:monospace;font-size:13px;'
									}, url),
									E('p', { 'style': 'margin-top:8px;font-size:12px;color:#666;' },
										_('Expires: ') + formatTime(res.expires)),
									E('p', { 'style': 'margin-top:4px;font-size:12px;color:#666;' },
										_('Token hash: ') + (res.token_hash || '').substring(0, 16) + '...')
								]),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'cbi-button',
										'click': function() { copyText(url); }
									}, _('Copy URL')),
									E('button', {
										'class': 'cbi-button',
										'style': 'margin-left:8px;',
										'click': function() { copyText(res.token); }
									}, _('Copy Token')),
									E('button', {
										'class': 'cbi-button cbi-button-positive',
										'style': 'margin-left:8px;',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						} else {
							ui.addNotification(null,
								E('p', _('Failed to generate token')), 'error');
						}
					}).catch(function(err) {
						self.disabled = false;
						self.textContent = _('Generate Token');
						ui.addNotification(null,
							E('p', _('Error: ') + err.message), 'error');
					});
				}
			}, _('Generate Token'));

			// Cleanup button
			var cleanupBtn = E('button', {
				'class': 'cbi-button',
				'click': function() {
					callTokenCleanup().then(function(res) {
						ui.addNotification(null,
							E('p', _('Cleaned ') + (res.cleaned || 0) + _(' expired tokens')), 'success');
					});
				}
			}, _('Cleanup Tokens'));

			actionBtns.appendChild(tokenBtn);
			actionBtns.appendChild(cleanupBtn);
			actionsSection.appendChild(actionBtns);
			overviewPanel.appendChild(actionsSection);
		}

		tabContent.appendChild(overviewPanel);

		// =============================================
		// Tab 2: Join Requests (master/sub-master)
		// =============================================
		var requestsPanel = E('div', {
			'class': 'tab-panel',
			'id': 'tab-requests',
			'style': 'display:none;'
		});

		if (isMaster) {
			var reqSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, _('Pending & Processed Requests'))
			]);

			if (peers.length === 0) {
				reqSection.appendChild(E('div', {
					'style': 'padding:20px;text-align:center;color:#666;background:#f8f8f8;border-radius:8px;'
				}, _('No join requests yet. Generate a token and share it with a new node.')));
			} else {
				var table = E('table', { 'class': 'table cbi-section-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Hostname')),
						E('th', { 'class': 'th' }, _('Address')),
						E('th', { 'class': 'th' }, _('Fingerprint')),
						E('th', { 'class': 'th' }, _('Requested')),
						E('th', { 'class': 'th' }, _('Status')),
						E('th', { 'class': 'th' }, _('Actions'))
					])
				]);

				// Sort: pending first, then approved, then rejected
				var sortOrder = { 'pending': 0, 'approved': 1, 'rejected': 2 };
				peers.sort(function(a, b) {
					return (sortOrder[a.status] || 99) - (sortOrder[b.status] || 99);
				});

				peers.forEach(function(peer) {
					var actionCell = E('td', { 'class': 'td', 'style': 'white-space:nowrap;' });

					if (peer.status === 'pending') {
						actionCell.appendChild(E('button', {
							'class': 'cbi-button cbi-button-positive',
							'style': 'margin-right:4px;padding:2px 10px;font-size:12px;',
							'data-fp': peer.fingerprint,
							'click': function() {
								var fp = this.getAttribute('data-fp');
								callApprove(fp, 'approve', '').then(function(res) {
									if (res && res.success) {
										ui.addNotification(null,
											E('p', _('Peer approved: ') + fp), 'success');
										window.location.reload();
									} else {
										ui.addNotification(null,
											E('p', _('Approval failed: ') + (res.error || '')), 'error');
									}
								});
							}
						}, _('Approve')));

						actionCell.appendChild(E('button', {
							'class': 'cbi-button cbi-button-remove',
							'style': 'padding:2px 10px;font-size:12px;',
							'data-fp': peer.fingerprint,
							'click': function() {
								var fp = this.getAttribute('data-fp');
								if (confirm(_('Reject this peer?'))) {
									callApprove(fp, 'reject', 'rejected via LuCI').then(function(res) {
										if (res && res.success) {
											ui.addNotification(null,
												E('p', _('Peer rejected: ') + fp), 'success');
											window.location.reload();
										}
									});
								}
							}
						}, _('Reject')));
					} else if (peer.status === 'approved' && (!peer.role || peer.role === 'peer')) {
						actionCell.appendChild(E('button', {
							'class': 'cbi-button cbi-button-action',
							'style': 'padding:2px 10px;font-size:12px;',
							'data-fp': peer.fingerprint,
							'click': function() {
								var fp = this.getAttribute('data-fp');
								if (confirm(_('Promote this peer to sub-master?'))) {
									callApprove(fp, 'promote', '').then(function(res) {
										if (res && res.success) {
											ui.addNotification(null,
												E('p', _('Peer promoted to sub-master')), 'success');
											window.location.reload();
										} else {
											ui.addNotification(null,
												E('p', _('Promotion failed: ') + (res.error || '')), 'error');
										}
									});
								}
							}
						}, _('Promote')));
					} else if (peer.role === 'sub-master') {
						actionCell.appendChild(E('span', {
							'style': 'font-size:11px;color:#818cf8;font-weight:500;'
						}, _('Sub-master')));
					}

					table.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, peer.hostname || '-'),
						E('td', { 'class': 'td' }, E('code', { 'style': 'font-size:12px;' }, peer.address || '-')),
						E('td', { 'class': 'td' }, E('code', { 'style': 'font-size:11px;' }, (peer.fingerprint || '').substring(0, 12) + '...')),
						E('td', { 'class': 'td', 'style': 'font-size:12px;' }, formatTime(peer.timestamp)),
						E('td', { 'class': 'td' }, statusBadge(peer.status)),
						actionCell
					]));
				});

				reqSection.appendChild(table);
			}

			requestsPanel.appendChild(reqSection);
		}

		tabContent.appendChild(requestsPanel);

		// =============================================
		// Tab 3: Mesh Tree
		// =============================================
		var treePanel = E('div', {
			'class': 'tab-panel',
			'id': 'tab-tree',
			'style': 'display:none;'
		});

		var treeSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', { 'class': 'cbi-section-title' }, _('Mesh Topology'))
		]);

		var tree = treeData.tree || {};
		var treeContainer = E('div', {
			'style': 'background:#f8f8f8;padding:20px;border-radius:8px;font-family:monospace;font-size:13px;'
		});

		// Render tree recursively
		function renderNode(node, prefix, isLast) {
			var connector = prefix + (isLast ? '└── ' : '├── ');
			var childPrefix = prefix + (isLast ? '    ' : '│   ');

			var onlineIndicator = node.online === false ? ' [offline]' : '';
			var roleLabel = node.role ? ' (' + node.role + ')' : '';

			var line = E('div', { 'style': 'white-space:pre;' }, [
				E('span', { 'style': 'color:#666;' }, prefix ? connector : ''),
				E('span', { 'style': 'font-weight:600;' }, node.hostname || node.fingerprint || 'unknown'),
				roleBadge(node.role),
				E('span', { 'style': 'color:#666;font-size:11px;margin-left:8px;' },
					(node.fingerprint || '').substring(0, 8)),
				node.address ? E('span', { 'style': 'color:#94a3b8;font-size:11px;margin-left:8px;' },
					node.address) : E('span'),
				node.online === false ? E('span', { 'style': 'color:#ef4444;font-size:11px;margin-left:8px;' },
					'offline') : E('span')
			]);

			treeContainer.appendChild(line);

			var children = node.children || [];
			children.forEach(function(child, i) {
				renderNode(child, prefix ? childPrefix : '', i === children.length - 1);
			});
		}

		if (tree.hostname || tree.fingerprint) {
			renderNode(tree, '', true);
		} else {
			treeContainer.appendChild(E('div', { 'style': 'color:#666;text-align:center;padding:20px;' },
				_('No mesh tree data available. Approve some peers to see the topology.')));
		}

		treeSection.appendChild(treeContainer);
		treePanel.appendChild(treeSection);
		tabContent.appendChild(treePanel);

		// Auto-refresh poll for pending requests
		if (isMaster) {
			poll.add(function() {
				return callStatus().then(function(newStatus) {
					if (newStatus.peers && newStatus.peers.pending > 0) {
						var pendingBadge = document.querySelector('[data-tab="tab-requests"]');
						if (pendingBadge) {
							pendingBadge.textContent = _('Join Requests') +
								' (' + newStatus.peers.pending + ')';
						}
					}
				});
			}, 10);
		}

		return KissTheme.wrap([view], 'admin/services/secubox-mesh');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
