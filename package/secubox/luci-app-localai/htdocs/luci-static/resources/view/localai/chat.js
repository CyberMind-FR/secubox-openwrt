'use strict';
'require view';
'require ui';
'require rpc';

var callModels = rpc.declare({
	object: 'luci.localai',
	method: 'models',
	expect: { models: [] }
});

var callChat = rpc.declare({
	object: 'luci.localai',
	method: 'chat',
	params: ['model', 'messages'],
	expect: { response: '' }
});

return view.extend({
	title: _('LocalAI Chat'),
	messages: [],
	selectedModel: null,

	load: function() {
		return callModels();
	},

	render: function(data) {
		var self = this;
		// RPC with expect returns array directly
		var models = Array.isArray(data) ? data : (data && data.models ? data.models : []);

		var container = E('div', { 'class': 'localai-chat' }, [
			E('style', {}, this.getCSS()),

			// Header
			E('div', { 'class': 'chat-header' }, [
				E('div', { 'class': 'chat-title' }, [
					E('span', { 'class': 'chat-icon' }, '💬'),
					_('LocalAI Chat')
				]),
				E('div', { 'class': 'chat-model-select' }, [
					E('label', {}, _('Model:')),
					E('select', {
						'id': 'model-select',
						'change': function(e) { self.selectedModel = e.target.value; }
					}, models.length > 0 ?
						models.map(function(m) {
							var modelId = m.id || m.name;
							var displayName = m.loaded ? modelId + ' ✓' : modelId;
							return E('option', { 'value': modelId }, displayName);
						}) :
						[E('option', { 'value': '' }, _('No models available'))]
					)
				])
			]),

			// Chat Messages
			E('div', { 'class': 'chat-messages', 'id': 'chat-messages' }, [
				E('div', { 'class': 'chat-welcome' }, [
					E('div', { 'class': 'welcome-icon' }, '🤖'),
					E('div', { 'class': 'welcome-title' }, _('Welcome to LocalAI Chat')),
					E('div', { 'class': 'welcome-text' }, _('Start a conversation with your local AI model.'))
				])
			]),

			// Input Area
			E('div', { 'class': 'chat-input-area' }, [
				E('textarea', {
					'id': 'chat-input',
					'class': 'chat-input',
					'placeholder': _('Type your message...'),
					'rows': 2,
					'keydown': function(e) {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							self.sendMessage();
						}
					}
				}),
				E('button', {
					'class': 'chat-send-btn',
					'click': function() { self.sendMessage(); }
				}, [E('span', {}, '➤'), _('Send')])
			])
		]);

		// Set initial model
		if (models.length > 0) {
			var loadedModel = models.find(function(m) { return m.loaded; });
			this.selectedModel = loadedModel ? (loadedModel.id || loadedModel.name) : (models[0].id || models[0].name);
		}

		return container;
	},

	sendMessage: function() {
		var self = this;
		var input = document.getElementById('chat-input');
		var messagesContainer = document.getElementById('chat-messages');
		var message = input.value.trim();

		if (!message) return;

		if (!this.selectedModel) {
			ui.addNotification(null, E('p', _('Please select a model first')), 'error');
			return;
		}

		// Clear welcome if present
		var welcome = messagesContainer.querySelector('.chat-welcome');
		if (welcome) welcome.remove();

		// Add user message
		messagesContainer.appendChild(E('div', { 'class': 'chat-message user' }, [
			E('div', { 'class': 'message-avatar' }, '👤'),
			E('div', { 'class': 'message-content' }, [
				E('div', { 'class': 'message-text' }, message)
			])
		]));

		// Add loading indicator
		var loadingMsg = E('div', { 'class': 'chat-message assistant loading', 'id': 'loading-msg' }, [
			E('div', { 'class': 'message-avatar' }, '🤖'),
			E('div', { 'class': 'message-content' }, [
				E('div', { 'class': 'message-loading' }, [
					E('span', {}), E('span', {}), E('span', {})
				])
			])
		]);
		messagesContainer.appendChild(loadingMsg);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;

		// Clear input
		input.value = '';

		// Build messages array
		this.messages.push({ role: 'user', content: message });

		// Send to API
		callChat(this.selectedModel, JSON.stringify(this.messages))
			.then(function(result) {
				var loading = document.getElementById('loading-msg');
				if (loading) loading.remove();

				var response = result.response || result.error || _('No response');
				self.messages.push({ role: 'assistant', content: response });

				messagesContainer.appendChild(E('div', { 'class': 'chat-message assistant' }, [
					E('div', { 'class': 'message-avatar' }, '🤖'),
					E('div', { 'class': 'message-content' }, [
						E('div', { 'class': 'message-text' }, response)
					])
				]));
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			})
			.catch(function(err) {
				var loading = document.getElementById('loading-msg');
				if (loading) loading.remove();

				messagesContainer.appendChild(E('div', { 'class': 'chat-message assistant error' }, [
					E('div', { 'class': 'message-avatar' }, '⚠️'),
					E('div', { 'class': 'message-content' }, [
						E('div', { 'class': 'message-text' }, _('Error: ') + err.message)
					])
				]));
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			});
	},

	getCSS: function() {
		return `
			.localai-chat {
				font-family: 'Inter', -apple-system, sans-serif;
				background: #030712;
				color: #f8fafc;
				min-height: calc(100vh - 100px);
				display: flex;
				flex-direction: column;
				padding: 16px;
			}
			.chat-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16px 20px;
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				margin-bottom: 16px;
			}
			.chat-title {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 18px;
				font-weight: 600;
			}
			.chat-icon { font-size: 24px; }
			.chat-model-select {
				display: flex;
				align-items: center;
				gap: 10px;
			}
			.chat-model-select select {
				padding: 8px 12px;
				background: #1e293b;
				border: 1px solid #334155;
				border-radius: 8px;
				color: #f8fafc;
				font-size: 13px;
			}
			.chat-messages {
				flex: 1;
				overflow-y: auto;
				padding: 20px;
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				margin-bottom: 16px;
				display: flex;
				flex-direction: column;
				gap: 16px;
				min-height: 400px;
			}
			.chat-welcome {
				text-align: center;
				padding: 60px 20px;
				color: #64748b;
			}
			.welcome-icon { font-size: 64px; margin-bottom: 20px; }
			.welcome-title { font-size: 20px; font-weight: 600; margin-bottom: 10px; color: #94a3b8; }
			.welcome-text { font-size: 14px; }
			.chat-message {
				display: flex;
				gap: 12px;
				max-width: 80%;
			}
			.chat-message.user {
				align-self: flex-end;
				flex-direction: row-reverse;
			}
			.message-avatar {
				width: 36px;
				height: 36px;
				border-radius: 10px;
				background: #1e293b;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18px;
				flex-shrink: 0;
			}
			.chat-message.user .message-avatar {
				background: linear-gradient(135deg, #06b6d4, #0ea5e9);
			}
			.chat-message.assistant .message-avatar {
				background: linear-gradient(135deg, #a855f7, #6366f1);
			}
			.message-content {
				padding: 12px 16px;
				border-radius: 12px;
				background: #1e293b;
			}
			.chat-message.user .message-content {
				background: linear-gradient(135deg, #06b6d4, #0ea5e9);
			}
			.chat-message.error .message-content {
				background: rgba(239, 68, 68, 0.2);
				border: 1px solid rgba(239, 68, 68, 0.3);
			}
			.message-text {
				font-size: 14px;
				line-height: 1.5;
				white-space: pre-wrap;
			}
			.message-loading {
				display: flex;
				gap: 4px;
			}
			.message-loading span {
				width: 8px;
				height: 8px;
				background: #a855f7;
				border-radius: 50%;
				animation: bounce 1.4s infinite ease-in-out;
			}
			.message-loading span:nth-child(1) { animation-delay: -0.32s; }
			.message-loading span:nth-child(2) { animation-delay: -0.16s; }
			@keyframes bounce {
				0%, 80%, 100% { transform: scale(0); }
				40% { transform: scale(1); }
			}
			.chat-input-area {
				display: flex;
				gap: 12px;
				padding: 16px;
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
			}
			.chat-input {
				flex: 1;
				padding: 12px 16px;
				background: #1e293b;
				border: 1px solid #334155;
				border-radius: 10px;
				color: #f8fafc;
				font-size: 14px;
				resize: none;
				font-family: inherit;
			}
			.chat-input:focus {
				outline: none;
				border-color: #a855f7;
			}
			.chat-send-btn {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 12px 24px;
				background: linear-gradient(135deg, #a855f7, #6366f1);
				border: none;
				border-radius: 10px;
				color: white;
				font-size: 14px;
				font-weight: 600;
				cursor: pointer;
			}
			.chat-send-btn:hover {
				box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
			}
		`;
	}
});
