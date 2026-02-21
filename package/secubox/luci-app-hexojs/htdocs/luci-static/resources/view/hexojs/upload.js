'use strict';
'require view';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callUploadHTML = rpc.declare({
    object: 'luci.hexojs',
    method: 'upload_html',
    params: ['base64_data', 'title', 'visibility', 'category', 'tags'],
    expect: { '': {} }
});

var callUploadPDF = rpc.declare({
    object: 'luci.hexojs',
    method: 'upload_pdf',
    params: ['base64_data', 'title', 'visibility', 'category'],
    expect: { '': {} }
});

var callUploadMD = rpc.declare({
    object: 'luci.hexojs',
    method: 'upload_article',
    params: ['filename', 'content', 'title', 'visibility', 'category', 'tags'],
    expect: { '': {} }
});

var callWizardUpload = rpc.declare({
    object: 'luci.hexojs',
    method: 'wizard_upload',
    params: ['base64_data', 'filename', 'title', 'visibility', 'category', 'tags', 'target', 'options'],
    expect: { '': {} }
});

var callGiteaUpload = rpc.declare({
    object: 'luci.gitea',
    method: 'upload_file',
    params: ['repo', 'path', 'content', 'message'],
    expect: { '': {} }
});

var callStreamlitCreate = rpc.declare({
    object: 'luci.streamlit',
    method: 'create_app',
    params: ['name', 'source_file'],
    expect: { '': {} }
});

var callMetablogizerCreate = rpc.declare({
    object: 'luci.metablogizer',
    method: 'create_entry',
    params: ['name', 'source_file', 'category'],
    expect: { '': {} }
});

function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
            var base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

return view.extend({
    render: function() {
        var self = this;

        var content = E('div', { style: 'padding:20px;max-width:800px;margin:0 auto;' }, [
            E('h2', { style: 'text-align:center;margin-bottom:30px;' }, '📤 Content Upload Wizard'),

            E('div', { class: 'kiss-card', style: 'padding:30px;' }, [
                // Step 1: File Selection
                E('div', { class: 'wizard-step', id: 'step-file' }, [
                    E('h3', {}, '1. Select File'),
                    E('p', { style: 'color:#888;' }, 'Supported: HTML, PDF, Markdown (.md)'),
                    E('div', { style: 'border:2px dashed #3498db;border-radius:12px;padding:40px;text-align:center;margin:20px 0;' }, [
                        E('input', {
                            type: 'file',
                            id: 'file-input',
                            accept: '.html,.htm,.pdf,.md,.markdown',
                            style: 'display:none;'
                        }),
                        E('label', { for: 'file-input', style: 'cursor:pointer;display:block;' }, [
                            E('div', { style: 'font-size:3em;margin-bottom:10px;' }, '📄'),
                            E('div', { style: 'color:#3498db;font-size:1.2em;' }, 'Click to select file'),
                            E('div', { id: 'file-name', style: 'margin-top:10px;color:#27ae60;font-weight:bold;' }, '')
                        ])
                    ])
                ]),

                // Step 2: Metadata
                E('div', { class: 'wizard-step', id: 'step-meta', style: 'display:none;' }, [
                    E('h3', {}, '2. Article Details'),
                    E('div', { style: 'margin:15px 0;' }, [
                        E('label', { style: 'display:block;margin-bottom:5px;' }, 'Title'),
                        E('input', {
                            type: 'text',
                            id: 'input-title',
                            style: 'width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#1a1a2e;color:#fff;',
                            placeholder: 'Article title...'
                        })
                    ]),
                    E('div', { style: 'margin:15px 0;' }, [
                        E('label', { style: 'display:block;margin-bottom:5px;' }, 'Category'),
                        E('input', {
                            type: 'text',
                            id: 'input-category',
                            style: 'width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#1a1a2e;color:#fff;',
                            placeholder: 'e.g., Blog, Tutorial, News',
                            value: 'Uploads'
                        })
                    ]),
                    E('div', { style: 'margin:15px 0;' }, [
                        E('label', { style: 'display:block;margin-bottom:5px;' }, 'Tags (comma-separated)'),
                        E('input', {
                            type: 'text',
                            id: 'input-tags',
                            style: 'width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#1a1a2e;color:#fff;',
                            placeholder: 'tag1, tag2, tag3'
                        })
                    ]),
                    E('div', { style: 'margin:20px 0;' }, [
                        E('label', { style: 'display:block;margin-bottom:10px;' }, 'Visibility'),
                        E('div', { style: 'display:flex;gap:20px;' }, [
                            E('label', { style: 'display:flex;align-items:center;gap:8px;cursor:pointer;' }, [
                                E('input', { type: 'radio', name: 'visibility', value: 'public', checked: true }),
                                E('span', {}, '🌍 Public')
                            ]),
                            E('label', { style: 'display:flex;align-items:center;gap:8px;cursor:pointer;' }, [
                                E('input', { type: 'radio', name: 'visibility', value: 'private' }),
                                E('span', {}, '🔒 Private (Draft)')
                            ])
                        ])
                    ])
                ]),

                // Step 3: Target Selection
                E('div', { class: 'wizard-step', id: 'step-target', style: 'display:none;' }, [
                    E('h3', {}, '3. Publish To'),
                    E('div', { style: 'display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:20px 0;' }, [
                        E('div', {
                            class: 'target-option selected',
                            'data-target': 'hexojs',
                            style: 'padding:20px;border:2px solid #3498db;border-radius:12px;cursor:pointer;text-align:center;'
                        }, [
                            E('div', { style: 'font-size:2em;' }, '📝'),
                            E('div', { style: 'font-weight:bold;' }, 'HexoJS Blog'),
                            E('div', { style: 'color:#888;font-size:0.9em;' }, 'Static blog post')
                        ]),
                        E('div', {
                            class: 'target-option',
                            'data-target': 'gitea',
                            style: 'padding:20px;border:2px solid #444;border-radius:12px;cursor:pointer;text-align:center;'
                        }, [
                            E('div', { style: 'font-size:2em;' }, '🐙'),
                            E('div', { style: 'font-weight:bold;' }, 'Gitea'),
                            E('div', { style: 'color:#888;font-size:0.9em;' }, 'Version control')
                        ]),
                        E('div', {
                            class: 'target-option',
                            'data-target': 'streamlit',
                            style: 'padding:20px;border:2px solid #444;border-radius:12px;cursor:pointer;text-align:center;'
                        }, [
                            E('div', { style: 'font-size:2em;' }, '📊'),
                            E('div', { style: 'font-weight:bold;' }, 'Streamlit'),
                            E('div', { style: 'color:#888;font-size:0.9em;' }, 'Interactive app')
                        ]),
                        E('div', {
                            class: 'target-option',
                            'data-target': 'metablogizer',
                            style: 'padding:20px;border:2px solid #444;border-radius:12px;cursor:pointer;text-align:center;'
                        }, [
                            E('div', { style: 'font-size:2em;' }, '🔗'),
                            E('div', { style: 'font-weight:bold;' }, 'MetaBlogizer'),
                            E('div', { style: 'color:#888;font-size:0.9em;' }, 'Multi-platform')
                        ])
                    ]),
                    // Gitea options (shown when gitea selected)
                    E('div', { id: 'gitea-options', style: 'display:none;margin-top:20px;padding:15px;background:#1a1a2e;border-radius:8px;' }, [
                        E('h4', { style: 'margin-bottom:10px;' }, 'Gitea Repository'),
                        E('input', {
                            type: 'text',
                            id: 'gitea-repo',
                            style: 'width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#16213e;color:#fff;',
                            placeholder: 'owner/repo (e.g., admin/my-docs)'
                        }),
                        E('input', {
                            type: 'text',
                            id: 'gitea-path',
                            style: 'width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#16213e;color:#fff;margin-top:10px;',
                            placeholder: 'path/in/repo (e.g., docs/articles/)'
                        })
                    ])
                ]),

                // Navigation Buttons
                E('div', { style: 'display:flex;justify-content:space-between;margin-top:30px;' }, [
                    E('button', {
                        id: 'btn-prev',
                        class: 'cbi-button',
                        style: 'display:none;',
                        click: ui.createHandlerFn(this, 'prevStep')
                    }, '← Back'),
                    E('button', {
                        id: 'btn-next',
                        class: 'cbi-button cbi-button-action',
                        style: 'margin-left:auto;',
                        click: ui.createHandlerFn(this, 'nextStep')
                    }, 'Next →')
                ]),

                // Progress dots
                E('div', { style: 'display:flex;justify-content:center;gap:10px;margin-top:20px;' }, [
                    E('span', { class: 'step-dot', style: 'width:12px;height:12px;border-radius:50%;background:#3498db;' }),
                    E('span', { class: 'step-dot', style: 'width:12px;height:12px;border-radius:50%;background:#444;' }),
                    E('span', { class: 'step-dot', style: 'width:12px;height:12px;border-radius:50%;background:#444;' })
                ])
            ]),

            // Result Card
            E('div', { id: 'result-card', class: 'kiss-card', style: 'display:none;padding:30px;text-align:center;' }, [
                E('div', { style: 'font-size:4em;margin-bottom:20px;' }, '✅'),
                E('h3', {}, 'Upload Successful!'),
                E('p', { id: 'result-message', style: 'color:#888;' }, ''),
                E('div', { style: 'margin-top:20px;' }, [
                    E('a', {
                        id: 'result-link',
                        href: '#',
                        class: 'cbi-button cbi-button-action',
                        target: '_blank',
                        style: 'text-decoration:none;'
                    }, 'View Article'),
                    E('button', {
                        class: 'cbi-button',
                        style: 'margin-left:10px;',
                        click: function() { window.location.reload(); }
                    }, 'Upload Another')
                ])
            ])
        ]);

        // Initialize
        setTimeout(function() {
            self.currentStep = 1;
            self.selectedFile = null;
            self.selectedTarget = 'hexojs';

            var fileInput = document.getElementById('file-input');
            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    self.selectedFile = e.target.files[0];
                    document.getElementById('file-name').textContent = self.selectedFile.name;
                    var title = self.selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
                    document.getElementById('input-title').value = title;
                }
            });

            document.querySelectorAll('.target-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    document.querySelectorAll('.target-option').forEach(function(o) {
                        o.style.borderColor = '#444';
                    });
                    this.style.borderColor = '#3498db';
                    self.selectedTarget = this.dataset.target;
                    // Show/hide gitea options
                    var giteaOpts = document.getElementById('gitea-options');
                    if (giteaOpts) {
                        giteaOpts.style.display = self.selectedTarget === 'gitea' ? 'block' : 'none';
                    }
                });
            });
        }, 100);

        return KissTheme.wrap([content], 'admin/services/hexojs/upload');
    },

    nextStep: function() {
        var self = this;

        if (this.currentStep === 1) {
            if (!this.selectedFile) {
                ui.addNotification(null, E('p', 'Please select a file'), 'warning');
                return;
            }
            document.getElementById('step-file').style.display = 'none';
            document.getElementById('step-meta').style.display = 'block';
            document.getElementById('btn-prev').style.display = 'block';
            this.currentStep = 2;
            this.updateDots();
        } else if (this.currentStep === 2) {
            var title = document.getElementById('input-title').value;
            if (!title) {
                ui.addNotification(null, E('p', 'Please enter a title'), 'warning');
                return;
            }
            document.getElementById('step-meta').style.display = 'none';
            document.getElementById('step-target').style.display = 'block';
            document.getElementById('btn-next').textContent = '📤 Publish';
            this.currentStep = 3;
            this.updateDots();
        } else if (this.currentStep === 3) {
            this.doUpload();
        }
    },

    prevStep: function() {
        if (this.currentStep === 2) {
            document.getElementById('step-meta').style.display = 'none';
            document.getElementById('step-file').style.display = 'block';
            document.getElementById('btn-prev').style.display = 'none';
            this.currentStep = 1;
        } else if (this.currentStep === 3) {
            document.getElementById('step-target').style.display = 'none';
            document.getElementById('step-meta').style.display = 'block';
            document.getElementById('btn-next').textContent = 'Next →';
            this.currentStep = 2;
        }
        this.updateDots();
    },

    updateDots: function() {
        var dots = document.querySelectorAll('.step-dot');
        var step = this.currentStep;
        dots.forEach(function(dot, i) {
            dot.style.background = i < step ? '#3498db' : '#444';
        });
    },

    doUpload: function() {
        var self = this;
        var title = document.getElementById('input-title').value;
        var category = document.getElementById('input-category').value || 'Uploads';
        var tags = document.getElementById('input-tags').value || '';
        var visibility = document.querySelector('input[name="visibility"]:checked').value;
        var target = this.selectedTarget;

        var ext = this.selectedFile.name.split('.').pop().toLowerCase();

        ui.showModal('Uploading...', [
            E('p', { class: 'spinning' }, 'Processing ' + this.selectedFile.name + '...')
        ]);

        fileToBase64(this.selectedFile).then(function(base64) {
            // Route based on target
            if (target === 'hexojs') {
                // Default HexoJS upload
                if (ext === 'pdf') {
                    return callUploadPDF(base64, title, visibility, category);
                } else if (ext === 'html' || ext === 'htm') {
                    return callUploadHTML(base64, title, visibility, category, tags);
                } else {
                    return callUploadMD(self.selectedFile.name, atob(base64), title, visibility, category, tags);
                }
            } else if (target === 'gitea') {
                // Gitea upload
                var repo = document.getElementById('gitea-repo').value || 'admin/uploads';
                var path = document.getElementById('gitea-path').value || 'uploads/';
                var fullPath = path.replace(/\/$/, '') + '/' + self.selectedFile.name;
                return callGiteaUpload(repo, fullPath, base64, 'Upload: ' + title);
            } else if (target === 'streamlit') {
                // Create Streamlit app from markdown/python
                var appName = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                return callStreamlitCreate(appName, base64).then(function(result) {
                    result.target = 'streamlit';
                    result.appUrl = '/admin/services/streamlit/apps/' + appName;
                    return result;
                });
            } else if (target === 'metablogizer') {
                // Create MetaBlogizer entry
                var entryName = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                return callMetablogizerCreate(entryName, base64, category).then(function(result) {
                    result.target = 'metablogizer';
                    return result;
                });
            } else {
                // Fallback: use wizard_upload for unified handling
                var options = {};
                if (target === 'gitea') {
                    options.repo = document.getElementById('gitea-repo').value;
                    options.path = document.getElementById('gitea-path').value;
                }
                return callWizardUpload(base64, self.selectedFile.name, title, visibility, category, tags, target, JSON.stringify(options));
            }
        }).then(function(result) {
            ui.hideModal();
            if (result.success) {
                document.querySelector('.kiss-card').style.display = 'none';
                document.getElementById('result-card').style.display = 'block';

                var message = 'Your content has been uploaded.';
                var linkText = 'View';
                var linkHref = '#';

                if (target === 'hexojs') {
                    message = 'Your ' + (visibility === 'public' ? 'article' : 'draft') + ' has been created.';
                    linkText = 'View Article';
                    if (result.slug) linkHref = '/' + result.slug + '/';
                } else if (target === 'gitea') {
                    message = 'File uploaded to Gitea repository.';
                    linkText = 'Open Gitea';
                    linkHref = result.url || '/admin/services/gitea/overview';
                } else if (target === 'streamlit') {
                    message = 'Streamlit app created successfully.';
                    linkText = 'Open App';
                    linkHref = result.appUrl || '/admin/services/streamlit/overview';
                } else if (target === 'metablogizer') {
                    message = 'MetaBlogizer entry created.';
                    linkText = 'View Entry';
                    linkHref = result.url || '/admin/services/metablogizer/overview';
                }

                document.getElementById('result-message').textContent = message;
                document.getElementById('result-link').textContent = linkText;
                document.getElementById('result-link').href = linkHref;
            } else {
                ui.addNotification(null, E('p', result.error || 'Upload failed'), 'error');
            }
        }).catch(function(err) {
            ui.hideModal();
            ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
        });
    }
});
