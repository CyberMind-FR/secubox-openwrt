'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netifyd-dashboard.api as api';

return view.extend({
	title: _('Applications'),
	
	load: function() {
		return api.getApplications();
	},
	
	render: function(data) {
		var apps = (data || {}).applications || [];
		var totalBytes = apps.reduce(function(sum, a) { return sum + (a.bytes || 0); }, 0);
		var totalFlows = apps.reduce(function(sum, a) { return sum + (a.flows || 0); }, 0);
		
		var view = E('div', { 'class': 'netifyd-dashboard' }, [
			// Header
			E('div', { 'class': 'nf-header' }, [
				E('div', { 'class': 'nf-logo' }, [
					E('div', { 'class': 'nf-logo-icon' }, '📱'),
					E('div', { 'class': 'nf-logo-text' }, ['App', E('span', {}, 'lications')])
				]),
				E('div', { 'class': 'nf-header-info' }, [
					E('div', { 'class': 'nf-status-badge' }, [
						E('span', { 'class': 'nf-status-dot' }),
						apps.length + ' Detected'
					])
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'nf-quick-stats' }, [
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #8b5cf6' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '📱'),
					E('div', { 'class': 'nf-quick-stat-value' }, apps.length),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Applications')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #3b82f6' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '🔄'),
					E('div', { 'class': 'nf-quick-stat-value' }, totalFlows),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Total Flows')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #10b981' }, [
					E('div', { 'class': 'nf-quick-stat-icon' }, '📊'),
					E('div', { 'class': 'nf-quick-stat-value' }, api.formatBytes(totalBytes)),
					E('div', { 'class': 'nf-quick-stat-label' }, 'Total Traffic')
				])
			]),
			
			// Applications Table
			E('div', { 'class': 'nf-card' }, [
				E('div', { 'class': 'nf-card-header' }, [
					E('div', { 'class': 'nf-card-title' }, [
						E('span', { 'class': 'nf-card-title-icon' }, '📋'),
						'Detected Applications'
					])
				]),
				E('div', { 'class': 'nf-card-body', 'style': 'padding:0' }, [
					E('div', { 'class': 'nf-table-container' }, [
						E('table', { 'class': 'nf-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Application'),
									E('th', {}, 'Category'),
									E('th', {}, 'Flows'),
									E('th', {}, 'Traffic'),
									E('th', {}, '% Total')
								])
							]),
							E('tbody', {}, 
								apps.map(function(app) {
									var pct = totalBytes > 0 ? ((app.bytes / totalBytes) * 100).toFixed(1) : 0;
									return E('tr', {}, [
										E('td', {}, E('div', { 'class': 'app-name' }, [
											E('span', { 'class': 'app-icon' }, api.getAppIcon(app.name)),
											E('strong', {}, app.name)
										])),
										E('td', {}, E('span', { 
											'class': 'nf-category ' + api.getCategoryClass(app.category) 
										}, app.category)),
										E('td', { 'class': 'mono' }, app.flows),
										E('td', { 'class': 'mono' }, api.formatBytes(app.bytes)),
										E('td', {}, [
											E('div', { 'style': 'display:flex;align-items:center;gap:8px' }, [
												E('div', { 
													'style': 'width:60px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden' 
												}, [
													E('div', { 
														'style': 'height:100%;width:' + pct + '%;background:linear-gradient(90deg,#8b5cf6,#3b82f6);border-radius:3px'
													})
												]),
												E('span', { 'class': 'mono', 'style': 'font-size:11px' }, pct + '%')
											])
										])
									]);
								})
							)
						])
					])
				])
			])
		]);
		
		// Include CSS
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netifyd-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
