'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({object:'luci.auth-guardian',method:'status',expect:{}});
var callSessions = rpc.declare({object:'luci.auth-guardian',method:'sessions',expect:{sessions:[]}});
var callVouchers = rpc.declare({object:'luci.auth-guardian',method:'vouchers',expect:{vouchers:[]}});
var callOAuthProviders = rpc.declare({object:'luci.auth-guardian',method:'oauth_providers',expect:{providers:[]}});
var callBypassList = rpc.declare({object:'luci.auth-guardian',method:'bypass_list',expect:{}});
var callGenerateVoucher = rpc.declare({object:'luci.auth-guardian',method:'generate_voucher'});

return baseclass.extend({
    getStatus: callStatus,
    getSessions: callSessions,
    getVouchers: callVouchers,
    getOAuthProviders: callOAuthProviders,
    getBypassList: callBypassList,
    generateVoucher: callGenerateVoucher
});
