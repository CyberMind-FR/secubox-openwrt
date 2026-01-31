'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/components as Components';
'require secubox-admin/data-utils as DataUtils';
'require ui';
'require poll';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

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

return view.extend({
	load: function() {
		return API.listProfiles().then(function(result) {
			return { profiles: result.profiles || [] };
		}).catch(function(err) {
			console.error('[PROFILES] Load error:', err);
			return { profiles: [] };
		});
	},

	render: function(data) {
		var profiles = data.profiles || [];
		var self = this;

		var container = E('div', { 'class': 'cyberpunk-mode secubox-profiles' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			// Header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '📋 CONFIGURATION PROFILES'),
				E('div', { 'class': 'cyber-header-subtitle' },
					'Export, import, and share configuration profiles · ' + profiles.length + ' profiles available')
			]),

			// Stats panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'PROFILE SYSTEM')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-stats-grid' }, [
						E('div', { 'class': 'cyber-stat-card' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '📋'),
							E('div', { 'class': 'cyber-stat-value' }, profiles.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Total Profiles')
						]),
						E('div', { 'class': 'cyber-stat-card accent' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '📡'),
							E('div', { 'class': 'cyber-stat-value' }, profiles.filter(function(p) {
								return p.feed_sources && p.feed_sources.length > 0;
							}).length),
							E('div', { 'class': 'cyber-stat-label' }, 'With Feeds')
						]),
						E('div', { 'class': 'cyber-stat-card warning' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '🎯'),
							E('div', { 'class': 'cyber-stat-value' }, profiles.filter(function(p) {
								return p.skills_required && p.skills_required.length > 0;
							}).length),
							E('div', { 'class': 'cyber-stat-label' }, 'With Skills')
						])
					])
				])
			]),

			// Quick actions
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'QUICK ACTIONS')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-quick-actions' }, [
						E('button', {
							'class': 'cyber-action-btn',
							'click': function() { self.showExportDialog(); }
						}, [
							E('span', { 'class': 'cyber-action-icon' }, '📤'),
							E('span', { 'class': 'cyber-action-label' }, 'EXPORT CURRENT CONFIG'),
							E('span', { 'class': 'cyber-action-arrow' }, '→')
						]),
						E('button', {
							'class': 'cyber-action-btn',
							'click': function() { self.showImportDialog(); }
						}, [
							E('span', { 'class': 'cyber-action-icon' }, '📥'),
							E('span', { 'class': 'cyber-action-label' }, 'IMPORT PROFILE'),
							E('span', { 'class': 'cyber-action-arrow' }, '→')
						])
					])
				])
			]),

			// Profiles list
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'AVAILABLE PROFILES')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-list', 'id': 'profiles-container' },
						profiles.length > 0 ?
							profiles.map(function(profile) {
								return self.renderProfileCard(profile);
							}) :
							[E('div', { 'style': 'text-align: center; padding: 40px; color: var(--cyber-text-dim);' }, [
								E('div', { 'style': 'font-size: 48px; margin-bottom: 20px;' }, '📋'),
								E('div', {}, 'No profiles found'),
								E('div', { 'style': 'font-size: 12px; margin-top: 10px;' },
									'Export your current configuration to create a profile')
							])]
					)
				])
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('profiles'));
		wrapper.appendChild(container);
		return wrapper;
	},

	renderProfileCard: function(profile) {
		var self = this;
		var profileData = profile.profile || profile;
		var id = profileData.id || profileData.name || 'unknown';
		var name = profileData.name || id;
		var description = profileData.description || '';

		var modules = profile.modules || {};
		var requiredCount = (modules.required || []).length;
		var recommendedCount = (modules.recommended || []).length;

		var hasFeeds = profile.feed_sources && profile.feed_sources.length > 0;
		var hasSkills = profile.skills_required && profile.skills_required.length > 0;

		return E('div', { 'class': 'cyber-list-item', 'data-profile': id }, [
			E('div', { 'class': 'cyber-list-icon' }, '📋'),
			E('div', { 'class': 'cyber-list-content' }, [
				E('div', { 'class': 'cyber-list-title' }, [
					name.toUpperCase(),
					' ',
					hasFeeds ? E('span', { 'class': 'cyber-badge', 'style': 'background: rgba(6, 182, 212, 0.2); color: #06b6d4;' }, 'FEEDS') : null,
					' ',
					hasSkills ? E('span', { 'class': 'cyber-badge', 'style': 'background: rgba(245, 158, 11, 0.2); color: #f59e0b;' }, 'SKILLS') : null
				]),
				E('div', { 'class': 'cyber-list-meta' }, [
					E('span', { 'class': 'cyber-list-meta-item' }, [
						'📦 ' + requiredCount + ' required'
					]),
					recommendedCount > 0 ? E('span', { 'class': 'cyber-list-meta-item' }, [
						'✨ ' + recommendedCount + ' recommended'
					]) : null,
					hasFeeds ? E('span', { 'class': 'cyber-list-meta-item' }, [
						'📡 ' + profile.feed_sources.length + ' feeds'
					]) : null,
					hasSkills ? E('span', { 'class': 'cyber-list-meta-item' }, [
						'🎯 ' + profile.skills_required.length + ' skills'
					]) : null
				]),
				description ? E('div', { 'style': 'color: var(--cyber-text-dim); font-size: 12px; margin-top: 5px;' }, description) : null
			]),
			E('div', { 'class': 'cyber-list-actions' }, [
				E('button', {
					'class': 'cyber-btn primary',
					'click': function() { self.applyProfile(id); }
				}, '▶ APPLY'),
				E('button', {
					'class': 'cyber-btn',
					'click': function() { self.viewProfile(profile); }
				}, '👁️ VIEW'),
				E('button', {
					'class': 'cyber-btn',
					'click': function() { self.shareProfile(profile); }
				}, '🔗 SHARE')
			])
		]);
	},

	showExportDialog: function() {
		var self = this;
		var nameInput = E('input', {
			'type': 'text',
			'placeholder': 'My Configuration',
			'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright);'
		});

		var includeFeedsCheckbox = E('input', {
			'type': 'checkbox',
			'id': 'include-feeds',
			'checked': true
		});

		ui.showModal('Export Configuration Profile', [
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim);' }, 'Profile Name'),
				nameInput
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 10px; cursor: pointer;' }, [
					includeFeedsCheckbox,
					E('span', {}, 'Include feed sources in export')
				])
			]),
			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var name = nameInput.value || 'Exported Configuration';
						var includeFeeds = includeFeedsCheckbox.checked;
						self.exportProfile(name, includeFeeds);
					}
				}, 'Export'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		]);
	},

	showImportDialog: function() {
		var self = this;
		var urlInput = E('input', {
			'type': 'text',
			'placeholder': 'https://example.com/profile.json or local file path',
			'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright);'
		});

		var modeSelect = E('select', {
			'style': 'width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright);'
		}, [
			E('option', { 'value': '--merge' }, 'Merge (add to existing)'),
			E('option', { 'value': '--replace' }, 'Replace (overwrite existing)')
		]);

		ui.showModal('Import Configuration Profile', [
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim);' }, 'Profile URL or File Path'),
				urlInput
			]),
			E('div', { 'style': 'margin-bottom: 15px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 5px; color: var(--cyber-text-dim);' }, 'Import Mode'),
				modeSelect
			]),
			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var url = urlInput.value;
						var mode = modeSelect.value;
						if (url) {
							self.importProfile(url, mode);
						}
					}
				}, 'Import'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		]);
	},

	exportProfile: function(name, includeFeeds) {
		var self = this;
		ui.showModal('Exporting Profile', [
			Components.renderLoader('Exporting configuration...')
		]);

		API.exportProfile(name, includeFeeds).then(function(result) {
			ui.hideModal();
			if (result && result.profile) {
				// Show the exported JSON
				var jsonStr = JSON.stringify(result, null, 2);
				ui.showModal('Profile Exported', [
					E('p', { 'style': 'color: var(--cyber-text-dim); margin-bottom: 15px;' },
						'Your configuration has been exported. Copy the JSON below or download it.'),
					E('textarea', {
						'style': 'width: 100%; height: 300px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright); font-family: monospace; font-size: 12px;',
						'readonly': true
					}, jsonStr),
					E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'click': function() {
								navigator.clipboard.writeText(jsonStr).then(function() {
									ui.addNotification(null, E('p', 'Copied to clipboard!'), 'success');
								});
							}
						}, 'Copy to Clipboard'),
						E('button', {
							'class': 'cbi-button',
							'click': function() {
								var blob = new Blob([jsonStr], { type: 'application/json' });
								var url = URL.createObjectURL(blob);
								var a = document.createElement('a');
								a.href = url;
								a.download = name.toLowerCase().replace(/\s+/g, '-') + '.json';
								a.click();
								URL.revokeObjectURL(url);
							}
						}, 'Download'),
						E('button', {
							'class': 'cbi-button',
							'click': function() { ui.hideModal(); }
						}, 'Close')
					])
				]);
			} else {
				ui.addNotification(null, E('p', 'Export failed'), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Export error: ' + err.message), 'error');
		});
	},

	importProfile: function(url, mode) {
		var self = this;
		ui.showModal('Importing Profile', [
			Components.renderLoader('Importing profile...')
		]);

		API.importProfile(url, mode).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Profile imported successfully!'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Import failed: ' + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Import error: ' + err.message), 'error');
		});
	},

	applyProfile: function(profileId) {
		var self = this;
		ui.showModal('Apply Profile', [
			E('p', {}, 'Are you sure you want to apply profile: ' + profileId + '?'),
			E('p', { 'style': 'color: var(--cyber-text-dim); font-size: 12px;' },
				'This will install required modules and apply UCI configuration changes.'),
			E('div', { 'style': 'display: flex; gap: 10px; margin-top: 20px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						ui.showModal('Applying Profile', [
							Components.renderLoader('Applying profile: ' + profileId + '...')
						]);

						API.applyProfile(profileId, false).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', 'Profile applied successfully!'), 'success');
							} else {
								ui.addNotification(null, E('p', 'Apply failed: ' + (result.error || result.message || 'Unknown error')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Apply error: ' + err.message), 'error');
						});
					}
				}, 'Apply'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		]);
	},

	viewProfile: function(profile) {
		var jsonStr = JSON.stringify(profile, null, 2);
		ui.showModal('Profile Details', [
			E('textarea', {
				'style': 'width: 100%; height: 400px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright); font-family: monospace; font-size: 12px;',
				'readonly': true
			}, jsonStr),
			E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Close')
			])
		]);
	},

	shareProfile: function(profile) {
		var profileData = profile.profile || profile;
		var id = profileData.id || 'unknown';

		ui.showModal('Share Profile', [
			E('p', { 'style': 'margin-bottom: 15px; color: var(--cyber-text-dim);' },
				'To share this profile, host the JSON file on a web server and share the URL.'),
			E('div', { 'style': 'background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;' }, [
				E('p', { 'style': 'color: var(--cyber-text-bright); margin-bottom: 10px;' }, 'Import command:'),
				E('code', { 'style': 'word-break: break-all; font-size: 12px; color: var(--cyber-accent-cyan);' },
					'secubox profile import <your-url>/' + id + '.json')
			]),
			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Close')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
