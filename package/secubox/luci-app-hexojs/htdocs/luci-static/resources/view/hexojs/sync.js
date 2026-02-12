'use strict';
'require view';
'require ui';
'require rpc';
'require hexojs/api as api';
'require secubox/kiss-theme';

var callGiteaStatus = rpc.declare({
	object: 'luci.hexojs',
	method: 'gitea_status',
	expect: {}
});

var callGiteaSync = rpc.declare({
	object: 'luci.hexojs',
	method: 'gitea_sync',
	expect: {}
});

var callGiteaClone = rpc.declare({
	object: 'luci.hexojs',
	method: 'gitea_clone',
	expect: {}
});

var callGiteaSaveConfig = rpc.declare({
	object: 'luci.hexojs',
	method: 'gitea_save_config',
	params: ['enabled', 'gitea_url', 'gitea_user', 'gitea_token', 'content_repo', 'content_branch', 'auto_sync']
});

var callBuild = rpc.declare({
	object: 'luci.hexojs',
	method: 'generate',
	expect: {}
});

var callPublishToWww = rpc.declare({
	object: 'luci.hexojs',
	method: 'publish_to_www',
	params: ['path'],
	expect: {}
});

return view.extend({
	title: _('Content Sync'),
	wizardStep: 0,

	load: function() {
		return Promise.all([
			api.getGitSyncData(),
			callGiteaStatus()
		]);
	},

	// ============================================
	// Wizard Actions
	// ============================================

	handleClone: function() {
		var self = this;
		var repo = document.querySelector('#git-repo').value;
		var branch = document.querySelector('#git-branch').value || 'main';

		if (!repo) {
			ui.addNotification(null, E('p', _('Repository URL is required')), 'error');
			return;
		}

		ui.showModal(_('Cloning Repository'), [
			E('p', { 'class': 'spinning' }, _('Cloning from GitHub. This may take a moment...'))
		]);

		api.gitClone(repo, branch).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Repository cloned successfully!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Clone failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleInit: function() {
		var self = this;
		var repo = document.querySelector('#git-repo-init').value;
		var branch = document.querySelector('#git-branch-init').value || 'main';

		if (!repo) {
			ui.addNotification(null, E('p', _('Repository URL is required')), 'error');
			return;
		}

		ui.showModal(_('Initializing Repository'), [
			E('p', { 'class': 'spinning' }, _('Initializing git and setting remote...'))
		]);

		api.gitInit(repo, branch).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Repository initialized!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Init failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handlePull: function() {
		ui.showModal(_('Pulling Changes'), [
			E('p', { 'class': 'spinning' }, _('Pulling latest changes from remote...'))
		]);

		api.gitPull().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Pull successful!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Pull failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handlePush: function() {
		var self = this;
		var message = document.querySelector('#git-commit-msg').value;

		ui.showModal(_('Pushing Changes'), [
			E('p', { 'class': 'spinning' }, _('Committing and pushing changes to remote...'))
		]);

		api.gitPush(message, false).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Push successful!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Push failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleFetch: function() {
		ui.showModal(_('Fetching'), [
			E('p', { 'class': 'spinning' }, _('Fetching updates from remote...'))
		]);

		api.gitFetch().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Fetch complete!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Fetch failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleReset: function(hard) {
		var self = this;

		if (hard) {
			ui.showModal(_('Confirm Reset'), [
				E('p', {}, _('This will discard ALL local changes. Are you sure?')),
				E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
					E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
					E('button', {
						'class': 'btn cbi-button-negative',
						'style': 'margin-left: 8px;',
						'click': function() {
							ui.showModal(_('Resetting'), [
								E('p', { 'class': 'spinning' }, _('Discarding all local changes...'))
							]);
							api.gitReset(true).then(function(result) {
								ui.hideModal();
								if (result.success) {
									ui.addNotification(null, E('p', _('Reset complete!')), 'info');
									location.reload();
								} else {
									ui.addNotification(null, E('p', result.error || _('Reset failed')), 'error');
								}
							});
						}
					}, _('Reset'))
				])
			]);
		} else {
			api.gitReset(false).then(function(result) {
				if (result.success) {
					ui.addNotification(null, E('p', _('Changes unstaged')), 'info');
					location.reload();
				}
			});
		}
	},

	handleSaveCredentials: function() {
		var name = document.querySelector('#git-name').value;
		var email = document.querySelector('#git-email').value;

		api.gitSetCredentials(name, email).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Git credentials saved!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed')), 'error');
			}
		});
	},

	// ============================================
	// Build & Publish Actions
	// ============================================

	handleBuild: function() {
		ui.showModal(_('Building Site'), [
			E('p', { 'class': 'spinning' }, _('Generating static files...'))
		]);

		callBuild().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Site built successfully!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Build failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handlePublish: function() {
		var self = this;
		var path = document.querySelector('#publish-path');
		var publishPath = path ? path.value : '/www/blog';

		ui.showModal(_('Publishing Site'), [
			E('p', { 'class': 'spinning' }, _('Building and publishing to %s...').format(publishPath))
		]);

		callPublishToWww(publishPath).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Published to %s!').format(result.path || publishPath)), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Publish failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	// ============================================
	// Gitea Actions
	// ============================================

	handleGiteaSync: function() {
		ui.showModal(_('Syncing from Gitea'), [
			E('p', { 'class': 'spinning' }, _('Pulling content from Gitea...'))
		]);

		callGiteaSync().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Content synced from Gitea!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Sync failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleGiteaClone: function() {
		ui.showModal(_('Cloning from Gitea'), [
			E('p', { 'class': 'spinning' }, _('Cloning content repository from Gitea...'))
		]);

		callGiteaClone().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Content cloned from Gitea!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Clone failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleGiteaSaveConfig: function() {
		var enabled = document.querySelector('#gitea-enabled').checked ? '1' : '0';
		var url = document.querySelector('#gitea-url').value;
		var user = document.querySelector('#gitea-user').value;
		var token = document.querySelector('#gitea-token').value;
		var repo = document.querySelector('#gitea-repo').value;
		var branch = document.querySelector('#gitea-branch').value || 'main';

		callGiteaSaveConfig(enabled, url, user, token, repo, branch, '0').then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Gitea configuration saved!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Save failed')), 'error');
			}
		});
	},

	// ============================================
	// Render
	// ============================================

	render: function(data) {
		var self = this;
		var gitData = data[0] || {};
		var giteaStatus = data[1] || {};
		var status = gitData.status || {};
		var credentials = gitData.credentials || {};
		var commits = gitData.commits || [];
		var isRepo = status.is_repo;

		var view = E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDD04'),
					_('Content Sync')
				]),
				isRepo ? E('div', { 'class': 'hexo-status-badge ' + (status.ahead > 0 ? 'warning' : 'running') }, [
					E('span', { 'class': 'hexo-status-dot' }),
					status.branch || 'main'
				]) : ''
			]),

			// Build & Publish Card
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, [
						E('span', { 'style': 'margin-right: 8px;' }, '\uD83D\uDE80'),
						_('Build & Publish')
					])
				]),
				E('p', { 'style': 'margin-bottom: 16px; color: var(--hexo-text-muted);' },
					_('Build static files and publish to web server.')),
				E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
					// Build Section
					E('div', { 'class': 'hexo-card', 'style': 'background: var(--hexo-bg-input);' }, [
						E('h4', { 'style': 'margin-bottom: 8px;' }, ['\uD83D\uDD28 ', _('Build')]),
						E('p', { 'style': 'font-size: 13px; color: var(--hexo-text-muted); margin-bottom: 12px;' },
							_('Generate static HTML files from your content.')),
						E('button', {
							'class': 'hexo-btn hexo-btn-primary',
							'click': function() { self.handleBuild(); }
						}, _('Build Site'))
					]),
					// Publish Section
					E('div', { 'class': 'hexo-card', 'style': 'background: var(--hexo-bg-input);' }, [
						E('h4', { 'style': 'margin-bottom: 8px;' }, ['\uD83C\uDF10 ', _('Publish')]),
						E('p', { 'style': 'font-size: 13px; color: var(--hexo-text-muted); margin-bottom: 12px;' },
							_('Copy built files to web server directory.')),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin-bottom: 8px;' }, [
							E('input', {
								'type': 'text',
								'id': 'publish-path',
								'class': 'hexo-input',
								'value': '/www/blog',
								'placeholder': '/www/blog'
							})
						]),
						E('button', {
							'class': 'hexo-btn hexo-btn-success',
							'click': function() { self.handlePublish(); }
						}, _('Publish to Web'))
					])
				])
			]),

			// Gitea Integration Card
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, [
						E('span', { 'style': 'margin-right: 8px;' }, '\uD83E\uDD8A'),
						_('Gitea Content Sync')
					]),
					giteaStatus.enabled ? E('div', { 'class': 'hexo-status-badge running' }, [
						E('span', { 'class': 'hexo-status-dot' }),
						_('Enabled')
					]) : E('div', { 'class': 'hexo-status-badge stopped' }, [
						E('span', { 'class': 'hexo-status-dot' }),
						_('Disabled')
					])
				]),
				E('p', { 'style': 'margin-bottom: 16px; color: var(--hexo-text-muted);' },
					_('Sync blog content from your local Gitea server.')),

				// Gitea Status
				giteaStatus.has_local_repo ? E('div', { 'style': 'background: var(--hexo-bg-input); padding: 12px; border-radius: 8px; margin-bottom: 16px;' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;' }, [
						E('div', {}, [
							E('div', { 'style': 'font-size: 11px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Repository')),
							E('div', { 'style': 'font-size: 14px;' }, giteaStatus.content_repo || '-')
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 11px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Branch')),
							E('div', { 'style': 'font-size: 14px;' }, giteaStatus.local_branch || '-')
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 11px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Last Commit')),
							E('div', { 'style': 'font-size: 13px;' }, giteaStatus.last_commit || '-')
						])
					])
				]) : '',

				// Gitea Actions
				E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;' }, [
					giteaStatus.has_local_repo ?
						E('button', {
							'class': 'hexo-btn hexo-btn-primary',
							'click': function() { self.handleGiteaSync(); },
							'disabled': !giteaStatus.enabled
						}, ['\uD83D\uDD04 ', _('Sync from Gitea')]) :
						E('button', {
							'class': 'hexo-btn hexo-btn-success',
							'click': function() { self.handleGiteaClone(); },
							'disabled': !giteaStatus.enabled
						}, ['\uD83D\uDCE5 ', _('Clone from Gitea')])
				]),

				// Gitea Config Form
				E('details', { 'style': 'margin-top: 8px;' }, [
					E('summary', { 'style': 'cursor: pointer; color: var(--hexo-primary);' }, _('Configure Gitea Connection')),
					E('div', { 'style': 'margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;' }, [
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
								E('input', {
									'type': 'checkbox',
									'id': 'gitea-enabled',
									'checked': giteaStatus.enabled
								}),
								_('Enable Gitea Sync')
							])
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Gitea URL')),
							E('input', {
								'type': 'text',
								'id': 'gitea-url',
								'class': 'hexo-input',
								'value': giteaStatus.gitea_url || '',
								'placeholder': 'http://192.168.255.1:3000'
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Username')),
							E('input', {
								'type': 'text',
								'id': 'gitea-user',
								'class': 'hexo-input',
								'value': giteaStatus.gitea_user || '',
								'placeholder': 'admin'
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Access Token')),
							E('input', {
								'type': 'password',
								'id': 'gitea-token',
								'class': 'hexo-input',
								'placeholder': _('Gitea access token')
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Content Repository')),
							E('input', {
								'type': 'text',
								'id': 'gitea-repo',
								'class': 'hexo-input',
								'value': giteaStatus.content_repo || '',
								'placeholder': 'blog-content'
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Branch')),
							E('input', {
								'type': 'text',
								'id': 'gitea-branch',
								'class': 'hexo-input',
								'value': giteaStatus.content_branch || 'main',
								'placeholder': 'main'
							})
						])
					]),
					E('button', {
						'class': 'hexo-btn hexo-btn-secondary',
						'style': 'margin-top: 12px;',
						'click': function() { self.handleGiteaSaveConfig(); }
					}, _('Save Gitea Config'))
				])
			]),

			// Divider
			E('div', { 'style': 'border-top: 1px solid var(--hexo-border); margin: 24px 0;' }),

			// GitHub Sync Header
			E('div', { 'class': 'hexo-card-title', 'style': 'margin-bottom: 16px;' }, [
				E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDC19'),
				_('GitHub / Git Sync')
			]),

			// Setup Wizard (shown if not a repo)
			!isRepo ? E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Setup GitHub Sync'))
				]),
				E('p', { 'style': 'margin-bottom: 20px; color: var(--hexo-text-muted);' },
					_('Connect your Hexo site to a GitHub repository for version control and backup.')),

				// Option 1: Clone existing repo
				E('div', { 'class': 'hexo-card', 'style': 'background: var(--hexo-bg-input); margin-bottom: 16px;' }, [
					E('h4', { 'style': 'margin-bottom: 12px;' }, [
						'\uD83D\uDCE5 ', _('Option 1: Clone Existing Repository')
					]),
					E('p', { 'style': 'font-size: 13px; color: var(--hexo-text-muted); margin-bottom: 12px;' },
						_('Download an existing Hexo site from GitHub. This will replace your current site.')),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: end;' }, [
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Repository URL')),
							E('input', {
								'type': 'text',
								'id': 'git-repo',
								'class': 'hexo-input',
								'placeholder': 'https://github.com/username/repo.git'
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0; width: 120px;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Branch')),
							E('input', {
								'type': 'text',
								'id': 'git-branch',
								'class': 'hexo-input',
								'value': 'main',
								'placeholder': 'main'
							})
						]),
						E('button', {
							'class': 'hexo-btn hexo-btn-primary',
							'style': 'height: 40px;',
							'click': function() { self.handleClone(); }
						}, _('Clone'))
					])
				]),

				// Option 2: Initialize for existing site
				E('div', { 'class': 'hexo-card', 'style': 'background: var(--hexo-bg-input);' }, [
					E('h4', { 'style': 'margin-bottom: 12px;' }, [
						'\uD83D\uDCE4 ', _('Option 2: Push Existing Site to GitHub')
					]),
					E('p', { 'style': 'font-size: 13px; color: var(--hexo-text-muted); margin-bottom: 12px;' },
						_('Create a new repository on GitHub first, then connect your existing site to it.')),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: end;' }, [
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Repository URL')),
							E('input', {
								'type': 'text',
								'id': 'git-repo-init',
								'class': 'hexo-input',
								'placeholder': 'git@github.com:username/repo.git'
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0; width: 120px;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Branch')),
							E('input', {
								'type': 'text',
								'id': 'git-branch-init',
								'class': 'hexo-input',
								'value': 'main',
								'placeholder': 'main'
							})
						]),
						E('button', {
							'class': 'hexo-btn hexo-btn-success',
							'style': 'height: 40px;',
							'click': function() { self.handleInit(); }
						}, _('Initialize'))
					])
				])
			]) : '',

			// Sync Dashboard (shown when repo exists)
			isRepo ? E('div', {}, [
				// Status Card
				E('div', { 'class': 'hexo-card' }, [
					E('div', { 'class': 'hexo-card-header' }, [
						E('div', { 'class': 'hexo-card-title' }, _('Repository Status')),
						E('button', {
							'class': 'hexo-btn hexo-btn-sm hexo-btn-secondary',
							'click': function() { self.handleFetch(); }
						}, ['\uD83D\uDD04 ', _('Refresh')])
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;' }, [
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Remote')),
							E('div', { 'style': 'font-size: 14px; word-break: break-all;' }, status.remote || _('Not configured'))
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Branch')),
							E('div', { 'style': 'font-size: 14px;' }, status.branch || '-')
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Modified')),
							E('div', { 'style': 'font-size: 14px;' }, (status.modified || 0) + ' ' + _('files'))
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Untracked')),
							E('div', { 'style': 'font-size: 14px;' }, (status.untracked || 0) + ' ' + _('files'))
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Ahead/Behind')),
							E('div', { 'style': 'font-size: 14px;' }, [
								E('span', { 'style': status.ahead > 0 ? 'color: var(--hexo-warning);' : '' }, '\u2191' + (status.ahead || 0)),
								' / ',
								E('span', { 'style': status.behind > 0 ? 'color: var(--hexo-primary);' : '' }, '\u2193' + (status.behind || 0))
							])
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Last Commit')),
							E('div', { 'style': 'font-size: 13px;' }, status.last_commit || '-')
						])
					])
				]),

				// Sync Actions
				E('div', { 'class': 'hexo-card' }, [
					E('div', { 'class': 'hexo-card-header' }, [
						E('div', { 'class': 'hexo-card-title' }, _('Sync Actions'))
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
						// Pull Section
						E('div', { 'class': 'hexo-card', 'style': 'background: var(--hexo-bg-input);' }, [
							E('h4', { 'style': 'margin-bottom: 8px;' }, ['\u2B07 ', _('Pull Changes')]),
							E('p', { 'style': 'font-size: 13px; color: var(--hexo-text-muted); margin-bottom: 12px;' },
								_('Download latest changes from GitHub.')),
							E('button', {
								'class': 'hexo-btn hexo-btn-primary',
								'click': function() { self.handlePull(); },
								'disabled': !status.remote
							}, _('Pull'))
						]),

						// Push Section
						E('div', { 'class': 'hexo-card', 'style': 'background: var(--hexo-bg-input);' }, [
							E('h4', { 'style': 'margin-bottom: 8px;' }, ['\u2B06 ', _('Push Changes')]),
							E('p', { 'style': 'font-size: 13px; color: var(--hexo-text-muted); margin-bottom: 12px;' },
								_('Upload your changes to GitHub.')),
							E('div', { 'class': 'hexo-form-group', 'style': 'margin-bottom: 8px;' }, [
								E('input', {
									'type': 'text',
									'id': 'git-commit-msg',
									'class': 'hexo-input',
									'placeholder': _('Commit message (optional)')
								})
							]),
							E('button', {
								'class': 'hexo-btn hexo-btn-success',
								'click': function() { self.handlePush(); },
								'disabled': !status.remote
							}, _('Commit & Push'))
						])
					])
				]),

				// Git Credentials
				E('div', { 'class': 'hexo-card' }, [
					E('div', { 'class': 'hexo-card-header' }, [
						E('div', { 'class': 'hexo-card-title' }, _('Git Identity'))
					]),
					E('p', { 'style': 'margin-bottom: 12px; color: var(--hexo-text-muted);' },
						_('Configure your git identity for commits.')),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end;' }, [
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Name')),
							E('input', {
								'type': 'text',
								'id': 'git-name',
								'class': 'hexo-input',
								'value': credentials.name || '',
								'placeholder': 'Your Name'
							})
						]),
						E('div', { 'class': 'hexo-form-group', 'style': 'margin: 0;' }, [
							E('label', { 'class': 'hexo-form-label' }, _('Email')),
							E('input', {
								'type': 'email',
								'id': 'git-email',
								'class': 'hexo-input',
								'value': credentials.email || '',
								'placeholder': 'you@example.com'
							})
						]),
						E('button', {
							'class': 'hexo-btn hexo-btn-secondary',
							'style': 'height: 40px;',
							'click': function() { self.handleSaveCredentials(); }
						}, _('Save'))
					])
				]),

				// Recent Commits
				commits.length > 0 ? E('div', { 'class': 'hexo-card' }, [
					E('div', { 'class': 'hexo-card-header' }, [
						E('div', { 'class': 'hexo-card-title' }, _('Recent Commits'))
					]),
					E('div', { 'class': 'hexo-commits' },
						commits.slice(0, 10).map(function(commit) {
							return E('div', { 'class': 'hexo-commit', 'style': 'padding: 8px 0; border-bottom: 1px solid var(--hexo-border);' }, [
								E('code', { 'style': 'color: var(--hexo-primary); margin-right: 8px;' }, commit.hash),
								E('span', {}, commit.message)
							]);
						})
					)
				]) : '',

				// Danger Zone
				E('div', { 'class': 'hexo-card', 'style': 'border-color: var(--hexo-danger);' }, [
					E('div', { 'class': 'hexo-card-header' }, [
						E('div', { 'class': 'hexo-card-title', 'style': 'color: var(--hexo-danger);' }, [
							'\u26A0 ', _('Danger Zone')
						])
					]),
					E('p', { 'style': 'margin-bottom: 12px; color: var(--hexo-text-muted);' },
						_('These actions can cause data loss. Use with caution.')),
					E('div', { 'class': 'hexo-actions' }, [
						E('button', {
							'class': 'hexo-btn hexo-btn-secondary',
							'click': function() { self.handleReset(false); }
						}, _('Unstage All')),
						E('button', {
							'class': 'hexo-btn hexo-btn-danger',
							'click': function() { self.handleReset(true); }
						}, _('Discard All Changes'))
					])
				])
			]) : '',

			// SSH Key Info
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, ['\uD83D\uDD11 ', _('SSH Key Setup')])
				]),
				E('p', { 'style': 'color: var(--hexo-text-muted); font-size: 13px;' },
					_('For private repositories, add your SSH public key to GitHub. Generate a key on your router with:')),
				E('pre', { 'style': 'background: var(--hexo-bg-input); padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 13px;' },
					'ssh-keygen -t ed25519 -C "your@email.com"\ncat ~/.ssh/id_ed25519.pub'),
				E('p', { 'style': 'color: var(--hexo-text-muted); font-size: 13px; margin-top: 8px;' }, [
					_('Then add this key to '),
					E('a', { 'href': 'https://github.com/settings/keys', 'target': '_blank' }, 'GitHub Settings > SSH Keys')
				])
			])
		]);

		return KissTheme.wrap([view], 'admin/services/hexojs/sync');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
