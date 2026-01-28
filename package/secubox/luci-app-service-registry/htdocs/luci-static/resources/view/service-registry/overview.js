'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require service-registry/api as api';

// Icon mapping
var icons = {
	'server': '🖥️', 'music': '🎵', 'shield': '🛡️', 'chart': '📊',
	'settings': '⚙️', 'git': '📦', 'blog': '📝', 'arrow': '➡️',
	'onion': '🧅', 'lock': '🔒', 'globe': '🌐', 'box': '📦',
	'app': '📱', 'admin': '👤', 'stats': '📈', 'security': '🔐',
	'feed': '📡', 'default': '🔗'
};

function getIcon(name) {
	return icons[name] || icons['default'];
}

// Simple QR code generator
var QRCode = {
	generateSVG: function(data, size) {
		// Basic implementation - generates a simple visual representation
		var matrix = this.generateMatrix(data);
		var cellSize = size / matrix.length;
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">';
		svg += '<rect width="100%" height="100%" fill="white"/>';
		for (var row = 0; row < matrix.length; row++) {
			for (var col = 0; col < matrix[row].length; col++) {
				if (matrix[row][col]) {
					svg += '<rect x="' + (col * cellSize) + '" y="' + (row * cellSize) +
						   '" width="' + cellSize + '" height="' + cellSize + '" fill="black"/>';
				}
			}
		}
		svg += '</svg>';
		return svg;
	},
	generateMatrix: function(data) {
		var size = Math.max(21, Math.min(41, Math.ceil(data.length / 2) + 17));
		var matrix = [];
		for (var i = 0; i < size; i++) {
			matrix[i] = [];
			for (var j = 0; j < size; j++) {
				matrix[i][j] = 0;
			}
		}
		// Add finder patterns
		this.addFinderPattern(matrix, 0, 0);
		this.addFinderPattern(matrix, size - 7, 0);
		this.addFinderPattern(matrix, 0, size - 7);
		// Timing
		for (var i = 8; i < size - 8; i++) {
			matrix[6][i] = matrix[i][6] = i % 2 === 0 ? 1 : 0;
		}
		// Data encoding (simplified)
		var dataIndex = 0;
		for (var col = size - 1; col > 0; col -= 2) {
			if (col === 6) col--;
			for (var row = 0; row < size; row++) {
				for (var c = 0; c < 2; c++) {
					var x = col - c;
					if (matrix[row][x] === 0 && dataIndex < data.length * 8) {
						var byteIndex = Math.floor(dataIndex / 8);
						var bitIndex = dataIndex % 8;
						var bit = byteIndex < data.length ?
							(data.charCodeAt(byteIndex) >> (7 - bitIndex)) & 1 : 0;
						matrix[row][x] = bit;
						dataIndex++;
					}
				}
			}
		}
		return matrix;
	},
	addFinderPattern: function(matrix, row, col) {
		for (var r = 0; r < 7; r++) {
			for (var c = 0; c < 7; c++) {
				if ((r === 0 || r === 6 || c === 0 || c === 6) ||
					(r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
					matrix[row + r][col + c] = 1;
				}
			}
		}
	}
};

return view.extend({
	title: _('Service Registry'),
	pollInterval: 30,

	load: function() {
		return api.getDashboardData();
	},

	render: function(data) {
		var self = this;
		var services = data.services || [];
		var providers = data.providers || {};
		var categories = data.categories || [];

		// Load CSS
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('service-registry/registry.css');
		document.head.appendChild(link);

		return E('div', { 'class': 'sr-dashboard' }, [
			this.renderHeader(),
			this.renderStats(services, providers),
			this.renderProviders(providers, data.haproxy, data.tor),
			this.renderQuickPublish(categories),
			this.renderServiceGrid(services, categories),
			this.renderLandingLink(data.landing)
		]);
	},

	renderHeader: function() {
		return E('h2', { 'class': 'cbi-title' }, _('Service Registry'));
	},

	renderStats: function(services, providers) {
		var published = services.filter(function(s) { return s.published; }).length;
		var running = services.filter(function(s) { return s.status === 'running'; }).length;
		var haproxyCount = providers.haproxy ? providers.haproxy.count : 0;
		var torCount = providers.tor ? providers.tor.count : 0;

		return E('div', { 'class': 'sr-stats' }, [
			E('div', { 'class': 'sr-stat-card' }, [
				E('div', { 'class': 'sr-stat-value' }, String(published)),
				E('div', { 'class': 'sr-stat-label' }, _('Published'))
			]),
			E('div', { 'class': 'sr-stat-card' }, [
				E('div', { 'class': 'sr-stat-value' }, String(running)),
				E('div', { 'class': 'sr-stat-label' }, _('Running'))
			]),
			E('div', { 'class': 'sr-stat-card' }, [
				E('div', { 'class': 'sr-stat-value' }, String(haproxyCount)),
				E('div', { 'class': 'sr-stat-label' }, _('Domains'))
			]),
			E('div', { 'class': 'sr-stat-card' }, [
				E('div', { 'class': 'sr-stat-value' }, String(torCount)),
				E('div', { 'class': 'sr-stat-label' }, _('Onion Sites'))
			])
		]);
	},

	renderProviders: function(providers, haproxy, tor) {
		return E('div', { 'class': 'sr-providers' }, [
			E('div', { 'class': 'sr-provider' }, [
				E('span', { 'class': 'sr-provider-dot ' + (haproxy && haproxy.container_running ? 'running' : 'stopped') }),
				E('span', {}, _('HAProxy'))
			]),
			E('div', { 'class': 'sr-provider' }, [
				E('span', { 'class': 'sr-provider-dot ' + (tor && tor.running ? 'running' : 'stopped') }),
				E('span', {}, _('Tor'))
			]),
			E('div', { 'class': 'sr-provider' }, [
				E('span', { 'class': 'sr-provider-dot running' }),
				E('span', {}, _('Direct: ') + String(providers.direct ? providers.direct.count : 0))
			]),
			E('div', { 'class': 'sr-provider' }, [
				E('span', { 'class': 'sr-provider-dot running' }),
				E('span', {}, _('LXC: ') + String(providers.lxc ? providers.lxc.count : 0))
			])
		]);
	},

	renderQuickPublish: function(categories) {
		var self = this;

		var categoryOptions = [E('option', { 'value': 'services' }, _('Services'))];
		categories.forEach(function(cat) {
			categoryOptions.push(E('option', { 'value': cat.id }, cat.name));
		});

		return E('div', { 'class': 'sr-quick-publish' }, [
			E('h3', {}, _('Quick Publish')),
			E('div', { 'class': 'sr-form' }, [
				E('div', { 'class': 'sr-form-group' }, [
					E('label', {}, _('Service Name')),
					E('input', { 'type': 'text', 'id': 'pub-name', 'placeholder': 'e.g., Gitea' })
				]),
				E('div', { 'class': 'sr-form-group' }, [
					E('label', {}, _('Local Port')),
					E('input', { 'type': 'number', 'id': 'pub-port', 'placeholder': '3000' })
				]),
				E('div', { 'class': 'sr-form-group' }, [
					E('label', {}, _('Domain (optional)')),
					E('input', { 'type': 'text', 'id': 'pub-domain', 'placeholder': 'git.example.com' })
				]),
				E('div', { 'class': 'sr-form-group' }, [
					E('label', {}, _('Category')),
					E('select', { 'id': 'pub-category' }, categoryOptions)
				]),
				E('div', { 'class': 'sr-checkbox-group' }, [
					E('input', { 'type': 'checkbox', 'id': 'pub-tor' }),
					E('label', { 'for': 'pub-tor' }, _('Enable Tor Hidden Service'))
				]),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': ui.createHandlerFn(this, 'handlePublish')
				}, _('Publish'))
			])
		]);
	},

	handlePublish: function() {
		var self = this;
		var name = document.getElementById('pub-name').value.trim();
		var port = parseInt(document.getElementById('pub-port').value);
		var domain = document.getElementById('pub-domain').value.trim();
		var category = document.getElementById('pub-category').value;
		var tor = document.getElementById('pub-tor').checked;

		if (!name || !port) {
			ui.addNotification(null, E('p', _('Name and port are required')), 'error');
			return;
		}

		ui.showModal(_('Publishing Service'), [
			E('p', { 'class': 'spinning' }, _('Creating service endpoints...'))
		]);

		return api.publishService(name, port, domain, tor, category, '').then(function(result) {
			ui.hideModal();

			if (result.success) {
				self.showPublishedModal(result);
				// Refresh view
				return self.load().then(function(data) {
					var container = document.querySelector('.sr-dashboard');
					if (container) {
						dom.content(container, self.render(data).childNodes);
					}
				});
			} else {
				ui.addNotification(null, E('p', _('Failed to publish: ') + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	showPublishedModal: function(result) {
		var urls = result.urls || {};
		var content = [
			E('div', { 'class': 'sr-published-modal' }, [
				E('h3', {}, _('Service Published Successfully!')),
				E('p', {}, result.name)
			])
		];

		var urlsDiv = E('div', { 'class': 'sr-urls' });

		if (urls.local) {
			urlsDiv.appendChild(E('div', { 'class': 'sr-url-box' }, [
				E('label', {}, _('Local')),
				E('input', { 'readonly': true, 'value': urls.local })
			]));
		}

		if (urls.clearnet) {
			urlsDiv.appendChild(E('div', { 'class': 'sr-url-box' }, [
				E('label', {}, _('Clearnet')),
				E('input', { 'readonly': true, 'value': urls.clearnet }),
				E('div', { 'class': 'sr-qr-code' }),
			]));
			var qrDiv = urlsDiv.querySelector('.sr-qr-code:last-child');
			if (qrDiv) {
				qrDiv.innerHTML = QRCode.generateSVG(urls.clearnet, 120);
			}
		}

		if (urls.onion) {
			urlsDiv.appendChild(E('div', { 'class': 'sr-url-box' }, [
				E('label', {}, _('Onion')),
				E('input', { 'readonly': true, 'value': urls.onion }),
				E('div', { 'class': 'sr-qr-code' })
			]));
			var qrDiv = urlsDiv.querySelectorAll('.sr-qr-code');
			if (qrDiv.length > 0) {
				qrDiv[qrDiv.length - 1].innerHTML = QRCode.generateSVG(urls.onion, 120);
			}
		}

		content[0].appendChild(urlsDiv);

		// Share buttons
		var shareUrl = urls.clearnet || urls.onion || urls.local;
		if (shareUrl) {
			content[0].appendChild(E('div', { 'class': 'sr-share-buttons' }, [
				E('a', {
					'href': 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(shareUrl),
					'target': '_blank',
					'title': 'Share on X'
				}, 'X'),
				E('a', {
					'href': 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl),
					'target': '_blank',
					'title': 'Share on Telegram'
				}, 'TG'),
				E('a', {
					'href': 'https://wa.me/?text=' + encodeURIComponent(shareUrl),
					'target': '_blank',
					'title': 'Share on WhatsApp'
				}, 'WA')
			]));
		}

		content.push(E('div', { 'class': 'right' }, [
			E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
		]));

		ui.showModal(_('Service Published'), content);
	},

	renderServiceGrid: function(services, categories) {
		var self = this;

		if (services.length === 0) {
			return E('div', { 'class': 'sr-empty' }, [
				E('h3', {}, _('No Services Found')),
				E('p', {}, _('Use the quick publish form above to add your first service'))
			]);
		}

		// Group by category
		var grouped = {};
		services.forEach(function(svc) {
			var cat = svc.category || 'other';
			if (!grouped[cat]) grouped[cat] = [];
			grouped[cat].push(svc);
		});

		var sections = [];
		Object.keys(grouped).sort().forEach(function(cat) {
			sections.push(E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, cat.charAt(0).toUpperCase() + cat.slice(1)),
				E('div', { 'class': 'sr-grid' },
					grouped[cat].map(function(svc) {
						return self.renderServiceCard(svc);
					})
				)
			]));
		});

		return E('div', {}, sections);
	},

	renderServiceCard: function(service) {
		var self = this;
		var urls = service.urls || {};

		var urlRows = [];
		if (urls.local) {
			urlRows.push(this.renderUrlRow('Local', urls.local));
		}
		if (urls.clearnet) {
			urlRows.push(this.renderUrlRow('Clearnet', urls.clearnet));
		}
		if (urls.onion) {
			urlRows.push(this.renderUrlRow('Onion', urls.onion));
		}

		// QR codes for published services
		var qrContainer = null;
		if (service.published && (urls.clearnet || urls.onion)) {
			var qrBoxes = [];
			if (urls.clearnet) {
				var qrBox = E('div', { 'class': 'sr-qr-box' }, [
					E('div', { 'class': 'sr-qr-code' }),
					E('div', { 'class': 'sr-qr-label' }, _('Clearnet'))
				]);
				qrBox.querySelector('.sr-qr-code').innerHTML = QRCode.generateSVG(urls.clearnet, 80);
				qrBoxes.push(qrBox);
			}
			if (urls.onion) {
				var qrBox = E('div', { 'class': 'sr-qr-box' }, [
					E('div', { 'class': 'sr-qr-code' }),
					E('div', { 'class': 'sr-qr-label' }, _('Onion'))
				]);
				qrBox.querySelector('.sr-qr-code').innerHTML = QRCode.generateSVG(urls.onion, 80);
				qrBoxes.push(qrBox);
			}
			qrContainer = E('div', { 'class': 'sr-qr-container' }, qrBoxes);
		}

		// Action buttons
		var actions = [];
		if (service.published) {
			actions.push(E('button', {
				'class': 'cbi-button cbi-button-remove',
				'click': ui.createHandlerFn(this, 'handleUnpublish', service.id)
			}, _('Unpublish')));
		} else {
			actions.push(E('button', {
				'class': 'cbi-button cbi-button-apply',
				'click': ui.createHandlerFn(this, 'handleQuickPublishExisting', service)
			}, _('Publish')));
		}

		return E('div', { 'class': 'sr-card' }, [
			E('div', { 'class': 'sr-card-header' }, [
				E('div', { 'class': 'sr-card-icon' }, getIcon(service.icon)),
				E('div', { 'class': 'sr-card-title' }, service.name || service.id),
				E('span', {
					'class': 'sr-card-status sr-status-' + (service.status || 'stopped')
				}, service.status || 'unknown')
			]),
			E('div', { 'class': 'sr-urls' }, urlRows),
			qrContainer,
			E('div', { 'class': 'sr-card-actions' }, actions)
		]);
	},

	renderUrlRow: function(label, url) {
		return E('div', { 'class': 'sr-url-row' }, [
			E('span', { 'class': 'sr-url-label' }, label),
			E('a', {
				'class': 'sr-url-link',
				'href': url,
				'target': '_blank'
			}, url),
			E('button', {
				'class': 'cbi-button sr-copy-btn',
				'click': function() {
					navigator.clipboard.writeText(url).then(function() {
						ui.addNotification(null, E('p', _('URL copied to clipboard')), 'info');
					});
				}
			}, _('Copy'))
		]);
	},

	handleUnpublish: function(serviceId) {
		var self = this;

		ui.showModal(_('Unpublish Service'), [
			E('p', {}, _('Are you sure you want to unpublish this service?')),
			E('p', {}, _('This will remove HAProxy vhost and Tor hidden service if configured.')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Unpublishing'), [
							E('p', { 'class': 'spinning' }, _('Removing service...'))
						]);

						api.unpublishService(serviceId).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('Service unpublished')), 'info');
								return self.load().then(function(data) {
									var container = document.querySelector('.sr-dashboard');
									if (container) {
										dom.content(container, self.render(data).childNodes);
									}
								});
							} else {
								ui.addNotification(null, E('p', _('Failed to unpublish')), 'error');
							}
						});
					}
				}, _('Unpublish'))
			])
		]);
	},

	handleQuickPublishExisting: function(service) {
		document.getElementById('pub-name').value = service.name || '';
		document.getElementById('pub-port').value = service.local_port || '';
		document.getElementById('pub-name').focus();
	},

	renderLandingLink: function(landing) {
		var path = landing && landing.path ? landing.path : '/www/secubox-services.html';
		var exists = landing && landing.exists;

		return E('div', { 'class': 'sr-landing-link' }, [
			E('span', {}, _('Landing Page:')),
			exists ?
				E('a', { 'href': '/secubox-services.html', 'target': '_blank' }, path) :
				E('span', {}, _('Not generated')),
			E('button', {
				'class': 'cbi-button',
				'click': ui.createHandlerFn(this, 'handleRegenLanding')
			}, _('Regenerate'))
		]);
	},

	handleRegenLanding: function() {
		var self = this;

		ui.showModal(_('Generating'), [
			E('p', { 'class': 'spinning' }, _('Regenerating landing page...'))
		]);

		api.generateLandingPage().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Landing page regenerated')), 'info');
			} else {
				ui.addNotification(null, E('p', _('Failed: ') + (result.error || '')), 'error');
			}
		});
	}
});
