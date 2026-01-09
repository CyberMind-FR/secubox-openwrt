'use strict';
'require view';
'require ui';
'require poll';
'require rpc';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';
'require secubox-portal/header as SbHeader';

// Load theme resources
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));

var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

/**
 * SecuBox Development Status View (LuCI)
 * Real-time development progress tracker for LuCI interface
 */
return view.extend({
	statusData: {},
	// Development milestones data
	milestones: {
		'modules-core': {
			name: _('Core Modules'),
			progress: 100,
			total: 13,
			completed: 13,
			icon: '📦',
			color: '#10b981',
			items: [
				{ name: 'Bandwidth Manager', status: 'completed' },
				{ name: 'Auth Guardian', status: 'completed' },
				{ name: 'Media Flow', status: 'completed' },
				{ name: 'VHost Manager', status: 'completed' },
				{ name: 'CrowdSec Dashboard', status: 'completed' },
				{ name: 'WireGuard Dashboard', status: 'completed' },
				{ name: 'Netdata Dashboard', status: 'completed' },
				{ name: 'Netifyd Dashboard', status: 'completed' },
				{ name: 'Client Guardian', status: 'completed' },
				{ name: 'Network Modes', status: 'completed' },
				{ name: 'Traffic Shaper', status: 'completed' },
				{ name: 'CDN Cache', status: 'completed' },
				{ name: 'SecuBox Hub', status: 'completed' }
			]
		},
		'hardware-support': {
			name: _('Hardware Support'),
			progress: 95,
			total: 4,
			completed: 3,
			icon: '🔧',
			color: '#f59e0b',
			items: [
				{ name: 'ESPRESSObin Ultra', status: 'completed' },
				{ name: 'Sheeva64 (WiFi 6)', status: 'completed' },
				{ name: 'MOCHAbin (10GbE)', status: 'completed' },
				{ name: 'Performance Optimization', status: 'in-progress' }
			]
		},
		'integration': {
			name: _('Integration & Testing'),
			progress: 85,
			total: 6,
			completed: 5,
			icon: '🧪',
			color: '#3b82f6',
			items: [
				{ name: 'LuCI Integration', status: 'completed' },
				{ name: 'RPCD Backends', status: 'completed' },
				{ name: 'ubus APIs', status: 'completed' },
				{ name: 'Multi-platform Build', status: 'completed' },
				{ name: 'Documentation', status: 'completed' },
				{ name: 'Beta Testing Program', status: 'in-progress' }
			]
		},
		'campaign-prep': {
			name: _('Campaign Preparation'),
			progress: 70,
			total: 5,
			completed: 3,
			icon: '🚀',
			color: '#8b5cf6',
			items: [
				{ name: 'Website Multi-language', status: 'completed' },
				{ name: 'Demo Pages', status: 'completed' },
				{ name: 'Video Tutorials', status: 'in-progress' },
				{ name: 'Marketing Materials', status: 'in-progress' },
				{ name: 'Crowdfunding Setup', status: 'planned' }
			]
		}
	},

	// Timeline data
	timeline: [
		{
			phase: _('Phase 1'),
			name: _('Core Development'),
			period: 'Q4 2024 - Q1 2025',
			status: 'completed',
			progress: 100
		},
		{
			phase: _('Phase 2'),
			name: _('Advanced Modules'),
			period: 'Q1 - Q2 2025',
			status: 'completed',
			progress: 100
		},
		{
			phase: _('Phase 3'),
			name: _('Hardware Integration'),
			period: 'Q2 - Q4 2025',
			status: 'in-progress',
			progress: 95
		},
		{
			phase: _('Phase 4'),
			name: _('Beta Testing'),
			period: 'Q1 2026',
			status: 'in-progress',
			progress: 40
		},
		{
			phase: _('Phase 5'),
			name: _('Crowdfunding Campaign'),
			period: 'Q2 2026',
			status: 'planned',
			progress: 20
		},
		{
			phase: _('Phase 6'),
			name: _('Production & Delivery'),
			period: 'Q3 - Q4 2026',
			status: 'planned',
			progress: 0
		}
	],

	// Project statistics
	stats: {
		modulesCount: 13,
		languagesSupported: 11,
		architectures: 4,
		linesOfCode: 15000,
		contributors: 3,
		commits: 450,
		openIssues: 12,
		closedIssues: 87
	},

	/**
	 * Calculate overall progress
	 */
	getOverallProgress: function() {
		var milestones = Object.values(this.milestones);
		var totalProgress = 0;
		for (var i = 0; i < milestones.length; i++) {
			totalProgress += milestones[i].progress;
		}
		return Math.round(totalProgress / milestones.length);
	},

	/**
	 * Get status icon
	 */
	getStatusIcon: function(status) {
		var icons = {
			'completed': '✅',
			'in-progress': '🔄',
			'planned': '📋'
		};
		return icons[status] || '⚪';
	},

	/**
	 * Render milestone card
	 */
	renderMilestone: function(key, milestone) {
		var items = milestone.items.map(function(item) {
			var statusClass = 'dsw-item-' + item.status;
			return E('div', { 'class': 'dsw-item ' + statusClass }, [
				E('span', { 'class': 'dsw-item-icon' }, this.getStatusIcon(item.status)),
				E('span', { 'class': 'dsw-item-name' }, item.name)
			]);
		}.bind(this));

		return E('div', { 'class': 'cbi-section', 'data-key': key }, [
			E('div', { 'class': 'dsw-milestone-header' }, [
				E('div', { 'class': 'dsw-milestone-info' }, [
					E('span', { 'class': 'dsw-milestone-icon' }, milestone.icon),
					E('span', { 'class': 'dsw-milestone-name' }, milestone.name)
				]),
				E('div', { 'class': 'dsw-milestone-stats' }, [
					E('span', { 'class': 'dsw-milestone-count' },
						milestone.completed + '/' + milestone.total),
					E('span', { 'class': 'dsw-milestone-percent' },
						{ 'style': 'color: ' + milestone.color },
						milestone.progress + '%')
				])
			]),
			E('div', { 'class': 'cbi-progressbar', 'title': milestone.progress + '%' }, [
				E('div', {
					'style': 'width: ' + milestone.progress + '%; background: ' + milestone.color
				})
			]),
			E('div', { 'class': 'dsw-milestone-items' }, items)
		]);
	},

	/**
	 * Render timeline item
	 */
	renderTimelineItem: function(phase, index, total) {
		var statusClass = 'dsw-timeline-' + phase.status;
		var showLine = index < total - 1;

		return E('div', { 'class': 'dsw-timeline-item ' + statusClass }, [
			E('div', { 'class': 'dsw-timeline-marker' }, [
				E('div', { 'class': 'dsw-timeline-dot' }),
				showLine ? E('div', { 'class': 'dsw-timeline-line' }) : null
			]),
			E('div', { 'class': 'dsw-timeline-content' }, [
				E('div', { 'class': 'dsw-timeline-header' }, [
					E('span', { 'class': 'dsw-timeline-phase' }, phase.phase),
					E('span', { 'class': 'dsw-timeline-period' }, phase.period)
				]),
				E('div', { 'class': 'dsw-timeline-name' }, phase.name),
				E('div', { 'class': 'cbi-progressbar', 'title': phase.progress + '%' }, [
					E('div', { 'style': 'width: ' + phase.progress + '%' })
				])
			])
		]);
	},

	/**
	 * Render statistics grid
	 */
	renderStats: function() {
		return E('div', { 'class': 'dsw-stats-grid' }, [
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.modulesCount)),
				E('div', { 'class': 'dsw-stat-label' }, _('Modules'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.languagesSupported)),
				E('div', { 'class': 'dsw-stat-label' }, _('Languages'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.architectures)),
				E('div', { 'class': 'dsw-stat-label' }, _('Architectures'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, (this.stats.linesOfCode / 1000).toFixed(1) + 'k'),
				E('div', { 'class': 'dsw-stat-label' }, _('Lines of Code'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.contributors)),
				E('div', { 'class': 'dsw-stat-label' }, _('Contributors'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.commits)),
				E('div', { 'class': 'dsw-stat-label' }, _('Commits'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.openIssues)),
				E('div', { 'class': 'dsw-stat-label' }, _('Open Issues'))
			]),
			E('div', { 'class': 'dsw-stat' }, [
				E('div', { 'class': 'dsw-stat-value' }, String(this.stats.closedIssues)),
				E('div', { 'class': 'dsw-stat-label' }, _('Closed Issues'))
			])
		]);
	},

	/**
	 * Load view
	 */
	load: function() {
		var self = this;
		return API.getStatus().then(function(status) {
			self.statusData = status || {};
			return status;
		});
	},

	/**
	 * Render view
	 */
	render: function() {
		var overallProgress = this.getOverallProgress();

		// Render milestones
		var milestones = [];
		for (var key in this.milestones) {
			milestones.push(this.renderMilestone(key, this.milestones[key]));
		}

		// Render timeline
		var timelineItems = [];
		for (var i = 0; i < this.timeline.length; i++) {
			timelineItems.push(
				this.renderTimelineItem(this.timeline[i], i, this.timeline.length)
			);
		}

		var main = E('div', { 'class': 'secubox-dev-body' }, [
			E('h2', { 'class': 'section-title' }, _('Development Status')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Real-time project progress tracker showing SecuBox development milestones and achievements.')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'dsw-header' }, [
					E('div', { 'class': 'dsw-overall-badge' }, [
						E('div', { 'class': 'dsw-progress-value' }, overallProgress + '%'),
						E('div', { 'class': 'dsw-progress-label' }, _('Overall Progress'))
					])
				])
			]),

			E('fieldset', { 'class': 'cbi-section' }, [
				E('legend', {}, _('Development Milestones')),
				E('div', { 'class': 'dsw-milestones-grid' }, milestones)
			]),

			E('fieldset', { 'class': 'cbi-section' }, [
				E('legend', {}, _('Project Timeline')),
				E('div', { 'class': 'dsw-timeline-container' }, timelineItems)
			]),

			E('fieldset', { 'class': 'cbi-section' }, [
				E('legend', {}, _('Project Statistics')),
				this.renderStats()
			]),

			E('style', {}, `
				.dsw-header {
					text-align: center;
					padding: 20px;
					margin-bottom: 20px;
				}

				.dsw-overall-badge {
					display: inline-block;
					background: linear-gradient(135deg, #10b981, #06b6d4);
					padding: 24px 48px;
					border-radius: 12px;
					color: white;
				}

				.dsw-progress-value {
					font-size: 48px;
					font-weight: 800;
					line-height: 1;
				}

				.dsw-progress-label {
					font-size: 14px;
					opacity: 0.9;
					margin-top: 8px;
				}

				.dsw-milestone-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 12px;
				}

				.dsw-milestone-info {
					display: flex;
					align-items: center;
					gap: 10px;
				}

				.dsw-milestone-icon {
					font-size: 24px;
				}

				.dsw-milestone-name {
					font-size: 16px;
					font-weight: 700;
				}

				.dsw-milestone-stats {
					display: flex;
					align-items: center;
					gap: 12px;
					font-size: 14px;
				}

				.dsw-milestone-count {
					opacity: 0.7;
				}

				.dsw-milestone-percent {
					font-weight: 700;
				}

				.dsw-milestone-items {
					display: flex;
					flex-direction: column;
					gap: 8px;
					margin-top: 12px;
				}

				.dsw-item {
					display: flex;
					align-items: center;
					gap: 8px;
					font-size: 13px;
					padding: 6px 0;
				}

				.dsw-item-icon {
					font-size: 14px;
				}

				.dsw-item-completed {
					opacity: 0.7;
				}

				.dsw-item-in-progress {
					color: #f59e0b;
				}

				.dsw-item-planned {
					opacity: 0.5;
				}

				.dsw-milestones-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 16px;
				}

				.dsw-timeline-container {
					display: flex;
					flex-direction: column;
					gap: 0;
				}

				.dsw-timeline-item {
					display: flex;
					gap: 20px;
				}

				.dsw-timeline-marker {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding-top: 8px;
				}

				.dsw-timeline-dot {
					width: 16px;
					height: 16px;
					border-radius: 50%;
					background: #ccc;
					z-index: 1;
				}

				.dsw-timeline-completed .dsw-timeline-dot {
					background: #10b981;
				}

				.dsw-timeline-in-progress .dsw-timeline-dot {
					background: #f59e0b;
					animation: pulse 2s infinite;
				}

				.dsw-timeline-line {
					width: 2px;
					flex: 1;
					background: #ccc;
					margin-top: 4px;
				}

				.dsw-timeline-completed .dsw-timeline-line {
					background: #10b981;
				}

				.dsw-timeline-content {
					flex: 1;
					padding-bottom: 24px;
				}

				.dsw-timeline-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 8px;
				}

				.dsw-timeline-phase {
					font-size: 12px;
					font-weight: 700;
					color: #06b6d4;
					text-transform: uppercase;
				}

				.dsw-timeline-period {
					font-size: 12px;
					opacity: 0.7;
				}

				.dsw-timeline-name {
					font-size: 16px;
					font-weight: 600;
					margin-bottom: 8px;
				}

				.dsw-stats-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
					gap: 16px;
				}

				.dsw-stat {
					text-align: center;
					padding: 20px;
					background: rgba(16, 185, 129, 0.1);
					border-radius: 8px;
				}

				.dsw-stat-value {
					font-size: 32px;
					font-weight: 800;
					color: #10b981;
					margin-bottom: 4px;
				}

				.dsw-stat-label {
					font-size: 12px;
					opacity: 0.7;
				}

				@keyframes pulse {
					0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
					50% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
				}
			`)
		]);

		var container = E('div', { 'class': 'secubox-dev-status-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			SecuNav.renderTabs('dev-status'),
			this.renderHeader(),
			main
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	renderHeader: function() {
		var widget = this.getWidget();
		var currentPhase = widget.getCurrentPhase() || {};
		var status = this.statusData || {};

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🚀'),
					_('Development Status')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('SecuBox roadmap, milestones, and release planning.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip('🏷️', _('Version'), status.version || _('Unknown')),
				this.renderHeaderChip('📈', _('Overall'), this.getOverallProgress() + '%'),
				this.renderHeaderChip('📅', _('Current phase'),
					currentPhase.phase ? currentPhase.phase + ' · ' + currentPhase.name : _('Not set'))
			])
		]);
	},

	renderHeaderChip: function(icon, label, value) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value.toString())
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
