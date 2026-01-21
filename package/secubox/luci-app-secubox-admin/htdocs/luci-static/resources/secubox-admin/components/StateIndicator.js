'use strict';
'require baseclass';
'require secubox-admin/state-utils as stateUtils';

/**
 * StateIndicator Component
 * Reusable component for displaying state badges with icons, colors, and labels
 */

return baseclass.extend({
	/**
	 * Render a state badge
	 * @param {string} state - State name
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	render: function(state, options) {
		options = options || {};

		var config = stateUtils.getStateConfig(state);
		var badgeClasses = stateUtils.getBadgeClasses(state);

		// Create badge container
		var badge = E('span', {
			'class': badgeClasses,
			'data-state': state,
			'data-category': config.category,
			'style': this._getBadgeStyle(config, options)
		});

		// Add icon if enabled (default: true)
		if (options.showIcon !== false) {
			var icon = E('span', {
				'class': 'state-icon',
				'style': 'margin-right: 0.25rem;'
			}, config.icon);
			badge.appendChild(icon);
		}

		// Add label if enabled (default: true)
		if (options.showLabel !== false) {
			var label = E('span', {
				'class': 'state-label'
			}, options.customLabel || config.label);
			badge.appendChild(label);
		}

		// Add tooltip if enabled
		if (options.showTooltip !== false) {
			badge.setAttribute('title', this._getTooltipText(config, options));
		}

		// Add click handler if provided
		if (options.onClick) {
			badge.style.cursor = 'pointer';
			badge.addEventListener('click', function(ev) {
				options.onClick(state, config, ev);
			});
		}

		return badge;
	},

	/**
	 * Render a compact state indicator (icon only)
	 * @param {string} state - State name
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderCompact: function(state, options) {
		options = options || {};
		options.showLabel = false;
		options.showIcon = true;

		var config = stateUtils.getStateConfig(state);
		var indicator = E('span', {
			'class': 'state-indicator-compact',
			'data-state': state,
			'style': 'display: inline-block; width: 1.5rem; height: 1.5rem; line-height: 1.5rem; text-align: center; border-radius: 50%; background-color: ' + config.color + '20; color: ' + config.color + '; font-size: 0.875rem;',
			'title': options.customTooltip || config.description
		}, config.icon);

		if (options.onClick) {
			indicator.style.cursor = 'pointer';
			indicator.addEventListener('click', function(ev) {
				options.onClick(state, config, ev);
			});
		}

		return indicator;
	},

	/**
	 * Render a state pill with full details
	 * @param {string} state - State name
	 * @param {Object} metadata - Additional metadata to display
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderPill: function(state, metadata, options) {
		options = options || {};
		metadata = metadata || {};

		var config = stateUtils.getStateConfig(state);

		var pill = E('div', {
			'class': 'state-pill ' + stateUtils.getStateClass(state),
			'style': 'display: inline-flex; align-items: center; padding: 0.5rem 0.75rem; border-radius: 9999px; border: 2px solid ' + config.color + '; background-color: ' + config.color + '10;'
		});

		// Icon
		var icon = E('span', {
			'class': 'state-pill-icon',
			'style': 'font-size: 1.25rem; margin-right: 0.5rem; color: ' + config.color + ';'
		}, config.icon);
		pill.appendChild(icon);

		// Content
		var content = E('div', { 'class': 'state-pill-content' });

		// Label
		var label = E('div', {
			'class': 'state-pill-label',
			'style': 'font-weight: 600; color: ' + config.color + '; font-size: 0.875rem;'
		}, config.label);
		content.appendChild(label);

		// Description or metadata
		if (metadata.timestamp) {
			var timeAgo = stateUtils.getTimeAgo(metadata.timestamp);
			var time = E('div', {
				'class': 'state-pill-time',
				'style': 'font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem;'
			}, timeAgo);
			content.appendChild(time);
		} else if (options.showDescription !== false) {
			var desc = E('div', {
				'class': 'state-pill-description',
				'style': 'font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem;'
			}, config.description);
			content.appendChild(desc);
		}

		pill.appendChild(content);

		// Action button if provided
		if (options.action) {
			var actionBtn = E('button', {
				'class': 'btn btn-sm',
				'style': 'margin-left: 0.75rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;'
			}, options.action.label || 'Action');

			actionBtn.addEventListener('click', function(ev) {
				ev.stopPropagation();
				options.action.onClick(state, config, metadata);
			});

			pill.appendChild(actionBtn);
		}

		return pill;
	},

	/**
	 * Render a state dot (minimal indicator)
	 * @param {string} state - State name
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderDot: function(state, options) {
		options = options || {};
		var config = stateUtils.getStateConfig(state);

		var size = options.size || '0.75rem';
		var dot = E('span', {
			'class': 'state-dot',
			'data-state': state,
			'style': 'display: inline-block; width: ' + size + '; height: ' + size + '; border-radius: 50%; background-color: ' + config.color + ';',
			'title': options.customTooltip || config.label
		});

		// Pulsing animation for transient states
		if (stateUtils.isTransient(state)) {
			dot.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
		}

		return dot;
	},

	/**
	 * Render a state progress bar
	 * @param {string} currentState - Current state
	 * @param {Array<string>} stateSequence - Ordered sequence of states
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderProgress: function(currentState, stateSequence, options) {
		options = options || {};

		var container = E('div', {
			'class': 'state-progress',
			'style': 'display: flex; align-items: center; gap: 0.5rem;'
		});

		var currentIndex = stateSequence.indexOf(currentState);

		for (var i = 0; i < stateSequence.length; i++) {
			var state = stateSequence[i];
			var config = stateUtils.getStateConfig(state);
			var isActive = i === currentIndex;
			var isComplete = i < currentIndex;

			// Step indicator
			var step = E('div', {
				'class': 'state-progress-step' + (isActive ? ' active' : '') + (isComplete ? ' complete' : ''),
				'style': 'display: flex; flex-direction: column; align-items: center; flex: 1;'
			});

			// Step icon/number
			var stepIcon = E('div', {
				'class': 'state-progress-icon',
				'style': 'width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid ' + (isActive || isComplete ? config.color : '#d1d5db') + '; background-color: ' + (isActive || isComplete ? config.color : '#ffffff') + '; color: ' + (isActive || isComplete ? '#ffffff' : '#6b7280') + '; font-weight: 600;'
			}, isComplete ? '✓' : config.icon);
			step.appendChild(stepIcon);

			// Step label
			var stepLabel = E('div', {
				'class': 'state-progress-label',
				'style': 'margin-top: 0.25rem; font-size: 0.75rem; color: ' + (isActive ? config.color : '#6b7280') + '; font-weight: ' + (isActive ? '600' : '400') + ';'
			}, config.label);
			step.appendChild(stepLabel);

			container.appendChild(step);

			// Connector line (except for last step)
			if (i < stateSequence.length - 1) {
				var connector = E('div', {
					'class': 'state-progress-connector',
					'style': 'flex: 1; height: 2px; background-color: ' + (isComplete ? config.color : '#d1d5db') + '; margin-bottom: 1.5rem;'
				});
				container.appendChild(connector);
			}
		}

		return container;
	},

	/**
	 * Render state statistics summary
	 * @param {Object} statistics - State statistics from stateUtils.getStateStatistics()
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderStatistics: function(statistics, options) {
		options = options || {};

		var container = E('div', {
			'class': 'state-statistics',
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;'
		});

		// Get states sorted by count
		var stateEntries = Object.entries(statistics.by_state || {}).sort(function(a, b) {
			return b[1] - a[1];
		});

		for (var i = 0; i < stateEntries.length; i++) {
			var state = stateEntries[i][0];
			var count = stateEntries[i][1];
			var config = stateUtils.getStateConfig(state);

			var card = E('div', {
				'class': 'state-stat-card',
				'style': 'padding: 1rem; border-radius: 0.5rem; border-left: 4px solid ' + config.color + '; background-color: ' + config.color + '10;'
			});

			// Count
			var countEl = E('div', {
				'class': 'state-stat-count',
				'style': 'font-size: 1.5rem; font-weight: 700; color: ' + config.color + ';'
			}, String(count));
			card.appendChild(countEl);

			// Label
			var labelEl = E('div', {
				'class': 'state-stat-label',
				'style': 'font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;'
			}, config.label);
			card.appendChild(labelEl);

			container.appendChild(card);
		}

		return container;
	},

	/**
	 * Get badge style
	 * @private
	 */
	_getBadgeStyle: function(config, options) {
		var styles = [
			'display: inline-flex',
			'align-items: center',
			'padding: 0.25rem 0.5rem',
			'border-radius: 0.375rem',
			'font-size: 0.75rem',
			'font-weight: 600',
			'color: ' + config.color,
			'background-color: ' + config.color + '20',
			'border: 1px solid ' + config.color + '40'
		];

		// Add pulsing animation for transient states
		if (stateUtils.isTransient(config.state) && options.animate !== false) {
			styles.push('animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite');
		}

		// Custom styles
		if (options.customStyle) {
			styles.push(options.customStyle);
		}

		return styles.join('; ') + ';';
	},

	/**
	 * Get tooltip text
	 * @private
	 */
	_getTooltipText: function(config, options) {
		if (options.customTooltip) {
			return options.customTooltip;
		}

		var parts = [config.description];

		if (options.metadata) {
			if (options.metadata.timestamp) {
				parts.push('Since: ' + stateUtils.formatTimestamp(options.metadata.timestamp));
			}
			if (options.metadata.reason) {
				parts.push('Reason: ' + options.metadata.reason);
			}
		}

		return parts.join('\n');
	}
});
