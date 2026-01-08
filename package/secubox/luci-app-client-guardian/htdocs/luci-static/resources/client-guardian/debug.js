'use strict';
'require baseclass';
'require uci';

/**
 * Client Guardian Debug Module
 * Provides comprehensive logging and debugging capabilities
 */

var DEBUG_LEVELS = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3,
	TRACE: 4
};

var DEBUG_COLORS = {
	ERROR: '#ef4444',
	WARN: '#f59e0b',
	INFO: '#3b82f6',
	DEBUG: '#8b5cf6',
	TRACE: '#6b7280'
};

var debugEnabled = false;
var debugLevel = DEBUG_LEVELS.INFO;
var logBuffer = [];
var maxBufferSize = 500;

return baseclass.extend({
	init: function() {
		// Check if debug mode is enabled in UCI
		return uci.load('client-guardian').then(L.bind(function() {
			debugEnabled = uci.get('client-guardian', 'config', 'debug_enabled') === '1';
			var level = uci.get('client-guardian', 'config', 'debug_level') || 'INFO';
			debugLevel = DEBUG_LEVELS[level] || DEBUG_LEVELS.INFO;

			if (debugEnabled) {
				this.info('Client Guardian Debug Mode Enabled', {
					level: level,
					timestamp: new Date().toISOString()
				});
			}
		}, this)).catch(function() {
			// UCI not available, use defaults
			debugEnabled = false;
		});
	},

	isEnabled: function() {
		return debugEnabled;
	},

	setEnabled: function(enabled) {
		debugEnabled = enabled;
		if (enabled) {
			this.info('Debug mode enabled manually');
		}
	},

	setLevel: function(level) {
		if (typeof level === 'string') {
			debugLevel = DEBUG_LEVELS[level.toUpperCase()] || DEBUG_LEVELS.INFO;
		} else {
			debugLevel = level;
		}
		this.info('Debug level changed', { level: debugLevel });
	},

	_log: function(level, levelName, message, data) {
		if (!debugEnabled || level > debugLevel) {
			return;
		}

		var timestamp = new Date().toISOString();
		var logEntry = {
			timestamp: timestamp,
			level: levelName,
			message: message,
			data: data || {}
		};

		// Add to buffer
		logBuffer.push(logEntry);
		if (logBuffer.length > maxBufferSize) {
			logBuffer.shift();
		}

		// Console output with styling
		var style = 'color: ' + DEBUG_COLORS[levelName] + '; font-weight: bold;';
		var prefix = '[CG:' + levelName + ']';

		if (data) {
			console.log('%c' + prefix + ' ' + timestamp, style, message, data);
		} else {
			console.log('%c' + prefix + ' ' + timestamp, style, message);
		}
	},

	error: function(message, data) {
		this._log(DEBUG_LEVELS.ERROR, 'ERROR', message, data);
	},

	warn: function(message, data) {
		this._log(DEBUG_LEVELS.WARN, 'WARN', message, data);
	},

	info: function(message, data) {
		this._log(DEBUG_LEVELS.INFO, 'INFO', message, data);
	},

	debug: function(message, data) {
		this._log(DEBUG_LEVELS.DEBUG, 'DEBUG', message, data);
	},

	trace: function(message, data) {
		this._log(DEBUG_LEVELS.TRACE, 'TRACE', message, data);
	},

	// API call tracing
	traceAPICall: function(method, params) {
		this.debug('API Call: ' + method, {
			params: params,
			stack: new Error().stack
		});
	},

	traceAPIResponse: function(method, response, duration) {
		this.debug('API Response: ' + method, {
			response: response,
			duration: duration + 'ms'
		});
	},

	traceAPIError: function(method, error) {
		this.error('API Error: ' + method, {
			error: error.toString(),
			stack: error.stack
		});
	},

	// UI event tracing
	traceEvent: function(eventName, target, data) {
		this.trace('Event: ' + eventName, {
			target: target,
			data: data
		});
	},

	// Performance monitoring
	startTimer: function(label) {
		if (!debugEnabled) return null;

		var timer = {
			label: label,
			start: performance.now()
		};

		this.trace('Timer started: ' + label);
		return timer;
	},

	endTimer: function(timer) {
		if (!debugEnabled || !timer) return;

		var duration = (performance.now() - timer.start).toFixed(2);
		this.debug('Timer ended: ' + timer.label, {
			duration: duration + 'ms'
		});

		return duration;
	},

	// Get log buffer
	getLogs: function(level, count) {
		var filtered = logBuffer;

		if (level) {
			var levelValue = DEBUG_LEVELS[level.toUpperCase()];
			filtered = logBuffer.filter(function(entry) {
				return DEBUG_LEVELS[entry.level] <= levelValue;
			});
		}

		if (count) {
			filtered = filtered.slice(-count);
		}

		return filtered;
	},

	// Export logs as text
	exportLogs: function() {
		var text = '=== Client Guardian Debug Logs ===\n';
		text += 'Generated: ' + new Date().toISOString() + '\n';
		text += 'Total entries: ' + logBuffer.length + '\n\n';

		logBuffer.forEach(function(entry) {
			text += '[' + entry.timestamp + '] [' + entry.level + '] ' + entry.message;
			if (Object.keys(entry.data).length > 0) {
				text += '\n  Data: ' + JSON.stringify(entry.data, null, 2);
			}
			text += '\n\n';
		});

		return text;
	},

	// Download logs as file
	downloadLogs: function() {
		var text = this.exportLogs();
		var blob = new Blob([text], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'client-guardian-debug-' + Date.now() + '.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		this.info('Logs downloaded');
	},

	// Clear log buffer
	clearLogs: function() {
		logBuffer = [];
		this.info('Log buffer cleared');
	},

	// Get system info for debugging
	getSystemInfo: function() {
		return {
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			language: navigator.language,
			screenResolution: window.screen.width + 'x' + window.screen.height,
			windowSize: window.innerWidth + 'x' + window.innerHeight,
			cookiesEnabled: navigator.cookieEnabled,
			onLine: navigator.onLine,
			timestamp: new Date().toISOString(),
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			memory: performance.memory ? {
				usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
				totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
				jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
			} : 'N/A'
		};
	},

	// Network request monitoring
	monitorFetch: function(originalFetch) {
		if (!debugEnabled) return originalFetch;

		var self = this;
		return function() {
			var args = arguments;
			var url = args[0];
			var timer = self.startTimer('Fetch: ' + url);

			self.trace('Fetch request', {
				url: url,
				options: args[1]
			});

			return originalFetch.apply(this, args).then(function(response) {
				var duration = self.endTimer(timer);
				self.trace('Fetch response', {
					url: url,
					status: response.status,
					statusText: response.statusText,
					duration: duration
				});
				return response;
			}).catch(function(error) {
				self.error('Fetch error', {
					url: url,
					error: error.toString()
				});
				throw error;
			});
		};
	},

	// Initialize global error handler
	setupGlobalErrorHandler: function() {
		var self = this;

		window.addEventListener('error', function(event) {
			self.error('Global error', {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				error: event.error ? event.error.toString() : 'Unknown'
			});
		});

		window.addEventListener('unhandledrejection', function(event) {
			self.error('Unhandled promise rejection', {
				reason: event.reason,
				promise: event.promise
			});
		});

		this.info('Global error handlers registered');
	}
});
