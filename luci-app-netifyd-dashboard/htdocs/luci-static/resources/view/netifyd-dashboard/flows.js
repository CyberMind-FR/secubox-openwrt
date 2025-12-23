'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netifyd-dashboard.api as api';

return view.extend({
	title: _('Network Flows'),
	
	load: function() {
		return api.getFlows();
	},
	
	render: function(data) {
		var flows = (data || {}).flows || [];
		
		var view = E('div', { 'class': 'netifyd-dashboard' }, [
			// Header
			E('div', { 'class': 'nf-header' }, [
				E('div', { 'class': 'nf-logo' }, [
					E('div', { 'class': 'nf-logo-icon' }, '🔄'),
					E('div', { 'class': 'nf-logo-text' }, ['Network ', E('span', {}, 'Flows')])
				]),
				E('div', { 'class': 'nf-header-info' }, [
					E('div', { 'class': 'nf-status-badge' }, [
						E('span', { 'class': 'nf-status-dot' }),
						flows.length + ' Active'
					])
				])
			]),
			
			// Search
			E('div', { 'class': 'nf-search' }, [
				E('span', { 'class': 'nf-search-icon' }, '🔍'),
				E('input', { 
					'type': 'text', 
					'placeholder': 'Search by IP, port, or application...',
					'id': 'flow-search'
				})
			]),
			
			// Flows Table
			E('div', { 'class': 'nf-card' }, [
				E('div', { 'class': 'nf-card-header' }, [
					E('div', { 'class': 'nf-card-title' }, [
						E('span', { 'class': 'nf-card-title-icon' }, '📋'),
						'Active Connections'
					]),
					E('div', { 'class': 'nf-card-badge' }, flows.length + ' flows')
				]),
				E('div', { 'class': 'nf-card-body', 'style': 'padding:0' }, [
					E('div', { 'class': 'nf-table-container', 'style': 'max-height:600px;overflow-y:auto' }, [
						E('table', { 'class': 'nf-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Protocol'),
									E('th', {}, 'Source'),
									E('th', {}, 'Destination'),
									E('th', {}, 'Application'),
									E('th', {}, 'Category'),
									E('th', {}, 'Traffic')
								])
							]),
							E('tbody', { 'id': 'flows-tbody' }, 
								flows.slice(0, 50).map(function(flow) {
									return E('tr', {}, [
										E('td', {}, E('span', { 
											'class': 'nf-proto ' + flow.protocol.toLowerCase() 
										}, flow.protocol)),
										E('td', { 'class': 'mono' }, [
											flow.src_ip,
											flow.src_port ? ':' + flow.src_port : ''
										]),
										E('td', { 'class': 'mono' }, [
											flow.dst_ip,
											flow.dst_port ? ':' + flow.dst_port : ''
										]),
										E('td', {}, E('div', { 'class': 'app-name' }, [
											E('span', { 'class': 'app-icon' }, api.getAppIcon(flow.application)),
											flow.application
										])),
										E('td', {}, E('span', { 
											'class': 'nf-category ' + api.getCategoryClass(flow.category) 
										}, flow.category)),
										E('td', { 'class': 'mono' }, [
											E('span', { 'class': 'nf-traffic' }, [
												E('span', { 'class': 'nf-traffic-rx' }, '↓' + api.formatBytes(flow.bytes || 0)),
												' ',
												E('span', { 'class': 'nf-traffic-tx' }, flow.packets + ' pkts')
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
