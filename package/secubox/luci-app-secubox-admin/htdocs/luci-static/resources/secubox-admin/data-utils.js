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

function normalizeHealth(data) {
	var normalized = {
		raw: data || {},
		overall: {
			score: 0,
			status: 'unknown'
		},
		uptime: 0,
		load: '0 0 0',
		cpuUsage: 0,
		cpuCount: 0,
		memoryUsage: 0,
		diskUsage: 0,
		memory: {
			totalBytes: 0,
			freeBytes: 0,
			usedBytes: 0
		},
		disk: {
			totalBytes: 0,
			freeBytes: 0,
			usedBytes: 0
		}
	};

	if (!data) {
		return normalized;
	}

	if (typeof data.uptime === 'number') {
		normalized.uptime = data.uptime;
	}

	if (data.overall && typeof data.overall === 'object') {
		normalized.overall.score = data.overall.score || 0;
		normalized.overall.status = data.overall.status || 'unknown';
	}

	var cpuSection = data.cpu;
	if (typeof cpuSection === 'number') {
		normalized.cpuUsage = cpuSection;
	} else if (cpuSection && typeof cpuSection === 'object') {
		normalized.cpuUsage = cpuSection.usage_percent || cpuSection.percent || 0;
		normalized.cpuCount = cpuSection.count || cpuSection.cores || 0;
		normalized.load = cpuSection.load || cpuSection.load_avg || normalized.load;
	}

	var memorySection = data.memory || {};
	var memTotalKb = memorySection.total_kb || data.total_memory || 0;
	var memFreeKb = memorySection.free_kb || data.free_memory || 0;
	var memUsedKb = memorySection.used_kb || (memTotalKb - memFreeKb);
	if (memTotalKb > 0) {
		normalized.memoryUsage = memorySection.usage_percent ||
			Math.round((memUsedKb / memTotalKb) * 100);
	}
	normalized.memory.totalBytes = memTotalKb * 1024;
	normalized.memory.freeBytes = memFreeKb * 1024;
	normalized.memory.usedBytes = memUsedKb * 1024;

	var diskSection = data.disk || {};
	var diskTotalKb = diskSection.total_kb || data.total_disk || 0;
	var diskUsedKb = diskSection.used_kb || data.used_disk || 0;
	var diskFreeKb = diskSection.free_kb || (diskTotalKb - diskUsedKb);
	if (diskTotalKb > 0) {
		normalized.diskUsage = diskSection.usage_percent ||
			Math.round((diskUsedKb / diskTotalKb) * 100);
	}
	normalized.disk.totalBytes = diskTotalKb * 1024;
	normalized.disk.freeBytes = diskFreeKb * 1024;
	normalized.disk.usedBytes = diskUsedKb * 1024;

	return normalized;
}

function extractCategories(data) {
	if (!data || typeof data !== 'object') {
		return {};
	}

	if (data.categories && typeof data.categories === 'object') {
		return data.categories;
	}

	return {};
}

return baseclass.extend({
	normalizeApps: normalizeApps,
	normalizeModules: normalizeModules,
	normalizeUpdates: normalizeUpdates,
	normalizeSources: normalizeSources,
	normalizeAlerts: normalizeAlerts,
	normalizeHealth: normalizeHealth,
	ensureArray: ensureArray,
	buildAppStats: buildAppStats,
	extractCategories: extractCategories
});
