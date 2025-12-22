'use strict';
'require view';
'require vhost-manager.api as api';

return view.extend({
    load: function() { return api.getCertificates(); },
    render: function(data) {
        var certs = data.certificates || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🔒 SSL Certificates'),
            E('p', {style:'color:#94a3b8;margin-bottom:20px'}, 'Manage SSL/TLS certificates for your virtual hosts.'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                certs.length ? E('table', {style:'width:100%;color:#f1f5f9'}, [
                    E('tr', {style:'border-bottom:1px solid #334155'}, [
                        E('th', {style:'padding:12px;text-align:left'}, 'Domain'),
                        E('th', {style:'padding:12px'}, 'Expiry'),
                        E('th', {style:'padding:12px'}, 'Status')
                    ])
                ].concat(certs.map(function(c) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px;font-family:monospace'}, c.domain),
                        E('td', {style:'padding:12px;color:#94a3b8'}, c.expiry || 'Unknown'),
                        E('td', {style:'padding:12px'}, E('span', {style:'padding:4px 8px;border-radius:4px;background:#22c55e20;color:#22c55e'}, 'Valid'))
                    ]);
                }))) : E('p', {style:'color:#64748b;text-align:center'}, 'No certificates found')
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
