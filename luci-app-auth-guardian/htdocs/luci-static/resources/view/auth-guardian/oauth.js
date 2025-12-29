'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require auth-guardian.api as api';

return view.extend({
    load: function() { return api.getOAuthProviders(); },
    render: function(data) {
        var providers = data.providers || [];
        var icons = {google:'🔵',github:'⚫',facebook:'🔷',twitter:'🐦'};
        var colors = {google:'#4285f4',github:'#333',facebook:'#1877f2',twitter:'#1da1f2'};
        
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🔑 OAuth Providers'),
            E('p', {style:'color:#94a3b8;margin-bottom:20px'}, 'Configure third-party authentication providers.'),
            E('div', {style:'display:grid;gap:16px'}, [
                ['google', 'Google', 'Sign in with Google account'],
                ['github', 'GitHub', 'Sign in with GitHub account'],
                ['facebook', 'Facebook', 'Sign in with Facebook account'],
                ['twitter', 'Twitter/X', 'Sign in with Twitter account']
            ].map(function(p) {
                var provider = providers.find(function(x) { return x.id === p[0]; });
                var enabled = provider ? provider.enabled : false;
                return E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;display:flex;align-items:center;gap:16px'}, [
                    E('span', {style:'font-size:32px'}, icons[p[0]] || '🔐'),
                    E('div', {style:'flex:1'}, [
                        E('div', {style:'font-weight:600;color:#f1f5f9;font-size:16px'}, p[1]),
                        E('div', {style:'color:#94a3b8;font-size:13px'}, p[2])
                    ]),
                    E('span', {style:'padding:6px 12px;border-radius:6px;font-weight:600;background:'+(enabled?'#22c55e20;color:#22c55e':'#64748b20;color:#64748b')}, enabled ? 'Enabled' : 'Disabled')
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
