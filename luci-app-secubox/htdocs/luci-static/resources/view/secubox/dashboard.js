'use strict';
'require view';
'require rpc';

var callStatus = rpc.declare({object:'luci.secubox',method:'status',expect:{}});
var callModules = rpc.declare({object:'luci.secubox',method:'modules',expect:{modules:[]}});

return view.extend({
    load: function() { return Promise.all([callStatus(), callModules()]); },
    render: function(data) {
        var status = data[0] || {}, modules = data[1].modules || [];
        var cats = {security:[], monitoring:[], network:[], system:[]};
        modules.forEach(function(m) { if(cats[m.category]) cats[m.category].push(m); });
        
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🛡️ SecuBox Dashboard'),
            E('div', {style:'display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:20px 0'}, [
                E('div', {style:'background:#1e293b;padding:16px;border-radius:8px;text-align:center'}, [
                    E('div', {style:'font-size:24px;font-weight:bold;color:#22d3ee'}, status.modules_total || 0),
                    E('div', {style:'color:#94a3b8'}, 'Total Modules')
                ]),
                E('div', {style:'background:#1e293b;padding:16px;border-radius:8px;text-align:center'}, [
                    E('div', {style:'font-size:24px;font-weight:bold;color:#3b82f6'}, status.modules_installed || 0),
                    E('div', {style:'color:#94a3b8'}, 'Installed')
                ]),
                E('div', {style:'background:#1e293b;padding:16px;border-radius:8px;text-align:center'}, [
                    E('div', {style:'font-size:24px;font-weight:bold;color:#22c55e'}, status.modules_running || 0),
                    E('div', {style:'color:#94a3b8'}, 'Running')
                ]),
                E('div', {style:'background:#1e293b;padding:16px;border-radius:8px;text-align:center'}, [
                    E('div', {style:'font-size:24px;font-weight:bold;color:#f59e0b'}, (status.memory_percent || 0) + '%'),
                    E('div', {style:'color:#94a3b8'}, 'Memory')
                ])
            ]),
            E('p', {}, 'Hostname: ' + (status.hostname || 'unknown') + ' | Load: ' + (status.load || '0'))
        ]);
    }
});
