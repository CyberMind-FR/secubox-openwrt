'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

/**
 * SecuBox Development Status Widget
 * Generative and dynamic dashboard showing:
 * - Gitea commit activity
 * - MirrorBox App Store stats
 * - Progress toward v1.0 (0-100%)
 */

return view.extend({
	// State
	commits: [],
	repos: [],
	packages: { local: 0, peer: 0, unique: 0, sources: 0 },
	giteaConnected: false,
	loading: true,
	refreshInterval: 30000,

	// v1.0 Milestones - features required for 1.0 release
	milestones: [
		{ id: 'core', name: 'Core Framework', target: 15, current: 15, complete: true },
		{ id: 'security', name: 'Security Suite', target: 10, current: 10, complete: true },
		{ id: 'network', name: 'Network Tools', target: 8, current: 8, complete: true },
		{ id: 'p2p', name: 'P2P Mesh', target: 12, current: 12, complete: true },
		{ id: 'apps', name: 'App Ecosystem', target: 25, current: 20, complete: false },
		{ id: 'media', name: 'Media Services', target: 5, current: 4, complete: false },
		{ id: 'remote', name: 'Remote Access', target: 3, current: 2, complete: false },
		{ id: 'docs', name: 'Documentation', target: 10, current: 7, complete: false }
	],

	load: function() {
		var self = this;
		self.loading = true;

		return Promise.all([
			P2PAPI.getGiteaCommits(20).catch(function() { return { commits: [] }; }),
			P2PAPI.listGiteaRepos().catch(function() { return { repos: [] }; }),
			P2PAPI.getAllPackages().catch(function() { return { sources: [] }; })
		]).then(function(results) {
			// Gitea commits
			var commitResult = results[0] || {};
			self.commits = commitResult.commits || [];
			self.giteaConnected = commitResult.success !== false && self.commits.length > 0;

			// Gitea repos
			var repoResult = results[1] || {};
			self.repos = repoResult.repos || [];

			// Package stats
			var pkgResult = results[2] || {};
			var sources = pkgResult.sources || [];
			var localCount = 0, peerCount = 0, uniqueNames = new Set();

			sources.forEach(function(source) {
				var pkgs = source.packages || [];
				pkgs.forEach(function(p) { uniqueNames.add(p.name); });
				if (source.type === 'local') {
					localCount = source.package_count || pkgs.length;
				} else {
					peerCount += source.package_count || pkgs.length;
				}
			});

			self.packages = {
				local: localCount,
				peer: peerCount,
				unique: uniqueNames.size,
				sources: sources.length
			};

			// Update milestones based on real data
			self.updateMilestones();

			self.loading = false;
		});
	},

	updateMilestones: function() {
		// Dynamically update milestones based on actual data
		var pkgCount = this.packages.local;

		// Apps milestone: based on package count
		var appsMilestone = this.milestones.find(function(m) { return m.id === 'apps'; });
		if (appsMilestone) {
			appsMilestone.current = Math.min(pkgCount, appsMilestone.target);
			appsMilestone.complete = appsMilestone.current >= appsMilestone.target;
		}
	},

	calculateProgress: function() {
		var totalTarget = 0, totalCurrent = 0;
		this.milestones.forEach(function(m) {
			totalTarget += m.target;
			totalCurrent += Math.min(m.current, m.target);
		});
		return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
	},

	formatTimeAgo: function(dateStr) {
		if (!dateStr) return 'Unknown';
		var date = new Date(dateStr);
		var now = new Date();
		var diff = Math.floor((now - date) / 1000);

		if (diff < 60) return diff + 's ago';
		if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
		if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
		if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
		return date.toLocaleDateString();
	},

	renderProgressBar: function(percent, color) {
		return E('div', { 'style': 'background: var(--kiss-bg2); border-radius: 10px; height: 20px; overflow: hidden; position: relative;' }, [
			E('div', {
				'style': 'background: ' + color + '; height: 100%; width: ' + percent + '%; transition: width 0.5s ease;'
			}),
			E('span', {
				'style': 'position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-weight: bold; font-size: 12px; color: var(--kiss-text);'
			}, percent + '%')
		]);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(this.packages.local, 'Local Packages', c.green),
			KissTheme.stat(this.packages.peer, 'Peer Packages', c.blue),
			KissTheme.stat(this.repos.length, 'Gitea Repos', c.purple),
			KissTheme.stat(this.commits.length, 'Recent Commits', c.orange)
		];
	},

	renderMilestoneProgress: function() {
		var self = this;
		var progress = this.calculateProgress();
		var c = KissTheme.colors;

		var progressColor = progress < 50 ? c.red : (progress < 80 ? c.orange : c.green);

		return KissTheme.card(
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				E('span', {}, 'Progress to v1.0'),
				KissTheme.badge(progress + '%', progress < 50 ? 'red' : (progress < 80 ? 'orange' : 'green'))
			]),
			E('div', {}, [
				this.renderProgressBar(progress, progressColor),
				E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-top: 16px;' },
					this.milestones.map(function(m) {
						var pct = m.target > 0 ? Math.round((Math.min(m.current, m.target) / m.target) * 100) : 0;
						var color = m.complete ? c.green : (pct > 50 ? c.orange : c.blue);
						return E('div', {
							'style': 'background: var(--kiss-bg2); padding: 12px; border-radius: 8px; border-left: 4px solid ' + color + ';'
						}, [
							E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
								E('span', { 'style': 'font-weight: 500; color: var(--kiss-text);' }, m.name),
								m.complete ?
									E('span', { 'style': 'color: ' + c.green + '; font-size: 14px;' }, '✓') :
									E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, m.current + '/' + m.target)
							]),
							E('div', { 'style': 'margin-top: 8px;' }, self.renderProgressBar(pct, color))
						]);
					})
				)
			])
		);
	},

	renderCommitLog: function() {
		var self = this;
		var c = KissTheme.colors;

		if (!this.giteaConnected) {
			return E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 8px;' }, '🔌'),
				E('p', {}, _('Gitea not connected')),
				E('p', { 'style': 'font-size: 12px;' }, _('Configure Gitea in MirrorBox > Hub settings'))
			]);
		}

		if (this.commits.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center;' }, _('No recent commits'));
		}

		return E('div', { 'style': 'max-height: 400px; overflow-y: auto;' },
			this.commits.slice(0, 15).map(function(commit) {
				var msg = commit.message || commit.commit_message || '';
				var shortMsg = msg.split('\n')[0];
				if (shortMsg.length > 60) shortMsg = shortMsg.substring(0, 57) + '...';

				var author = commit.author || commit.committer || {};
				var authorName = author.name || author.login || 'Unknown';
				var date = commit.created || commit.committed_date || commit.date;

				return E('div', {
					'style': 'padding: 12px; border-bottom: 1px solid var(--kiss-line); display: flex; gap: 12px;'
				}, [
					E('div', {
						'style': 'width: 40px; height: 40px; background: ' + c.blue + '; border-radius: 50%; display: flex; ' +
							'align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;'
					}, authorName.charAt(0).toUpperCase()),
					E('div', { 'style': 'flex: 1; min-width: 0;' }, [
						E('div', { 'style': 'font-weight: 500; margin-bottom: 4px; color: var(--kiss-text);' }, shortMsg),
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, [
							E('span', {}, authorName),
							E('span', { 'style': 'margin: 0 8px;' }, '•'),
							E('span', {}, self.formatTimeAgo(date))
						])
					])
				]);
			})
		);
	},

	renderRepoList: function() {
		if (this.repos.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center;' }, _('No repositories'));
		}

		return E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
			this.repos.slice(0, 10).map(function(repo) {
				var name = repo.name || repo.full_name || 'Unknown';
				return E('span', {
					'style': 'background: var(--kiss-bg2); padding: 6px 12px; border-radius: 16px; font-size: 13px; color: var(--kiss-text);'
				}, name);
			})
		);
	},

	render: function() {
		var self = this;

		if (this.loading) {
			var content = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Development Status'),
					E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Loading development data...')
				]),
				E('div', { 'style': 'text-align: center; padding: 60px;' }, [
					E('p', { 'class': 'spinning' }, _('Loading...'))
				])
			];
			return KissTheme.wrap(content, 'admin/secubox/p2p/devstatus');
		}

		// Start polling
		poll.add(function() {
			return self.load().then(function() {
				dom.content(document.getElementById('devstatus-content'), self.renderContent());
			});
		}, this.refreshInterval);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Development Status'),
					KissTheme.badge('SecuBox v0.17.0 → v1.0', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Real-time development progress from Gitea and MirrorBox App Store')
			]),

			E('div', { 'id': 'devstatus-content' }, this.renderContent())
		];

		return KissTheme.wrap(content, 'admin/secubox/p2p/devstatus');
	},

	renderContent: function() {
		return E('div', {}, [
			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' },
				this.renderStats()),

			// Milestone Progress
			this.renderMilestoneProgress(),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				KissTheme.card('Recent Commits', this.renderCommitLog()),
				KissTheme.card(
					'Repositories',
					E('div', {}, [
						this.renderRepoList(),
						E('hr', { 'style': 'margin: 16px 0; border: none; border-top: 1px solid var(--kiss-line);' }),
						E('h4', { 'style': 'margin: 0 0 8px 0; color: var(--kiss-text);' }, _('Feed Sources')),
						E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
							this.packages.sources + ' sources providing ' + this.packages.unique + ' unique packages'
						)
					])
				)
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
