'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.media-flow',
	method: 'status',
	expect: { }
});

var callGetActiveStreams = rpc.declare({
	object: 'luci.media-flow',
	method: 'get_active_streams',
	expect: { streams: [] }
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

var callListAlerts = rpc.declare({
	object: 'luci.media-flow',
	method: 'list_alerts',
	expect: { alerts: [] }
});

return {
	getStatus: callStatus,
	getActiveStreams: callGetActiveStreams,
	getStreamHistory: callGetStreamHistory,
	getStatsByService: callGetStatsByService,
	getStatsByClient: callGetStatsByClient,
	getServiceDetails: callGetServiceDetails,
	setAlert: callSetAlert,
	listAlerts: callListAlerts
};
