'use strict';
'require rpc';

var callStatus = rpc.declare({
    object: 'luci.voip',
    method: 'status',
    expect: {}
});

var callExtensions = rpc.declare({
    object: 'luci.voip',
    method: 'extensions',
    expect: { extensions: [] }
});

var callCalls = rpc.declare({
    object: 'luci.voip',
    method: 'calls',
    expect: { calls: [] }
});

var callVoicemails = rpc.declare({
    object: 'luci.voip',
    method: 'voicemails',
    expect: { voicemails: [] }
});

var callTrunkStatus = rpc.declare({
    object: 'luci.voip',
    method: 'trunk_status',
    expect: {}
});

var callInstall = rpc.declare({
    object: 'luci.voip',
    method: 'install',
    expect: {}
});

var callStart = rpc.declare({
    object: 'luci.voip',
    method: 'start',
    expect: {}
});

var callStop = rpc.declare({
    object: 'luci.voip',
    method: 'stop',
    expect: {}
});

var callRestart = rpc.declare({
    object: 'luci.voip',
    method: 'restart',
    expect: {}
});

var callReload = rpc.declare({
    object: 'luci.voip',
    method: 'reload',
    expect: {}
});

var callExtAdd = rpc.declare({
    object: 'luci.voip',
    method: 'ext_add',
    params: ['number', 'name', 'password'],
    expect: {}
});

var callExtDel = rpc.declare({
    object: 'luci.voip',
    method: 'ext_del',
    params: ['number'],
    expect: {}
});

var callExtPasswd = rpc.declare({
    object: 'luci.voip',
    method: 'ext_passwd',
    params: ['number', 'password'],
    expect: {}
});

var callOriginate = rpc.declare({
    object: 'luci.voip',
    method: 'call_originate',
    params: ['from_ext', 'to_number'],
    expect: {}
});

var callHangup = rpc.declare({
    object: 'luci.voip',
    method: 'call_hangup',
    params: ['channel'],
    expect: {}
});

var callTrunkTest = rpc.declare({
    object: 'luci.voip',
    method: 'trunk_test',
    expect: {}
});

var callVmDelete = rpc.declare({
    object: 'luci.voip',
    method: 'vm_delete',
    params: ['extension', 'msg_id'],
    expect: {}
});

// Recording methods
var callRecStatus = rpc.declare({
    object: 'luci.voip',
    method: 'rec_status',
    expect: {}
});

var callRecEnable = rpc.declare({
    object: 'luci.voip',
    method: 'rec_enable',
    expect: {}
});

var callRecDisable = rpc.declare({
    object: 'luci.voip',
    method: 'rec_disable',
    expect: {}
});

var callRecList = rpc.declare({
    object: 'luci.voip',
    method: 'rec_list',
    params: ['date'],
    expect: {}
});

var callRecDelete = rpc.declare({
    object: 'luci.voip',
    method: 'rec_delete',
    params: ['filename'],
    expect: {}
});

var callRecDownload = rpc.declare({
    object: 'luci.voip',
    method: 'rec_download',
    params: ['filename'],
    expect: {}
});

var callRecCleanup = rpc.declare({
    object: 'luci.voip',
    method: 'rec_cleanup',
    params: ['days'],
    expect: {}
});

return L.Class.extend({
    getStatus: function() { return callStatus(); },
    getExtensions: function() { return callExtensions(); },
    getCalls: function() { return callCalls(); },
    getVoicemails: function() { return callVoicemails(); },
    getTrunkStatus: function() { return callTrunkStatus(); },
    install: function() { return callInstall(); },
    start: function() { return callStart(); },
    stop: function() { return callStop(); },
    restart: function() { return callRestart(); },
    reload: function() { return callReload(); },
    addExtension: function(num, name, pwd) { return callExtAdd(num, name, pwd); },
    delExtension: function(num) { return callExtDel(num); },
    setExtPassword: function(num, pwd) { return callExtPasswd(num, pwd); },
    originateCall: function(from, to) { return callOriginate(from, to); },
    hangupCall: function(ch) { return callHangup(ch); },
    testTrunk: function() { return callTrunkTest(); },
    deleteVoicemail: function(ext, id) { return callVmDelete(ext, id); },

    // Recording methods
    getRecordingStatus: function() { return callRecStatus(); },
    enableRecording: function() { return callRecEnable(); },
    disableRecording: function() { return callRecDisable(); },
    listRecordings: function(date) { return callRecList(date || ''); },
    deleteRecording: function(filename) { return callRecDelete(filename); },
    downloadRecording: function(filename) { return callRecDownload(filename); },
    cleanupRecordings: function(days) { return callRecCleanup(days || 30); }
});
