'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/components as Components';
'require ui';
'require poll';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme as KissTheme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var ADMIN_NAV = [
	{ id: 'dashboard', icon: '🎛️', label: 'Control Panel' },
	{ id: 'cyber-dashboard', icon: '🔮', label: 'Cyber Console' },
	{ id: 'apps', icon: '📦', label: 'Apps Manager' },
	{ id: 'profiles', icon: '📋', label: 'Profiles' },
	{ id: 'skills', icon: '🎯', label: 'Skills' },
	{ id: 'catalog-sources', icon: '📚', label: 'Catalog' },
	{ id: 'feedback', icon: '💬', label: 'Feedback' },
	{ id: 'health', icon: '💚', label: 'Health' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

var ISSUE_TYPES = [
	{ value: 'bug', label: 'Bug', icon: '🐛', color: '#ef4444' },
	{ value: 'feature', label: 'Feature Request', icon: '✨', color: '#8b5cf6' },
	{ value: 'docs', label: 'Documentation', icon: '📚', color: '#3b82f6' },
	{ value: 'question', label: 'Question', icon: '❓', color: '#f59e0b' }
];

function renderAdminNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

function getIssueType(typeValue) {
	return ISSUE_TYPES.find(function(t) { return t.value === typeValue; }) || ISSUE_TYPES[0];
}

return view.extend({
	load: function() {
		return Promise.all([
			API.listIssues(null).catch(function() { return { issues: [] }; }),
			API.getApps().catch(function() { return []; })
		]).then(function(results) {
			return {
				issues: results[0].issues || [],
				apps: results[1] || []
			};
		});
	},

	render: function(data) {
		var issues = data.issues || [];
		var apps = data.apps || [];
		var self = this;

		// Categorize issues
		var openIssues = issues.filter(function(i) { return i.status === 'open'; });
		var resolvedIssues = issues.filter(function(i) { return i.status === 'resolved'; });

		var container = E('div', { 'class': 'cyberpunk-mode secubox-feedback' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			// Header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '💬 FEEDBACK CENTER'),
				E('div', { 'class': 'cyber-header-subtitle' },
					'Report issues, share resolutions, and help improve SecuBox')
			]),

			// Stats panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'OVERVIEW')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-stats-grid' }, [
						E('div', { 'class': 'cyber-stat-card' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '📝'),
							E('div', { 'class': 'cyber-stat-value' }, issues.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Total Issues')
						]),
						E('div', { 'class': 'cyber-stat-card', 'style': 'border-left-color: #f59e0b;' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '🔓'),
							E('div', { 'class': 'cyber-stat-value' }, openIssues.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Open')
						]),
						E('div', { 'class': 'cyber-stat-card', 'style': 'border-left-color: #10b981;' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '✅'),
							E('div', { 'class': 'cyber-stat-value' }, resolvedIssues.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Resolved')
						]),
						E('div', { 'class': 'cyber-stat-card', 'style': 'border-left-color: #8b5cf6;' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '💡'),
							E('div', { 'class': 'cyber-stat-value' }, resolvedIssues.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Resolutions')
						])
					])
				])
			]),

			// Actions bar
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap;' }, [
						E('button', {
							'class': 'cyber-btn primary',
							'click': function() { self.showReportDialog(apps); }
						}, '📝 REPORT ISSUE'),
						E('input', {
							'type': 'text',
							'id': 'resolution-search',
							'placeholder': 'Search resolutions...',
							'style': 'flex: 1; min-width: 200px; padding: 12px 16px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright); font-size: 14px;'
						}),
						E('button', {
							'class': 'cyber-btn',
							'click': function() {
								var query = document.getElementById('resolution-search').value;
								if (query) self.searchResolutions(query);
							}
						}, '🔍 SEARCH')
					])
				])
			]),

			// Open Issues
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'OPEN ISSUES'),
					E('span', { 'class': 'cyber-badge', 'style': 'background: rgba(245, 158, 11, 0.2); color: #f59e0b;' }, openIssues.length)
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					openIssues.length > 0 ?
						E('div', { 'id': 'open-issues-list', 'style': 'display: flex; flex-direction: column; gap: 10px;' },
							openIssues.map(function(issue) {
								return self.renderIssueCard(issue, apps);
							})
						) :
						E('div', { 'style': 'text-align: center; padding: 30px; color: var(--cyber-text-dim);' }, [
							E('div', { 'style': 'font-size: 36px; margin-bottom: 15px;' }, '✅'),
							E('div', {}, 'No open issues'),
							E('div', { 'style': 'font-size: 12px; margin-top: 10px;' }, 'All issues have been resolved!')
						])
				])
			]),

			// Resolved Issues / Knowledge Base
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'KNOWLEDGE BASE'),
					E('span', { 'class': 'cyber-badge', 'style': 'background: rgba(16, 185, 129, 0.2); color: #10b981;' }, resolvedIssues.length + ' resolutions')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					resolvedIssues.length > 0 ?
						E('div', { 'id': 'resolved-issues-list', 'style': 'display: flex; flex-direction: column; gap: 10px;' },
							resolvedIssues.map(function(issue) {
								return self.renderResolutionCard(issue, apps);
							})
						) :
						E('div', { 'style': 'text-align: center; padding: 30px; color: var(--cyber-text-dim);' }, [
							E('div', { 'style': 'font-size: 36px; margin-bottom: 15px;' }, '💡'),
							E('div', {}, 'No resolutions yet'),
							E('div', { 'style': 'font-size: 12px; margin-top: 10px;' },
								'Resolved issues with solutions will appear here')
						])
				])
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('feedback'));
		wrapper.appendChild(container);
		return KissTheme.wrap([wrapper], 'admin/secubox/admin/feedback');
	},

	renderIssueCard: function(issue, apps) {
		var self = this;
		var issueType = getIssueType(issue.type);
		var appName = issue.app_id || 'Unknown';

		// Try to find app name
		var app = apps.find(function(a) { return a.id === issue.app_id; });
		if (app) appName = app.name || app.id;

		return E('div', {
			'class': 'issue-card',
			'style': 'background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 10px; padding: 15px;'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
					E('span', { 'style': 'font-size: 20px;' }, issueType.icon),
					E('div', {}, [
						E('div', { 'style': 'font-weight: 600; color: var(--cyber-text-bright);' }, issue.summary || 'No summary'),
						E('div', { 'style': 'font-size: 12px; color: var(--cyber-text-dim);' }, [
							E('span', { 'style': 'color: ' + issueType.color + ';' }, issueType.label),
							' • ',
							E('span', {}, appName),
							' • ',
							E('span', {}, issue.created || 'Unknown date')
						])
					])
				]),
				E('span', {
					'class': 'cyber-badge',
					'style': 'background: rgba(245, 158, 11, 0.2); color: #f59e0b;'
				}, 'OPEN')
			]),
			issue.description ? E('div', {
				'style': 'color: var(--cyber-text-dim); font-size: 13px; margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px;'
			}, issue.description) : null,
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', {
					'class': 'cyber-btn primary',
					'style': 'font-size: 12px; padding: 8px 12px;',
					'click': function() { self.showResolveDialog(issue); }
				}, '✅ Resolve'),
				E('button', {
					'class': 'cyber-btn',
					'style': 'font-size: 12px; padding: 8px 12px;',
					'click': function() { self.showIssueDetails(issue); }
				}, '👁️ Details')
			])
		]);
	},

	renderResolutionCard: function(issue, apps) {
		var self = this;
		var issueType = getIssueType(issue.type);
		var appName = issue.app_id || 'Unknown';

		var app = apps.find(function(a) { return a.id === issue.app_id; });
		if (app) appName = app.name || app.id;

		return E('div', {
			'class': 'resolution-card',
			'style': 'background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px; padding: 15px;'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
					E('span', { 'style': 'font-size: 20px;' }, '💡'),
					E('div', {}, [
						E('div', { 'style': 'font-weight: 600; color: var(--cyber-text-bright);' }, issue.summary || 'No summary'),
						E('div', { 'style': 'font-size: 12px; color: var(--cyber-text-dim);' }, [
							E('span', { 'style': 'color: ' + issueType.color + ';' }, issueType.label),
							' • ',
							E('span', {}, appName),
							' • ',
							E('span', {}, 'Resolved: ' + (issue.resolved_at || 'Unknown'))
						])
					])
				]),
				E('span', {
					'class': 'cyber-badge',
					'style': 'background: rgba(16, 185, 129, 0.2); color: #10b981;'
				}, 'RESOLVED')
			]),
			issue.resolution ? E('div', {
				'style': 'color: #10b981; font-size: 13px; margin-bottom: 10px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; border-left: 3px solid #10b981;'
			}, [
				E('strong', {}, 'Resolution: '),
				issue.resolution
			]) : null,
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', {
					'class': 'cyber-btn',
					'style': 'font-size: 12px; padding: 8px 12px;',
					'click': function() { self.showIssueDetails(issue); }
				}, '👁️ View Details'),
				E('button', {
					'class': 'cyber-btn',
					'style': 'font-size: 12px; padding: 8px 12px;',
					'click': function() { self.copyResolution(issue); }
				}, '📋 Copy')
			])
		]);
	},

	showReportDialog: function(apps) {
		var self = this;

		// Build app options
		var appOptions = apps.map(function(app) {
			return E('option', { 'value': app.id }, app.name || app.id);
		});
		appOptions.unshift(E('option', { 'value': '' }, '-- Select App --'));

		// Build type options
		var typeOptions = ISSUE_TYPES.map(function(type) {
			return E('option', { 'value': type.value }, type.icon + ' ' + type.label);
		});

		var content = [
			E('h3', { 'style': 'margin-bottom: 20px; color: var(--cyber-text-bright);' }, '📝 Report New Issue'),

			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim); font-size: 12px;' }, 'APP'),
				E('select', {
					'id': 'report-app-id',
					'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: var(--cyber-text-bright);'
				}, appOptions)
			]),

			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim); font-size: 12px;' }, 'TYPE'),
				E('select', {
					'id': 'report-type',
					'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: var(--cyber-text-bright);'
				}, typeOptions)
			]),

			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim); font-size: 12px;' }, 'SUMMARY'),
				E('input', {
					'id': 'report-summary',
					'type': 'text',
					'placeholder': 'Brief description of the issue...',
					'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: var(--cyber-text-bright);'
				})
			]),

			E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim); font-size: 12px;' }, 'DESCRIPTION (optional)'),
				E('textarea', {
					'id': 'report-description',
					'rows': 4,
					'placeholder': 'Detailed description, steps to reproduce, etc...',
					'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: var(--cyber-text-bright); resize: vertical;'
				})
			]),

			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() { self.submitReport(); }
				}, 'Submit Report'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		];

		ui.showModal('Report Issue', content);
	},

	submitReport: function() {
		var appId = document.getElementById('report-app-id').value;
		var type = document.getElementById('report-type').value;
		var summary = document.getElementById('report-summary').value;
		var description = document.getElementById('report-description').value;

		if (!appId || !summary) {
			ui.addNotification(null, E('p', 'Please select an app and provide a summary'), 'error');
			return;
		}

		ui.showModal('Submitting Report', [
			Components.renderLoader('Submitting issue report...')
		]);

		API.reportIssue(appId, type, summary, description).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Issue reported successfully! ID: ' + (result.issue_id || 'N/A')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed to submit report: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error submitting report: ' + err.message), 'error');
		});
	},

	showResolveDialog: function(issue) {
		var self = this;

		var content = [
			E('h3', { 'style': 'margin-bottom: 15px; color: var(--cyber-text-bright);' }, '✅ Resolve Issue'),
			E('div', {
				'style': 'background: rgba(99, 102, 241, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px;'
			}, [
				E('div', { 'style': 'font-weight: 600; color: var(--cyber-text-bright);' }, issue.summary),
				E('div', { 'style': 'font-size: 12px; color: var(--cyber-text-dim); margin-top: 5px;' },
					'App: ' + issue.app_id + ' • ID: ' + issue.id)
			]),

			E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim); font-size: 12px;' }, 'RESOLUTION'),
				E('textarea', {
					'id': 'resolve-description',
					'rows': 4,
					'placeholder': 'Describe how you fixed this issue...',
					'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: var(--cyber-text-bright); resize: vertical;'
				})
			]),

			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() { self.submitResolution(issue.id); }
				}, 'Submit Resolution'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		];

		ui.showModal('Resolve Issue', content);
	},

	submitResolution: function(issueId) {
		var resolution = document.getElementById('resolve-description').value;

		if (!resolution) {
			ui.addNotification(null, E('p', 'Please describe the resolution'), 'error');
			return;
		}

		ui.showModal('Submitting Resolution', [
			Components.renderLoader('Saving resolution...')
		]);

		API.resolveIssue(issueId, resolution).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Issue resolved successfully!'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed to resolve issue: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error resolving issue: ' + err.message), 'error');
		});
	},

	showIssueDetails: function(issue) {
		var issueType = getIssueType(issue.type);

		var content = [
			E('div', { 'style': 'display: flex; align-items: center; gap: 10px; margin-bottom: 20px;' }, [
				E('span', { 'style': 'font-size: 24px;' }, issueType.icon),
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; color: var(--cyber-text-bright);' }, issue.summary || 'No summary'),
					E('div', { 'style': 'font-size: 12px; color: var(--cyber-text-dim);' }, 'ID: ' + issue.id)
				])
			]),

			E('div', { 'style': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 3px;' }, 'APP'),
					E('div', { 'style': 'color: var(--cyber-text-bright);' }, issue.app_id || 'Unknown')
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 3px;' }, 'TYPE'),
					E('div', { 'style': 'color: ' + issueType.color + ';' }, issueType.label)
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 3px;' }, 'STATUS'),
					E('span', {
						'class': 'cyber-badge',
						'style': issue.status === 'resolved' ?
							'background: rgba(16, 185, 129, 0.2); color: #10b981;' :
							'background: rgba(245, 158, 11, 0.2); color: #f59e0b;'
					}, (issue.status || 'open').toUpperCase())
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 3px;' }, 'CREATED'),
					E('div', { 'style': 'color: var(--cyber-text-bright);' }, issue.created || 'Unknown')
				])
			]),

			issue.description ? E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 5px;' }, 'DESCRIPTION'),
				E('div', {
					'style': 'padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; color: var(--cyber-text-bright);'
				}, issue.description)
			]) : null,

			issue.resolution ? E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 5px;' }, 'RESOLUTION'),
				E('div', {
					'style': 'padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 8px; color: #10b981;'
				}, issue.resolution)
			]) : null,

			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Close')
			])
		];

		ui.showModal('Issue Details', content);
	},

	searchResolutions: function(query) {
		var self = this;
		ui.showModal('Searching', [
			Components.renderLoader('Searching resolutions for: "' + query + '"...')
		]);

		API.searchResolutions(query).then(function(result) {
			ui.hideModal();
			var results = result.results || [];

			var content = [
				E('h3', { 'style': 'margin-bottom: 15px; color: var(--cyber-text-bright);' },
					'🔍 Search Results for "' + query + '"'),
				E('div', { 'style': 'color: var(--cyber-text-dim); margin-bottom: 20px; font-size: 12px;' },
					results.length + ' result(s) found')
			];

			if (results.length > 0) {
				content.push(E('div', { 'style': 'max-height: 400px; overflow-y: auto;' },
					results.map(function(item) {
						return E('div', {
							'style': 'padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; margin-bottom: 10px;'
						}, [
							E('div', { 'style': 'font-weight: 600; color: var(--cyber-text-bright); margin-bottom: 5px;' },
								item.summary || 'No summary'),
							E('div', { 'style': 'font-size: 12px; color: var(--cyber-text-dim); margin-bottom: 8px;' },
								'App: ' + (item.app_id || 'Unknown') + ' • ' + (item.type || 'bug')),
							item.resolution ? E('div', {
								'style': 'padding: 8px; background: rgba(16, 185, 129, 0.1); border-left: 2px solid #10b981; border-radius: 4px; color: #10b981; font-size: 13px;'
							}, item.resolution) : null
						]);
					})
				));
			} else {
				content.push(E('div', { 'style': 'text-align: center; padding: 30px; color: var(--cyber-text-dim);' }, [
					E('div', { 'style': 'font-size: 36px; margin-bottom: 15px;' }, '🔍'),
					E('div', {}, 'No resolutions found'),
					E('div', { 'style': 'font-size: 12px; margin-top: 10px;' }, 'Try different keywords')
				]));
			}

			content.push(E('div', { 'style': 'display: flex; gap: 10px; margin-top: 20px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Close')
			]));

			ui.showModal('Search Results', content);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Search error: ' + err.message), 'error');
		});
	},

	copyResolution: function(issue) {
		var text = 'Issue: ' + (issue.summary || 'N/A') + '\n' +
			'App: ' + (issue.app_id || 'Unknown') + '\n' +
			'Resolution: ' + (issue.resolution || 'N/A');

		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(function() {
				ui.addNotification(null, E('p', 'Resolution copied to clipboard!'), 'success');
			}).catch(function() {
				ui.addNotification(null, E('p', 'Failed to copy to clipboard'), 'error');
			});
		} else {
			// Fallback for older browsers
			var textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			ui.addNotification(null, E('p', 'Resolution copied to clipboard!'), 'success');
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
