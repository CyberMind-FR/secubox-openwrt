'use strict';
'require view';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callModels = rpc.declare({
	object: 'luci.ollama',
	method: 'models',
	expect: { models: [] }
});

var callChat = rpc.declare({
	object: 'luci.ollama',
	method: 'chat',
	params: ['model', 'message'],
	expect: { response: '' }
});

var callStatus = rpc.declare({
	object: 'luci.ollama',
	method: 'status',
	expect: { running: false }
});

return view.extend({
	title: _('Ollama Chat'),
	chatHistory: [],
	selectedModel: null,

	load: function() {
		return Promise.all([
			callModels(),
			callStatus()
		]).then(function(results) {
			return {
				models: Array.isArray(results[0]) ? results[0] : [],
				status: results[1] || {}
			};
		});
	},

	render: function(data) {
		var self = this;
		var models = data.models;
		var status = data.status;

		if (!status.running) {
			return E('div', { 'class': 'ollama-chat' }, [
				E('style', {}, this.getCSS()),
				E('div', { 'class': 'oll-chat-offline' }, [
					E('span', { 'class': 'oll-offline-icon' }, '⚠️'),
					E('h3', {}, _('Ollama is not running')),
					E('p', {}, _('Start the service to use chat')),
					E('code', {}, '/etc/init.d/ollama start')
				])
			]);
		}

		if (models.length === 0) {
			return E('div', { 'class': 'ollama-chat' }, [
				E('style', {}, this.getCSS()),
				E('div', { 'class': 'oll-chat-offline' }, [
					E('span', { 'class': 'oll-offline-icon' }, '📦'),
					E('h3', {}, _('No models available')),
					E('p', {}, _('Download a model first')),
					E('code', {}, 'ollamactl pull tinyllama')
				])
			]);
		}

		this.selectedModel = models[0].name;

		var container = E('div', { 'class': 'ollama-chat' }, [
			E('style', {}, this.getCSS()),

			// Header
			E('div', { 'class': 'oll-chat-header' }, [
				E('div', { 'class': 'oll-chat-title' }, [
					E('span', { 'class': 'oll-chat-icon' }, '🦙'),
					E('span', {}, _('Ollama Chat'))
				]),
				E('div', { 'class': 'oll-model-select-wrapper' }, [
					E('label', {}, _('Model:')),
					E('select', {
						'class': 'oll-model-select',
						'id': 'model-select',
						'change': function(ev) { self.selectedModel = ev.target.value; }
					}, models.map(function(m) {
						return E('option', { 'value': m.name }, m.name);
					}))
				])
			]),

			// Chat Messages
			E('div', { 'class': 'oll-chat-messages', 'id': 'chat-messages' }, [
				E('div', { 'class': 'oll-chat-welcome' }, [
					E('span', { 'class': 'oll-welcome-icon' }, '👋'),
					E('h3', {}, _('Welcome to Ollama Chat')),
					E('p', {}, _('Select a model and start chatting. Your conversation is processed locally.'))
				])
			]),

			// Input Area
			E('div', { 'class': 'oll-chat-input-area' }, [
				E('textarea', {
					'class': 'oll-chat-input',
					'id': 'chat-input',
					'placeholder': _('Type your message...'),
					'rows': 3,
					'keydown': function(ev) {
						if (ev.key === 'Enter' && !ev.shiftKey) {
							ev.preventDefault();
							self.sendMessage();
						}
					}
				}),
				E('button', {
					'class': 'oll-send-btn',
					'id': 'send-btn',
					'click': function() { self.sendMessage(); }
				}, [E('span', {}, '➤'), _('Send')])
			])
		]);

		return KissTheme.wrap([container], 'admin/services/ollama/chat');
	},

	sendMessage: function() {
		var self = this;
		var input = document.getElementById('chat-input');
		var message = input.value.trim();

		if (!message) return;

		var messagesContainer = document.getElementById('chat-messages');
		var sendBtn = document.getElementById('send-btn');

		// Clear welcome message if present
		var welcome = messagesContainer.querySelector('.oll-chat-welcome');
		if (welcome) welcome.remove();

		// Add user message
		this.addMessage('user', message);
		input.value = '';
		sendBtn.disabled = true;

		// Add typing indicator
		var typingId = 'typing-' + Date.now();
		this.addTypingIndicator(typingId);

		// Send to API
		callChat(this.selectedModel, message).then(function(result) {
			self.removeTypingIndicator(typingId);
			sendBtn.disabled = false;

			if (result.error) {
				self.addMessage('error', result.error);
			} else if (result.response) {
				self.addMessage('assistant', result.response);
			} else {
				self.addMessage('error', _('No response received'));
			}

			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}).catch(function(err) {
			self.removeTypingIndicator(typingId);
			sendBtn.disabled = false;
			self.addMessage('error', err.message);
		});
	},

	addMessage: function(role, content) {
		var messagesContainer = document.getElementById('chat-messages');
		var msgClass = 'oll-message oll-message-' + role;

		var icon = role === 'user' ? '👤' : (role === 'error' ? '⚠️' : '🦙');

		var msg = E('div', { 'class': msgClass }, [
			E('div', { 'class': 'oll-message-icon' }, icon),
			E('div', { 'class': 'oll-message-content' }, content)
		]);

		messagesContainer.appendChild(msg);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	},

	addTypingIndicator: function(id) {
		var messagesContainer = document.getElementById('chat-messages');
		var typing = E('div', { 'class': 'oll-message oll-message-assistant oll-typing', 'id': id }, [
			E('div', { 'class': 'oll-message-icon' }, '🦙'),
			E('div', { 'class': 'oll-message-content' }, [
				E('div', { 'class': 'oll-typing-dots' }, [
					E('span', {}), E('span', {}), E('span', {})
				])
			])
		]);
		messagesContainer.appendChild(typing);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	},

	removeTypingIndicator: function(id) {
		var el = document.getElementById(id);
		if (el) el.remove();
	},

	getCSS: function() {
		return `
			.ollama-chat {
				font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
				background: #030712;
				color: #f8fafc;
				height: calc(100vh - 100px);
				display: flex;
				flex-direction: column;
				border-radius: 12px;
				overflow: hidden;
			}
			.oll-chat-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16px 20px;
				background: #0f172a;
				border-bottom: 1px solid #334155;
			}
			.oll-chat-title {
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 18px;
				font-weight: 600;
			}
			.oll-chat-icon { font-size: 24px; }
			.oll-model-select-wrapper {
				display: flex;
				align-items: center;
				gap: 10px;
			}
			.oll-model-select-wrapper label {
				color: #94a3b8;
				font-size: 13px;
			}
			.oll-model-select {
				background: #1e293b;
				border: 1px solid #334155;
				border-radius: 8px;
				padding: 8px 12px;
				color: #f8fafc;
				font-size: 13px;
				cursor: pointer;
			}
			.oll-chat-messages {
				flex: 1;
				overflow-y: auto;
				padding: 20px;
				display: flex;
				flex-direction: column;
				gap: 16px;
			}
			.oll-chat-welcome {
				text-align: center;
				padding: 60px 20px;
				color: #64748b;
			}
			.oll-welcome-icon { font-size: 48px; display: block; margin-bottom: 16px; }
			.oll-chat-welcome h3 { margin: 0 0 8px; color: #f8fafc; }
			.oll-chat-welcome p { margin: 0; }
			.oll-message {
				display: flex;
				gap: 12px;
				max-width: 85%;
			}
			.oll-message-user {
				align-self: flex-end;
				flex-direction: row-reverse;
			}
			.oll-message-assistant {
				align-self: flex-start;
			}
			.oll-message-error {
				align-self: center;
			}
			.oll-message-icon {
				width: 36px;
				height: 36px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18px;
				flex-shrink: 0;
			}
			.oll-message-user .oll-message-icon {
				background: linear-gradient(135deg, #3b82f6, #2563eb);
			}
			.oll-message-assistant .oll-message-icon {
				background: linear-gradient(135deg, #f97316, #ea580c);
			}
			.oll-message-error .oll-message-icon {
				background: linear-gradient(135deg, #ef4444, #dc2626);
			}
			.oll-message-content {
				background: #1e293b;
				padding: 12px 16px;
				border-radius: 12px;
				line-height: 1.5;
				white-space: pre-wrap;
				word-break: break-word;
			}
			.oll-message-user .oll-message-content {
				background: linear-gradient(135deg, #3b82f6, #2563eb);
				border-radius: 12px 12px 4px 12px;
			}
			.oll-message-assistant .oll-message-content {
				border-radius: 12px 12px 12px 4px;
			}
			.oll-message-error .oll-message-content {
				background: rgba(239, 68, 68, 0.15);
				color: #ef4444;
				border: 1px solid rgba(239, 68, 68, 0.3);
			}
			.oll-typing-dots {
				display: flex;
				gap: 4px;
			}
			.oll-typing-dots span {
				width: 8px;
				height: 8px;
				background: #64748b;
				border-radius: 50%;
				animation: typing 1.4s infinite;
			}
			.oll-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
			.oll-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
			@keyframes typing {
				0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
				30% { opacity: 1; transform: scale(1); }
			}
			.oll-chat-input-area {
				padding: 16px 20px;
				background: #0f172a;
				border-top: 1px solid #334155;
				display: flex;
				gap: 12px;
			}
			.oll-chat-input {
				flex: 1;
				background: #1e293b;
				border: 1px solid #334155;
				border-radius: 12px;
				padding: 12px 16px;
				color: #f8fafc;
				font-size: 14px;
				resize: none;
				font-family: inherit;
			}
			.oll-chat-input:focus {
				outline: none;
				border-color: #f97316;
			}
			.oll-send-btn {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 12px 24px;
				background: linear-gradient(135deg, #f97316, #ea580c);
				border: none;
				border-radius: 12px;
				color: white;
				font-weight: 600;
				cursor: pointer;
				transition: opacity 0.2s;
			}
			.oll-send-btn:hover { opacity: 0.9; }
			.oll-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
			.oll-chat-offline {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100%;
				text-align: center;
				color: #64748b;
				padding: 40px;
			}
			.oll-offline-icon { font-size: 48px; margin-bottom: 16px; }
			.oll-chat-offline h3 { margin: 0 0 8px; color: #f8fafc; }
			.oll-chat-offline p { margin: 0 0 16px; }
			.oll-chat-offline code {
				background: #1e293b;
				padding: 8px 16px;
				border-radius: 8px;
				font-size: 13px;
			}
		`;
	}
});
