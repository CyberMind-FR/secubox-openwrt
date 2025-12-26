'use strict';
'require view';
'require rpc';

var callModules = rpc.declare({
	object: 'luci.secubox',
	method: 'modules',
	expect: { modules: [] }
});

return view.extend({
    load: function() {
        return callModules();
    },
    render: function(data) {
        // Debug info at top of page
        var debugInfo = E('div', {'style':'padding:20px;margin-bottom:20px;background:#fff3cd;border:2px solid #ffc107;border-radius:8px'}, [
            E('h3', {'style':'margin:0 0 10px 0;color:#856404'}, '🔍 Debug Information'),
            E('p', {}, 'Data type: ' + typeof data),
            E('p', {}, 'Is Array: ' + Array.isArray(data)),
            E('p', {}, 'Data length: ' + (data ? (data.length !== undefined ? data.length : 'no length') : 'null')),
            E('pre', {'style':'background:#f8f9fa;padding:10px;overflow:auto;max-height:200px'},
                JSON.stringify(data, null, 2))
        ]);

        var modules = Array.isArray(data) ? data : (data && data.modules ? data.modules : []);

        if (modules.length === 0) {
            return E('div', {'class':'cbi-map'}, [
                E('h2', {}, '📦 SecuBox Modules'),
                debugInfo,
                E('div', {'style':'color:red;padding:20px;background:#fee;border:2px solid red;border-radius:8px'},
                    E('p', {}, '❌ No modules found in data!'))
            ]);
        }

        return E('div', {'class':'cbi-map'}, [
            E('h2', {}, '📦 SecuBox Modules (' + modules.length + ' modules)'),
            debugInfo,
            E('div', {'style':'display:grid;gap:12px'}, modules.map(function(m) {
                return E('div', {'style':'background:#1e293b;padding:16px;border-radius:8px;border-left:4px solid '+(m.color||'#64748b')}, [
                    E('div', {'style':'font-weight:bold;color:#f1f5f9'}, m.name || m.id || 'Unknown'),
                    E('div', {'style':'color:#94a3b8;font-size:14px'}, m.description || ''),
                    E('span', {'style':'display:inline-block;margin-top:8px;padding:2px 8px;border-radius:4px;font-size:12px;background:'+(m.running?'#22c55e20;color:#22c55e':m.installed?'#f59e0b20;color:#f59e0b':'#64748b20;color:#64748b')},
                        m.running ? 'Running' : m.installed ? 'Stopped' : 'Not Installed')
                ]);
            }))
        ]);
    }
});
