'use strict';
'require baseclass';

/**
 * SecuBox State Management Utilities
 * Helper functions for state validation, formatting, and visualization
 */

// State configuration with colors, icons, and labels
var STATE_CONFIG = {
	available: {
		color: '#6b7280',
		icon: '○',
		label: 'Available',
		category: 'persistent',
		description: 'Component is available for installation'
	},
	installing: {
		color: '#3b82f6',
		icon: '⏳',
		label: 'Installing',
		category: 'transient',
		description: 'Installation in progress'
	},
	installed: {
		color: '#8b5cf6',
		icon: '✓',
		label: 'Installed',
		category: 'persistent',
		description: 'Component is installed but not active'
	},
	configuring: {
		color: '#3b82f6',
		icon: '⚙',
		label: 'Configuring',
		category: 'transient',
		description: 'Configuration in progress'
	},
	configured: {
		color: '#8b5cf6',
		icon: '✓',
		label: 'Configured',
		category: 'transient',
		description: 'Configuration completed'
	},
	activating: {
		color: '#3b82f6',
		icon: '↗',
		label: 'Activating',
		category: 'transient',
		description: 'Activation in progress'
	},
	active: {
		color: '#06b6d4',
		icon: '●',
		label: 'Active',
		category: 'persistent',
		description: 'Component is active but not running'
	},
	starting: {
		color: '#3b82f6',
		icon: '▶',
		label: 'Starting',
		category: 'transient',
		description: 'Service is starting'
	},
	running: {
		color: '#10b981',
		icon: '▶',
		label: 'Running',
		category: 'runtime',
		description: 'Service is running'
	},
	stopping: {
		color: '#f59e0b',
		icon: '⏸',
		label: 'Stopping',
		category: 'transient',
		description: 'Service is stopping'
	},
	stopped: {
		color: '#6b7280',
		icon: '⏹',
		label: 'Stopped',
		category: 'runtime',
		description: 'Service is stopped'
	},
	error: {
		color: '#ef4444',
		icon: '✗',
		label: 'Error',
		category: 'error',
		description: 'Component encountered an error'
	},
	frozen: {
		color: '#06b6d4',
		icon: '❄',
		label: 'Frozen',
		category: 'persistent',
		description: 'Component is frozen (locked)'
	},
	disabled: {
		color: '#9ca3af',
		icon: '⊘',
		label: 'Disabled',
		category: 'persistent',
		description: 'Component is disabled'
	},
	uninstalling: {
		color: '#f59e0b',
		icon: '⏳',
		label: 'Uninstalling',
		category: 'transient',
		description: 'Uninstallation in progress'
	}
};

// State transition matrix
var STATE_TRANSITIONS = {
	available: ['installing'],
	installing: ['installed', 'error'],
	installed: ['configuring', 'uninstalling'],
	configuring: ['configured', 'error'],
	configured: ['activating', 'disabled'],
	activating: ['active', 'error'],
	active: ['starting', 'disabled', 'frozen'],
	starting: ['running', 'error'],
	running: ['stopping', 'error', 'frozen'],
	stopping: ['stopped', 'error'],
	stopped: ['starting', 'disabled', 'uninstalling'],
	error: ['available', 'installed', 'stopped'],
	frozen: ['active'],
	disabled: ['active', 'uninstalling'],
	uninstalling: ['available', 'error']
};

return baseclass.extend({
	/**
	 * Get state configuration
	 * @param {string} state - State name
	 * @returns {Object} State configuration
	 */
	getStateConfig: function(state) {
		return STATE_CONFIG[state] || {
			color: '#6b7280',
			icon: '?',
			label: state || 'Unknown',
			category: 'unknown',
			description: 'Unknown state'
		};
	},

	/**
	 * Get state color
	 * @param {string} state - State name
	 * @returns {string} CSS color value
	 */
	getStateColor: function(state) {
		var config = this.getStateConfig(state);
		return config.color;
	},

	/**
	 * Get state icon
	 * @param {string} state - State name
	 * @returns {string} Icon character
	 */
	getStateIcon: function(state) {
		var config = this.getStateConfig(state);
		return config.icon;
	},

	/**
	 * Get state label
	 * @param {string} state - State name
	 * @returns {string} Human-readable label
	 */
	getStateLabel: function(state) {
		var config = this.getStateConfig(state);
		return config.label;
	},

	/**
	 * Get state category
	 * @param {string} state - State name
	 * @returns {string} Category (persistent, transient, runtime, error, unknown)
	 */
	getStateCategory: function(state) {
		var config = this.getStateConfig(state);
		return config.category;
	},

	/**
	 * Check if transition is valid
	 * @param {string} fromState - Current state
	 * @param {string} toState - Target state
	 * @returns {boolean} True if transition is allowed
	 */
	canTransition: function(fromState, toState) {
		var allowedTransitions = STATE_TRANSITIONS[fromState];
		if (!allowedTransitions) {
			return false;
		}
		return allowedTransitions.indexOf(toState) !== -1;
	},

	/**
	 * Get allowed next states
	 * @param {string} currentState - Current state
	 * @returns {Array<string>} Array of allowed next states
	 */
	getNextStates: function(currentState) {
		return STATE_TRANSITIONS[currentState] || [];
	},

	/**
	 * Get all available states
	 * @returns {Array<string>} Array of all state names
	 */
	getAllStates: function() {
		return Object.keys(STATE_CONFIG);
	},

	/**
	 * Format state history entry
	 * @param {Object} historyEntry - History entry object
	 * @returns {string} Formatted history string
	 */
	formatHistoryEntry: function(historyEntry) {
		if (!historyEntry) {
			return '';
		}

		var state = historyEntry.state || 'unknown';
		var timestamp = historyEntry.timestamp || '';
		var reason = historyEntry.reason || 'unknown';

		var date = timestamp ? new Date(timestamp) : null;
		var timeStr = date ? date.toLocaleString() : timestamp;

		return timeStr + ' - ' + this.getStateLabel(state) + ' (' + reason + ')';
	},

	/**
	 * Format timestamp
	 * @param {string} timestamp - ISO timestamp
	 * @returns {string} Formatted timestamp
	 */
	formatTimestamp: function(timestamp) {
		if (!timestamp) {
			return 'N/A';
		}

		try {
			var date = new Date(timestamp);
			return date.toLocaleString();
		} catch (e) {
			return timestamp;
		}
	},

	/**
	 * Get time ago string
	 * @param {string} timestamp - ISO timestamp
	 * @returns {string} Relative time string (e.g., "5 minutes ago")
	 */
	getTimeAgo: function(timestamp) {
		if (!timestamp) {
			return 'never';
		}

		try {
			var date = new Date(timestamp);
			var now = new Date();
			var seconds = Math.floor((now - date) / 1000);

			if (seconds < 60) {
				return seconds + ' second' + (seconds !== 1 ? 's' : '') + ' ago';
			}

			var minutes = Math.floor(seconds / 60);
			if (minutes < 60) {
				return minutes + ' minute' + (minutes !== 1 ? 's' : '') + ' ago';
			}

			var hours = Math.floor(minutes / 60);
			if (hours < 24) {
				return hours + ' hour' + (hours !== 1 ? 's' : '') + ' ago';
			}

			var days = Math.floor(hours / 24);
			if (days < 30) {
				return days + ' day' + (days !== 1 ? 's' : '') + ' ago';
			}

			var months = Math.floor(days / 30);
			return months + ' month' + (months !== 1 ? 's' : '') + ' ago';
		} catch (e) {
			return 'unknown';
		}
	},

	/**
	 * Check if state is transient
	 * @param {string} state - State name
	 * @returns {boolean} True if state is transient
	 */
	isTransient: function(state) {
		return this.getStateCategory(state) === 'transient';
	},

	/**
	 * Check if state is error
	 * @param {string} state - State name
	 * @returns {boolean} True if state is error
	 */
	isError: function(state) {
		return this.getStateCategory(state) === 'error';
	},

	/**
	 * Check if state is running
	 * @param {string} state - State name
	 * @returns {boolean} True if state is running
	 */
	isRunning: function(state) {
		return state === 'running';
	},

	/**
	 * Check if state is frozen
	 * @param {string} state - State name
	 * @returns {boolean} True if state is frozen
	 */
	isFrozen: function(state) {
		return state === 'frozen';
	},

	/**
	 * Get CSS class for state
	 * @param {string} state - State name
	 * @returns {string} CSS class name
	 */
	getStateClass: function(state) {
		return 'state-' + (state || 'unknown');
	},

	/**
	 * Get badge CSS classes
	 * @param {string} state - State name
	 * @returns {string} Space-separated CSS classes
	 */
	getBadgeClasses: function(state) {
		var classes = ['cyber-badge', 'state-badge', this.getStateClass(state)];

		var category = this.getStateCategory(state);
		if (category) {
			classes.push('state-category-' + category);
		}

		return classes.join(' ');
	},

	/**
	 * Filter states by category
	 * @param {string} category - Category name
	 * @returns {Array<string>} Array of state names in category
	 */
	getStatesByCategory: function(category) {
		var states = [];
		var allStates = this.getAllStates();

		for (var i = 0; i < allStates.length; i++) {
			if (this.getStateCategory(allStates[i]) === category) {
				states.push(allStates[i]);
			}
		}

		return states;
	},

	/**
	 * Get state statistics from component list
	 * @param {Array<Object>} components - Array of components with state
	 * @returns {Object} State distribution statistics
	 */
	getStateStatistics: function(components) {
		var stats = {
			total: components ? components.length : 0,
			by_state: {},
			by_category: {
				persistent: 0,
				transient: 0,
				runtime: 0,
				error: 0,
				unknown: 0
			}
		};

		if (!components || !components.length) {
			return stats;
		}

		for (var i = 0; i < components.length; i++) {
			var state = components[i].current_state || components[i].state || 'unknown';

			// Count by state
			if (!stats.by_state[state]) {
				stats.by_state[state] = 0;
			}
			stats.by_state[state]++;

			// Count by category
			var category = this.getStateCategory(state);
			if (stats.by_category[category] !== undefined) {
				stats.by_category[category]++;
			}
		}

		return stats;
	},

	/**
	 * Sort components by state priority
	 * @param {Array<Object>} components - Array of components
	 * @returns {Array<Object>} Sorted components
	 */
	sortByStatePriority: function(components) {
		if (!components || !components.length) {
			return components;
		}

		var priorities = {
			error: 1,
			frozen: 2,
			running: 3,
			starting: 4,
			stopping: 5,
			active: 6,
			stopped: 7,
			installed: 8,
			installing: 9,
			disabled: 10,
			available: 11
		};

		return components.slice().sort(function(a, b) {
			var stateA = a.current_state || a.state || 'unknown';
			var stateB = b.current_state || b.state || 'unknown';

			var priorityA = priorities[stateA] || 99;
			var priorityB = priorities[stateB] || 99;

			return priorityA - priorityB;
		});
	}
});
