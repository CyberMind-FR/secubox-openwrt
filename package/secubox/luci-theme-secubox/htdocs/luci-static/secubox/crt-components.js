/**
 * SecuBox CRT P31 Reusable UI Components
 * CyberMind — SecuBox — 2026
 *
 * Provides CRT-styled UI components for SecuBox dashboards
 */

(function() {
    'use strict';

    var CRTComponents = {

        /**
         * Create a status widget with glowing value
         */
        createWidget: function(options) {
            var defaults = {
                title: 'Widget',
                value: '0',
                unit: '',
                status: 'normal', // normal, warning, danger
                icon: null
            };

            var opts = Object.assign({}, defaults, options);
            var statusClass = opts.status === 'warning' ? 'warning' :
                              opts.status === 'danger' ? 'danger' : '';

            var widget = document.createElement('div');
            widget.className = 'crt-widget';
            widget.innerHTML = [
                '<div class="crt-widget-header">' + this.escapeHtml(opts.title) + '</div>',
                '<div class="crt-widget-value ' + statusClass + '">' +
                    this.escapeHtml(opts.value) +
                    (opts.unit ? '<span class="unit">' + this.escapeHtml(opts.unit) + '</span>' : '') +
                '</div>'
            ].join('');

            return widget;
        },

        /**
         * Create a status badge
         */
        createBadge: function(text, type) {
            type = type || 'info';
            var badge = document.createElement('span');
            badge.className = 'crt-badge crt-badge-' + type;
            badge.textContent = text;
            return badge;
        },

        /**
         * Create a status dot indicator
         */
        createStatusDot: function(status) {
            var dot = document.createElement('span');
            dot.className = 'crt-status-dot ' + (status || 'offline');
            return dot;
        },

        /**
         * Create a progress bar
         */
        createProgressBar: function(value, max, label) {
            max = max || 100;
            var percent = Math.min(100, Math.max(0, (value / max) * 100));

            var container = document.createElement('div');
            container.className = 'crt-progress';

            var bar = document.createElement('div');
            bar.className = 'crt-progress-bar';
            bar.style.width = percent + '%';

            if (label) {
                var labelEl = document.createElement('span');
                labelEl.className = 'crt-progress-label';
                labelEl.textContent = label;
                container.appendChild(labelEl);
            }

            container.appendChild(bar);
            return container;
        },

        /**
         * Create a terminal-style log viewer
         */
        createLogViewer: function(lines, maxLines) {
            maxLines = maxLines || 20;
            lines = lines || [];

            var container = document.createElement('div');
            container.className = 'crt-log-viewer';

            var displayLines = lines.slice(-maxLines);
            displayLines.forEach(function(line) {
                var lineEl = document.createElement('div');
                lineEl.className = 'crt-log-line';
                lineEl.textContent = line;
                container.appendChild(lineEl);
            });

            // Auto-scroll to bottom
            container.scrollTop = container.scrollHeight;

            return container;
        },

        /**
         * Create a topology node for SVG visualization
         */
        createTopologyNode: function(svg, x, y, label, status, nodeType) {
            var ns = 'http://www.w3.org/2000/svg';
            var group = document.createElementNS(ns, 'g');
            group.setAttribute('class', 'topology-node ' + (status || '') + ' ' + (nodeType || ''));
            group.setAttribute('transform', 'translate(' + x + ',' + y + ')');

            var circle = document.createElementNS(ns, 'circle');
            circle.setAttribute('r', '20');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');

            var text = document.createElementNS(ns, 'text');
            text.setAttribute('y', '35');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'topology-label');
            text.textContent = label || '';

            group.appendChild(circle);
            group.appendChild(text);

            return group;
        },

        /**
         * Create a topology edge for SVG visualization
         */
        createTopologyEdge: function(svg, x1, y1, x2, y2, active) {
            var ns = 'http://www.w3.org/2000/svg';
            var line = document.createElementNS(ns, 'line');
            line.setAttribute('class', 'topology-edge ' + (active ? 'active' : ''));
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            return line;
        },

        /**
         * Create an alert/notification box
         */
        createAlert: function(message, type) {
            type = type || 'info';
            var alert = document.createElement('div');
            alert.className = 'crt-alert crt-alert-' + type;
            alert.textContent = message;

            var close = document.createElement('button');
            close.className = 'crt-alert-close';
            close.innerHTML = '&times;';
            close.onclick = function() {
                alert.remove();
            };

            alert.appendChild(close);
            return alert;
        },

        /**
         * Show a toast notification
         */
        toast: function(message, type, duration) {
            type = type || 'info';
            duration = duration || 3000;

            var toast = document.createElement('div');
            toast.className = 'crt-toast crt-toast-' + type;
            toast.textContent = message;

            // Position in top-right
            toast.style.cssText = [
                'position: fixed',
                'top: 1rem',
                'right: 1rem',
                'padding: 0.75rem 1.5rem',
                'background: #080d05',
                'border: 1px solid',
                'border-radius: 4px',
                'z-index: 10001',
                'animation: toastIn 0.3s ease'
            ].join(';');

            if (type === 'success') {
                toast.style.borderColor = '#22cc44';
                toast.style.color = '#33ff66';
            } else if (type === 'error') {
                toast.style.borderColor = '#ff4466';
                toast.style.color = '#ff6688';
            } else if (type === 'warning') {
                toast.style.borderColor = '#cc7722';
                toast.style.color = '#ffb347';
            } else {
                toast.style.borderColor = '#0f8822';
                toast.style.color = '#22cc44';
            }

            document.body.appendChild(toast);

            setTimeout(function() {
                toast.style.animation = 'toastOut 0.3s ease';
                setTimeout(function() {
                    toast.remove();
                }, 300);
            }, duration);
        },

        /**
         * Create a data table with CRT styling
         */
        createTable: function(headers, rows) {
            var table = document.createElement('table');
            table.className = 'crt-table';

            // Header
            var thead = document.createElement('thead');
            var headerRow = document.createElement('tr');
            headers.forEach(function(header) {
                var th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Body
            var tbody = document.createElement('tbody');
            rows.forEach(function(row) {
                var tr = document.createElement('tr');
                row.forEach(function(cell) {
                    var td = document.createElement('td');
                    if (typeof cell === 'object' && cell.html) {
                        td.innerHTML = cell.html;
                    } else {
                        td.textContent = cell;
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            return table;
        },

        /**
         * Escape HTML entities
         */
        escapeHtml: function(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Add component styles
    var styles = document.createElement('style');
    styles.textContent = [
        '.crt-widget {',
        '  background: #080d05;',
        '  border: 1px solid #052210;',
        '  border-radius: 4px;',
        '  padding: 1rem;',
        '  text-align: center;',
        '}',
        '.crt-widget-header {',
        '  color: #0f8822;',
        '  font-size: 0.75rem;',
        '  text-transform: uppercase;',
        '  letter-spacing: 1px;',
        '  margin-bottom: 0.5rem;',
        '}',
        '.crt-widget-value {',
        '  color: #33ff66;',
        '  font-size: 2rem;',
        '  font-weight: bold;',
        '  text-shadow: 0 0 6px #33ff66;',
        '}',
        '.crt-widget-value.warning {',
        '  color: #ffb347;',
        '  text-shadow: 0 0 6px #ffb347;',
        '}',
        '.crt-widget-value.danger {',
        '  color: #ff6688;',
        '  text-shadow: 0 0 6px #ff4466;',
        '}',
        '.crt-widget-value .unit {',
        '  font-size: 0.9rem;',
        '  margin-left: 0.25rem;',
        '}',
        '',
        '.crt-badge {',
        '  display: inline-block;',
        '  padding: 0.15rem 0.5rem;',
        '  font-size: 0.7rem;',
        '  text-transform: uppercase;',
        '  letter-spacing: 1px;',
        '  border-radius: 2px;',
        '  border: 1px solid;',
        '}',
        '.crt-badge-success { border-color: #22cc44; color: #33ff66; background: rgba(51,255,102,0.1); }',
        '.crt-badge-warning { border-color: #cc7722; color: #ffb347; background: rgba(255,179,71,0.1); }',
        '.crt-badge-danger { border-color: #ff4466; color: #ff6688; background: rgba(255,68,102,0.1); }',
        '.crt-badge-info { border-color: #0f8822; color: #22cc44; background: rgba(51,255,102,0.05); }',
        '',
        '.crt-status-dot {',
        '  display: inline-block;',
        '  width: 8px;',
        '  height: 8px;',
        '  border-radius: 50%;',
        '  margin-right: 0.5rem;',
        '}',
        '.crt-status-dot.online { background: #33ff66; box-shadow: 0 0 6px #33ff66; }',
        '.crt-status-dot.offline { background: #ff4466; box-shadow: 0 0 6px #ff4466; }',
        '.crt-status-dot.warning { background: #ffb347; box-shadow: 0 0 6px #ffb347; }',
        '',
        '.crt-progress {',
        '  background: #050803;',
        '  border: 1px solid #052210;',
        '  border-radius: 2px;',
        '  height: 20px;',
        '  position: relative;',
        '  overflow: hidden;',
        '}',
        '.crt-progress-bar {',
        '  background: linear-gradient(90deg, #0f8822, #22cc44);',
        '  height: 100%;',
        '  box-shadow: 0 0 10px #22cc44;',
        '  transition: width 0.3s ease;',
        '}',
        '.crt-progress-label {',
        '  position: absolute;',
        '  top: 50%;',
        '  left: 50%;',
        '  transform: translate(-50%, -50%);',
        '  font-size: 0.7rem;',
        '  color: #22cc44;',
        '}',
        '',
        '.crt-log-viewer {',
        '  background: #050803;',
        '  border: 1px solid #052210;',
        '  border-radius: 4px;',
        '  padding: 0.5rem;',
        '  font-size: 0.8rem;',
        '  max-height: 300px;',
        '  overflow-y: auto;',
        '}',
        '.crt-log-line {',
        '  color: #22cc44;',
        '  padding: 0.1rem 0;',
        '  border-bottom: 1px solid #052210;',
        '}',
        '.crt-log-line:last-child { border-bottom: none; }',
        '',
        '.crt-alert {',
        '  padding: 1rem;',
        '  border-radius: 4px;',
        '  margin-bottom: 1rem;',
        '  border: 1px solid;',
        '  position: relative;',
        '}',
        '.crt-alert-success { background: rgba(51,255,102,0.1); border-color: #0f8822; color: #22cc44; }',
        '.crt-alert-warning { background: rgba(255,179,71,0.1); border-color: #cc7722; color: #ffb347; }',
        '.crt-alert-error { background: rgba(255,68,102,0.1); border-color: #ff4466; color: #ff6688; }',
        '.crt-alert-info { background: rgba(51,255,102,0.05); border-color: #052210; color: #22cc44; }',
        '.crt-alert-close {',
        '  position: absolute;',
        '  top: 0.5rem;',
        '  right: 0.5rem;',
        '  background: none;',
        '  border: none;',
        '  color: inherit;',
        '  cursor: pointer;',
        '  font-size: 1.2rem;',
        '  opacity: 0.6;',
        '}',
        '.crt-alert-close:hover { opacity: 1; }',
        '',
        '.crt-table {',
        '  width: 100%;',
        '  border-collapse: collapse;',
        '  font-size: 0.85rem;',
        '}',
        '.crt-table th {',
        '  color: #0f8822;',
        '  font-weight: normal;',
        '  text-transform: uppercase;',
        '  font-size: 0.75rem;',
        '  letter-spacing: 1px;',
        '  padding: 0.75rem;',
        '  text-align: left;',
        '  border-bottom: 1px solid #052210;',
        '  background: #050803;',
        '}',
        '.crt-table td {',
        '  padding: 0.75rem;',
        '  border-bottom: 1px solid #052210;',
        '  color: #22cc44;',
        '}',
        '.crt-table tr:hover td { background: rgba(51,255,102,0.03); }',
        '',
        '.topology-label {',
        '  fill: #22cc44;',
        '  font-size: 0.75rem;',
        '}',
        '',
        '@keyframes toastIn {',
        '  from { opacity: 0; transform: translateX(100%); }',
        '  to { opacity: 1; transform: translateX(0); }',
        '}',
        '@keyframes toastOut {',
        '  from { opacity: 1; transform: translateX(0); }',
        '  to { opacity: 0; transform: translateX(100%); }',
        '}'
    ].join('\n');
    document.head.appendChild(styles);

    // Export to global scope
    window.CRTComponents = CRTComponents;

})();
