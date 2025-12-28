'use strict';
'require view';
'require rpc';
'require ui';
'require dom';
'require poll';

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

return view.extend({
	load: function() {
		return Promise.all([
			callGetAvailableModes(),
			callGetCurrentMode()
		]);
	},

	render: function(data) {
		var modes = data[0].modes || [];
		var currentModeData = data[1] || {};

		var container = E('div', { 'class': 'cbi-map' });

		// Header
		container.appendChild(E('h2', {}, _('Network Mode Switcher')));
		container.appendChild(E('div', { 'class': 'cbi-section-descr' },
			_('Sélectionnez et basculez entre différents modes réseau. Un rollback automatique de 2 minutes protège contre les configurations défectueuses.')
		));

		// Current mode status
		if (currentModeData.rollback_active) {
			var remaining = currentModeData.rollback_remaining || 0;
			container.appendChild(this.renderRollbackBanner(remaining, currentModeData.current_mode));
		} else {
			container.appendChild(this.renderCurrentMode(currentModeData));
		}

		// Modes grid
		container.appendChild(this.renderModesGrid(modes, currentModeData.current_mode));

		// Instructions
		container.appendChild(this.renderInstructions());

		// Start polling if rollback is active
		if (currentModeData.rollback_active) {
			this.startRollbackPoll();
		}

		return container;
	},

	renderCurrentMode: function(data) {
		var section = E('div', {
			'class': 'cbi-section',
			'style': 'background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 24px;'
		});

		section.appendChild(E('h3', { 'style': 'margin: 0 0 8px 0; color: #f1f5f9;' }, _('Mode Actuel')));
		section.appendChild(E('div', { 'style': 'color: #94a3b8; font-size: 14px;' }, [
			E('strong', { 'style': 'color: #22c55e; font-size: 18px;' }, data.mode_name || data.current_mode),
			E('br'),
			E('span', {}, data.description || ''),
			E('br'),
			E('span', { 'style': 'font-size: 12px;' }, _('Dernière modification: ') + (data.last_change || 'Never'))
		]));

		return section;
	},

	renderRollbackBanner: function(remaining, mode) {
		var minutes = Math.floor(remaining / 60);
		var seconds = remaining % 60;
		var timeStr = minutes + 'm ' + seconds + 's';

		var banner = E('div', {
			'class': 'alert-message warning',
			'style': 'background: #f59e0b; color: #000; padding: 16px; border-radius: 8px; margin-bottom: 24px;'
		}, [
			E('h3', { 'style': 'margin: 0 0 8px 0;' }, '⏱️ ' + _('Rollback Automatique Actif')),
			E('div', { 'id': 'rollback-timer', 'style': 'font-size: 20px; font-weight: bold; margin: 8px 0;' },
				_('Temps restant: ') + timeStr
			),
			E('div', { 'style': 'margin: 12px 0;' },
				_('Le mode ') + mode + _(' sera annulé automatiquement si vous ne confirmez pas.')
			),
			E('button', {
				'class': 'cbi-button cbi-button-positive',
				'style': 'margin-right: 8px;',
				'click': ui.createHandlerFn(this, 'handleConfirmMode')
			}, _('✓ Confirmer le Mode')),
			E('button', {
				'class': 'cbi-button cbi-button-negative',
				'click': ui.createHandlerFn(this, 'handleRollbackNow')
			}, _('↩ Annuler Maintenant'))
		]);

		return banner;
	},

	renderModesGrid: function(modes, currentMode) {
		var grid = E('div', {
			'class': 'cbi-section',
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;'
		});

		modes.forEach(L.bind(function(mode) {
			grid.appendChild(this.renderModeCard(mode, mode.current));
		}, this));

		return grid;
	},

	renderModeCard: function(mode, isCurrent) {
		var borderColor = isCurrent ? '#22c55e' : '#334155';
		var bgColor = isCurrent ? '#1e293b' : '#0f172a';

		var card = E('div', {
			'class': 'mode-card',
			'style': 'background: ' + bgColor + '; border: 2px solid ' + borderColor + '; border-radius: 8px; padding: 16px; cursor: ' + (isCurrent ? 'default' : 'pointer') + '; transition: all 0.2s;',
			'data-mode': mode.id
		});

		// Icon and name
		card.appendChild(E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, mode.icon));
		card.appendChild(E('div', { 'style': 'font-size: 18px; font-weight: bold; color: #f1f5f9; margin-bottom: 4px;' },
			mode.name
		));

		// Description
		card.appendChild(E('div', { 'style': 'color: #94a3b8; font-size: 14px; margin-bottom: 12px; min-height: 40px;' },
			mode.description
		));

		// Features list
		var featuresList = E('ul', { 'style': 'color: #64748b; font-size: 13px; margin: 12px 0; padding-left: 20px;' });
		(mode.features || []).forEach(function(feature) {
			featuresList.appendChild(E('li', {}, feature));
		});
		card.appendChild(featuresList);

		// Button
		if (isCurrent) {
			card.appendChild(E('div', {
				'class': 'cbi-value-description',
				'style': 'color: #22c55e; font-weight: bold; text-align: center; padding: 8px;'
			}, '✓ ' + _('Mode Actuel')));
		} else {
			var btn = E('button', {
				'class': 'cbi-button cbi-button-action',
				'style': 'width: 100%;',
				'click': ui.createHandlerFn(this, 'handleSwitchMode', mode)
			}, _('Switch to ') + mode.name);
			card.appendChild(btn);

			// Hover effect
			card.addEventListener('mouseenter', function() {
				this.style.borderColor = '#3b82f6';
				this.style.transform = 'translateY(-2px)';
			});
			card.addEventListener('mouseleave', function() {
				this.style.borderColor = borderColor;
				this.style.transform = 'translateY(0)';
			});
		}

		return card;
	},

	renderInstructions: function() {
		var section = E('div', { 'class': 'cbi-section' });
		section.appendChild(E('h3', {}, _('Instructions')));

		var steps = E('ol', { 'style': 'color: #94a3b8; line-height: 1.8;' });
		steps.appendChild(E('li', {}, _('Sélectionnez le mode réseau souhaité en cliquant sur "Switch to..."')));
		steps.appendChild(E('li', {}, _('Vérifiez les changements qui seront appliqués dans la prévisualisation')));
		steps.appendChild(E('li', {}, _('Confirmez l\'application - la configuration réseau sera modifiée')));
		steps.appendChild(E('li', {}, _('Reconnectez-vous via la nouvelle IP si nécessaire (notée dans les instructions)')));
		steps.appendChild(E('li', {}, _('Confirmez le nouveau mode dans les 2 minutes, sinon rollback automatique')));

		section.appendChild(steps);

		return section;
	},

	handleSwitchMode: function(mode, ev) {
		var modal = ui.showModal(_('Switch to ') + mode.name, [
			E('p', { 'class': 'spinning' }, _('Préparation du changement de mode...'))
		]);

		return callSetMode({ mode: mode.id }).then(L.bind(function(result) {
			if (!result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', result.error || _('Erreur')), 'error');
				return;
			}

			// Show preview
			return callPreviewChanges().then(L.bind(function(preview) {
				this.showPreviewModal(mode, preview);
			}, this));
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Erreur: ') + err.message), 'error');
		});
	},

	showPreviewModal: function(mode, preview) {
		if (!preview.success) {
			ui.hideModal();
			ui.addNotification(null, E('p', preview.error || _('Erreur')), 'error');
			return;
		}

		var content = [
			E('h4', {}, _('Changements qui seront appliqués:')),
			E('div', { 'style': 'background: #1e293b; padding: 12px; border-radius: 4px; margin: 12px 0;' }, [
				E('strong', {}, preview.current_mode + ' → ' + preview.target_mode)
			])
		];

		// Changes list
		var changesList = E('ul', { 'style': 'margin: 12px 0;' });
		(preview.changes || []).forEach(function(change) {
			changesList.appendChild(E('li', {}, [
				E('strong', {}, change.file + ': '),
				E('span', {}, change.change)
			]));
		});
		content.push(changesList);

		// Warnings
		if (preview.warnings && preview.warnings.length > 0) {
			content.push(E('div', {
				'class': 'alert-message warning',
				'style': 'background: #f59e0b20; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0;'
			}, [
				E('h5', { 'style': 'margin: 0 0 8px 0;' }, '⚠️ ' + _('Avertissements:')),
				E('ul', { 'style': 'margin: 0; padding-left: 20px;' },
					preview.warnings.map(function(w) {
						return E('li', {}, w);
					})
				)
			]));
		}

		// Buttons
		content.push(E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'click': ui.hideModal
			}, _('Annuler')),
			' ',
			E('button', {
				'class': 'cbi-button cbi-button-positive',
				'click': L.bind(this.handleApplyMode, this, mode)
			}, _('Appliquer le Mode'))
		]));

		ui.showModal(_('Prévisualisation: ') + mode.name, content);
	},

	handleApplyMode: function(mode, ev) {
		ui.showModal(_('Application en cours...'), [
			E('p', { 'class': 'spinning' }, _('Application du mode ') + mode.name + '...'),
			E('p', {}, _('La connexion réseau sera brièvement interrompue.'))
		]);

		return callApplyMode().then(function(result) {
			if (!result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', result.error || _('Erreur')), 'error');
				return;
			}

			ui.hideModal();

			// Show success with instructions
			ui.showModal(_('Mode Appliqué'), [
				E('div', { 'class': 'alert-message success' }, [
					E('h4', {}, '✓ ' + _('Mode ') + mode.name + _(' activé')),
					E('p', {}, _('Rollback automatique dans 2 minutes si non confirmé.')),
					E('p', {}, _('Si vous perdez la connexion:')),
					E('ul', {}, [
						E('li', {}, _('Router: http://192.168.1.1')),
						E('li', {}, _('Access Point/Bridge: Utilisez DHCP')),
						E('li', {}, _('Repeater: http://192.168.2.1'))
					])
				]),
				E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': function() {
							ui.hideModal();
							window.location.reload();
						}
					}, _('Recharger la Page'))
				])
			]);

		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Erreur: ') + err.message), 'error');
		});
	},

	handleConfirmMode: function(ev) {
		return callConfirmMode().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
				setTimeout(function() {
					window.location.reload();
				}, 1000);
			} else {
				ui.addNotification(null, E('p', result.error), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Erreur: ') + err.message), 'error');
		});
	},

	handleRollbackNow: function(ev) {
		if (!confirm(_('Annuler le changement de mode et revenir à la configuration précédente?'))) {
			return;
		}

		ui.showModal(_('Rollback...'), [
			E('p', { 'class': 'spinning' }, _('Restauration de la configuration précédente...'))
		]);

		return callRollback().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
				setTimeout(function() {
					window.location.reload();
				}, 2000);
			} else {
				ui.addNotification(null, E('p', result.error), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Erreur: ') + err.message), 'error');
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
					timerElem.textContent = _('Temps restant: ') + minutes + 'm ' + seconds + 's';
				}
			}, this));
		}, this), 1);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
