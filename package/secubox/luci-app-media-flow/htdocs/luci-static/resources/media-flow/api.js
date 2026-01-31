'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.media-flow',
	method: 'status',
	expect: { }
});

var callGetActiveStreams = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_active_streams',
	expect: { }
});

var callGetStreamHistory = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_stream_history',
	params: ['hours'],
	expect: { history: [] }
});

var callGetStatsByService = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_stats_by_service',
	expect: { services: {} }
});

var callGetStatsByClient = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_stats_by_client',
	expect: { clients: {} }
});

var callGetServiceDetails = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_service_details',
	params: ['service'],
	expect: { }
});

var callSetAlert = rpc.declare({
	object: 'luci.media-flow',
	method: 'set_alert',
	params: ['service', 'threshold_hours', 'action'],
	expect: { }
});

var callDeleteAlert = rpc.declare({
	object: 'luci.media-flow',
	method: 'delete_alert',
	params: ['alert_id'],
	expect: { }
});

var callListAlerts = rpc.declare({
	object: 'luci.media-flow',
	method: 'list_alerts',
	expect: { alerts: [] }
});

var callClearHistory = rpc.declare({
	object: 'luci.media-flow',
	method: 'clear_history',
	expect: { }
});

var callGetSettings = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_settings',
	expect: { }
});

var callSetSettings = rpc.declare({
	object: 'luci.media-flow',
	method: 'set_settings',
	params: ['enabled', 'history_retention', 'refresh_interval'],
	expect: { }
});

var callStartNdpid = rpc.declare({
	object: 'luci.media-flow',
	method: 'start_ndpid',
	expect: { success: false }
});

var callStopNdpid = rpc.declare({
	object: 'luci.media-flow',
	method: 'stop_ndpid',
	expect: { success: false }
});

var callStartNetifyd = rpc.declare({
	object: 'luci.media-flow',
	method: 'start_netifyd',
	expect: { success: false }
});

var callStopNetifyd = rpc.declare({
	object: 'luci.media-flow',
	method: 'stop_netifyd',
	expect: { success: false }
});

// nDPId Integration
var callNdpidStatus = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_service_status',
	expect: { }
});

var callNdpidFlows = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_detailed_flows',
	expect: { flows: [] }
});

var callNdpidTopApps = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_top_applications',
	expect: { applications: [] }
});

var callNdpidCategories = rpc.declare({
	object: 'luci.ndpid',
	method: 'get_categories',
	expect: { categories: [] }
});

// Streaming service definitions
var streamingServices = {
	'Netflix': { icon: '🎬', color: '#e50914', category: 'video' },
	'YouTube': { icon: '▶️', color: '#ff0000', category: 'video' },
	'Disney': { icon: '🏰', color: '#113ccf', category: 'video' },
	'Amazon Prime': { icon: '📦', color: '#00a8e1', category: 'video' },
	'HBO': { icon: '🎭', color: '#5822b4', category: 'video' },
	'Hulu': { icon: '📺', color: '#1ce783', category: 'video' },
	'AppleTV': { icon: '🍎', color: '#555555', category: 'video' },
	'Twitch': { icon: '🎮', color: '#9146ff', category: 'gaming' },
	'Spotify': { icon: '🎵', color: '#1db954', category: 'audio' },
	'Apple Music': { icon: '🎧', color: '#fa243c', category: 'audio' },
	'Tidal': { icon: '🌊', color: '#000000', category: 'audio' },
	'Deezer': { icon: '🎶', color: '#feaa2d', category: 'audio' },
	'SoundCloud': { icon: '☁️', color: '#ff5500', category: 'audio' },
	'TikTok': { icon: '📱', color: '#000000', category: 'social' },
	'Instagram': { icon: '📷', color: '#e4405f', category: 'social' },
	'Facebook': { icon: '👤', color: '#1877f2', category: 'social' },
	'Discord': { icon: '💬', color: '#5865f2', category: 'gaming' },
	'Steam': { icon: '🎮', color: '#1b2838', category: 'gaming' },
	'Xbox': { icon: '🎯', color: '#107c10', category: 'gaming' },
	'PlayStation': { icon: '🎲', color: '#003791', category: 'gaming' },
	'Zoom': { icon: '📹', color: '#2d8cff', category: 'conferencing' },
	'Teams': { icon: '👥', color: '#6264a7', category: 'conferencing' },
	'WebRTC': { icon: '🔗', color: '#333333', category: 'conferencing' }
};

// Quality detection based on bandwidth
function detectQuality(bytesPerSec) {
	if (bytesPerSec > 2500000) return { label: '4K', color: '#9333ea', icon: '🎬' };
	if (bytesPerSec > 625000) return { label: 'FHD', color: '#2563eb', icon: '📺' };
	if (bytesPerSec > 312500) return { label: 'HD', color: '#059669', icon: '📹' };
	return { label: 'SD', color: '#d97706', icon: '📱' };
}

// Get streaming service info
function getServiceInfo(appName) {
	if (!appName) return { icon: '📡', color: '#6b7280', category: 'unknown' };
	for (var name in streamingServices) {
		if (appName.toLowerCase().indexOf(name.toLowerCase()) !== -1) {
			return { name: name, ...streamingServices[name] };
		}
	}
	return { icon: '📡', color: '#6b7280', category: 'other', name: appName };
}

// Device type detection for media
var mediaDeviceTypes = {
	'smart_tv': { icon: '📺', label: 'Smart TV', apps: ['Netflix', 'YouTube', 'Disney', 'AppleTV', 'Prime'] },
	'gaming': { icon: '🎮', label: 'Gaming', apps: ['Steam', 'PlayStation', 'Xbox', 'Twitch', 'Discord'] },
	'mobile': { icon: '📱', label: 'Mobile', apps: ['TikTok', 'Instagram', 'Spotify'] },
	'speaker': { icon: '🔊', label: 'Smart Speaker', apps: ['Spotify', 'Apple Music', 'Amazon'] },
	'computer': { icon: '💻', label: 'Computer', apps: ['Zoom', 'Teams', 'Chrome', 'Firefox'] }
};

function classifyMediaDevice(apps) {
	if (!apps || !Array.isArray(apps)) return { type: 'unknown', icon: '📟', label: 'Unknown' };
	for (var type in mediaDeviceTypes) {
		var typeApps = mediaDeviceTypes[type].apps;
		for (var i = 0; i < apps.length; i++) {
			for (var j = 0; j < typeApps.length; j++) {
				if (apps[i].toLowerCase().indexOf(typeApps[j].toLowerCase()) !== -1) {
					return { type: type, ...mediaDeviceTypes[type] };
				}
			}
		}
	}
	return { type: 'unknown', icon: '📟', label: 'Unknown' };
}

// QoS priority suggestions
var qosPriorities = {
	'video': { priority: 'high', dscp: 'AF41', desc: 'Video streaming - prioritize for smooth playback' },
	'audio': { priority: 'medium-high', dscp: 'AF31', desc: 'Audio streaming - moderate priority' },
	'gaming': { priority: 'highest', dscp: 'EF', desc: 'Gaming - lowest latency required' },
	'conferencing': { priority: 'highest', dscp: 'EF', desc: 'Video calls - real-time priority' },
	'social': { priority: 'low', dscp: 'BE', desc: 'Social media - best effort' },
	'other': { priority: 'normal', dscp: 'BE', desc: 'Standard priority' }
};

function getQosSuggestion(category) {
	return qosPriorities[category] || qosPriorities.other;
}

return baseclass.extend({
	// Core methods
	getStatus: callStatus,
	getActiveStreams: callGetActiveStreams,
	getStreamHistory: callGetStreamHistory,
	getStatsByService: callGetStatsByService,
	getStatsByClient: callGetStatsByClient,
	getServiceDetails: callGetServiceDetails,
	setAlert: callSetAlert,
	deleteAlert: callDeleteAlert,
	listAlerts: callListAlerts,
	clearHistory: callClearHistory,
	getSettings: callGetSettings,
	setSettings: callSetSettings,
	startNdpid: callStartNdpid,
	stopNdpid: callStopNdpid,
	startNetifyd: callStartNetifyd,
	stopNetifyd: callStopNetifyd,

	// nDPId methods
	getNdpidStatus: callNdpidStatus,
	getNdpidFlows: callNdpidFlows,
	getNdpidTopApps: callNdpidTopApps,
	getNdpidCategories: callNdpidCategories,

	// Utility functions
	streamingServices: streamingServices,
	mediaDeviceTypes: mediaDeviceTypes,
	qosPriorities: qosPriorities,
	detectQuality: detectQuality,
	getServiceInfo: getServiceInfo,
	classifyMediaDevice: classifyMediaDevice,
	getQosSuggestion: getQosSuggestion
});
