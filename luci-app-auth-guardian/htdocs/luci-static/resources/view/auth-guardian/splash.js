'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';

return view.extend({
    render: function() {
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🎨 Splash Page Editor'),
            E('p', {style:'color:#94a3b8'}, 'Customize the captive portal splash page appearance.'),
            E('div', {style:'display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px'}, [
                E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                    E('h3', {style:'color:#f1f5f9;margin-bottom:16px'}, 'Settings'),
                    E('div', {style:'margin-bottom:12px'}, [
                        E('label', {style:'display:block;color:#94a3b8;font-size:13px;margin-bottom:4px'}, 'Title'),
                        E('input', {type:'text',value:'Welcome',style:'width:100%;padding:8px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9'})
                    ]),
                    E('div', {style:'margin-bottom:12px'}, [
                        E('label', {style:'display:block;color:#94a3b8;font-size:13px;margin-bottom:4px'}, 'Message'),
                        E('textarea', {style:'width:100%;padding:8px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;height:80px'}, 'Please authenticate to access the network')
                    ]),
                    E('div', {style:'margin-bottom:12px'}, [
                        E('label', {style:'display:block;color:#94a3b8;font-size:13px;margin-bottom:4px'}, 'Button Color'),
                        E('input', {type:'color',value:'#3b82f6',style:'width:60px;height:32px;border:none;border-radius:6px;cursor:pointer'})
                    ])
                ]),
                E('div', {style:'background:#0f172a;padding:40px;border-radius:12px;text-align:center'}, [
                    E('h2', {style:'color:#f1f5f9;margin-bottom:8px'}, 'Welcome'),
                    E('p', {style:'color:#94a3b8;margin-bottom:24px'}, 'Please authenticate to access the network'),
                    E('button', {style:'background:#3b82f6;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-weight:600;cursor:pointer'}, 'Connect'),
                    E('p', {style:'color:#64748b;font-size:12px;margin-top:16px'}, 'Preview')
                ])
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
