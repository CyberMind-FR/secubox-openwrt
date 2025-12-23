'use strict';
'require baseclass';
'require rpc';

/**
 * Netdata Dashboard API
 * Package: luci-app-netdata-dashboard
 * RPCD object: luci.netdata-dashboard
 */

var callStatus = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'status',
	expect: { }
});

var callInfo = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'info',
	expect: { }
});

var callCharts = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'charts',
	expect: { charts: [] }
});

var callAlarms = rpc.declare({
	object: 'luci.netdata-dashboard',
	method: 'alarms',
	expect: { alarms: [] }
});

return baseclass.extend({
	getStatus: callStatus,
	getInfo: callInfo,
	getCharts: callCharts,
	getAlarms: callAlarms
});
