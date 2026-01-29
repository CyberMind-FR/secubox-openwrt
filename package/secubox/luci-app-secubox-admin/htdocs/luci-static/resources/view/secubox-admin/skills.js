'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/components as Components';
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
		return API.listSkills().then(function(result) {
			return { skills: result.skills || [] };
		}).catch(function(err) {
			console.error('[SKILLS] Load error:', err);
			return { skills: [] };
		});
	},

	render: function(data) {
		var skills = data.skills || [];
		var self = this;

		// Group skills by provider count
		var wellSupported = skills.filter(function(s) { return s.providers >= 3; });
		var goodSupport = skills.filter(function(s) { return s.providers === 2; });
		var limitedSupport = skills.filter(function(s) { return s.providers === 1; });

		var container = E('div', { 'class': 'cyberpunk-mode secubox-skills' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			// Header
			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '🎯 SKILL BROWSER'),
				E('div', { 'class': 'cyber-header-subtitle' },
					'Discover capabilities and find apps that provide them · ' + skills.length + ' skills available')
			]),

			// Stats panel
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'SKILL OVERVIEW')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'class': 'cyber-stats-grid' }, [
						E('div', { 'class': 'cyber-stat-card' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '🎯'),
							E('div', { 'class': 'cyber-stat-value' }, skills.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Total Skills')
						]),
						E('div', { 'class': 'cyber-stat-card', 'style': 'border-left-color: #10b981;' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '★★★'),
							E('div', { 'class': 'cyber-stat-value' }, wellSupported.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Well Supported')
						]),
						E('div', { 'class': 'cyber-stat-card', 'style': 'border-left-color: #f59e0b;' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '★★☆'),
							E('div', { 'class': 'cyber-stat-value' }, goodSupport.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Good Support')
						]),
						E('div', { 'class': 'cyber-stat-card', 'style': 'border-left-color: #3b82f6;' }, [
							E('div', { 'class': 'cyber-stat-icon' }, '★☆☆'),
							E('div', { 'class': 'cyber-stat-value' }, limitedSupport.length),
							E('div', { 'class': 'cyber-stat-label' }, 'Limited Support')
						])
					])
				])
			]),

			// Search bar
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', { 'style': 'display: flex; gap: 10px;' }, [
						E('input', {
							'type': 'text',
							'id': 'skill-search',
							'placeholder': 'Search skills...',
							'style': 'flex: 1; padding: 12px 16px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: var(--cyber-text-bright); font-size: 14px;',
							'input': function(ev) {
								self.filterSkills(ev.target.value);
							}
						}),
						E('button', {
							'class': 'cyber-btn primary',
							'click': function() { self.checkSystemSkills(); }
						}, '🔍 CHECK SYSTEM')
					])
				])
			]),

			// Skills grid
			E('div', { 'class': 'cyber-panel' }, [
				E('div', { 'class': 'cyber-panel-header' }, [
					E('span', { 'class': 'cyber-panel-title' }, 'AVAILABLE SKILLS')
				]),
				E('div', { 'class': 'cyber-panel-body' }, [
					E('div', {
						'id': 'skills-grid',
						'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;'
					}, skills.length > 0 ?
						skills.map(function(skill) {
							return self.renderSkillCard(skill);
						}) :
						[E('div', { 'style': 'text-align: center; padding: 40px; color: var(--cyber-text-dim); grid-column: 1 / -1;' }, [
							E('div', { 'style': 'font-size: 48px; margin-bottom: 20px;' }, '🎯'),
							E('div', {}, 'No skills found'),
							E('div', { 'style': 'font-size: 12px; margin-top: 10px;' },
								'Skills are discovered from installed app capabilities')
						])]
					)
				])
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('skills'));
		wrapper.appendChild(container);
		return wrapper;
	},

	renderSkillCard: function(skill) {
		var self = this;
		var id = skill.id || 'unknown';
		var displayName = id.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
		var providers = skill.providers || 0;

		// Quality badge
		var qualityBadge;
		var qualityColor;
		if (providers >= 3) {
			qualityBadge = '★★★';
			qualityColor = '#10b981';
		} else if (providers >= 2) {
			qualityBadge = '★★☆';
			qualityColor = '#f59e0b';
		} else {
			qualityBadge = '★☆☆';
			qualityColor = '#3b82f6';
		}

		return E('div', {
			'class': 'skill-card',
			'data-skill': id,
			'style': 'background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 10px; padding: 15px; transition: all 0.3s ease;'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;' }, [
				E('div', { 'style': 'font-weight: 600; color: var(--cyber-text-bright);' }, displayName),
				E('span', { 'style': 'color: ' + qualityColor + '; font-size: 12px;' }, qualityBadge)
			]),
			E('div', { 'style': 'color: var(--cyber-text-dim); font-size: 12px; margin-bottom: 15px;' }, [
				E('span', {}, providers + ' provider' + (providers !== 1 ? 's' : ''))
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', {
					'class': 'cyber-btn',
					'style': 'flex: 1; font-size: 12px; padding: 8px;',
					'click': function() { self.showProviders(id); }
				}, '👁️ Providers'),
				E('button', {
					'class': 'cyber-btn primary',
					'style': 'flex: 1; font-size: 12px; padding: 8px;',
					'click': function() { self.installSkill(id); }
				}, '📥 Install')
			])
		]);
	},

	filterSkills: function(query) {
		var grid = document.getElementById('skills-grid');
		if (!grid) return;

		var cards = grid.querySelectorAll('.skill-card');
		query = query.toLowerCase();

		cards.forEach(function(card) {
			var skillId = card.getAttribute('data-skill') || '';
			if (!query || skillId.toLowerCase().indexOf(query) !== -1) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		});
	},

	showProviders: function(skillId) {
		var self = this;
		ui.showModal('Loading Providers', [
			Components.renderLoader('Finding providers for: ' + skillId + '...')
		]);

		API.getSkillProviders(skillId).then(function(result) {
			var providers = result.providers || [];
			ui.hideModal();

			var content = [
				E('h3', { 'style': 'margin-bottom: 15px; color: var(--cyber-text-bright);' },
					'Providers for: ' + skillId.replace(/-/g, ' '))
			];

			if (providers.length === 0) {
				content.push(E('p', { 'style': 'color: var(--cyber-text-dim);' }, 'No providers found for this skill.'));
			} else {
				content.push(E('div', { 'style': 'max-height: 400px; overflow-y: auto;' },
					providers.map(function(provider) {
						return E('div', {
							'style': 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; margin-bottom: 10px;'
						}, [
							E('div', {}, [
								E('div', { 'style': 'font-weight: 600; color: var(--cyber-text-bright);' }, [
									provider.featured ? E('span', { 'style': 'color: #8b5cf6;' }, '★ ') : null,
									provider.name
								]),
								E('div', { 'style': 'font-size: 12px; color: var(--cyber-text-dim);' }, provider.id),
								E('div', { 'style': 'display: flex; gap: 10px; margin-top: 5px;' }, [
									E('span', {
										'class': 'cyber-badge',
										'style': provider.status === 'stable' ?
											'background: rgba(16, 185, 129, 0.2); color: #10b981;' :
											'background: rgba(245, 158, 11, 0.2); color: #f59e0b;'
									}, (provider.status || 'unknown').toUpperCase()),
									provider.installed ? E('span', {
										'class': 'cyber-badge',
										'style': 'background: rgba(16, 185, 129, 0.2); color: #10b981;'
									}, 'INSTALLED') : null
								])
							]),
							!provider.installed ? E('button', {
								'class': 'cyber-btn primary',
								'style': 'font-size: 12px;',
								'click': function() {
									ui.hideModal();
									self.installProvider(provider.id);
								}
							}, 'Install') : E('span', { 'style': 'color: #10b981;' }, '✓')
						]);
					})
				));
			}

			content.push(E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Close')
			]));

			ui.showModal('Skill Providers', content);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error loading providers: ' + err.message), 'error');
		});
	},

	installSkill: function(skillId) {
		var self = this;
		ui.showModal('Install Skill', [
			E('p', {}, 'Install the best provider for skill: ' + skillId.replace(/-/g, ' ') + '?'),
			E('p', { 'style': 'color: var(--cyber-text-dim); font-size: 12px;' },
				'This will automatically select and install the recommended provider.'),
			E('div', { 'style': 'display: flex; gap: 10px; margin-top: 20px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						ui.showModal('Installing Skill', [
							Components.renderLoader('Installing provider for: ' + skillId + '...')
						]);

						API.installSkill(skillId).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', 'Skill provider installed successfully!'), 'success');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', 'Installation failed: ' + (result.error || 'Unknown error')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Installation error: ' + err.message), 'error');
						});
					}
				}, 'Install'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		]);
	},

	installProvider: function(providerId) {
		ui.showModal('Installing Provider', [
			Components.renderLoader('Installing: ' + providerId + '...')
		]);

		API.installModule(providerId, false).then(function(result) {
			ui.hideModal();
			if (result) {
				ui.addNotification(null, E('p', 'Provider installed successfully!'), 'success');
				window.location.reload();
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Installation error: ' + err.message), 'error');
		});
	},

	checkSystemSkills: function() {
		var self = this;
		ui.showModal('Checking System Skills', [
			Components.renderLoader('Analyzing installed capabilities...')
		]);

		API.checkSkills(null).then(function(result) {
			ui.hideModal();
			// Display results in a modal
			ui.showModal('System Skills', [
				E('p', { 'style': 'color: var(--cyber-text-dim); margin-bottom: 15px;' },
					'Skills available on this system:'),
				E('div', { 'style': 'background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto;' }, [
					E('pre', { 'style': 'color: var(--cyber-text-bright); font-size: 12px; white-space: pre-wrap;' },
						typeof result === 'string' ? result : JSON.stringify(result, null, 2))
				]),
				E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { ui.hideModal(); }
					}, 'Close')
				])
			]);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Check error: ' + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
