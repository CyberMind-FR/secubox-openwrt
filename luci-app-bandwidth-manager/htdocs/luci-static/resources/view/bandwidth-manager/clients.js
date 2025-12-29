'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require bandwidth-manager/api as API';

return view.extend({
    load: function() { return API.getUsageRealtime(); },
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
                ].concat(clients.map(L.bind(function(c) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px;font-weight:600'}, c.hostname),
                        E('td', {style:'padding:12px;text-align:center;font-family:monospace'}, c.ip),
                        E('td', {style:'padding:12px;text-align:center;font-family:monospace;font-size:12px'}, c.mac),
                        E('td', {style:'padding:12px;text-align:center;color:#22c55e'}, this.formatBytes(c.rx_bytes)),
                        E('td', {style:'padding:12px;text-align:center;color:#3b82f6'}, this.formatBytes(c.tx_bytes))
                    ]);
                }, this)))) : E('p', {style:'color:#64748b;text-align:center'}, 'No clients connected')
            ])
        ]);
    },

    formatBytes: function(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    handleSaveApply:null,handleSave:null,handleReset:null
});
