'use strict';
'require view';
'require rpc';
'require secubox/theme as Theme';

// Initialize theme
Theme.init();

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
        var modules = Array.isArray(data) ? data : (data && data.modules ? data.modules : []);

        if (modules.length === 0) {
            return E('div', {'class':'cbi-map'}, [
                E('h2', {}, '📦 SecuBox Modules'),
                E('div', {'style':'color:#856404;padding:20px;background:#fff3cd;border:2px solid #ffc107;border-radius:8px'},
                    E('p', {}, '⚠️ No modules found. Please check your configuration.'))
            ]);
        }

        return E('div', {'class':'cbi-map'}, [
            E('h2', {}, '📦 SecuBox Modules'),
            E('p', {'style':'color:#64748b;margin-bottom:20px'},
                modules.length + ' modules available • ' +
                modules.filter(function(m) { return m.installed; }).length + ' installed • ' +
                modules.filter(function(m) { return m.running; }).length + ' running'
            ),
            E('div', {'style':'display:grid;gap:12px'}, modules.map(function(m) {
                return E('div', {'style':'background:#1e293b;padding:16px;border-radius:8px;border-left:4px solid '+(m.color||'#64748b')}, [
                    E('div', {'style':'font-weight:bold;color:#f1f5f9'}, m.name || m.id || 'Unknown'),
                    E('div', {'style':'color:#94a3b8;font-size:14px;margin:4px 0'}, m.description || ''),
                    E('div', {'style':'display:flex;gap:8px;margin-top:8px'}, [
                        E('span', {'style':'padding:2px 8px;border-radius:4px;font-size:12px;background:'+(m.running?'#22c55e20;color:#22c55e':m.installed?'#f59e0b20;color:#f59e0b':'#64748b20;color:#64748b')},
                            m.running ? '✓ Running' : m.installed ? '○ Stopped' : '- Not Installed'),
                        E('span', {'style':'padding:2px 8px;border-radius:4px;font-size:12px;background:#1e293b;color:#94a3b8;border:1px solid #334155'},
                            m.category || 'other')
                    ])
                ]);
            }))
        ]);
    }
});
