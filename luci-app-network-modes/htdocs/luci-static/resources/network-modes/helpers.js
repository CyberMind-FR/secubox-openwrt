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

function createHero(options) {
	var gradient = options.gradient || 'linear-gradient(135deg,#0f172a,#1d4ed8)';
	return E('div', {
		'class': 'nm-hero',
		'style': 'background:' + gradient + ';border-radius:16px;padding:20px;margin-bottom:24px;color:#f8fafc;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;'
	}, [
		E('div', {}, [
			E('div', { 'style': 'font-size:32px;margin-bottom:4px;' }, options.icon || '🌐'),
			E('h2', { 'style': 'margin:0;font-size:24px;' }, options.title || _('Network Mode')),
			E('p', { 'style': 'margin:4px 0 0;color:#cbd5f5;max-width:460px;' }, options.subtitle || '')
		]),
		E('div', { 'style': 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;' }, (options.actions || []))
	]);
}

function createStatBadge(stat) {
	return E('div', {
		'class': 'nm-hero-badge',
		'style': 'background:rgba(15,23,42,.7);border:1px solid rgba(148,163,184,.4);border-radius:12px;padding:12px 16px;min-width:120px;text-align:center;'
	}, [
		E('div', { 'style': 'font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;' }, stat.label),
		E('div', { 'style': 'font-size:20px;font-weight:600;color:#e2e8f0;' }, stat.value)
	]);
}

function createSection(options) {
	return E('div', { 'class': 'nm-card' }, [
		E('div', { 'class': 'nm-card-header' }, [
			E('div', { 'class': 'nm-card-title' }, [
				E('span', { 'class': 'nm-card-title-icon' }, options.icon || '📦'),
				options.title || ''
			]),
			options.badge ? E('div', { 'class': 'nm-card-badge' }, options.badge) : ''
		]),
		E('div', { 'class': 'nm-card-body' }, options.body || [])
	]);
}

function createList(items) {
	return E('ul', {
		'style': 'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;'
	}, items.map(function(item) {
		return E('li', {
			'style': 'padding:12px 16px;border:1px solid rgba(148,163,184,.3);border-radius:10px;display:flex;justify-content:space-between;align-items:center;'
		}, [
			E('div', {}, [
				E('div', { 'style': 'font-weight:600;margin-bottom:4px;' }, item.title),
				item.description ? E('div', { 'style': 'font-size:13px;color:#94a3b8;' }, item.description) : ''
			]),
			item.suffix || ''
		]);
	}));
}

function createStepper(steps, active) {
	return E('div', { 'class': 'nm-stepper' }, steps.map(function(step, idx) {
		var isActive = idx === active;
		var isComplete = idx < active;
		return E('div', { 'class': 'nm-stepper-step' + (isActive ? ' active' : '') + (isComplete ? ' complete' : '') }, [
			E('div', { 'class': 'nm-stepper-index' }, isComplete ? '✓' : (idx + 1)),
			E('div', { 'class': 'nm-stepper-info' }, [
				E('div', { 'class': 'nm-stepper-title' }, step.title),
				E('div', { 'class': 'nm-stepper-desc' }, step.description || '')
			])
		]);
	}));
}

return {
	isToggleActive: isToggleActive,
	persistSettings: persistSettings,
	showGeneratedConfig: showGeneratedConfig,
	createHero: createHero,
	createStatBadge: createStatBadge,
	createSection: createSection,
	createList: createList,
	createStepper: createStepper
};
