'use strict';
'require view';
'require rpc';
'require ui';
'require dom';
'require poll';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';

var callGetAvailableModes = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_available_modes',
	expect: { modes: [] }
});

var callGetCurrentMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_current_mode',
	expect: { }
});

var callSetMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'set_mode',
	params: ['mode'],
	expect: { }
});

var callPreviewChanges = rpc.declare({
	object: 'luci.network-modes',
	method: 'preview_changes',
	expect: { }
});

var callApplyMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'apply_mode',
	expect: { }
});

var callConfirmMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'confirm_mode',
	expect: { }
});

var callRollback = rpc.declare({
	object: 'luci.network-modes',
	method: 'rollback',
	expect: { }
});

Theme.init({ theme: 'dark', language: 'en' });

return view.extend({
	title: _('Network Mode Wizard'),

	load: function() {
		return Promise.all([
			callGetAvailableModes(),
			callGetCurrentMode()
		]);
	},

	render: function(data) {
		var modes = data[0].modes || [];
		var currentModeData = data[1] || {};

		var hero = helpers.createHero({
			icon: '🌐',
			title: _('Network Configuration Wizard'),
			subtitle: _('Switch between Router, Access Point, Relay, Travel, Bridge, and Sniffer topologies with automatic preview + rollback safety.'),
			gradient: 'linear-gradient(135deg,#6366f1,#9333ea)',
			actions: [
				currentModeData.rollback_active ? E('button', {
					'class': 'nm-btn nm-btn-primary',
					'click': ui.createHandlerFn(this, 'handleConfirmMode')
				}, ['✅ ', _('Confirm Mode')]) : null,
				currentModeData.rollback_active ? E('button', {
					'class': 'nm-btn',
					'click': ui.createHandlerFn(this, 'handleRollbackNow')
				}, ['↩ ', _('Rollback Now')]) : null
			].filter(Boolean)
		});

		var stepper = helpers.createStepper([
			{ title: _('Select Topology'), description: _('Pick Router / AP / Relay / Travel / Bridge / Sniffer') },
			{ title: _('Review Changes'), description: _('Preview network config+services impacted') },
			{ title: _('Apply Mode'), description: _('Network restarts, rollback timer starts') },
			{ title: _('Confirm or Rollback'), description: _('2 minute confirmation window') }
		], currentModeData.rollback_active ? 2 : 1);

		var container = E('div', { 'class': 'network-modes-dashboard nm-wizard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('wizard'),
			hero,
			stepper,
			currentModeData.rollback_active ? this.renderRollbackBanner(currentModeData) : this.renderCurrentMode(currentModeData),
			this.renderModesGrid(modes, currentModeData.current_mode),
			this.renderInstructions()
		]);

		if (currentModeData.rollback_active) {
			this.startRollbackPoll();
		}

		return container;
	},

	renderCurrentMode: function(data) {
		return helpers.createSection({
			title: _('Current Mode'),
			icon: '✅',
			badge: data.current_mode || '--',
			body: [
				E('p', { 'style': 'color:#94a3b8;' }, [
					E('strong', {}, data.mode_name || data.current_mode),
					E('br'),
					E('span', {}, data.description || ''),
					E('br'),
					E('span', { 'style': 'font-size:12px;' }, _('Last change: ') + (data.last_change || _('Never')))
				])
			]
		});
	},

	renderRollbackBanner: function(data) {
		var remaining = data.rollback_remaining || 0;
		var minutes = Math.floor(remaining / 60);
		var seconds = remaining % 60;
		return E('div', {
			'class': 'nm-card',
			'style': 'background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);'
		}, [
			E('div', { 'class': 'nm-card-header' }, [
				E('div', { 'class': 'nm-card-title' }, [
					E('span', { 'class': 'nm-card-title-icon' }, '⏱️'),
					_('Auto-Rollback Active')
				]),
				E('div', { 'class': 'nm-card-badge' }, data.current_mode || '')
			]),
			E('div', { 'class': 'nm-card-body' }, [
				E('div', { 'id': 'rollback-timer', 'style': 'font-size:20px;font-weight:600;margin-bottom:8px;' },
					_('Time left: ') + minutes + 'm ' + seconds + 's'),
				E('p', {}, _('Confirm the mode if the network is stable, otherwise rollback will trigger automatically.')),
				E('div', { 'class': 'nm-btn-group' }, [
					E('button', { 'class': 'nm-btn nm-btn-primary', 'click': ui.createHandlerFn(this, 'handleConfirmMode') }, '✅ ' + _('Confirm Mode')),
					E('button', { 'class': 'nm-btn', 'click': ui.createHandlerFn(this, 'handleRollbackNow') }, '↩ ' + _('Rollback Now'))
				])
			])
		]);
	},

	renderModesGrid: function(modes, currentMode) {
		var grid = E('div', { 'class': 'nm-modes-grid nm-wizard-grid' });
		modes.forEach(L.bind(function(mode) {
			grid.appendChild(this.renderModeCard(mode, currentMode));
		}, this));
		return grid;
	},

	renderModeCard: function(mode, currentMode) {
		var isCurrent = mode.id === currentMode;
		var card = E('div', {
			'class': 'nm-mode-card wizard-card' + (isCurrent ? ' active' : '')
		}, [
			E('div', { 'class': 'nm-mode-header' }, [
				E('div', { 'class': 'nm-mode-icon' }, mode.icon || '🌐'),
				E('div', { 'class': 'nm-mode-title' }, [
					E('h3', {}, mode.name),
					E('p', {}, mode.description || '')
				])
			]),
			E('div', { 'class': 'nm-mode-features' }, (mode.features || []).slice(0, 4).map(function(feature) {
				return E('span', { 'class': 'nm-mode-feature' }, ['✓ ', feature]);
			})),
			isCurrent ?
				E('div', { 'class': 'nm-mode-active-indicator' }, _('Active Mode')) :
				E('button', {
					'class': 'nm-btn nm-btn-primary',
					'type': 'button',
					'click': ui.createHandlerFn(this, 'handleSwitchMode', mode)
				}, _('Switch to ') + mode.name)
		]);

		return card;
	},

	renderInstructions: function() {
		return helpers.createSection({
			title: _('Wizard Guidance'),
			icon: '🧭',
			body: [
				E('ol', { 'style': 'color:#94a3b8;line-height:1.8;margin-left:16px;' }, [
					E('li', {}, _('Select the target mode from the cards above.')),
					E('li', {}, _('Review configuration diffs + services impacted.')),
					E('li', {}, _('Apply mode; device takes a snapshot and restarts network.')),
					E('li', {}, _('Confirm within 2 minutes or automatic rollback restores previous state.'))
				])
			]
		});
	},

	handleSwitchMode: function(mode) {
		ui.showModal(_('Switch to ') + mode.name, [
			E('p', { 'class': 'spinning' }, _('Preparing mode change...'))
		]);

		return callSetMode(mode.id).then(L.bind(function(result) {
			if (!result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, result.error || _('Failed to prepare mode')), 'error');
				return;
			}

			return callPreviewChanges().then(L.bind(function(preview) {
				this.showPreviewModal(mode, preview);
			}, this));
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	showPreviewModal: function(mode, preview) {
		if (!preview.success) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, preview.error || _('Preview failed')), 'error');
			return;
		}

		var content = [
			E('h4', {}, _('Changes to apply')),
			E('p', {}, preview.current_mode + ' → ' + preview.target_mode),
			E('ul', {},
				(preview.changes || []).map(function(change) {
					return E('li', {}, [
						E('strong', {}, change.file + ': '),
						E('span', {}, change.change)
					]);
				})
			)
		];

		if (preview.warnings && preview.warnings.length) {
			content.push(E('div', {
				'class': 'alert-message warning',
				'style': 'margin-top:12px;'
			}, [
				E('strong', {}, _('Warnings')),
				E('ul', {}, preview.warnings.map(function(w) { return E('li', {}, w); }))
			]));
		}

		content.push(E('div', { 'class': 'right', 'style': 'margin-top:16px;' }, [
			E('button', { 'class': 'nm-btn', 'click': ui.hideModal }, _('Cancel')),
			' ',
			E('button', { 'class': 'nm-btn nm-btn-primary', 'click': L.bind(this.handleApplyMode, this, mode) }, _('Apply Mode'))
		]));

		ui.showModal(_('Preview: ') + mode.name, content);
	},

	handleApplyMode: function(mode) {
		ui.showModal(_('Applying ') + mode.name, [
			E('p', { 'class': 'spinning' }, _('Updating network configuration…'))
		]);

		return callApplyMode().then(function(result) {
			ui.hideModal();
			if (!result.success) {
				ui.addNotification(null, E('p', {}, result.error || _('Failed to apply mode')), 'error');
				return;
			}

			ui.showModal(_('Mode applied'), [
				E('p', {}, _('Network restarting. If you lose connectivity, reconnect to the new subnet.')),
				E('p', {}, _('Confirm within 2 minutes to keep this mode.')),
				E('div', { 'class': 'right', 'style': 'margin-top:12px;' }, [
					E('button', {
						'class': 'nm-btn nm-btn-primary',
						'click': function() {
							ui.hideModal();
							window.location.reload();
						}
					}, _('Reload view'))
				])
			]);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleConfirmMode: function() {
		return callConfirmMode().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Mode confirmed')), 'info');
				setTimeout(function() { window.location.reload(); }, 1000);
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Confirmation failed')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleRollbackNow: function() {
		ui.showModal(_('Rollback...'), [
			E('p', { 'class': 'spinning' }, _('Restoring previous configuration...'))
		]);

		return callRollback().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Rollback started')), 'info');
				setTimeout(function() { window.location.reload(); }, 1500);
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Rollback failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	startRollbackPoll: function() {
		poll.add(L.bind(function() {
			return callGetCurrentMode().then(L.bind(function(data) {
				if (!data.rollback_active) {
					poll.stop();
					window.location.reload();
					return;
				}

				var timerElem = document.getElementById('rollback-timer');
				if (timerElem) {
					var remaining = data.rollback_remaining || 0;
					var minutes = Math.floor(remaining / 60);
					var seconds = remaining % 60;
					timerElem.textContent = _('Time left: ') + minutes + 'm ' + seconds + 's';
				}
			}, this));
		}, this), 1);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
