'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require uci';
'require secubox/kiss-theme';

var callGetConfig = rpc.declare({
	object: 'luci.dns-provider',
	method: 'get_config',
	expect: {}
});

var callListRecords = rpc.declare({
	object: 'luci.dns-provider',
	method: 'list_records',
	expect: {}
});

var callAddRecord = rpc.declare({
	object: 'luci.dns-provider',
	method: 'add_record',
	params: ['type', 'subdomain', 'target', 'ttl'],
	expect: {}
});

var callRemoveRecord = rpc.declare({
	object: 'luci.dns-provider',
	method: 'remove_record',
	params: ['type', 'subdomain'],
	expect: {}
});

var callSyncRecords = rpc.declare({
	object: 'luci.dns-provider',
	method: 'sync_records',
	expect: {}
});

var callVerifyRecord = rpc.declare({
	object: 'luci.dns-provider',
	method: 'verify_record',
	params: ['fqdn'],
	expect: {}
});

var callAcmeDns01 = rpc.declare({
	object: 'luci.dns-provider',
	method: 'acme_dns01',
	params: ['domain'],
	expect: {}
});

function providerLabel(p) {
	switch (p) {
		case 'ovh': return 'OVH';
		case 'gandi': return 'Gandi';
		case 'cloudflare': return 'Cloudflare';
		default: return p || _('Not configured');
	}
}

return view.extend({
	load: function() {
		return Promise.all([
			callGetConfig(),
			callListRecords()
		]);
	},

	renderStats: function(config, records) {
		var c = KissTheme.colors;
		var enabled = config.enabled === '1';
		var recordCount = records.success && records.raw ? records.raw.split('\n').filter(function(l) { return l.trim(); }).length : 0;

		return [
			KissTheme.stat(providerLabel(config.provider), 'Provider', c.purple),
			KissTheme.stat(config.zone || '-', 'Zone', c.cyan),
			KissTheme.stat(enabled ? 'Active' : 'Inactive', 'Status', enabled ? c.green : c.red),
			KissTheme.stat(recordCount, 'Records', c.blue)
		];
	},

	render: function(data) {
		var config = data[0] || {};
		var records = data[1] || {};
		var self = this;

		var provider = config.provider || '';
		var zone = config.zone || '';

		// Not Configured Warning
		if (!provider || !zone) {
			var content = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'DNS Records'),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
						'Manage DNS records for your domain')
				]),
				KissTheme.card('Configuration Required', E('div', { 'style': 'text-align: center; padding: 40px 20px;' }, [
					E('p', { 'style': 'font-size: 16px; color: var(--kiss-muted); margin-bottom: 20px;' },
						'DNS provider is not configured. Go to Settings to configure your provider and zone.'),
					E('a', {
						'href': L.url('admin/secubox/network/dns-provider/settings'),
						'class': 'kiss-btn kiss-btn-green'
					}, 'Go to Settings')
				]))
			];
			return KissTheme.wrap(content, 'admin/secubox/network/dns-provider/records');
		}

		// Action Buttons
		var actions = E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;' }, [
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': function() { self.handleAddRecord(zone); }
			}, '+ Add Record'),
			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'click': function() { self.handleSync(); }
			}, 'Sync HAProxy Vhosts'),
			E('button', {
				'class': 'kiss-btn kiss-btn-purple',
				'click': function() { self.handleAcme(zone); }
			}, 'ACME DNS-01'),
			E('button', {
				'class': 'kiss-btn',
				'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
				'click': function() {
					window.location.href = window.location.pathname + '?' + Date.now();
				}
			}, 'Refresh')
		]);

		// Records Display
		var recordsContent;
		if (records.success && records.raw) {
			recordsContent = E('pre', {
				'style': 'background: var(--kiss-bg); padding: 16px; border-radius: 8px; ' +
					'font-family: monospace; font-size: 13px; overflow-x: auto; max-height: 400px; ' +
					'border: 1px solid var(--kiss-line); color: var(--kiss-text);'
			}, records.raw || 'No records returned');
		} else {
			recordsContent = E('p', { 'style': 'color: var(--kiss-red); padding: 20px;' },
				records.error || 'Failed to fetch records. Check your provider configuration.');
		}

		// Verify Section
		var verifyContent = E('div', { 'style': 'display: flex; gap: 12px; align-items: center; flex-wrap: wrap;' }, [
			E('input', {
				'id': 'verify-fqdn',
				'type': 'text',
				'placeholder': 'subdomain.' + zone,
				'style': 'flex: 1; min-width: 200px; padding: 10px 14px; background: var(--kiss-bg); ' +
					'border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
			}),
			E('button', {
				'class': 'kiss-btn kiss-btn-cyan',
				'click': function() { self.handleVerify(); }
			}, 'Verify')
		]);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'DNS Records'),
					KissTheme.badge(providerLabel(provider), 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Manage DNS records for ' + zone)
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(config, records)),

			// Actions
			actions,

			// Records Card
			KissTheme.card('Zone Records', recordsContent),

			// Verify Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'DNS Propagation Check'),
					KissTheme.badge('Verify', 'cyan')
				]),
				E('div', {}, [
					verifyContent,
					E('div', { 'id': 'verify-results', 'style': 'margin-top: 16px;' })
				])
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/network/dns-provider/records');
	},

	handleAddRecord: function(zone) {
		var typeInput, subInput, targetInput, ttlInput;

		ui.showModal(_('Add DNS Record'), [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Type')),
					typeInput = E('select', {
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					}, [
						E('option', { value: 'A' }, 'A'),
						E('option', { value: 'AAAA' }, 'AAAA'),
						E('option', { value: 'CNAME' }, 'CNAME'),
						E('option', { value: 'TXT' }, 'TXT'),
						E('option', { value: 'MX' }, 'MX'),
						E('option', { value: 'SRV' }, 'SRV')
					])
				]),
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Subdomain')),
					subInput = E('input', {
						'type': 'text',
						'placeholder': 'www',
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Target')),
					targetInput = E('input', {
						'type': 'text',
						'placeholder': '1.2.3.4',
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('TTL')),
					ttlInput = E('input', {
						'type': 'number',
						'value': '3600',
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text); width: 120px;'
					})
				]),
				E('p', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
					_('Record will be created as: ') + '{subdomain}.' + zone)
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var type = typeInput.value;
						var sub = subInput.value.trim();
						var target = targetInput.value.trim();
						var ttl = parseInt(ttlInput.value) || 3600;

						if (!sub || !target) {
							ui.addNotification(null,
								E('p', {}, _('Subdomain and target are required.')), 'warning');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Adding record...'), [
							E('p', { 'class': 'spinning' }, _('Creating DNS record...'))
						]);

						callAddRecord(type, sub, target, ttl).then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.addNotification(null,
									E('p', {}, _('Record created successfully.')), 'info');
								window.location.href = window.location.pathname + '?' + Date.now();
							} else {
								ui.addNotification(null,
									E('p', {}, _('Failed to create record: ') +
										(res ? res.output : _('Unknown error'))), 'danger');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null,
								E('p', {}, _('RPC error: ') + err.message), 'danger');
						});
					}
				}, _('Create'))
			])
		]);
	},

	handleSync: function() {
		ui.showModal(_('Sync DNS Records'), [
			E('p', { 'style': 'color: var(--kiss-muted);' },
				_('This will create A records for all enabled HAProxy vhosts pointing to your public IP.')),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Syncing...'), [
							E('p', { 'class': 'spinning' }, _('Syncing HAProxy vhosts to DNS...'))
						]);

						callSyncRecords().then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.addNotification(null,
									E('p', {}, _('Sync complete. ') + (res.output || '')), 'info');
								window.location.href = window.location.pathname + '?' + Date.now();
							} else {
								ui.addNotification(null,
									E('p', {}, _('Sync failed: ') + (res ? res.output : '')), 'danger');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null,
								E('p', {}, _('RPC error: ') + err.message), 'danger');
						});
					}
				}, _('Sync Now'))
			])
		]);
	},

	handleAcme: function(zone) {
		var domainInput;

		ui.showModal(_('ACME DNS-01 Certificate'), [
			E('p', { 'style': 'color: var(--kiss-muted);' },
				_('Issue an SSL certificate using DNS-01 challenge. Supports wildcards.')),
			E('div', { 'style': 'margin: 16px 0;' }, [
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Domain')),
					domainInput = E('input', {
						'type': 'text',
						'placeholder': '*.' + zone,
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text); width: 100%;'
					})
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'kiss-btn kiss-btn-purple',
					'click': function() {
						var domain = domainInput.value.trim();
						if (!domain) {
							ui.addNotification(null,
								E('p', {}, _('Domain is required.')), 'warning');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Issuing certificate...'), [
							E('p', { 'class': 'spinning' },
								_('Running ACME DNS-01 challenge. This may take a while...'))
						]);

						callAcmeDns01(domain).then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.addNotification(null,
									E('p', {}, _('Certificate issued successfully.')), 'info');
							} else {
								ui.addNotification(null,
									E('p', {}, _('ACME failed: ') +
										(res ? res.output : _('Unknown error'))), 'danger');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null,
								E('p', {}, _('RPC error: ') + err.message), 'danger');
						});
					}
				}, _('Issue Certificate'))
			])
		]);
	},

	handleVerify: function() {
		var fqdnEl = document.getElementById('verify-fqdn');
		var resultsEl = document.getElementById('verify-results');
		var fqdn = fqdnEl ? fqdnEl.value.trim() : '';

		if (!fqdn) {
			ui.addNotification(null,
				E('p', {}, _('Enter an FQDN to verify.')), 'warning');
			return;
		}

		dom.content(resultsEl, E('p', { 'class': 'spinning' }, _('Checking DNS propagation...')));

		callVerifyRecord(fqdn).then(function(res) {
			if (!res || !res.success) {
				dom.content(resultsEl, E('p', { 'style': 'color: var(--kiss-red);' },
					res ? res.error : _('Verification failed')));
				return;
			}

			var rows = (res.resolvers || []).map(function(r) {
				var resolved = r.resolved;
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, r.resolver),
					E('td', { 'style': 'padding: 10px 12px; color: var(--kiss-' + (resolved ? 'green' : 'red') + ');' },
						resolved ? r.result : _('not resolved'))
				]);
			});

			var total = (res.resolvers || []).length;
			var resolved = (res.resolvers || []).filter(function(r) { return r.resolved; }).length;

			dom.content(resultsEl, E('div', {}, [
				E('table', { 'class': 'kiss-table' }, [
					E('thead', {}, E('tr', {}, [
						E('th', { 'style': 'padding: 10px 12px;' }, _('Resolver')),
						E('th', { 'style': 'padding: 10px 12px;' }, _('Result'))
					])),
					E('tbody', {}, rows)
				]),
				E('p', { 'style': 'margin-top: 12px; font-weight: 600; color: var(--kiss-text);' },
					resolved + '/' + total + _(' resolvers responded'))
			]));
		}).catch(function(err) {
			dom.content(resultsEl, E('p', { 'style': 'color: var(--kiss-red);' },
				_('RPC error: ') + err.message));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
