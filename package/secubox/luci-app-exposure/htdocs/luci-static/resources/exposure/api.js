'use strict';
'require rpc';

var callScan = rpc.declare({
    object: 'luci.exposure',
    method: 'scan',
    expect: { services: [] }
});

var callConflicts = rpc.declare({
    object: 'luci.exposure',
    method: 'conflicts',
    expect: { conflicts: [] }
});

var callStatus = rpc.declare({
    object: 'luci.exposure',
    method: 'status'
});

var callTorList = rpc.declare({
    object: 'luci.exposure',
    method: 'tor_list',
    expect: { services: [] }
});

var callSslList = rpc.declare({
    object: 'luci.exposure',
    method: 'ssl_list',
    expect: { backends: [] }
});

var callGetConfig = rpc.declare({
    object: 'luci.exposure',
    method: 'get_config',
    expect: { known_services: [] }
});

var callFixPort = rpc.declare({
    object: 'luci.exposure',
    method: 'fix_port',
    params: ['service', 'port']
});

var callTorAdd = rpc.declare({
    object: 'luci.exposure',
    method: 'tor_add',
    params: ['service', 'local_port', 'onion_port']
});

var callTorRemove = rpc.declare({
    object: 'luci.exposure',
    method: 'tor_remove',
    params: ['service']
});

var callSslAdd = rpc.declare({
    object: 'luci.exposure',
    method: 'ssl_add',
    params: ['service', 'domain', 'local_port']
});

var callSslRemove = rpc.declare({
    object: 'luci.exposure',
    method: 'ssl_remove',
    params: ['service']
});

return {
    scan: callScan,
    conflicts: callConflicts,
    status: callStatus,
    torList: callTorList,
    sslList: callSslList,
    getConfig: callGetConfig,
    fixPort: callFixPort,
    torAdd: callTorAdd,
    torRemove: callTorRemove,
    sslAdd: callSslAdd,
    sslRemove: callSslRemove
};
