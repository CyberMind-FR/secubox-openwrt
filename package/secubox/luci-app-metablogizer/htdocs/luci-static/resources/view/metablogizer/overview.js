'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require metablogizer/qrcode as qrcode';

var callStatus = rpc.declare({
	object: 'luci.metablogizer',
	method: 'status',
	expect: {}
});

var callListSites = rpc.declare({
	object: 'luci.metablogizer',
	method: 'list_sites',
	expect: { sites: [] }
});

var callCreateSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'create_site',
	params: ['name', 'domain', 'gitea_repo', 'ssl', 'description'],
	expect: {}
});

var callDeleteSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'delete_site',
	params: ['id'],
	expect: {}
});

var callSyncSite = rpc.declare({
	object: 'luci.metablogizer',
	method: 'sync_site',
	params: ['id'],
	expect: {}
});

var callGetPublishInfo = rpc.declare({
	object: 'luci.metablogizer',
	method: 'get_publish_info',
	params: ['id'],
	expect: {}
});

// CSS Styles for SecuBox Light Theme
var styles = '\
.mb-container { max-width: 1200px; margin: 0 auto; } \
.mb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; } \
.mb-header h2 { margin: 0; font-size: 1.5rem; } \
.mb-status-pills { display: flex; gap: 0.75rem; } \
.mb-pill { padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; background: rgba(255,255,255,0.2); } \
.mb-pill.active { background: rgba(255,255,255,0.95); color: #667eea; } \
.mb-btn-primary { background: white; color: #667eea; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; } \
.mb-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); } \
.mb-sites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; } \
.mb-site-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid #e8e8e8; transition: transform 0.2s, box-shadow 0.2s; } \
.mb-site-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); } \
.mb-site-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; } \
.mb-site-name { font-size: 1.15rem; font-weight: 600; color: #333; margin: 0; } \
.mb-site-status { padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; } \
.mb-site-status.online { background: #d4edda; color: #155724; } \
.mb-site-status.offline { background: #f8d7da; color: #721c24; } \
.mb-site-domain { color: #667eea; font-size: 0.9rem; margin-bottom: 0.5rem; word-break: break-all; } \
.mb-site-domain a { color: inherit; text-decoration: none; } \
.mb-site-domain a:hover { text-decoration: underline; } \
.mb-site-meta { font-size: 0.8rem; color: #888; margin-bottom: 1rem; } \
.mb-site-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; } \
.mb-btn { padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #ddd; background: #f8f9fa; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; } \
.mb-btn:hover { background: #e9ecef; } \
.mb-btn-share { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; } \
.mb-btn-share:hover { opacity: 0.9; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); } \
.mb-btn-sync { background: #28a745; color: white; border: none; } \
.mb-btn-sync:hover { background: #218838; } \
.mb-btn-delete { background: #dc3545; color: white; border: none; } \
.mb-btn-delete:hover { background: #c82333; } \
.mb-empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 12px; border: 2px dashed #ddd; } \
.mb-empty-state h3 { color: #666; margin-bottom: 0.5rem; } \
.mb-empty-state p { color: #888; margin-bottom: 1.5rem; } \
.mb-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; } \
.mb-modal { background: white; border-radius: 16px; max-width: 400px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); } \
.mb-modal-header { padding: 1.25rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; } \
.mb-modal-header h3 { margin: 0; color: #333; } \
.mb-modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888; padding: 0; line-height: 1; } \
.mb-modal-close:hover { color: #333; } \
.mb-modal-body { padding: 1.25rem; } \
.mb-form-group { margin-bottom: 1rem; } \
.mb-form-group label { display: block; margin-bottom: 0.4rem; font-weight: 500; color: #333; font-size: 0.9rem; } \
.mb-form-group input, .mb-form-group textarea { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; transition: border-color 0.2s; box-sizing: border-box; } \
.mb-form-group input:focus, .mb-form-group textarea:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); } \
.mb-form-group textarea { resize: vertical; min-height: 60px; } \
.mb-form-group small { color: #888; font-size: 0.8rem; } \
.mb-form-checkbox { display: flex; align-items: center; gap: 0.5rem; } \
.mb-form-checkbox input { width: auto; } \
.mb-modal-footer { padding: 1rem 1.25rem; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 0.75rem; } \
.mb-btn-cancel { background: #f8f9fa; color: #333; } \
.mb-btn-submit { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; font-weight: 600; } \
.mb-published-card { text-align: center; } \
.mb-url-box { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; } \
.mb-url-box input { flex: 1; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 0.9rem; background: #f8f9fa; } \
.mb-url-box button { padding: 0.6rem 1rem; border: none; background: #667eea; color: white; border-radius: 8px; cursor: pointer; } \
.mb-qr-container { margin: 1.25rem 0; padding: 1rem; background: #f8f9fa; border-radius: 12px; display: inline-block; } \
.mb-share-buttons { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; } \
.mb-share-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; font-weight: bold; font-size: 1.1rem; transition: transform 0.2s, box-shadow 0.2s; } \
.mb-share-btn:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2); } \
.mb-share-twitter { background: #1da1f2; } \
.mb-share-linkedin { background: #0077b5; } \
.mb-share-facebook { background: #1877f2; } \
.mb-share-telegram { background: #0088cc; } \
.mb-share-whatsapp { background: #25d366; } \
.mb-share-email { background: #666; } \
.mb-dropzone { border: 2px dashed #ddd; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 1rem; transition: all 0.3s; cursor: pointer; } \
.mb-dropzone:hover, .mb-dropzone.dragover { border-color: #667eea; background: rgba(102,126,234,0.05); } \
.mb-dropzone-icon { font-size: 2.5rem; margin-bottom: 0.5rem; } \
.mb-dropzone-text { color: #666; } \
.mb-dropzone-text strong { color: #667eea; } \
.mb-file-list { margin-top: 1rem; } \
.mb-file-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px; margin-bottom: 0.5rem; font-size: 0.85rem; } \
.mb-file-item-remove { background: none; border: none; color: #dc3545; cursor: pointer; padding: 0.25rem; } \
@media (max-width: 600px) { \
    .mb-header { flex-direction: column; gap: 1rem; text-align: center; } \
    .mb-sites-grid { grid-template-columns: 1fr; } \
    .mb-share-btn { width: 40px; height: 40px; font-size: 1rem; } \
}';

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callListSites()
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var sites = data[1] || [];

		// Inject styles
		var styleEl = document.createElement('style');
		styleEl.textContent = styles;
		document.head.appendChild(styleEl);

		var view = E('div', { 'class': 'mb-container' }, [
			// Header with status
			E('div', { 'class': 'mb-header' }, [
				E('div', {}, [
					E('h2', {}, _('MetaBlogizer')),
					E('div', { 'class': 'mb-status-pills' }, [
						E('span', { 'class': 'mb-pill' + (status.nginx_running ? ' active' : '') },
							status.nginx_running ? _('Nginx Running') : _('Nginx Stopped')),
						E('span', { 'class': 'mb-pill' },
							String(status.site_count || 0) + ' ' + _('Sites'))
					])
				]),
				E('button', {
					'class': 'mb-btn-primary',
					'click': ui.createHandlerFn(this, 'showPublishModal')
				}, _('+ New Site'))
			]),

			// Sites grid or empty state
			sites.length > 0 ?
				E('div', { 'class': 'mb-sites-grid' },
					sites.map(function(site) {
						return self.renderSiteCard(site);
					})
				) :
				E('div', { 'class': 'mb-empty-state' }, [
					E('div', { 'style': 'font-size: 3rem; margin-bottom: 1rem;' }, '\u{1F310}'),
					E('h3', {}, _('No Sites Yet')),
					E('p', {}, _('Create your first static site with one click')),
					E('button', {
						'class': 'mb-btn-primary',
						'style': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;',
						'click': ui.createHandlerFn(this, 'showPublishModal')
					}, _('Create Site'))
				])
		]);

		return view;
	},

	renderSiteCard: function(site) {
		var self = this;
		var hasContent = site.has_content;
		var statusClass = hasContent ? 'online' : 'offline';
		var statusText = hasContent ? _('Published') : _('Pending');

		return E('div', { 'class': 'mb-site-card' }, [
			E('div', { 'class': 'mb-site-header' }, [
				E('h4', { 'class': 'mb-site-name' }, site.name),
				E('span', { 'class': 'mb-site-status ' + statusClass }, statusText)
			]),
			E('div', { 'class': 'mb-site-domain' }, [
				E('a', { 'href': site.url, 'target': '_blank' }, site.domain)
			]),
			site.last_sync ?
				E('div', { 'class': 'mb-site-meta' }, _('Last sync: ') + site.last_sync) :
				E('div', { 'class': 'mb-site-meta' }, _('Not synced yet')),
			E('div', { 'class': 'mb-site-actions' }, [
				E('button', {
					'class': 'mb-btn mb-btn-share',
					'click': ui.createHandlerFn(this, 'showPublishedModal', site)
				}, _('Share')),
				E('button', {
					'class': 'mb-btn mb-btn-sync',
					'click': ui.createHandlerFn(this, 'handleSync', site)
				}, _('Sync')),
				E('button', {
					'class': 'mb-btn mb-btn-delete',
					'click': ui.createHandlerFn(this, 'handleDelete', site)
				}, _('Delete'))
			])
		]);
	},

	showPublishModal: function() {
		var self = this;

		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-publish-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [
					E('h3', {}, _('Quick Publish')),
					E('button', {
						'class': 'mb-modal-close',
						'click': function() { self.closeModal('mb-publish-modal'); }
					}, '\u00D7')
				]),
				E('div', { 'class': 'mb-modal-body' }, [
					// Drag and drop zone
					E('div', {
						'class': 'mb-dropzone',
						'id': 'mb-dropzone',
						'click': function() { document.getElementById('mb-file-input').click(); }
					}, [
						E('div', { 'class': 'mb-dropzone-icon' }, '\u{1F4C1}'),
						E('div', { 'class': 'mb-dropzone-text' }, [
							E('strong', {}, _('Drop files here')),
							E('br'),
							E('span', {}, _('or click to browse'))
						])
					]),
					E('input', {
						'type': 'file',
						'id': 'mb-file-input',
						'multiple': true,
						'style': 'display: none;',
						'change': function(ev) { self.handleFileSelect(ev); }
					}),
					E('div', { 'class': 'mb-file-list', 'id': 'mb-file-list' }),

					E('div', { 'class': 'mb-form-group' }, [
						E('label', {}, _('Site Name')),
						E('input', {
							'type': 'text',
							'id': 'mb-site-name',
							'placeholder': 'myblog'
						}),
						E('small', {}, _('Lowercase letters, numbers, hyphens only'))
					]),
					E('div', { 'class': 'mb-form-group' }, [
						E('label', {}, _('Domain')),
						E('input', {
							'type': 'text',
							'id': 'mb-site-domain',
							'placeholder': 'blog.example.com'
						})
					]),
					E('div', { 'class': 'mb-form-group' }, [
						E('label', {}, _('Gitea Repository (optional)')),
						E('input', {
							'type': 'text',
							'id': 'mb-gitea-repo',
							'placeholder': 'user/repo'
						}),
						E('small', {}, _('Leave empty to upload files directly'))
					]),
					E('div', { 'class': 'mb-form-group' }, [
						E('label', {}, _('Description (optional)')),
						E('textarea', {
							'id': 'mb-site-description',
							'placeholder': 'A short description for social previews'
						})
					]),
					E('div', { 'class': 'mb-form-group' }, [
						E('label', { 'class': 'mb-form-checkbox' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'mb-site-ssl',
								'checked': true
							}),
							E('span', {}, _('Enable SSL (HTTPS with auto ACME)'))
						])
					])
				]),
				E('div', { 'class': 'mb-modal-footer' }, [
					E('button', {
						'class': 'mb-btn mb-btn-cancel',
						'click': function() { self.closeModal('mb-publish-modal'); }
					}, _('Cancel')),
					E('button', {
						'class': 'mb-btn mb-btn-submit',
						'click': ui.createHandlerFn(this, 'handlePublish')
					}, _('Publish'))
				])
			])
		]);

		document.body.appendChild(modal);

		// Setup drag and drop
		var dropzone = document.getElementById('mb-dropzone');
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
			dropzone.addEventListener(eventName, function(e) {
				e.preventDefault();
				e.stopPropagation();
			});
		});
		['dragenter', 'dragover'].forEach(function(eventName) {
			dropzone.addEventListener(eventName, function() {
				dropzone.classList.add('dragover');
			});
		});
		['dragleave', 'drop'].forEach(function(eventName) {
			dropzone.addEventListener(eventName, function() {
				dropzone.classList.remove('dragover');
			});
		});
		dropzone.addEventListener('drop', function(e) {
			var files = e.dataTransfer.files;
			self.handleDroppedFiles(files);
		});
	},

	selectedFiles: [],

	handleFileSelect: function(ev) {
		var files = ev.target.files;
		this.handleDroppedFiles(files);
	},

	handleDroppedFiles: function(files) {
		var self = this;
		for (var i = 0; i < files.length; i++) {
			this.selectedFiles.push(files[i]);
		}
		this.updateFileList();
	},

	updateFileList: function() {
		var self = this;
		var container = document.getElementById('mb-file-list');
		if (!container) return;

		container.innerHTML = '';
		this.selectedFiles.forEach(function(file, index) {
			var item = E('div', { 'class': 'mb-file-item' }, [
				E('span', {}, '\u{1F4C4}'),
				E('span', { 'style': 'flex: 1;' }, file.name),
				E('span', { 'style': 'color: #888;' }, self.formatFileSize(file.size)),
				E('button', {
					'class': 'mb-file-item-remove',
					'click': function() { self.removeFile(index); }
				}, '\u00D7')
			]);
			container.appendChild(item);
		});
	},

	removeFile: function(index) {
		this.selectedFiles.splice(index, 1);
		this.updateFileList();
	},

	formatFileSize: function(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	},

	handlePublish: function() {
		var self = this;
		var name = document.getElementById('mb-site-name').value.trim();
		var domain = document.getElementById('mb-site-domain').value.trim();
		var gitea_repo = document.getElementById('mb-gitea-repo').value.trim();
		var description = document.getElementById('mb-site-description').value.trim();
		var ssl = document.getElementById('mb-site-ssl').checked ? '1' : '0';

		if (!name || !domain) {
			ui.addNotification(null, E('p', _('Name and domain are required')), 'error');
			return;
		}

		// Validate name format
		if (!/^[a-z0-9-]+$/.test(name)) {
			ui.addNotification(null, E('p', _('Site name must be lowercase letters, numbers, and hyphens only')), 'error');
			return;
		}

		this.closeModal('mb-publish-modal');
		ui.showModal(_('Publishing...'), [
			E('p', { 'class': 'spinning' }, _('Creating site and configuring services...'))
		]);

		callCreateSite(name, domain, gitea_repo, ssl, description)
			.then(function(result) {
				ui.hideModal();
				self.selectedFiles = []; // Clear selected files
				if (result.success) {
					self.showPublishedModal({
						id: result.id,
						name: result.name,
						domain: result.domain,
						url: result.url,
						description: description
					});
				} else {
					ui.addNotification(null, E('p', _('Failed: ') + result.error), 'error');
				}
			})
			.catch(function(e) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
			});
	},

	showPublishedModal: function(site) {
		var self = this;
		var url = site.url || ('https://' + site.domain);
		var title = site.name + ' - Published with SecuBox';
		var encodedUrl = encodeURIComponent(url);
		var encodedTitle = encodeURIComponent(title);

		// Generate QR code
		var qrSvg = qrcode.generateSVG(url, 180);

		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-published-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [
					E('h3', {}, '\u{2705} ' + _('Site Published!')),
					E('button', {
						'class': 'mb-modal-close',
						'click': function() {
							self.closeModal('mb-published-modal');
							window.location.reload();
						}
					}, '\u00D7')
				]),
				E('div', { 'class': 'mb-modal-body' }, [
					E('div', { 'class': 'mb-published-card' }, [
						// URL with copy button
						E('div', { 'class': 'mb-url-box' }, [
							E('input', {
								'type': 'text',
								'readonly': true,
								'value': url,
								'id': 'mb-pub-url'
							}),
							E('button', {
								'click': function() { self.copyUrl(url); }
							}, '\u{1F4CB}')
						]),

						// QR Code
						E('div', { 'class': 'mb-qr-container' }, [
							E('div', { 'innerHTML': qrSvg || '<p>QR unavailable</p>' })
						]),

						// Social Share Buttons
						E('div', { 'class': 'mb-share-buttons' }, [
							// Twitter/X
							E('a', {
								'href': 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle,
								'target': '_blank',
								'class': 'mb-share-btn mb-share-twitter',
								'title': 'Share on Twitter'
							}, '\u{1D54F}'),

							// LinkedIn
							E('a', {
								'href': 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
								'target': '_blank',
								'class': 'mb-share-btn mb-share-linkedin',
								'title': 'Share on LinkedIn'
							}, 'in'),

							// Facebook
							E('a', {
								'href': 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
								'target': '_blank',
								'class': 'mb-share-btn mb-share-facebook',
								'title': 'Share on Facebook'
							}, 'f'),

							// Telegram
							E('a', {
								'href': 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedTitle,
								'target': '_blank',
								'class': 'mb-share-btn mb-share-telegram',
								'title': 'Share on Telegram'
							}, '\u{2708}'),

							// WhatsApp
							E('a', {
								'href': 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url),
								'target': '_blank',
								'class': 'mb-share-btn mb-share-whatsapp',
								'title': 'Share on WhatsApp'
							}, '\u{260E}'),

							// Email
							E('a', {
								'href': 'mailto:?subject=' + encodedTitle + '&body=' + encodedUrl,
								'class': 'mb-share-btn mb-share-email',
								'title': 'Share via Email'
							}, '\u{2709}')
						])
					])
				]),
				E('div', { 'class': 'mb-modal-footer' }, [
					E('a', {
						'href': url,
						'target': '_blank',
						'class': 'mb-btn mb-btn-submit',
						'style': 'text-decoration: none; display: inline-block;'
					}, _('Visit Site')),
					E('button', {
						'class': 'mb-btn',
						'click': function() {
							self.closeModal('mb-published-modal');
							window.location.reload();
						}
					}, _('Done'))
				])
			])
		]);

		document.body.appendChild(modal);
	},

	copyUrl: function(url) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(url).then(function() {
				ui.addNotification(null, E('p', _('URL copied to clipboard!')));
			});
		} else {
			var input = document.getElementById('mb-pub-url');
			input.select();
			document.execCommand('copy');
			ui.addNotification(null, E('p', _('URL copied to clipboard!')));
		}
	},

	closeModal: function(id) {
		var modal = document.getElementById(id);
		if (modal) {
			modal.remove();
		}
	},

	handleSync: function(site) {
		ui.showModal(_('Syncing...'), [
			E('p', { 'class': 'spinning' }, _('Pulling latest changes from repository...'))
		]);

		callSyncSite(site.id)
			.then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Site synced: ') + (result.message || 'OK')));
				} else {
					ui.addNotification(null, E('p', _('Sync failed: ') + result.error), 'error');
				}
			})
			.catch(function(e) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
			});
	},

	handleDelete: function(site) {
		var self = this;

		ui.showModal(_('Delete Site'), [
			E('p', {}, _('Are you sure you want to delete "%s"?').format(site.name)),
			E('p', { 'style': 'color: #dc3545;' }, _('This will remove the site, HAProxy vhost, and all files.')),
			E('div', { 'style': 'display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;' }, [
				E('button', {
					'class': 'mb-btn',
					'click': function() { ui.hideModal(); }
				}, _('Cancel')),
				E('button', {
					'class': 'mb-btn mb-btn-delete',
					'click': function() {
						ui.hideModal();
						self.doDelete(site);
					}
				}, _('Delete'))
			])
		]);
	},

	doDelete: function(site) {
		ui.showModal(_('Deleting...'), [
			E('p', { 'class': 'spinning' }, _('Removing site and cleaning up...'))
		]);

		callDeleteSite(site.id)
			.then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Site deleted successfully')));
					window.location.reload();
				} else {
					ui.addNotification(null, E('p', _('Delete failed: ') + result.error), 'error');
				}
			})
			.catch(function(e) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
			});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
