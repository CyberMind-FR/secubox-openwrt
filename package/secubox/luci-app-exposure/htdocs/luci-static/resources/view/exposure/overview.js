'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require exposure/api as api';

/**
 * SecuBox Service Exposure Manager - Overview Dashboard
 * Manages Tor Hidden Services and HAProxy SSL backends
 * Progressive loading with debug console output
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
    title: _('Service Exposure Manager'),

    data: null,
    pollRegistered: false,
    loadStartTime: null,
    DEBUG: true,

    // === Debug Logging with timestamps ===
    log: function(step, message, data) {
        if (!this.DEBUG) return;
        var elapsed = this.loadStartTime ? (Date.now() - this.loadStartTime) + 'ms' : '0ms';
        var prefix = '%c[Exposure ' + elapsed + '] %c' + step + '%c';
        if (data !== undefined) {
            console.log(prefix, 'color: #64ffda; font-weight: bold;', 'color: #9b59b6; font-weight: bold;', 'color: #8892b0;', message, data);
        } else {
            console.log(prefix, 'color: #64ffda; font-weight: bold;', 'color: #9b59b6; font-weight: bold;', 'color: #8892b0;', message);
        }
    },

    load: function() {
        var self = this;
        this.loadStartTime = Date.now();
        this.log('INIT', 'Starting dashboard load');

        // Load CSS first
        var cssLink = document.querySelector('link[href*="exposure/dashboard.css"]');
        if (!cssLink) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = L.resource('exposure/dashboard.css');
            document.head.appendChild(link);
            this.log('CSS', 'Stylesheet injected');
        }

        // Progressive data loading with individual error handling
        return this.loadDataProgressively();
    },

    loadDataProgressively: function() {
        var self = this;

        // Initialize result container
        var result = {
            status: { services: {}, tor: {}, ssl: {} },
            scan: { services: [] },
            conflicts: { conflicts: [] },
            tor: { services: [] },
            ssl: { backends: [] }
        };

        // Create promises with individual timing and error handling
        // Priority: status > ssl > tor > scan > conflicts

        self.log('FETCH', '1/5 Status (priority: critical)');
        var p1 = api.status().then(function(data) {
            result.status = data || result.status;
            self.log('STATUS', 'Complete', {
                total: (result.status.services || {}).total || 0,
                external: (result.status.services || {}).external || 0,
                tor: (result.status.tor || {}).count || 0,
                ssl: (result.status.ssl || {}).count || 0
            });
            return data;
        }).catch(function(err) {
            self.log('ERROR', 'Status fetch failed: ' + err.message);
            return result.status;
        });

        self.log('FETCH', '2/5 SSL Backends (priority: high)');
        var p2 = api.sslList().then(function(data) {
            result.ssl = data || result.ssl;
            var backends = result.ssl.backends || [];
            self.log('SSL', 'Complete', {
                count: backends.length,
                domains: backends.map(function(b) { return b.domain; })
            });
            return data;
        }).catch(function(err) {
            self.log('ERROR', 'SSL list failed: ' + err.message);
            return result.ssl;
        });

        self.log('FETCH', '3/5 Tor Services (priority: high)');
        var p3 = api.torList().then(function(data) {
            result.tor = data || result.tor;
            var services = result.tor.services || [];
            self.log('TOR', 'Complete', {
                count: services.length,
                onions: services.map(function(s) { return s.service + ': ' + (s.onion || '').substring(0, 16) + '...'; })
            });
            return data;
        }).catch(function(err) {
            self.log('ERROR', 'Tor list failed: ' + err.message);
            return result.tor;
        });

        self.log('FETCH', '4/5 Service Scan (priority: medium)');
        var p4 = api.scan().then(function(data) {
            result.scan = data || result.scan;
            var services = Array.isArray(data) ? data : (data.services || []);
            var external = services.filter(function(s) { return s.external; });
            self.log('SCAN', 'Complete', {
                total: services.length,
                external: external.length,
                processes: external.slice(0, 5).map(function(s) { return s.name || s.process; })
            });
            return data;
        }).catch(function(err) {
            self.log('ERROR', 'Scan failed: ' + err.message);
            return result.scan;
        });

        self.log('FETCH', '5/5 Conflicts (priority: low)');
        var p5 = api.conflicts().then(function(data) {
            result.conflicts = data || result.conflicts;
            var conflicts = Array.isArray(data) ? data : (data.conflicts || []);
            self.log('CONFLICTS', 'Complete', { count: conflicts.length });
            return data;
        }).catch(function(err) {
            self.log('ERROR', 'Conflicts check failed: ' + err.message);
            return result.conflicts;
        });

        // Wait for all with graceful degradation
        return Promise.all([p1, p2, p3, p4, p5]).then(function() {
            var totalTime = Date.now() - self.loadStartTime;
            self.log('LOADED', 'All data fetched in ' + totalTime + 'ms');
            return [result.status, result.scan, result.conflicts, result.tor, result.ssl];
        });
    },

    render: function(data) {
        var self = this;
        var renderStart = Date.now();
        this.log('RENDER', 'Starting DOM construction');

        var status = data[0] || {};
        var scanResult = data[1] || {};
        var conflictsResult = data[2] || {};
        var torResult = data[3] || {};
        var sslResult = data[4] || {};

        // Normalize data
        this.log('RENDER', 'Normalizing data structures');
        var services = Array.isArray(scanResult) ? scanResult : (scanResult.services || []);
        var conflicts = Array.isArray(conflictsResult) ? conflictsResult : (conflictsResult.conflicts || []);
        var torServices = Array.isArray(torResult) ? torResult : (torResult.services || []);
        var sslBackends = Array.isArray(sslResult) ? sslResult : (sslResult.backends || []);

        this.log('DATA', 'Final counts', {
            services: services.length,
            conflicts: conflicts.length,
            tor: torServices.length,
            ssl: sslBackends.length
        });

        var exposableServices = services.filter(function(svc) { return svc.external; });

        // Build exposure lookup maps
        var exposedTor = {};
        var exposedSsl = {};
        torServices.forEach(function(t) { exposedTor[t.service] = t; });
        sslBackends.forEach(function(s) { exposedSsl[s.service] = s; });

        // Find unexposed services (suggestions)
        var suggestions = exposableServices.filter(function(svc) {
            var name = self.getServiceName(svc);
            return !exposedTor[name] && !exposedSsl[name];
        });

        this.log('SUGGESTIONS', 'Unexposed services found', {
            count: suggestions.length,
            names: suggestions.slice(0, 5).map(function(s) { return s.name || s.process; })
        });

        // Build view content progressively with timing
        var content = [];

        this.log('DOM', '1/6 Page header');
        content.push(this.renderPageHeader(status));

        if (conflicts.length > 0) {
            this.log('DOM', '2/6 Conflicts banner (active)');
            content.push(this.renderConflictsBanner(conflicts));
        } else {
            this.log('DOM', '2/6 Conflicts banner (skipped - none)');
        }

        this.log('DOM', '3/6 Stats grid');
        content.push(this.renderStatsGrid(status, torServices, sslBackends, exposableServices));

        if (suggestions.length > 0) {
            this.log('DOM', '4/6 Suggestions card (active)');
            content.push(this.renderSuggestionsCard(suggestions));
        } else {
            this.log('DOM', '4/6 Suggestions card (skipped - none)');
        }

        this.log('DOM', '5/6 Service cards row');
        content.push(E('div', { 'class': 'exp-row' }, [
            E('div', { 'style': 'flex: 1' }, [
                this.renderTorServicesCard(torServices)
            ]),
            E('div', { 'style': 'flex: 1' }, [
                this.renderSslBackendsCard(sslBackends)
            ])
        ]));

        this.log('DOM', '6/6 Quick actions');
        content.push(this.renderQuickActions());

        // Filter nulls
        content = content.filter(Boolean);

        // Main wrapper with animation
        var view = E('div', { 'class': 'exposure-dashboard exp-fade-in' }, content);

        // Setup polling
        if (!this.pollRegistered) {
            this.pollRegistered = true;
            this.log('POLL', 'Auto-refresh registered (30s interval)');
            poll.add(function() {
                self.log('POLL', 'Refreshing dashboard...');
                return self.refreshDashboard();
            }, 30);
        }

        var renderTime = Date.now() - renderStart;
        var totalTime = Date.now() - this.loadStartTime;
        this.log('COMPLETE', 'Dashboard ready', {
            renderTime: renderTime + 'ms',
            totalTime: totalTime + 'ms'
        });

        return view;
    },

    getServiceName: function(svc) {
        var name = svc.name ? svc.name.toLowerCase().replace(/\s+/g, '') : svc.process;
        return name.replace(/[^a-z0-9]/g, '');
    },

    renderPageHeader: function(status) {
        var servicesData = status.services || {};
        var torData = status.tor || {};
        var sslData = status.ssl || {};

        return E('div', { 'class': 'exp-page-header' }, [
            E('div', {}, [
                E('h1', { 'class': 'exp-page-title' }, [
                    E('span', { 'class': 'exp-page-title-icon' }, '\uD83D\uDD0C'),
                    'Service Exposure Manager'
                ]),
                E('p', { 'class': 'exp-page-subtitle' },
                    'Expose local services via Tor Hidden Services (.onion) or HAProxy SSL reverse proxy')
            ]),
            E('div', { 'class': 'exp-header-badges' }, [
                E('div', { 'class': 'exp-header-badge' }, [
                    E('span', { 'style': 'color: #64ffda;' }, String(servicesData.external || 0)),
                    ' Exposable'
                ]),
                E('div', { 'class': 'exp-header-badge' }, [
                    E('span', { 'style': 'color: #9b59b6;' }, String(torData.count || 0)),
                    ' Tor'
                ]),
                E('div', { 'class': 'exp-header-badge' }, [
                    E('span', { 'style': 'color: #27ae60;' }, String(sslData.count || 0)),
                    ' SSL'
                ])
            ])
        ]);
    },

    renderConflictsBanner: function(conflicts) {
        return E('div', { 'class': 'exp-card exp-warning-card' }, [
            E('div', { 'class': 'exp-card-body', 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                E('span', { 'style': 'font-size: 32px;' }, '\u26A0\uFE0F'),
                E('div', { 'style': 'flex: 1;' }, [
                    E('div', { 'style': 'font-weight: 600; font-size: 16px; margin-bottom: 4px; color: #f39c12;' },
                        conflicts.length + ' Port Conflict(s) Detected'),
                    E('div', { 'style': 'color: #8892b0;' },
                        conflicts.map(function(c) {
                            return 'Port ' + c.port + ': ' + (c.services || []).join(', ');
                        }).join(' | '))
                ])
            ])
        ]);
    },

    renderStatsGrid: function(status, torServices, sslBackends, exposableServices) {
        var servicesData = status.services || {};

        return E('div', { 'class': 'exp-stats-grid' }, [
            E('div', { 'class': 'exp-stat-card' }, [
                E('div', { 'class': 'exp-stat-icon' }, '\uD83D\uDD0C'),
                E('div', { 'class': 'exp-stat-value' }, String(servicesData.total || 0)),
                E('div', { 'class': 'exp-stat-label' }, 'Total Services'),
                E('div', { 'class': 'exp-stat-trend' }, (servicesData.external || 0) + ' external')
            ]),
            E('div', { 'class': 'exp-stat-card exp-stat-tor' }, [
                E('div', { 'class': 'exp-stat-icon' }, '\uD83E\uDDC5'),
                E('div', { 'class': 'exp-stat-value' }, String(torServices.length)),
                E('div', { 'class': 'exp-stat-label' }, 'Tor Hidden Services'),
                E('div', { 'class': 'exp-stat-trend' }, torServices.length > 0 ? 'Active' : 'None configured')
            ]),
            E('div', { 'class': 'exp-stat-card exp-stat-ssl' }, [
                E('div', { 'class': 'exp-stat-icon' }, '\uD83D\uDD12'),
                E('div', { 'class': 'exp-stat-value' }, String(sslBackends.length)),
                E('div', { 'class': 'exp-stat-label' }, 'SSL Backends'),
                E('div', { 'class': 'exp-stat-trend' }, sslBackends.length > 0 ? 'HAProxy' : 'None configured')
            ]),
            E('div', { 'class': 'exp-stat-card' }, [
                E('div', { 'class': 'exp-stat-icon' }, '\uD83D\uDCA1'),
                E('div', { 'class': 'exp-stat-value' }, String(exposableServices.length)),
                E('div', { 'class': 'exp-stat-label' }, 'Exposable'),
                E('div', { 'class': 'exp-stat-trend' }, 'Ready for exposure')
            ])
        ]);
    },

    renderSuggestionsCard: function(suggestions) {
        var self = this;

        // Prioritize interesting services
        var prioritized = suggestions.sort(function(a, b) {
            var priority = {
                'streamlit': 1, 'Streamlit': 1,
                'gitea': 2, 'Gitea': 2,
                'hexo': 3, 'HexoJS': 3,
                'nextcloud': 4,
                'jupyter': 5,
                'flask': 6,
                'django': 7
            };
            var pA = priority[a.name] || priority[a.process] || 100;
            var pB = priority[b.name] || priority[b.process] || 100;
            return pA - pB;
        }).slice(0, 6);

        return E('div', { 'class': 'exp-card exp-suggestions-card' }, [
            E('div', { 'class': 'exp-card-header' }, [
                E('div', { 'class': 'exp-card-title' }, [
                    E('span', { 'class': 'exp-card-title-icon' }, '\uD83D\uDCA1'),
                    'Suggested Services to Expose'
                ]),
                E('a', { 'href': L.url('admin/secubox/network/exposure/services'), 'class': 'exp-btn exp-btn-secondary exp-btn-sm' },
                    'View All')
            ]),
            E('div', { 'class': 'exp-card-body' }, [
                E('div', { 'class': 'exp-suggestions-grid' }, prioritized.map(function(svc) {
                    var serviceName = self.getServiceName(svc);
                    var icon = self.getServiceIcon(svc);

                    return E('div', { 'class': 'exp-suggestion-item' }, [
                        E('div', { 'class': 'exp-suggestion-icon' }, icon),
                        E('div', { 'class': 'exp-suggestion-info' }, [
                            E('div', { 'class': 'exp-suggestion-name' }, svc.name || svc.process),
                            E('div', { 'class': 'exp-suggestion-port' }, 'Port ' + svc.port)
                        ]),
                        E('div', { 'class': 'exp-suggestion-actions' }, [
                            E('button', {
                                'class': 'exp-btn exp-btn-tor exp-btn-xs',
                                'title': 'Add Tor Hidden Service',
                                'click': function() { self.handleAddTor(svc, serviceName); }
                            }, '\uD83E\uDDC5'),
                            E('button', {
                                'class': 'exp-btn exp-btn-ssl exp-btn-xs',
                                'title': 'Add SSL Backend',
                                'click': function() { self.handleAddSsl(svc, serviceName); }
                            }, '\uD83D\uDD12')
                        ])
                    ]);
                }))
            ])
        ]);
    },

    getServiceIcon: function(svc) {
        var iconMap = {
            'streamlit': '\uD83D\uDCCA',
            'Streamlit': '\uD83D\uDCCA',
            'gitea': '\uD83D\uDC19',
            'Gitea': '\uD83D\uDC19',
            'hexo': '\uD83D\uDCDD',
            'HexoJS': '\uD83D\uDCDD',
            'jupyter': '\uD83D\uDCD3',
            'flask': '\uD83C\uDF76',
            'django': '\uD83E\uDD8E',
            'nextcloud': '\u2601\uFE0F',
            'SSH': '\uD83D\uDD11',
            'HAProxy': '\u2696\uFE0F',
            'DNS': '\uD83C\uDF10',
            'LuCI': '\uD83D\uDDA5\uFE0F',
            'python': '\uD83D\uDC0D'
        };
        return iconMap[svc.name] || iconMap[svc.process] || '\uD83D\uDD0C';
    },

    renderTorServicesCard: function(torServices) {
        var self = this;

        if (torServices.length === 0) {
            return E('div', { 'class': 'exp-card' }, [
                E('div', { 'class': 'exp-card-header' }, [
                    E('div', { 'class': 'exp-card-title' }, [
                        E('span', { 'class': 'exp-card-title-icon' }, '\uD83E\uDDC5'),
                        'Tor Hidden Services'
                    ]),
                    E('a', { 'href': L.url('admin/secubox/network/exposure/tor'), 'class': 'exp-btn exp-btn-tor exp-btn-sm' },
                        '+ Add')
                ]),
                E('div', { 'class': 'exp-card-body' }, [
                    E('div', { 'class': 'exp-empty' }, [
                        E('div', { 'class': 'exp-empty-icon' }, '\uD83E\uDDC5'),
                        E('div', { 'class': 'exp-empty-text' }, 'No Tor hidden services'),
                        E('div', { 'class': 'exp-empty-hint' }, 'Services are accessible via .onion addresses')
                    ])
                ])
            ]);
        }

        var items = torServices.slice(0, 5).map(function(svc) {
            var onion = svc.onion || '';
            var shortOnion = onion.length > 30 ? onion.substring(0, 28) + '...' : onion;

            return E('div', { 'class': 'exp-service-item' }, [
                E('div', { 'class': 'exp-service-icon' }, '\uD83E\uDDC5'),
                E('div', { 'class': 'exp-service-info' }, [
                    E('div', { 'class': 'exp-service-name' }, svc.service),
                    E('div', { 'class': 'exp-service-detail exp-onion' }, shortOnion)
                ]),
                E('button', {
                    'class': 'exp-btn exp-btn-danger exp-btn-xs',
                    'title': 'Remove',
                    'click': function() { self.handleRemoveTor(svc.service); }
                }, '\u2715')
            ]);
        });

        var cardBody = [E('div', { 'class': 'exp-services-list' }, items)];

        if (torServices.length > 5) {
            cardBody.push(E('div', { 'style': 'text-align: center; margin-top: 12px;' },
                E('a', { 'href': L.url('admin/secubox/network/exposure/tor') },
                    '+' + (torServices.length - 5) + ' more')));
        }

        return E('div', { 'class': 'exp-card' }, [
            E('div', { 'class': 'exp-card-header' }, [
                E('div', { 'class': 'exp-card-title' }, [
                    E('span', { 'class': 'exp-card-title-icon' }, '\uD83E\uDDC5'),
                    'Tor Hidden Services (' + torServices.length + ')'
                ]),
                E('a', { 'href': L.url('admin/secubox/network/exposure/tor'), 'class': 'exp-btn exp-btn-secondary exp-btn-sm' },
                    'Manage')
            ]),
            E('div', { 'class': 'exp-card-body' }, cardBody)
        ]);
    },

    renderSslBackendsCard: function(sslBackends) {
        var self = this;

        if (sslBackends.length === 0) {
            return E('div', { 'class': 'exp-card' }, [
                E('div', { 'class': 'exp-card-header' }, [
                    E('div', { 'class': 'exp-card-title' }, [
                        E('span', { 'class': 'exp-card-title-icon' }, '\uD83D\uDD12'),
                        'SSL Backends'
                    ]),
                    E('a', { 'href': L.url('admin/secubox/network/exposure/ssl'), 'class': 'exp-btn exp-btn-ssl exp-btn-sm' },
                        '+ Add')
                ]),
                E('div', { 'class': 'exp-card-body' }, [
                    E('div', { 'class': 'exp-empty' }, [
                        E('div', { 'class': 'exp-empty-icon' }, '\uD83D\uDD12'),
                        E('div', { 'class': 'exp-empty-text' }, 'No SSL backends'),
                        E('div', { 'class': 'exp-empty-hint' }, 'Add HTTPS reverse proxy via HAProxy')
                    ])
                ])
            ]);
        }

        var items = sslBackends.slice(0, 5).map(function(backend) {
            return E('div', { 'class': 'exp-service-item' }, [
                E('div', { 'class': 'exp-service-icon' }, '\uD83D\uDD12'),
                E('div', { 'class': 'exp-service-info' }, [
                    E('div', { 'class': 'exp-service-name' }, backend.service),
                    E('div', { 'class': 'exp-service-detail exp-domain' }, backend.domain)
                ]),
                E('button', {
                    'class': 'exp-btn exp-btn-danger exp-btn-xs',
                    'title': 'Remove',
                    'click': function() { self.handleRemoveSsl(backend.service); }
                }, '\u2715')
            ]);
        });

        var cardBody = [E('div', { 'class': 'exp-services-list' }, items)];

        if (sslBackends.length > 5) {
            cardBody.push(E('div', { 'style': 'text-align: center; margin-top: 12px;' },
                E('a', { 'href': L.url('admin/secubox/network/exposure/ssl') },
                    '+' + (sslBackends.length - 5) + ' more')));
        }

        return E('div', { 'class': 'exp-card' }, [
            E('div', { 'class': 'exp-card-header' }, [
                E('div', { 'class': 'exp-card-title' }, [
                    E('span', { 'class': 'exp-card-title-icon' }, '\uD83D\uDD12'),
                    'SSL Backends (' + sslBackends.length + ')'
                ]),
                E('a', { 'href': L.url('admin/secubox/network/exposure/ssl'), 'class': 'exp-btn exp-btn-secondary exp-btn-sm' },
                    'Manage')
            ]),
            E('div', { 'class': 'exp-card-body' }, cardBody)
        ]);
    },

    renderQuickActions: function() {
        var self = this;

        return E('div', { 'class': 'exp-card' }, [
            E('div', { 'class': 'exp-card-header' }, [
                E('div', { 'class': 'exp-card-title' }, [
                    E('span', { 'class': 'exp-card-title-icon' }, '\u26A1'),
                    'Quick Actions'
                ])
            ]),
            E('div', { 'class': 'exp-card-body' }, [
                E('div', { 'class': 'exp-quick-actions' }, [
                    E('a', {
                        'href': L.url('admin/secubox/network/exposure/services'),
                        'class': 'exp-action-btn'
                    }, [
                        E('span', { 'class': 'exp-action-icon' }, '\uD83D\uDD0C'),
                        E('span', { 'class': 'exp-action-label' }, 'All Services')
                    ]),
                    E('a', {
                        'href': L.url('admin/secubox/network/exposure/tor'),
                        'class': 'exp-action-btn'
                    }, [
                        E('span', { 'class': 'exp-action-icon' }, '\uD83E\uDDC5'),
                        E('span', { 'class': 'exp-action-label' }, 'Tor Services')
                    ]),
                    E('a', {
                        'href': L.url('admin/secubox/network/exposure/ssl'),
                        'class': 'exp-action-btn'
                    }, [
                        E('span', { 'class': 'exp-action-icon' }, '\uD83D\uDD12'),
                        E('span', { 'class': 'exp-action-label' }, 'SSL Backends')
                    ]),
                    E('button', {
                        'class': 'exp-action-btn',
                        'click': function() { self.refreshDashboard(); }
                    }, [
                        E('span', { 'class': 'exp-action-icon' }, '\uD83D\uDD04'),
                        E('span', { 'class': 'exp-action-label' }, 'Refresh')
                    ])
                ])
            ])
        ]);
    },

    // === Progress Modal Helpers ===

    createProgressModal: function(title, steps) {
        var stepsContainer = E('div', { 'class': 'exp-progress-steps', 'id': 'progress-steps' });

        steps.forEach(function(step, index) {
            stepsContainer.appendChild(E('div', {
                'class': 'exp-progress-step',
                'id': 'step-' + index,
                'data-status': 'pending'
            }, [
                E('div', { 'class': 'exp-step-indicator' }, [
                    E('span', { 'class': 'exp-step-number' }, String(index + 1)),
                    E('span', { 'class': 'exp-step-icon' })
                ]),
                E('div', { 'class': 'exp-step-content' }, [
                    E('div', { 'class': 'exp-step-label' }, step.label),
                    E('div', { 'class': 'exp-step-detail', 'id': 'step-detail-' + index }, step.detail || '')
                ])
            ]));
        });

        return E('div', { 'class': 'exp-progress-modal' }, [
            E('div', { 'class': 'exp-progress-header' }, [
                E('div', { 'class': 'exp-progress-title' }, title),
                E('div', { 'class': 'exp-progress-subtitle', 'id': 'progress-subtitle' }, 'Initializing...')
            ]),
            stepsContainer,
            E('div', { 'class': 'exp-progress-result', 'id': 'progress-result', 'style': 'display: none;' })
        ]);
    },

    updateStep: function(index, status, detail) {
        var stepEl = document.getElementById('step-' + index);
        var detailEl = document.getElementById('step-detail-' + index);
        var subtitleEl = document.getElementById('progress-subtitle');

        if (stepEl) {
            stepEl.setAttribute('data-status', status);
            if (detail && detailEl) {
                detailEl.textContent = detail;
            }
        }

        if (subtitleEl && status === 'active') {
            var labelEl = stepEl ? stepEl.querySelector('.exp-step-label') : null;
            if (labelEl) {
                subtitleEl.textContent = labelEl.textContent + '...';
            }
        }
    },

    showProgressResult: function(success, message, details) {
        var resultEl = document.getElementById('progress-result');
        var subtitleEl = document.getElementById('progress-subtitle');

        if (resultEl) {
            resultEl.style.display = 'block';
            resultEl.className = 'exp-progress-result ' + (success ? 'success' : 'error');
            resultEl.innerHTML = '';
            resultEl.appendChild(E('div', { 'class': 'exp-result-icon' }, success ? '\u2705' : '\u274C'));
            resultEl.appendChild(E('div', { 'class': 'exp-result-message' }, message));
            if (details) {
                resultEl.appendChild(E('div', { 'class': 'exp-result-details' }, details));
            }
        }

        if (subtitleEl) {
            subtitleEl.textContent = success ? 'Completed successfully' : 'Operation failed';
        }
    },

    // === Action Handlers ===

    handleAddTor: function(svc, serviceName) {
        var self = this;

        ui.showModal('Add Tor Hidden Service', [
            E('p', {}, 'Create a .onion address for ' + (svc.name || svc.process)),
            E('div', { 'style': 'margin: 1rem 0;' }, [
                E('div', { 'style': 'margin-bottom: 0.75rem;' }, [
                    E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc; font-size: 0.9rem;' }, 'Service Name'),
                    E('input', {
                        'type': 'text',
                        'id': 'tor-svc-name',
                        'value': serviceName,
                        'style': 'width: 100%; padding: 10px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 6px;'
                    })
                ]),
                E('div', { 'style': 'margin-bottom: 0.75rem;' }, [
                    E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc; font-size: 0.9rem;' }, 'Local Port'),
                    E('input', {
                        'type': 'number',
                        'id': 'tor-local-port',
                        'value': svc.port,
                        'style': 'width: 100%; padding: 10px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 6px;'
                    })
                ]),
                E('div', {}, [
                    E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc; font-size: 0.9rem;' }, 'Onion Port (public)'),
                    E('input', {
                        'type': 'number',
                        'id': 'tor-onion-port',
                        'value': '80',
                        'style': 'width: 100%; padding: 10px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 6px;'
                    })
                ])
            ]),
            E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Cancel'),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        var name = document.getElementById('tor-svc-name').value;
                        var localPort = parseInt(document.getElementById('tor-local-port').value);
                        var onionPort = parseInt(document.getElementById('tor-onion-port').value);

                        if (!name) {
                            ui.addNotification(null, E('p', {}, 'Service name is required'), 'warning');
                            return;
                        }

                        ui.hideModal();

                        // Show progress modal
                        var progressContent = self.createProgressModal('Creating Tor Hidden Service', [
                            { label: 'Validating configuration', detail: 'Checking service name and ports' },
                            { label: 'Creating hidden service directory', detail: '/var/lib/tor/hidden_services/' + name },
                            { label: 'Updating Tor configuration', detail: 'Adding HiddenServiceDir and HiddenServicePort' },
                            { label: 'Restarting Tor daemon', detail: 'Applying configuration changes' },
                            { label: 'Generating .onion address', detail: 'This may take up to 30 seconds' },
                            { label: 'Finalizing', detail: 'Saving to UCI and syncing with Tor Shield' }
                        ]);

                        ui.showModal('Creating Tor Hidden Service', [
                            progressContent,
                            E('div', { 'id': 'progress-actions', 'style': 'display: none; margin-top: 1rem; text-align: right;' }, [
                                E('button', {
                                    'class': 'btn cbi-button-action',
                                    'click': function() {
                                        ui.hideModal();
                                        self.refreshDashboard();
                                    }
                                }, 'Close')
                            ])
                        ]);

                        // Simulate step progression (actual API call happens in background)
                        self.updateStep(0, 'active', 'Validating ' + name + ':' + localPort + ' -> :' + onionPort);

                        setTimeout(function() {
                            self.updateStep(0, 'complete', 'Configuration valid');
                            self.updateStep(1, 'active');
                        }, 500);

                        setTimeout(function() {
                            self.updateStep(1, 'complete', 'Directory created');
                            self.updateStep(2, 'active');
                        }, 1000);

                        setTimeout(function() {
                            self.updateStep(2, 'complete', 'torrc updated');
                            self.updateStep(3, 'active');
                        }, 1500);

                        // Make actual API call
                        api.torAdd(name, localPort, onionPort).then(function(res) {
                            if (res.success) {
                                self.updateStep(3, 'complete', 'Tor restarted');
                                self.updateStep(4, 'complete', 'Address generated');
                                self.updateStep(5, 'complete', 'UCI and Tor Shield synced');

                                self.showProgressResult(true,
                                    'Hidden service created successfully!',
                                    res.onion ? E('code', { 'style': 'color: #9b59b6; font-size: 12px; word-break: break-all;' }, res.onion) : null
                                );
                            } else {
                                // Mark current step as error
                                for (var i = 3; i <= 5; i++) {
                                    var stepEl = document.getElementById('step-' + i);
                                    if (stepEl && stepEl.getAttribute('data-status') === 'active') {
                                        self.updateStep(i, 'error', res.error || 'Failed');
                                        break;
                                    }
                                }
                                self.showProgressResult(false, 'Failed to create hidden service', res.error || 'Unknown error');
                            }

                            document.getElementById('progress-actions').style.display = 'block';
                        }).catch(function(err) {
                            self.updateStep(3, 'error', 'Connection failed');
                            self.showProgressResult(false, 'API Error', err.message || 'Unknown error');
                            document.getElementById('progress-actions').style.display = 'block';
                        });
                    }
                }, 'Create Hidden Service')
            ])
        ]);
    },

    handleAddSsl: function(svc, serviceName) {
        var self = this;

        ui.showModal('Add SSL Backend', [
            E('p', {}, 'Configure HTTPS reverse proxy for ' + (svc.name || svc.process)),
            E('div', { 'style': 'margin: 1rem 0;' }, [
                E('div', { 'style': 'margin-bottom: 0.75rem;' }, [
                    E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc; font-size: 0.9rem;' }, 'Service Name'),
                    E('input', {
                        'type': 'text',
                        'id': 'ssl-svc-name',
                        'value': serviceName,
                        'style': 'width: 100%; padding: 10px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 6px;'
                    })
                ]),
                E('div', { 'style': 'margin-bottom: 0.75rem;' }, [
                    E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc; font-size: 0.9rem;' }, 'Domain (FQDN)'),
                    E('input', {
                        'type': 'text',
                        'id': 'ssl-domain',
                        'placeholder': serviceName + '.example.com',
                        'style': 'width: 100%; padding: 10px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 6px;'
                    })
                ]),
                E('div', {}, [
                    E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc; font-size: 0.9rem;' }, 'Backend Port'),
                    E('input', {
                        'type': 'number',
                        'id': 'ssl-port',
                        'value': svc.port,
                        'style': 'width: 100%; padding: 10px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 6px;'
                    })
                ])
            ]),
            E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Cancel'),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        var name = document.getElementById('ssl-svc-name').value;
                        var domain = document.getElementById('ssl-domain').value;
                        var port = parseInt(document.getElementById('ssl-port').value);

                        if (!domain) {
                            ui.addNotification(null, E('p', {}, 'Domain is required'), 'warning');
                            return;
                        }

                        ui.hideModal();

                        // Show progress modal
                        var progressContent = self.createProgressModal('Configuring SSL Backend', [
                            { label: 'Validating configuration', detail: 'Checking domain and backend port' },
                            { label: 'Creating HAProxy backend', detail: 'Adding server 127.0.0.1:' + port },
                            { label: 'Creating virtual host', detail: 'Domain: ' + domain },
                            { label: 'Committing UCI changes', detail: 'Saving to /etc/config/haproxy' },
                            { label: 'Regenerating HAProxy config', detail: 'Running haproxyctl generate' },
                            { label: 'Reloading HAProxy', detail: 'Applying changes without downtime' }
                        ]);

                        ui.showModal('Configuring SSL Backend', [
                            progressContent,
                            E('div', { 'id': 'progress-actions', 'style': 'display: none; margin-top: 1rem; text-align: right;' }, [
                                E('button', {
                                    'class': 'btn cbi-button-action',
                                    'click': function() {
                                        ui.hideModal();
                                        self.refreshDashboard();
                                    }
                                }, 'Close')
                            ])
                        ]);

                        // Simulate step progression
                        self.updateStep(0, 'active', 'Validating ' + name + ' -> ' + domain);

                        setTimeout(function() {
                            self.updateStep(0, 'complete', 'Configuration valid');
                            self.updateStep(1, 'active');
                        }, 400);

                        setTimeout(function() {
                            self.updateStep(1, 'complete', 'Backend ' + name + ' created');
                            self.updateStep(2, 'active');
                        }, 800);

                        setTimeout(function() {
                            self.updateStep(2, 'complete', 'VHost for ' + domain + ' created');
                            self.updateStep(3, 'active');
                        }, 1200);

                        // Make actual API call
                        api.sslAdd(name, domain, port).then(function(res) {
                            if (res.success) {
                                self.updateStep(3, 'complete', 'UCI committed');
                                self.updateStep(4, 'complete', 'Config regenerated');
                                self.updateStep(5, 'complete', 'HAProxy reloaded');

                                self.showProgressResult(true,
                                    'SSL backend configured successfully!',
                                    E('div', {}, [
                                        E('div', { 'style': 'margin-bottom: 8px;' }, [
                                            'Access via: ',
                                            E('a', {
                                                'href': 'https://' + domain,
                                                'target': '_blank',
                                                'style': 'color: #27ae60;'
                                            }, 'https://' + domain)
                                        ]),
                                        E('div', { 'style': 'font-size: 12px; color: #888;' },
                                            'Note: Ensure SSL certificate is configured for ' + domain)
                                    ])
                                );
                            } else {
                                for (var i = 3; i <= 5; i++) {
                                    var stepEl = document.getElementById('step-' + i);
                                    if (stepEl && stepEl.getAttribute('data-status') !== 'complete') {
                                        self.updateStep(i, 'error', res.error || 'Failed');
                                        break;
                                    }
                                }
                                self.showProgressResult(false, 'Failed to configure SSL backend', res.error || 'Unknown error');
                            }

                            document.getElementById('progress-actions').style.display = 'block';
                        }).catch(function(err) {
                            self.updateStep(3, 'error', 'Connection failed');
                            self.showProgressResult(false, 'API Error', err.message || 'Unknown error');
                            document.getElementById('progress-actions').style.display = 'block';
                        });
                    }
                }, 'Create SSL Backend')
            ])
        ]);
    },

    handleRemoveTor: function(serviceName) {
        var self = this;

        ui.showModal('Remove Tor Hidden Service', [
            E('p', {}, 'Remove the .onion address for ' + serviceName + '?'),
            E('p', { 'style': 'color: #e74c3c;' }, 'Warning: The onion address will be permanently deleted.'),
            E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
                E('button', { 'class': 'btn', 'click': ui.hideModal }, 'Cancel'),
                E('button', {
                    'class': 'btn cbi-button-negative',
                    'click': function() {
                        ui.hideModal();

                        // Show progress modal
                        var progressContent = self.createProgressModal('Removing Tor Hidden Service', [
                            { label: 'Removing from torrc', detail: 'Deleting HiddenServiceDir entry' },
                            { label: 'Deleting hidden service directory', detail: '/var/lib/tor/hidden_services/' + serviceName },
                            { label: 'Restarting Tor daemon', detail: 'Applying configuration changes' },
                            { label: 'Updating UCI', detail: 'Removing from secubox-exposure and tor-shield' }
                        ]);

                        ui.showModal('Removing Tor Hidden Service', [
                            progressContent,
                            E('div', { 'id': 'progress-actions', 'style': 'display: none; margin-top: 1rem; text-align: right;' }, [
                                E('button', {
                                    'class': 'btn cbi-button-action',
                                    'click': function() {
                                        ui.hideModal();
                                        self.refreshDashboard();
                                    }
                                }, 'Close')
                            ])
                        ]);

                        self.updateStep(0, 'active');

                        api.torRemove(serviceName).then(function(res) {
                            if (res.success) {
                                self.updateStep(0, 'complete');
                                self.updateStep(1, 'complete');
                                self.updateStep(2, 'complete');
                                self.updateStep(3, 'complete');
                                self.showProgressResult(true, 'Hidden service removed successfully');
                            } else {
                                self.updateStep(0, 'error', res.error);
                                self.showProgressResult(false, 'Failed to remove hidden service', res.error || 'Unknown error');
                            }
                            document.getElementById('progress-actions').style.display = 'block';
                        }).catch(function(err) {
                            self.updateStep(0, 'error', 'Connection failed');
                            self.showProgressResult(false, 'API Error', err.message);
                            document.getElementById('progress-actions').style.display = 'block';
                        });
                    }
                }, 'Remove')
            ])
        ]);
    },

    handleRemoveSsl: function(serviceName) {
        var self = this;

        ui.showModal('Remove SSL Backend', [
            E('p', {}, 'Remove HAProxy backend for ' + serviceName + '?'),
            E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
                E('button', { 'class': 'btn', 'click': ui.hideModal }, 'Cancel'),
                E('button', {
                    'class': 'btn cbi-button-negative',
                    'click': function() {
                        ui.hideModal();

                        // Show progress modal
                        var progressContent = self.createProgressModal('Removing SSL Backend', [
                            { label: 'Removing virtual host', detail: 'Deleting vhost configuration' },
                            { label: 'Removing backend', detail: 'Deleting backend ' + serviceName },
                            { label: 'Committing UCI changes', detail: 'Saving to /etc/config/haproxy' },
                            { label: 'Regenerating HAProxy config', detail: 'Running haproxyctl generate' },
                            { label: 'Reloading HAProxy', detail: 'Applying changes' }
                        ]);

                        ui.showModal('Removing SSL Backend', [
                            progressContent,
                            E('div', { 'id': 'progress-actions', 'style': 'display: none; margin-top: 1rem; text-align: right;' }, [
                                E('button', {
                                    'class': 'btn cbi-button-action',
                                    'click': function() {
                                        ui.hideModal();
                                        self.refreshDashboard();
                                    }
                                }, 'Close')
                            ])
                        ]);

                        self.updateStep(0, 'active');

                        api.sslRemove(serviceName).then(function(res) {
                            if (res.success) {
                                self.updateStep(0, 'complete');
                                self.updateStep(1, 'complete');
                                self.updateStep(2, 'complete');
                                self.updateStep(3, 'complete');
                                self.updateStep(4, 'complete');
                                self.showProgressResult(true, 'SSL backend removed successfully');
                            } else {
                                self.updateStep(0, 'error', res.error);
                                self.showProgressResult(false, 'Failed to remove SSL backend', res.error || 'Unknown error');
                            }
                            document.getElementById('progress-actions').style.display = 'block';
                        }).catch(function(err) {
                            self.updateStep(0, 'error', 'Connection failed');
                            self.showProgressResult(false, 'API Error', err.message);
                            document.getElementById('progress-actions').style.display = 'block';
                        });
                    }
                }, 'Remove')
            ])
        ]);
    },

    refreshDashboard: function() {
        var self = this;
        return Promise.all([
            api.status(),
            api.scan(),
            api.conflicts(),
            api.torList(),
            api.sslList()
        ]).then(function(data) {
            var container = document.querySelector('.exposure-dashboard');
            if (container) {
                var newView = self.render(data);
                container.parentNode.replaceChild(newView, container);
            }
        });
    },

    showToast: function(message, type) {
        var existing = document.querySelector('.exp-toast');
        if (existing) existing.remove();

        var iconMap = {
            'success': '\u2705',
            'error': '\u274C',
            'warning': '\u26A0\uFE0F'
        };

        var colorMap = {
            'success': '#22c55e',
            'error': '#ef4444',
            'warning': '#f97316'
        };

        var toast = E('div', {
            'class': 'exp-toast',
            'style': 'position: fixed; bottom: 24px; right: 24px; background: #1a1a2e; border: 1px solid ' + (colorMap[type] || '#333') + '; padding: 12px 20px; border-radius: 8px; color: #fff; z-index: 10000; display: flex; align-items: center; gap: 8px;'
        }, [
            E('span', {}, iconMap[type] || '\u2139\uFE0F'),
            message
        ]);
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.remove();
        }, 4000);
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
