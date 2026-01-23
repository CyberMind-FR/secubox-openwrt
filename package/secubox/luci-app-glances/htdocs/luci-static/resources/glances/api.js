'use strict';
'require baseclass';
'require rpc';

var callGetStatus = rpc.declare({
	object: 'luci.glances',
	method: 'get_status'
});

var callGetConfig = rpc.declare({
	object: 'luci.glances',
	method: 'get_config'
});

var callGetMonitoringConfig = rpc.declare({
	object: 'luci.glances',
	method: 'get_monitoring_config'
});

var callGetAlertsConfig = rpc.declare({
	object: 'luci.glances',
	method: 'get_alerts_config'
});

var callGetWebUrl = rpc.declare({
	object: 'luci.glances',
	method: 'get_web_url'
});

var callServiceStart = rpc.declare({
	object: 'luci.glances',
	method: 'service_start'
});

var callServiceStop = rpc.declare({
	object: 'luci.glances',
	method: 'service_stop'
});

var callServiceRestart = rpc.declare({
	object: 'luci.glances',
	method: 'service_restart'
});

var callSetConfig = rpc.declare({
	object: 'luci.glances',
	method: 'set_config',
	params: ['key', 'value']
});

return baseclass.extend({
	getStatus: function() {
		return callGetStatus().catch(function() {
			return { running: false, enabled: false };
		});
	},

	getConfig: function() {
		return callGetConfig().catch(function() {
			return {};
		});
	},

	getMonitoringConfig: function() {
		return callGetMonitoringConfig().catch(function() {
			return {};
		});
	},

	getAlertsConfig: function() {
		return callGetAlertsConfig().catch(function() {
			return {};
		});
	},

	getWebUrl: function() {
		return callGetWebUrl().catch(function() {
			return { web_url: '' };
		});
	},

	serviceStart: function() {
		return callServiceStart();
	},

	serviceStop: function() {
		return callServiceStop();
	},

	serviceRestart: function() {
		return callServiceRestart();
	},

	setConfig: function(key, value) {
		return callSetConfig(key, value);
	},

	getAllData: function() {
		var self = this;
		return Promise.all([
			self.getStatus(),
			self.getConfig(),
			self.getMonitoringConfig(),
			self.getAlertsConfig()
		]).then(function(results) {
			return {
				status: results[0],
				config: results[1],
				monitoring: results[2],
				alerts: results[3]
			};
		});
	}
});
