'use strict';
'require baseclass';
/**
 * SecuBox Development Status Widget
 * Real-time development progress tracker
 */

return baseclass.extend({
	// Development milestones and progress
	milestones: {
		'modules-core': {
			name: 'Core Modules',
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
			name: 'Hardware Support',
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
			name: 'Integration & Testing',
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
			name: 'Campaign Preparation',
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

	// Overall project statistics
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

	// Timeline data
	timeline: [
		{
			phase: 'Phase 1',
			name: 'Core Development',
			period: 'Q4 2024 - Q1 2025',
			status: 'completed',
			progress: 100
		},
		{
			phase: 'Phase 2',
			name: 'Advanced Modules',
			period: 'Q1 - Q2 2025',
			status: 'completed',
			progress: 100
		},
		{
			phase: 'Phase 3',
			name: 'Hardware Integration',
			period: 'Q2 - Q4 2025',
			status: 'in-progress',
			progress: 95
		},
		{
			phase: 'Phase 4',
			name: 'Beta Testing',
			period: 'Q1 2026',
			status: 'in-progress',
			progress: 40
		},
		{
			phase: 'Phase 5',
			name: 'Crowdfunding Campaign',
			period: 'Q2 2026',
			status: 'planned',
			progress: 20
		},
		{
			phase: 'Phase 6',
			name: 'Production & Delivery',
			period: 'Q3 - Q4 2026',
			status: 'planned',
			progress: 0
		}
	],

	/**
	 * Calculate overall progress
	 */
	getOverallProgress() {
		const milestones = Object.values(this.milestones);
		const totalProgress = milestones.reduce((sum, m) => sum + m.progress, 0);
		return Math.round(totalProgress / milestones.length);
	},

	/**
	 * Get current phase
	 */
	getCurrentPhase() {
		return this.timeline.find(p => p.status === 'in-progress') || this.timeline[0];
	},

	/**
	 * Render the widget
	 */
	render(containerId) {
		const container = document.getElementById(containerId);
		if (!container) {
			console.error(`Container #${containerId} not found`);
			return;
		}

		const overallProgress = this.getOverallProgress();
		const currentPhase = this.getCurrentPhase();

		container.innerHTML = `
            <div class="dev-status-widget">
                ${this.renderHeader(overallProgress, currentPhase)}
                ${this.renderMilestones()}
                ${this.renderTimeline()}
                ${this.renderStats()}
            </div>
        `;

		this.addStyles();
		this.animateProgressBars();
	},

	/**
	 * Render header section
	 */
	renderHeader(progress, phase) {
		return `
            <div class="dsw-header">
                <div class="dsw-header-content">
                    <h3 class="dsw-title">🚀 Development Status</h3>
                    <p class="dsw-subtitle">Real-time project progress tracker</p>
                </div>
                <div class="dsw-overall-progress">
                    <div class="dsw-progress-circle" data-progress="${progress}">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle class="dsw-progress-bg" cx="60" cy="60" r="54" />
                            <circle class="dsw-progress-bar" cx="60" cy="60" r="54"
                                    style="stroke-dashoffset: ${339 - (339 * progress / 100)}" />
                        </svg>
                        <div class="dsw-progress-value">${progress}%</div>
                    </div>
                    <div class="dsw-current-phase">
                        <div class="dsw-phase-label">Current Phase</div>
                        <div class="dsw-phase-name">${phase.phase}: ${phase.name}</div>
                        <div class="dsw-phase-period">${phase.period}</div>
                    </div>
                </div>
            </div>
        `;
	},

	/**
	 * Render milestones section
	 */
	renderMilestones() {
		const milestonesHtml = Object.entries(this.milestones).map(([key, milestone]) => `
            <div class="dsw-milestone" data-key="${key}">
                <div class="dsw-milestone-header">
                    <div class="dsw-milestone-info">
                        <span class="dsw-milestone-icon">${milestone.icon}</span>
                        <span class="dsw-milestone-name">${milestone.name}</span>
                    </div>
                    <div class="dsw-milestone-stats">
                        <span class="dsw-milestone-count">${milestone.completed}/${milestone.total}</span>
                        <span class="dsw-milestone-percent" style="color: ${milestone.color}">${milestone.progress}%</span>
                    </div>
                </div>
                <div class="dsw-progress-bar-container">
                    <div class="dsw-progress-bar-fill" data-progress="${milestone.progress}"
                         style="background: ${milestone.color}"></div>
                </div>
                <div class="dsw-milestone-items">
                    ${milestone.items.map(item => `
                        <div class="dsw-item dsw-item-${item.status}">
                            <span class="dsw-item-icon">${this.getStatusIcon(item.status)}</span>
                            <span class="dsw-item-name">${item.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

		return `
            <div class="dsw-milestones">
                <h4 class="dsw-section-title">Development Milestones</h4>
                <div class="dsw-milestones-grid">
                    ${milestonesHtml}
                </div>
            </div>
        `;
	},

	/**
	 * Render timeline section
	 */
	renderTimeline() {
		const timelineHtml = this.timeline.map((phase, index) => `
            <div class="dsw-timeline-item dsw-timeline-${phase.status}">
                <div class="dsw-timeline-marker">
                    <div class="dsw-timeline-dot"></div>
                    ${index < this.timeline.length - 1 ? '<div class="dsw-timeline-line"></div>' : ''}
                </div>
                <div class="dsw-timeline-content">
                    <div class="dsw-timeline-header">
                        <span class="dsw-timeline-phase">${phase.phase}</span>
                        <span class="dsw-timeline-period">${phase.period}</span>
                    </div>
                    <div class="dsw-timeline-name">${phase.name}</div>
                    <div class="dsw-timeline-progress">
                        <div class="dsw-timeline-progress-bar">
                            <div class="dsw-timeline-progress-fill" data-progress="${phase.progress}"></div>
                        </div>
                        <span class="dsw-timeline-progress-text">${phase.progress}%</span>
                    </div>
                </div>
            </div>
        `).join('');

		return `
            <div class="dsw-timeline">
                <h4 class="dsw-section-title">Project Timeline</h4>
                <div class="dsw-timeline-container">
                    ${timelineHtml}
                </div>
            </div>
        `;
	},

	/**
	 * Render statistics section
	 */
	renderStats() {
		return `
            <div class="dsw-stats">
                <h4 class="dsw-section-title">Project Statistics</h4>
                <div class="dsw-stats-grid">
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.modulesCount}</div>
                        <div class="dsw-stat-label">Modules</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.languagesSupported}</div>
                        <div class="dsw-stat-label">Languages</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.architectures}</div>
                        <div class="dsw-stat-label">Architectures</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${(this.stats.linesOfCode / 1000).toFixed(1)}k</div>
                        <div class="dsw-stat-label">Lines of Code</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.contributors}</div>
                        <div class="dsw-stat-label">Contributors</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.commits}</div>
                        <div class="dsw-stat-label">Commits</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.openIssues}</div>
                        <div class="dsw-stat-label">Open Issues</div>
                    </div>
                    <div class="dsw-stat">
                        <div class="dsw-stat-value">${this.stats.closedIssues}</div>
                        <div class="dsw-stat-label">Closed Issues</div>
                    </div>
                </div>
            </div>
        `;
	},

	/**
	 * Get status icon
	 */
	getStatusIcon(status) {
		const icons = {
			'completed': '✅',
			'in-progress': '🔄',
			'planned': '📋'
		};
		return icons[status] || '⚪';
	},

	/**
	 * Animate progress bars
	 */
	animateProgressBars() {
		setTimeout(() => {
			document.querySelectorAll('[data-progress]').forEach(element => {
				const progress = element.getAttribute('data-progress');
				if (element.classList.contains('dsw-progress-bar-fill')) {
					element.style.width = `${progress}%`;
				} else if (element.classList.contains('dsw-timeline-progress-fill')) {
					element.style.width = `${progress}%`;
				}
			});
		}, 100);
	},

	/**
	 * Add widget styles
	 */
	addStyles() {
		if (document.getElementById('dev-status-widget-styles')) return;

		const style = document.createElement('style');
		style.id = 'dev-status-widget-styles';
		style.textContent = `
            .dev-status-widget {
                background: var(--sb-bg-card, #1a1a24);
                border: 1px solid var(--sb-border, #2a2a3a);
                border-radius: 20px;
                padding: 32px;
                color: var(--sb-text, #f1f5f9);
            }

            .dsw-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                flex-wrap: wrap;
                gap: 24px;
            }

            .dsw-title {
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #10b981, #06b6d4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .dsw-subtitle {
                color: var(--sb-text-muted, #94a3b8);
                font-size: 14px;
            }

            .dsw-overall-progress {
                display: flex;
                align-items: center;
                gap: 24px;
            }

            .dsw-progress-circle {
                position: relative;
                width: 120px;
                height: 120px;
            }

            .dsw-progress-circle svg {
                transform: rotate(-90deg);
            }

            .dsw-progress-bg {
                fill: none;
                stroke: var(--sb-border, #2a2a3a);
                stroke-width: 8;
            }

            .dsw-progress-bar {
                fill: none;
                stroke: url(#gradient);
                stroke-width: 8;
                stroke-linecap: round;
                stroke-dasharray: 339;
                stroke-dashoffset: 339;
                transition: stroke-dashoffset 1.5s ease-out;
            }

            .dsw-progress-value {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 28px;
                font-weight: 800;
                color: var(--sb-green, #10b981);
            }

            .dsw-current-phase {
                text-align: left;
            }

            .dsw-phase-label {
                font-size: 11px;
                text-transform: uppercase;
                color: var(--sb-text-dim, #64748b);
                font-weight: 600;
                letter-spacing: 1px;
            }

            .dsw-phase-name {
                font-size: 18px;
                font-weight: 700;
                margin: 4px 0;
            }

            .dsw-phase-period {
                font-size: 13px;
                color: var(--sb-cyan, #06b6d4);
                font-family: 'JetBrains Mono', monospace;
            }

            .dsw-section-title {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 20px;
                color: var(--sb-text, #f1f5f9);
            }

            .dsw-milestones {
                margin-bottom: 40px;
            }

            .dsw-milestones-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
            }

            .dsw-milestone {
                background: var(--sb-bg, #0f1019);
                border: 1px solid var(--sb-border, #2a2a3a);
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s;
            }

            .dsw-milestone:hover {
                border-color: var(--sb-cyan, #06b6d4);
                transform: translateY(-2px);
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
                color: var(--sb-text-muted, #94a3b8);
            }

            .dsw-milestone-percent {
                font-weight: 700;
            }

            .dsw-progress-bar-container {
                height: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 999px;
                overflow: hidden;
                margin-bottom: 16px;
            }

            .dsw-progress-bar-fill {
                height: 100%;
                width: 0;
                border-radius: 999px;
                transition: width 1s ease-out;
            }

            .dsw-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.02);
                margin-bottom: 8px;
                border: 1px solid transparent;
                transition: all 0.2s;
            }

            .dsw-item:hover {
                border-color: rgba(255, 255, 255, 0.1);
                transform: translateX(4px);
            }

            .dsw-item.dsw-item-completed {
                border-color: rgba(16, 185, 129, 0.2);
                background: rgba(16, 185, 129, 0.05);
            }

            .dsw-item.dsw-item-in-progress {
                border-color: rgba(245, 158, 11, 0.2);
                background: rgba(245, 158, 11, 0.05);
            }

            .dsw-item.dsw-item-planned {
                border-color: rgba(59, 130, 246, 0.2);
                background: rgba(59, 130, 246, 0.05);
            }

            .dsw-item-icon {
                font-size: 18px;
            }

            .dsw-item-name {
                font-size: 14px;
                font-weight: 600;
            }

            .dsw-timeline {
                margin-bottom: 40px;
            }

            .dsw-timeline-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
            }

            .dsw-timeline-item {
                display: flex;
                gap: 16px;
                padding: 20px;
                background: var(--sb-bg, #0f1019);
                border: 1px solid var(--sb-border, #2a2a3a);
                border-radius: 12px;
            }

            .dsw-timeline-marker {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .dsw-timeline-dot {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 3px solid #10b981;
                background: #1a1a24;
            }

            .dsw-timeline-line {
                flex: 1;
                width: 3px;
                background: linear-gradient(180deg, rgba(16, 185, 129, 0.5), rgba(59, 130, 246, 0.5));
                margin: 8px 0;
            }

            .dsw-timeline-phase {
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                color: var(--sb-text-dim, #64748b);
                letter-spacing: 1px;
            }

            .dsw-timeline-period {
                font-size: 13px;
                color: var(--sb-cyan, #06b6d4);
                font-family: 'JetBrains Mono', monospace;
            }

            .dsw-timeline-name {
                font-size: 16px;
                font-weight: 700;
                margin: 8px 0;
            }

            .dsw-timeline-progress {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .dsw-timeline-progress-bar {
                flex: 1;
                height: 6px;
                background: var(--sb-bg, #0f1019);
                border-radius: 3px;
                overflow: hidden;
            }

            .dsw-timeline-progress-fill {
                height: 100%;
                width: 0;
                background: linear-gradient(90deg, #10b981, #06b6d4);
                border-radius: 3px;
                transition: width 1s ease-out;
            }

            .dsw-timeline-progress-text {
                font-size: 12px;
                font-weight: 600;
                color: var(--sb-text-muted, #94a3b8);
                min-width: 40px;
                text-align: right;
            }

            .dsw-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 16px;
            }

            .dsw-stat {
                background: var(--sb-bg, #0f1019);
                border: 1px solid var(--sb-border, #2a2a3a);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                transition: all 0.2s;
            }

            .dsw-stat:hover {
                border-color: var(--sb-cyan, #06b6d4);
                transform: translateY(-2px);
            }

            .dsw-stat-value {
                font-size: 32px;
                font-weight: 800;
                color: var(--sb-green, #10b981);
                font-family: 'JetBrains Mono', monospace;
                margin-bottom: 4px;
            }

            .dsw-stat-label {
                font-size: 12px;
                color: var(--sb-text-muted, #94a3b8);
            }

            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
                50% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
            }

            @media (max-width: 768px) {
                .dev-status-widget {
                    padding: 20px;
                }

                .dsw-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .dsw-overall-progress {
                    flex-direction: column;
                    width: 100%;
                }

                .dsw-milestones-grid {
                    grid-template-columns: 1fr;
                }

                .dsw-stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;

		document.head.appendChild(style);

		// Add SVG gradient
		if (!document.getElementById('dsw-gradient')) {
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.setAttribute('width', '0');
			svg.setAttribute('height', '0');
			svg.innerHTML = `
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
                    </linearGradient>
                </defs>
            `;
			svg.id = 'dsw-gradient';
			document.body.appendChild(svg);
		}
	}
});
