'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require dom';
'require traffic-shaper/api as API';

return view.extend({
	load: function() {
		return API.listPresets();
	},

	render: function(data) {
		var presets = data.presets || [];

		var container = E('div', { 'class': 'traffic-shaper-dashboard' }, [
			E('h2', {}, _('Traffic Shaping Presets')),

			E('div', { 'class': 'cbi-section' }, [
				E('p', {}, _('Apply pre-configured traffic shaping profiles optimized for common use cases. Applying a preset will replace your current configuration.')),
				E('p', { 'style': 'background: #fff3cd; padding: 0.75em; border-left: 4px solid #ffc107;' }, [
					E('strong', {}, _('Warning:')),
					' ',
					_('Applying a preset will overwrite all existing traffic classes and rules.')
				])
			]),

			E('div', { 'class': 'ts-preset-grid' },
				presets.length > 0 ?
					presets.map(L.bind(this.renderPresetCard, this)) :
					this.renderDefaultPresets()
			)
		]);

		return container;
	},

	renderPresetCard: function(preset) {
		return E('div', { 'class': 'ts-preset-card' }, [
			E('div', { 'class': 'ts-preset-title' }, preset.name || preset.id),
			E('div', { 'class': 'ts-preset-description' }, preset.description || ''),

			E('div', { 'style': 'margin: 1em 0; padding: 1em; background: #f8f9fa; border-radius: 4px;' }, [
				E('strong', {}, _('Configuration:')),
				E('ul', { 'style': 'margin: 0.5em 0 0 0; padding-left: 1.5em;' },
					(preset.classes || []).map(function(cls) {
						return E('li', {}, '%s: %s (priority %s)'.format(
							cls.name,
							cls.rate + ' → ' + cls.ceil,
							cls.priority
						));
					})
				)
			]),

			E('div', { 'class': 'ts-preset-apply' }, [
				E('button', {
					'class': 'ts-btn ts-btn-success',
					'click': L.bind(function(ev) {
						this.handleApplyPreset(ev, preset.id);
					}, this)
				}, _('Apply This Preset'))
			])
		]);
	},

	renderDefaultPresets: function() {
		// Fallback presets if backend doesn't provide them
		var defaultPresets = [
			{
				id: 'gaming',
				name: _('Gaming & Low-Latency'),
				description: _('Optimized for online gaming, VoIP, and real-time applications. Prioritizes UDP and low-latency traffic.'),
				classes: [
					{ name: _('Gaming/VoIP'), priority: '1', rate: '5mbit', ceil: '50mbit' },
					{ name: _('Interactive'), priority: '3', rate: '10mbit', ceil: '80mbit' },
					{ name: _('Streaming'), priority: '5', rate: '8mbit', ceil: '60mbit' },
					{ name: _('Bulk Downloads'), priority: '8', rate: '2mbit', ceil: '30mbit' }
				]
			},
			{
				id: 'streaming',
				name: _('Video Streaming'),
				description: _('Optimized for video streaming services like Netflix, YouTube, and video conferencing. Ensures smooth playback.'),
				classes: [
					{ name: _('Video Conference'), priority: '2', rate: '10mbit', ceil: '60mbit' },
					{ name: _('Video Streaming'), priority: '3', rate: '15mbit', ceil: '80mbit' },
					{ name: _('Web Browsing'), priority: '5', rate: '5mbit', ceil: '50mbit' },
					{ name: _('Background'), priority: '7', rate: '2mbit', ceil: '30mbit' }
				]
			},
			{
				id: 'work_from_home',
				name: _('Work From Home'),
				description: _('Balanced configuration for remote work. Prioritizes video calls, VPN, and web applications while allowing downloads.'),
				classes: [
					{ name: _('Video Calls'), priority: '1', rate: '8mbit', ceil: '50mbit' },
					{ name: _('VPN Traffic'), priority: '2', rate: '10mbit', ceil: '60mbit' },
					{ name: _('Web/Email'), priority: '4', rate: '8mbit', ceil: '70mbit' },
					{ name: _('Downloads'), priority: '6', rate: '5mbit', ceil: '40mbit' }
				]
			},
			{
				id: 'balanced',
				name: _('Balanced (Default)'),
				description: _('General-purpose configuration that works well for most households. Equal priority for common applications.'),
				classes: [
					{ name: _('High Priority'), priority: '2', rate: '10mbit', ceil: '60mbit' },
					{ name: _('Normal Traffic'), priority: '5', rate: '15mbit', ceil: '80mbit' },
					{ name: _('Bulk Transfer'), priority: '7', rate: '5mbit', ceil: '50mbit' }
				]
			}
		];

		return defaultPresets.map(L.bind(this.renderPresetCard, this));
	},

	handleApplyPreset: function(ev, presetId) {
		var btn = ev.target;

		ui.showModal(_('Apply Preset'), [
			E('p', {}, _('Are you sure you want to apply this preset? This will:')),
			E('ul', {}, [
				E('li', {}, _('Delete all existing traffic classes')),
				E('li', {}, _('Delete all existing classification rules')),
				E('li', {}, _('Create new classes from the preset')),
				E('li', {}, _('Apply the new configuration immediately'))
			]),
			E('p', { 'style': 'font-weight: bold; color: #dc3545;' },
				_('This action cannot be undone!')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': L.bind(function() {
						ui.hideModal();
						this.applyPreset(presetId, btn);
					}, this)
				}, _('Yes, Apply Preset'))
			])
		]);
	},

	applyPreset: function(presetId, btn) {
		var originalText = btn.textContent;
		btn.disabled = true;
		btn.textContent = _('Applying...');

		ui.showModal(_('Applying Preset'), [
			E('p', { 'class': 'spinning' }, _('Applying preset configuration...'))
		], null, null, { 'spinning': true });

		API.applyPreset(presetId).then(L.bind(function(result) {
			ui.hideModal();

			if (result.success) {
				ui.addNotification(null,
					E('p', _('Preset applied successfully! Traffic shaping has been reconfigured.')),
					'info'
				);

				// Redirect to overview after 2 seconds
				setTimeout(function() {
					window.location.href = L.url('admin/network/traffic-shaper/overview');
				}, 2000);
			} else {
				ui.addNotification(null,
					E('p', _('Failed to apply preset: %s').format(result.message || _('Unknown error'))),
					'error'
				);
				btn.disabled = false;
				btn.textContent = originalText;
			}
		}, this)).catch(L.bind(function(err) {
			ui.hideModal();
			ui.addNotification(null,
				E('p', _('Error applying preset: %s').format(err.message || err)),
				'error'
			);
			btn.disabled = false;
			btn.textContent = originalText;
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
