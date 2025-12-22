'use strict';
'require view';
'require bandwidth-manager.api as api';

return view.extend({
    load: function() { return api.getClients(); },
    render: function(data) {
        var clients = data.clients || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '👥 Connected Clients'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;margin-top:20px'}, [
                clients.length ? E('table', {style:'width:100%;color:#f1f5f9'}, [
                    E('tr', {style:'border-bottom:1px solid #334155'}, [
                        E('th', {style:'padding:12px;text-align:left'}, 'Hostname'),
                        E('th', {style:'padding:12px'}, 'IP Address'),
                        E('th', {style:'padding:12px'}, 'MAC'),
                        E('th', {style:'padding:12px'}, 'Download'),
                        E('th', {style:'padding:12px'}, 'Upload')
                    ])
                ].concat(clients.map(function(c) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px;font-weight:600'}, c.hostname),
                        E('td', {style:'padding:12px;text-align:center;font-family:monospace'}, c.ip),
                        E('td', {style:'padding:12px;text-align:center;font-family:monospace;font-size:12px'}, c.mac),
                        E('td', {style:'padding:12px;text-align:center;color:#22c55e'}, api.formatBytes(c.rx_bytes)),
                        E('td', {style:'padding:12px;text-align:center;color:#3b82f6'}, api.formatBytes(c.tx_bytes))
                    ]);
                }))) : E('p', {style:'color:#64748b;text-align:center'}, 'No clients connected')
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
