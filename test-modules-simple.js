'use strict';
'require view';

return view.extend({
    load: function() {
        console.log('TEST: Simple modules page loaded');
        return Promise.resolve({test: 'data'});
    },
    render: function(data) {
        console.log('TEST: render called with:', data);
        return E('div', {class:'cbi-map'}, [
            E('h2', {style:'color:green'}, '✅ TEST: If you see this, the file is loading!'),
            E('div', {style:'padding:20px;background:#dfd;border:2px solid green'}, [
                E('p', {}, 'File path: /www/luci-static/resources/view/secubox/modules.js'),
                E('p', {}, 'Menu path: admin/secubox/modules'),
                E('p', {}, 'This is a test. Replace with actual modules.js content.')
            ])
        ]);
    }
});
