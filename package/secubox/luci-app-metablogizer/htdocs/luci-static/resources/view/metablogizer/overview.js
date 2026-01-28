'use strict';
'require view';
'require ui';
'require rpc';
'require fs';
'require metablogizer/qrcode as qrcode';

var callStatus = rpc.declare({ object: 'luci.metablogizer', method: 'status', expect: {} });
var callListSites = rpc.declare({ object: 'luci.metablogizer', method: 'list_sites', expect: { sites: [] } });
var callCreateSite = rpc.declare({ object: 'luci.metablogizer', method: 'create_site', params: ['name', 'domain', 'gitea_repo', 'ssl', 'description'], expect: {} });
var callUpdateSite = rpc.declare({ object: 'luci.metablogizer', method: 'update_site', params: ['id', 'name', 'domain', 'gitea_repo', 'ssl', 'enabled', 'description'], expect: {} });
var callDeleteSite = rpc.declare({ object: 'luci.metablogizer', method: 'delete_site', params: ['id'], expect: {} });
var callSyncSite = rpc.declare({ object: 'luci.metablogizer', method: 'sync_site', params: ['id'], expect: {} });
var callGetHostingStatus = rpc.declare({ object: 'luci.metablogizer', method: 'get_hosting_status', expect: {} });
var callCheckSiteHealth = rpc.declare({ object: 'luci.metablogizer', method: 'check_site_health', params: ['id'], expect: {} });

var SITES_ROOT = '/srv/metablogizer/sites';

var styles = '.mb-container{max-width:1200px;margin:0 auto}.mb-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding:1rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;color:#fff}.mb-header h2{margin:0;font-size:1.5rem}.mb-status-pills{display:flex;gap:.75rem}.mb-pill{padding:.4rem .8rem;border-radius:20px;font-size:.85rem;background:rgba(255,255,255,.2)}.mb-pill.active{background:rgba(255,255,255,.95);color:#667eea}.mb-hosting-panel{background:#fff;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #e8e8e8}.mb-hosting-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}.mb-hosting-header h3{margin:0;font-size:1.1rem;color:#333}.mb-hosting-ip{background:#f8f9fa;padding:.5rem 1rem;border-radius:8px;font-family:monospace;font-size:.9rem}.mb-hosting-table{width:100%;border-collapse:collapse}.mb-hosting-table th,.mb-hosting-table td{padding:.6rem .8rem;text-align:left;border-bottom:1px solid #eee}.mb-hosting-table th{font-weight:600;color:#666;font-size:.85rem;text-transform:uppercase}.mb-hosting-table td{font-size:.9rem}.mb-status-badge{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .6rem;border-radius:12px;font-size:.75rem;font-weight:500}.mb-status-ok{background:#d4edda;color:#155724}.mb-status-warning{background:#fff3cd;color:#856404}.mb-status-error{background:#f8d7da;color:#721c24}.mb-status-pending{background:#cfe2ff;color:#084298}.mb-status-none{background:#e9ecef;color:#6c757d}.mb-dns-ip{font-family:monospace;font-size:.85rem;color:#666}.mb-btn-primary{background:#fff;color:#667eea;border:none;padding:.6rem 1.2rem;border-radius:8px;cursor:pointer;font-weight:600;transition:transform .2s}.mb-btn-primary:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.15)}.mb-sites-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.25rem}.mb-site-card{background:#fff;border-radius:12px;padding:1.25rem;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #e8e8e8;transition:transform .2s}.mb-site-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.12)}.mb-site-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem}.mb-site-name{font-size:1.15rem;font-weight:600;color:#333;margin:0}.mb-site-status{padding:.25rem .6rem;border-radius:12px;font-size:.75rem;font-weight:500}.mb-site-status.online{background:#d4edda;color:#155724}.mb-site-status.offline{background:#f8d7da;color:#721c24}.mb-site-domain{color:#667eea;font-size:.9rem;margin-bottom:.5rem;word-break:break-all}.mb-site-domain a{color:inherit;text-decoration:none}.mb-site-domain a:hover{text-decoration:underline}.mb-site-meta{font-size:.8rem;color:#888;margin-bottom:1rem}.mb-site-actions{display:flex;gap:.4rem;flex-wrap:wrap}.mb-btn{padding:.35rem .6rem;border-radius:6px;border:1px solid #ddd;background:#f8f9fa;cursor:pointer;font-size:.8rem;transition:all .2s}.mb-btn:hover{background:#e9ecef}.mb-btn-share{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border:none}.mb-btn-upload{background:#17a2b8;color:#fff;border:none}.mb-btn-upload:hover{background:#138496}.mb-btn-files{background:#6c757d;color:#fff;border:none}.mb-btn-files:hover{background:#5a6268}.mb-btn-edit{background:#fd7e14;color:#fff;border:none}.mb-btn-edit:hover{background:#e96b02}.mb-btn-sync{background:#28a745;color:#fff;border:none}.mb-btn-sync:hover{background:#218838}.mb-btn-delete,.mb-btn-danger{background:#dc3545;color:#fff;border:none}.mb-btn-delete:hover,.mb-btn-danger:hover{background:#c82333}.mb-empty-state{text-align:center;padding:4rem 2rem;background:#fff;border-radius:12px;border:2px dashed #ddd}.mb-empty-state h3{color:#666;margin-bottom:.5rem}.mb-empty-state p{color:#888;margin-bottom:1.5rem}.mb-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:10000}.mb-modal{background:#fff;border-radius:16px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}.mb-modal-header{padding:1.25rem;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center}.mb-modal-header h3{margin:0;color:#333}.mb-modal-close{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#888;padding:0;line-height:1}.mb-modal-close:hover{color:#333}.mb-modal-body{padding:1.25rem}.mb-form-group{margin-bottom:1rem}.mb-form-group label{display:block;margin-bottom:.4rem;font-weight:500;color:#333;font-size:.9rem}.mb-form-group input,.mb-form-group textarea{width:100%;padding:.6rem .8rem;border:1px solid #ddd;border-radius:8px;font-size:.95rem;box-sizing:border-box}.mb-form-group input:focus,.mb-form-group textarea:focus{border-color:#667eea;outline:none}.mb-form-group textarea{resize:vertical;min-height:60px}.mb-form-group small{color:#888;font-size:.8rem}.mb-form-checkbox{display:flex;align-items:center;gap:.5rem}.mb-form-checkbox input{width:auto}.mb-modal-footer{padding:1rem 1.25rem;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:.75rem}.mb-btn-cancel{background:#f8f9fa;color:#333}.mb-btn-submit{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border:none;font-weight:600}.mb-published-card{text-align:center}.mb-url-box{display:flex;gap:.5rem;margin-bottom:1.25rem}.mb-url-box input{flex:1;padding:.6rem;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:.9rem;background:#f8f9fa}.mb-url-box button{padding:.6rem 1rem;border:none;background:#667eea;color:#fff;border-radius:8px;cursor:pointer}.mb-qr-container{margin:1.25rem 0;padding:1rem;background:#f8f9fa;border-radius:12px;display:inline-block}.mb-share-buttons{display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap;margin-top:1.25rem}.mb-share-btn{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;font-weight:700;font-size:1.1rem;transition:transform .2s}.mb-share-btn:hover{transform:scale(1.1)}.mb-share-twitter{background:#1da1f2}.mb-share-linkedin{background:#0077b5}.mb-share-facebook{background:#1877f2}.mb-share-telegram{background:#0088cc}.mb-share-whatsapp{background:#25d366}.mb-share-email{background:#666}.mb-dropzone{border:2px dashed #ddd;border-radius:12px;padding:2rem;text-align:center;margin-bottom:1rem;cursor:pointer}.mb-dropzone:hover,.mb-dropzone.dragover{border-color:#667eea;background:rgba(102,126,234,.05)}.mb-dropzone-icon{font-size:2.5rem;margin-bottom:.5rem}.mb-dropzone-text{color:#666}.mb-dropzone-text strong{color:#667eea}.mb-file-list{margin-top:1rem;max-height:200px;overflow-y:auto}.mb-file-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;background:#f8f9fa;border-radius:6px;margin-bottom:.5rem;font-size:.85rem}.mb-file-item-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mb-file-item-size{color:#888;font-size:.8rem}.mb-file-item-actions{display:flex;gap:.25rem}.mb-file-item-btn{background:none;border:none;cursor:pointer;padding:.25rem;font-size:.9rem;opacity:.7}.mb-file-item-btn:hover{opacity:1}.mb-file-item-btn.delete{color:#dc3545}.mb-file-item-btn.home{color:#28a745}.mb-cache-hint{background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:.75rem;margin-top:1rem;font-size:.85rem;color:#856404}@media(max-width:600px){.mb-header{flex-direction:column;gap:1rem}.mb-sites-grid{grid-template-columns:1fr}}';

return view.extend({
	uploadFiles: [],
	currentSite: null,

	load: function() { return Promise.all([callStatus(), callListSites(), callGetHostingStatus().catch(function() { return {}; })]); },

	render: function(data) {
		var self = this, status = data[0] || {}, sites = data[1] || [], hosting = data[2] || {};
		if (!document.getElementById('mb-styles')) {
			var s = document.createElement('style'); s.id = 'mb-styles'; s.textContent = styles; document.head.appendChild(s);
		}
		return E('div', { 'class': 'mb-container' }, [
			E('div', { 'class': 'mb-header' }, [
				E('div', {}, [
					E('h2', {}, _('MetaBlogizer')),
					E('div', { 'class': 'mb-status-pills' }, [
						E('span', { 'class': 'mb-pill active' }, status.detected_runtime || 'uhttpd'),
						E('span', { 'class': 'mb-pill' }, (status.site_count || sites.length || 0) + ' ' + _('Sites')),
						E('span', { 'class': 'mb-pill' }, (hosting.haproxy_status === 'running' ? '\u{2705}' : '\u{1F534}') + ' HAProxy')
					])
				]),
				E('button', { 'class': 'mb-btn-primary', 'click': ui.createHandlerFn(this, 'showCreateModal') }, _('+ New Site'))
			]),
			this.renderHostingPanel(hosting, sites),
			sites.length > 0 ? E('div', { 'class': 'mb-sites-grid' }, sites.map(function(site) { return self.renderSiteCard(site); })) :
				E('div', { 'class': 'mb-empty-state' }, [
					E('div', { 'style': 'font-size:3rem;margin-bottom:1rem' }, '\u{1F310}'),
					E('h3', {}, _('No Sites Yet')),
					E('p', {}, _('Create your first static site')),
					E('button', { 'class': 'mb-btn-primary', 'style': 'background:linear-gradient(135deg,#667eea,#764ba2);color:#fff', 'click': ui.createHandlerFn(this, 'showCreateModal') }, _('Create Site'))
				])
		]);
	},

	renderHostingPanel: function(hosting, sites) {
		var hostingSites = hosting.sites || [];
		if (hostingSites.length === 0) return E('div');

		var statusBadge = function(status, text) {
			var cls = 'mb-status-badge ';
			switch (status) {
				case 'ok': cls += 'mb-status-ok'; break;
				case 'warning': cls += 'mb-status-warning'; break;
				case 'error': case 'failed': case 'expired': case 'critical': case 'mismatch': cls += 'mb-status-error'; break;
				case 'pending': case 'missing': cls += 'mb-status-pending'; break;
				default: cls += 'mb-status-none';
			}
			return E('span', { 'class': cls }, text || status);
		};

		var dnsIcon = function(status) {
			switch (status) {
				case 'ok': return '\u{1F310}';
				case 'private': return '\u{26A0}';
				case 'mismatch': return '\u{2757}';
				case 'failed': return '\u{274C}';
				default: return '\u{2796}';
			}
		};

		var certIcon = function(status) {
			switch (status) {
				case 'ok': return '\u{1F512}';
				case 'warning': return '\u{26A0}';
				case 'critical': case 'expired': return '\u{1F534}';
				case 'missing': return '\u{26AA}';
				default: return '\u{2796}';
			}
		};

		var publishIcon = function(status) {
			switch (status) {
				case 'published': return '\u{2705}';
				case 'pending': return '\u{1F551}';
				case 'draft': return '\u{1F4DD}';
				default: return '\u{2796}';
			}
		};

		return E('div', { 'class': 'mb-hosting-panel' }, [
			E('div', { 'class': 'mb-hosting-header' }, [
				E('h3', {}, '\u{1F310} ' + _('Web Hosting Status')),
				hosting.public_ip ? E('div', { 'class': 'mb-hosting-ip' }, _('Public IP: ') + hosting.public_ip) : ''
			]),
			E('table', { 'class': 'mb-hosting-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, _('Site')),
					E('th', {}, _('Domain')),
					E('th', {}, _('DNS')),
					E('th', {}, _('Resolved IP')),
					E('th', {}, _('Certificate')),
					E('th', {}, _('Status'))
				])),
				E('tbody', {}, hostingSites.map(function(site) {
					return E('tr', {}, [
						E('td', {}, E('strong', {}, site.name)),
						E('td', {}, site.domain ? E('a', { 'href': site.url, 'target': '_blank' }, site.domain) : E('em', { 'style': 'color:#888' }, _('No domain'))),
						E('td', {}, statusBadge(site.dns_status, dnsIcon(site.dns_status) + ' ' + (site.dns_status || 'none'))),
						E('td', { 'class': 'mb-dns-ip' }, site.dns_ip || '-'),
						E('td', {}, statusBadge(site.cert_status, certIcon(site.cert_status) + ' ' + (site.cert_days ? site.cert_days + 'd' : site.cert_status || 'none'))),
						E('td', {}, statusBadge(site.publish_status, publishIcon(site.publish_status) + ' ' + (site.publish_status || 'draft')))
					]);
				}))
			])
		]);
	},

	renderSiteCard: function(site) {
		return E('div', { 'class': 'mb-site-card' }, [
			E('div', { 'class': 'mb-site-header' }, [
				E('h4', { 'class': 'mb-site-name' }, site.name),
				E('span', { 'class': 'mb-site-status ' + (site.has_content ? 'online' : 'offline') }, site.has_content ? _('Published') : _('Pending'))
			]),
			E('div', { 'class': 'mb-site-domain' }, [E('a', { 'href': site.url, 'target': '_blank' }, site.domain)]),
			E('div', { 'class': 'mb-site-meta' }, site.last_sync ? _('Last sync: ') + site.last_sync : _('Not synced yet')),
			E('div', { 'class': 'mb-site-actions' }, [
				E('button', { 'class': 'mb-btn mb-btn-share', 'click': ui.createHandlerFn(this, 'showShareModal', site) }, _('Share')),
				E('button', { 'class': 'mb-btn mb-btn-upload', 'click': ui.createHandlerFn(this, 'showUploadModal', site) }, _('Upload')),
				E('button', { 'class': 'mb-btn mb-btn-files', 'click': ui.createHandlerFn(this, 'showFilesModal', site) }, _('Files')),
				E('button', { 'class': 'mb-btn mb-btn-edit', 'click': ui.createHandlerFn(this, 'showEditModal', site) }, _('Edit')),
				E('button', { 'class': 'mb-btn mb-btn-sync', 'click': ui.createHandlerFn(this, 'handleSync', site) }, _('Sync')),
				E('button', { 'class': 'mb-btn mb-btn-delete', 'click': ui.createHandlerFn(this, 'handleDelete', site) }, _('Delete'))
			])
		]);
	},

	showCreateModal: function() {
		var self = this;
		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-create-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [E('h3', {}, _('Create New Site')), E('button', { 'class': 'mb-modal-close', 'click': function() { self.closeModal('mb-create-modal'); } }, '\u00D7')]),
				E('div', { 'class': 'mb-modal-body' }, [
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Site Name')), E('input', { 'type': 'text', 'id': 'mb-site-name', 'placeholder': 'myblog' }), E('small', {}, _('Lowercase, numbers, hyphens'))]),
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Domain')), E('input', { 'type': 'text', 'id': 'mb-site-domain', 'placeholder': 'blog.example.com' })]),
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Gitea Repository')), E('input', { 'type': 'text', 'id': 'mb-gitea-repo', 'placeholder': 'user/repo (optional)' })]),
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Description')), E('textarea', { 'id': 'mb-site-description', 'placeholder': 'Short description (optional)' })]),
					E('div', { 'class': 'mb-form-group' }, [E('label', { 'class': 'mb-form-checkbox' }, [E('input', { 'type': 'checkbox', 'id': 'mb-site-ssl', 'checked': true }), E('span', {}, _('Enable HTTPS'))])])
				]),
				E('div', { 'class': 'mb-modal-footer' }, [
					E('button', { 'class': 'mb-btn mb-btn-cancel', 'click': function() { self.closeModal('mb-create-modal'); } }, _('Cancel')),
					E('button', { 'class': 'mb-btn mb-btn-submit', 'click': ui.createHandlerFn(this, 'handleCreate') }, _('Create'))
				])
			])
		]);
		document.body.appendChild(modal);
	},

	handleCreate: function() {
		var self = this;
		var name = document.getElementById('mb-site-name').value.trim();
		var domain = document.getElementById('mb-site-domain').value.trim();
		var gitea = document.getElementById('mb-gitea-repo').value.trim();
		var desc = document.getElementById('mb-site-description').value.trim();
		var ssl = document.getElementById('mb-site-ssl').checked ? '1' : '0';
		if (!name || !domain) { ui.addNotification(null, E('p', _('Name and domain required')), 'error'); return; }
		if (!/^[a-z0-9-]+$/.test(name)) { ui.addNotification(null, E('p', _('Invalid name format')), 'error'); return; }
		this.closeModal('mb-create-modal');
		ui.showModal(_('Creating...'), [E('p', { 'class': 'spinning' }, _('Setting up site...'))]);
		callCreateSite(name, domain, gitea, ssl, desc).then(function(r) {
			ui.hideModal();
			if (r.success) { self.showShareModal({ name: r.name, domain: r.domain, url: r.url }); setTimeout(function() { window.location.reload(); }, 100); }
			else { ui.addNotification(null, E('p', _('Failed: ') + r.error), 'error'); }
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', _('Error: ') + e.message), 'error'); });
	},

	showEditModal: function(site) {
		var self = this;
		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-edit-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [E('h3', {}, _('Edit: ') + site.name), E('button', { 'class': 'mb-modal-close', 'click': function() { self.closeModal('mb-edit-modal'); } }, '\u00D7')]),
				E('div', { 'class': 'mb-modal-body' }, [
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Site Name')), E('input', { 'type': 'text', 'id': 'mb-edit-name', 'value': site.name, 'readonly': true, 'style': 'background:#eee' }), E('small', {}, _('Cannot be changed'))]),
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Domain')), E('input', { 'type': 'text', 'id': 'mb-edit-domain', 'value': site.domain || '' })]),
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Gitea Repository')), E('input', { 'type': 'text', 'id': 'mb-edit-gitea', 'value': site.gitea_repo || '', 'placeholder': 'user/repo' })]),
					E('div', { 'class': 'mb-form-group' }, [E('label', {}, _('Description')), E('textarea', { 'id': 'mb-edit-description' }, site.description || '')]),
					E('div', { 'class': 'mb-form-group' }, [E('label', { 'class': 'mb-form-checkbox' }, [E('input', { 'type': 'checkbox', 'id': 'mb-edit-ssl', 'checked': site.ssl }), E('span', {}, _('Enable HTTPS'))])]),
					E('div', { 'class': 'mb-form-group' }, [E('label', { 'class': 'mb-form-checkbox' }, [E('input', { 'type': 'checkbox', 'id': 'mb-edit-enabled', 'checked': site.enabled !== false }), E('span', {}, _('Site enabled'))])])
				]),
				E('div', { 'class': 'mb-modal-footer' }, [
					E('button', { 'class': 'mb-btn mb-btn-cancel', 'click': function() { self.closeModal('mb-edit-modal'); } }, _('Cancel')),
					E('button', { 'class': 'mb-btn mb-btn-submit', 'click': ui.createHandlerFn(this, 'handleUpdate', site) }, _('Save'))
				])
			])
		]);
		document.body.appendChild(modal);
	},

	handleUpdate: function(site) {
		var domain = document.getElementById('mb-edit-domain').value.trim();
		var gitea = document.getElementById('mb-edit-gitea').value.trim();
		var desc = document.getElementById('mb-edit-description').value.trim();
		var ssl = document.getElementById('mb-edit-ssl').checked ? '1' : '0';
		var enabled = document.getElementById('mb-edit-enabled').checked ? '1' : '0';
		if (!domain) { ui.addNotification(null, E('p', _('Domain required')), 'error'); return; }
		this.closeModal('mb-edit-modal');
		ui.showModal(_('Saving...'), [E('p', { 'class': 'spinning' }, _('Updating...'))]);
		callUpdateSite(site.id, site.name, domain, gitea, ssl, enabled, desc).then(function(r) {
			ui.hideModal();
			if (r.success) { ui.addNotification(null, E('p', _('Site updated'))); window.location.reload(); }
			else { ui.addNotification(null, E('p', _('Failed: ') + r.error), 'error'); }
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', _('Error: ') + e.message), 'error'); });
	},

	showUploadModal: function(site) {
		var self = this; this.uploadFiles = []; this.currentSite = site;
		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-upload-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [E('h3', {}, _('Upload to ') + site.name), E('button', { 'class': 'mb-modal-close', 'click': function() { self.closeModal('mb-upload-modal'); } }, '\u00D7')]),
				E('div', { 'class': 'mb-modal-body' }, [
					E('div', { 'class': 'mb-dropzone', 'id': 'mb-dropzone', 'click': function() { document.getElementById('mb-file-input').click(); } }, [
						E('div', { 'class': 'mb-dropzone-icon' }, '\u{1F4C1}'),
						E('div', { 'class': 'mb-dropzone-text' }, [E('strong', {}, _('Drop files here')), E('br'), _('or click to browse')])
					]),
					E('input', { 'type': 'file', 'id': 'mb-file-input', 'multiple': true, 'style': 'display:none', 'change': function(e) { self.handleFileSelect(e); } }),
					E('div', { 'class': 'mb-file-list', 'id': 'mb-file-list' }),
					E('div', { 'class': 'mb-form-group', 'style': 'margin-top:1rem' }, [E('label', { 'class': 'mb-form-checkbox' }, [E('input', { 'type': 'checkbox', 'id': 'mb-as-index', 'checked': true }), E('span', {}, _('Set first HTML as homepage'))])]),
					E('div', { 'class': 'mb-cache-hint' }, _('After upload, Ctrl+Shift+R to refresh.'))
				]),
				E('div', { 'class': 'mb-modal-footer' }, [
					E('button', { 'class': 'mb-btn mb-btn-cancel', 'click': function() { self.closeModal('mb-upload-modal'); } }, _('Cancel')),
					E('button', { 'class': 'mb-btn mb-btn-submit', 'click': ui.createHandlerFn(this, 'handleUpload') }, _('Upload'))
				])
			])
		]);
		document.body.appendChild(modal);
		this.setupDropzone('mb-dropzone');
	},

	handleUpload: function() {
		var self = this;
		if (!this.uploadFiles.length) { ui.addNotification(null, E('p', _('No files')), 'error'); return; }
		var name = this.currentSite.name, asIndex = document.getElementById('mb-as-index').checked, firstHtml = null;
		if (asIndex) { for (var i = 0; i < this.uploadFiles.length; i++) { if (this.uploadFiles[i].name.endsWith('.html')) { firstHtml = this.uploadFiles[i]; break; } } }
		this.closeModal('mb-upload-modal');
		ui.showModal(_('Uploading...'), [E('p', { 'class': 'spinning' }, _('Uploading...'))]);
		Promise.all(this.uploadFiles.map(function(f) {
			return new Promise(function(resolve) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var dest = (asIndex && f === firstHtml) ? 'index.html' : f.name;
					fs.write(SITES_ROOT + '/' + name + '/' + dest, e.target.result).then(function() { resolve({ ok: true }); }).catch(function() { resolve({ ok: false }); });
				};
				reader.onerror = function() { resolve({ ok: false }); };
				reader.readAsText(f);
			});
		})).then(function(r) {
			ui.hideModal();
			var ok = r.filter(function(x) { return x.ok; }).length;
			ui.addNotification(null, E('p', ok + ' file(s) uploaded'));
			self.uploadFiles = [];
		});
	},

	showFilesModal: function(site) {
		var self = this; this.currentSite = site;
		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-files-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [E('h3', {}, _('Files: ') + site.name), E('button', { 'class': 'mb-modal-close', 'click': function() { self.closeModal('mb-files-modal'); } }, '\u00D7')]),
				E('div', { 'class': 'mb-modal-body' }, [E('div', { 'id': 'mb-files-list', 'class': 'mb-file-list' }, [E('p', { 'class': 'spinning' }, _('Loading...'))])]),
				E('div', { 'class': 'mb-modal-footer' }, [E('button', { 'class': 'mb-btn', 'click': function() { self.closeModal('mb-files-modal'); } }, _('Close'))])
			])
		]);
		document.body.appendChild(modal);
		fs.list(SITES_ROOT + '/' + site.name).then(function(files) {
			var c = document.getElementById('mb-files-list'); c.innerHTML = '';
			if (!files || !files.length) { c.appendChild(E('p', { 'style': 'color:#888;text-align:center' }, _('No files'))); return; }
			files.forEach(function(f) {
				if (f.type === 'file') {
					var isIdx = f.name === 'index.html';
					c.appendChild(E('div', { 'class': 'mb-file-item' }, [
						E('span', {}, isIdx ? '\u{1F3E0}' : '\u{1F4C4}'),
						E('span', { 'class': 'mb-file-item-name' }, f.name + (isIdx ? ' (homepage)' : '')),
						E('span', { 'class': 'mb-file-item-size' }, self.formatFileSize(f.size)),
						E('span', { 'class': 'mb-file-item-actions' }, [
							(!isIdx && f.name.endsWith('.html')) ? E('button', { 'class': 'mb-file-item-btn home', 'title': _('Set as homepage'), 'click': function() { self.setAsHomepage(site, f.name); } }, '\u{1F3E0}') : '',
							E('button', { 'class': 'mb-file-item-btn delete', 'title': _('Delete'), 'click': function() { self.deleteFile(site, f.name); } }, '\u{1F5D1}')
						])
					]));
				}
			});
		}).catch(function(e) { document.getElementById('mb-files-list').innerHTML = '<p style="color:#dc3545">Error: ' + e.message + '</p>'; });
	},

	setAsHomepage: function(site, fname) {
		var self = this, path = SITES_ROOT + '/' + site.name;
		ui.showModal(_('Setting...'), [E('p', { 'class': 'spinning' }, _('Renaming...'))]);
		fs.read(path + '/' + fname).then(function(c) { return fs.write(path + '/index.html', c); }).then(function() { return fs.remove(path + '/' + fname); }).then(function() {
			ui.hideModal(); ui.addNotification(null, E('p', fname + ' set as homepage')); self.closeModal('mb-files-modal');
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', _('Error: ') + e.message), 'error'); });
	},

	deleteFile: function(site, fname) {
		var self = this;
		if (!confirm(_('Delete ') + fname + '?')) return;
		fs.remove(SITES_ROOT + '/' + site.name + '/' + fname).then(function() { ui.addNotification(null, E('p', _('Deleted'))); self.showFilesModal(site); }).catch(function(e) { ui.addNotification(null, E('p', _('Error: ') + e.message), 'error'); });
	},

	showShareModal: function(site) {
		var self = this, url = site.url || ('https://' + site.domain), title = site.name + ' - SecuBox', enc = encodeURIComponent, qr = qrcode.generateSVG(url, 180);
		var modal = E('div', { 'class': 'mb-modal-overlay', 'id': 'mb-share-modal' }, [
			E('div', { 'class': 'mb-modal' }, [
				E('div', { 'class': 'mb-modal-header' }, [E('h3', {}, '\u{2705} ' + site.name), E('button', { 'class': 'mb-modal-close', 'click': function() { self.closeModal('mb-share-modal'); } }, '\u00D7')]),
				E('div', { 'class': 'mb-modal-body' }, [
					E('div', { 'class': 'mb-published-card' }, [
						E('div', { 'class': 'mb-url-box' }, [E('input', { 'type': 'text', 'readonly': true, 'value': url, 'id': 'mb-url' }), E('button', { 'click': function() { self.copyUrl(url); } }, '\u{1F4CB}')]),
						E('div', { 'class': 'mb-qr-container' }, [E('div', { 'innerHTML': qr || 'QR unavailable' })]),
						E('div', { 'class': 'mb-share-buttons' }, [
							E('a', { 'href': 'https://twitter.com/intent/tweet?url=' + enc(url) + '&text=' + enc(title), 'target': '_blank', 'class': 'mb-share-btn mb-share-twitter' }, '\u{1D54F}'),
							E('a', { 'href': 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url), 'target': '_blank', 'class': 'mb-share-btn mb-share-linkedin' }, 'in'),
							E('a', { 'href': 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url), 'target': '_blank', 'class': 'mb-share-btn mb-share-facebook' }, 'f'),
							E('a', { 'href': 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title), 'target': '_blank', 'class': 'mb-share-btn mb-share-telegram' }, '\u{2708}'),
							E('a', { 'href': 'https://wa.me/?text=' + enc(title + ' ' + url), 'target': '_blank', 'class': 'mb-share-btn mb-share-whatsapp' }, '\u{260E}'),
							E('a', { 'href': 'mailto:?subject=' + enc(title) + '&body=' + enc(url), 'class': 'mb-share-btn mb-share-email' }, '\u{2709}')
						])
					])
				]),
				E('div', { 'class': 'mb-modal-footer' }, [
					E('a', { 'href': url, 'target': '_blank', 'class': 'mb-btn mb-btn-submit', 'style': 'text-decoration:none' }, _('Visit')),
					E('button', { 'class': 'mb-btn', 'click': function() { self.closeModal('mb-share-modal'); } }, _('Close'))
				])
			])
		]);
		document.body.appendChild(modal);
	},

	handleSync: function(site) {
		ui.showModal(_('Syncing...'), [E('p', { 'class': 'spinning' }, _('Pulling...'))]);
		callSyncSite(site.id).then(function(r) { ui.hideModal(); ui.addNotification(null, E('p', r.success ? _('Synced') : _('Failed: ') + r.error), r.success ? null : 'error'); }).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', _('Error: ') + e.message), 'error'); });
	},

	handleDelete: function(site) {
		ui.showModal(_('Delete?'), [
			E('p', {}, _('Delete "') + site.name + '"?'),
			E('p', { 'style': 'color:#dc3545' }, _('This removes site, vhost, and files.')),
			E('div', { 'style': 'display:flex;gap:1rem;justify-content:flex-end;margin-top:1rem' }, [
				E('button', { 'class': 'mb-btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'mb-btn mb-btn-danger', 'click': function() {
					ui.hideModal(); ui.showModal(_('Deleting...'), [E('p', { 'class': 'spinning' }, _('Removing...'))]);
					callDeleteSite(site.id).then(function(r) { ui.hideModal(); if (r.success) { ui.addNotification(null, E('p', _('Deleted'))); window.location.reload(); } else { ui.addNotification(null, E('p', _('Failed: ') + r.error), 'error'); } }).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', _('Error: ') + e.message), 'error'); });
				}}, _('Delete'))
			])
		]);
	},

	setupDropzone: function(id) {
		var self = this, dz = document.getElementById(id); if (!dz) return;
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(e) { dz.addEventListener(e, function(ev) { ev.preventDefault(); ev.stopPropagation(); }); });
		['dragenter', 'dragover'].forEach(function(e) { dz.addEventListener(e, function() { dz.classList.add('dragover'); }); });
		['dragleave', 'drop'].forEach(function(e) { dz.addEventListener(e, function() { dz.classList.remove('dragover'); }); });
		dz.addEventListener('drop', function(e) { self.handleDroppedFiles(e.dataTransfer.files); });
	},

	handleFileSelect: function(e) { this.handleDroppedFiles(e.target.files); },
	handleDroppedFiles: function(files) { for (var i = 0; i < files.length; i++) this.uploadFiles.push(files[i]); this.updateFileList(); },

	updateFileList: function() {
		var self = this, c = document.getElementById('mb-file-list'); if (!c) return; c.innerHTML = '';
		this.uploadFiles.forEach(function(f, i) {
			c.appendChild(E('div', { 'class': 'mb-file-item' }, [
				E('span', {}, '\u{1F4C4}'), E('span', { 'class': 'mb-file-item-name' }, f.name), E('span', { 'class': 'mb-file-item-size' }, self.formatFileSize(f.size)),
				E('button', { 'class': 'mb-file-item-btn delete', 'click': function() { self.uploadFiles.splice(i, 1); self.updateFileList(); } }, '\u00D7')
			]));
		});
	},

	formatFileSize: function(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; },

	copyUrl: function(url) {
		if (navigator.clipboard) navigator.clipboard.writeText(url).then(function() { ui.addNotification(null, E('p', _('Copied!'))); });
		else { var i = document.getElementById('mb-url'); if (i) { i.select(); document.execCommand('copy'); } ui.addNotification(null, E('p', _('Copied!'))); }
	},

	closeModal: function(id) { var m = document.getElementById(id); if (m) m.remove(); },

	handleSaveApply: null, handleSave: null, handleReset: null
});
