'use strict';
'require view';

return view.extend({
    render: function() {
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '⏰ Time-Based Schedules'),
            E('p', {style:'color:#94a3b8'}, 'Configure bandwidth limits based on time of day.'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;margin-top:20px'}, [
                E('div', {style:'display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:20px'}, 
                    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(d,i) {
                        return E('div', {style:'text-align:center;padding:8px;border-radius:6px;background:'+(i<5?'#7c3aed20;color:#a855f7':'#33415520;color:#64748b')}, d);
                    })
                ),
                E('div', {style:'display:flex;align-items:center;gap:16px;padding:16px;background:#0f172a;border-radius:8px'}, [
                    E('span', {style:'font-size:24px'}, '🌙'),
                    E('div', {style:'flex:1'}, [
                        E('div', {style:'font-weight:600;color:#f1f5f9'}, 'Peak Hours'),
                        E('div', {style:'color:#94a3b8;font-size:13px'}, '18:00 - 23:00 (Mon-Fri)')
                    ]),
                    E('span', {style:'padding:4px 12px;border-radius:6px;background:#f59e0b20;color:#f59e0b;font-weight:600'}, '80% limit')
                ])
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
