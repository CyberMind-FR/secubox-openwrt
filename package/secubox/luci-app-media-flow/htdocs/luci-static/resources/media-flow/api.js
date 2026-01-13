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

return baseclass.extend({
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
	stopNetifyd: callStopNetifyd
});
