'use strict';
'require view';
'require media-flow.api as api';

return view.extend({
    load: function() { return api.getFlows(); },
    render: function(data) {
        var flows = data.flows || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🌊 Active Media Flows'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                E('table', {style:'width:100%;color:#f1f5f9'}, [
                    E('tr', {style:'border-bottom:1px solid #334155'}, [
                        E('th', {style:'padding:12px;text-align:left'}, 'Service'),
                        E('th', {style:'padding:12px'}, 'Client'),
                        E('th', {style:'padding:12px'}, 'Bandwidth'),
                        E('th', {style:'padding:12px'}, 'Quality'),
                        E('th', {style:'padding:12px'}, 'Duration')
                    ])
                ].concat(flows.map(function(f) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px;font-weight:600'}, f.service),
                        E('td', {style:'padding:12px;font-family:monospace'}, f.client),
                        E('td', {style:'padding:12px;color:#ef4444'}, api.formatBytes(f.bandwidth) + '/s'),
                        E('td', {style:'padding:12px'}, E('span', {style:'padding:4px 8px;border-radius:4px;background:#22c55e20;color:#22c55e'}, f.quality)),
                        E('td', {style:'padding:12px;color:#94a3b8'}, Math.floor(f.duration / 60) + 'm')
                    ]);
                })))
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
