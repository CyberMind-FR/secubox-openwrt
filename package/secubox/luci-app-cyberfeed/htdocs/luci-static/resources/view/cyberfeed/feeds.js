'use strict';
'require view';
'require dom';
'require ui';
'require cyberfeed.api as api';

return view.extend({
	title: _('Feed Sources'),

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('cyberfeed/dashboard.css');
		document.head.appendChild(cssLink);

		return api.getFeeds();
	},

	render: function(feeds) {
		var self = this;
		feeds = Array.isArray(feeds) ? feeds : [];

		var content = [];

		// Page Header
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDCE1'),
					'Feed Sources'
				]),
				E('a', {
					'href': L.url('admin/services/cyberfeed/overview'),
					'class': 'cf-btn cf-btn-sm cf-btn-secondary'
				}, ['\u2190', ' Back'])
			])
		]));

		// Add Feed Card
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\u2795'),
					'Add New Feed'
				])
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('div', { 'class': 'cf-grid cf-grid-2', 'style': 'gap: 16px;' }, [
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Feed Name'),
						E('input', {
							'type': 'text',
							'id': 'new-name',
							'class': 'cf-form-input',
							'placeholder': 'my_feed (alphanumeric, no spaces)'
						})
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Feed URL'),
						E('input', {
							'type': 'url',
							'id': 'new-url',
							'class': 'cf-form-input',
							'placeholder': 'https://example.com/feed.xml'
						})
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Type'),
						E('select', { 'id': 'new-type', 'class': 'cf-form-input' }, [
							E('option', { 'value': 'rss' }, 'RSS/Atom'),
							E('option', { 'value': 'rss-bridge' }, 'RSS-Bridge')
						])
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Category'),
						E('select', { 'id': 'new-category', 'class': 'cf-form-input' }, [
							E('option', { 'value': 'custom' }, 'Custom'),
							E('option', { 'value': 'security' }, 'Security'),
							E('option', { 'value': 'tech' }, 'Tech'),
							E('option', { 'value': 'social' }, 'Social'),
							E('option', { 'value': 'news' }, 'News'),
							E('option', { 'value': 'radio' }, 'Radio/Podcasts')
						])
					])
				]),
				E('div', { 'style': 'margin-top: 16px;' }, [
					E('button', {
						'class': 'cf-btn cf-btn-primary',
						'click': function() { self.handleAddFeed(); }
					}, ['\u2795', ' Add Feed'])
				])
			])
		]));

		// RSS-Bridge Templates
		content.push(E('div', { 'class': 'cf-card cf-rssbridge-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83C\uDF09'),
					'RSS-Bridge Templates'
				])
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('p', { 'style': 'margin-bottom: 16px; color: var(--cf-text-dim);' },
					'Quick-add social media feeds (requires RSS-Bridge to be running)'),
				E('div', { 'class': 'cf-grid cf-grid-3', 'style': 'gap: 12px;' }, [
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.showBridgeModal('Facebook'); }
					}, ['\uD83D\uDCD8', ' Facebook']),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.showBridgeModal('Twitter'); }
					}, ['\uD83D\uDC26', ' Twitter/X']),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.showBridgeModal('Youtube'); }
					}, ['\uD83D\uDCFA', ' YouTube']),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.showBridgeModal('Mastodon'); }
					}, ['\uD83D\uDC18', ' Mastodon']),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.showBridgeModal('Reddit'); }
					}, ['\uD83E\uDD16', ' Reddit']),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.showBridgeModal('Instagram'); }
					}, ['\uD83D\uDCF7', ' Instagram'])
				])
			])
		]));

		// Radio Presets
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDCFB'),
					'Radio & Podcast Presets'
				])
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('p', { 'style': 'margin-bottom: 16px; color: var(--cf-text-dim);' },
					'Quick-add popular radio stations and podcasts'),
				E('div', { 'style': 'margin-bottom: 12px;' }, [
					E('strong', { 'style': 'color: var(--cf-neon-cyan);' }, 'Radio France')
				]),
				E('div', { 'class': 'cf-grid cf-grid-3', 'style': 'gap: 12px; margin-bottom: 16px;' }, [
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('franceinter', 'https://radiofrance-podcast.net/podcast09/rss_10239.xml', 'France Inter'); }
					}, '\uD83C\uDDEB\uD83C\uDDF7 France Inter'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('franceculture', 'https://radiofrance-podcast.net/podcast09/rss_10351.xml', 'France Culture'); }
					}, '\uD83C\uDDEB\uD83C\uDDF7 France Culture'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('franceinfo', 'https://radiofrance-podcast.net/podcast09/rss_10134.xml', 'France Info'); }
					}, '\uD83C\uDDEB\uD83C\uDDF7 France Info'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('fip', 'https://radiofrance-podcast.net/podcast09/rss_18981.xml', 'FIP'); }
					}, '\uD83C\uDFA7 FIP'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('mouv', 'https://radiofrance-podcast.net/podcast09/rss_21649.xml', 'Mouv'); }
					}, '\uD83C\uDFA4 Mouv')
				]),
				E('div', { 'style': 'margin-bottom: 12px;' }, [
					E('strong', { 'style': 'color: var(--cf-neon-cyan);' }, 'International & Tech')
				]),
				E('div', { 'class': 'cf-grid cf-grid-3', 'style': 'gap: 12px;' }, [
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('bbc_world', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC World'); }
					}, '\uD83C\uDDEC\uD83C\uDDE7 BBC World'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('npr', 'https://feeds.npr.org/1001/rss.xml', 'NPR News'); }
					}, '\uD83C\uDDFA\uD83C\uDDF8 NPR'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('darknet_diaries', 'https://feeds.megaphone.fm/darknetdiaries', 'Darknet Diaries'); }
					}, '\uD83D\uDD75 Darknet Diaries'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('changelog', 'https://changelog.com/podcast/feed', 'The Changelog'); }
					}, '\uD83D\uDCBB Changelog'),
					E('button', {
						'class': 'cf-btn cf-btn-sm',
						'click': function() { self.addRadioPreset('syntax', 'https://feed.syntax.fm/rss', 'Syntax.fm'); }
					}, '\uD83D\uDCBB Syntax.fm')
				])
			])
		]));

		// Feeds List
		var feedsContent;
		if (feeds.length === 0) {
			feedsContent = E('div', { 'class': 'cf-empty' }, [
				E('div', { 'class': 'cf-empty-icon' }, '\uD83D\uDCE1'),
				E('div', { 'class': 'cf-empty-text' }, 'No feeds configured'),
				E('div', { 'class': 'cf-empty-hint' }, 'Add a feed above to get started')
			]);
		} else {
			feedsContent = E('table', { 'class': 'cf-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, 'Name'),
						E('th', {}, 'URL'),
						E('th', {}, 'Type'),
						E('th', {}, 'Category'),
						E('th', { 'style': 'width: 100px; text-align: right;' }, 'Actions')
					])
				]),
				E('tbody', {}, feeds.map(function(feed) {
					return E('tr', {}, [
						E('td', { 'style': 'font-weight: 600;' }, feed.name),
						E('td', {}, [
							E('span', { 'style': 'font-size: 0.85rem; color: var(--cf-text-dim); word-break: break-all;' },
								feed.url.length > 50 ? feed.url.substring(0, 50) + '...' : feed.url)
						]),
						E('td', {}, [
							E('span', { 'class': 'cf-badge cf-badge-info' }, feed.type || 'rss')
						]),
						E('td', {}, [
							E('span', { 'class': 'cf-badge cf-badge-category' }, feed.category || 'custom')
						]),
						E('td', { 'style': 'text-align: right;' }, [
							E('button', {
								'class': 'cf-btn cf-btn-sm cf-btn-danger',
								'click': function() { self.handleDeleteFeed(feed.name); }
							}, 'Delete')
						])
					]);
				}))
			]);
		}

		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDCCB'),
					'Configured Feeds (' + feeds.length + ')'
				])
			]),
			E('div', { 'class': 'cf-card-body no-padding' }, [feedsContent])
		]));

		return E('div', { 'class': 'cyberfeed-dashboard' }, content);
	},

	handleAddFeed: function() {
		var self = this;
		var name = document.getElementById('new-name').value.trim();
		var url = document.getElementById('new-url').value.trim();
		var type = document.getElementById('new-type').value;
		var category = document.getElementById('new-category').value;

		if (!name) {
			self.showToast('Please enter a feed name', 'error');
			return;
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
			self.showToast('Name must be alphanumeric (underscores/dashes allowed)', 'error');
			return;
		}

		if (!url) {
			self.showToast('Please enter a feed URL', 'error');
			return;
		}

		return api.addFeed(name, url, type, category).then(function(res) {
			if (res && res.success) {
				self.showToast('Feed added successfully', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	addRadioPreset: function(name, url, displayName) {
		var self = this;

		return api.addFeed(name, url, 'rss', 'radio').then(function(res) {
			if (res && res.success) {
				self.showToast(displayName + ' added', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleDeleteFeed: function(name) {
		var self = this;

		ui.showModal('Delete Feed', [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', {}, 'Are you sure you want to delete this feed?'),
				E('div', {
					'style': 'margin-top: 12px; padding: 12px; background: rgba(0,255,255,0.1); border-radius: 8px; font-family: monospace;'
				}, name)
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'cf-btn cf-btn-secondary',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cf-btn cf-btn-danger',
					'click': function() {
						ui.hideModal();
						api.deleteFeed(name).then(function(res) {
							if (res && res.success) {
								self.showToast('Feed deleted', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, 'Delete')
			])
		]);
	},

	showBridgeModal: function(bridge) {
		var self = this;
		var fields = {
			'Facebook': { param: 'u', label: 'Page/User Name', placeholder: 'CyberMindFR' },
			'Twitter': { param: 'u', label: 'Username', placeholder: 'TheHackersNews' },
			'Youtube': { param: 'c', label: 'Channel ID', placeholder: 'UCxxxxxxx' },
			'Mastodon': { param: 'username', label: 'Username', placeholder: 'user', extra: 'instance', extraLabel: 'Instance', extraPlaceholder: 'mastodon.social' },
			'Reddit': { param: 'r', label: 'Subreddit', placeholder: 'netsec' },
			'Instagram': { param: 'u', label: 'Username', placeholder: 'username' }
		};

		var config = fields[bridge] || { param: 'u', label: 'Username', placeholder: 'username' };

		var modalContent = [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', { 'style': 'color: var(--cf-text-dim);' },
					'Add a ' + bridge + ' feed via RSS-Bridge')
			]),
			E('div', { 'class': 'cf-form-group' }, [
				E('label', { 'class': 'cf-form-label' }, 'Feed Name'),
				E('input', {
					'type': 'text',
					'id': 'bridge-name',
					'class': 'cf-form-input',
					'placeholder': bridge.toLowerCase() + '_feed'
				})
			]),
			E('div', { 'class': 'cf-form-group' }, [
				E('label', { 'class': 'cf-form-label' }, config.label),
				E('input', {
					'type': 'text',
					'id': 'bridge-param',
					'class': 'cf-form-input',
					'placeholder': config.placeholder
				})
			])
		];

		if (config.extra) {
			modalContent.push(E('div', { 'class': 'cf-form-group' }, [
				E('label', { 'class': 'cf-form-label' }, config.extraLabel),
				E('input', {
					'type': 'text',
					'id': 'bridge-extra',
					'class': 'cf-form-input',
					'placeholder': config.extraPlaceholder
				})
			]));
		}

		modalContent.push(E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
			E('button', {
				'class': 'cf-btn cf-btn-secondary',
				'click': ui.hideModal
			}, 'Cancel'),
			E('button', {
				'class': 'cf-btn cf-btn-primary',
				'click': function() {
					var name = document.getElementById('bridge-name').value.trim();
					var param = document.getElementById('bridge-param').value.trim();
					var extra = config.extra ? document.getElementById('bridge-extra').value.trim() : '';

					if (!name || !param) {
						self.showToast('Please fill in all fields', 'error');
						return;
					}

					var url = 'http://localhost:3000/?action=display&bridge=' + bridge;
					url += '&' + config.param + '=' + encodeURIComponent(param);
					if (config.extra && extra) {
						url += '&' + config.extra + '=' + encodeURIComponent(extra);
					}
					url += '&format=Atom';

					ui.hideModal();
					api.addFeed(name, url, 'rss-bridge', 'social').then(function(res) {
						if (res && res.success) {
							self.showToast('Feed added successfully', 'success');
							window.location.reload();
						} else {
							self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
						}
					});
				}
			}, 'Add Feed')
		]));

		ui.showModal(bridge + ' Feed', modalContent);
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.cf-toast');
		if (existing) existing.remove();

		var iconMap = {
			'success': '\u2705',
			'error': '\u274C',
			'warning': '\u26A0\uFE0F',
			'info': '\u2139\uFE0F'
		};

		var toast = E('div', { 'class': 'cf-toast ' + (type || '') }, [
			E('span', {}, iconMap[type] || '\u2139\uFE0F'),
			message
		]);
		document.body.appendChild(toast);

		setTimeout(function() {
			toast.remove();
		}, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
