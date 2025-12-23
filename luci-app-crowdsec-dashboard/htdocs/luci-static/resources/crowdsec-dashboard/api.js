'use strict';
'require baseclass';
'require rpc';

/**
 * CrowdSec Dashboard API
 * Package: luci-app-crowdsec-dashboard
 * RPCD object: luci.crowdsec-dashboard
 */

var callStatus = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'status',
	expect: { }
});

var callDecisions = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'decisions',
	expect: { decisions: [] }
});

var callAlerts = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'alerts',
	expect: { alerts: [] }
});

var callBouncers = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'bouncers',
	expect: { bouncers: [] }
});

var callMetrics = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'metrics',
	expect: { }
});

var callMachines = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'machines',
	expect: { machines: [] }
});

var callCollections = rpc.declare({
	object: 'luci.crowdsec-dashboard',
	method: 'collections',
	expect: { collections: [] }
});

return baseclass.extend({
	getStatus: callStatus,
	getDecisions: callDecisions,
	getAlerts: callAlerts,
	getBouncers: callBouncers,
	getMetrics: callMetrics,
	getMachines: callMachines,
	getCollections: callCollections
});
