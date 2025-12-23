'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netifyd-dashboard.api as api';

return view.extend({
	title: _('Devices'),
	
	load: function() {
		return api.getDevices();
	},
	
	render: function(data) {
		var devices = (data || {}).devices || [];
		
		var view = E('div', { 'class': 'netifyd-dashboard' }, [
			// Header
			E('div', { 'class': 'nf-header' }, [
				E('div', { 'class': 'nf-logo' }, [
					E('div', { 'class': 'nf-logo-icon' }, '💻'),
					E('div', { 'class': 'nf-logo-text' }, ['Network ', E('span', {}, 'Devices')])
				]),
				E('div', { 'class': 'nf-header-info' }, [
					E('div', { 'class': 'nf-status-badge' }, [
						E('span', { 'class': 'nf-status-dot' }),
						devices.length + ' Online'
					])
				])
			]),
			
			// Search
			E('div', { 'class': 'nf-search' }, [
				E('span', { 'class': 'nf-search-icon' }, '🔍'),
				E('input', { 
					'type': 'text', 
					'placeholder': 'Search by hostname, IP, or MAC...',
					'id': 'device-search'
				})
			]),
			
			// Device Grid
			E('div', { 'class': 'nf-card' }, [
				E('div', { 'class': 'nf-card-header' }, [
					E('div', { 'class': 'nf-card-title' }, [
						E('span', { 'class': 'nf-card-title-icon' }, '📡'),
						'Discovered Devices'
					]),
					E('div', { 'class': 'nf-card-badge' }, devices.length + ' devices')
				]),
				E('div', { 'class': 'nf-card-body' }, [
					E('div', { 'class': 'nf-device-grid' }, 
						devices.map(function(device) {
							return E('div', { 'class': 'nf-device-card' }, [
								E('div', { 'class': 'nf-device-header' }, [
									E('div', { 'class': 'nf-device-icon' }, api.getDeviceIcon(device.vendor)),
									E('div', { 'class': 'nf-device-info' }, [
										E('h4', {}, device.hostname || 'Unknown Device'),
										E('p', {}, device.vendor || 'Unknown Vendor')
									])
								]),
								E('div', { 'class': 'nf-device-details' }, [
									E('div', { 'class': 'nf-device-detail' }, [
										E('span', { 'class': 'nf-device-detail-label' }, 'IP Address'),
										E('span', { 'class': 'nf-device-detail-value' }, device.ip)
									]),
									E('div', { 'class': 'nf-device-detail' }, [
										E('span', { 'class': 'nf-device-detail-label' }, 'MAC Address'),
										E('span', { 'class': 'nf-device-detail-value' }, device.mac)
									]),
									E('div', { 'class': 'nf-device-detail' }, [
										E('span', { 'class': 'nf-device-detail-label' }, 'Interface'),
										E('span', { 'class': 'nf-device-detail-value' }, device.interface)
									]),
									E('div', { 'class': 'nf-device-detail' }, [
										E('span', { 'class': 'nf-device-detail-label' }, 'Last Seen'),
										E('span', { 'class': 'nf-device-detail-value' }, 'Just now')
									])
								])
							]);
						})
					)
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
