'use strict';
'require view';
'require ui';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts()
		]);
	},

	render: function(data) {
		this.vhosts = data[0] || [];
		this.domainSelect = this.createDomainSelect();
		this.lineSelect = this.createLineSelect();
		this.logOutput = E('pre', { 'class': 'vhost-log-terminal' }, _('Select a domain to view logs'));

		return E('div', { 'class': 'vhost-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
			VHostUI.renderTabs('logs'),
			this.renderHeader(),
			this.renderControls()
		]);
	},

	renderHeader: function() {
		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📜'),
					_('Access Logs')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Tail nginx access logs per virtual host without SSHing into the router.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStat(this.vhosts.length, _('Domains')),
				this.renderStat('50-500', _('Lines'))
			])
		]);
	},

	renderStat: function(value, label) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderControls: function() {
		if (!this.vhosts.length) {
			return E('div', { 'class': 'vhost-card' }, [
				E('div', { 'class': 'vhost-card-title' }, ['🪵', _('Logs')]),
				E('div', { 'class': 'vhost-empty' }, _('No virtual hosts configured yet, logs unavailable.'))
			]);
		}

		this.domainSelect.addEventListener('change', this.fetchLogs.bind(this));
		this.lineSelect.addEventListener('change', this.fetchLogs.bind(this));

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['🧾', _('Viewer')]),
			E('div', { 'class': 'vhost-form-grid' }, [
				E('div', {}, [
					E('label', {}, _('Domain')),
					this.domainSelect
				]),
				E('div', {}, [
					E('label', {}, _('Lines')),
					this.lineSelect
				])
			]),
			E('div', { 'class': 'vhost-actions' }, [
				E('button', {
					'class': 'sh-btn-secondary',
					'click': this.fetchLogs.bind(this)
				}, _('Refresh'))
			]),
			this.logOutput
		]);
	},

	createDomainSelect: function() {
		var select = E('select', {});
		this.vhosts.forEach(function(vhost, idx) {
			select.appendChild(E('option', {
				'value': vhost.domain,
				'selected': idx === 0
			}, vhost.domain));
		});
		return select;
	},

	createLineSelect: function() {
		var select = E('select', {});
		[50, 100, 200, 500].forEach(function(value) {
			select.appendChild(E('option', {
				'value': value,
				'selected': value === 50
			}, value.toString()));
		});
		return select;
	},

	fetchLogs: function(ev) {
		if (ev)
			ev.preventDefault();

		var domain = this.domainSelect.value;
		var lines = parseInt(this.lineSelect.value, 10) || 50;

		if (!domain) {
			this.logOutput.textContent = _('Select a domain to view logs');
			return Promise.resolve();
		}

		this.logOutput.textContent = _('Loading logs for %s ...').format(domain);

		return API.getAccessLogs(domain, lines).then(function(result) {
			var logs = (result.logs || []).join('\n');
			this.logOutput.textContent = logs || _('No logs available');
		}.bind(this)).catch(function(err) {
			var message = err && err.message ? err.message : _('Unable to load logs');
			ui.addNotification(null, E('p', message), 'error');
			this.logOutput.textContent = message;
		}.bind(this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
