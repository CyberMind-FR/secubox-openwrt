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
		var repoCount = this.repos.length;

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
		color = color || '#3498db';
		return E('div', { 'style': 'background:#e0e0e0; border-radius:10px; height:20px; overflow:hidden; position:relative;' }, [
			E('div', {
				'style': 'background:' + color + '; height:100%; width:' + percent + '%; transition:width 0.5s ease;'
			}),
			E('span', {
				'style': 'position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-weight:bold; font-size:12px; color:#333;'
			}, percent + '%')
		]);
	},

	renderMilestoneProgress: function() {
		var self = this;
		var progress = this.calculateProgress();

		var progressColor = progress < 50 ? '#e74c3c' : (progress < 80 ? '#f39c12' : '#27ae60');

		return E('div', { 'class': 'cbi-section', 'style': 'margin-bottom:1.5em;' }, [
			E('div', { 'style': 'display:flex; align-items:center; gap:1em; margin-bottom:1em;' }, [
				E('h3', { 'style': 'margin:0;' }, _('Progress to v1.0')),
				E('span', {
					'style': 'background:' + progressColor + '; color:white; padding:4px 12px; border-radius:20px; font-weight:bold;'
				}, progress + '%')
			]),
			this.renderProgressBar(progress, progressColor),
			E('div', { 'style': 'display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:1em; margin-top:1.5em;' },
				this.milestones.map(function(m) {
					var pct = m.target > 0 ? Math.round((Math.min(m.current, m.target) / m.target) * 100) : 0;
					var color = m.complete ? '#27ae60' : (pct > 50 ? '#f39c12' : '#3498db');
					return E('div', {
						'style': 'background:#f8f9fa; padding:1em; border-radius:8px; border-left:4px solid ' + color + ';'
					}, [
						E('div', { 'style': 'display:flex; justify-content:space-between; align-items:center;' }, [
							E('span', { 'style': 'font-weight:500;' }, m.name),
							m.complete ?
								E('span', { 'style': 'color:#27ae60; font-size:14px;' }, '✓') :
								E('span', { 'style': 'color:#888; font-size:12px;' }, m.current + '/' + m.target)
						]),
						E('div', { 'style': 'margin-top:8px;' }, self.renderProgressBar(pct, color))
					]);
				})
			)
		]);
	},

	renderStatsCards: function() {
		var stats = [
			{ label: 'Local Packages', value: this.packages.local, color: '#27ae60', icon: '📦' },
			{ label: 'Peer Packages', value: this.packages.peer, color: '#3498db', icon: '🌐' },
			{ label: 'Gitea Repos', value: this.repos.length, color: '#9b59b6', icon: '📂' },
			{ label: 'Recent Commits', value: this.commits.length, color: '#e67e22', icon: '📝' }
		];

		return E('div', { 'style': 'display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:1em; margin-bottom:1.5em;' },
			stats.map(function(s) {
				return E('div', {
					'style': 'background:linear-gradient(135deg, ' + s.color + '22, ' + s.color + '11); ' +
						'padding:1.5em; border-radius:12px; text-align:center; border:1px solid ' + s.color + '33;'
				}, [
					E('div', { 'style': 'font-size:28px; margin-bottom:4px;' }, s.icon),
					E('div', { 'style': 'font-size:32px; font-weight:bold; color:' + s.color + ';' }, String(s.value)),
					E('div', { 'style': 'color:#666; font-size:13px;' }, s.label)
				]);
			})
		);
	},

	renderCommitLog: function() {
		var self = this;

		if (!this.giteaConnected) {
			return E('div', { 'style': 'text-align:center; padding:2em; color:#888;' }, [
				E('div', { 'style': 'font-size:48px; margin-bottom:0.5em;' }, '🔌'),
				E('p', {}, _('Gitea not connected')),
				E('p', { 'style': 'font-size:12px;' }, _('Configure Gitea in MirrorBox > Hub settings'))
			]);
		}

		if (this.commits.length === 0) {
			return E('p', { 'style': 'color:#888; text-align:center;' }, _('No recent commits'));
		}

		return E('div', { 'style': 'max-height:400px; overflow-y:auto;' },
			this.commits.slice(0, 15).map(function(commit) {
				var msg = commit.message || commit.commit_message || '';
				var shortMsg = msg.split('\n')[0];
				if (shortMsg.length > 60) shortMsg = shortMsg.substring(0, 57) + '...';

				var author = commit.author || commit.committer || {};
				var authorName = author.name || author.login || 'Unknown';
				var date = commit.created || commit.committed_date || commit.date;

				return E('div', {
					'style': 'padding:12px; border-bottom:1px solid #eee; display:flex; gap:12px;'
				}, [
					E('div', {
						'style': 'width:40px; height:40px; background:#3498db; border-radius:50%; display:flex; ' +
							'align-items:center; justify-content:center; color:white; font-weight:bold; flex-shrink:0;'
					}, authorName.charAt(0).toUpperCase()),
					E('div', { 'style': 'flex:1; min-width:0;' }, [
						E('div', { 'style': 'font-weight:500; margin-bottom:4px;' }, shortMsg),
						E('div', { 'style': 'color:#888; font-size:12px;' }, [
							E('span', {}, authorName),
							E('span', { 'style': 'margin:0 8px;' }, '•'),
							E('span', {}, self.formatTimeAgo(date))
						])
					])
				]);
			})
		);
	},

	renderRepoList: function() {
		if (this.repos.length === 0) {
			return E('p', { 'style': 'color:#888; text-align:center;' }, _('No repositories'));
		}

		return E('div', { 'style': 'display:flex; flex-wrap:wrap; gap:8px;' },
			this.repos.slice(0, 10).map(function(repo) {
				var name = repo.name || repo.full_name || 'Unknown';
				return E('span', {
					'style': 'background:#f0f0f0; padding:6px 12px; border-radius:16px; font-size:13px;'
				}, '📁 ' + name);
			})
		);
	},

	render: function() {
		var self = this;

		if (this.loading) {
			var loadingContent = E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, _('Development Status')),
				E('p', { 'class': 'spinning' }, _('Loading development data...'))
			]);
			return KissTheme.wrap(loadingContent, 'admin/secubox/p2p/devstatus');
		}

		// Start polling
		poll.add(function() {
			return self.load().then(function() {
				dom.content(document.getElementById('devstatus-content'), self.renderContent());
			});
		}, this.refreshInterval);

		var content = E('div', { 'class': 'cbi-map' }, [
			E('div', { 'style': 'display:flex; justify-content:space-between; align-items:center; margin-bottom:1em;' }, [
				E('h2', { 'style': 'margin:0;' }, _('Development Status')),
				E('span', {
					'style': 'background:#3498db; color:white; padding:6px 16px; border-radius:20px; font-size:13px;'
				}, '🚀 SecuBox v0.17.0 → v1.0')
			]),
			E('p', { 'style': 'color:#666; margin-bottom:1.5em;' },
				_('Real-time development progress from Gitea and MirrorBox App Store')),
			E('div', { 'id': 'devstatus-content' }, this.renderContent())
		]);

		return KissTheme.wrap(content, 'admin/secubox/p2p/devstatus');
	},

	renderContent: function() {
		return E('div', {}, [
			this.renderMilestoneProgress(),
			this.renderStatsCards(),
			E('div', { 'style': 'display:grid; grid-template-columns:1fr 1fr; gap:1.5em;' }, [
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Recent Commits')),
					this.renderCommitLog()
				]),
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Repositories')),
					this.renderRepoList(),
					E('hr', { 'style': 'margin:1em 0; border:none; border-top:1px solid #eee;' }),
					E('h4', { 'style': 'margin-top:1em;' }, _('Feed Sources')),
					E('p', { 'style': 'color:#888;' },
						this.packages.sources + ' sources providing ' + this.packages.unique + ' unique packages'
					)
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
