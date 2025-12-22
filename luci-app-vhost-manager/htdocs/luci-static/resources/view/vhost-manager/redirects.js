'use strict';
'require view';
'require vhost-manager.api as api';

return view.extend({
    load: function() { return api.getRedirects(); },
    render: function(data) {
        var redirects = data.redirects || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '↪️ External Service Redirects'),
            E('p', {style:'color:#94a3b8;margin-bottom:20px'}, 'Redirect external services to local alternatives (requires DNS interception).'),
            E('div', {style:'display:grid;gap:16px'}, redirects.map(function(r) {
                return E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;opacity:'+(r.enabled?'1':'0.5')}, [
                    E('div', {style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px'}, [
                        E('div', {style:'font-weight:600;color:#f1f5f9;font-size:16px'}, r.name),
                        E('span', {style:'padding:4px 8px;border-radius:4px;background:'+(r.enabled?'#f59e0b20;color:#f59e0b':'#64748b20;color:#64748b')}, r.enabled ? 'Active' : 'Disabled')
                    ]),
                    E('div', {style:'color:#94a3b8;font-size:13px;margin-bottom:12px'}, r.description),
                    E('div', {style:'display:flex;align-items:center;gap:16px;padding:12px;background:#0f172a;border-radius:8px'}, [
                        E('span', {style:'font-family:monospace;color:#ef4444;text-decoration:line-through'}, r.external_domain),
                        E('span', {style:'font-size:20px'}, '→'),
                        E('span', {style:'font-family:monospace;color:#10b981'}, r.local_domain)
                    ])
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
