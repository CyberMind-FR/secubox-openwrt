'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({object:'luci.vhost-manager',method:'status',expect:{}});
var callInternalHosts = rpc.declare({object:'luci.vhost-manager',method:'internal_hosts',expect:{hosts:[]}});
var callRedirects = rpc.declare({object:'luci.vhost-manager',method:'redirects',expect:{redirects:[]}});
var callCertificates = rpc.declare({object:'luci.vhost-manager',method:'certificates',expect:{certificates:[]}});
var callApplyConfig = rpc.declare({object:'luci.vhost-manager',method:'apply_config'});

return baseclass.extend({
    getStatus: callStatus,
    getInternalHosts: callInternalHosts,
    getRedirects: callRedirects,
    getCertificates: callCertificates,
    applyConfig: callApplyConfig
});
