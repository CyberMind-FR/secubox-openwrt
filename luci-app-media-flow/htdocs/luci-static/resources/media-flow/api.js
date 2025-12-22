'use strict';
'require baseclass';
'require rpc';

var callStatus = rpc.declare({object:'luci.media-flow',method:'status',expect:{}});
var callServices = rpc.declare({object:'luci.media-flow',method:'services',expect:{services:[]}});
var callProtocols = rpc.declare({object:'luci.media-flow',method:'protocols',expect:{protocols:[]}});
var callFlows = rpc.declare({object:'luci.media-flow',method:'flows',expect:{flows:[]}});
var callStats = rpc.declare({object:'luci.media-flow',method:'stats',expect:{}});

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

return baseclass.extend({
    getStatus: callStatus,
    getServices: callServices,
    getProtocols: callProtocols,
    getFlows: callFlows,
    getStats: callStats,
    formatBytes: formatBytes
});
