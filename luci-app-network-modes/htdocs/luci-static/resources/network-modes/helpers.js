'use strict';
'require ui';
'require network-modes.api as api';

function isToggleActive(node) {
	return !!(node && node.classList.contains('active'));
}

function persistSettings(mode, payload) {
	ui.showModal(_('Saving settings...'), [
		E('p', { 'class': 'spinning' }, _('Applying configuration changes...'))
	]);

	return api.updateSettings(mode, payload).then(function(result) {
		ui.hideModal();
		if (result && result.success) {
			ui.addNotification(null, E('p', {}, result.message || _('Settings updated')), 'info');
		} else {
			ui.addNotification(null, E('p', {}, (result && result.error) || _('Failed to update settings')), 'error');
		}
	}).catch(function(err) {
		ui.hideModal();
		ui.addNotification(null, E('p', {}, err.message || err), 'error');
	});
}

function showGeneratedConfig(mode) {
	ui.showModal(_('Generating configuration...'), [
		E('p', { 'class': 'spinning' }, _('Building configuration preview...'))
	]);

	return api.generateConfig(mode).then(function(result) {
		ui.hideModal();

		if (!result || !result.config) {
			ui.addNotification(null, E('p', {}, _('No configuration data returned')), 'error');
			return;
		}

		ui.showModal(_('Configuration Preview'), [
			E('pre', { 'class': 'nm-config-preview' }, result.config),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': ui.hideModal
				}, _('Close'))
			])
		]);
	}).catch(function(err) {
		ui.hideModal();
		ui.addNotification(null, E('p', {}, err.message || err), 'error');
	});
}

return {
	isToggleActive: isToggleActive,
	persistSettings: persistSettings,
	showGeneratedConfig: showGeneratedConfig
};
