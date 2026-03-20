'use strict';
'require view';
'require rpc';
'require ui';
'require fs';

var callDropletStatus = rpc.declare({
    object: 'luci.droplet',
    method: 'status',
    expect: {}
});

var callDropletList = rpc.declare({
    object: 'luci.droplet',
    method: 'list',
    expect: { droplets: [] }
});

var callDropletUpload = rpc.declare({
    object: 'luci.droplet',
    method: 'upload',
    params: ['file', 'name', 'domain'],
    expect: {}
});

var callDropletRemove = rpc.declare({
    object: 'luci.droplet',
    method: 'remove',
    params: ['name'],
    expect: {}
});

var callDropletJobStatus = rpc.declare({
    object: 'luci.droplet',
    method: 'job_status',
    params: ['job_id'],
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            callDropletStatus(),
            callDropletList()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var droplets = data[1] || [];

        var view = E('div', { 'class': 'cbi-map' }, [
            E('style', {}, `
                .droplet-container { max-width: 800px; margin: 0 auto; }
                .drop-zone {
                    border: 3px dashed #00d4ff;
                    border-radius: 16px;
                    padding: 60px 40px;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05));
                    transition: all 0.3s ease;
                    cursor: pointer;
                    margin-bottom: 20px;
                }
                .drop-zone:hover, .drop-zone.drag-over {
                    border-color: #7c3aed;
                    background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1));
                    transform: scale(1.02);
                }
                .drop-zone h2 { color: #00d4ff; margin: 0 0 10px; font-size: 1.5em; }
                .drop-zone p { color: #888; margin: 0; }
                .drop-zone input[type="file"] { display: none; }
                .publish-form {
                    display: none;
                    background: #1a1a24;
                    border: 1px solid #2a2a3e;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .publish-form.active { display: block; }
                .publish-form .field { margin-bottom: 15px; }
                .publish-form label { display: block; color: #888; margin-bottom: 5px; font-size: 0.9em; }
                .publish-form input[type="text"] {
                    width: 100%;
                    padding: 10px 15px;
                    background: #12121a;
                    border: 1px solid #2a2a3e;
                    border-radius: 8px;
                    color: #e0e0e0;
                    font-size: 1em;
                }
                .publish-form input:focus { outline: none; border-color: #00d4ff; }
                .publish-form .file-info {
                    background: #12121a;
                    padding: 10px 15px;
                    border-radius: 8px;
                    color: #00d4ff;
                    font-family: monospace;
                    margin-bottom: 15px;
                }
                .publish-form .buttons { display: flex; gap: 10px; }
                .btn-publish {
                    flex: 1;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #00d4ff, #7c3aed);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .btn-publish:hover { transform: translateY(-2px); }
                .btn-cancel {
                    padding: 12px 24px;
                    background: #2a2a3e;
                    border: none;
                    border-radius: 8px;
                    color: #888;
                    cursor: pointer;
                }
                .droplet-list { margin-top: 30px; }
                .droplet-list h3 { color: #e0e0e0; margin-bottom: 15px; }
                .droplet-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 15px;
                    background: #1a1a24;
                    border: 1px solid #2a2a3e;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .droplet-item:hover { border-color: #00d4ff; }
                .droplet-info { flex: 1; }
                .droplet-name { font-weight: 600; color: #e0e0e0; }
                .droplet-domain { font-size: 0.85em; color: #00d4ff; font-family: monospace; }
                .droplet-type {
                    font-size: 0.75em;
                    padding: 2px 8px;
                    background: rgba(124,58,237,0.2);
                    color: #7c3aed;
                    border-radius: 4px;
                    margin-left: 10px;
                }
                .droplet-actions button {
                    padding: 6px 12px;
                    background: #2a2a3e;
                    border: none;
                    border-radius: 4px;
                    color: #888;
                    cursor: pointer;
                    margin-left: 5px;
                }
                .droplet-actions button:hover { background: #3a3a4e; color: #e0e0e0; }
                .droplet-actions .btn-delete:hover { background: #ef4444; color: #fff; }
                .result-message {
                    display: none;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .result-message.success { display: block; background: rgba(16,185,129,0.1); border: 1px solid #10b981; color: #10b981; }
                .result-message.error { display: block; background: rgba(239,68,68,0.1); border: 1px solid #ef4444; color: #ef4444; }
                .result-message a { color: inherit; }
            `),

            E('div', { 'class': 'droplet-container' }, [
                E('h2', { 'style': 'color: #e0e0e0; margin-bottom: 20px;' }, [
                    E('span', { 'style': 'color: #00d4ff;' }, 'Droplet'),
                    ' Publisher'
                ]),

                E('div', { 'class': 'result-message', 'id': 'result-msg' }),

                E('div', { 'class': 'drop-zone', 'id': 'drop-zone' }, [
                    E('h2', {}, '📦 Drop to Publish'),
                    E('p', {}, 'Drop HTML files or ZIP archives here'),
                    E('p', { 'style': 'margin-top: 10px; font-size: 0.85em;' }, 'or click to browse (multiple files supported)'),
                    E('input', { 'type': 'file', 'id': 'file-input', 'accept': '.html,.htm,.zip', 'multiple': true })
                ]),

                E('div', { 'class': 'publish-form', 'id': 'publish-form' }, [
                    E('div', { 'id': 'files-list', 'style': 'margin-bottom: 15px;' }),
                    E('div', { 'class': 'field' }, [
                        E('label', {}, 'Domain'),
                        E('input', { 'type': 'text', 'id': 'site-domain', 'value': status.default_domain || 'gk2.secubox.in', 'placeholder': 'gk2.secubox.in' })
                    ]),
                    E('div', { 'class': 'buttons' }, [
                        E('button', { 'class': 'btn-cancel', 'id': 'btn-cancel' }, 'Cancel'),
                        E('button', { 'class': 'btn-publish', 'id': 'btn-publish' }, '🚀 Publish')
                    ])
                ]),

                E('div', { 'class': 'droplet-list' }, [
                    E('h3', {}, 'Published Droplets (' + droplets.length + ')'),
                    E('div', { 'id': 'droplet-items' },
                        droplets.map(function(d) {
                            return E('div', { 'class': 'droplet-item', 'data-name': d.name }, [
                                E('div', { 'class': 'droplet-info' }, [
                                    E('span', { 'class': 'droplet-name' }, d.name),
                                    E('span', { 'class': 'droplet-type' }, d.type || 'static'),
                                    E('div', { 'class': 'droplet-domain' }, [
                                        E('a', { 'href': 'https://' + d.domain + '/', 'target': '_blank' }, d.domain)
                                    ])
                                ]),
                                E('div', { 'class': 'droplet-actions' }, [
                                    E('button', { 'class': 'btn-open', 'data-url': 'https://' + d.domain + '/' }, '🔗'),
                                    E('button', { 'class': 'btn-delete', 'data-name': d.name }, '🗑')
                                ])
                            ]);
                        })
                    )
                ])
            ])
        ]);

        // Event handlers
        var dropZone = view.querySelector('#drop-zone');
        var fileInput = view.querySelector('#file-input');
        var publishForm = view.querySelector('#publish-form');
        var filesList = view.querySelector('#files-list');
        var siteDomain = view.querySelector('#site-domain');
        var btnPublish = view.querySelector('#btn-publish');
        var btnCancel = view.querySelector('#btn-cancel');
        var resultMsg = view.querySelector('#result-msg');
        var selectedFiles = [];

        // Drag & drop
        dropZone.addEventListener('click', function() { fileInput.click(); });
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', function() {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        fileInput.addEventListener('change', function() {
            if (fileInput.files.length) {
                handleFiles(Array.from(fileInput.files));
            }
        });

        function handleFiles(files) {
            selectedFiles = files.map(function(file) {
                var name = file.name.replace(/\.(html?|zip)$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
                return { file: file, name: name };
            });

            // Build files list UI
            filesList.innerHTML = '';
            selectedFiles.forEach(function(item, idx) {
                var row = E('div', { 'class': 'file-info', 'style': 'display: flex; align-items: center; gap: 10px; margin-bottom: 8px;' }, [
                    E('span', { 'style': 'flex: 0 0 auto;' }, '📄'),
                    E('span', { 'style': 'flex: 1; overflow: hidden; text-overflow: ellipsis;' }, item.file.name + ' (' + formatSize(item.file.size) + ')'),
                    E('input', {
                        'type': 'text',
                        'value': item.name,
                        'placeholder': 'site name',
                        'data-idx': idx,
                        'class': 'file-name-input',
                        'style': 'width: 150px; padding: 5px 10px; background: #12121a; border: 1px solid #2a2a3e; border-radius: 4px; color: #e0e0e0;'
                    })
                ]);
                filesList.appendChild(row);
            });

            // Update names on input change
            filesList.querySelectorAll('.file-name-input').forEach(function(input) {
                input.addEventListener('input', function() {
                    selectedFiles[parseInt(input.dataset.idx)].name = input.value;
                });
            });

            publishForm.classList.add('active');
            dropZone.style.display = 'none';
        }

        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        btnCancel.addEventListener('click', function() {
            publishForm.classList.remove('active');
            dropZone.style.display = 'block';
            selectedFiles = [];
            fileInput.value = '';
            filesList.innerHTML = '';
        });

        btnPublish.addEventListener('click', function() {
            // Validate all files have names
            var valid = selectedFiles.every(function(item) { return item.name && item.name.trim(); });
            if (!selectedFiles.length || !valid) {
                showResult('error', 'Please select files and enter names for all');
                return;
            }

            btnPublish.disabled = true;
            var total = selectedFiles.length;
            var completed = 0;
            var errors = [];

            showResult('success', '⏳ Publishing ' + total + ' file(s)...');

            // Process files sequentially
            function processNext(idx) {
                if (idx >= selectedFiles.length) {
                    // All done
                    btnPublish.disabled = false;
                    btnPublish.textContent = '🚀 Publish';
                    if (errors.length) {
                        showResult('error', '❌ ' + errors.join('<br>'));
                    } else {
                        showResult('success', '✅ Published ' + total + ' droplet(s)!');
                        setTimeout(function() { location.reload(); }, 2000);
                    }
                    return;
                }

                var item = selectedFiles[idx];
                btnPublish.textContent = '⏳ ' + (idx + 1) + '/' + total + '...';

                // Upload file
                var formData = new FormData();
                formData.append('sessionid', rpc.getSessionID());
                formData.append('filename', '/tmp/droplet-upload/' + item.file.name);
                formData.append('filedata', item.file);

                fetch('/cgi-bin/cgi-upload', {
                    method: 'POST',
                    body: formData
                })
                .then(function(res) { return res.json(); })
                .then(function(uploadRes) {
                    if (uploadRes.size) {
                        return callDropletUpload(item.file.name, item.name, siteDomain.value);
                    } else {
                        throw new Error('Upload failed for ' + item.file.name);
                    }
                })
                .then(function(result) {
                    if (result.status === 'started' && result.job_id) {
                        return pollJobStatus(result.job_id, false);
                    } else if (!result.success && result.error) {
                        throw new Error(item.name + ': ' + result.error);
                    }
                })
                .then(function() {
                    completed++;
                    processNext(idx + 1);
                })
                .catch(function(err) {
                    errors.push(item.name + ': ' + err.message);
                    processNext(idx + 1);
                });
            }

            processNext(0);
        });

        function showResult(type, msg) {
            resultMsg.className = 'result-message ' + type;
            resultMsg.innerHTML = msg;
        }

        function pollJobStatus(jobId, showMessages) {
            if (showMessages === undefined) showMessages = true;
            return new Promise(function(resolve, reject) {
                var attempts = 0;
                var maxAttempts = 60; // 60 * 2s = 2 minutes max

                function check() {
                    callDropletJobStatus(jobId).then(function(status) {
                        if (status.status === 'complete') {
                            if (status.success) {
                                if (showMessages) {
                                    showResult('success', '✅ Published! <a href="' + status.url + '" target="_blank">' + status.url + '</a>');
                                    setTimeout(function() { location.reload(); }, 2000);
                                }
                                resolve(status);
                            } else {
                                if (showMessages) {
                                    showResult('error', '❌ ' + (status.error || 'Failed to publish'));
                                }
                                reject(new Error(status.error || 'Failed to publish'));
                            }
                        } else if (status.status === 'running') {
                            attempts++;
                            if (attempts < maxAttempts) {
                                setTimeout(check, 2000);
                            } else {
                                if (showMessages) showResult('error', '❌ Publish timed out');
                                reject(new Error('Timeout'));
                            }
                        } else {
                            if (showMessages) showResult('error', '❌ Job not found');
                            reject(new Error('Job not found'));
                        }
                    }).catch(function(err) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(check, 2000);
                        } else {
                            reject(err);
                        }
                    });
                }

                check();
            });
        }

        // Delete buttons
        view.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var name = btn.dataset.name;
                if (confirm('Delete "' + name + '"?')) {
                    callDropletRemove(name).then(function() {
                        btn.closest('.droplet-item').remove();
                        showResult('success', 'Deleted: ' + name);
                    });
                }
            });
        });

        // Open buttons
        view.querySelectorAll('.btn-open').forEach(function(btn) {
            btn.addEventListener('click', function() {
                window.open(btn.dataset.url, '_blank');
            });
        });

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
