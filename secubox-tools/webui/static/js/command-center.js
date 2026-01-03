/**
 * SecuBox Cyberpunk Command Center
 * Real-time security monitoring and command execution
 */

// Alpine.js Component for Command Center
function commandCenter() {
  return {
    // State
    tab: 'metrics',
    ws: null,
    reconnectDelay: 1000,
    cpuHistory: [],
    cpuChart: null,
    matrixInterval: null,

    // Data stores
    metrics: {
      cpu: { usage: 0, cores: [0, 0, 0, 0] },
      memory: { used: 0, total: 4096, percent: 0 },
      network: { rx_rate: 0, tx_rate: 0, rx_bytes: 0, tx_bytes: 0 }
    },
    threats: {
      recent_events: [],
      counters: { blocked: 0, allowed: 0, quarantined: 0 }
    },
    traffic: {
      protocols: {},
      top_domains: []
    },
    commandOutput: [],

    // ============================================================
    // Initialization
    // ============================================================

    init() {
      console.log('[CYBER] Command Center initializing...');
      this.connectWebSocket();
      this.initCharts();
      this.initMatrixRain();
      this.bindKeyboard();
      console.log('[CYBER] Command Center ready');
    },

    // ============================================================
    // WebSocket Connection Management
    // ============================================================

    connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/command-center`;

      console.log('[CYBER] Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[CYBER] WebSocket connected');
        // Subscribe to all data streams
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          streams: ['metrics', 'threats', 'traffic', 'commands']
        }));
        this.reconnectDelay = 1000; // Reset reconnection delay
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (error) {
          console.error('[CYBER] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[CYBER] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log(`[CYBER] Disconnected. Reconnecting in ${this.reconnectDelay}ms...`);
        setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
          this.connectWebSocket();
        }, this.reconnectDelay);
      };
    },

    // ============================================================
    // Message Routing
    // ============================================================

    handleMessage(msg) {
      switch (msg.type) {
        case 'metrics':
          this.metrics = msg.data;
          this.updateCPUChart(msg.data.cpu.usage);
          break;

        case 'threats':
          this.threats = msg.data;
          break;

        case 'traffic':
          this.traffic = msg.data;
          break;

        case 'command_output':
          this.commandOutput.push({
            id: Date.now() + Math.random(),
            text: msg.data.output
          });
          // Limit terminal scrollback to 1000 lines
          if (this.commandOutput.length > 1000) {
            this.commandOutput = this.commandOutput.slice(-1000);
          }
          this.$nextTick(() => this.scrollTerminal());
          break;

        case 'error':
          console.error('[CYBER] Server error:', msg.message);
          this.commandOutput.push({
            id: Date.now(),
            text: `ERROR: ${msg.message}\n`
          });
          this.$nextTick(() => this.scrollTerminal());
          break;

        default:
          console.warn('[CYBER] Unknown message type:', msg.type);
      }
    },

    // ============================================================
    // Chart Rendering (Canvas-based for performance)
    // ============================================================

    initCharts() {
      this.cpuHistory = Array(60).fill(0);
      this.cpuChart = document.getElementById('cpu-chart');
    },

    updateCPUChart(usage) {
      // Update history
      this.cpuHistory.push(usage);
      this.cpuHistory = this.cpuHistory.slice(-60);

      const canvas = this.cpuChart;
      if (!canvas || !canvas.getContext) return;

      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width = canvas.offsetWidth * dpr;
      const height = canvas.height = 60 * dpr;

      ctx.scale(dpr, dpr);
      const displayWidth = canvas.offsetWidth;
      const displayHeight = 60;

      // Clear canvas
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (displayHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }

      // Draw CPU line
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();

      this.cpuHistory.forEach((val, i) => {
        const x = (i / (this.cpuHistory.length - 1)) * displayWidth;
        const y = displayHeight - (val / 100) * displayHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw gradient fill
      ctx.lineTo(displayWidth, displayHeight);
      ctx.lineTo(0, displayHeight);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
    },

    // ============================================================
    // Matrix Rain Effect
    // ============================================================

    initMatrixRain() {
      const canvas = document.getElementById('matrix-bg');
      if (!canvas || !canvas.getContext) return;

      const ctx = canvas.getContext('2d');
      canvas.width = 420;
      canvas.height = window.innerHeight;

      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ'.split('');
      const fontSize = 12;
      const columns = canvas.width / fontSize;
      const drops = Array(Math.floor(columns)).fill(1);

      const draw = () => {
        // Semi-transparent black to create trail effect
        ctx.fillStyle = 'rgba(10, 14, 39, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cyan text with glow
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSize}px monospace`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffff';

        drops.forEach((y, i) => {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          ctx.fillText(text, x, y * fontSize);

          // Randomly reset drop to top
          if (y * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        });
      };

      // Run at 30fps for smooth animation
      this.matrixInterval = setInterval(draw, 33);

      // Resize handler
      window.addEventListener('resize', () => {
        canvas.height = window.innerHeight;
      });
    },

    // ============================================================
    // Keyboard Shortcuts
    // ============================================================

    bindKeyboard() {
      document.addEventListener('keydown', (e) => {
        // Ctrl+` to toggle command center
        if (e.ctrlKey && e.key === '`') {
          e.preventDefault();
          this.$store.commandCenter.toggle();
        }

        // Escape to close
        if (e.key === 'Escape' && this.$store.commandCenter.isOpen) {
          this.$store.commandCenter.close();
        }

        // Tab navigation (Ctrl+1/2/3/4)
        if (e.ctrlKey && this.$store.commandCenter.isOpen) {
          switch(e.key) {
            case '1':
              this.tab = 'metrics';
              e.preventDefault();
              break;
            case '2':
              this.tab = 'threats';
              e.preventDefault();
              break;
            case '3':
              this.tab = 'traffic';
              e.preventDefault();
              break;
            case '4':
              this.tab = 'commands';
              this.$nextTick(() => {
                if (this.$refs.terminalInput) {
                  this.$refs.terminalInput.focus();
                }
              });
              e.preventDefault();
              break;
          }
        }
      });
    },

    // ============================================================
    // Command Execution
    // ============================================================

    executeCommand(cmd) {
      if (!cmd || !cmd.trim()) return;

      const command = cmd.trim();

      // Echo command to terminal
      this.commandOutput.push({
        id: Date.now(),
        text: `root@secubox:~# ${command}\n`
      });

      // Send to WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'execute',
          command: command
        }));
      } else {
        this.commandOutput.push({
          id: Date.now() + 1,
          text: 'ERROR: WebSocket not connected\n'
        });
      }

      this.$nextTick(() => this.scrollTerminal());
    },

    // ============================================================
    // Utility Functions
    // ============================================================

    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B/s';

      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(1)} ${units[unitIndex]}/s`;
    },

    scrollTerminal() {
      const terminal = document.getElementById('terminal-scrollback');
      if (terminal) {
        terminal.scrollTop = terminal.scrollHeight;
      }
    },

    // ============================================================
    // Cleanup
    // ============================================================

    destroy() {
      if (this.ws) {
        this.ws.close();
      }
      if (this.matrixInterval) {
        clearInterval(this.matrixInterval);
      }
    }
  };
}

// ============================================================
// Alpine.js Store for Global State
// ============================================================

document.addEventListener('alpine:init', () => {
  Alpine.store('commandCenter', {
    isOpen: localStorage.getItem('cyber_cc_open') === 'true',

    toggle() {
      this.isOpen = !this.isOpen;
      localStorage.setItem('cyber_cc_open', this.isOpen);
      console.log('[CYBER] Command Center', this.isOpen ? 'opened' : 'closed');
    },

    open() {
      this.isOpen = true;
      localStorage.setItem('cyber_cc_open', true);
      console.log('[CYBER] Command Center opened');
    },

    close() {
      this.isOpen = false;
      localStorage.setItem('cyber_cc_open', false);
      console.log('[CYBER] Command Center closed');
    }
  });
});

// Log initialization
console.log('[CYBER] Command Center module loaded');
