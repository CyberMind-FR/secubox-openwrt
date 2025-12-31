'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require netdata-dashboard/api as API';

return view.extend({
	title: _('Processes'),
	
	load: function() {
		return API.getProcesses();
	},
	
	render: function(data) {
		var procs = data || {};
		var topProcs = procs.top || [];
		
		var view = E('div', { 'class': 'netdata-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			// Header
			E('div', { 'class': 'nd-header' }, [
				E('div', { 'class': 'nd-logo' }, [
					E('div', { 'class': 'nd-logo-icon' }, '⚙️'),
					E('div', { 'class': 'nd-logo-text' }, ['Process ', E('span', {}, 'Monitor')])
				]),
				E('div', { 'class': 'nd-header-info' }, [
					E('div', { 'class': 'nd-live-badge' }, [
						E('span', { 'class': 'nd-live-dot' }),
						'Live'
					])
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'nd-quick-stats' }, [
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value info' }, procs.total || 0),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Total Processes')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value good' }, procs.running || 0),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Running')
				]),
				E('div', { 'class': 'nd-quick-stat' }, [
					E('div', { 'class': 'nd-quick-stat-value warning' }, procs.sleeping || 0),
					E('div', { 'class': 'nd-quick-stat-label' }, 'Sleeping')
				])
			]),
			
			// Process List
			E('div', { 'class': 'nd-chart-card', 'style': 'margin-top:16px' }, [
				E('div', { 'class': 'nd-chart-header' }, [
					E('div', { 'class': 'nd-chart-title' }, [
						E('span', { 'class': 'nd-chart-title-icon' }, '📋'),
						'Process List'
					]),
					E('div', { 'class': 'nd-chart-value' }, topProcs.length + ' processes')
				]),
				E('div', { 'class': 'nd-chart-body', 'style': 'padding:0;overflow-x:auto' }, [
					E('table', { 'class': 'nd-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', { 'style': 'width:80px' }, 'PID'),
								E('th', { 'style': 'width:100px' }, 'User'),
								E('th', {}, 'Command'),
								E('th', { 'style': 'width:100px' }, 'Memory'),
								E('th', { 'style': 'width:80px' }, 'State')
							])
						]),
						E('tbody', {}, 
							topProcs.map(function(proc) {
								var stateText = '';
								var stateClass = '';
								switch(proc.state) {
									case 'R': stateText = 'Running'; stateClass = 'up'; break;
									case 'S': stateText = 'Sleeping'; stateClass = 'unknown'; break;
									case 'D': stateText = 'Disk'; stateClass = 'warning'; break;
									case 'Z': stateText = 'Zombie'; stateClass = 'down'; break;
									case 'T': stateText = 'Stopped'; stateClass = 'down'; break;
									default: stateText = proc.state; stateClass = 'unknown';
								}
								
								return E('tr', {}, [
									E('td', { 'class': 'mono' }, proc.pid),
									E('td', {}, proc.user || 'root'),
									E('td', { 'title': proc.cmd }, E('code', { 'style': 'font-size:11px;color:#58a6ff' }, proc.cmd || '-')),
									E('td', { 'class': 'mono value' }, API.formatKB(proc.vsz || 0)),
									E('td', {}, E('span', { 'class': 'nd-status ' + stateClass }, stateText))
								]);
							})
						)
					])
				])
			]),
			
			// Process State Distribution
			E('div', { 'class': 'nd-charts-grid', 'style': 'margin-top:16px' }, [
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '📊'),
							'Process States'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-bar-chart' }, [
							E('div', { 'class': 'nd-bar-item' }, [
								E('span', { 'class': 'nd-bar-label' }, 'Running'),
								E('div', { 'class': 'nd-bar-track' }, [
									E('div', { 
										'class': 'nd-bar-fill', 
										'style': 'width:' + (procs.total > 0 ? (procs.running / procs.total) * 100 : 0) + '%;background:linear-gradient(90deg,#3fb950,#56d364)'
									})
								]),
								E('span', { 'class': 'nd-bar-value' }, procs.running || 0)
							]),
							E('div', { 'class': 'nd-bar-item' }, [
								E('span', { 'class': 'nd-bar-label' }, 'Sleeping'),
								E('div', { 'class': 'nd-bar-track' }, [
									E('div', { 
										'class': 'nd-bar-fill', 
										'style': 'width:' + (procs.total > 0 ? (procs.sleeping / procs.total) * 100 : 0) + '%;background:linear-gradient(90deg,#58a6ff,#79c0ff)'
									})
								]),
								E('span', { 'class': 'nd-bar-value' }, procs.sleeping || 0)
							])
						])
					])
				]),
				
				// Memory Usage by Processes
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '🧠'),
							'Top Memory Consumers'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-bar-chart' },
							topProcs.slice(0, 5).map(function(proc, i) {
								var maxMem = topProcs[0] ? topProcs[0].vsz : 1;
								var pct = maxMem > 0 ? (proc.vsz / maxMem) * 100 : 0;
								var colors = ['#3fb950', '#58a6ff', '#a371f7', '#d29922', '#f85149'];
								return E('div', { 'class': 'nd-bar-item' }, [
									E('span', { 'class': 'nd-bar-label', 'title': proc.cmd }, proc.cmd ? proc.cmd.split('/').pop().substring(0, 12) : 'PID ' + proc.pid),
									E('div', { 'class': 'nd-bar-track' }, [
										E('div', { 'class': 'nd-bar-fill', 'style': 'width:' + pct + '%;background:' + colors[i % colors.length] })
									]),
									E('span', { 'class': 'nd-bar-value' }, API.formatKB(proc.vsz || 0))
								]);
							})
						)
					])
				])
			])
		]);
		
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netdata-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
