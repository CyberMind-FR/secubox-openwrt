'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require gitea.api as api';

return view.extend({
	reposData: null,
	statusData: null,

	load: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.listRepos()
		]).then(function(results) {
			self.statusData = results[0] || {};
			self.reposData = results[1] || {};
			return results;
		});
	},

	render: function() {
		var self = this;

		// Inject CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('gitea/dashboard.css')
		});

		var container = E('div', { 'class': 'gitea-dashboard' }, [
			cssLink,
			this.renderHeader(),
			this.renderContent()
		]);

		// Poll for updates
		poll.add(function() {
			return api.listRepos().then(function(data) {
				self.reposData = data;
				self.updateRepoList();
			});
		}, 30);

		return container;
	},

	renderHeader: function() {
		var repos = this.reposData.repos || [];

		return E('div', { 'class': 'gt-header' }, [
			E('div', { 'class': 'gt-header-content' }, [
				E('div', { 'class': 'gt-logo' }, '\uD83D\uDCE6'),
				E('div', {}, [
					E('h1', { 'class': 'gt-title' }, _('REPOSITORIES')),
					E('p', { 'class': 'gt-subtitle' }, _('Git Repository Browser'))
				]),
				E('div', { 'class': 'gt-status-badge running' }, [
					E('span', {}, '\uD83D\uDCE6'),
					' ' + repos.length + ' ' + _('Repositories')
				])
			])
		]);
	},

	renderContent: function() {
		var repos = this.reposData.repos || [];
		var status = this.statusData;

		if (!status.installed) {
			return E('div', { 'class': 'gt-card' }, [
				E('div', { 'class': 'gt-card-body' }, [
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\uD83D\uDCE6'),
						E('div', {}, _('Gitea is not installed')),
						E('p', {}, _('Install Gitea from the Overview page to manage repositories.'))
					])
				])
			]);
		}

		if (repos.length === 0) {
			return E('div', { 'class': 'gt-card' }, [
				E('div', { 'class': 'gt-card-body' }, [
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\uD83D\uDCED'),
						E('div', {}, _('No repositories found')),
						E('p', {}, _('Create your first repository through the Gitea web interface.'))
					])
				])
			]);
		}

		return E('div', { 'class': 'gt-card gt-card-full' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDCC2'),
					' ' + _('Repository List')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				this.renderRepoTable(repos)
			])
		]);
	},

	renderRepoTable: function(repos) {
		var self = this;
		var status = this.statusData;
		var lanIp = status.http_url ? status.http_url.replace(/^https?:\/\//, '').split(':')[0] : 'localhost';
		var httpPort = status.http_port || 3000;
		var sshPort = status.ssh_port || 2222;

		return E('table', { 'class': 'gt-table', 'id': 'repo-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, _('Repository')),
					E('th', {}, _('Owner')),
					E('th', {}, _('Size')),
					E('th', {}, _('Clone URL'))
				])
			]),
			E('tbody', {},
				repos.map(function(repo) {
					var httpClone = 'http://' + lanIp + ':' + httpPort + '/' + repo.owner + '/' + repo.name + '.git';
					var sshClone = 'git@' + lanIp + ':' + sshPort + '/' + repo.owner + '/' + repo.name + '.git';

					return E('tr', {}, [
						E('td', { 'class': 'gt-repo-name' }, repo.name),
						E('td', {}, repo.owner || '-'),
						E('td', {}, repo.size || '-'),
						E('td', {}, [
							E('div', {
								'class': 'gt-clone-url',
								'title': _('Click to copy'),
								'click': function() { self.copyToClipboard(httpClone); }
							}, httpClone),
							E('div', {
								'class': 'gt-clone-url',
								'title': _('Click to copy SSH URL'),
								'click': function() { self.copyToClipboard(sshClone); },
								'style': 'margin-top: 4px; font-size: 10px;'
							}, sshClone)
						])
					]);
				})
			)
		]);
	},

	updateRepoList: function() {
		var table = document.getElementById('repo-table');
		if (!table) return;

		var repos = this.reposData.repos || [];
		var tbody = table.querySelector('tbody');
		if (!tbody) return;

		// Update table content
		var self = this;
		var status = this.statusData;
		var lanIp = status.http_url ? status.http_url.replace(/^https?:\/\//, '').split(':')[0] : 'localhost';
		var httpPort = status.http_port || 3000;
		var sshPort = status.ssh_port || 2222;

		tbody.innerHTML = '';
		repos.forEach(function(repo) {
			var httpClone = 'http://' + lanIp + ':' + httpPort + '/' + repo.owner + '/' + repo.name + '.git';
			var sshClone = 'git@' + lanIp + ':' + sshPort + '/' + repo.owner + '/' + repo.name + '.git';

			var row = E('tr', {}, [
				E('td', { 'class': 'gt-repo-name' }, repo.name),
				E('td', {}, repo.owner || '-'),
				E('td', {}, repo.size || '-'),
				E('td', {}, [
					E('div', {
						'class': 'gt-clone-url',
						'title': _('Click to copy'),
						'click': function() { self.copyToClipboard(httpClone); }
					}, httpClone),
					E('div', {
						'class': 'gt-clone-url',
						'title': _('Click to copy SSH URL'),
						'click': function() { self.copyToClipboard(sshClone); },
						'style': 'margin-top: 4px; font-size: 10px;'
					}, sshClone)
				])
			]);
			tbody.appendChild(row);
		});
	},

	copyToClipboard: function(text) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(function() {
				ui.addNotification(null, E('p', {}, _('Copied to clipboard: ') + text), 'info');
			});
		} else {
			// Fallback
			var input = document.createElement('input');
			input.value = text;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			ui.addNotification(null, E('p', {}, _('Copied to clipboard: ') + text), 'info');
		}
	}
});
