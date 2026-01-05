'use strict';
'require baseclass';
'require secubox-admin.state-utils as stateUtils';
'require secubox-admin.components.StateIndicator as StateIndicator';

/**
 * StateTimeline Component
 * Visualizes state history as a timeline with transitions and events
 */

return baseclass.extend({
	/**
	 * Render a state history timeline
	 * @param {Array<Object>} history - Array of history entries
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	render: function(history, options) {
		options = options || {};

		if (!history || history.length === 0) {
			return E('div', {
				'class': 'state-timeline-empty',
				'style': 'padding: 2rem; text-align: center; color: #6b7280;'
			}, 'No state history available');
		}

		var container = E('div', {
			'class': 'state-timeline',
			'style': 'position: relative; padding-left: 2rem;'
		});

		// Vertical timeline line
		var timelineLine = E('div', {
			'class': 'timeline-line',
			'style': 'position: absolute; left: 0.5rem; top: 0; bottom: 0; width: 2px; background-color: #e5e7eb;'
		});
		container.appendChild(timelineLine);

		// Render history entries
		var sortedHistory = this._sortHistory(history, options.sortOrder || 'desc');
		var limit = options.limit || sortedHistory.length;

		for (var i = 0; i < Math.min(limit, sortedHistory.length); i++) {
			var entry = sortedHistory[i];
			var timelineEntry = this._renderTimelineEntry(entry, i, options);
			container.appendChild(timelineEntry);
		}

		// "Show more" button if limited
		if (limit < sortedHistory.length && options.onShowMore) {
			var showMoreBtn = E('button', {
				'class': 'btn btn-sm timeline-show-more',
				'style': 'margin-left: 2rem; margin-top: 1rem;'
			}, 'Show ' + (sortedHistory.length - limit) + ' more...');

			showMoreBtn.addEventListener('click', function() {
				options.onShowMore();
			});

			container.appendChild(showMoreBtn);
		}

		return container;
	},

	/**
	 * Render a compact timeline (inline)
	 * @param {Array<Object>} history - Array of history entries
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderCompact: function(history, options) {
		options = options || {};

		if (!history || history.length === 0) {
			return E('span', { 'style': 'color: #6b7280; font-size: 0.875rem;' }, 'No history');
		}

		var container = E('div', {
			'class': 'state-timeline-compact',
			'style': 'display: flex; align-items: center; gap: 0.25rem;'
		});

		var sortedHistory = this._sortHistory(history, 'desc');
		var limit = options.limit || 5;

		for (var i = 0; i < Math.min(limit, sortedHistory.length); i++) {
			var entry = sortedHistory[i];
			var stateIndicator = StateIndicator.renderDot(entry.state, {
				size: '0.625rem',
				customTooltip: stateUtils.formatHistoryEntry(entry)
			});
			container.appendChild(stateIndicator);
		}

		// More indicator
		if (sortedHistory.length > limit) {
			var moreIndicator = E('span', {
				'style': 'font-size: 0.75rem; color: #6b7280; margin-left: 0.25rem;'
			}, '+' + (sortedHistory.length - limit));
			container.appendChild(moreIndicator);
		}

		return container;
	},

	/**
	 * Render a horizontal timeline (for state transitions)
	 * @param {Array<Object>} history - Array of history entries
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderHorizontal: function(history, options) {
		options = options || {};

		if (!history || history.length === 0) {
			return E('div', {
				'class': 'state-timeline-empty',
				'style': 'padding: 1rem; text-align: center; color: #6b7280;'
			}, 'No transitions');
		}

		var container = E('div', {
			'class': 'state-timeline-horizontal',
			'style': 'display: flex; align-items: center; gap: 0.5rem; overflow-x: auto; padding: 1rem 0;'
		});

		var sortedHistory = this._sortHistory(history, 'asc');
		var limit = options.limit || sortedHistory.length;

		for (var i = 0; i < Math.min(limit, sortedHistory.length); i++) {
			var entry = sortedHistory[i];
			var config = stateUtils.getStateConfig(entry.state);

			// State node
			var node = E('div', {
				'class': 'timeline-node',
				'style': 'display: flex; flex-direction: column; align-items: center; min-width: 80px;'
			});

			// Icon
			var icon = StateIndicator.renderCompact(entry.state);
			node.appendChild(icon);

			// Label
			var label = E('div', {
				'style': 'font-size: 0.75rem; margin-top: 0.25rem; color: ' + config.color + '; font-weight: 600; text-align: center;'
			}, config.label);
			node.appendChild(label);

			// Time
			if (entry.timestamp) {
				var time = E('div', {
					'style': 'font-size: 0.625rem; color: #6b7280; margin-top: 0.125rem; text-align: center;'
				}, stateUtils.getTimeAgo(entry.timestamp));
				node.appendChild(time);
			}

			container.appendChild(node);

			// Arrow connector (except for last)
			if (i < Math.min(limit, sortedHistory.length) - 1) {
				var arrow = E('div', {
					'class': 'timeline-arrow',
					'style': 'font-size: 1.25rem; color: #9ca3af; margin: 0 0.5rem;'
				}, '→');
				container.appendChild(arrow);
			}
		}

		return container;
	},

	/**
	 * Render timeline entry (for vertical timeline)
	 * @private
	 */
	_renderTimelineEntry: function(entry, index, options) {
		var config = stateUtils.getStateConfig(entry.state);
		var isError = stateUtils.isError(entry.state);
		var isTransient = stateUtils.isTransient(entry.state);

		var entryContainer = E('div', {
			'class': 'timeline-entry' + (isError ? ' timeline-entry-error' : '') + (isTransient ? ' timeline-entry-transient' : ''),
			'style': 'position: relative; margin-bottom: 1.5rem;'
		});

		// Timeline dot
		var dot = E('div', {
			'class': 'timeline-dot',
			'style': 'position: absolute; left: -1.75rem; top: 0.25rem; width: 1rem; height: 1rem; border-radius: 50%; background-color: ' + config.color + '; border: 3px solid #ffffff; z-index: 10;'
		});

		if (isTransient) {
			dot.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
		}

		entryContainer.appendChild(dot);

		// Entry content
		var content = E('div', {
			'class': 'timeline-content',
			'style': 'padding: 0.75rem; border-radius: 0.5rem; background-color: ' + config.color + '10; border-left: 3px solid ' + config.color + ';'
		});

		// Header (state + timestamp)
		var header = E('div', {
			'class': 'timeline-header',
			'style': 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;'
		});

		var stateInfo = E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem;' });
		var stateBadge = StateIndicator.render(entry.state, { showIcon: true, showLabel: true, animate: false });
		stateInfo.appendChild(stateBadge);

		// Category badge
		if (options.showCategory !== false) {
			var categoryBadge = E('span', {
				'class': 'badge badge-secondary',
				'style': 'font-size: 0.625rem; padding: 0.125rem 0.375rem; background-color: #f3f4f6; color: #6b7280;'
			}, config.category);
			stateInfo.appendChild(categoryBadge);
		}

		header.appendChild(stateInfo);

		// Timestamp
		if (entry.timestamp) {
			var timestamp = E('div', {
				'class': 'timeline-timestamp',
				'style': 'font-size: 0.75rem; color: #6b7280;'
			});

			if (options.showRelativeTime !== false) {
				timestamp.textContent = stateUtils.getTimeAgo(entry.timestamp);
				timestamp.setAttribute('title', stateUtils.formatTimestamp(entry.timestamp));
			} else {
				timestamp.textContent = stateUtils.formatTimestamp(entry.timestamp);
			}

			header.appendChild(timestamp);
		}

		content.appendChild(header);

		// Reason
		if (entry.reason) {
			var reason = E('div', {
				'class': 'timeline-reason',
				'style': 'font-size: 0.875rem; color: #4b5563; margin-bottom: 0.25rem;'
			}, 'Reason: ' + this._formatReason(entry.reason));
			content.appendChild(reason);
		}

		// Error details
		if (isError && entry.error_details) {
			var errorDetails = E('div', {
				'class': 'timeline-error-details',
				'style': 'margin-top: 0.5rem; padding: 0.5rem; background-color: #fee2e2; border-radius: 0.375rem; border-left: 3px solid #ef4444;'
			});

			if (entry.error_details.type) {
				var errorType = E('div', {
					'style': 'font-size: 0.75rem; font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;'
				}, 'Error Type: ' + entry.error_details.type);
				errorDetails.appendChild(errorType);
			}

			if (entry.error_details.message) {
				var errorMsg = E('div', {
					'style': 'font-size: 0.75rem; color: #991b1b;'
				}, entry.error_details.message);
				errorDetails.appendChild(errorMsg);
			}

			if (entry.error_details.code) {
				var errorCode = E('div', {
					'style': 'font-size: 0.625rem; color: #7f1d1d; margin-top: 0.25rem; font-family: monospace;'
				}, 'Code: ' + entry.error_details.code);
				errorDetails.appendChild(errorCode);
			}

			content.appendChild(errorDetails);
		}

		// Metadata
		if (options.showMetadata !== false && entry.metadata) {
			var metadata = E('div', {
				'class': 'timeline-metadata',
				'style': 'margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid ' + config.color + '30; font-size: 0.75rem; color: #6b7280;'
			});

			var metadataEntries = Object.entries(entry.metadata);
			for (var i = 0; i < metadataEntries.length; i++) {
				var key = metadataEntries[i][0];
				var value = metadataEntries[i][1];
				var metaItem = E('div', {}, key + ': ' + value);
				metadata.appendChild(metaItem);
			}

			content.appendChild(metadata);
		}

		// Actions
		if (options.onEntryClick) {
			content.style.cursor = 'pointer';
			content.addEventListener('click', function() {
				options.onEntryClick(entry, index);
			});
		}

		entryContainer.appendChild(content);

		return entryContainer;
	},

	/**
	 * Sort history entries
	 * @private
	 */
	_sortHistory: function(history, order) {
		var sorted = history.slice();

		sorted.sort(function(a, b) {
			var timeA = new Date(a.timestamp || 0).getTime();
			var timeB = new Date(b.timestamp || 0).getTime();

			return order === 'asc' ? timeA - timeB : timeB - timeA;
		});

		return sorted;
	},

	/**
	 * Format reason string
	 * @private
	 */
	_formatReason: function(reason) {
		if (!reason) {
			return 'Unknown';
		}

		// Convert snake_case to Title Case
		return reason
			.split('_')
			.map(function(word) {
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(' ');
	},

	/**
	 * Render a state transition diagram
	 * @param {string} currentState - Current state
	 * @param {Object} options - Display options
	 * @returns {Element} DOM element
	 */
	renderTransitionDiagram: function(currentState, options) {
		options = options || {};

		var container = E('div', {
			'class': 'state-transition-diagram',
			'style': 'padding: 1rem;'
		});

		// Current state (center)
		var currentStateEl = E('div', {
			'style': 'text-align: center; margin-bottom: 1.5rem;'
		});

		var currentLabel = E('div', {
			'style': 'font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;'
		}, 'Current State:');
		currentStateEl.appendChild(currentLabel);

		var currentBadge = StateIndicator.renderPill(currentState, {}, { showDescription: true });
		currentStateEl.appendChild(currentBadge);

		container.appendChild(currentStateEl);

		// Possible transitions
		var nextStates = stateUtils.getNextStates(currentState);

		if (nextStates.length > 0) {
			var transitionsLabel = E('div', {
				'style': 'font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem; text-align: center;'
			}, 'Possible Transitions:');
			container.appendChild(transitionsLabel);

			var transitionsGrid = E('div', {
				'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;'
			});

			for (var i = 0; i < nextStates.length; i++) {
				var nextState = nextStates[i];
				var nextConfig = stateUtils.getStateConfig(nextState);

				var transitionCard = E('div', {
					'class': 'transition-card',
					'style': 'padding: 0.75rem; border-radius: 0.5rem; border: 2px solid ' + nextConfig.color + '40; background-color: ' + nextConfig.color + '10; cursor: pointer; transition: all 0.2s;'
				});

				transitionCard.addEventListener('mouseenter', function() {
					this.style.borderColor = nextConfig.color;
					this.style.transform = 'translateY(-2px)';
				});

				transitionCard.addEventListener('mouseleave', function() {
					this.style.borderColor = nextConfig.color + '40';
					this.style.transform = 'translateY(0)';
				});

				// Arrow
				var arrow = E('div', {
					'style': 'text-align: center; font-size: 1.5rem; color: ' + nextConfig.color + '; margin-bottom: 0.5rem;'
				}, '↓');
				transitionCard.appendChild(arrow);

				// State badge
				var badge = StateIndicator.render(nextState, { showIcon: true, showLabel: true });
				badge.style.display = 'flex';
				badge.style.justifyContent = 'center';
				transitionCard.appendChild(badge);

				// Description
				var desc = E('div', {
					'style': 'font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem; text-align: center;'
				}, nextConfig.description);
				transitionCard.appendChild(desc);

				// Click handler
				if (options.onTransitionClick) {
					(function(state) {
						transitionCard.addEventListener('click', function() {
							options.onTransitionClick(currentState, state);
						});
					})(nextState);
				}

				transitionsGrid.appendChild(transitionCard);
			}

			container.appendChild(transitionsGrid);
		} else {
			var noTransitions = E('div', {
				'style': 'text-align: center; padding: 1rem; color: #6b7280; font-size: 0.875rem;'
			}, 'No transitions available from this state');
			container.appendChild(noTransitions);
		}

		return container;
	}
});
