'use strict';
'require baseclass';
'require dom';
'require ui';

/**
 * NFO Viewer Component
 * Reusable UI component for viewing NFO module manifests
 * Can be used in streamlit-forge, metacatalog, service-registry, etc.
 */
return baseclass.extend({
	/**
	 * Create an NFO viewer widget
	 * @param {Object} nfoData - NFO data as JSON object
	 * @param {Object} options - Viewer options
	 * @param {boolean} options.editable - Show edit button
	 * @param {boolean} options.collapsible - Make sections collapsible
	 * @param {boolean} options.showValidation - Show validation status
	 * @param {Function} options.onEdit - Callback when edit is clicked
	 * @returns {Element} DOM element containing the viewer
	 */
	render: function(nfoData, options) {
		options = options || {};
		var editable = options.editable !== false;
		var collapsible = options.collapsible !== false;
		var showValidation = options.showValidation !== false;
		var onEdit = options.onEdit || null;

		var container = E('div', { 'class': 'nfo-viewer' });

		// Header with validation status
		var header = E('div', { 'class': 'nfo-viewer-header' }, [
			E('h4', {}, [
				E('span', { 'class': 'nfo-icon' }, '\u{1F4C4}'),
				' ',
				nfoData.identity ? nfoData.identity.name || 'Unknown' : 'NFO Manifest'
			])
		]);

		if (showValidation && nfoData.completeness !== undefined) {
			var scoreClass = nfoData.completeness >= 80 ? 'good' :
			                 nfoData.completeness >= 50 ? 'warn' : 'bad';
			header.appendChild(E('span', {
				'class': 'nfo-score nfo-score-' + scoreClass,
				'title': 'Completeness score'
			}, nfoData.completeness + '%'));
		}

		if (editable && onEdit) {
			header.appendChild(E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': onEdit
			}, _('Edit')));
		}

		container.appendChild(header);

		// Sections
		var sections = [
			{ key: 'identity', title: _('Identity'), icon: '\u{1F464}' },
			{ key: 'description', title: _('Description'), icon: '\u{1F4DD}' },
			{ key: 'tags', title: _('Classification'), icon: '\u{1F3F7}' },
			{ key: 'runtime', title: _('Runtime'), icon: '\u{2699}' },
			{ key: 'dynamics', title: _('AI Context'), icon: '\u{1F916}' },
			{ key: 'mesh', title: _('Mesh'), icon: '\u{1F310}' },
			{ key: 'exposure', title: _('Exposure'), icon: '\u{1F512}' }
		];

		sections.forEach(function(section) {
			if (!nfoData[section.key]) return;

			var sectionEl = this.renderSection(
				section.title,
				section.icon,
				nfoData[section.key],
				collapsible
			);
			if (sectionEl) {
				container.appendChild(sectionEl);
			}
		}.bind(this));

		// JSON export button
		var footer = E('div', { 'class': 'nfo-viewer-footer' }, [
			E('button', {
				'class': 'cbi-button',
				'click': function() {
					this.copyToClipboard(JSON.stringify(nfoData, null, 2));
				}.bind(this)
			}, ['\u{1F4CB} ', _('Copy JSON')])
		]);
		container.appendChild(footer);

		// Add styles
		this.injectStyles();

		return container;
	},

	/**
	 * Render a single section
	 */
	renderSection: function(title, icon, data, collapsible) {
		if (!data || Object.keys(data).length === 0) return null;

		var section = E('div', { 'class': 'nfo-section' });

		var headerEl = E('div', {
			'class': 'nfo-section-header' + (collapsible ? ' collapsible' : ''),
			'click': collapsible ? function(ev) {
				var content = ev.currentTarget.nextElementSibling;
				var isHidden = content.style.display === 'none';
				content.style.display = isHidden ? 'block' : 'none';
				ev.currentTarget.classList.toggle('collapsed', !isHidden);
			} : null
		}, [
			E('span', { 'class': 'nfo-section-icon' }, icon),
			' ',
			E('span', { 'class': 'nfo-section-title' }, title),
			collapsible ? E('span', { 'class': 'nfo-section-toggle' }, '\u25BC') : ''
		]);
		section.appendChild(headerEl);

		var content = E('div', { 'class': 'nfo-section-content' });

		// Render fields
		Object.keys(data).forEach(function(key) {
			var value = data[key];
			if (value === null || value === undefined || value === '') return;

			var fieldEl = this.renderField(key, value);
			if (fieldEl) {
				content.appendChild(fieldEl);
			}
		}.bind(this));

		section.appendChild(content);
		return section;
	},

	/**
	 * Render a single field
	 */
	renderField: function(key, value) {
		var field = E('div', { 'class': 'nfo-field' });

		// Format key for display
		var displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, function(l) {
			return l.toUpperCase();
		});

		field.appendChild(E('span', { 'class': 'nfo-field-key' }, displayKey + ':'));

		// Handle different value types
		if (typeof value === 'object' && !Array.isArray(value)) {
			// Nested object - render recursively
			var nested = E('div', { 'class': 'nfo-nested' });
			Object.keys(value).forEach(function(k) {
				var nestedField = this.renderField(k, value[k]);
				if (nestedField) nested.appendChild(nestedField);
			}.bind(this));
			field.appendChild(nested);
		} else if (Array.isArray(value)) {
			// Array - render as list
			var list = E('ul', { 'class': 'nfo-list' });
			value.forEach(function(item) {
				list.appendChild(E('li', {}, String(item)));
			});
			field.appendChild(list);
		} else if (typeof value === 'string' && value.includes('\n')) {
			// Multiline string - render as pre
			field.appendChild(E('pre', { 'class': 'nfo-multiline' }, value));
		} else if (typeof value === 'boolean') {
			// Boolean - render as yes/no
			field.appendChild(E('span', {
				'class': 'nfo-field-value nfo-bool-' + (value ? 'true' : 'false')
			}, value ? _('Yes') : _('No')));
		} else if (key === 'capabilities' || key === 'keywords') {
			// Comma-separated list - render as tags
			var tags = E('span', { 'class': 'nfo-tags' });
			String(value).split(',').forEach(function(tag) {
				tag = tag.trim();
				if (tag) {
					tags.appendChild(E('span', { 'class': 'nfo-tag' }, tag));
				}
			});
			field.appendChild(tags);
		} else {
			field.appendChild(E('span', { 'class': 'nfo-field-value' }, String(value)));
		}

		return field;
	},

	/**
	 * Copy text to clipboard
	 */
	copyToClipboard: function(text) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(function() {
				ui.addNotification(null, E('p', _('Copied to clipboard')), 'info');
			});
		} else {
			var textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			ui.addNotification(null, E('p', _('Copied to clipboard')), 'info');
		}
	},

	/**
	 * Inject CSS styles
	 */
	injectStyles: function() {
		if (document.getElementById('nfo-viewer-styles')) return;

		var styles = E('style', { 'id': 'nfo-viewer-styles' }, [
			'.nfo-viewer { ',
			'  background: var(--background-color-low, #f8f9fa); ',
			'  border: 1px solid var(--border-color-medium, #dee2e6); ',
			'  border-radius: 8px; ',
			'  padding: 16px; ',
			'  margin: 8px 0; ',
			'} ',
			'.nfo-viewer-header { ',
			'  display: flex; ',
			'  align-items: center; ',
			'  gap: 12px; ',
			'  margin-bottom: 16px; ',
			'  padding-bottom: 12px; ',
			'  border-bottom: 1px solid var(--border-color-medium, #dee2e6); ',
			'} ',
			'.nfo-viewer-header h4 { ',
			'  margin: 0; ',
			'  flex-grow: 1; ',
			'} ',
			'.nfo-icon { font-size: 1.2em; } ',
			'.nfo-score { ',
			'  padding: 4px 12px; ',
			'  border-radius: 12px; ',
			'  font-weight: bold; ',
			'  font-size: 0.9em; ',
			'} ',
			'.nfo-score-good { background: #d4edda; color: #155724; } ',
			'.nfo-score-warn { background: #fff3cd; color: #856404; } ',
			'.nfo-score-bad { background: #f8d7da; color: #721c24; } ',
			'.nfo-section { ',
			'  margin-bottom: 12px; ',
			'  border: 1px solid var(--border-color-low, #e9ecef); ',
			'  border-radius: 6px; ',
			'  overflow: hidden; ',
			'} ',
			'.nfo-section-header { ',
			'  padding: 10px 14px; ',
			'  background: var(--background-color-medium, #e9ecef); ',
			'  font-weight: 600; ',
			'  display: flex; ',
			'  align-items: center; ',
			'  gap: 8px; ',
			'} ',
			'.nfo-section-header.collapsible { cursor: pointer; } ',
			'.nfo-section-header.collapsible:hover { ',
			'  background: var(--background-color-high, #dde0e4); ',
			'} ',
			'.nfo-section-toggle { ',
			'  margin-left: auto; ',
			'  transition: transform 0.2s; ',
			'} ',
			'.nfo-section-header.collapsed .nfo-section-toggle { ',
			'  transform: rotate(-90deg); ',
			'} ',
			'.nfo-section-content { ',
			'  padding: 12px 14px; ',
			'  background: var(--background-color-high, white); ',
			'} ',
			'.nfo-field { ',
			'  display: flex; ',
			'  gap: 8px; ',
			'  padding: 4px 0; ',
			'  border-bottom: 1px solid var(--border-color-low, #f0f0f0); ',
			'} ',
			'.nfo-field:last-child { border-bottom: none; } ',
			'.nfo-field-key { ',
			'  font-weight: 500; ',
			'  color: var(--text-color-medium, #666); ',
			'  min-width: 120px; ',
			'  flex-shrink: 0; ',
			'} ',
			'.nfo-field-value { ',
			'  color: var(--text-color-high, #333); ',
			'} ',
			'.nfo-bool-true { color: #28a745; } ',
			'.nfo-bool-false { color: #dc3545; } ',
			'.nfo-tags { display: flex; flex-wrap: wrap; gap: 4px; } ',
			'.nfo-tag { ',
			'  background: var(--primary-color-low, #e3f2fd); ',
			'  color: var(--primary-color-high, #1976d2); ',
			'  padding: 2px 8px; ',
			'  border-radius: 12px; ',
			'  font-size: 0.85em; ',
			'} ',
			'.nfo-multiline { ',
			'  background: var(--background-color-low, #f5f5f5); ',
			'  padding: 8px; ',
			'  border-radius: 4px; ',
			'  margin: 4px 0; ',
			'  overflow-x: auto; ',
			'  font-size: 0.9em; ',
			'  white-space: pre-wrap; ',
			'} ',
			'.nfo-list { ',
			'  margin: 4px 0; ',
			'  padding-left: 20px; ',
			'} ',
			'.nfo-nested { ',
			'  padding-left: 16px; ',
			'  border-left: 2px solid var(--border-color-low, #e0e0e0); ',
			'  margin-left: 4px; ',
			'} ',
			'.nfo-viewer-footer { ',
			'  margin-top: 16px; ',
			'  padding-top: 12px; ',
			'  border-top: 1px solid var(--border-color-medium, #dee2e6); ',
			'  text-align: right; ',
			'} '
		].join('\n'));

		document.head.appendChild(styles);
	},

	/**
	 * Create a compact NFO badge showing key info
	 * @param {Object} nfoData - NFO data as JSON object
	 * @returns {Element} DOM element containing the badge
	 */
	renderBadge: function(nfoData) {
		if (!nfoData || !nfoData.identity) {
			return E('span', { 'class': 'nfo-badge nfo-badge-missing' }, [
				'\u{26A0} ',
				_('No NFO')
			]);
		}

		var badge = E('span', { 'class': 'nfo-badge' }, [
			E('span', { 'class': 'nfo-badge-name' }, nfoData.identity.name || 'Unknown'),
			nfoData.identity.version ? E('span', { 'class': 'nfo-badge-version' }, 'v' + nfoData.identity.version) : '',
			nfoData.tags && nfoData.tags.category ? E('span', { 'class': 'nfo-badge-category' }, nfoData.tags.category) : ''
		]);

		// Add badge styles
		if (!document.getElementById('nfo-badge-styles')) {
			document.head.appendChild(E('style', { 'id': 'nfo-badge-styles' }, [
				'.nfo-badge { ',
				'  display: inline-flex; ',
				'  align-items: center; ',
				'  gap: 6px; ',
				'  padding: 4px 10px; ',
				'  background: var(--background-color-low, #f0f0f0); ',
				'  border-radius: 4px; ',
				'  font-size: 0.9em; ',
				'} ',
				'.nfo-badge-missing { ',
				'  background: #fff3cd; ',
				'  color: #856404; ',
				'} ',
				'.nfo-badge-name { font-weight: 600; } ',
				'.nfo-badge-version { ',
				'  color: var(--text-color-medium, #666); ',
				'  font-size: 0.85em; ',
				'} ',
				'.nfo-badge-category { ',
				'  background: var(--primary-color-low, #e3f2fd); ',
				'  color: var(--primary-color-high, #1976d2); ',
				'  padding: 1px 6px; ',
				'  border-radius: 10px; ',
				'  font-size: 0.8em; ',
				'} '
			].join('\n')));
		}

		return badge;
	}
});
