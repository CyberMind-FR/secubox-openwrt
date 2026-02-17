'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

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

// State
var currentZone = null;
var currentRecords = [];
var allZones = [];
var typeFilter = 'ALL';

// Record type definitions
var RECORD_TYPES = {
	'A':     { color: '#3fb950', label: 'IPv4 Address', placeholder: '192.168.1.1' },
	'AAAA':  { color: '#58a6ff', label: 'IPv6 Address', placeholder: '2001:db8::1' },
	'CNAME': { color: '#39c5cf', label: 'Canonical Name', placeholder: 'target.example.com.' },
	'MX':    { color: '#a371f7', label: 'Mail Exchange', placeholder: '10 mail.example.com.' },
	'TXT':   { color: '#d29922', label: 'Text Record', placeholder: '"v=spf1 mx ~all"' },
	'SRV':   { color: '#db6d28', label: 'Service', placeholder: '0 0 443 target.example.com.' },
	'NS':    { color: '#8b949e', label: 'Nameserver', placeholder: 'ns1.example.com.' },
	'PTR':   { color: '#8b949e', label: 'Pointer', placeholder: 'host.example.com.' },
	'CAA':   { color: '#f85149', label: 'Cert Authority', placeholder: '0 issue "letsencrypt.org"' }
};

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callZones()
		]);
	},

	css: function() {
		return `
/* KISS DNS Master */
:root {
	--k-bg: #0d1117; --k-surface: #161b22; --k-card: #1c2128;
	--k-line: #30363d; --k-text: #e6edf3; --k-muted: #8b949e;
	--k-green: #3fb950; --k-red: #f85149; --k-blue: #58a6ff;
	--k-cyan: #39c5cf; --k-purple: #a371f7; --k-yellow: #d29922;
	--k-orange: #db6d28;
}
.dns-wrap { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--k-text); }
.dns-header { margin-bottom: 24px; }
.dns-header h2 { margin: 0 0 4px 0; font-size: 26px; font-weight: 700; }
.dns-header p { color: var(--k-muted); margin: 0; font-size: 14px; }

/* Stats Grid */
.dns-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; }
.dns-stat { background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 10px; padding: 16px; text-align: center; }
.dns-stat-val { font-size: 28px; font-weight: 700; line-height: 1.2; }
.dns-stat-lbl { font-size: 11px; color: var(--k-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

/* Cards */
.dns-card { background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
.dns-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.dns-card-title { font-size: 13px; font-weight: 600; color: var(--k-muted); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
.dns-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Buttons */
.dns-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 6px; border: 1px solid var(--k-line); background: var(--k-card); color: var(--k-text); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.dns-btn:hover { background: var(--k-line); border-color: var(--k-muted); }
.dns-btn-sm { padding: 4px 10px; font-size: 11px; }
.dns-btn-green { background: var(--k-green); border-color: var(--k-green); color: #000; }
.dns-btn-green:hover { background: #2ea043; }
.dns-btn-blue { background: var(--k-blue); border-color: var(--k-blue); color: #000; }
.dns-btn-blue:hover { background: #4090e0; }
.dns-btn-red { background: transparent; border-color: var(--k-red); color: var(--k-red); }
.dns-btn-red:hover { background: rgba(248,81,73,0.15); }
.dns-btn-icon { padding: 5px 8px; }

/* Table */
.dns-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.dns-table th { text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 600; color: var(--k-muted); text-transform: uppercase; border-bottom: 1px solid var(--k-line); }
.dns-table td { padding: 10px 12px; border-bottom: 1px solid var(--k-line); vertical-align: middle; }
.dns-table tr:hover td { background: rgba(255,255,255,0.02); }
.dns-table .mono { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
.dns-table .truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dns-table .actions { display: flex; gap: 6px; justify-content: flex-end; }

/* Badges */
.dns-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
.dns-badge-ok { background: rgba(63,185,80,0.15); color: var(--k-green); }
.dns-badge-err { background: rgba(248,81,73,0.15); color: var(--k-red); }

/* Type badge */
.dns-type { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; font-family: monospace; }

/* Filter bar */
.dns-filter { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.dns-filter-group { display: flex; gap: 4px; }
.dns-filter-btn { padding: 5px 10px; border-radius: 4px; border: 1px solid var(--k-line); background: transparent; color: var(--k-muted); font-size: 11px; cursor: pointer; transition: all 0.15s; }
.dns-filter-btn:hover { color: var(--k-text); border-color: var(--k-muted); }
.dns-filter-btn.active { background: var(--k-blue); border-color: var(--k-blue); color: #000; }
.dns-search { flex: 1; min-width: 150px; max-width: 300px; }
.dns-search input { width: 100%; padding: 6px 10px; border-radius: 5px; border: 1px solid var(--k-line); background: var(--k-bg); color: var(--k-text); font-size: 12px; }
.dns-search input:focus { outline: none; border-color: var(--k-blue); }
.dns-search input::placeholder { color: var(--k-muted); }

/* Zone selector */
.dns-zone-select { display: flex; gap: 8px; align-items: center; }
.dns-zone-select select { padding: 6px 10px; border-radius: 5px; border: 1px solid var(--k-line); background: var(--k-bg); color: var(--k-text); font-size: 12px; min-width: 180px; }
.dns-zone-select select:focus { outline: none; border-color: var(--k-blue); }

/* Modal */
.dns-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.dns-modal { background: var(--k-surface); border: 1px solid var(--k-line); border-radius: 12px; padding: 20px; width: 420px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
.dns-modal-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.dns-modal-close { margin-left: auto; background: none; border: none; color: var(--k-muted); font-size: 18px; cursor: pointer; padding: 4px; }
.dns-modal-close:hover { color: var(--k-text); }

/* Form */
.dns-form-row { margin-bottom: 14px; }
.dns-form-label { display: block; font-size: 11px; color: var(--k-muted); margin-bottom: 5px; text-transform: uppercase; }
.dns-form-input { width: 100%; padding: 8px 10px; border-radius: 5px; border: 1px solid var(--k-line); background: var(--k-bg); color: var(--k-text); font-size: 13px; box-sizing: border-box; }
.dns-form-input:focus { outline: none; border-color: var(--k-blue); }
.dns-form-hint { font-size: 11px; color: var(--k-muted); margin-top: 4px; }
.dns-form-row-inline { display: flex; gap: 8px; align-items: center; }
.dns-form-suffix { color: var(--k-muted); font-size: 12px; white-space: nowrap; }
.dns-form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--k-line); }

/* Empty state */
.dns-empty { text-align: center; padding: 40px 20px; color: var(--k-muted); }
.dns-empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }
.dns-empty-text { font-size: 13px; }

/* Two column layout */
.dns-cols { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
@media (max-width: 900px) { .dns-cols { grid-template-columns: 1fr; } }
`;
	},

	statCard: function(label, value, color, id) {
		return E('div', { 'class': 'dns-stat' }, [
			E('div', { 'class': 'dns-stat-val', 'style': 'color:' + color, 'data-stat': id }, String(value)),
			E('div', { 'class': 'dns-stat-lbl' }, label)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var zonesData = data[1] || {};
		allZones = zonesData.zones || [];

		poll.add(function() {
			return Promise.all([callStatus(), callZones()]).then(function(d) {
				self.updateStats(d[0]);
				allZones = (d[1] || {}).zones || [];
				self.updateZonesTable();
			});
		}, 15);

		var isRunning = status.running === true;

		return E('div', { 'class': 'dns-wrap' }, [
			E('style', {}, this.css()),

			// Header
			E('div', { 'class': 'dns-header' }, [
				E('h2', {}, '🌐 DNS Master'),
				E('p', {}, 'BIND DNS Zone Management')
			]),

			// Stats
			E('div', { 'class': 'dns-stats' }, [
				this.statCard('Status', isRunning ? 'Running' : 'Stopped', isRunning ? 'var(--k-green)' : 'var(--k-red)', 'status'),
				this.statCard('Zones', status.zones || 0, 'var(--k-blue)', 'zones'),
				this.statCard('Records', status.records || 0, 'var(--k-cyan)', 'records'),
				this.statCard('TTL', (status.default_ttl || 300) + 's', 'var(--k-purple)', 'ttl')
			]),

			// Two column layout
			E('div', { 'class': 'dns-cols' }, [
				// Left: Zones
				E('div', { 'class': 'dns-card' }, [
					E('div', { 'class': 'dns-card-head' }, [
						E('div', { 'class': 'dns-card-title' }, '📁 Zones'),
						E('button', { 'class': 'dns-btn dns-btn-green dns-btn-sm', 'click': L.bind(this.showAddZoneModal, this) }, '+ Add')
					]),
					E('div', { 'id': 'zones-list' }, this.renderZonesList(allZones))
				]),

				// Right: Records
				E('div', { 'class': 'dns-card' }, [
					E('div', { 'class': 'dns-card-head' }, [
						E('div', { 'class': 'dns-card-title' }, [
							E('span', {}, '📝 Records'),
							E('span', { 'id': 'current-zone-label', 'style': 'color: var(--k-blue); font-weight: 400;' }, '')
						]),
						E('div', { 'class': 'dns-card-actions' }, [
							E('button', { 'class': 'dns-btn dns-btn-sm', 'click': L.bind(this.handleReload, this) }, '🔄 Reload'),
							E('button', { 'class': 'dns-btn dns-btn-green dns-btn-sm', 'id': 'add-record-btn', 'style': 'display:none;', 'click': L.bind(this.showRecordModal, this, null) }, '+ Add')
						])
					]),
					E('div', { 'id': 'records-filter', 'style': 'display:none;' }, this.renderFilter()),
					E('div', { 'id': 'records-container' }, this.renderEmptyRecords())
				])
			])
		]);
	},

	renderZonesList: function(zones) {
		var self = this;
		if (!zones || zones.length === 0) {
			return E('div', { 'class': 'dns-empty' }, [
				E('div', { 'class': 'dns-empty-icon' }, '📂'),
				E('div', { 'class': 'dns-empty-text' }, 'No zones configured')
			]);
		}

		return E('div', {}, zones.map(function(zone) {
			var isActive = currentZone === zone.name;
			return E('div', {
				'style': 'display: flex; align-items: center; padding: 10px; border-radius: 6px; margin-bottom: 6px; cursor: pointer; border: 1px solid ' + (isActive ? 'var(--k-blue)' : 'transparent') + '; background: ' + (isActive ? 'rgba(88,166,255,0.1)' : 'var(--k-card)') + ';',
				'click': L.bind(self.selectZone, self, zone.name)
			}, [
				E('div', { 'style': 'flex: 1; min-width: 0;' }, [
					E('div', { 'style': 'font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis;' }, zone.name),
					E('div', { 'style': 'font-size: 11px; color: var(--k-muted); margin-top: 2px;' }, zone.records + ' records')
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
					zone.valid ?
						E('span', { 'class': 'dns-badge dns-badge-ok' }, '✓') :
						E('span', { 'class': 'dns-badge dns-badge-err' }, '✗'),
					E('button', {
						'class': 'dns-btn dns-btn-icon dns-btn-sm',
						'title': 'Backup',
						'click': function(ev) { ev.stopPropagation(); self.handleBackupZone(zone.name); }
					}, '💾')
				])
			]);
		}));
	},

	renderEmptyRecords: function() {
		return E('div', { 'class': 'dns-empty' }, [
			E('div', { 'class': 'dns-empty-icon' }, '👈'),
			E('div', { 'class': 'dns-empty-text' }, 'Select a zone to view records')
		]);
	},

	renderFilter: function() {
		var self = this;
		var types = ['ALL'].concat(Object.keys(RECORD_TYPES));

		return E('div', { 'class': 'dns-filter' }, [
			E('div', { 'class': 'dns-filter-group' }, types.map(function(t) {
				return E('button', {
					'class': 'dns-filter-btn' + (typeFilter === t ? ' active' : ''),
					'data-type': t,
					'click': function() { self.setTypeFilter(t); }
				}, t);
			})),
			E('div', { 'class': 'dns-search' }, [
				E('input', {
					'type': 'text',
					'placeholder': '🔍 Search records...',
					'id': 'record-search',
					'input': L.bind(this.filterRecords, this)
				})
			])
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
			return E('div', { 'class': 'dns-empty' }, [
				E('div', { 'class': 'dns-empty-icon' }, '🔍'),
				E('div', { 'class': 'dns-empty-text' }, typeFilter !== 'ALL' || search ? 'No matching records' : 'No records in this zone')
			]);
		}

		return E('table', { 'class': 'dns-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', { 'style': 'width: 60px;' }, 'Type'),
					E('th', {}, 'Name'),
					E('th', {}, 'Value'),
					E('th', { 'style': 'width: 50px;' }, 'TTL'),
					E('th', { 'style': 'width: 80px; text-align: right;' }, '')
				])
			]),
			E('tbody', {}, filtered.map(function(rec) {
				var typeInfo = RECORD_TYPES[rec.type] || { color: 'var(--k-muted)' };
				// Clean up value display (remove extra "IN TYPE" if present)
				var displayValue = rec.value.replace(/^\s*IN\s+\w+\s+/, '').trim();

				return E('tr', {}, [
					E('td', {}, [
						E('span', {
							'class': 'dns-type',
							'style': 'background: ' + typeInfo.color + '20; color: ' + typeInfo.color + ';'
						}, rec.type)
					]),
					E('td', { 'class': 'mono' }, rec.name),
					E('td', { 'class': 'mono truncate', 'title': displayValue }, displayValue),
					E('td', { 'style': 'color: var(--k-muted);' }, rec.ttl || '-'),
					E('td', { 'class': 'actions' }, [
						E('button', {
							'class': 'dns-btn dns-btn-icon dns-btn-sm',
							'title': 'Edit',
							'click': L.bind(self.showRecordModal, self, rec)
						}, '✏️'),
						E('button', {
							'class': 'dns-btn dns-btn-icon dns-btn-sm dns-btn-red',
							'title': 'Delete',
							'click': L.bind(self.handleDeleteRecord, self, rec)
						}, '✗')
					])
				]);
			}))
		]);
	},

	selectZone: function(zoneName) {
		var self = this;
		currentZone = zoneName;
		typeFilter = 'ALL';

		document.getElementById('current-zone-label').textContent = ': ' + zoneName;
		document.getElementById('add-record-btn').style.display = '';
		document.getElementById('records-filter').style.display = '';

		callRecords(zoneName).then(function(data) {
			currentRecords = data.records || [];
			self.updateRecordsTable();
			self.updateZonesTable();
		});
	},

	setTypeFilter: function(type) {
		typeFilter = type;
		document.querySelectorAll('.dns-filter-btn').forEach(function(btn) {
			btn.classList.toggle('active', btn.dataset.type === type);
		});
		this.updateRecordsTable();
	},

	filterRecords: function() {
		this.updateRecordsTable();
	},

	updateStats: function(status) {
		var isRunning = status.running === true;
		var updates = {
			'status': { val: isRunning ? 'Running' : 'Stopped', color: isRunning ? 'var(--k-green)' : 'var(--k-red)' },
			'zones': { val: status.zones || 0 },
			'records': { val: status.records || 0 },
			'ttl': { val: (status.default_ttl || 300) + 's' }
		};
		Object.keys(updates).forEach(function(k) {
			var el = document.querySelector('[data-stat="' + k + '"]');
			if (el) {
				el.textContent = updates[k].val;
				if (updates[k].color) el.style.color = updates[k].color;
			}
		});
	},

	updateZonesTable: function() {
		var container = document.getElementById('zones-list');
		if (container) dom.content(container, this.renderZonesList(allZones));
	},

	updateRecordsTable: function() {
		var container = document.getElementById('records-container');
		if (container) dom.content(container, this.renderRecordsTable(currentRecords));
	},

	// === Modals ===

	showAddZoneModal: function() {
		var self = this;
		var modal = E('div', { 'class': 'dns-modal-bg', 'id': 'modal-zone' }, [
			E('div', { 'class': 'dns-modal' }, [
				E('div', { 'class': 'dns-modal-title' }, [
					'📁 Add Zone',
					E('button', { 'class': 'dns-modal-close', 'click': function() { document.getElementById('modal-zone').remove(); } }, '×')
				]),
				E('div', { 'class': 'dns-form-row' }, [
					E('label', { 'class': 'dns-form-label' }, 'Zone Name'),
					E('input', { 'type': 'text', 'class': 'dns-form-input', 'id': 'input-zone-name', 'placeholder': 'example.com' }),
					E('div', { 'class': 'dns-form-hint' }, 'Enter the domain name for this zone')
				]),
				E('div', { 'class': 'dns-form-actions' }, [
					E('button', { 'class': 'dns-btn', 'click': function() { document.getElementById('modal-zone').remove(); } }, 'Cancel'),
					E('button', { 'class': 'dns-btn dns-btn-green', 'click': L.bind(self.handleAddZone, self) }, '+ Create Zone')
				])
			])
		]);
		document.body.appendChild(modal);
		document.getElementById('input-zone-name').focus();
	},

	showRecordModal: function(record) {
		var self = this;
		var isEdit = !!record;
		var title = isEdit ? '✏️ Edit Record' : '➕ Add Record';

		var typeOptions = Object.keys(RECORD_TYPES).map(function(t) {
			var info = RECORD_TYPES[t];
			return E('option', { 'value': t, 'selected': isEdit && record.type === t }, t + ' - ' + info.label);
		});

		var modal = E('div', { 'class': 'dns-modal-bg', 'id': 'modal-record' }, [
			E('div', { 'class': 'dns-modal' }, [
				E('div', { 'class': 'dns-modal-title' }, [
					title,
					E('button', { 'class': 'dns-modal-close', 'click': function() { document.getElementById('modal-record').remove(); } }, '×')
				]),
				E('div', { 'class': 'dns-form-row' }, [
					E('label', { 'class': 'dns-form-label' }, 'Type'),
					E('select', {
						'class': 'dns-form-input',
						'id': 'input-rec-type',
						'disabled': isEdit,
						'change': L.bind(this.updatePlaceholder, this)
					}, typeOptions)
				]),
				E('div', { 'class': 'dns-form-row' }, [
					E('label', { 'class': 'dns-form-label' }, 'Name'),
					E('div', { 'class': 'dns-form-row-inline' }, [
						E('input', {
							'type': 'text',
							'class': 'dns-form-input',
							'id': 'input-rec-name',
							'placeholder': '@ or www',
							'value': isEdit ? record.name : '',
							'style': 'flex: 1;'
						}),
						E('span', { 'class': 'dns-form-suffix' }, '.' + currentZone)
					]),
					E('div', { 'class': 'dns-form-hint' }, 'Use @ for zone root')
				]),
				E('div', { 'class': 'dns-form-row' }, [
					E('label', { 'class': 'dns-form-label' }, 'Value'),
					E('input', {
						'type': 'text',
						'class': 'dns-form-input',
						'id': 'input-rec-value',
						'placeholder': isEdit ? '' : RECORD_TYPES['A'].placeholder,
						'value': isEdit ? record.value.replace(/^\s*IN\s+\w+\s+/, '').trim() : ''
					}),
					E('div', { 'class': 'dns-form-hint', 'id': 'value-hint' }, isEdit ? '' : RECORD_TYPES['A'].label)
				]),
				E('div', { 'class': 'dns-form-row' }, [
					E('label', { 'class': 'dns-form-label' }, 'TTL (seconds)'),
					E('input', {
						'type': 'number',
						'class': 'dns-form-input',
						'id': 'input-rec-ttl',
						'placeholder': '300',
						'value': isEdit && record.ttl ? record.ttl : '',
						'style': 'width: 120px;'
					})
				]),
				E('div', { 'class': 'dns-form-actions' }, [
					E('button', { 'class': 'dns-btn', 'click': function() { document.getElementById('modal-record').remove(); } }, 'Cancel'),
					E('button', {
						'class': 'dns-btn dns-btn-green',
						'click': L.bind(self.handleSaveRecord, self, record)
					}, isEdit ? '💾 Save' : '+ Add')
				])
			])
		]);

		document.body.appendChild(modal);
		if (!isEdit) document.getElementById('input-rec-name').focus();
	},

	updatePlaceholder: function() {
		var type = document.getElementById('input-rec-type').value;
		var info = RECORD_TYPES[type] || { placeholder: '', label: '' };
		document.getElementById('input-rec-value').placeholder = info.placeholder;
		document.getElementById('value-hint').textContent = info.label;
	},

	// === Handlers ===

	handleAddZone: function() {
		var self = this;
		var name = document.getElementById('input-zone-name').value.trim();
		if (!name) {
			ui.addNotification(null, E('p', {}, 'Zone name required'), 'warning');
			return;
		}
		callAddZone(name).then(function(res) {
			document.getElementById('modal-zone').remove();
			if (res.code === 0) {
				ui.addNotification(null, E('p', {}, 'Zone created: ' + name), 'success');
				callZones().then(function(d) {
					allZones = (d || {}).zones || [];
					self.updateZonesTable();
					self.selectZone(name);
				});
			} else {
				ui.addNotification(null, E('p', {}, res.output || 'Error'), 'error');
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
			ui.addNotification(null, E('p', {}, 'Value required'), 'warning');
			return;
		}

		var doAdd = function() {
			callAddRecord(currentZone, type, name, value, ttl ? parseInt(ttl) : null).then(function(res) {
				document.getElementById('modal-record').remove();
				if (res.code === 0) {
					ui.addNotification(null, E('p', {}, 'Record saved'), 'success');
					self.selectZone(currentZone);
				} else {
					ui.addNotification(null, E('p', {}, res.output || 'Error'), 'error');
				}
			});
		};

		// If editing, delete old record first
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
				ui.addNotification(null, E('p', {}, 'Record deleted'), 'success');
				self.selectZone(currentZone);
			} else {
				ui.addNotification(null, E('p', {}, res.output || 'Error'), 'error');
			}
		});
	},

	handleReload: function() {
		callReload().then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', {}, 'BIND reloaded'), 'success');
			} else {
				ui.addNotification(null, E('p', {}, res.output || 'Reload failed'), 'error');
			}
		});
	},

	handleBackupZone: function(zoneName) {
		callBackup(zoneName).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', {}, 'Zone backed up: ' + zoneName), 'success');
			} else {
				ui.addNotification(null, E('p', {}, res.output || 'Backup failed'), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
