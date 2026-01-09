'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require secubox-netifyd/api as netifydAPI';

return view.extend({
	refreshInterval: 5,
	appsData: [],
	sortColumn: 'bytes',
	sortDirection: 'desc',
	searchQuery: '',
	lastUpdate: null,

	load: function() {
		return Promise.all([
			netifydAPI.getTopApplications(),
			netifydAPI.getServiceStatus()
		]);
	},

	sortApplications: function(apps, column, direction) {
		return apps.slice().sort(function(a, b) {
			var valA = a[column] || 0;
			var valB = b[column] || 0;

			if (direction === 'asc') {
				return valA > valB ? 1 : valA < valB ? -1 : 0;
			} else {
				return valA < valB ? 1 : valA > valB ? -1 : 0;
			}
		});
	},

	handleSort: function(column, ev) {
		if (this.sortColumn === column) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortColumn = column;
			this.sortDirection = 'desc';
		}
		this.renderApplicationsTable();
	},

	filterApplications: function(apps) {
		if (!this.searchQuery) {
			return apps;
		}

		var query = this.searchQuery.toLowerCase();
		return apps.filter(function(app) {
			var name = (app.name || '').toLowerCase();
			return name.indexOf(query) >= 0;
		});
	},

	handleExport: function(ev) {
		var csvContent = 'Application,Flows,Packets,Bytes,Percentage\n';
		var totalBytes = this.appsData.reduce(function(sum, app) {
			return sum + (app.bytes || 0);
		}, 0);

		this.appsData.forEach(function(app) {
			var percentage = totalBytes > 0 ? ((app.bytes / totalBytes) * 100).toFixed(2) : 0;
			csvContent += [
				'"' + (app.name || 'Unknown') + '"',
				app.flows || 0,
				app.packets || 0,
				app.bytes || 0,
				percentage
			].join(',') + '\n';
		});

		var blob = new Blob([csvContent], { type: 'text/csv' });
		var url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'netifyd-applications-' + new Date().toISOString().slice(0,10) + '.csv';
		a.click();
		window.URL.revokeObjectURL(url);

		ui.addNotification(null, E('p', _('Applications exported to CSV')), 'info');
	},

	renderSummaryCards: function(apps) {
		var totalBytes = apps.reduce(function(sum, app) {
			return sum + (app.bytes || 0);
		}, 0);

		var totalFlows = apps.reduce(function(sum, app) {
			return sum + (app.flows || 0);
		}, 0);

		var totalPackets = apps.reduce(function(sum, app) {
			return sum + (app.packets || 0);
		}, 0);

		var cards = [
			{
				title: _('Unique Applications'),
				value: apps.length.toString(),
				icon: 'cubes',
				gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			},
			{
				title: _('Total Flows'),
				value: totalFlows.toString(),
				icon: 'stream',
				gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
			},
			{
				title: _('Total Packets'),
				value: totalPackets.toLocaleString(),
				icon: 'boxes',
				gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
			},
			{
				title: _('Total Traffic'),
				value: netifydAPI.formatBytes(totalBytes),
				icon: 'chart-line',
				gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
			}
		];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem'
		}, cards.map(function(card) {
			return E('div', {
				'style': 'background: ' + card.gradient + '; color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1)'
			}, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem' }, [
					E('div', { 'style': 'font-size: 0.9em; opacity: 0.9' }, card.title),
					E('i', {
						'class': 'fa fa-' + card.icon,
						'style': 'font-size: 2em; opacity: 0.3'
					})
				]),
				E('div', { 'style': 'font-size: 2em; font-weight: bold' }, card.value)
			]);
		}.bind(this)));
	},

	renderApplicationsTable: function() {
		var container = document.getElementById('apps-table-container');
		if (!container) return;

		var apps = this.filterApplications(this.appsData);
		var sortedApps = this.sortApplications(apps, this.sortColumn, this.sortDirection);

		var totalBytes = apps.reduce(function(sum, app) {
			return sum + (app.bytes || 0);
		}, 0);

		var appColors = [
			'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
			'#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
			'#6366f1', '#f43f5e', '#0ea5e9', '#8b5cf6', '#22c55e'
		];

		var getSortIcon = function(column) {
			if (this.sortColumn !== column) {
				return E('i', { 'class': 'fa fa-sort', 'style': 'opacity: 0.3; margin-left: 0.25rem;' });
			}
			return E('i', {
				'class': 'fa fa-sort-' + (this.sortDirection === 'asc' ? 'up' : 'down'),
				'style': 'color: #3b82f6; margin-left: 0.25rem;'
			});
		}.bind(this);

		var tableStyle = 'width: 100%; border-collapse: collapse;';
		var thStyle = 'padding: 0.75rem 1rem; text-align: left; font-weight: 600; background: #f8fafc; border-bottom: 2px solid #e2e8f0; cursor: pointer; user-select: none;';
		var tdStyle = 'padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle;';

		if (apps.length === 0) {
			dom.content(container, [
				E('div', {
					'style': 'text-align: center; padding: 3rem; background: #f9fafb; border-radius: 8px;'
				}, [
					E('i', { 'class': 'fa fa-cubes', 'style': 'font-size: 3em; opacity: 0.3; display: block; margin-bottom: 1rem; color: #6b7280;' }),
					E('h4', { 'style': 'margin: 0 0 0.5rem 0; color: #374151;' }, _('No Application Data')),
					E('p', { 'style': 'margin: 0 0 0.5rem 0; color: #6b7280;' }, _('No applications have been detected yet')),
					E('small', { 'style': 'color: #9ca3af;' }, _('Data will appear once network traffic is analyzed'))
				])
			]);
			return;
		}

		var tableContent = E('table', { 'style': tableStyle }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {
						'style': thStyle,
						'click': ui.createHandlerFn(this, 'handleSort', 'name')
					}, [
						_('Application'),
						getSortIcon('name')
					]),
					E('th', {
						'style': thStyle + ' text-align: center;',
						'click': ui.createHandlerFn(this, 'handleSort', 'flows')
					}, [
						_('Flows'),
						getSortIcon('flows')
					]),
					E('th', {
						'style': thStyle + ' text-align: center;',
						'click': ui.createHandlerFn(this, 'handleSort', 'packets')
					}, [
						_('Packets'),
						getSortIcon('packets')
					]),
					E('th', {
						'style': thStyle + ' text-align: right;',
						'click': ui.createHandlerFn(this, 'handleSort', 'bytes')
					}, [
						_('Total Traffic'),
						getSortIcon('bytes')
					]),
					E('th', { 'style': thStyle + ' text-align: center; cursor: default;' }, _('% of Total'))
				])
			]),
			E('tbody', {}, sortedApps.map(function(app, idx) {
				var percentage = totalBytes > 0 ? (app.bytes / totalBytes * 100) : 0;
				var color = appColors[idx % appColors.length];
				var rowBg = idx % 2 === 0 ? '' : 'background: #f9fafb;';

				return E('tr', { 'style': rowBg }, [
					E('td', { 'style': tdStyle }, [
						E('span', { 'style': 'display: inline-flex; align-items: center; gap: 0.5rem;' }, [
							E('span', {
								'style': 'width: 10px; height: 10px; border-radius: 50%; background: ' + color + '; flex-shrink: 0; display: inline-block;'
							}),
							E('strong', {}, app.name || 'Unknown')
						])
					]),
					E('td', { 'style': tdStyle + ' text-align: center;' },
						(app.flows || 0).toLocaleString()),
					E('td', { 'style': tdStyle + ' text-align: center;' },
						(app.packets || 0).toLocaleString()),
					E('td', { 'style': tdStyle + ' text-align: right;' }, [
						E('strong', { 'style': 'color: ' + color + ';' },
							netifydAPI.formatBytes(app.bytes || 0))
					]),
					E('td', { 'style': tdStyle + ' text-align: center; min-width: 120px;' }, [
						E('div', {
							'style': 'background: #e5e7eb; border-radius: 12px; height: 24px; position: relative; overflow: hidden;'
						}, [
							E('div', {
								'style': 'background: ' + color + '; height: 100%; width: ' + percentage + '%; transition: width 0.3s ease; border-radius: 12px;'
							}),
							E('span', {
								'style': 'position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 0.8em; font-weight: 600; color: ' + (percentage > 40 ? '#fff' : '#374151') + ';'
							}, percentage.toFixed(1) + '%')
						])
					])
				]);
			}.bind(this)))
		]);

		dom.content(container, [
			E('div', { 'style': 'overflow-x: auto;' }, [tableContent])
		]);
	},

	render: function(data) {
		var appsData = data[0] || {};
		var status = data[1] || {};
		this.appsData = appsData.applications || [];
		this.lastUpdate = new Date();

		var self = this;

		// Set up polling
		poll.add(L.bind(function() {
			return Promise.all([
				netifydAPI.getTopApplications(),
				netifydAPI.getServiceStatus()
			]).then(L.bind(function(result) {
				this.appsData = (result[0] || {}).applications || [];
				this.lastUpdate = new Date();
				this.renderApplicationsTable();
			}, this));
		}, this), this.refreshInterval);

		var serviceRunning = status.running;

		return E('div', { 'class': 'cbi-map' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
				E('h2', { 'name': 'content', 'style': 'margin: 0' }, [
					E('i', { 'class': 'fa fa-cubes', 'style': 'margin-right: 0.5rem' }),
					_('Detected Applications')
				]),
				E('span', {
					'class': 'badge',
					'style': 'padding: 0.5rem 1rem; font-size: 0.9em; background: ' + (serviceRunning ? '#10b981' : '#ef4444')
				}, [
					E('i', { 'class': 'fa fa-circle', 'style': 'margin-right: 0.5rem' }),
					serviceRunning ? _('Live') : _('Offline')
				])
			]),
			E('div', { 'class': 'cbi-map-descr' },
				_('Applications detected and identified by Netifyd deep packet inspection. Updates every 5 seconds.')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
						E('h3', { 'style': 'margin: 0' }, [
							E('i', { 'class': 'fa fa-chart-bar', 'style': 'margin-right: 0.5rem' }),
							_('Summary')
						]),
						E('button', {
							'class': 'btn btn-primary',
							'click': ui.createHandlerFn(this, 'handleExport')
						}, [
							E('i', { 'class': 'fa fa-download' }),
							' ',
							_('Export CSV')
						])
					]),
					this.renderSummaryCards(this.appsData)
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
					E('h3', { 'style': 'margin: 0' }, [
						E('i', { 'class': 'fa fa-list', 'style': 'margin-right: 0.5rem' }),
						_('Application List'),
						' ',
						E('span', {
							'class': 'badge',
							'style': 'background: #3b82f6; color: white; margin-left: 0.5rem'
						}, this.appsData.length)
					]),
					E('div', { 'style': 'display: flex; gap: 0.5rem; align-items: center' }, [
						E('input', {
							'type': 'text',
							'class': 'cbi-input-text',
							'placeholder': _('Search applications...'),
							'style': 'min-width: 250px',
							'value': this.searchQuery,
							'keyup': function(ev) {
								self.searchQuery = ev.target.value;
								self.renderApplicationsTable();
							}
						})
					])
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'id': 'apps-table-container' })
				])
			])
		]);
	},

	addFooter: function() {
		this.renderApplicationsTable();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
