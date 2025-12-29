'use strict';
'require view';
'require ui';
'require mqtt-bridge/api as API';
'require secubox-theme/theme as Theme';
'require mqtt-bridge/nav as Nav';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(data) {
		var status = data || {};
		var container = E('div', { 'class': 'mqtt-bridge-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mqtt-bridge/common.css') }),
			Nav.renderTabs('overview'),
			this.renderHero(status),
			this.renderStats(status),
			this.renderRecentPayloads(status)
		]);
		return container;
	},

	renderHero: function(status) {
		var meta = [
			{ label: _('Broker'), value: status.broker || 'Mosquitto' },
			{ label: _('Clients'), value: status.clients || 0 },
			{ label: _('Last USB Event'), value: status.last_event || _('n/a') }
		];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📡'), _('MQTT Bridge')]),
				E('div', { 'style': 'display:flex;gap:8px;' }, [
					E('button', { 'class': 'mb-btn mb-btn-primary', 'click': ui.createHandlerFn(this, 'startPairing') }, ['🔌 ', _('Pair device')])
				])
			]),
			E('p', { 'style': 'color:var(--mb-muted);margin-bottom:12px;' },
				_('USB-to-MQTT hub for bringing Zigbee, serial and modbus devices into SecuBox.')),
			E('div', { 'class': 'mb-hero-meta' }, meta.map(function(item) {
				return E('div', { 'class': 'mb-hero-chip' }, [
					E('span', { 'class': 'mb-hero-chip-label' }, item.label),
					E('strong', {}, item.value)
				]);
			}))
		]);
	},

	renderStats: function(status) {
		var stats = [
			{ label: _('USB adapters'), value: status.adapters || 0 },
			{ label: _('Paired devices'), value: (status.device_stats && status.device_stats.total) || 0 },
			{ label: _('Online devices'), value: (status.device_stats && status.device_stats.online) || 0 },
			{ label: _('Topics/s'), value: status.messages_per_sec || 0 },
			{ label: _('Stored payloads'), value: status.retained || 0 },
			{ label: _('Bridge uptime'), value: status.uptime || _('–') }
		];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📊'), _('Metrics')])
			]),
			E('div', { 'class': 'mb-grid' }, stats.map(function(stat) {
				return E('div', { 'class': 'mb-stat' }, [
					E('span', { 'class': 'mb-stat-label' }, stat.label),
					E('div', { 'class': 'mb-stat-value' }, stat.value)
				]);
			}))
		]);
	},

	renderRecentPayloads: function(status) {
		var payloads = status.recent_payloads || [];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📝'), _('Recent payloads')])
			]),
			payloads.length ? E('div', {}, payloads.map(function(entry) {
				return E('div', { 'class': 'mb-device-row' }, [
					E('div', { 'class': 'mb-device-info' }, [
						E('strong', {}, entry.topic),
						E('span', { 'style': 'color:var(--mb-muted);font-size:13px;' }, entry.timestamp)
					]),
					E('code', { 'style': 'font-family:\"JetBrains Mono\",monospace;font-size:12px;' }, entry.payload)
				]);
			})) : E('p', { 'style': 'color:var(--mb-muted);' }, _('No payloads yet'))
		]);
	},

	startPairing: function() {
		ui.showModal(_('Pairing'), [
			E('p', {}, _('Listening for device join requests…')),
			E('div', { 'class': 'spinning' })
		]);
		return API.triggerPairing().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Pairing window opened for 2 minutes.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Unable to start pairing')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
