'use strict';
'require baseclass';
/**
 * SecuBox Development Status Widget
 * Real-time development progress tracker
 */

const DevStatusWidget = {
    targetVersion: '1.0.0',
    // Development milestones and progress
    milestones: {
        'modules-core': {
            name: 'Core Modules',
            progress: 100,
            total: 15,
            completed: 15,
            icon: '📦',
            color: '#10b981',
            items: [
                { name: 'SecuBox Central Hub', status: 'completed' },
                { name: 'System Hub', status: 'completed' },
                { name: 'Traffic Shaper', status: 'completed' },
                { name: 'CrowdSec Dashboard', status: 'completed' },
                { name: 'Netdata Dashboard', status: 'completed' },
                { name: 'Netifyd Dashboard', status: 'completed' },
                { name: 'Network Modes', status: 'completed' },
                { name: 'WireGuard Dashboard', status: 'completed' },
                { name: 'Auth Guardian', status: 'completed' },
                { name: 'Client Guardian (Captive Portal v1.0.0)', status: 'completed' },
                { name: 'Bandwidth Manager', status: 'completed' },
                { name: 'Media Flow', status: 'completed' },
                { name: 'CDN Cache', status: 'completed' },
                { name: 'VHost Manager', status: 'completed' },
                { name: 'KSM Manager', status: 'completed' }
            ]
        },
        'hardware-support': {
            name: 'Hardware Support',
            progress: 90,
            total: 5,
            completed: 4,
            icon: '🔧',
            color: '#f59e0b',
            items: [
                { name: 'x86-64 Tier 1 (PC / VM)', status: 'completed' },
                { name: 'ARM Cortex-A72 Tier 1 (MOCHAbin / RPi4)', status: 'completed' },
                { name: 'ARM Cortex-A53 Tier 1 (ESPRESSObin / Sheeva64)', status: 'completed' },
                { name: 'Tier 2 ARM64 / ARM32 Targets', status: 'in-progress' },
                { name: 'Tier 2 MIPS Targets', status: 'in-progress' }
            ]
        },
        'integration': {
            name: 'Integration & Testing',
            progress: 88,
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
                { name: 'Hardware Beta Testing', status: 'in-progress' }
            ]
        },
        'campaign-prep': {
            name: 'Campaign Preparation',
            progress: 75,
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

    // Per-module status overview (will be populated dynamically)
    moduleStatus: [],

    // Static module definitions (fallback if API fails)
    staticModuleStatus: [
        { name: 'SecuBox Central Hub', version: '0.7.0-r6', note: 'Dashboard central + Appstore (5 apps)', id: 'secubox-admin' },
        { name: 'System Hub', version: '0.5.1-r2', note: 'Centre de contrôle', id: 'system-hub' },
        { name: 'Traffic Shaper', version: '0.4.0-r1', note: 'CAKE / fq_codel / HTB', id: 'traffic-shaper' },
        { name: 'CrowdSec Dashboard', version: '0.5.0-r1', note: 'Détection d\'intrusions', id: 'crowdsec' },
        { name: 'Netdata Dashboard', version: '0.5.0-r1', note: 'Monitoring temps réel', id: 'netdata' },
        { name: 'Netifyd Dashboard', version: '0.4.0-r1', note: 'Intelligence applicative', id: 'netifyd' },
        { name: 'Network Modes', version: '0.5.0-r1', note: '5 topologies réseau', id: 'network-modes' },
        { name: 'WireGuard Dashboard', version: '0.4.0-r1', note: 'VPN + QR codes', id: 'wireguard' },
        { name: 'Auth Guardian', version: '0.4.0-r1', note: 'OAuth / vouchers', id: 'auth-guardian' },
        { name: 'Client Guardian', version: '0.4.0-r1', note: 'Portail captif + contrôle d\'accès', id: 'client-guardian' },
        { name: 'Bandwidth Manager', version: '0.4.0-r1', note: 'QoS + quotas', id: 'bandwidth-manager' },
        { name: 'Media Flow', version: '0.4.0-r1', note: 'DPI streaming', id: 'media-flow' },
        { name: 'CDN Cache', version: '0.5.0-r1', note: 'Cache contenu local', id: 'cdn-cache' },
        { name: 'VHost Manager', version: '0.4.1-r3', note: 'Reverse proxy / SSL', id: 'vhost-manager' },
        { name: 'KSM Manager', version: '0.4.0-r1', note: 'Gestion clés / HSM', id: 'ksm-manager' }
    ],

    // Overall project statistics (as of v0.16.0 - 2026-01-27)
    stats: {
        get modulesCount() { return DevStatusWidget.moduleStatus.length || 38; },
        languagesSupported: 12,
        architectures: 13,
        linesOfCode: 45000,
        contributors: 6,
        commits: 1500,
        openIssues: 2,
        closedIssues: 180
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
            status: 'completed',
            progress: 100
        },
        {
            phase: 'Phase 4',
            name: 'Beta Testing',
            period: 'Q1 2026',
            status: 'in-progress',
            progress: 55
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
     * Fetch and synchronize module versions from system
     */
    async syncModuleVersions() {
        try {
            // Try to fetch from secubox via ubus
            const appsData = await L.resolveDefault(
                L.Request.post(L.env.ubus_rpc_session ? '/ubus/' : '/ubus', {
                    'jsonrpc': '2.0',
                    'id': 1,
                    'method': 'call',
                    'params': [
                        L.env.ubus_rpc_session,
                        'luci.secubox',
                        'get_apps',
                        {}
                    ]
                }),
                null
            );

            if (!appsData || !appsData.json || !appsData.json().result || !appsData.json().result[1]) {
                console.warn('[DevStatus] API not available, using static data');
                this.moduleStatus = this.staticModuleStatus;
                return;
            }

            const result = appsData.json().result[1];
            const apps = result.apps || [];

            // Also get modules status
            const modulesData = await L.resolveDefault(
                L.Request.post(L.env.ubus_rpc_session ? '/ubus/' : '/ubus', {
                    'jsonrpc': '2.0',
                    'id': 2,
                    'method': 'call',
                    'params': [
                        L.env.ubus_rpc_session,
                        'luci.secubox',
                        'get_modules',
                        {}
                    ]
                }),
                null
            );

            const modules = modulesData && modulesData.json() && modulesData.json().result && modulesData.json().result[1] ?
                modulesData.json().result[1].modules || {} : {};

            // Map apps to module status
            this.moduleStatus = this.staticModuleStatus.map(staticModule => {
                const app = apps.find(a => a.id === staticModule.id || a.name === staticModule.name);

                let installed = false;
                let running = false;

                if (app && app.packages && app.packages.required && app.packages.required[0]) {
                    const pkgName = app.packages.required[0];
                    const moduleInfo = modules[pkgName];
                    if (moduleInfo) {
                        installed = moduleInfo.enabled || false;
                        running = moduleInfo.running || false;
                    }
                }

                if (app) {
                    return {
                        name: staticModule.name,
                        version: app.pkg_version || app.version || staticModule.version,
                        note: staticModule.note,
                        id: staticModule.id,
                        installed: installed,
                        running: running
                    };
                }

                return staticModule;
            });

            console.log('[DevStatus] Module versions synchronized:', this.moduleStatus.length, 'modules');
        } catch (error) {
            console.error('[DevStatus] Failed to sync module versions:', error);
            this.moduleStatus = this.staticModuleStatus;
        }
    },

    /**
     * Calculate overall progress
     */
    getOverallProgress() {
        return Math.round(this.getModulesOverallProgress());
    },

    getModulesOverallProgress() {
        const modules = this.moduleStatus || [];
        if (!modules.length)
            return this.getMilestoneProgressValue(this.milestones['modules-core']) * 100;
        const total = modules.reduce((sum, module) => sum + this.getVersionProgress(module), 0);
        return (total / modules.length) * 100;
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
    async render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="dev-status-widget">
                <div class="dsw-loading">
                    <div class="spinner"></div>
                    <p>Loading development status...</p>
                </div>
            </div>
        `;

        // Fetch and sync module versions
        await this.syncModuleVersions();

        // Render with fresh data
        const overallProgress = this.getModulesOverallProgress();
        const currentPhase = this.getCurrentPhase();

        container.innerHTML = `
            <div class="dev-status-widget">
                ${this.renderHeader(overallProgress, currentPhase)}
                ${this.renderMilestones()}
                ${this.renderTimeline()}
                ${this.renderModuleStatus()}
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
        const displayProgress = Number(progress || 0).toFixed(2);
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
                        <div class="dsw-progress-value">${displayProgress}%</div>
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
        const milestonesHtml = Object.entries(this.milestones).map(([key, milestone]) => {
            const itemsHtml = milestone.items.map(item => {
                const moduleInfo = this.getModuleInfo(item.name);
                const progressValue = this.getItemProgress(item);
                const progressPercent = Math.round(progressValue * 100);
                const progressLabel = moduleInfo ? this.formatVersionProgress(moduleInfo) : (item.status === 'completed' ? '1.00 / 1.00' : (item.status === 'in-progress' ? '0.50 / 1.00' : '0.00 / 1.00'));
                return `
                    <div class="dsw-item dsw-item-${item.status}">
                        <span class="dsw-item-icon">${this.getStatusIcon(item.status)}</span>
                        <span class="dsw-item-name">${item.name}</span>
                        ${progressValue >= 0 ? `
                            <div class="dsw-item-progress">
                                <div class="dsw-item-progress-bar">
                                    <div class="dsw-item-progress-fill" data-progress="${progressPercent}"></div>
                                </div>
                                <div class="dsw-item-progress-label">${progressLabel}</div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

            return `
            <div class="dsw-milestone" data-key="${key}">
                <div class="dsw-milestone-header">
                    <div class="dsw-milestone-info">
                        <span class="dsw-milestone-icon">${milestone.icon}</span>
                        <span class="dsw-milestone-name">${milestone.name}</span>
                    </div>
                    <div class="dsw-milestone-stats">
                        <span class="dsw-milestone-count">${this.getMilestoneCompletion(milestone)}</span>
                        <span class="dsw-milestone-percent" style="color: ${milestone.color}">${this.getMilestonePercentage(milestone)}%</span>
                        <span class="dsw-milestone-fraction">${this.getMilestoneProgressFraction(milestone)}</span>
                    </div>
                </div>
                <div class="dsw-milestone-mini-progress">
                    <div class="dsw-milestone-mini-bar">
                        <div class="dsw-milestone-mini-fill" data-progress="${Math.round(this.getMilestoneProgressValue(milestone) * 100)}"></div>
                    </div>
                    <div class="dsw-milestone-mini-label">${this.getMilestoneProgressFraction(milestone)}</div>
                </div>
                <div class="dsw-progress-bar-container">
                    <div class="dsw-progress-bar-fill" data-progress="${Math.round(this.getMilestoneProgressValue(milestone) * 100)}"
                         style="background: ${milestone.color}"></div>
                </div>
                <div class="dsw-milestone-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
        }).join('');

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
     * Render per-module status grid
     */
    renderModuleStatus() {
        const modulesWithProgress = [...this.moduleStatus].sort((a, b) => this.getVersionProgress(b) - this.getVersionProgress(a));
        const modulesHtml = modulesWithProgress.map(module => {
            const status = this.getModuleStatus(module);
            const progressPercent = Math.round(this.getVersionProgress(module) * 100);
            const statusLabel = status === 'completed'
                ? `Prêt pour v${this.targetVersion}`
                : `Progression vers v${this.targetVersion}`;

            // Runtime status indicators
            const runtimeStatus = module.running ? 'running' : (module.installed ? 'stopped' : 'not-installed');
            const runtimeIcon = module.running ? '🟢' : (module.installed ? '🟠' : '⚫');
            const runtimeLabel = module.running ? 'Running' : (module.installed ? 'Installed' : 'Not Installed');

            return `
            <div class="dsw-module-card dsw-module-${status}">
                <div class="dsw-module-header">
                    <span class="dsw-module-name">${module.name}</span>
                    <div class="dsw-module-badges">
                        <span class="dsw-module-version">${this.formatVersion(module.version)}</span>
                        <span class="dsw-module-runtime-badge dsw-runtime-${runtimeStatus}" title="${runtimeLabel}">
                            ${runtimeIcon}
                        </span>
                    </div>
                </div>
                <div class="dsw-module-status-row">
                    <span class="dsw-module-status-indicator">${status === 'completed' ? '✅' : '🔄'}</span>
                    <span class="dsw-module-status-label">${statusLabel}</span>
                </div>
                <div class="dsw-module-progress">
                    <div class="dsw-module-progress-bar">
                        <div class="dsw-module-progress-fill" data-progress="${progressPercent}"></div>
                    </div>
                    <div class="dsw-module-progress-label">${this.formatVersionProgress(module)}</div>
                </div>
                <div class="dsw-module-target">Objectif&nbsp;: v${this.targetVersion}</div>
                <div class="dsw-module-note">${module.note}</div>
            </div>
        `;
        }).join('');

        return `
            <div class="dsw-modules">
                <h4 class="dsw-section-title">Modules & Versions</h4>
                <div class="dsw-modules-grid">
                    ${modulesHtml}
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
     * Get milestone completion text (completed/total)
     */
    getMilestoneCompletion(milestone) {
        const total = milestone.items.length || milestone.total || 0;
        if (!total)
            return '0/0';
        const completed = milestone.items.filter(item => this.getItemProgress(item) >= 0.999).length;
        return `${completed}/${total}`;
    },

    /**
     * Calculate milestone progress percentage from items
     */
    getMilestonePercentage(milestone) {
        return Math.round(this.getMilestoneProgressValue(milestone) * 100);
    },

    /**
     * Get milestone progress value (0-1)
     */
    getMilestoneProgressValue(milestone) {
        const items = milestone.items || [];
        if (!items.length)
            return 0;
        const sum = items.reduce((acc, item) => acc + this.getItemProgress(item), 0);
        return Math.min(1, sum / items.length);
    },

    /**
     * Return X.Y / 1 fractional representation of progress towards target version
     */
    getMilestoneProgressFraction(milestone) {
        const fraction = this.getMilestoneProgressValue(milestone);
        return `${fraction.toFixed(2)} / 1`;
    },

    /**
     * Format version with leading v
     */
    formatVersion(version) {
        if (!version)
            return '';
        return version.startsWith('v') ? version : `v${version}`;
    },

    versionToNumber(version) {
        if (!version)
            return 0;
        const parts = version.toString().replace(/^v/, '').split('.');
        const major = parseInt(parts[0], 10) || 0;
        const minor = parseInt(parts[1], 10) || 0;
        const patch = parseInt(parts[2], 10) || 0;
        return major + (minor / 10) + (patch / 100);
    },

    /**
     * Compare semantic versions (returns positive if v1 >= v2)
     */
    compareVersions(v1, v2) {
        const diff = this.versionToNumber(v1) - this.versionToNumber(v2);
        if (diff > 0)
            return 1;
        if (diff < 0)
            return -1;
        return 0;
    },

    /**
     * Determine module status versus the target version
     */
    getModuleStatus(module) {
        return this.compareVersions(module.version, this.targetVersion) >= 0 ? 'completed' : 'in-progress';
    },

    getVersionProgress(module) {
        const current = this.versionToNumber(module.version);
        const target = this.versionToNumber(this.targetVersion);
        if (!target)
            return 0;
        return Math.min(1, current / target);
    },

    formatVersionProgress(module) {
        return `${this.getVersionProgress(module).toFixed(2)} / 1.00`;
    },

    getModuleInfo(name) {
        return this.moduleStatus.find(module => module.name === name);
    },

    getItemProgress(item) {
        const module = this.getModuleInfo(item.name);
        if (module)
            return this.getVersionProgress(module);
        if (item.status === 'completed') return 1;
        if (item.status === 'in-progress') return 0.5;
        return 0;
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
                } else if (element.classList.contains('dsw-milestone-mini-fill')) {
                    element.style.width = `${progress}%`;
                } else if (element.classList.contains('dsw-module-progress-fill')) {
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

            .dsw-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                gap: 16px;
            }

            .dsw-loading .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(99, 102, 241, 0.1);
                border-top-color: #6366f1;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .dsw-loading p {
                color: var(--sb-text-muted, #94a3b8);
                font-size: 14px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
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
                font-family: 'JetBrains Mono', monospace;
            }

            .dsw-milestone-fraction {
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
                color: var(--sb-text-muted, #94a3b8);
            }

            .dsw-progress-bar-container {
                height: 8px;
                background: var(--sb-bg, #0f1019);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 16px;
            }

            .dsw-progress-bar-fill {
                height: 100%;
                width: 0;
                border-radius: 4px;
                transition: width 1s ease-out;
            }

            .dsw-milestone-mini-progress {
                margin: 8px 0 12px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .dsw-milestone-mini-bar {
                width: 100%;
                height: 4px;
                background: rgba(148, 163, 184, 0.2);
                border-radius: 999px;
                overflow: hidden;
            }

            .dsw-milestone-mini-fill {
                height: 100%;
                width: 0;
                border-radius: 999px;
                background: linear-gradient(90deg, var(--sb-green, #10b981), var(--sb-cyan, #06b6d4));
                transition: width 0.8s ease-out;
            }

            .dsw-milestone-mini-label {
                font-size: 12px;
                font-family: 'JetBrains Mono', monospace;
                color: var(--sb-text-muted, #94a3b8);
                text-align: right;
            }

            .dsw-milestone-items {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .dsw-item {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 8px 0;
            }

            .dsw-item-icon {
                font-size: 16px;
            }

            .dsw-item-name {
                font-size: 13px;
                font-weight: 600;
            }

            .dsw-item-completed .dsw-item-name {
                color: var(--sb-text-muted, #94a3b8);
            }

            .dsw-item-in-progress .dsw-item-name {
                color: var(--sb-orange, #f97316);
            }

            .dsw-item-planned .dsw-item-name {
                color: var(--sb-text-dim, #64748b);
            }

            .dsw-item-progress {
                width: 100%;
            }

            .dsw-item-progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(148, 163, 184, 0.15);
                border-radius: 999px;
                overflow: hidden;
            }

            .dsw-item-progress-fill {
                height: 100%;
                width: 0;
                background: linear-gradient(90deg, #10b981, #06b6d4);
                border-radius: 999px;
                transition: width 0.8s ease-out;
            }

            .dsw-item-progress-label {
                text-align: right;
                font-size: 11px;
                font-family: 'JetBrains Mono', monospace;
                color: var(--sb-text-muted, #94a3b8);
                margin-top: 2px;
            }

            .dsw-timeline {
                margin-bottom: 40px;
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
                background: var(--sb-border, #2a2a3a);
                border: 3px solid var(--sb-bg-card, #1a1a24);
                z-index: 1;
            }

            .dsw-timeline-completed .dsw-timeline-dot {
                background: var(--sb-green, #10b981);
            }

            .dsw-timeline-in-progress .dsw-timeline-dot {
                background: var(--sb-orange, #f97316);
                animation: pulse 2s infinite;
            }

            .dsw-timeline-line {
                width: 2px;
                flex: 1;
                background: var(--sb-border, #2a2a3a);
                margin-top: 4px;
            }

            .dsw-timeline-completed .dsw-timeline-line {
                background: var(--sb-green, #10b981);
            }

            .dsw-timeline-content {
                flex: 1;
                padding-bottom: 32px;
            }

            .dsw-timeline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }

            .dsw-timeline-phase {
                font-size: 12px;
                font-weight: 700;
                color: var(--sb-cyan, #06b6d4);
                text-transform: uppercase;
            }

            .dsw-timeline-period {
                font-size: 12px;
                color: var(--sb-text-dim, #64748b);
                font-family: 'JetBrains Mono', monospace;
            }

            .dsw-timeline-name {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
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

            .dsw-modules-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 16px;
            }

            .dsw-module-card {
                background: var(--sb-bg, #0f1019);
                border: 1px solid var(--sb-border, #2a2a3a);
                border-radius: 12px;
                padding: 18px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .dsw-module-card:hover {
                border-color: var(--sb-cyan, #06b6d4);
                transform: translateY(-2px);
            }

            .dsw-module-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                font-weight: 600;
            }

            .dsw-module-badges {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dsw-module-version {
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
                color: var(--sb-text-muted, #94a3b8);
            }

            .dsw-module-runtime-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                font-size: 12px;
                border-radius: 50%;
                cursor: help;
                transition: transform 0.2s;
            }

            .dsw-module-runtime-badge:hover {
                transform: scale(1.2);
            }

            .dsw-runtime-running {
                background: rgba(16, 185, 129, 0.15);
                box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
                animation: pulse-green 2s ease-in-out infinite;
            }

            .dsw-runtime-stopped {
                background: rgba(245, 158, 11, 0.15);
                box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
            }

            .dsw-runtime-not-installed {
                background: rgba(107, 116, 128, 0.15);
                box-shadow: 0 0 0 2px rgba(107, 116, 128, 0.2);
            }

            @keyframes pulse-green {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }

            .dsw-module-status-row {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 600;
            }

            .dsw-module-status-indicator {
                font-size: 16px;
            }

            .dsw-module-target {
                font-size: 12px;
                color: var(--sb-text-muted, #94a3b8);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .dsw-module-note {
                font-size: 13px;
                color: var(--sb-text-muted, #94a3b8);
            }

            .dsw-module-progress {
                margin-top: 4px;
            }

            .dsw-module-progress-bar {
                width: 100%;
                height: 6px;
                background: var(--sb-bg, #0f1019);
                border-radius: 3px;
                overflow: hidden;
            }

            .dsw-module-progress-fill {
                height: 100%;
                width: 0;
                background: linear-gradient(90deg, #10b981, #06b6d4);
                border-radius: 3px;
                transition: width 0.8s ease-out;
            }

            .dsw-module-progress-label {
                margin-top: 4px;
                font-size: 12px;
                font-family: 'JetBrains Mono', monospace;
                color: var(--sb-text-muted, #94a3b8);
                text-align: right;
            }

            .dsw-module-card.dsw-module-in-progress {
                border-color: rgba(245, 158, 11, 0.4);
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
};

// Auto-initialize if container exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('dev-status-widget')) {
            DevStatusWidget.render('dev-status-widget');
        }
    });
} else {
    if (document.getElementById('dev-status-widget')) {
        DevStatusWidget.render('dev-status-widget');
    }
}

// Export for use in other scripts
window.DevStatusWidget = DevStatusWidget;

return baseclass.extend(DevStatusWidget);
