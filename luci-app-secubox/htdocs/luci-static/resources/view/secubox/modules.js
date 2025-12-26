'use strict';
'require view';
'require rpc';

var callModules = rpc.declare({
	object: 'luci.secubox',
	method: 'modules',
	expect: { modules: [] }
});

return view.extend({
    load: function() { return callModules(); },
    render: function(data) {
        // data is already the array because of expect: { modules: [] }
        var modules = data || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '📦 SecuBox Modules'),
            E('div', {style:'display:grid;gap:12px'}, modules.map(function(m) {
                return E('div', {style:'background:#1e293b;padding:16px;border-radius:8px;border-left:4px solid '+m.color}, [
                    E('div', {style:'font-weight:bold;color:#f1f5f9'}, m.name),
                    E('div', {style:'color:#94a3b8;font-size:14px'}, m.description),
                    E('span', {style:'display:inline-block;margin-top:8px;padding:2px 8px;border-radius:4px;font-size:12px;background:'+(m.running?'#22c55e20;color:#22c55e':m.installed?'#f59e0b20;color:#f59e0b':'#64748b20;color:#64748b')}, 
                        m.running ? 'Running' : m.installed ? 'Stopped' : 'Not Installed')
                ]);
            }))
        ]);
    }
});
