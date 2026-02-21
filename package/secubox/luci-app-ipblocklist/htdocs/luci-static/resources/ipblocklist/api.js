'use strict';
'require rpc';

var callStatus = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'status',
    expect: { }
});

var callLogs = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'logs',
    params: ['lines'],
    expect: { }
});

var callSources = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'sources',
    expect: { }
});

var callWhitelist = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'whitelist',
    expect: { }
});

var callUpdate = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'update',
    expect: { }
});

var callFlush = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'flush',
    expect: { }
});

var callTestIp = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'test_ip',
    params: ['ip'],
    expect: { }
});

var callSetEnabled = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'set_enabled',
    params: ['enabled'],
    expect: { }
});

var callAddSource = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'add_source',
    params: ['url'],
    expect: { }
});

var callRemoveSource = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'remove_source',
    params: ['url'],
    expect: { }
});

var callAddWhitelist = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'add_whitelist',
    params: ['entry'],
    expect: { }
});

var callRemoveWhitelist = rpc.declare({
    object: 'luci.ipblocklist',
    method: 'remove_whitelist',
    params: ['entry'],
    expect: { }
});

return L.Class.extend({
    getStatus: function() {
        return callStatus();
    },

    getLogs: function(lines) {
        return callLogs(lines || 50);
    },

    getSources: function() {
        return callSources();
    },

    getWhitelist: function() {
        return callWhitelist();
    },

    update: function() {
        return callUpdate();
    },

    flush: function() {
        return callFlush();
    },

    testIp: function(ip) {
        return callTestIp(ip);
    },

    setEnabled: function(enabled) {
        return callSetEnabled(enabled ? 1 : 0);
    },

    addSource: function(url) {
        return callAddSource(url);
    },

    removeSource: function(url) {
        return callRemoveSource(url);
    },

    addWhitelist: function(entry) {
        return callAddWhitelist(entry);
    },

    removeWhitelist: function(entry) {
        return callRemoveWhitelist(entry);
    }
});
