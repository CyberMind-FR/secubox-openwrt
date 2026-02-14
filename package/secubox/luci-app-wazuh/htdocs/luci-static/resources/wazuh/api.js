'use strict';
'require rpc';

var callWazuh = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_overview',
    expect: {}
});

var callAgentStatus = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_agent_status',
    expect: {}
});

var callManagerStatus = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_manager_status',
    expect: {}
});

var callGetAlerts = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_alerts',
    params: ['count', 'level'],
    expect: {}
});

var callAlertSummary = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_alert_summary',
    expect: {}
});

var callFIMEvents = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_fim_events',
    params: ['count'],
    expect: {}
});

var callFIMConfig = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_fim_config',
    expect: {}
});

var callListAgents = rpc.declare({
    object: 'luci.wazuh',
    method: 'list_agents',
    expect: {}
});

var callCrowdSecCorrelation = rpc.declare({
    object: 'luci.wazuh',
    method: 'get_crowdsec_correlation',
    expect: {}
});

var callStartAgent = rpc.declare({
    object: 'luci.wazuh',
    method: 'start_agent',
    expect: {}
});

var callStopAgent = rpc.declare({
    object: 'luci.wazuh',
    method: 'stop_agent',
    expect: {}
});

var callRestartAgent = rpc.declare({
    object: 'luci.wazuh',
    method: 'restart_agent',
    expect: {}
});

return L.Class.extend({
    getOverview: function() {
        return callWazuh().then(function(res) {
            return res.result || res;
        });
    },

    getAgentStatus: function() {
        return callAgentStatus().then(function(res) {
            return res.result || res;
        });
    },

    getManagerStatus: function() {
        return callManagerStatus().then(function(res) {
            return res.result || res;
        });
    },

    getAlerts: function(count, level) {
        return callGetAlerts(count || 20, level || 0).then(function(res) {
            return res.result || res;
        });
    },

    getAlertSummary: function() {
        return callAlertSummary().then(function(res) {
            return res.result || res;
        });
    },

    getFIMEvents: function(count) {
        return callFIMEvents(count || 50).then(function(res) {
            return res.result || res;
        });
    },

    getFIMConfig: function() {
        return callFIMConfig().then(function(res) {
            return res.result || res;
        });
    },

    listAgents: function() {
        return callListAgents().then(function(res) {
            return res.result || res;
        });
    },

    getCrowdSecCorrelation: function() {
        return callCrowdSecCorrelation().then(function(res) {
            return res.result || res;
        });
    },

    startAgent: function() {
        return callStartAgent().then(function(res) {
            return res.result || res;
        });
    },

    stopAgent: function() {
        return callStopAgent().then(function(res) {
            return res.result || res;
        });
    },

    restartAgent: function() {
        return callRestartAgent().then(function(res) {
            return res.result || res;
        });
    },

    // Helper to format alert level
    formatLevel: function(level) {
        if (level >= 12) return { text: 'Critical', class: 'danger' };
        if (level >= 9) return { text: 'High', class: 'warning' };
        if (level >= 5) return { text: 'Medium', class: 'notice' };
        return { text: 'Low', class: 'info' };
    },

    // Helper to format timestamp
    formatTime: function(timestamp) {
        if (!timestamp) return '-';
        var d = new Date(timestamp);
        return d.toLocaleString();
    }
});
