'use strict';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'status',
	expect: { }
});

var callGetThreats = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'get_threats',
	params: ['limit'],
	expect: { }
});

var callGetAlerts = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'get_alerts',
	params: ['limit'],
	expect: { }
});

var callGetPending = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'get_pending',
	expect: { }
});

var callChat = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'chat',
	params: ['message'],
	expect: { }
});

var callAnalyze = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'analyze',
	expect: { }
});

var callGenerateRules = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'generate_rules',
	params: ['target'],
	expect: { }
});

var callApproveRule = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'approve_rule',
	params: ['id'],
	expect: { }
});

var callRejectRule = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'reject_rule',
	params: ['id'],
	expect: { }
});

var callRunCycle = rpc.declare({
	object: 'luci.threat-analyst',
	method: 'run_cycle',
	expect: { }
});

return {
	status: callStatus,
	getThreats: callGetThreats,
	getAlerts: callGetAlerts,
	getPending: callGetPending,
	chat: callChat,
	analyze: callAnalyze,
	generateRules: callGenerateRules,
	approveRule: callApproveRule,
	rejectRule: callRejectRule,
	runCycle: callRunCycle
};
