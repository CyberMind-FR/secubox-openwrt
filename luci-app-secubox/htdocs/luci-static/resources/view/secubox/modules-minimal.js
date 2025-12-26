'use strict';
'require view';
'require secubox/theme as Theme';

// Initialize theme
Theme.init();

return view.extend({
    load: function() {
        return Promise.resolve(null);
    },
    render: function() {
        return E('div', {'class': 'cbi-map'}, [
            E('h2', {}, 'Test: SecuBox Modules'),
            E('div', {'style': 'padding:20px;background:#d4edda;border:2px solid green'}, [
                E('p', {}, '✅ If you see this, the JavaScript file is loading correctly!'),
                E('p', {}, 'File: /www/luci-static/resources/view/secubox/modules.js'),
                E('p', {}, 'This is a minimal test without RPC calls.')
            ])
        ]);
    }
});
