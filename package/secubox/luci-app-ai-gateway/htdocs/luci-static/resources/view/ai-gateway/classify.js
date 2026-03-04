'use strict';
'require view';
'require rpc';

var callClassify = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'classify',
	params: ['text'],
	expect: {}
});

var kissCSS = `
	.classify-container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; }
	.classify-container h2 { margin: 0 0 8px 0; }
	.classify-container .subtitle { color: var(--text-secondary, #64748b); margin-bottom: 24px; }

	.classify-form { margin-bottom: 24px; }
	.classify-form textarea {
		width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--border-color, #e2e8f0);
		border-radius: 8px; font-size: 0.95em; font-family: monospace; resize: vertical;
		background: var(--bg-primary, white); color: var(--text-primary, #1e293b);
	}
	.classify-form .btn-row { margin-top: 12px; display: flex; gap: 12px; }

	.btn { padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none; }
	.btn-primary { background: #3b82f6; color: white; }
	.btn-primary:hover { background: #2563eb; }
	.btn-secondary { background: #64748b; color: white; }
	.btn-secondary:hover { background: #475569; }

	.result-card { background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
	.result-card h3 { margin: 0 0 16px 0; font-size: 1.1em; }

	.classification-badge { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 1.1em; }
	.badge-local_only { background: #dcfce7; color: #166534; }
	.badge-sanitized { background: #fef3c7; color: #92400e; }
	.badge-cloud_direct { background: #dbeafe; color: #1e40af; }

	.result-details { margin-top: 16px; }
	.detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid var(--border-color, #e2e8f0); }
	.detail-row:last-child { border-bottom: none; }
	.detail-label { width: 150px; font-weight: 500; color: var(--text-secondary, #64748b); }
	.detail-value { flex: 1; font-family: monospace; }

	.examples-section { margin-top: 32px; }
	.examples-section h3 { margin-bottom: 16px; }
	.example-list { display: flex; flex-direction: column; gap: 8px; }
	.example-item { padding: 12px 16px; background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0);
		border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; }
	.example-item:hover { border-color: #3b82f6; background: #eff6ff; }
	.example-text { font-family: monospace; font-size: 0.9em; }
	.example-badge { padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 500; }

	.tier-explanation { margin-top: 24px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; }
	.tier-explanation h4 { margin: 0 0 12px 0; color: #0369a1; }
	.tier-explanation ul { margin: 0; padding-left: 20px; }
	.tier-explanation li { margin-bottom: 8px; color: #0c4a6e; }

	@media (prefers-color-scheme: dark) {
		.classify-form textarea { background: #0f172a; border-color: #334155; color: #f1f5f9; }
		.result-card, .example-item { background: #1e293b; border-color: #334155; }
		.tier-explanation { background: #0c4a6e; border-color: #0369a1; }
		.tier-explanation h4, .tier-explanation li { color: #bae6fd; }
	}
`;

var examples = [
	{ text: 'What is the weather today?', expected: 'cloud_direct' },
	{ text: 'Server IP is 192.168.1.100', expected: 'local_only' },
	{ text: 'User MAC address: AA:BB:CC:DD:EE:FF', expected: 'local_only' },
	{ text: 'password=secret123', expected: 'local_only' },
	{ text: 'Check /var/log/syslog for errors', expected: 'local_only' },
	{ text: 'The user John Smith lives in Paris', expected: 'sanitized' },
	{ text: 'Explain how firewalls work', expected: 'cloud_direct' },
	{ text: 'API_KEY=sk-1234567890abcdef', expected: 'local_only' },
	{ text: 'BEGIN RSA PRIVATE KEY', expected: 'local_only' },
	{ text: 'crowdsec detected an attack', expected: 'local_only' }
];

return view.extend({
	title: 'Data Classifier',

	render: function() {
		var container = E('div', { 'class': 'classify-container' });

		container.appendChild(E('style', {}, kissCSS));

		container.appendChild(E('h2', {}, 'Data Classifier'));
		container.appendChild(E('p', { 'class': 'subtitle' },
			'Test the classification engine to see how data is categorized into sovereignty tiers.'));

		// Input form
		var form = E('div', { 'class': 'classify-form' });
		var textarea = E('textarea', {
			'id': 'classify-input',
			'placeholder': 'Enter text to classify...\n\nExamples:\n- "Server IP is 192.168.1.100" → LOCAL_ONLY\n- "What is 2+2?" → CLOUD_DIRECT'
		});
		form.appendChild(textarea);

		form.appendChild(E('div', { 'class': 'btn-row' }, [
			E('button', {
				'class': 'btn btn-primary',
				'click': this.handleClassify.bind(this)
			}, 'Classify'),
			E('button', {
				'class': 'btn btn-secondary',
				'click': this.handleClear.bind(this)
			}, 'Clear')
		]));

		container.appendChild(form);

		// Result placeholder
		container.appendChild(E('div', { 'id': 'classify-result' }));

		// Tier explanation
		container.appendChild(E('div', { 'class': 'tier-explanation' }, [
			E('h4', {}, 'Classification Tiers'),
			E('ul', {}, [
				E('li', {}, [
					E('strong', {}, 'LOCAL_ONLY: '),
					'Contains sensitive data (IPs, MACs, credentials, logs, keys). Never sent externally.'
				]),
				E('li', {}, [
					E('strong', {}, 'SANITIZED: '),
					'Contains PII that can be scrubbed. Sent to EU cloud (Mistral) with opt-in.'
				]),
				E('li', {}, [
					E('strong', {}, 'CLOUD_DIRECT: '),
					'Generic queries with no sensitive data. Can be sent to any provider with opt-in.'
				])
			])
		]));

		// Examples section
		var examplesSection = E('div', { 'class': 'examples-section' });
		examplesSection.appendChild(E('h3', {}, 'Example Inputs'));

		var exampleList = E('div', { 'class': 'example-list' });
		examples.forEach(function(ex) {
			var badgeClass = 'badge-' + ex.expected;
			exampleList.appendChild(E('div', {
				'class': 'example-item',
				'click': this.handleExampleClick.bind(this, ex.text)
			}, [
				E('span', { 'class': 'example-text' }, ex.text),
				E('span', { 'class': 'example-badge ' + badgeClass }, ex.expected.toUpperCase())
			]));
		}.bind(this));

		examplesSection.appendChild(exampleList);
		container.appendChild(examplesSection);

		return container;
	},

	handleClassify: function() {
		var textarea = document.getElementById('classify-input');
		var text = textarea ? textarea.value.trim() : '';

		if (!text) {
			this.showResult({ error: 'Please enter some text to classify' });
			return;
		}

		var resultDiv = document.getElementById('classify-result');
		resultDiv.innerHTML = '<div class="result-card"><p>Classifying...</p></div>';

		callClassify(text).then(function(result) {
			this.showResult(result);
		}.bind(this)).catch(function(err) {
			this.showResult({ error: 'Classification error: ' + String(err) });
		}.bind(this));
	},

	handleClear: function() {
		var textarea = document.getElementById('classify-input');
		if (textarea) textarea.value = '';
		var resultDiv = document.getElementById('classify-result');
		if (resultDiv) resultDiv.innerHTML = '';
	},

	handleExampleClick: function(text) {
		var textarea = document.getElementById('classify-input');
		if (textarea) {
			textarea.value = text;
			this.handleClassify();
		}
	},

	showResult: function(result) {
		var resultDiv = document.getElementById('classify-result');
		if (!resultDiv) return;

		if (result.error) {
			resultDiv.innerHTML = '';
			resultDiv.appendChild(E('div', { 'class': 'result-card' }, [
				E('p', { 'style': 'color: #dc2626;' }, result.error)
			]));
			return;
		}

		var classification = result.classification || result.result?.classification || 'unknown';
		var reason = result.reason || result.result?.reason || 'No reason provided';
		var pattern = result.matched_pattern || result.result?.matched_pattern || '-';

		resultDiv.innerHTML = '';

		var card = E('div', { 'class': 'result-card' });
		card.appendChild(E('h3', {}, 'Classification Result'));

		card.appendChild(E('div', { 'style': 'margin-bottom: 16px;' }, [
			E('span', { 'class': 'classification-badge badge-' + classification },
				classification.toUpperCase())
		]));

		var details = E('div', { 'class': 'result-details' });

		details.appendChild(E('div', { 'class': 'detail-row' }, [
			E('span', { 'class': 'detail-label' }, 'Classification'),
			E('span', { 'class': 'detail-value' }, classification.toUpperCase())
		]));

		details.appendChild(E('div', { 'class': 'detail-row' }, [
			E('span', { 'class': 'detail-label' }, 'Reason'),
			E('span', { 'class': 'detail-value' }, reason)
		]));

		if (pattern !== '-') {
			details.appendChild(E('div', { 'class': 'detail-row' }, [
				E('span', { 'class': 'detail-label' }, 'Matched Pattern'),
				E('span', { 'class': 'detail-value' }, pattern)
			]));
		}

		// Destination explanation
		var destination = 'Unknown';
		if (classification === 'local_only') {
			destination = 'LocalAI only (data never leaves device)';
		} else if (classification === 'sanitized') {
			destination = 'Mistral EU (after PII scrubbing, if enabled)';
		} else if (classification === 'cloud_direct') {
			destination = 'Any enabled provider (no sensitive data detected)';
		}

		details.appendChild(E('div', { 'class': 'detail-row' }, [
			E('span', { 'class': 'detail-label' }, 'Destination'),
			E('span', { 'class': 'detail-value' }, destination)
		]));

		card.appendChild(details);
		resultDiv.appendChild(card);
	}
});
