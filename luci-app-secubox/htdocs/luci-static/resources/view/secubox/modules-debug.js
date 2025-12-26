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
        console.log('=== MODULES DEBUG: load() called ===');
        return callModules().then(function(result) {
            console.log('=== MODULES DEBUG: RPC result ===');
            console.log('Type:', typeof result);
            console.log('Is Array:', Array.isArray(result));
            console.log('Length:', result ? result.length : 'null/undefined');
            console.log('Full result:', JSON.stringify(result, null, 2));
            return result;
        }).catch(function(err) {
            console.error('=== MODULES DEBUG: RPC ERROR ===');
            console.error(err);
            return [];
        });
    },
    render: function(data) {
        console.log('=== MODULES DEBUG: render() called ===');
        console.log('Data type:', typeof data);
        console.log('Is Array:', Array.isArray(data));
        console.log('Data:', data);

        var modules = data || [];
        console.log('Modules array length:', modules.length);

        if (modules.length === 0) {
            return E('div', {class:'cbi-map'}, [
                E('h2', {}, '📦 SecuBox Modules'),
                E('div', {style:'color:red;padding:20px;background:#fee;border:1px solid red;border-radius:8px'}, [
                    E('p', {}, 'DEBUG: No modules found!'),
                    E('p', {}, 'Data type: ' + typeof data),
                    E('p', {}, 'Is Array: ' + Array.isArray(data)),
                    E('p', {}, 'Length: ' + (data ? (data.length || 'no length property') : 'null/undefined')),
                    E('p', {}, 'JSON: ' + JSON.stringify(data))
                ])
            ]);
        }

        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '📦 SecuBox Modules (' + modules.length + ' found)'),
            E('div', {style:'display:grid;gap:12px'}, modules.map(function(m) {
                console.log('Rendering module:', m.name);
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
