'use strict';
'require baseclass';
'require rpc';

/**
 * Traffic Shaper API Client
 * Handles all RPC calls to the traffic-shaper backend
 */

// Version: 0.4.0

var callStatus = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'status',
	expect: { }
});

var callListClasses = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'list_classes',
	expect: { classes: [] }
});

var callAddClass = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'add_class',
	params: ['name', 'priority', 'rate', 'ceil', 'interface'],
	expect: { success: false }
});

var callUpdateClass = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'update_class',
	params: ['id', 'name', 'priority', 'rate', 'ceil', 'interface', 'enabled'],
	expect: { success: false }
});

var callDeleteClass = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'delete_class',
	params: ['id'],
	expect: { success: false }
});

var callListRules = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'list_rules',
	expect: { rules: [] }
});

var callAddRule = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'add_rule',
	params: ['class', 'match_type', 'match_value'],
	expect: { success: false }
});

var callDeleteRule = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'delete_rule',
	params: ['id'],
	expect: { success: false }
});

var callGetStats = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'get_stats',
	expect: { stats: [] }
});

var callApplyPreset = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'apply_preset',
	params: ['preset'],
	expect: { success: false }
});

var callListPresets = rpc.declare({
	object: 'luci.traffic-shaper',
	method: 'list_presets',
	expect: { presets: [] }
});

return baseclass.extend({
	getStatus: function() {
		return L.resolveDefault(callStatus(), {});
	},

	listClasses: function() {
		return L.resolveDefault(callListClasses(), { classes: [] });
	},

	addClass: function(name, priority, rate, ceil, iface) {
		return callAddClass(name, priority || 5, rate || '1mbit', ceil || '10mbit', iface || 'wan');
	},

	updateClass: function(id, name, priority, rate, ceil, iface, enabled) {
		return callUpdateClass(id, name, priority, rate, ceil, iface, enabled);
	},

	deleteClass: function(id) {
		return callDeleteClass(id);
	},

	listRules: function() {
		return L.resolveDefault(callListRules(), { rules: [] });
	},

	addRule: function(classId, matchType, matchValue) {
		return callAddRule(classId, matchType, matchValue);
	},

	deleteRule: function(id) {
		return callDeleteRule(id);
	},

	getStats: function() {
		return L.resolveDefault(callGetStats(), { stats: [] });
	},

	applyPreset: function(preset) {
		return callApplyPreset(preset);
	},

	listPresets: function() {
		return L.resolveDefault(callListPresets(), { presets: [] });
	},

	/**
	 * Format bandwidth value for display
	 */

// Version: 0.4.0
	formatBandwidth: function(value) {
		if (!value) return '0 bit/s';

		var match = value.match(/^(\d+)([kmg]?)bit$/i);
		if (!match) return value;

		var num = parseInt(match[1]);
		var unit = match[2].toLowerCase();

		switch(unit) {
			case 'k': return num + ' Kbit/s';
			case 'm': return num + ' Mbit/s';
			case 'g': return num + ' Gbit/s';
			default: return num + ' bit/s';
		}
	},

	/**
	 * Format bytes for display
	 */

// Version: 0.4.0
	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';

		var units = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(1024));

		return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
	},

	/**
	 * Get priority label
	 */

// Version: 0.4.0
	getPriorityLabel: function(priority) {
		if (priority <= 2) return _('High');
		if (priority <= 4) return _('Medium');
		if (priority <= 6) return _('Normal');
		return _('Low');
	},

	/**
	 * Get priority color class
	 */

// Version: 0.4.0
	getPriorityColor: function(priority) {
		if (priority <= 2) return 'high-priority';
		if (priority <= 4) return 'medium-priority';
		if (priority <= 6) return 'normal-priority';
		return 'low-priority';
	}
});
