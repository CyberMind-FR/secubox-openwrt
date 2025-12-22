'use strict';
'require view';
'require bandwidth-manager.api as api';

return view.extend({
    load: function() {
        return Promise.all([api.getStatus(), api.getClasses(), api.getClients()]);
    },
    render: function(data) {
        var status = data[0] || {};
        var classes = data[1].classes || [];
        var clients = data[2].clients || [];
        
        return E('div', {class:'cbi-map'}, [
            E('style', {}, [
                '.bw{font-family:system-ui,sans-serif}',
                '.bw-hdr{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;padding:24px;border-radius:12px;margin-bottom:20px}',
                '.bw-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}',
                '.bw-stat{background:#1e293b;padding:20px;border-radius:10px;text-align:center}',
                '.bw-stat-val{font-size:28px;font-weight:700;color:#a855f7}',
                '.bw-stat-lbl{font-size:12px;color:#94a3b8;margin-top:4px}',
                '.bw-section{background:#1e293b;padding:20px;border-radius:10px;margin-bottom:16px}',
                '.bw-section-title{font-size:16px;font-weight:600;color:#f1f5f9;margin-bottom:16px}',
                '.bw-class{display:flex;align-items:center;gap:12px;padding:12px;background:#0f172a;border-radius:8px;margin-bottom:8px}',
                '.bw-class-bar{height:8px;border-radius:4px;background:#334155;flex:1}',
                '.bw-class-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#7c3aed,#a855f7)}',
                '.bw-badge{padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600}'
            ].join('')),
            E('div', {class:'bw'}, [
                E('div', {class:'bw-hdr'}, [
                    E('h1', {style:'margin:0 0 8px;font-size:24px'}, '⚡ Bandwidth Manager'),
                    E('p', {style:'margin:0;opacity:.9'}, 'QoS, Quotas & Media Detection')
                ]),
                E('div', {class:'bw-stats'}, [
                    E('div', {class:'bw-stat'}, [
                        E('div', {class:'bw-stat-val'}, status.qos_active ? '✓' : '✗'),
                        E('div', {class:'bw-stat-lbl'}, 'QoS Status')
                    ]),
                    E('div', {class:'bw-stat'}, [
                        E('div', {class:'bw-stat-val'}, clients.length),
                        E('div', {class:'bw-stat-lbl'}, 'Active Clients')
                    ]),
                    E('div', {class:'bw-stat'}, [
                        E('div', {class:'bw-stat-val'}, api.formatBytes(status.rx_bytes || 0)),
                        E('div', {class:'bw-stat-lbl'}, 'Downloaded')
                    ]),
                    E('div', {class:'bw-stat'}, [
                        E('div', {class:'bw-stat-val'}, api.formatBytes(status.tx_bytes || 0)),
                        E('div', {class:'bw-stat-lbl'}, 'Uploaded')
                    ])
                ]),
                E('div', {class:'bw-section'}, [
                    E('div', {class:'bw-section-title'}, '📊 QoS Classes'),
                    E('div', {}, classes.map(function(c) {
                        return E('div', {class:'bw-class'}, [
                            E('span', {style:'width:100px;font-weight:600;color:#f1f5f9'}, c.name),
                            E('span', {class:'bw-badge',style:'background:#7c3aed20;color:#a855f7'}, 'P'+c.priority),
                            E('div', {class:'bw-class-bar'}, [
                                E('div', {class:'bw-class-fill',style:'width:'+c.rate+'%'})
                            ]),
                            E('span', {style:'color:#94a3b8;font-size:12px'}, c.rate+'% / '+c.ceil+'%')
                        ]);
                    }))
                ])
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
