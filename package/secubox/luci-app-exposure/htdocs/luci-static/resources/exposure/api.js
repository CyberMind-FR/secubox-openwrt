'use strict';
'require baseclass';
'require rpc';

return baseclass.extend({
    callScan: rpc.declare({
        object: 'luci.exposure',
        method: 'scan',
        expect: { services: [] }
    }),

    callConflicts: rpc.declare({
        object: 'luci.exposure',
        method: 'conflicts',
        expect: { conflicts: [] }
    }),

    callStatus: rpc.declare({
        object: 'luci.exposure',
        method: 'status'
    }),

    callTorList: rpc.declare({
        object: 'luci.exposure',
        method: 'tor_list',
        expect: { services: [] }
    }),

    callSslList: rpc.declare({
        object: 'luci.exposure',
        method: 'ssl_list',
        expect: { backends: [] }
    }),

    callGetConfig: rpc.declare({
        object: 'luci.exposure',
        method: 'get_config',
        expect: { known_services: [] }
    }),

    callFixPort: rpc.declare({
        object: 'luci.exposure',
        method: 'fix_port',
        params: ['service', 'port']
    }),

    callTorAdd: rpc.declare({
        object: 'luci.exposure',
        method: 'tor_add',
        params: ['service', 'local_port', 'onion_port']
    }),

    callTorRemove: rpc.declare({
        object: 'luci.exposure',
        method: 'tor_remove',
        params: ['service']
    }),

    callSslAdd: rpc.declare({
        object: 'luci.exposure',
        method: 'ssl_add',
        params: ['service', 'domain', 'local_port']
    }),

    callSslRemove: rpc.declare({
        object: 'luci.exposure',
        method: 'ssl_remove',
        params: ['service']
    }),

    scan: function() { return this.callScan(); },
    conflicts: function() { return this.callConflicts(); },
    status: function() { return this.callStatus(); },
    torList: function() { return this.callTorList(); },
    sslList: function() { return this.callSslList(); },
    getConfig: function() { return this.callGetConfig(); },
    fixPort: function(s, p) { return this.callFixPort(s, p); },
    torAdd: function(s, l, o) { return this.callTorAdd(s, l, o); },
    torRemove: function(s) { return this.callTorRemove(s); },
    sslAdd: function(s, d, p) { return this.callSslAdd(s, d, p); },
    sslRemove: function(s) { return this.callSslRemove(s); }
});
