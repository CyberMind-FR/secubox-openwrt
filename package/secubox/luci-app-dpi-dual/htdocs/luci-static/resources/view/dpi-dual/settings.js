'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';

var callStatus = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'status',
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('dpi-dual'),
            callStatus().catch(function() { return {}; })
        ]);
    },

    render: function(data) {
        var status = data[1] || {};
        var m, s, o;

        m = new form.Map('dpi-dual', 'DPI Dual-Stream Settings',
            'Configure the dual-stream deep packet inspection architecture. ' +
            'MITM stream provides active inspection with SSL termination, ' +
            'while TAP stream offers passive analysis with zero latency impact.');

        // Status section (read-only)
        s = m.section(form.NamedSection, 'settings', 'global', 'Current Status');
        s.anonymous = true;

        o = s.option(form.DummyValue, '_status', 'Service Status');
        o.rawhtml = true;
        o.cfgvalue = function() {
            var mitm = status.mitm_stream || {};
            var tap = status.tap_stream || {};
            var corr = status.correlation || {};

            var mitmColor = mitm.running ? '#00d4aa' : '#ff4d4d';
            var tapColor = tap.running ? '#00d4aa' : '#ff4d4d';
            var corrColor = corr.running ? '#00d4aa' : '#ff4d4d';

            var lan = status.lan_passive || {};
            var lanColor = lan.running ? '#00d4aa' : '#ff4d4d';

            return '<div style="display:flex;gap:2rem;flex-wrap:wrap;">' +
                '<div><span style="color:' + mitmColor + ';font-weight:600;">●</span> MITM: ' +
                    (mitm.running ? 'Running' : 'Stopped') + '</div>' +
                '<div><span style="color:' + tapColor + ';font-weight:600;">●</span> TAP: ' +
                    (tap.running ? 'Running' : 'Stopped') + '</div>' +
                '<div><span style="color:' + corrColor + ';font-weight:600;">●</span> Correlation: ' +
                    (corr.running ? 'Running' : 'Stopped') + '</div>' +
                '<div><span style="color:' + lanColor + ';font-weight:600;">●</span> LAN: ' +
                    (lan.running ? 'Running' : 'Stopped') + '</div>' +
                '</div>';
        };

        // Global settings
        s = m.section(form.NamedSection, 'settings', 'global', 'Global Settings');
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', 'Enable DPI',
            'Master switch for the dual-stream DPI system');
        o.default = '1';
        o.rmempty = false;

        o = s.option(form.ListValue, 'mode', 'Operating Mode',
            'Select which streams to activate');
        o.value('dual', 'Dual Stream (MITM + TAP)');
        o.value('mitm-only', 'MITM Only (Active inspection)');
        o.value('tap-only', 'TAP Only (Passive analysis)');
        o.default = 'dual';

        o = s.option(form.Flag, 'correlation', 'Enable Correlation',
            'Match events from both streams for unified threat analytics');
        o.default = '1';

        o = s.option(form.Value, 'stats_dir', 'Stats Directory',
            'Directory for statistics and cache files');
        o.default = '/tmp/secubox';
        o.placeholder = '/tmp/secubox';

        o = s.option(form.Value, 'flow_dir', 'Flow Directory',
            'Directory for netifyd flow files');
        o.default = '/tmp/dpi-flows';
        o.placeholder = '/tmp/dpi-flows';

        // MITM settings
        s = m.section(form.NamedSection, 'mitm', 'mitm', 'MITM Stream Settings');
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', 'Enable MITM Stream',
            'Active inspection with SSL termination via mitmproxy');
        o.default = '1';

        o = s.option(form.Value, 'buffer_size', 'Buffer Size',
            'Number of requests to keep in the double buffer');
        o.default = '1000';
        o.datatype = 'uinteger';
        o.placeholder = '1000';

        o = s.option(form.Flag, 'async_analysis', 'Async Analysis',
            'Enable asynchronous threat analysis (non-blocking)');
        o.default = '1';

        o = s.option(form.Flag, 'replay_on_alert', 'Replay on Alert',
            'Replay buffered requests when CrowdSec alert is triggered');
        o.default = '1';

        o = s.option(form.Value, 'buffer_dir', 'Buffer Directory',
            'Directory for request buffer files');
        o.default = '/tmp/dpi-buffer';
        o.placeholder = '/tmp/dpi-buffer';

        // TAP settings
        s = m.section(form.NamedSection, 'tap', 'tap', 'TAP Stream Settings');
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', 'Enable TAP Stream',
            'Passive traffic analysis via port mirroring');
        o.default = '1';

        o = s.option(form.Value, 'interface', 'TAP Interface',
            'Virtual interface for mirrored traffic');
        o.default = 'tap0';
        o.placeholder = 'tap0';

        o = s.option(form.Value, 'mirror_source', 'Mirror Source',
            'Interface to mirror traffic from (usually WAN)');
        o.default = 'eth0';
        o.placeholder = 'eth0';

        o = s.option(form.ListValue, 'mirror_mode', 'Mirror Mode',
            'How to capture traffic for analysis');
        o.value('software', 'Software (tc mirred)');
        o.value('hardware', 'Hardware (switch port mirror)');
        o.default = 'software';

        o = s.option(form.Value, 'flow_retention', 'Flow Retention (seconds)',
            'How long to keep flow files before cleanup');
        o.default = '300';
        o.datatype = 'uinteger';
        o.placeholder = '300';

        o = s.option(form.Value, 'netifyd_instance', 'Netifyd Instance',
            'Name of the netifyd instance for this TAP');
        o.default = 'tap';
        o.placeholder = 'tap';

        // Correlation settings
        s = m.section(form.NamedSection, 'correlation', 'correlation', 'Correlation Engine Settings');
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', 'Enable Correlation',
            'Match events across MITM and TAP streams');
        o.default = '1';

        o = s.option(form.Value, 'window', 'Correlation Window (seconds)',
            'Time window for matching related events');
        o.default = '60';
        o.datatype = 'uinteger';
        o.placeholder = '60';

        o = s.option(form.Flag, 'watch_crowdsec', 'Watch CrowdSec',
            'Monitor CrowdSec decisions for correlation');
        o.default = '1';

        o = s.option(form.Flag, 'auto_ban', 'Auto-Ban',
            'Automatically ban IPs exceeding reputation threshold');
        o.default = '0';

        o = s.option(form.Value, 'auto_ban_threshold', 'Auto-Ban Threshold',
            'Reputation score threshold for automatic banning (0-100)');
        o.default = '80';
        o.datatype = 'range(0,100)';
        o.placeholder = '80';
        o.depends('auto_ban', '1');

        o = s.option(form.Flag, 'notifications', 'Enable Notifications',
            'Send notifications for high-severity threats');
        o.default = '1';

        o = s.option(form.Value, 'reputation_decay', 'Reputation Decay',
            'Points to decay from reputation score per hour');
        o.default = '5';
        o.datatype = 'uinteger';
        o.placeholder = '5';

        o = s.option(form.Value, 'output', 'Correlation Output',
            'File path for correlated threats log');
        o.default = '/tmp/secubox/correlated-threats.json';
        o.placeholder = '/tmp/secubox/correlated-threats.json';

        // LAN Passive Analysis settings
        s = m.section(form.NamedSection, 'lan', 'lan', 'LAN Passive Flow Analysis');
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', 'Enable LAN Analysis',
            'Real-time passive flow monitoring on LAN bridge - No MITM, no caching');
        o.default = '1';

        o = s.option(form.Value, 'interface', 'LAN Interface',
            'Bridge interface to monitor (typically br-lan)');
        o.default = 'br-lan';
        o.placeholder = 'br-lan';

        o = s.option(form.Flag, 'realtime', 'Real-time Mode',
            'Process flows in real-time (vs batch)');
        o.default = '1';

        o = s.option(form.Flag, 'track_clients', 'Track Clients',
            'Track per-client traffic statistics');
        o.default = '1';

        o = s.option(form.Flag, 'track_destinations', 'Track Destinations',
            'Track external destinations accessed by LAN clients');
        o.default = '1';

        o = s.option(form.Flag, 'track_protocols', 'Track Protocols',
            'Track protocol and application usage');
        o.default = '1';

        o = s.option(form.Value, 'aggregate_interval', 'Aggregate Interval (seconds)',
            'How often to aggregate statistics');
        o.default = '5';
        o.datatype = 'uinteger';
        o.placeholder = '5';

        o = s.option(form.Value, 'client_retention', 'Client Retention (seconds)',
            'How long to keep client data after last activity');
        o.default = '3600';
        o.datatype = 'uinteger';
        o.placeholder = '3600';

        o = s.option(form.Value, 'netifyd_instance', 'Netifyd Instance',
            'Name of the netifyd instance for LAN monitoring');
        o.default = 'lan';
        o.placeholder = 'lan';

        return m.render();
    }
});
