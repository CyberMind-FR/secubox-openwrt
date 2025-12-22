'use strict';
'require view';
'require vhost-manager.api as api';

return view.extend({
    load: function() { return api.getInternalHosts(); },
    render: function(data) {
        var hosts = data.hosts || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🏠 Internal Virtual Hosts'),
            E('p', {style:'color:#94a3b8;margin-bottom:20px'}, 'Self-hosted services accessible from your local network.'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                E('table', {style:'width:100%;color:#f1f5f9'}, [
                    E('tr', {style:'border-bottom:1px solid #334155'}, [
                        E('th', {style:'padding:12px;text-align:left'}, 'Service'),
                        E('th', {style:'padding:12px'}, 'Domain'),
                        E('th', {style:'padding:12px'}, 'Backend'),
                        E('th', {style:'padding:12px'}, 'SSL'),
                        E('th', {style:'padding:12px'}, 'Status')
                    ])
                ].concat(hosts.map(function(h) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px;font-weight:600'}, h.name),
                        E('td', {style:'padding:12px;font-family:monospace;color:#10b981'}, h.domain),
                        E('td', {style:'padding:12px;font-family:monospace;color:#64748b'}, h.backend),
                        E('td', {style:'padding:12px;text-align:center'}, h.ssl ? '🔒' : '🔓'),
                        E('td', {style:'padding:12px'}, E('span', {style:'padding:4px 8px;border-radius:4px;background:'+(h.enabled?'#22c55e20;color:#22c55e':'#64748b20;color:#64748b')}, h.enabled ? 'Active' : 'Disabled'))
                    ]);
                })))
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
