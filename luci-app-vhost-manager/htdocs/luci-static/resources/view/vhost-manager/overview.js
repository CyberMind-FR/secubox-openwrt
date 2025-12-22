'use strict';
'require view';
'require vhost-manager.api as api';

return view.extend({
    load: function() {
        return Promise.all([api.getStatus(), api.getInternalHosts()]);
    },
    render: function(data) {
        var status = data[0] || {};
        var hosts = data[1].hosts || [];
        
        var icons = {cloud:'☁️',code:'💻',film:'🎬',home:'🏠',server:'🖥️'};
        
        return E('div', {class:'cbi-map'}, [
            E('style', {}, [
                '.vh{font-family:system-ui,sans-serif}',
                '.vh-hdr{background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;border-radius:12px;margin-bottom:20px}',
                '.vh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}',
                '.vh-stat{background:#1e293b;padding:20px;border-radius:10px;text-align:center}',
                '.vh-stat-val{font-size:28px;font-weight:700;color:#10b981}',
                '.vh-hosts{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}'
            ].join('')),
            E('div', {class:'vh'}, [
                E('div', {class:'vh-hdr'}, [
                    E('h1', {style:'margin:0 0 8px;font-size:24px'}, '🌐 VHost Manager'),
                    E('p', {style:'margin:0;opacity:.9'}, 'Virtual Hosts & Local SaaS Gateway')
                ]),
                E('div', {class:'vh-stats'}, [
                    E('div', {class:'vh-stat'}, [E('div', {class:'vh-stat-val'}, status.nginx_active ? '✓' : '✗'), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'Nginx')]),
                    E('div', {class:'vh-stat'}, [E('div', {class:'vh-stat-val'}, status.dns_active ? '✓' : '✗'), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'DNS')]),
                    E('div', {class:'vh-stat'}, [E('div', {class:'vh-stat-val'}, status.internal_hosts || 0), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'Internal Hosts')]),
                    E('div', {class:'vh-stat'}, [E('div', {class:'vh-stat-val'}, status.redirects || 0), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'Redirects')])
                ]),
                E('div', {class:'vh-hosts'}, hosts.filter(function(h) { return h.enabled; }).map(function(h) {
                    return E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;border-left:4px solid '+h.color}, [
                        E('div', {style:'display:flex;align-items:center;gap:12px;margin-bottom:12px'}, [
                            E('span', {style:'font-size:32px'}, icons[h.icon] || '🖥️'),
                            E('div', {}, [
                                E('div', {style:'font-weight:600;color:#f1f5f9;font-size:18px'}, h.name),
                                E('div', {style:'color:#94a3b8;font-size:13px'}, h.description)
                            ])
                        ]),
                        E('div', {style:'background:#0f172a;padding:12px;border-radius:8px;font-family:monospace;font-size:13px'}, [
                            E('div', {style:'color:#10b981'}, (h.ssl ? '🔒 https://' : '🔓 http://') + h.domain),
                            E('div', {style:'color:#64748b;margin-top:4px'}, '→ ' + h.backend)
                        ])
                    ]);
                }))
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
