'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';

/**
 * CrowdSec Dashboard - Decisions View
 * Detailed view and management of all active decisions
 * Copyright (C) 2024 CyberMind.fr - Gandalf
 */

return view.extend({
	title: _('Decisions'),
	
	csApi: null,
	decisions: [],
	filteredDecisions: [],
	searchQuery: '',
	sortField: 'value',
	sortOrder: 'asc',

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(cssLink);
		
		this.csApi = new api();
		return this.csApi.getDecisions();
	},

	filterDecisions: function() {
		var self = this;
		var query = this.searchQuery.toLowerCase();
		
		this.filteredDecisions = this.decisions.filter(function(d) {
			if (!query) return true;
			
			var searchFields = [
				d.value,
				d.scenario,
				d.country,
				d.type,
				d.origin
			].filter(Boolean).join(' ').toLowerCase();
			
			return searchFields.indexOf(query) !== -1;
		});
		
		// Sort
		this.filteredDecisions.sort(function(a, b) {
			var aVal = a[self.sortField] || '';
			var bVal = b[self.sortField] || '';
			
			if (self.sortOrder === 'asc') {
				return aVal.localeCompare(bVal);
			} else {
				return bVal.localeCompare(aVal);
			}
		});
	},

	handleSearch: function(ev) {
		this.searchQuery = ev.target.value;
		this.filterDecisions();
		this.updateTable();
	},

	handleSort: function(field, ev) {
		if (this.sortField === field) {
			this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortField = field;
			this.sortOrder = 'asc';
		}
		this.filterDecisions();
		this.updateTable();
	},

	handleUnban: function(ip, ev) {
		var self = this;
		
		if (!confirm('Remove ban for ' + ip + '?')) {
			return;
		}
		
		this.csApi.unbanIP(ip).then(function(result) {
			if (result.success) {
				self.showToast('IP ' + ip + ' unbanned successfully', 'success');
				return self.csApi.getDecisions();
			} else {
				self.showToast('Failed to unban: ' + (result.error || 'Unknown error'), 'error');
				return null;
			}
		}).then(function(data) {
			if (data) {
				self.decisions = data;
				self.filterDecisions();
				self.updateTable();
			}
		}).catch(function(err) {
			self.showToast('Error: ' + err.message, 'error');
		});
	},

	handleBulkUnban: function(ev) {
		var self = this;
		var checkboxes = document.querySelectorAll('.cs-decision-checkbox:checked');
		
		if (checkboxes.length === 0) {
			self.showToast('No decisions selected', 'error');
			return;
		}
		
		if (!confirm('Remove ban for ' + checkboxes.length + ' IP(s)?')) {
			return;
		}
		
		var promises = [];
		checkboxes.forEach(function(cb) {
			promises.push(self.csApi.unbanIP(cb.dataset.ip));
		});
		
		Promise.all(promises).then(function(results) {
			var success = results.filter(function(r) { return r.success; }).length;
			var failed = results.length - success;
			
			if (success > 0) {
				self.showToast(success + ' IP(s) unbanned' + (failed > 0 ? ', ' + failed + ' failed' : ''), 
					failed > 0 ? 'warning' : 'success');
			} else {
				self.showToast('Failed to unban IPs', 'error');
			}
			
			return self.csApi.getDecisions();
		}).then(function(data) {
			if (data) {
				self.decisions = data;
				self.filterDecisions();
				self.updateTable();
			}
		});
	},

	handleSelectAll: function(ev) {
		var checked = ev.target.checked;
		document.querySelectorAll('.cs-decision-checkbox').forEach(function(cb) {
			cb.checked = checked;
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.cs-toast');
		if (existing) existing.remove();
		
		var toast = E('div', { 'class': 'cs-toast ' + (type || '') }, message);
		document.body.appendChild(toast);
		
		setTimeout(function() { toast.remove(); }, 4000);
	},

	updateTable: function() {
		var container = document.getElementById('decisions-table-container');
		if (container) {
			dom.content(container, this.renderTable());
		}
		
		var countEl = document.getElementById('decisions-count');
		if (countEl) {
			countEl.textContent = this.filteredDecisions.length + ' of ' + this.decisions.length + ' decisions';
		}
	},

	renderSortIcon: function(field) {
		if (this.sortField !== field) return ' ↕';
		return this.sortOrder === 'asc' ? ' ↑' : ' ↓';
	},

	renderTable: function() {
		var self = this;
		
		if (this.filteredDecisions.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, this.searchQuery ? '🔍' : '✅'),
				E('p', {}, this.searchQuery ? 'No matching decisions found' : 'No active decisions')
			]);
		}
		
		var rows = this.filteredDecisions.map(function(d, i) {
			return E('tr', {}, [
				E('td', {}, E('input', {
					'type': 'checkbox',
					'class': 'cs-decision-checkbox',
					'data-ip': d.value
				})),
				E('td', {}, E('span', { 'class': 'cs-ip' }, d.value || 'N/A')),
				E('td', {}, E('span', { 'class': 'cs-scenario' }, self.csApi.parseScenario(d.scenario))),
				E('td', {}, E('span', { 'class': 'cs-country' }, [
					E('span', { 'class': 'cs-country-flag' }, self.csApi.getCountryFlag(d.country)),
					' ',
					d.country || 'N/A'
				])),
				E('td', {}, d.origin || 'crowdsec'),
				E('td', {}, E('span', { 'class': 'cs-action ' + (d.type || 'ban') }, d.type || 'ban')),
				E('td', {}, E('span', { 'class': 'cs-time' }, self.csApi.formatDuration(d.duration))),
				E('td', {}, E('span', { 'class': 'cs-time' }, self.csApi.formatRelativeTime(d.created_at))),
				E('td', {}, E('button', {
					'class': 'cs-btn cs-btn-danger cs-btn-sm',
					'click': ui.createHandlerFn(self, 'handleUnban', d.value)
				}, 'Unban'))
			]);
		});
		
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'width: 40px' }, E('input', {
					'type': 'checkbox',
					'id': 'select-all',
					'change': ui.createHandlerFn(this, 'handleSelectAll')
				})),
				E('th', { 
					'click': ui.createHandlerFn(this, 'handleSort', 'value'),
					'style': 'cursor: pointer'
				}, 'IP Address' + this.renderSortIcon('value')),
				E('th', { 
					'click': ui.createHandlerFn(this, 'handleSort', 'scenario'),
					'style': 'cursor: pointer'
				}, 'Scenario' + this.renderSortIcon('scenario')),
				E('th', { 
					'click': ui.createHandlerFn(this, 'handleSort', 'country'),
					'style': 'cursor: pointer'
				}, 'Country' + this.renderSortIcon('country')),
				E('th', {}, 'Origin'),
				E('th', {}, 'Action'),
				E('th', {}, 'Expires'),
				E('th', {}, 'Created'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, rows)
		]);
	},

	renderBanModal: function() {
		return E('div', { 'class': 'cs-modal-overlay', 'id': 'ban-modal', 'style': 'display: none' }, [
			E('div', { 'class': 'cs-modal' }, [
				E('div', { 'class': 'cs-modal-header' }, [
					E('div', { 'class': 'cs-modal-title' }, 'Add IP Ban'),
					E('button', { 
						'class': 'cs-modal-close',
						'click': ui.createHandlerFn(this, 'closeBanModal')
					}, '×')
				]),
				E('div', { 'class': 'cs-modal-body' }, [
					E('div', { 'class': 'cs-form-group' }, [
						E('label', { 'class': 'cs-form-label' }, 'IP Address or Range'),
						E('input', { 
							'class': 'cs-input',
							'id': 'ban-ip',
							'type': 'text',
							'placeholder': '192.168.1.100 or 10.0.0.0/24'
						})
					]),
					E('div', { 'class': 'cs-form-group' }, [
						E('label', { 'class': 'cs-form-label' }, 'Duration'),
						E('input', { 
							'class': 'cs-input',
							'id': 'ban-duration',
							'type': 'text',
							'placeholder': '4h, 24h, 7d...',
							'value': '4h'
						})
					]),
					E('div', { 'class': 'cs-form-group' }, [
						E('label', { 'class': 'cs-form-label' }, 'Reason'),
						E('input', { 
							'class': 'cs-input',
							'id': 'ban-reason',
							'type': 'text',
							'placeholder': 'Manual ban from dashboard'
						})
					])
				]),
				E('div', { 'class': 'cs-modal-footer' }, [
					E('button', { 
						'class': 'cs-btn',
						'click': ui.createHandlerFn(this, 'closeBanModal')
					}, 'Cancel'),
					E('button', { 
						'class': 'cs-btn cs-btn-primary',
						'click': ui.createHandlerFn(this, 'submitBan')
					}, 'Add Ban')
				])
			])
		]);
	},

	openBanModal: function(ev) {
		document.getElementById('ban-modal').style.display = 'flex';
	},

	closeBanModal: function(ev) {
		document.getElementById('ban-modal').style.display = 'none';
		document.getElementById('ban-ip').value = '';
		document.getElementById('ban-duration').value = '4h';
		document.getElementById('ban-reason').value = '';
	},

	submitBan: function(ev) {
		var self = this;
		var ip = document.getElementById('ban-ip').value.trim();
		var duration = document.getElementById('ban-duration').value.trim() || '4h';
		var reason = document.getElementById('ban-reason').value.trim() || 'Manual ban from dashboard';
		
		if (!ip) {
			self.showToast('Please enter an IP address', 'error');
			return;
		}
		
		if (!self.csApi.isValidIP(ip)) {
			self.showToast('Invalid IP address format', 'error');
			return;
		}
		
		self.csApi.banIP(ip, duration, reason).then(function(result) {
			if (result.success) {
				self.showToast('IP ' + ip + ' banned for ' + duration, 'success');
				self.closeBanModal();
				return self.csApi.getDecisions();
			} else {
				self.showToast('Failed to ban: ' + (result.error || 'Unknown error'), 'error');
				return null;
			}
		}).then(function(data) {
			if (data) {
				self.decisions = data;
				self.filterDecisions();
				self.updateTable();
			}
		}).catch(function(err) {
			self.showToast('Error: ' + err.message, 'error');
		});
	},

	render: function(data) {
		var self = this;
		this.decisions = Array.isArray(data) ? data : [];
		this.filterDecisions();
		
		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, [
						'Active Decisions',
						E('span', { 
							'id': 'decisions-count',
							'style': 'font-weight: normal; margin-left: 12px; font-size: 12px; color: var(--cs-text-muted)'
						}, this.filteredDecisions.length + ' of ' + this.decisions.length + ' decisions')
					]),
					E('div', { 'class': 'cs-actions-bar' }, [
						E('div', { 'class': 'cs-search-box' }, [
							E('input', {
								'class': 'cs-input',
								'type': 'text',
								'placeholder': 'Search IP, scenario, country...',
								'input': ui.createHandlerFn(this, 'handleSearch')
							})
						]),
						E('button', {
							'class': 'cs-btn cs-btn-danger',
							'click': ui.createHandlerFn(this, 'handleBulkUnban')
						}, 'Unban Selected'),
						E('button', {
							'class': 'cs-btn cs-btn-primary',
							'click': ui.createHandlerFn(this, 'openBanModal')
						}, '+ Add Ban')
					])
				]),
				E('div', { 'class': 'cs-card-body no-padding', 'id': 'decisions-table-container' }, 
					this.renderTable()
				)
			]),
			this.renderBanModal()
		]);
		
		// Setup polling
		poll.add(function() {
			return self.csApi.getDecisions().then(function(newData) {
				self.decisions = Array.isArray(newData) ? newData : [];
				self.filterDecisions();
				self.updateTable();
			});
		}, 30);
		
		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
