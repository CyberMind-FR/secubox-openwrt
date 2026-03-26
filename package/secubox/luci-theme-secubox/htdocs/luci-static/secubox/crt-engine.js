/**
 * SecuBox CRT P31 Effects Engine
 * CyberMind — SecuBox — 2026
 *
 * Provides CRT terminal effects for the SecuBox LuCI theme
 */

(function() {
    'use strict';

    var SecuBoxCRT = {
        config: {
            enableScanlines: true,
            enableFlicker: false,  // Disabled by default (can be distracting)
            enableGlow: true,
            enableBootSequence: true,
            bootSequenceOnce: true
        },

        /**
         * Add scanlines overlay to the page
         */
        addScanlines: function() {
            if (!this.config.enableScanlines) return;
            if (document.querySelector('.crt-scanlines')) return;

            var scanlines = document.createElement('div');
            scanlines.className = 'crt-scanlines';
            scanlines.style.cssText = [
                'position: fixed',
                'top: 0',
                'left: 0',
                'width: 100%',
                'height: 100%',
                'pointer-events: none',
                'background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
                'z-index: 9999'
            ].join(';');
            document.body.appendChild(scanlines);
        },

        /**
         * Enable subtle screen flicker effect
         */
        enableFlicker: function() {
            if (!this.config.enableFlicker) return;
            document.body.classList.add('crt-flicker');

            // Add flicker keyframes if not present
            if (!document.querySelector('#crt-flicker-style')) {
                var style = document.createElement('style');
                style.id = 'crt-flicker-style';
                style.textContent = [
                    '@keyframes crtFlicker {',
                    '  0%, 100% { opacity: 1; }',
                    '  92% { opacity: 0.98; }',
                    '  93% { opacity: 1; }',
                    '  94% { opacity: 0.97; }',
                    '}',
                    '.crt-flicker { animation: crtFlicker 0.15s infinite; }'
                ].join('\n');
                document.head.appendChild(style);
            }
        },

        /**
         * Add phosphor glow effect on hover for interactive elements
         */
        addPhosphorGlow: function() {
            if (!this.config.enableGlow) return;

            var glowElements = document.querySelectorAll('button, .cbi-button, a, input[type="submit"]');
            var bloomSoft = '0 0 6px #33ff66, 0 0 14px rgba(51,255,102,0.5)';

            glowElements.forEach(function(el) {
                el.addEventListener('mouseenter', function() {
                    this.style.textShadow = bloomSoft;
                });
                el.addEventListener('mouseleave', function() {
                    this.style.textShadow = '';
                });
            });
        },

        /**
         * Add terminal cursor effect to text inputs
         */
        addTerminalCursor: function() {
            var inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="url"], textarea');
            inputs.forEach(function(input) {
                input.addEventListener('focus', function() {
                    this.style.caretColor = '#33ff66';
                });
            });
        },

        /**
         * Typewriter effect for an element
         */
        typewriterEffect: function(element, speed) {
            speed = speed || 50;
            var text = element.textContent;
            element.textContent = '';
            element.style.visibility = 'visible';

            var i = 0;
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            type();
        },

        /**
         * Boot sequence animation
         */
        bootSequence: function() {
            if (!this.config.enableBootSequence) return;
            if (this.config.bootSequenceOnce && sessionStorage.getItem('crt-booted')) return;

            var bootText = [
                '[ SECUBOX MESH DAEMON ]',
                'Initializing P31 phosphor display...',
                'Loading security modules...',
                'mDNS discovery: ACTIVE',
                'Mesh topology: ONLINE',
                'System ready.'
            ];

            var container = document.createElement('div');
            container.id = 'crt-boot-sequence';
            container.style.cssText = [
                'position: fixed',
                'top: 0',
                'left: 0',
                'width: 100%',
                'height: 100%',
                'background: #050803',
                'z-index: 10000',
                'display: flex',
                'flex-direction: column',
                'justify-content: center',
                'align-items: center',
                'font-family: "Courier Prime", "Courier New", monospace',
                'color: #22cc44'
            ].join(';');

            document.body.appendChild(container);

            var lineIndex = 0;
            function showLine() {
                if (lineIndex < bootText.length) {
                    var line = document.createElement('div');
                    var isHeader = lineIndex === 0;
                    line.style.cssText = [
                        'opacity: 0',
                        'margin: 0.3rem 0',
                        isHeader ? 'font-size: 1.2rem; color: #33ff66; text-shadow: 0 0 6px #33ff66;' : ''
                    ].join(';');
                    line.textContent = bootText[lineIndex];
                    container.appendChild(line);

                    setTimeout(function() {
                        line.style.transition = 'opacity 0.3s';
                        line.style.opacity = '1';
                    }, 50);

                    lineIndex++;
                    setTimeout(showLine, 300);
                } else {
                    setTimeout(function() {
                        container.style.transition = 'opacity 0.5s';
                        container.style.opacity = '0';
                        setTimeout(function() {
                            container.remove();
                        }, 500);
                    }, 800);
                }
            }

            showLine();
            sessionStorage.setItem('crt-booted', 'true');
        },

        /**
         * Apply status dot glow effects
         */
        applyStatusGlow: function() {
            // Find status indicators and add appropriate glow
            var onlineElements = document.querySelectorAll('.online, .running, .status-online');
            var offlineElements = document.querySelectorAll('.offline, .stopped, .status-offline');
            var warningElements = document.querySelectorAll('.warning, .status-warning');

            onlineElements.forEach(function(el) {
                el.style.textShadow = '0 0 6px #33ff66';
            });

            offlineElements.forEach(function(el) {
                el.style.textShadow = '0 0 6px #ff4466';
            });

            warningElements.forEach(function(el) {
                el.style.textShadow = '0 0 6px #ffb347';
            });
        },

        /**
         * Initialize all CRT effects
         */
        init: function() {
            var self = this;

            this.addScanlines();
            this.enableFlicker();
            this.addPhosphorGlow();
            this.addTerminalCursor();
            this.applyStatusGlow();

            // Boot sequence on first visit
            if (this.config.enableBootSequence) {
                this.bootSequence();
            }

            // Re-apply effects on dynamic content changes
            var observer = new MutationObserver(function(mutations) {
                self.addPhosphorGlow();
                self.addTerminalCursor();
                self.applyStatusGlow();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        /**
         * Configure CRT effects
         */
        configure: function(options) {
            for (var key in options) {
                if (this.config.hasOwnProperty(key)) {
                    this.config[key] = options[key];
                }
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SecuBoxCRT.init();
        });
    } else {
        SecuBoxCRT.init();
    }

    // Export to global scope
    window.SecuBoxCRT = SecuBoxCRT;

})();
