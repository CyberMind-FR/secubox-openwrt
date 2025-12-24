'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'status',
	expect: {}
});

var callListRules = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_rules',
	expect: { rules: [] }
});

var callAddRule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'add_rule',
	params: ['name', 'type', 'target', 'limit_down', 'limit_up', 'priority'],
	expect: {}
});

var callDeleteRule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_rule',
	params: ['rule_id'],
	expect: {}
});

var callListQuotas = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_quotas',
	expect: { quotas: [] }
});

var callGetQuota = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_quota',
	params: ['mac'],
	expect: {}
});

var callSetQuota = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'set_quota',
	params: ['mac', 'name', 'limit_mb', 'action', 'reset_day'],
	expect: {}
});

var callResetQuota = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'reset_quota',
	params: ['mac'],
	expect: {}
});

var callGetUsageRealtime = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_usage_realtime',
	expect: { clients: [] }
});

var callGetUsageHistory = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_usage_history',
	params: ['timeframe', 'mac'],
	expect: { history: [] }
});

return {
	getStatus: callStatus,
	listRules: callListRules,
	addRule: callAddRule,
	deleteRule: callDeleteRule,
	listQuotas: callListQuotas,
	getQuota: callGetQuota,
	setQuota: callSetQuota,
	resetQuota: callResetQuota,
	getUsageRealtime: callGetUsageRealtime,
	getUsageHistory: callGetUsageHistory
};
