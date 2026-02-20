'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require fs';

var callStaticList = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_list',
	params: ['instance'],
	expect: {}
});

var callStaticUpload = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_upload',
	params: ['instance', 'filename', 'content'],
	expect: {}
});

var callStaticCreate = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_create',
	params: ['name', 'domain'],
	expect: {}
});

var callStaticDelete = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_delete',
	params: ['name'],
	expect: {}
});

var callStaticPublish = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_publish',
	params: ['instance'],
	expect: {}
});

var callStaticDeleteFile = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_delete_file',
	params: ['instance', 'filename'],
	expect: {}
});

var callStaticConfigureAuth = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_configure_auth',
	params: ['instance', 'enabled', 'domain'],
	expect: {}
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
	if (!timestamp) return '-';
	var d = new Date(timestamp * 1000);
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

return view.extend({
	selectedInstance: null,

	load: function() {
		return callStaticList({});
	},

	renderInstanceCard: function(instance) {
		var self = this;
		var card = E('div', { 'class': 'cbi-section', 'style': 'margin-bottom: 10px; padding: 15px; border: 1px solid #ccc; border-radius: 8px;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;' }, [
				E('div', {}, [
					E('strong', { 'style': 'font-size: 1.2em;' }, instance.name),
					instance.domain ? E('span', { 'style': 'margin-left: 10px; color: #666;' }, instance.domain) : '',
					instance.auth_enabled ? E('span', { 'class': 'badge', 'style': 'margin-left: 10px; background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;' }, 'Auth') : ''
				]),
				E('div', {}, [
					E('span', { 'style': 'margin-right: 15px; color: #666;' }, instance.file_count + ' files'),
					instance.port > 0 ? E('span', { 'style': 'color: #666;' }, 'Port ' + instance.port) : ''
				])
			]),
			E('div', { 'style': 'display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.showFiles(instance.name); }
				}, 'Manage Files'),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': function() { self.publishSite(instance.name); }
				}, 'Publish'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { self.configureAuth(instance.name, instance.domain); }
				}, 'Auth'),
				E('button', {
					'class': 'cbi-button cbi-button-remove',
					'click': function() { self.deleteSite(instance.name); }
				}, 'Delete')
			])
		]);
		return card;
	},

	showFiles: function(instanceName) {
		var self = this;

		callStaticList({ instance: instanceName }).then(function(result) {
			if (!result.success) {
				ui.addNotification(null, E('p', result.error || 'Failed to list files'), 'error');
				return;
			}

			self.selectedInstance = instanceName;
			var container = document.getElementById('file-list-container');
			container.innerHTML = '';

			// Header
			container.appendChild(E('h3', {}, 'Files in "' + instanceName + '"'));

			// Upload section
			var uploadSection = E('div', { 'class': 'cbi-section', 'style': 'padding: 15px; background: #f9f9f9; border-radius: 8px; margin-bottom: 15px;' }, [
				E('h4', {}, 'Upload Files'),
				E('input', {
					'type': 'file',
					'id': 'file-upload-input',
					'multiple': true,
					'style': 'margin-right: 10px;'
				}),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.uploadFiles(instanceName); }
				}, 'Upload Selected')
			]);
			container.appendChild(uploadSection);

			// File list table
			var table = E('table', { 'class': 'table cbi-section-table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'Filename'),
					E('th', { 'class': 'th' }, 'Size'),
					E('th', { 'class': 'th' }, 'Modified'),
					E('th', { 'class': 'th' }, 'Actions')
				])
			]);

			var files = result.files || [];
			if (files.length === 0) {
				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'colspan': '4', 'style': 'text-align: center; color: #666;' }, 'No files yet. Upload some files above.')
				]));
			} else {
				files.forEach(function(file) {
					table.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, file.name),
						E('td', { 'class': 'td' }, formatBytes(file.size)),
						E('td', { 'class': 'td' }, formatDate(file.modified)),
						E('td', { 'class': 'td' }, [
							E('button', {
								'class': 'cbi-button cbi-button-remove',
								'style': 'padding: 2px 8px; font-size: 0.9em;',
								'click': function() { self.deleteFile(instanceName, file.name); }
							}, 'Delete')
						])
					]));
				});
			}

			container.appendChild(table);

			// Back button
			container.appendChild(E('button', {
				'class': 'cbi-button',
				'style': 'margin-top: 15px;',
				'click': function() { self.refreshView(); }
			}, 'Back to Sites'));
		});
	},

	uploadFiles: function(instanceName) {
		var self = this;
		var input = document.getElementById('file-upload-input');
		var files = input.files;

		if (files.length === 0) {
			ui.addNotification(null, E('p', 'Please select files to upload'), 'warning');
			return;
		}

		var uploadPromises = [];

		for (var i = 0; i < files.length; i++) {
			(function(file) {
				var promise = new Promise(function(resolve, reject) {
					var reader = new FileReader();
					reader.onload = function(e) {
						// Convert to base64
						var base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(e.target.result)));

						callStaticUpload({
							instance: instanceName,
							filename: file.name,
							content: base64
						}).then(function(result) {
							if (result.success) {
								resolve(file.name);
							} else {
								reject(result.error || 'Upload failed for ' + file.name);
							}
						}).catch(reject);
					};
					reader.onerror = function() {
						reject('Failed to read file: ' + file.name);
					};
					reader.readAsArrayBuffer(file);
				});
				uploadPromises.push(promise);
			})(files[i]);
		}

		Promise.all(uploadPromises).then(function(uploaded) {
			ui.addNotification(null, E('p', 'Uploaded ' + uploaded.length + ' file(s)'), 'success');
			self.showFiles(instanceName);
		}).catch(function(err) {
			ui.addNotification(null, E('p', 'Upload error: ' + err), 'error');
			self.showFiles(instanceName);
		});
	},

	deleteFile: function(instanceName, filename) {
		var self = this;

		if (!confirm('Delete file "' + filename + '"?')) return;

		callStaticDeleteFile({ instance: instanceName, filename: filename }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'File deleted'), 'success');
				self.showFiles(instanceName);
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to delete file'), 'error');
			}
		});
	},

	publishSite: function(instanceName) {
		callStaticPublish({ instance: instanceName }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Published to ' + result.url), 'success');
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to publish'), 'error');
			}
		});
	},

	configureAuth: function(instanceName, currentDomain) {
		var self = this;

		var domain = prompt('Enter domain for HAProxy auth (e.g., site.example.com):', currentDomain || '');
		if (domain === null) return;

		if (!domain) {
			ui.addNotification(null, E('p', 'Domain is required for HAProxy auth'), 'warning');
			return;
		}

		callStaticConfigureAuth({
			instance: instanceName,
			enabled: true,
			domain: domain
		}).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Auth configured for ' + domain), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to configure auth'), 'error');
			}
		});
	},

	deleteSite: function(instanceName) {
		var self = this;

		if (!confirm('Delete static site "' + instanceName + '" and all its files?')) return;

		callStaticDelete({ name: instanceName }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Site deleted'), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to delete site'), 'error');
			}
		});
	},

	createSite: function() {
		var self = this;

		var name = prompt('Enter site name (lowercase, no spaces):');
		if (!name) return;

		// Validate name
		if (!/^[a-z][a-z0-9_]*$/.test(name)) {
			ui.addNotification(null, E('p', 'Invalid name. Use lowercase letters, numbers, underscore.'), 'error');
			return;
		}

		var domain = prompt('Enter domain (optional, e.g., site.example.com):');

		callStaticCreate({ name: name, domain: domain || '' }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Site "' + name + '" created on port ' + result.port), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to create site'), 'error');
			}
		});
	},

	refreshView: function() {
		var self = this;

		callStaticList({}).then(function(result) {
			var container = document.getElementById('file-list-container');
			container.innerHTML = '';

			var instancesContainer = document.getElementById('static-instances');
			instancesContainer.innerHTML = '';

			if (!result.success) {
				instancesContainer.appendChild(E('p', { 'style': 'color: red;' }, result.error || 'Failed to load sites'));
				return;
			}

			var instances = result.instances || [];
			if (instances.length === 0) {
				instancesContainer.appendChild(E('p', { 'style': 'color: #666; text-align: center; padding: 20px;' },
					'No static sites yet. Click "Create New Site" to get started.'));
			} else {
				instances.forEach(function(inst) {
					instancesContainer.appendChild(self.renderInstanceCard(inst));
				});
			}
		});
	},

	render: function(data) {
		var self = this;
		var instances = (data && data.instances) || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'Static Sites'),
			E('div', { 'class': 'cbi-map-descr' },
				'Upload and manage static HTML sites with optional Basic Auth via HAProxy. Fast KISS publishing without Hexo build process.'),

			// Create button
			E('div', { 'style': 'margin: 20px 0;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-add',
					'click': function() { self.createSite(); }
				}, 'Create New Site')
			]),

			// Instances container
			E('div', { 'id': 'static-instances' }),

			// File list container (shown when managing a site)
			E('div', { 'id': 'file-list-container', 'style': 'margin-top: 20px;' })
		]);

		// Render initial instances
		var instancesContainer = view.querySelector('#static-instances');
		if (instances.length === 0) {
			instancesContainer.appendChild(E('p', { 'style': 'color: #666; text-align: center; padding: 20px;' },
				'No static sites yet. Click "Create New Site" to get started.'));
		} else {
			instances.forEach(function(inst) {
				instancesContainer.appendChild(self.renderInstanceCard(inst));
			});
		}

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
