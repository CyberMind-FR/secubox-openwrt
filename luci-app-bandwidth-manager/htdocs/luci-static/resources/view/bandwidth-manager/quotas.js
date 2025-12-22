'use strict';
'require view';
'require bandwidth-manager.api as api';

return view.extend({
    load: function() { return api.getQuotas(); },
    render: function(data) {
        var quotas = data.quotas || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '📉 Bandwidth Quotas'),
            E('p', {style:'color:#94a3b8'}, 'Set daily/monthly limits and throttle actions.'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;margin-top:20px'}, [
                E('table', {style:'width:100%;color:#f1f5f9'}, [
                    E('tr', {style:'border-bottom:1px solid #334155'}, [
                        E('th', {style:'padding:12px;text-align:left'}, 'Profile'),
                        E('th', {style:'padding:12px'}, 'Daily Limit'),
                        E('th', {style:'padding:12px'}, 'Monthly Limit'),
                        E('th', {style:'padding:12px'}, 'Throttle Speed'),
                        E('th', {style:'padding:12px'}, 'Action')
                    ])
                ].concat(quotas.map(function(q) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px;font-weight:600'}, q.id),
                        E('td', {style:'padding:12px;text-align:center'}, q.daily_limit ? api.formatBytes(q.daily_limit * 1024 * 1024) : '∞'),
                        E('td', {style:'padding:12px;text-align:center'}, q.monthly_limit ? api.formatBytes(q.monthly_limit * 1024 * 1024) : '∞'),
                        E('td', {style:'padding:12px;text-align:center'}, api.formatSpeed(q.throttle_speed)),
                        E('td', {style:'padding:12px;text-align:center'}, E('span', {style:'padding:4px 8px;border-radius:4px;background:'+(q.action==='block'?'#ef444420;color:#ef4444':'#f59e0b20;color:#f59e0b')}, q.action))
                    ]);
                })))
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
