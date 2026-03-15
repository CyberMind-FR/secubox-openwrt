'use strict';
'require rpc';
'require dom';

/**
 * DPI Dual-Stream Widget
 * Embeddable status widget for use in other dashboards
 *
 * Usage:
 *   'require dpi-dual/widget';
 *   widget.render().then(function(el) { container.appendChild(el); });
 */

var callStatus = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'status',
    expect: {}
});

var callGetCorrelationStats = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_correlation_stats',
    expect: {}
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function createLED(running, label) {
    var color = running ? '#00d4aa' : '#ff4d4d';
    return E('div', { 'style': 'display:flex;align-items:center;gap:6px;' }, [
        E('span', {
            'style': 'width:10px;height:10px;border-radius:50%;background:' + color +
                     ';box-shadow:0 0 6px ' + color + ';'
        }),
        E('span', { 'style': 'font-size:0.85rem;color:#e0e0e0;' }, label)
    ]);
}

function createMetric(label, value, color) {
    return E('div', {
        'style': 'text-align:center;min-width:60px;'
    }, [
        E('div', {
            'style': 'font-size:1.2rem;font-weight:700;color:' + (color || '#00d4aa') + ';font-family:monospace;'
        }, String(value)),
        E('div', {
            'style': 'font-size:0.65rem;color:#808090;text-transform:uppercase;'
        }, label)
    ]);
}

return {
    /**
     * Render a compact DPI status widget
     * @returns {Promise<Element>} Widget element
     */
    render: function() {
        return Promise.all([
            callStatus().catch(function() { return {}; }),
            callGetCorrelationStats().catch(function() { return {}; })
        ]).then(function(data) {
            var status = data[0] || {};
            var stats = data[1] || {};

            var mitm = status.mitm_stream || {};
            var tap = status.tap_stream || {};
            var corr = status.correlation || {};

            return E('div', {
                'class': 'dpi-dual-widget',
                'style': 'background:#12121a;border-radius:10px;padding:1rem;border-left:4px solid #00a0ff;'
            }, [
                // Header
                E('div', {
                    'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;'
                }, [
                    E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
                        E('span', { 'style': 'font-size:1.2rem;' }, '📡'),
                        E('span', { 'style': 'font-weight:600;color:#fff;' }, 'DPI Dual-Stream')
                    ]),
                    E('a', {
                        'href': L.url('admin/secubox/dpi-dual'),
                        'style': 'color:#00a0ff;font-size:0.8rem;text-decoration:none;'
                    }, 'Details →')
                ]),

                // Status LEDs
                E('div', {
                    'style': 'display:flex;gap:1rem;margin-bottom:0.8rem;flex-wrap:wrap;'
                }, [
                    createLED(mitm.running, 'MITM'),
                    createLED(tap.running, 'TAP'),
                    createLED(corr.running, 'Correlation')
                ]),

                // Metrics
                E('div', {
                    'style': 'display:flex;gap:1rem;flex-wrap:wrap;background:#1a1a24;padding:0.6rem;border-radius:6px;'
                }, [
                    createMetric('Buffer', mitm.buffer_entries || 0, '#00d4aa'),
                    createMetric('Threats', mitm.threats_detected || 0, '#ffa500'),
                    createMetric('Flows', tap.flows_1min || 0, '#00a0ff'),
                    createMetric('Correlated', stats.total_correlations || 0, '#ff6b6b'),
                    createMetric('Banned', stats.banned_ips || 0, '#ff4d4d')
                ])
            ]);
        });
    },

    /**
     * Render a minimal status line
     * @returns {Promise<Element>} Status line element
     */
    renderCompact: function() {
        return callStatus().then(function(status) {
            var mitm = status.mitm_stream || {};
            var tap = status.tap_stream || {};

            var allRunning = mitm.running && tap.running;
            var color = allRunning ? '#00d4aa' : '#ffa500';

            return E('span', {
                'style': 'display:inline-flex;align-items:center;gap:6px;'
            }, [
                E('span', {
                    'style': 'width:8px;height:8px;border-radius:50%;background:' + color + ';'
                }),
                E('span', {}, 'DPI: ' + (mitm.threats_detected || 0) + ' threats')
            ]);
        });
    },

    /**
     * Get raw status data
     * @returns {Promise<Object>} Status object
     */
    getStatus: function() {
        return callStatus();
    },

    /**
     * Get correlation statistics
     * @returns {Promise<Object>} Stats object
     */
    getStats: function() {
        return callGetCorrelationStats();
    }
};
