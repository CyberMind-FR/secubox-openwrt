'use strict';
'require view';
'require ui';
'require hexojs/api as api';

return view.extend({
	title: _('GitHub Sync'),
	wizardStep: 0,

	load: function() {
		return api.getGitSyncData();
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
	// Render
	// ============================================

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var credentials = data.credentials || {};
		var commits = data.commits || [];
		var isRepo = status.is_repo;

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDD04'),
					_('GitHub Sync')
				]),
				isRepo ? E('div', { 'class': 'hexo-status-badge ' + (status.ahead > 0 ? 'warning' : 'running') }, [
					E('span', { 'class': 'hexo-status-dot' }),
					status.branch || 'main'
				]) : ''
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
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
