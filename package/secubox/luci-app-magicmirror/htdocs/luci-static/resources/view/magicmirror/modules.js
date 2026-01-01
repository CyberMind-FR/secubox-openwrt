'use strict';
'require view';
'require rpc';
'require ui';
'require dom';
'require poll';

var callListModules = rpc.declare({
	object: 'luci.magicmirror',
	method: 'listModules',
	expect: { }
});

var callInstallModule = rpc.declare({
	object: 'luci.magicmirror',
	method: 'installModule',
	params: ['url'],
	expect: { }
});

var callRemoveModule = rpc.declare({
	object: 'luci.magicmirror',
	method: 'removeModule',
	params: ['name'],
	expect: { }
});

var callUpdateModule = rpc.declare({
	object: 'luci.magicmirror',
	method: 'updateModule',
	params: ['name'],
	expect: { }
});

var callGetModuleConfig = rpc.declare({
	object: 'luci.magicmirror',
	method: 'getModuleConfig',
	params: ['name'],
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callListModules()
		]);
	},

	renderModuleCard: function(module) {
		return E('div', {
			'class': 'cbi-section',
			'style': 'margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; padding: 15px;'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: start;' }, [
				E('div', { 'style': 'flex: 1;' }, [
					E('h3', { 'style': 'margin: 0 0 10px 0; color: #2196F3;' }, module.name),
					module.description ? E('p', { 'style': 'margin: 0 0 5px 0; color: #666;' }, module.description) : '',
					E('div', { 'style': 'font-size: 12px; color: #999;' }, [
						module.author ? E('span', {}, _('Author: ') + module.author + ' | ') : '',
						module.version ? E('span', {}, _('Version: ') + module.version) : ''
					])
				]),
				E('div', { 'style': 'display: flex; gap: 5px; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, function() {
							return this.showModuleConfig(module.name);
						})
					}, _('Info')),
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(this, function() {
							return this.updateModule(module.name);
						})
					}, _('Update')),
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': ui.createHandlerFn(this, function() {
							return this.removeModule(module.name);
						})
					}, _('Remove'))
				])
			])
		]);
	},

	showModuleConfig: function(moduleName) {
		ui.showModal(_('Module Information: ') + moduleName, [
			E('p', { 'class': 'spinning' }, _('Loading...'))
		]);

		return callGetModuleConfig(moduleName).then(function(result) {
			if (result.success) {
				var content = result.readme || 'No information available.';

				// Truncate very long READMEs
				if (content.length > 5000) {
					content = content.substring(0, 5000) + '\n\n... (truncated)';
				}

				ui.showModal(_('Module Information: ') + moduleName, [
					E('div', { 'style': 'max-height: 500px; overflow-y: auto;' }, [
						E('pre', { 'style': 'white-space: pre-wrap; font-size: 12px;' }, content)
					]),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'cbi-button',
							'click': ui.hideModal
						}, _('Close'))
					])
				], 'cbi-modal');
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Failed to load module information')), 'error');
			}
		});
	},

	updateModule: function(moduleName) {
		if (!confirm(_('Update module ') + moduleName + '?')) {
			return;
		}

		ui.showModal(_('Updating Module'), [
			E('p', { 'class': 'spinning' }, _('Updating ') + moduleName + '...')
		]);

		return callUpdateModule(moduleName).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Module update started. This may take a minute...')), 'info');
				setTimeout(function() { window.location.reload(); }, 5000);
			} else {
				ui.addNotification(null, E('p', _('Failed to update module: ') + (result.error || 'Unknown error')), 'error');
			}
		});
	},

	removeModule: function(moduleName) {
		if (!confirm(_('Remove module ') + moduleName + '? This cannot be undone.')) {
			return;
		}

		ui.showModal(_('Removing Module'), [
			E('p', { 'class': 'spinning' }, _('Removing ') + moduleName + '...')
		]);

		return callRemoveModule(moduleName).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Module removed successfully')), 'info');
				setTimeout(function() { window.location.reload(); }, 1500);
			} else {
				ui.addNotification(null, E('p', _('Failed to remove module: ') + (result.error || 'Unknown error')), 'error');
			}
		});
	},

	showInstallDialog: function() {
		var input;

		ui.showModal(_('Install MagicMirror Module'), [
			E('p', {}, _('Enter the Git repository URL of the module to install:')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Git URL')),
				E('div', { 'class': 'cbi-value-field' }, [
					input = E('input', {
						'type': 'text',
						'class': 'cbi-input-text',
						'placeholder': 'https://github.com/user/MMM-ModuleName',
						'style': 'width: 100%;'
					})
				])
			]),
			E('div', { 'style': 'margin-top: 15px;' }, [
				E('p', { 'style': 'font-size: 12px; color: #666;' }, [
					E('strong', {}, _('Examples:')),
					E('br'), '• https://github.com/MichMich/MMM-WeatherChart',
					E('br'), '• https://github.com/hangorazvan/covid19',
					E('br'), '• https://github.com/jclarke0000/MMM-MyCalendar'
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 20px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function() {
						var url = input.value.trim();
						if (!url) {
							ui.addNotification(null, E('p', _('Please enter a Git URL')), 'warning');
							return;
						}
						return this.installModule(url);
					})
				}, _('Install'))
			])
		], 'cbi-modal');

		input.focus();
	},

	installModule: function(url) {
		ui.hideModal();

		ui.showModal(_('Installing Module'), [
			E('p', { 'class': 'spinning' }, _('Installing module from ') + url + '...'),
			E('p', { 'style': 'font-size: 12px; color: #666;' }, _('This may take a few minutes depending on the module size.'))
		]);

		return callInstallModule(url).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Module installation started. Page will reload in 10 seconds...')), 'info');
				setTimeout(function() { window.location.reload(); }, 10000);
			} else {
				ui.addNotification(null, E('p', _('Failed to install module: ') + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	render: function(data) {
		var modulesData = data[0] || {};
		var modules = (modulesData.modules || []);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('MagicMirror² Modules')),
			E('div', { 'class': 'cbi-section-descr' }, _('Manage installed modules and install new ones from the MagicMirror community')),

			E('div', { 'class': 'cbi-section', 'style': 'margin: 20px 0;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;' }, [
					E('h3', {}, _('Installed Modules')),
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': ui.createHandlerFn(this, this.showInstallDialog)
					}, _('Install New Module'))
				]),

				modules.length > 0 ?
					E('div', {}, modules.map(function(module) {
						return this.renderModuleCard(module);
					}, this)) :
					E('div', { 'class': 'alert-message warning' }, [
						E('p', {}, _('No modules installed yet.')),
						E('p', {}, _('Click "Install New Module" to get started.'))
					])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Popular Modules')),
				E('div', { 'style': 'columns: 2; column-gap: 20px;' }, [
					E('ul', { 'style': 'margin: 0; padding-left: 20px;' }, [
						E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MMM-WeatherChart', 'target': '_blank' }, 'MMM-WeatherChart'), ' - Weather charts']),
						E('li', {}, [E('a', { 'href': 'https://github.com/jclarke0000/MMM-MyCalendar', 'target': '_blank' }, 'MMM-MyCalendar'), ' - Enhanced calendar']),
						E('li', {}, [E('a', { 'href': 'https://github.com/cowboysdude/MMM-NOAA', 'target': '_blank' }, 'MMM-NOAA'), ' - NOAA weather']),
						E('li', {}, [E('a', { 'href': 'https://github.com/hangorazvan/covid19', 'target': '_blank' }, 'MMM-COVID19'), ' - COVID-19 stats']),
						E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MMM-Facial-Recognition', 'target': '_blank' }, 'MMM-Facial-Recognition'), ' - Face recognition']),
						E('li', {}, [E('a', { 'href': 'https://github.com/cowboysdude/MMM-cryptocurrency', 'target': '_blank' }, 'MMM-Cryptocurrency'), ' - Crypto prices']),
						E('li', {}, [E('a', { 'href': 'https://github.com/cowboysdude/MMM-BMW-DS', 'target': '_blank' }, 'MMM-BMW-DS'), ' - BMW status']),
						E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MMM-Todoist', 'target': '_blank' }, 'MMM-Todoist'), ' - Todoist tasks']),
						E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MMM-Spotify', 'target': '_blank' }, 'MMM-Spotify'), ' - Spotify player']),
						E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MMM-GooglePhotos', 'target': '_blank' }, 'MMM-GooglePhotos'), ' - Google Photos'])
					])
				]),
				E('p', { 'style': 'margin-top: 15px; font-size: 12px; color: #666;' }, [
					_('Find more modules at: '),
					E('a', { 'href': 'https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules', 'target': '_blank' }, _('MagicMirror Wiki'))
				])
			])
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
