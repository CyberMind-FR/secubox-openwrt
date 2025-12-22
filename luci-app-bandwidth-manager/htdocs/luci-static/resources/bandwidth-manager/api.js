'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({object:'luci.bandwidth-manager',method:'status',expect:{}});
var callClasses = rpc.declare({object:'luci.bandwidth-manager',method:'classes',expect:{classes:[]}});
var callQuotas = rpc.declare({object:'luci.bandwidth-manager',method:'quotas',expect:{quotas:[]}});
var callMedia = rpc.declare({object:'luci.bandwidth-manager',method:'media',expect:{media:[]}});
var callClients = rpc.declare({object:'luci.bandwidth-manager',method:'clients',expect:{clients:[]}});
var callStats = rpc.declare({object:'luci.bandwidth-manager',method:'stats',expect:{}});
var callApplyQos = rpc.declare({object:'luci.bandwidth-manager',method:'apply_qos'});

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(kbps) {
    if (kbps >= 1000) return (kbps / 1000).toFixed(1) + ' Mbps';
    return kbps + ' Kbps';
}

return baseclass.extend({
    getStatus: callStatus,
    getClasses: callClasses,
    getQuotas: callQuotas,
    getMedia: callMedia,
    getClients: callClients,
    getStats: callStats,
    applyQos: callApplyQos,
    formatBytes: formatBytes,
    formatSpeed: formatSpeed
});
