'use strict';
'require baseclass';

/**
 * SecuBox Cascade runtime helper.
 * Generates layered menus/tabs/categories that stay in sync with dataset state.
 */

function assign(target, source) {
	if (!source)
		return target;
	Object.keys(source).forEach(function(key) {
		target[key] = source[key];
	});
	return target;
}

return baseclass.extend({
	createLayer: function(config) {
		var layer = this._createLayerNode(config);
		this._renderItems(layer, config);
		return layer;
	},

	decorateLayer: function(element, meta) {
		if (!element)
			return element;
		element.classList.add('sb-cascade-layer');
		if (meta && meta.type)
			element.setAttribute('data-cascade-layer', meta.type);
		if (meta && meta.depth)
			element.setAttribute('data-cascade-depth', String(meta.depth));
		if (meta && meta.role)
			element.setAttribute('data-cascade-role', meta.role);
		if (meta && meta.label)
			element.setAttribute('data-cascade-label', meta.label);
		return element;
	},

	updateLayer: function(layer, config) {
		if (!layer)
			return;
		if (config && config.items)
			this._renderItems(layer, config);
		if (config && config.active)
			this.setActiveItem(layer, config.active);
	},

	setActiveItem: function(layer, id) {
		if (!layer)
			return;
		var items = layer.querySelectorAll('[data-cascade-item]');
		Array.prototype.forEach.call(items, function(node) {
			if (node.getAttribute('data-cascade-item') === id) {
				node.setAttribute('data-state', 'active');
				layer.setAttribute('data-cascade-active', id);
			} else {
				node.removeAttribute('data-state');
			}
		});
	},

	_createLayerNode: function(config) {
		var node = config.element || E(config.tag || 'div', {});
		node.classList.add('sb-cascade-layer');
		if (config.className)
			config.className.split(' ').forEach(function(cls) {
				if (cls)
					node.classList.add(cls);
			});
		node.setAttribute('data-cascade-layer', config.type || 'generic');
		if (config.role)
			node.setAttribute('data-cascade-role', config.role);
		if (config.depth)
			node.setAttribute('data-cascade-depth', String(config.depth));
		if (config.label)
			node.setAttribute('data-cascade-label', config.label);
		if (config.id)
			node.setAttribute('data-cascade-id', config.id);
		return node;
	},

	_renderItems: function(layer, config) {
		var self = this;
		layer.textContent = '';
		var items = config.items || [];
		items.forEach(function(item) {
			layer.appendChild(self._createItemNode(config, item));
		});
		layer.setAttribute('data-cascade-count', items.length);
		if (config.active)
			this.setActiveItem(layer, config.active);
	},

	_createItemNode: function(config, item) {
		var tag = item.tag || config.itemTag || (item.href ? 'a' : 'button');
		var attrs = assign({}, item.attrs || {});
		var id = item.id || item.value || item.label || String(Math.random());
		attrs['data-cascade-item'] = id;
		if (item.category)
			attrs['data-cascade-category'] = item.category;
		if (item.status)
			attrs['data-cascade-status'] = item.status;
		if (item.badge !== undefined)
			attrs['data-cascade-badge'] = item.badge;
		if (item.state)
			attrs['data-state'] = item.state;
		if (item.href && tag === 'a')
			attrs.href = item.href;
		if (tag === 'button')
			attrs.type = attrs.type || 'button';
		if (config.role)
			attrs['data-cascade-role'] = config.role;

		var classNames = ['sb-cascade-item'];
		if (config.itemClass)
			classNames.push(config.itemClass);
		if (item.className)
			classNames.push(item.className);
		if (item.class)
			classNames.push(item.class);
		if (attrs['class']) {
			classNames.push(attrs['class']);
			delete attrs['class'];
		}
		attrs['class'] = classNames.join(' ');

		var children = [];
		if (item.icon)
			children.push(E('span', { 'class': 'sb-cascade-icon' }, item.icon));
		children.push(E('span', { 'class': 'sb-cascade-label' }, item.label || ''));
		if (item.badge !== undefined && item.badge !== null)
			children.push(E('span', { 'class': 'sb-cascade-badge' }, item.badge));

		var node = E(tag, attrs, children);
		var clickHandler = item.onSelect || config.onSelect;
		if (typeof clickHandler === 'function') {
			node.addEventListener('click', function(ev) {
				var result = clickHandler(item, ev);
				if (result === false)
					ev.preventDefault();
			});
		}

		return node;
	}
});
