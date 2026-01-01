'use strict';
'require baseclass';
'require rpc';

// Status and overview
var callStatus = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'status',
	expect: {}
});

// OAuth providers
var callListProviders = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'list_providers',
	expect: { providers: [] }
});

var callSetProvider = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'set_provider',
	params: ['provider', 'name', 'client_id', 'client_secret', 'redirect_uri'],
	expect: {}
});

var callDeleteProvider = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'delete_provider',
	params: ['provider_id'],
	expect: {}
});

// Vouchers
var callListVouchers = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'list_vouchers',
	expect: { vouchers: [] }
});

var callCreateVoucher = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'create_voucher',
	params: ['duration_hours', 'data_limit_mb', 'note'],
	expect: {}
});

var callDeleteVoucher = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'delete_voucher',
	params: ['voucher_id'],
	expect: {}
});

var callValidateVoucher = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'validate_voucher',
	params: ['code', 'mac'],
	expect: {}
});

// Sessions
var callListSessions = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'list_sessions',
	expect: { sessions: [] }
});

var callRevokeSession = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'revoke_session',
	params: ['mac'],
	expect: {}
});

// Logs
var callGetLogs = rpc.declare({
	object: 'luci.auth-guardian',
	method: 'get_logs',
	params: ['limit'],
	expect: { logs: [] }
});

return baseclass.extend({
	getStatus: callStatus,
	listProviders: callListProviders,
	setProvider: callSetProvider,
	deleteProvider: callDeleteProvider,
	listVouchers: callListVouchers,
	createVoucher: callCreateVoucher,
	deleteVoucher: callDeleteVoucher,
	validateVoucher: callValidateVoucher,
	listSessions: callListSessions,
	getSessions: callListSessions,  // Alias for compatibility
	revokeSession: callRevokeSession,
	getLogs: callGetLogs
});
