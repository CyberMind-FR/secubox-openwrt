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

	render: function(data) {
		var config = data[0] || {};
		var records = data[1] || {};
		var self = this;

		var provider = config.provider || '';
		var zone = config.zone || '';

		// ── Status Bar ──
		var statusItems = [
			E('span', { 'style': 'margin-right:2em;' }, [
				E('strong', {}, _('Provider: ')),
				providerLabel(provider)
			]),
			E('span', { 'style': 'margin-right:2em;' }, [
				E('strong', {}, _('Zone: ')),
				zone || _('not set')
			]),
			E('span', {}, [
				E('strong', {}, _('Enabled: ')),
				config.enabled === '1'
					? E('span', { 'style': 'color:#22c55e;' }, _('Yes'))
					: E('span', { 'style': 'color:#ef4444;' }, _('No'))
			])
		];

		var statusBar = E('div', {
			'class': 'cbi-section',
			'style': 'padding:1em; display:flex; flex-wrap:wrap; gap:0.5em;'
		}, statusItems);

		// ── Not Configured Warning ──
		if (!provider || !zone) {
			return E('div', {}, [
				E('h2', {}, _('DNS Records')),
				statusBar,
				E('div', {
					'class': 'cbi-section',
					'style': 'padding:2em; text-align:center;'
				}, [
					E('p', { 'style': 'font-size:1.1em;' },
						_('DNS provider is not configured. Go to Settings to configure your provider and zone.')),
					E('a', {
						'href': L.url('admin/secubox/network/dns-provider/settings'),
						'class': 'cbi-button cbi-button-action'
					}, _('Go to Settings'))
				])
			]);
		}

		// ── Action Buttons ──
		var actions = E('div', {
			'style': 'display:flex; gap:0.5em; flex-wrap:wrap; margin-bottom:1em;'
		}, [
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function() { self.handleAddRecord(zone); }
			}, _('Add Record')),
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'click': function() { self.handleSync(); }
			}, _('Sync HAProxy Vhosts')),
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'click': function() { self.handleAcme(zone); }
			}, _('ACME DNS-01')),
			E('button', {
				'class': 'cbi-button',
				'click': function() {
					window.location.href = window.location.pathname + '?' + Date.now();
				}
			}, _('Refresh'))
		]);

		// ── Records Display ──
		var recordsSection;
		if (records.success && records.raw) {
			// Raw output from provider API — display in a preformatted block
			// The output format depends on the provider
			recordsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Zone Records')),
				E('pre', {
					'style': 'background:var(--bg-alt, #f5f5f5); padding:1em; overflow-x:auto; ' +
						'border-radius:4px; font-size:0.85em; max-height:60vh;'
				}, records.raw || _('No records returned'))
			]);
		} else {
			recordsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Zone Records')),
				E('p', { 'style': 'color:#ef4444;' },
					records.error || _('Failed to fetch records. Check your provider configuration.'))
			]);
		}

		// ── Verify Section ──
		var verifySection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('DNS Propagation Check')),
			E('div', { 'style': 'display:flex; gap:0.5em; align-items:center;' }, [
				E('input', {
					'id': 'verify-fqdn',
					'type': 'text',
					'class': 'cbi-input-text',
					'placeholder': 'subdomain.' + zone,
					'style': 'width:300px;'
				}),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.handleVerify(); }
				}, _('Verify'))
			]),
			E('div', { 'id': 'verify-results', 'style': 'margin-top:1em;' })
		]);

		var content = E('div', {}, [
			E('h2', {}, _('DNS Records')),
			statusBar,
			actions,
			recordsSection,
			verifySection
		]);

		return KissTheme.wrap(content, 'admin/secubox/network/dns-provider/records');
	},

	handleAddRecord: function(zone) {
		var typeInput, subInput, targetInput, ttlInput;

		ui.showModal(_('Add DNS Record'), [
			E('div', { 'style': 'display:flex; flex-direction:column; gap:0.8em;' }, [
				E('label', {}, [
					E('strong', {}, _('Type')),
					typeInput = E('select', { 'class': 'cbi-input-select', 'style': 'margin-left:0.5em;' }, [
						E('option', { value: 'A' }, 'A'),
						E('option', { value: 'AAAA' }, 'AAAA'),
						E('option', { value: 'CNAME' }, 'CNAME'),
						E('option', { value: 'TXT' }, 'TXT'),
						E('option', { value: 'MX' }, 'MX'),
						E('option', { value: 'SRV' }, 'SRV')
					])
				]),
				E('label', {}, [
					E('strong', {}, _('Subdomain')),
					subInput = E('input', {
						'type': 'text', 'class': 'cbi-input-text',
						'placeholder': 'www', 'style': 'margin-left:0.5em;'
					})
				]),
				E('label', {}, [
					E('strong', {}, _('Target')),
					targetInput = E('input', {
						'type': 'text', 'class': 'cbi-input-text',
						'placeholder': '1.2.3.4', 'style': 'margin-left:0.5em;'
					})
				]),
				E('label', {}, [
					E('strong', {}, _('TTL')),
					ttlInput = E('input', {
						'type': 'number', 'class': 'cbi-input-text',
						'value': '3600', 'style': 'margin-left:0.5em; width:100px;'
					})
				]),
				E('p', { 'style': 'color:#6b7280; font-size:0.85em;' },
					_('Record will be created as: ') +
					E('code', {}, '{subdomain}.' + zone).textContent)
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-action',
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
			E('p', {}, _('This will create A records for all enabled HAProxy vhosts pointing to your public IP.')),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-action',
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
			E('p', {}, _('Issue an SSL certificate using DNS-01 challenge. Supports wildcards.')),
			E('div', { 'style': 'margin:1em 0;' }, [
				E('strong', {}, _('Domain: ')),
				domainInput = E('input', {
					'type': 'text', 'class': 'cbi-input-text',
					'placeholder': '*.' + zone,
					'style': 'width:300px;'
				})
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-action',
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
				dom.content(resultsEl, E('p', { 'style': 'color:#ef4444;' },
					res ? res.error : _('Verification failed')));
				return;
			}

			var rows = (res.resolvers || []).map(function(r) {
				var color = r.resolved ? '#22c55e' : '#ef4444';
				return E('tr', {}, [
					E('td', {}, r.resolver),
					E('td', { 'style': 'color:' + color + ';' },
						r.resolved ? r.result : _('not resolved'))
				]);
			});

			var total = (res.resolvers || []).length;
			var resolved = (res.resolvers || []).filter(function(r) { return r.resolved; }).length;

			dom.content(resultsEl, E('div', {}, [
				E('table', { 'class': 'table' }, [
					E('thead', {}, E('tr', {}, [
						E('th', {}, _('Resolver')),
						E('th', {}, _('Result'))
					])),
					E('tbody', {}, rows)
				]),
				E('p', { 'style': 'margin-top:0.5em; font-weight:bold;' },
					resolved + '/' + total + _(' resolvers responded'))
			]));
		}).catch(function(err) {
			dom.content(resultsEl, E('p', { 'style': 'color:#ef4444;' },
				_('RPC error: ') + err.message));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
