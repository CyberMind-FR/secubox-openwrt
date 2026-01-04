'use strict';
'require baseclass';

function ensureArray(value) {
	if (!value) {
		return [];
	}

	if (Array.isArray(value)) {
		return value.filter(function(item) { return item !== null && item !== undefined; });
	}

	return [value];
}

function normalizeApps(data) {
	if (!data) {
		return [];
	}

	if (Array.isArray(data)) {
		return data;
	}

	if (Array.isArray(data.apps)) {
		return data.apps;
	}

	if (Array.isArray(data.list)) {
		return data.list;
	}

	return ensureArray(data.apps).concat(ensureArray(data.list)).filter(Boolean);
}

function normalizeModules(data) {
	var list = [];

	if (!data) {
		return { __list: list };
	}

	if (Array.isArray(data)) {
		list = data;
	} else if (Array.isArray(data.modules)) {
		list = data.modules;
	} else if (typeof data === 'object') {
		Object.keys(data).forEach(function(key) {
			if (Array.isArray(data[key])) {
				list = list.concat(data[key]);
			} else if (data[key] && typeof data[key] === 'object') {
				var entry = Object.assign({ _key: key }, data[key]);
				list.push(entry);
			}
		});
	}

	var map = {};

	list.forEach(function(entry) {
		if (!entry || typeof entry !== 'object') {
			return;
		}

		var keys = [
			entry.pkg,
			entry.package,
			entry.pkg_name,
			entry.id,
			entry.name,
			entry._key
		];

		keys.forEach(function(key) {
			if (key && !map[key]) {
				map[key] = entry;
			}
		});
	});

	map.__list = list;

	return map;
}

function normalizeUpdates(data) {
	if (!data) {
		return { updates: [], total_updates_available: 0, cache_ready: false };
	}

	var updates = [];
	if (Array.isArray(data.updates)) {
		updates = data.updates;
	} else if (Array.isArray(data)) {
		updates = data;
	}

	return {
		updates: updates,
		total_updates_available: data.total_updates_available || updates.length || 0,
		cache_ready: data.cache_ready || false,
		cache_warning: data.cache_warning || false,
		message: data.message || ''
	};
}

function normalizeSources(data) {
	if (!data) {
		return [];
	}

	if (Array.isArray(data)) {
		return data;
	}

	if (Array.isArray(data.sources)) {
		return data.sources;
	}

	if (typeof data.sources === 'object') {
		return Object.keys(data.sources).map(function(key) {
			return data.sources[key];
		});
	}

	if (Array.isArray(data.list)) {
		return data.list;
	}

	return [];
}

function normalizeAlerts(data) {
	if (!data) {
		return [];
	}

	if (Array.isArray(data)) {
		return data;
	}

	if (Array.isArray(data.alerts)) {
		return data.alerts;
	}

	return [];
}

function buildAppStats(apps, modulesMap, alerts, updateInfo, statusResolver) {
	var stats = {
		totalApps: apps.length,
		installedCount: 0,
		runningCount: 0,
		alertCount: alerts ? alerts.length : 0,
		updateCount: updateInfo ? (updateInfo.total_updates_available || 0) : 0,
		widgetCount: 0
	};

	var resolveStatus = typeof statusResolver === 'function' ? statusResolver : function() { return {}; };

	apps.forEach(function(app) {
		var status = resolveStatus(app, modulesMap) || {};
		if (status.installed) {
			stats.installedCount++;
		}
		if (status.running) {
			stats.runningCount++;
		}
		if (app.widget && app.widget.enabled) {
			stats.widgetCount++;
		}
	});

	return stats;
}

return baseclass.extend({
	normalizeApps: normalizeApps,
	normalizeModules: normalizeModules,
	normalizeUpdates: normalizeUpdates,
	normalizeSources: normalizeSources,
	normalizeAlerts: normalizeAlerts,
	ensureArray: ensureArray,
	buildAppStats: buildAppStats
});
