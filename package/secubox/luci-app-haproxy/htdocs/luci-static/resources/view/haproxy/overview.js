'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';

return view.extend({
	load: function() {
		return api.getDashboardData();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var vhosts = data.vhosts || [];
		var backends = data.backends || [];
		var certificates = data.certificates || [];

		var containerRunning = status.container_running;
		var haproxyRunning = status.haproxy_running;
		var enabled = status.enabled;

		var statusText = haproxyRunning ? 'Running' : (containerRunning ? 'Container Running' : 'Stopped');
		var statusClass = haproxyRunning ? 'running' : (containerRunning ? 'unknown' : 'stopped');

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'HAProxy Load Balancer'),

			// Dashboard cards
			E('div', { 'class': 'haproxy-dashboard' }, [
				// Status card
				E('div', { 'class': 'haproxy-card' }, [
					E('h3', {}, 'Service Status'),
					E('div', { 'class': 'haproxy-status' }, [
						E('span', { 'class': 'haproxy-status-indicator ' + statusClass }),
						E('span', { 'class': 'stat-value' }, statusText)
					]),
					E('div', { 'class': 'haproxy-actions' }, [
						E('button', {
							'class': 'cbi-button cbi-button-apply',
							'click': function() { self.handleStart(); },
							'disabled': haproxyRunning
						}, 'Start'),
						E('button', {
							'class': 'cbi-button cbi-button-reset',
							'click': function() { self.handleStop(); },
							'disabled': !haproxyRunning
						}, 'Stop'),
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() { self.handleReload(); },
							'disabled': !haproxyRunning
						}, 'Reload')
					])
				]),

				// Vhosts card
				E('div', { 'class': 'haproxy-card' }, [
					E('h3', {}, 'Virtual Hosts'),
					E('div', { 'class': 'stat-value' }, String(vhosts.length)),
					E('div', { 'class': 'stat-label' }, 'configured domains')
				]),

				// Backends card
				E('div', { 'class': 'haproxy-card' }, [
					E('h3', {}, 'Backends'),
					E('div', { 'class': 'stat-value' }, String(backends.length)),
					E('div', { 'class': 'stat-label' }, 'backend pools')
				]),

				// Certificates card
				E('div', { 'class': 'haproxy-card' }, [
					E('h3', {}, 'SSL Certificates'),
					E('div', { 'class': 'stat-value' }, String(certificates.length)),
					E('div', { 'class': 'stat-label' }, 'certificates')
				])
			]),

			// Quick info section
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Connection Details'),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'style': 'width: 200px' }, 'HTTP Port'),
						E('td', { 'class': 'td' }, String(status.http_port || 80))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'HTTPS Port'),
						E('td', { 'class': 'td' }, String(status.https_port || 443))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Stats Dashboard'),
						E('td', { 'class': 'td' }, status.stats_enabled ?
							E('a', { 'href': 'http://' + window.location.hostname + ':' + (status.stats_port || 8404) + '/stats', 'target': '_blank' },
								'http://' + window.location.hostname + ':' + (status.stats_port || 8404) + '/stats')
							: 'Disabled')
					])
				])
			]),

			// Recent vhosts
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Virtual Hosts'),
				this.renderVhostsTable(vhosts.slice(0, 5)),
				vhosts.length > 5 ? E('p', {},
					E('a', { 'href': L.url('admin/services/haproxy/vhosts') }, 'View all ' + vhosts.length + ' virtual hosts')
				) : null
			]),

			// Quick actions
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Quick Actions'),
				E('div', { 'class': 'haproxy-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { self.handleValidate(); }
					}, 'Validate Config'),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { self.handleGenerate(); }
					}, 'Regenerate Config'),
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': function() { self.handleInstall(); },
						'disabled': containerRunning
					}, 'Install Container')
				])
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		view.insertBefore(style, view.firstChild);

		return view;
	},

	renderVhostsTable: function(vhosts) {
		if (vhosts.length === 0) {
			return E('p', { 'style': 'color: var(--text-color-medium, #666)' },
				'No virtual hosts configured. Add one in the Virtual Hosts tab.');
		}

		return E('table', { 'class': 'haproxy-vhosts-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Domain'),
					E('th', {}, 'Backend'),
					E('th', {}, 'SSL'),
					E('th', {}, 'Status')
				])
			]),
			E('tbody', {}, vhosts.map(function(vh) {
				return E('tr', {}, [
					E('td', {}, vh.domain),
					E('td', {}, vh.backend || '-'),
					E('td', {}, [
						vh.ssl ? E('span', { 'class': 'haproxy-badge ssl' }, 'SSL') : null,
						vh.acme ? E('span', { 'class': 'haproxy-badge acme' }, 'ACME') : null
					]),
					E('td', {}, E('span', {
						'class': 'haproxy-badge ' + (vh.enabled ? 'enabled' : 'disabled')
					}, vh.enabled ? 'Enabled' : 'Disabled'))
				]);
			}))
		]);
	},

	handleStart: function() {
		return api.start().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'HAProxy service started'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to start: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleStop: function() {
		return api.stop().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'HAProxy service stopped'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to stop: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleReload: function() {
		return api.reload().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'HAProxy configuration reloaded'));
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to reload: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleValidate: function() {
		return api.validate().then(function(res) {
			if (res.valid) {
				ui.addNotification(null, E('p', {}, 'Configuration is valid'));
			} else {
				ui.addNotification(null, E('p', {}, 'Configuration error: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleGenerate: function() {
		return api.generate().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Configuration regenerated'));
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to generate: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleInstall: function() {
		ui.showModal('Installing HAProxy Container', [
			E('p', { 'class': 'spinning' }, 'Installing HAProxy container...')
		]);

		return api.install().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'HAProxy container installed successfully'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Installation failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
