'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.dns-master',
	method: 'status',
	expect: {}
});

var callZones = rpc.declare({
	object: 'luci.dns-master',
	method: 'zones',
	expect: {}
});

var callRecords = rpc.declare({
	object: 'luci.dns-master',
	method: 'records',
	params: ['zone'],
	expect: {}
});

var callAddRecord = rpc.declare({
	object: 'luci.dns-master',
	method: 'add_record',
	params: ['zone', 'type', 'name', 'value', 'ttl'],
	expect: {}
});

var callDelRecord = rpc.declare({
	object: 'luci.dns-master',
	method: 'del_record',
	params: ['zone', 'type', 'name', 'value'],
	expect: {}
});

var callAddZone = rpc.declare({
	object: 'luci.dns-master',
	method: 'add_zone',
	params: ['name'],
	expect: {}
});

var callReload = rpc.declare({
	object: 'luci.dns-master',
	method: 'reload',
	expect: {}
});

var callCheck = rpc.declare({
	object: 'luci.dns-master',
	method: 'check',
	params: ['zone'],
	expect: {}
});

var callBackup = rpc.declare({
	object: 'luci.dns-master',
	method: 'backup',
	params: ['zone'],
	expect: {}
});

var currentZone = null;
var currentRecords = [];
var allZones = [];
var typeFilter = 'ALL';

var RECORD_TYPES = {
	'A':     { color: 'var(--kiss-green)', label: 'IPv4 Address', placeholder: '192.168.1.1' },
	'AAAA':  { color: 'var(--kiss-blue)', label: 'IPv6 Address', placeholder: '2001:db8::1' },
	'CNAME': { color: 'var(--kiss-cyan)', label: 'Canonical Name', placeholder: 'target.example.com.' },
	'MX':    { color: 'var(--kiss-purple)', label: 'Mail Exchange', placeholder: '10 mail.example.com.' },
	'TXT':   { color: 'var(--kiss-yellow)', label: 'Text Record', placeholder: '"v=spf1 mx ~all"' },
	'SRV':   { color: 'var(--kiss-orange)', label: 'Service', placeholder: '0 0 443 target.example.com.' },
	'NS':    { color: 'var(--kiss-muted)', label: 'Nameserver', placeholder: 'ns1.example.com.' },
	'PTR':   { color: 'var(--kiss-muted)', label: 'Pointer', placeholder: 'host.example.com.' },
	'CAA':   { color: 'var(--kiss-red)', label: 'Cert Authority', placeholder: '0 issue "letsencrypt.org"' }
};

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callZones()
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/dns-master/overview' },
			{ name: 'Settings', path: 'admin/services/dns-master/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var isRunning = status.running === true;

		return [
			KissTheme.stat(isRunning ? 'UP' : 'DOWN', 'BIND', isRunning ? c.green : c.red),
			KissTheme.stat(status.zones || 0, 'Zones', c.blue),
			KissTheme.stat(status.records || 0, 'Records', c.cyan),
			KissTheme.stat((status.default_ttl || 300) + 's', 'TTL', c.purple)
		];
	},

	renderZonesList: function(zones) {
		var self = this;

		if (!zones || zones.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No zones configured');
		}

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, zones.map(function(zone) {
			var isActive = currentZone === zone.name;

			return E('div', {
				'style': 'display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 6px; cursor: pointer; border: 1px solid ' + (isActive ? 'var(--kiss-blue)' : 'var(--kiss-line)') + '; background: ' + (isActive ? 'rgba(0,176,255,0.1)' : 'var(--kiss-bg2)') + ';',
				'click': L.bind(self.selectZone, self, zone.name)
			}, [
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 600; font-size: 13px;' }, zone.name),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, zone.records + ' records')
				]),
				zone.valid ?
					E('span', { 'style': 'color: var(--kiss-green); font-size: 12px;' }, '\u2713') :
					E('span', { 'style': 'color: var(--kiss-red); font-size: 12px;' }, '\u2717'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 4px 8px; font-size: 11px;',
					'click': function(ev) { ev.stopPropagation(); self.handleBackupZone(zone.name); }
				}, 'Backup')
			]);
		}));
	},

	renderFilter: function() {
		var self = this;
		var types = ['ALL'].concat(Object.keys(RECORD_TYPES));

		return E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;' }, [
			E('div', { 'style': 'display: flex; gap: 4px; flex-wrap: wrap;' }, types.map(function(t) {
				return E('button', {
					'class': 'kiss-btn' + (typeFilter === t ? ' kiss-btn-blue' : ''),
					'style': 'padding: 4px 10px; font-size: 10px;',
					'data-type': t,
					'click': function() { self.setTypeFilter(t); }
				}, t);
			})),
			E('input', {
				'type': 'text',
				'id': 'record-search',
				'placeholder': 'Search records...',
				'style': 'flex: 1; min-width: 150px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 6px 10px; border-radius: 5px; font-size: 12px;',
				'input': L.bind(this.filterRecords, this)
			})
		]);
	},

	renderRecordsTable: function(records) {
		var self = this;
		var search = (document.getElementById('record-search') || {}).value || '';
		search = search.toLowerCase();

		var filtered = records.filter(function(r) {
			if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
			if (search && r.name.toLowerCase().indexOf(search) === -1 && r.value.toLowerCase().indexOf(search) === -1) return false;
			return true;
		});

		if (filtered.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, typeFilter !== 'ALL' || search ? 'No matching records' : 'No records in this zone');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'width: 60px;' }, 'Type'),
				E('th', {}, 'Name'),
				E('th', {}, 'Value'),
				E('th', { 'style': 'width: 50px;' }, 'TTL'),
				E('th', { 'style': 'width: 80px;' }, '')
			])),
			E('tbody', {}, filtered.map(function(rec) {
				var typeInfo = RECORD_TYPES[rec.type] || { color: 'var(--kiss-muted)' };
				var displayValue = rec.value.replace(/^\s*IN\s+\w+\s+/, '').trim();

				return E('tr', {}, [
					E('td', {}, E('span', {
						'style': 'display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; font-family: monospace; background: ' + typeInfo.color + '20; color: ' + typeInfo.color + ';'
					}, rec.type)),
					E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, rec.name),
					E('td', { 'style': 'font-family: monospace; font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;', 'title': displayValue }, displayValue),
					E('td', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, rec.ttl || '-'),
					E('td', {}, E('div', { 'style': 'display: flex; gap: 4px;' }, [
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding: 4px 8px; font-size: 10px;',
							'click': L.bind(self.showRecordModal, self, rec)
						}, 'Edit'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 8px; font-size: 10px;',
							'click': L.bind(self.handleDeleteRecord, self, rec)
						}, 'Del')
					]))
				]);
			}))
		]);
	},

	selectZone: function(zoneName) {
		var self = this;
		currentZone = zoneName;
		typeFilter = 'ALL';

		var zoneLabel = document.getElementById('current-zone-label');
		if (zoneLabel) zoneLabel.textContent = ': ' + zoneName;

		var addBtn = document.getElementById('add-record-btn');
		if (addBtn) addBtn.style.display = '';

		var filterEl = document.getElementById('records-filter');
		if (filterEl) filterEl.style.display = '';

		callRecords(zoneName).then(function(data) {
			currentRecords = data.records || [];
			self.updateRecordsTable();
			self.updateZonesTable();
		});
	},

	setTypeFilter: function(type) {
		typeFilter = type;
		this.updateRecordsTable();
	},

	filterRecords: function() {
		this.updateRecordsTable();
	},

	updateZonesTable: function() {
		var container = document.getElementById('zones-list');
		if (container) dom.content(container, this.renderZonesList(allZones));
	},

	updateRecordsTable: function() {
		var container = document.getElementById('records-container');
		if (container) dom.content(container, this.renderRecordsTable(currentRecords));
	},

	showAddZoneModal: function() {
		var self = this;
		ui.showModal('Add Zone', [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Zone Name'),
				E('input', { 'type': 'text', 'id': 'input-zone-name', 'placeholder': 'example.com', 'style': 'width: 100%; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' })
			]),
			E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': L.bind(self.handleAddZone, self) }, 'Create')
			])
		]);
	},

	showRecordModal: function(record) {
		var self = this;
		var isEdit = !!record;
		var title = isEdit ? 'Edit Record' : 'Add Record';

		ui.showModal(title, [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Type'),
					E('select', { 'id': 'input-rec-type', 'disabled': isEdit, 'style': 'width: 100%; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' },
						Object.keys(RECORD_TYPES).map(function(t) {
							return E('option', { 'value': t, 'selected': isEdit && record.type === t }, t + ' - ' + RECORD_TYPES[t].label);
						})
					)
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Name'),
					E('input', { 'type': 'text', 'id': 'input-rec-name', 'placeholder': '@ or www', 'value': isEdit ? record.name : '', 'style': 'width: 100%; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' })
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Value'),
					E('input', { 'type': 'text', 'id': 'input-rec-value', 'placeholder': isEdit ? '' : RECORD_TYPES['A'].placeholder, 'value': isEdit ? record.value.replace(/^\s*IN\s+\w+\s+/, '').trim() : '', 'style': 'width: 100%; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' })
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'TTL (seconds)'),
					E('input', { 'type': 'number', 'id': 'input-rec-ttl', 'placeholder': '300', 'value': isEdit && record.ttl ? record.ttl : '', 'style': 'width: 120px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;' })
				])
			]),
			E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': L.bind(self.handleSaveRecord, self, record) }, isEdit ? 'Save' : 'Add')
			])
		]);
	},

	handleAddZone: function() {
		var self = this;
		var name = document.getElementById('input-zone-name').value.trim();
		if (!name) {
			ui.addNotification(null, E('p', 'Zone name required'), 'warning');
			return;
		}
		callAddZone(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Zone created: ' + name), 'success');
				callZones().then(function(d) {
					allZones = (d || {}).zones || [];
					self.updateZonesTable();
					self.selectZone(name);
				});
			} else {
				ui.addNotification(null, E('p', res.output || 'Error'), 'error');
			}
		});
	},

	handleSaveRecord: function(oldRecord) {
		var self = this;
		var type = document.getElementById('input-rec-type').value;
		var name = document.getElementById('input-rec-name').value.trim() || '@';
		var value = document.getElementById('input-rec-value').value.trim();
		var ttl = document.getElementById('input-rec-ttl').value.trim();

		if (!value) {
			ui.addNotification(null, E('p', 'Value required'), 'warning');
			return;
		}

		var doAdd = function() {
			callAddRecord(currentZone, type, name, value, ttl ? parseInt(ttl) : null).then(function(res) {
				ui.hideModal();
				if (res.code === 0) {
					ui.addNotification(null, E('p', 'Record saved'), 'success');
					self.selectZone(currentZone);
				} else {
					ui.addNotification(null, E('p', res.output || 'Error'), 'error');
				}
			});
		};

		if (oldRecord) {
			callDelRecord(currentZone, oldRecord.type, oldRecord.name, oldRecord.value).then(doAdd);
		} else {
			doAdd();
		}
	},

	handleDeleteRecord: function(record) {
		var self = this;
		if (!confirm('Delete ' + record.type + ' record for "' + record.name + '"?')) return;

		callDelRecord(currentZone, record.type, record.name, record.value).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Record deleted'), 'success');
				self.selectZone(currentZone);
			} else {
				ui.addNotification(null, E('p', res.output || 'Error'), 'error');
			}
		});
	},

	handleReload: function() {
		callReload().then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'BIND reloaded'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output || 'Reload failed'), 'error');
			}
		});
	},

	handleBackupZone: function(zoneName) {
		callBackup(zoneName).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Zone backed up: ' + zoneName), 'success');
			} else {
				ui.addNotification(null, E('p', res.output || 'Backup failed'), 'error');
			}
		});
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var zonesData = data[1] || {};
		allZones = zonesData.zones || [];

		var isRunning = status.running === true;

		poll.add(function() {
			return Promise.all([callStatus(), callZones()]).then(function(d) {
				var statsEl = document.getElementById('dns-stats');
				if (statsEl) {
					dom.content(statsEl, self.renderStats(d[0]));
				}
				allZones = (d[1] || {}).zones || [];
				self.updateZonesTable();
			});
		}, 15);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'DNS Master'),
					KissTheme.badge(isRunning ? 'RUNNING' : 'STOPPED', isRunning ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'BIND DNS Zone Management')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'dns-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Zones
				KissTheme.card('Zones', E('div', {}, [
					E('div', { 'style': 'display: flex; justify-content: flex-end; margin-bottom: 12px;' }, [
						E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': L.bind(this.showAddZoneModal, this) }, '+ Add Zone')
					]),
					E('div', { 'id': 'zones-list' }, this.renderZonesList(allZones))
				])),

				// Records
				KissTheme.card('Records', E('div', {}, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
						E('span', { 'id': 'current-zone-label', 'style': 'color: var(--kiss-cyan); font-weight: 600;' }, ''),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', { 'class': 'kiss-btn', 'click': L.bind(this.handleReload, this) }, 'Reload BIND'),
							E('button', { 'class': 'kiss-btn kiss-btn-green', 'id': 'add-record-btn', 'style': 'display: none;', 'click': L.bind(this.showRecordModal, this, null) }, '+ Add Record')
						])
					]),
					E('div', { 'id': 'records-filter', 'style': 'display: none;' }, this.renderFilter()),
					E('div', { 'id': 'records-container' }, E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'Select a zone to view records'))
				]))
			])
		];

		return KissTheme.wrap(content, 'admin/services/dns-master/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
