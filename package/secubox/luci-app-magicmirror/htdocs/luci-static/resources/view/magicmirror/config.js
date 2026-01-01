'use strict';
'require view';
'require rpc';
'require ui';
'require dom';

var callGetConfig = rpc.declare({
	object: 'luci.magicmirror',
	method: 'getConfig',
	expect: { }
});

var callSaveConfig = rpc.declare({
	object: 'luci.magicmirror',
	method: 'saveConfig',
	params: ['content'],
	expect: { }
});

var callRestartService = rpc.declare({
	object: 'luci.magicmirror',
	method: 'restartService',
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callGetConfig()
		]);
	},

	render: function(data) {
		var configData = data[0] || {};
		var configContent = configData.content || '';
		var textarea;

		var saveConfig = function() {
			var content = textarea.value;

			if (!content.trim()) {
				ui.addNotification(null, E('p', _('Configuration cannot be empty')), 'warning');
				return;
			}

			// Basic validation
			if (!content.includes('let config')) {
				if (!confirm(_('Configuration does not contain "let config". Are you sure you want to save this?'))) {
					return;
				}
			}

			ui.showModal(_('Saving Configuration'), [
				E('p', { 'class': 'spinning' }, _('Saving configuration...'))
			]);

			return callSaveConfig(content).then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Configuration saved successfully')), 'info');

					if (confirm(_('Configuration saved. Restart MagicMirror to apply changes?'))) {
						ui.showModal(_('Restarting Service'), [
							E('p', { 'class': 'spinning' }, _('Restarting MagicMirror²...'))
						]);

						return callRestartService().then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Service restarted. Changes will apply shortly.')), 'info');
						});
					}
				} else {
					ui.addNotification(null, E('p', _('Failed to save configuration: ') + (result.error || 'Unknown error')), 'error');
				}
			});
		};

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('MagicMirror² Configuration')),
			E('div', { 'class': 'cbi-section-descr' }, _('Edit the MagicMirror² configuration file (config.js)')),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 20px;' }, [
				E('div', { 'class': 'cbi-section-descr', 'style': 'margin-bottom: 15px;' }, [
					E('div', { 'class': 'alert-message info' }, [
						E('h4', { 'style': 'margin: 0 0 10px 0;' }, _('Configuration Tips:')),
						E('ul', { 'style': 'margin: 0; padding-left: 20px;' }, [
							E('li', {}, _('Modules are configured in the "modules" array')),
							E('li', {}, _('Each module has a "module" name, "position", and optional "config" object')),
							E('li', {}, _('Common positions: top_left, top_right, bottom_bar, etc.')),
							E('li', {}, _('Save and restart the service to apply changes')),
							E('li', {}, _('Always backup your config before making major changes'))
						])
					])
				]),

				E('div', { 'class': 'cbi-value', 'style': 'margin-bottom: 15px;' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Configuration')),
					E('div', { 'class': 'cbi-value-field' }, [
						textarea = E('textarea', {
							'id': 'config-editor',
							'style': 'width: 100%; min-height: 600px; font-family: monospace; font-size: 13px; line-height: 1.5; padding: 10px; border: 1px solid #ccc; border-radius: 3px;',
							'spellcheck': 'false'
						}, configContent)
					])
				]),

				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-save',
						'click': saveConfig
					}, _('Save Configuration')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': function() {
							if (confirm(_('Discard all changes and reload?'))) {
								window.location.reload();
							}
						}
					}, _('Cancel'))
				])
			]),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 30px;' }, [
				E('h3', {}, _('Module Position Reference')),
				E('div', { 'style': 'background: #f5f5f5; padding: 20px; border-radius: 5px; font-family: monospace; font-size: 12px;' }, [
					E('pre', { 'style': 'margin: 0; overflow-x: auto;' },
`╔══════════════════════════════════════════════════╗
║                   top_bar                        ║
╠══════════════╦══════════════╦═════════════════════╣
║              ║              ║                     ║
║  top_left    ║  top_center  ║    top_right        ║
║              ║              ║                     ║
╠══════════════╬══════════════╬═════════════════════╣
║              ║              ║                     ║
║ upper_third  ║middle_center ║   upper_third       ║
║              ║              ║                     ║
╠══════════════╬══════════════╬═════════════════════╣
║              ║              ║                     ║
║ lower_third  ║              ║   lower_third       ║
║              ║              ║                     ║
╠══════════════╬══════════════╬═════════════════════╣
║              ║              ║                     ║
║ bottom_left  ║bottom_center ║   bottom_right      ║
║              ║              ║                     ║
╠══════════════╩══════════════╩═════════════════════╣
║                  bottom_bar                       ║
╚══════════════════════════════════════════════════╝`
					)
				])
			]),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 20px;' }, [
				E('h3', {}, _('Example Module Configuration')),
				E('pre', { 'style': 'background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;' },
`{
	module: "weather",
	position: "top_right",
	config: {
		weatherProvider: "openweathermap",
		type: "current",
		location: "Paris",
		locationID: "2988507",
		apiKey: "YOUR_API_KEY"
	}
},
{
	module: "calendar",
	header: "My Calendar",
	position: "top_left",
	config: {
		calendars: [
			{
				symbol: "calendar-check",
				url: "webcal://calendar.google.com/calendar/ical/..."
			}
		]
	}
},
{
	module: "newsfeed",
	position: "bottom_bar",
	config: {
		feeds: [
			{
				title: "BBC News",
				url: "http://feeds.bbci.co.uk/news/rss.xml"
			}
		],
		showSourceTitle: true,
		showPublishDate: true
	}
}`
				)
			]),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 20px;' }, [
				E('h3', {}, _('Resources')),
				E('ul', {}, [
					E('li', {}, [E('a', { 'href': 'https://docs.magicmirror.builders/configuration/introduction.html', 'target': '_blank' }, _('Configuration Documentation'))]),
					E('li', {}, [E('a', { 'href': 'https://docs.magicmirror.builders/modules/configuration.html', 'target': '_blank' }, _('Module Configuration'))]),
					E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MagicMirror/tree/master/modules/default', 'target': '_blank' }, _('Default Modules'))]),
					E('li', {}, [E('a', { 'href': 'https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules', 'target': '_blank' }, _('3rd Party Modules'))])
				])
			])
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
