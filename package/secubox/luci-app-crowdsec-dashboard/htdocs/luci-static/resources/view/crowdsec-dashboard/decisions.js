'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';
'require crowdsec-dashboard/nav as CsNav';

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
	// Advanced filters
	filterType: 'all',      // all, ban, captcha
	filterDuration: 'all',  // all, short (<1h), medium (1-24h), long (>24h), permanent
	filterCountry: 'all',   // all, or specific country code
	showFilters: false,

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(cssLink);
		
		this.csApi = api;
		return this.csApi.getDecisions();
	},

	parseDurationToSeconds: function(duration) {
		if (!duration) return 0;
		var match = duration.match(/^(\d+)(h|m|s)?$/);
		if (!match) {
			// Try ISO 8601 duration
			var hours = 0;
			var hoursMatch = duration.match(/(\d+)h/i);
			if (hoursMatch) hours = parseInt(hoursMatch[1]);
			var minsMatch = duration.match(/(\d+)m/i);
			if (minsMatch) hours += parseInt(minsMatch[1]) / 60;
			return hours * 3600;
		}
		var value = parseInt(match[1]);
		var unit = match[2] || 's';
		if (unit === 'h') return value * 3600;
		if (unit === 'm') return value * 60;
		return value;
	},

	filterDecisions: function() {
		var self = this;
		var query = this.searchQuery.toLowerCase();

		this.filteredDecisions = this.decisions.filter(function(d) {
			// Text search filter
			if (query) {
				var searchFields = [
					d.value,
					d.scenario,
					d.country,
					d.type,
					d.origin
				].filter(Boolean).join(' ').toLowerCase();

				if (searchFields.indexOf(query) === -1) return false;
			}

			// Type filter
			if (self.filterType !== 'all') {
				if ((d.type || 'ban').toLowerCase() !== self.filterType) return false;
			}

			// Country filter
			if (self.filterCountry !== 'all') {
				if ((d.country || '').toUpperCase() !== self.filterCountry) return false;
			}

			// Duration filter
			if (self.filterDuration !== 'all') {
				var durationSecs = self.parseDurationToSeconds(d.duration);
				switch (self.filterDuration) {
					case 'short':     // < 1 hour
						if (durationSecs >= 3600) return false;
						break;
					case 'medium':    // 1-24 hours
						if (durationSecs < 3600 || durationSecs >= 86400) return false;
						break;
					case 'long':      // > 24 hours
						if (durationSecs < 86400) return false;
						break;
					case 'permanent': // > 7 days or explicit permanent
						if (durationSecs < 604800 && d.duration !== 'permanent') return false;
						break;
				}
			}

			return true;
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

	getUniqueCountries: function() {
		var countries = {};
		this.decisions.forEach(function(d) {
			if (d.country) {
				countries[d.country.toUpperCase()] = true;
			}
		});
		return Object.keys(countries).sort();
	},

	handleFilterChange: function(filterName, value, ev) {
		this[filterName] = value;
		this.filterDecisions();
		this.updateTable();
		this.updateFilterBadge();
	},

	toggleFilters: function() {
		this.showFilters = !this.showFilters;
		var panel = document.getElementById('advanced-filters');
		if (panel) {
			panel.style.display = this.showFilters ? 'block' : 'none';
		}
	},

	clearFilters: function() {
		this.filterType = 'all';
		this.filterDuration = 'all';
		this.filterCountry = 'all';
		this.searchQuery = '';
		var searchInput = document.querySelector('.cs-search-box input');
		if (searchInput) searchInput.value = '';
		this.filterDecisions();
		this.updateTable();
		this.updateFilterBadge();
		this.updateFilterSelects();
	},

	updateFilterSelects: function() {
		var typeSelect = document.getElementById('filter-type');
		var durationSelect = document.getElementById('filter-duration');
		var countrySelect = document.getElementById('filter-country');
		if (typeSelect) typeSelect.value = this.filterType;
		if (durationSelect) durationSelect.value = this.filterDuration;
		if (countrySelect) countrySelect.value = this.filterCountry;
	},

	updateFilterBadge: function() {
		var count = 0;
		if (this.filterType !== 'all') count++;
		if (this.filterDuration !== 'all') count++;
		if (this.filterCountry !== 'all') count++;

		var badge = document.getElementById('filter-badge');
		if (badge) {
			badge.textContent = count;
			badge.style.display = count > 0 ? 'inline-block' : 'none';
		}
	},

	exportToCSV: function() {
		var self = this;
		var csv = 'IP Address,Scenario,Country,Type,Duration,Origin,Created\n';
		this.filteredDecisions.forEach(function(d) {
			csv += [
				d.value || '',
				(d.scenario || '').replace(/,/g, ';'),
				d.country || '',
				d.type || 'ban',
				d.duration || '',
				d.origin || 'crowdsec',
				d.created_at || ''
			].join(',') + '\n';
		});

		var blob = new Blob([csv], { type: 'text/csv' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'crowdsec-decisions-' + new Date().toISOString().slice(0, 10) + '.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		this.showToast('Exported ' + this.filteredDecisions.length + ' decisions to CSV', 'success');
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
				// Flatten alerts->decisions structure
				self.decisions = [];
				if (Array.isArray(data)) {
					data.forEach(function(alert) {
						if (alert.decisions && Array.isArray(alert.decisions)) {
							self.decisions = self.decisions.concat(alert.decisions);
						}
					});
				}
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
				// Flatten alerts->decisions structure
				self.decisions = [];
				if (Array.isArray(data)) {
					data.forEach(function(alert) {
						if (alert.decisions && Array.isArray(alert.decisions)) {
							self.decisions = self.decisions.concat(alert.decisions);
						}
					});
				}
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
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
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
		
	console.log('[Decisions] Banning IP:', ip, 'Duration:', duration, 'Reason:', reason);
		self.csApi.banIP(ip, duration, reason).then(function(result) {
			console.log('[Decisions] Ban result:', result);
			if (result.success) {
				self.showToast('IP ' + ip + ' banned for ' + duration, 'success');
				self.closeBanModal();
				// Wait 1 second for CrowdSec to process the decision
				console.log('[Decisions] Waiting 1 second before refreshing...');
				return new Promise(function(resolve) {
					setTimeout(function() {
						console.log('[Decisions] Refreshing decisions list...');
						resolve(self.csApi.getDecisions());
					}, 1000);
				});
			} else {
				self.showToast('Failed to ban: ' + (result.error || 'Unknown error'), 'error');
				return null;
			}
		}).then(function(data) {
			console.log('[Decisions] Updated decisions data:', data);
			if (data) {
				// Flatten alerts->decisions structure
				self.decisions = [];
				if (Array.isArray(data)) {
					data.forEach(function(alert) {
						if (alert.decisions && Array.isArray(alert.decisions)) {
							self.decisions = self.decisions.concat(alert.decisions);
						}
					});
				}
				self.filterDecisions();
				self.updateTable();
				console.log('[Decisions] Table updated with', self.decisions.length, 'decisions');
			}
		}).catch(function(err) {
			console.error('[Decisions] Ban error:', err);
			self.showToast('Error: ' + err.message, 'error');
		});
	},

	render: function(data) {
		var self = this;
		// Flatten alerts->decisions structure
		// data is an array of alerts, each containing a decisions array
		this.decisions = [];
		if (Array.isArray(data)) {
			data.forEach(function(alert) {
				if (alert.decisions && Array.isArray(alert.decisions)) {
					self.decisions = self.decisions.concat(alert.decisions);
				}
			});
		}
		console.log('[Decisions] Flattened', this.decisions.length, 'decisions from', data ? data.length : 0, 'alerts');
		this.filterDecisions();
		
		var countries = this.getUniqueCountries();

		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			CsNav.renderTabs('decisions'),
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
							'class': 'cs-btn',
							'style': 'position: relative;',
							'click': ui.createHandlerFn(this, 'toggleFilters')
						}, [
							'Filters ',
							E('span', {
								'id': 'filter-badge',
								'style': 'display: none; background: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; position: absolute; top: -5px; right: -5px;'
							}, '0')
						]),
						E('button', {
							'class': 'cs-btn',
							'click': ui.createHandlerFn(this, 'exportToCSV'),
							'title': 'Export to CSV'
						}, 'Export CSV'),
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
				// Advanced Filters Panel
				E('div', {
					'id': 'advanced-filters',
					'style': 'display: none; padding: 1em; background: #f8f9fa; border-bottom: 1px solid #ddd;'
				}, [
					E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 1em; align-items: flex-end;' }, [
						E('div', {}, [
							E('label', { 'style': 'display: block; font-size: 0.85em; margin-bottom: 4px; color: #666;' }, _('Action Type')),
							E('select', {
								'id': 'filter-type',
								'class': 'cs-input',
								'style': 'min-width: 120px;',
								'change': function(ev) {
									self.handleFilterChange('filterType', ev.target.value);
								}
							}, [
								E('option', { 'value': 'all' }, 'All Types'),
								E('option', { 'value': 'ban' }, 'Ban'),
								E('option', { 'value': 'captcha' }, 'Captcha')
							])
						]),
						E('div', {}, [
							E('label', { 'style': 'display: block; font-size: 0.85em; margin-bottom: 4px; color: #666;' }, _('Duration')),
							E('select', {
								'id': 'filter-duration',
								'class': 'cs-input',
								'style': 'min-width: 140px;',
								'change': function(ev) {
									self.handleFilterChange('filterDuration', ev.target.value);
								}
							}, [
								E('option', { 'value': 'all' }, 'All Durations'),
								E('option', { 'value': 'short' }, '< 1 hour'),
								E('option', { 'value': 'medium' }, '1-24 hours'),
								E('option', { 'value': 'long' }, '> 24 hours'),
								E('option', { 'value': 'permanent' }, 'Permanent (>7d)')
							])
						]),
						E('div', {}, [
							E('label', { 'style': 'display: block; font-size: 0.85em; margin-bottom: 4px; color: #666;' }, _('Country')),
							E('select', {
								'id': 'filter-country',
								'class': 'cs-input',
								'style': 'min-width: 140px;',
								'change': function(ev) {
									self.handleFilterChange('filterCountry', ev.target.value);
								}
							}, [
								E('option', { 'value': 'all' }, 'All Countries')
							].concat(countries.map(function(c) {
								return E('option', { 'value': c }, self.csApi.getCountryFlag(c) + ' ' + c);
							})))
						]),
						E('button', {
							'class': 'cs-btn',
							'style': 'margin-left: auto;',
							'click': ui.createHandlerFn(this, 'clearFilters')
						}, 'Clear Filters')
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
				// Flatten alerts->decisions structure
				self.decisions = [];
				if (Array.isArray(newData)) {
					newData.forEach(function(alert) {
						if (alert.decisions && Array.isArray(alert.decisions)) {
							self.decisions = self.decisions.concat(alert.decisions);
						}
					});
				}
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
