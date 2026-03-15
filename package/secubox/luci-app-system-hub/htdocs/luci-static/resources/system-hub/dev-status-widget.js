'use strict';
'require baseclass';
/**
 * SecuBox Development Status Widget v2.1
 * Dynamic + Interactive Architecture Dashboard
 * Features → Components → Submodules + Interconnections
 * - Live data from RPCD (no auth required for read-only)
 * - LocalStorage for filter persistence
 * - Auto-refresh capability
 * - ES5 compatible for older browsers
 * Generated from DEV-STATUS.md - 2026-03-09
 */

var DevStatusWidget = {
    targetVersion: '1.0.0',
    lastUpdate: '2026-03-16',
    totalPackages: 190,
    refreshInterval: null,
    refreshSeconds: 60,
    activeFilters: {
        layer: null,
        status: null,
        category: null
    },

    // ============================================================
    // ARCHITECTURE: 4 LAYERS
    // ============================================================
    layers: {
        'core': {
            id: 'core',
            name: 'Couche 1: Core Mesh',
            description: 'Infrastructure fondamentale: reverse proxy, WAF, DNS, containers',
            progress: 98,
            icon: '🏗️',
            color: '#10b981',
            order: 1
        },
        'ai': {
            id: 'ai',
            name: 'Couche 2: AI Gateway',
            description: 'Intelligence artificielle: inference, agents, mémoire contextuelle',
            progress: 95,
            icon: '🤖',
            color: '#8b5cf6',
            order: 2
        },
        'mirrornet': {
            id: 'mirrornet',
            name: 'Couche 3: MirrorNet P2P',
            description: 'Réseau maillé: identité, gossip, partage IOC, mirroring',
            progress: 90,
            icon: '🌐',
            color: '#06b6d4',
            order: 3
        },
        'certification': {
            id: 'certification',
            name: 'Couche 4: Certification',
            description: 'Conformité: ANSSI CSPN, CRA, audit sécurité',
            progress: 75,
            icon: '🏆',
            color: '#f59e0b',
            order: 4
        }
    },

    // ============================================================
    // FEATURES: Major functional areas
    // ============================================================
    features: {
        // === SECURITY ===
        'intrusion-prevention': {
            id: 'intrusion-prevention',
            name: 'Intrusion Prevention',
            layer: 'core',
            category: 'security',
            status: 'production',
            progress: 95,
            icon: '🛡️',
            description: 'Détection et blocage des menaces en temps réel',
            components: ['crowdsec', 'firewall-bouncer', 'wazuh'],
            dependsOn: ['network-stack'],
            usedBy: ['threat-intelligence', 'ai-security']
        },
        'waf': {
            id: 'waf',
            name: 'Web Application Firewall',
            layer: 'core',
            category: 'security',
            status: 'production',
            progress: 90,
            icon: '🔥',
            description: 'Inspection HTTP/HTTPS, détection bots, analytics',
            components: ['mitmproxy', 'haproxy-router', 'analytics'],
            dependsOn: ['reverse-proxy'],
            usedBy: ['session-analytics', 'threat-intelligence']
        },
        'dns-firewall': {
            id: 'dns-firewall',
            name: 'DNS Firewall',
            layer: 'core',
            category: 'security',
            status: 'production',
            progress: 85,
            icon: '🚫',
            description: 'Blocage DNS (RPZ), threat feeds, mesh DNS',
            components: ['vortex-dns', 'vortex-firewall', 'rpz-zones'],
            dependsOn: ['dns-master'],
            usedBy: ['ai-security', 'mesh-network']
        },
        'access-control': {
            id: 'access-control',
            name: 'Access Control',
            layer: 'core',
            category: 'security',
            status: 'production',
            progress: 90,
            icon: '🔐',
            description: 'NAC, portail captif, OAuth2, vouchers',
            components: ['auth-guardian', 'client-guardian', 'nodogsplash', 'mac-guardian'],
            dependsOn: ['network-stack'],
            usedBy: ['user-management']
        },

        // === NETWORK ===
        'reverse-proxy': {
            id: 'reverse-proxy',
            name: 'Reverse Proxy & SSL',
            layer: 'core',
            category: 'network',
            status: 'production',
            progress: 95,
            icon: '🔀',
            description: 'HAProxy SNI routing, ACME SSL, 226 vhosts',
            components: ['haproxy', 'acme', 'vhost-manager'],
            dependsOn: ['dns-master'],
            usedBy: ['waf', 'service-exposure'],
            stats: { vhosts: 226, certificates: 92 }
        },
        'dns-master': {
            id: 'dns-master',
            name: 'DNS Master',
            layer: 'core',
            category: 'network',
            status: 'production',
            progress: 90,
            icon: '🌍',
            description: 'BIND9 authoritative, zone management, 7 zones',
            components: ['bind9', 'dns-provider', 'zone-editor'],
            dependsOn: [],
            usedBy: ['reverse-proxy', 'dns-firewall', 'mesh-network'],
            stats: { zones: 7, records: 78 }
        },
        'vpn-mesh': {
            id: 'vpn-mesh',
            name: 'VPN & Mesh',
            layer: 'core',
            category: 'network',
            status: 'production',
            progress: 85,
            icon: '🔒',
            description: 'WireGuard tunnels, QR codes, mesh topology',
            components: ['wireguard', 'mesh-discovery', 'qr-generator'],
            dependsOn: ['network-stack'],
            usedBy: ['mirrornet-p2p', 'master-link']
        },
        'bandwidth-qos': {
            id: 'bandwidth-qos',
            name: 'Bandwidth & QoS',
            layer: 'core',
            category: 'network',
            status: 'production',
            progress: 85,
            icon: '📊',
            description: 'SQM/CAKE, quotas, traffic shaping',
            components: ['bandwidth-manager', 'traffic-shaper', 'sqm'],
            dependsOn: ['network-stack'],
            usedBy: ['media-services']
        },

        // === SERVICES ===
        'container-platform': {
            id: 'container-platform',
            name: 'Container Platform',
            layer: 'core',
            category: 'services',
            status: 'production',
            progress: 95,
            icon: '📦',
            description: 'LXC containers, 18 running, auto-start',
            components: ['lxc-manager', 'container-networking', 'resource-limits'],
            dependsOn: ['network-stack'],
            usedBy: ['media-services', 'communication', 'cloud-services'],
            stats: { running: 18, total: 25 }
        },
        'media-services': {
            id: 'media-services',
            name: 'Media Services',
            layer: 'core',
            category: 'services',
            status: 'production',
            progress: 90,
            icon: '🎬',
            description: 'Streaming, photos, musique',
            components: ['jellyfin', 'photoprism', 'lyrion', 'peertube'],
            dependsOn: ['container-platform', 'reverse-proxy'],
            usedBy: []
        },
        'communication': {
            id: 'communication',
            name: 'Communication',
            layer: 'core',
            category: 'services',
            status: 'production',
            progress: 85,
            icon: '💬',
            description: 'Chat, video, federation',
            components: ['matrix', 'jitsi', 'jabber', 'gotosocial', 'simplex'],
            dependsOn: ['container-platform', 'reverse-proxy'],
            usedBy: []
        },
        'cloud-services': {
            id: 'cloud-services',
            name: 'Cloud Services',
            layer: 'core',
            category: 'services',
            status: 'production',
            progress: 85,
            icon: '☁️',
            description: 'Files, email, git',
            components: ['nextcloud', 'mailserver', 'gitea'],
            dependsOn: ['container-platform', 'reverse-proxy'],
            usedBy: []
        },
        'remote-access': {
            id: 'remote-access',
            name: 'Remote Access',
            layer: 'core',
            category: 'services',
            status: 'production',
            progress: 80,
            icon: '🖥️',
            description: 'Terminal web, RDP, TURN/STUN',
            components: ['rtty-remote', 'turn-server', 'rustdesk'],
            dependsOn: ['reverse-proxy'],
            usedBy: ['master-link']
        },

        // === AI ===
        'ai-inference': {
            id: 'ai-inference',
            name: 'AI Inference',
            layer: 'ai',
            category: 'ai',
            status: 'production',
            progress: 80,
            icon: '🧠',
            description: 'LocalAI, Ollama, embeddings, completions',
            components: ['localai', 'ollama', 'model-manager'],
            dependsOn: ['container-platform'],
            usedBy: ['ai-security', 'ai-agents']
        },
        'ai-security': {
            id: 'ai-security',
            name: 'AI Security Agents',
            layer: 'ai',
            category: 'ai',
            status: 'production',
            progress: 90,
            icon: '🤖',
            description: 'Threat analysis, DNS anomaly, network behavior',
            components: ['threat-analyst', 'dns-guard-ai', 'network-anomaly'],
            dependsOn: ['ai-inference', 'intrusion-prevention'],
            usedBy: []
        },
        'ai-memory': {
            id: 'ai-memory',
            name: 'AI Memory & Context',
            layer: 'ai',
            category: 'ai',
            status: 'production',
            progress: 85,
            icon: '💾',
            description: 'LocalRecall, RAG, conversation history',
            components: ['localrecall', 'mcp-server', 'embedding-store'],
            dependsOn: ['ai-inference'],
            usedBy: ['ai-security']
        },

        // === MIRRORNET ===
        'mesh-network': {
            id: 'mesh-network',
            name: 'Mesh Network',
            layer: 'mirrornet',
            category: 'p2p',
            status: 'production',
            progress: 90,
            icon: '🕸️',
            description: 'P2P mesh, gossip protocol, service discovery',
            components: ['p2p-core', 'gossip', 'mesh-dns'],
            dependsOn: ['vpn-mesh', 'dns-master'],
            usedBy: ['p2p-intel', 'service-mirroring']
        },
        'identity-trust': {
            id: 'identity-trust',
            name: 'Identity & Trust',
            layer: 'mirrornet',
            category: 'p2p',
            status: 'production',
            progress: 85,
            icon: '🪪',
            description: 'DID identity, reputation, trust hierarchy',
            components: ['identity-did', 'reputation', 'master-link'],
            dependsOn: ['mesh-network'],
            usedBy: ['p2p-intel']
        },
        'p2p-intel': {
            id: 'p2p-intel',
            name: 'P2P Intelligence',
            layer: 'mirrornet',
            category: 'p2p',
            status: 'production',
            progress: 80,
            icon: '🔍',
            description: 'IOC sharing, signed alerts, collective defense',
            components: ['p2p-intel-core', 'ioc-signatures', 'alert-propagation'],
            dependsOn: ['identity-trust', 'intrusion-prevention'],
            usedBy: []
        },
        'service-exposure': {
            id: 'service-exposure',
            name: 'Service Exposure',
            layer: 'core',
            category: 'exposure',
            status: 'production',
            progress: 80,
            icon: '🚀',
            description: 'Peek/Poke/Emancipate, multi-channel exposure',
            components: ['exposure-engine', 'tor-hidden', 'dns-ssl', 'mesh-publish'],
            dependsOn: ['reverse-proxy', 'dns-master'],
            usedBy: ['mesh-network']
        },

        // === MONITORING ===
        'system-monitoring': {
            id: 'system-monitoring',
            name: 'System Monitoring',
            layer: 'core',
            category: 'monitoring',
            status: 'production',
            progress: 90,
            icon: '📈',
            description: 'Glances, Netdata, system health',
            components: ['glances', 'netdata', 'health-checks'],
            dependsOn: [],
            usedBy: ['ai-security']
        },
        'network-analytics': {
            id: 'network-analytics',
            name: 'Network Analytics',
            layer: 'core',
            category: 'monitoring',
            status: 'production',
            progress: 85,
            icon: '🔬',
            description: 'DPI, flow analysis, application detection',
            components: ['netifyd', 'ndpid', 'flow-analyzer'],
            dependsOn: ['network-stack'],
            usedBy: ['ai-security', 'bandwidth-qos']
        },
        'session-analytics': {
            id: 'session-analytics',
            name: 'Session Analytics',
            layer: 'core',
            category: 'monitoring',
            status: 'production',
            progress: 85,
            icon: '👁️',
            description: 'Avatar-Tap recording, cookie tracking, replay',
            components: ['avatar-tap', 'cookie-tracker', 'session-replay'],
            dependsOn: ['waf'],
            usedBy: ['threat-intelligence']
        },
        'threat-intelligence': {
            id: 'threat-intelligence',
            name: 'Threat Intelligence',
            layer: 'core',
            category: 'monitoring',
            status: 'production',
            progress: 80,
            icon: '🎯',
            description: 'CVE triage, cyberfeed, device intel',
            components: ['cve-triage', 'cyberfeed', 'device-intel'],
            dependsOn: ['intrusion-prevention'],
            usedBy: ['ai-security']
        },

        // === ADMIN ===
        'config-management': {
            id: 'config-management',
            name: 'Configuration Management',
            layer: 'certification',
            category: 'admin',
            status: 'production',
            progress: 95,
            icon: '⚙️',
            description: 'Backup, restore, config vault, device provisioning',
            components: ['backup', 'config-advisor', 'cloner', 'config-vault'],
            dependsOn: [],
            usedBy: []
        },
        'compliance': {
            id: 'compliance',
            name: 'Compliance & Audit',
            layer: 'certification',
            category: 'admin',
            status: 'beta',
            progress: 60,
            icon: '📋',
            description: 'ANSSI CSPN, CRA, security audit',
            components: ['anssi-checker', 'sbom-generator', 'audit-log'],
            dependsOn: ['config-management'],
            usedBy: []
        }
    },

    // ============================================================
    // COMPONENTS: Building blocks
    // ============================================================
    components: {
        // Security components
        'crowdsec': { name: 'CrowdSec', type: 'backend', status: 'production', packages: ['secubox-app-crowdsec', 'luci-app-crowdsec-dashboard'] },
        'firewall-bouncer': { name: 'Firewall Bouncer', type: 'backend', status: 'production', packages: ['secubox-app-cs-firewall-bouncer'] },
        'wazuh': { name: 'Wazuh SIEM', type: 'backend', status: 'production', packages: ['secubox-app-wazuh', 'luci-app-wazuh'] },
        'mitmproxy': { name: 'Mitmproxy WAF', type: 'backend', status: 'production', packages: ['secubox-app-mitmproxy', 'luci-app-mitmproxy'] },
        'haproxy-router': { name: 'HAProxy Router', type: 'addon', status: 'production', packages: [] },
        'analytics': { name: 'SecuBox Analytics', type: 'addon', status: 'production', packages: [] },
        'vortex-dns': { name: 'Vortex DNS', type: 'backend', status: 'production', packages: ['secubox-vortex-dns', 'luci-app-vortex-dns'] },
        'vortex-firewall': { name: 'Vortex Firewall', type: 'backend', status: 'production', packages: ['secubox-vortex-firewall', 'luci-app-vortex-firewall'] },
        'rpz-zones': { name: 'RPZ Zones', type: 'config', status: 'production', packages: [] },
        'auth-guardian': { name: 'Auth Guardian', type: 'luci', status: 'production', packages: ['luci-app-auth-guardian'] },
        'client-guardian': { name: 'Client Guardian', type: 'luci', status: 'production', packages: ['luci-app-client-guardian'] },
        'nodogsplash': { name: 'Nodogsplash', type: 'backend', status: 'production', packages: ['secubox-app-nodogsplash'] },
        'mac-guardian': { name: 'MAC Guardian', type: 'backend', status: 'production', packages: ['secubox-app-mac-guardian', 'luci-app-mac-guardian'] },

        // Network components
        'haproxy': { name: 'HAProxy', type: 'backend', status: 'production', packages: ['secubox-app-haproxy', 'luci-app-haproxy'] },
        'acme': { name: 'ACME SSL', type: 'backend', status: 'production', packages: [] },
        'vhost-manager': { name: 'VHost Manager', type: 'luci', status: 'production', packages: ['secubox-app-vhost-manager', 'luci-app-vhost-manager'] },
        'bind9': { name: 'BIND9', type: 'backend', status: 'production', packages: ['secubox-app-dns-master', 'luci-app-dns-master'] },
        'dns-provider': { name: 'DNS Provider API', type: 'backend', status: 'beta', packages: ['secubox-app-dns-provider', 'luci-app-dns-provider'] },
        'zone-editor': { name: 'Zone Editor', type: 'luci', status: 'production', packages: [] },
        'wireguard': { name: 'WireGuard', type: 'backend', status: 'production', packages: ['luci-app-wireguard-dashboard'] },
        'mesh-discovery': { name: 'Mesh Discovery', type: 'backend', status: 'beta', packages: ['secubox-app-meshname-dns'] },
        'qr-generator': { name: 'QR Generator', type: 'addon', status: 'production', packages: [] },
        'bandwidth-manager': { name: 'Bandwidth Manager', type: 'luci', status: 'production', packages: ['luci-app-bandwidth-manager'] },
        'traffic-shaper': { name: 'Traffic Shaper', type: 'luci', status: 'production', packages: ['luci-app-traffic-shaper'] },
        'sqm': { name: 'SQM/CAKE', type: 'backend', status: 'production', packages: [] },

        // Service components
        'lxc-manager': { name: 'LXC Manager', type: 'luci', status: 'production', packages: ['luci-app-vm'] },
        'container-networking': { name: 'Container Networking', type: 'backend', status: 'production', packages: [] },
        'resource-limits': { name: 'Resource Limits', type: 'config', status: 'production', packages: [] },
        'jellyfin': { name: 'Jellyfin', type: 'backend', status: 'production', packages: ['secubox-app-jellyfin', 'luci-app-jellyfin'] },
        'photoprism': { name: 'PhotoPrism', type: 'backend', status: 'production', packages: ['secubox-app-photoprism', 'luci-app-photoprism'] },
        'lyrion': { name: 'Lyrion Music', type: 'backend', status: 'production', packages: ['secubox-app-lyrion', 'luci-app-lyrion'] },
        'peertube': { name: 'PeerTube', type: 'backend', status: 'beta', packages: ['secubox-app-peertube', 'luci-app-peertube'] },
        'matrix': { name: 'Matrix', type: 'backend', status: 'production', packages: ['secubox-app-matrix', 'luci-app-matrix'] },
        'jitsi': { name: 'Jitsi', type: 'backend', status: 'production', packages: ['secubox-app-jitsi', 'luci-app-jitsi'] },
        'jabber': { name: 'Prosody XMPP', type: 'backend', status: 'production', packages: ['secubox-app-jabber', 'luci-app-jabber'] },
        'gotosocial': { name: 'GoToSocial', type: 'backend', status: 'production', packages: ['secubox-app-gotosocial', 'luci-app-gotosocial'] },
        'simplex': { name: 'SimpleX', type: 'backend', status: 'beta', packages: ['secubox-app-simplex', 'luci-app-simplex'] },
        'nextcloud': { name: 'Nextcloud', type: 'backend', status: 'production', packages: ['secubox-app-nextcloud', 'luci-app-nextcloud'] },
        'mailserver': { name: 'Mail Server', type: 'backend', status: 'production', packages: ['secubox-app-mailserver', 'luci-app-mailserver'] },
        'gitea': { name: 'Gitea', type: 'backend', status: 'production', packages: ['secubox-app-gitea', 'luci-app-gitea'] },
        'rtty-remote': { name: 'RTTY Remote', type: 'backend', status: 'production', packages: ['secubox-app-rtty-remote', 'luci-app-rtty-remote'] },
        'turn-server': { name: 'TURN Server', type: 'backend', status: 'production', packages: ['secubox-app-turn', 'luci-app-turn'] },
        'rustdesk': { name: 'RustDesk', type: 'backend', status: 'beta', packages: ['secubox-app-rustdesk'] },

        // AI components
        'localai': { name: 'LocalAI', type: 'backend', status: 'production', packages: ['secubox-app-localai', 'luci-app-localai'] },
        'ollama': { name: 'Ollama', type: 'backend', status: 'beta', packages: ['secubox-app-ollama', 'luci-app-ollama'] },
        'model-manager': { name: 'Model Manager', type: 'luci', status: 'beta', packages: ['luci-app-ai-gateway'] },
        'threat-analyst': { name: 'Threat Analyst', type: 'backend', status: 'beta', packages: ['secubox-threat-analyst', 'luci-app-threat-analyst'] },
        'dns-guard-ai': { name: 'DNS Guard AI', type: 'backend', status: 'beta', packages: ['secubox-dns-guard', 'luci-app-dnsguard'] },
        'network-anomaly': { name: 'Network Anomaly', type: 'backend', status: 'beta', packages: ['secubox-network-anomaly', 'luci-app-network-anomaly'] },
        'localrecall': { name: 'LocalRecall', type: 'backend', status: 'alpha', packages: ['secubox-localrecall', 'luci-app-localrecall'] },
        'mcp-server': { name: 'MCP Server', type: 'backend', status: 'beta', packages: ['secubox-mcp-server'] },
        'embedding-store': { name: 'Embedding Store', type: 'backend', status: 'alpha', packages: [] },

        // P2P components
        'p2p-core': { name: 'P2P Core', type: 'backend', status: 'beta', packages: ['secubox-p2p', 'luci-app-secubox-p2p'] },
        'gossip': { name: 'Gossip Protocol', type: 'backend', status: 'beta', packages: [] },
        'mesh-dns': { name: 'Mesh DNS', type: 'backend', status: 'beta', packages: ['secubox-app-meshname-dns', 'luci-app-meshname-dns'] },
        'identity-did': { name: 'Identity DID', type: 'backend', status: 'alpha', packages: ['secubox-identity'] },
        'reputation': { name: 'Reputation System', type: 'backend', status: 'alpha', packages: [] },
        'master-link': { name: 'Master Link', type: 'backend', status: 'production', packages: ['secubox-master-link', 'luci-app-master-link'] },
        'p2p-intel-core': { name: 'P2P Intel Core', type: 'backend', status: 'alpha', packages: ['secubox-p2p-intel'] },
        'ioc-signatures': { name: 'IOC Signatures', type: 'backend', status: 'alpha', packages: [] },
        'alert-propagation': { name: 'Alert Propagation', type: 'backend', status: 'alpha', packages: [] },
        'exposure-engine': { name: 'Exposure Engine', type: 'backend', status: 'production', packages: ['secubox-app-exposure', 'luci-app-exposure'] },
        'tor-hidden': { name: 'Tor Hidden Services', type: 'backend', status: 'production', packages: ['secubox-app-tor', 'luci-app-tor-shield'] },
        'dns-ssl': { name: 'DNS/SSL Channel', type: 'backend', status: 'production', packages: [] },
        'mesh-publish': { name: 'Mesh Publish', type: 'backend', status: 'beta', packages: [] },

        // Monitoring components
        'glances': { name: 'Glances', type: 'backend', status: 'production', packages: ['secubox-app-glances', 'luci-app-glances'] },
        'netdata': { name: 'Netdata', type: 'backend', status: 'production', packages: ['luci-app-netdata-dashboard'] },
        'health-checks': { name: 'Health Checks', type: 'backend', status: 'production', packages: [] },
        'netifyd': { name: 'Netifyd', type: 'backend', status: 'production', packages: ['secubox-app-netifyd', 'luci-app-secubox-netifyd'] },
        'ndpid': { name: 'nDPId', type: 'backend', status: 'production', packages: ['secubox-app-ndpid', 'luci-app-ndpid'] },
        'flow-analyzer': { name: 'Flow Analyzer', type: 'backend', status: 'production', packages: [] },
        'avatar-tap': { name: 'Avatar-Tap', type: 'backend', status: 'production', packages: ['secubox-avatar-tap', 'luci-app-avatar-tap'] },
        'cookie-tracker': { name: 'Cookie Tracker', type: 'backend', status: 'production', packages: ['secubox-cookie-tracker', 'luci-app-cookie-tracker'] },
        'session-replay': { name: 'Session Replay', type: 'luci', status: 'production', packages: [] },
        'cve-triage': { name: 'CVE Triage', type: 'backend', status: 'beta', packages: ['secubox-cve-triage', 'luci-app-cve-triage'] },
        'cyberfeed': { name: 'CyberFeed', type: 'backend', status: 'production', packages: ['secubox-app-cyberfeed', 'luci-app-cyberfeed'] },
        'device-intel': { name: 'Device Intel', type: 'backend', status: 'production', packages: ['secubox-app-device-intel', 'luci-app-device-intel'] },

        // Admin components
        'backup': { name: 'Backup', type: 'backend', status: 'production', packages: ['secubox-app-backup', 'luci-app-backup'] },
        'config-advisor': { name: 'Config Advisor', type: 'backend', status: 'beta', packages: ['secubox-config-advisor', 'luci-app-config-advisor'] },
        'cloner': { name: 'Station Cloner', type: 'luci', status: 'alpha', packages: ['luci-app-cloner'] },
        'anssi-checker': { name: 'ANSSI Checker', type: 'backend', status: 'alpha', packages: [] },
        'sbom-generator': { name: 'SBOM Generator', type: 'backend', status: 'planned', packages: [] },
        'audit-log': { name: 'Audit Log', type: 'backend', status: 'beta', packages: ['secubox-app-auth-logger'] },

        // Virtual/implicit
        'network-stack': { name: 'Network Stack', type: 'system', status: 'production', packages: [] }
    },

    // ============================================================
    // MILESTONES: Version targets
    // ============================================================
    milestones: [
        {
            version: '0.18',
            name: 'MirrorBox Core',
            target: '2026-02-06',
            status: 'completed',
            progress: 100,
            features: ['localai', 'mcp-server', 'threat-analyst', 'dns-guard'],
            highlights: ['LocalAI 3.9 upgrade', 'MCP Server for Claude Desktop', 'Threat Analyst agent']
        },
        {
            version: '0.19',
            name: 'AI Expansion + MirrorNet',
            target: '2026-02-07',
            status: 'completed',
            progress: 100,
            features: ['cve-triage', 'network-anomaly', 'mirrornet', 'identity'],
            highlights: ['CVE Triage agent', 'Network Anomaly detection', 'MirrorNet P2P mesh']
        },
        {
            version: '1.0',
            name: 'Full Stack Release',
            target: '2026-03-16',
            status: 'completed',
            progress: 100,
            features: ['voip', 'matrix', 'factory', 'config-vault', 'smtp-relay'],
            highlights: ['VoIP integration', 'Matrix federation', 'Device provisioning', 'Unified SMTP relay']
        },
        {
            version: '1.1',
            name: 'Extended Mesh',
            target: '2026-04-01',
            status: 'in-progress',
            progress: 85,
            features: ['yggdrasil', 'meshname-dns', 'extended-discovery'],
            highlights: ['Yggdrasil IPv6 overlay', 'Meshname DNS resolution', 'Extended peer discovery']
        },
        {
            version: '1.2',
            name: 'Certification',
            target: '2026-06-01',
            status: 'planned',
            progress: 20,
            features: ['compliance', 'sbom', 'anssi'],
            highlights: ['ANSSI CSPN prep', 'CRA Annex I SBOM', 'Security documentation']
        }
    ],

    // ============================================================
    // PRODUCTION STATS (defaults, updated via RPCD)
    // ============================================================
    stats: {
        totalPackages: 190,
        luciApps: 92,
        backends: 98,
        lxcContainers: 18,
        haproxyVhosts: 243,
        sslCertificates: 95,
        dnsZones: 7,
        dnsRecords: 82,
        mitmproxyRoutes: 174,
        architectures: 13,
        commits: 1850,
        modulesCount: 92,
        lastLiveUpdate: null
    },

    // ============================================================
    // DYNAMIC DATA FETCHING
    // ============================================================

    loadFiltersFromStorage: function() {
        try {
            var stored = localStorage.getItem('dsw_filters');
            if (stored) {
                var parsed = JSON.parse(stored);
                this.activeFilters = parsed;
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    },

    saveFiltersToStorage: function() {
        try {
            localStorage.setItem('dsw_filters', JSON.stringify(this.activeFilters));
        } catch (e) {
            // Ignore localStorage errors
        }
    },

    fetchLiveStats: function() {
        var self = this;

        // Try to fetch from system-hub RPCD (no auth required for read-only)
        if (typeof L !== 'undefined' && L.rpc) {
            var rpc = L.rpc.declare({
                object: 'luci.system-hub',
                method: 'status',
                expect: {}
            });

            rpc().then(function(result) {
                if (result) {
                    self.updateLiveStats(result);
                }
            }).catch(function() {
                // Silently fail, use static data
            });
        } else {
            // Standalone mode - try direct fetch
            this.fetchStatsStandalone();
        }
    },

    fetchStatsStandalone: function() {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/ubus', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    if (resp && resp.result && resp.result[1]) {
                        self.updateLiveStats(resp.result[1]);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        };
        xhr.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'call',
            params: ['00000000000000000000000000000000', 'luci.system-hub', 'status', {}]
        }));
    },

    updateLiveStats: function(data) {
        if (data.service_count) {
            this.stats.backends = data.service_count;
        }
        this.stats.lastLiveUpdate = new Date().toISOString();

        // Update display if rendered
        var statsContainer = document.querySelector('.dsw-stats-grid');
        if (statsContainer) {
            this.updateStatsDisplay();
        }
    },

    updateStatsDisplay: function() {
        var liveIndicator = document.querySelector('.dsw-live-indicator');
        if (liveIndicator && this.stats.lastLiveUpdate) {
            liveIndicator.classList.add('dsw-live-active');
            liveIndicator.title = 'Last update: ' + this.stats.lastLiveUpdate;
        }
    },

    startAutoRefresh: function() {
        var self = this;
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(function() {
            self.fetchLiveStats();
        }, this.refreshSeconds * 1000);
    },

    stopAutoRefresh: function() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    // ============================================================
    // RENDER METHODS
    // ============================================================

    render: function(containerId) {
        var self = this;
        var container = document.getElementById(containerId);
        if (!container) return;

        // Load saved filters
        this.loadFiltersFromStorage();

        container.innerHTML = this.renderLoading();

        // Small delay for smooth loading animation
        setTimeout(function() {
            container.innerHTML = [
                '<div class="dsw-v2">',
                self.renderStyles(),
                self.renderHeader(),
                self.renderControls(),
                self.renderLayersOverview(),
                self.renderFeaturesGrid(),
                self.renderDependencyGraph(),
                self.renderMilestones(),
                self.renderStats(),
                '</div>'
            ].join('');

            self.initInteractions();
            self.fetchLiveStats();
            self.startAutoRefresh();
            self.applyFilters();
        }, 100);
    },

    renderLoading: function() {
        return '<div class="dsw-loading"><div class="dsw-spinner"></div><p>Chargement de l\'architecture...</p></div>';
    },

    renderHeader: function() {
        var overallProgress = this.calculateOverallProgress();
        return [
            '<div class="dsw-header">',
            '<div class="dsw-header-left">',
            '<h2 class="dsw-title">SecuBox Development Status</h2>',
            '<p class="dsw-subtitle">Architecture: ', this.totalPackages, ' packages · 4 couches · ', Object.keys(this.features).length, ' features</p>',
            '</div>',
            '<div class="dsw-header-right">',
            '<div class="dsw-progress-ring" data-progress="', overallProgress, '">',
            '<svg viewBox="0 0 100 100">',
            '<circle class="dsw-ring-bg" cx="50" cy="50" r="45"/>',
            '<circle class="dsw-ring-fill" cx="50" cy="50" r="45" style="stroke-dasharray: ', (283 * overallProgress / 100), ', 283"/>',
            '</svg>',
            '<span class="dsw-ring-text">', overallProgress, '%</span>',
            '</div>',
            '<div class="dsw-target">',
            '<span class="dsw-target-label">Target</span>',
            '<span class="dsw-target-version">v', this.targetVersion, '</span>',
            '</div>',
            '</div>',
            '</div>'
        ].join('');
    },

    renderControls: function() {
        var self = this;
        var statusOptions = ['all', 'production', 'beta', 'alpha', 'planned'];
        var categoryOptions = ['all', 'security', 'network', 'services', 'ai', 'p2p', 'monitoring', 'exposure', 'admin'];

        return [
            '<div class="dsw-controls">',
            '<div class="dsw-control-group">',
            '<label>Status:</label>',
            '<select class="dsw-filter-status">',
            statusOptions.map(function(s) {
                return '<option value="' + s + '"' + (self.activeFilters.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>';
            }).join(''),
            '</select>',
            '</div>',
            '<div class="dsw-control-group">',
            '<label>Category:</label>',
            '<select class="dsw-filter-category">',
            categoryOptions.map(function(c) {
                return '<option value="' + c + '"' + (self.activeFilters.category === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>';
            }).join(''),
            '</select>',
            '</div>',
            '<div class="dsw-control-group">',
            '<button class="dsw-btn dsw-btn-clear">Clear Filters</button>',
            '<button class="dsw-btn dsw-btn-refresh">↻ Refresh</button>',
            '</div>',
            '<div class="dsw-live-indicator" title="Auto-refresh active">',
            '<span class="dsw-live-dot"></span>',
            '<span>Live</span>',
            '</div>',
            '</div>'
        ].join('');
    },

    renderLayersOverview: function() {
        var self = this;
        var sortedLayers = Object.keys(this.layers).map(function(k) { return self.layers[k]; });
        sortedLayers.sort(function(a, b) { return a.order - b.order; });

        var layersHtml = sortedLayers.map(function(layer) {
            var featureCount = Object.keys(self.features).filter(function(k) {
                return self.features[k].layer === layer.id;
            }).length;

            return [
                '<div class="dsw-layer-card" data-layer="', layer.id, '" style="--layer-color: ', layer.color, '">',
                '<div class="dsw-layer-icon">', layer.icon, '</div>',
                '<div class="dsw-layer-info">',
                '<h3 class="dsw-layer-name">', layer.name, '</h3>',
                '<p class="dsw-layer-desc">', layer.description, '</p>',
                '</div>',
                '<div class="dsw-layer-stats">',
                '<div class="dsw-layer-progress">',
                '<div class="dsw-layer-bar">',
                '<div class="dsw-layer-fill" style="width: ', layer.progress, '%"></div>',
                '</div>',
                '<span class="dsw-layer-percent">', layer.progress, '%</span>',
                '</div>',
                '<span class="dsw-layer-features">', featureCount, ' features</span>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');

        return [
            '<div class="dsw-section">',
            '<h3 class="dsw-section-title">🏛️ Architecture 4 Couches</h3>',
            '<div class="dsw-layers-grid">', layersHtml, '</div>',
            '</div>'
        ].join('');
    },

    renderFeaturesGrid: function() {
        var self = this;
        var categories = {
            security: { name: 'Security', icon: '🛡️' },
            network: { name: 'Network', icon: '🌍' },
            services: { name: 'Services', icon: '📦' },
            ai: { name: 'AI', icon: '🤖' },
            p2p: { name: 'P2P/Mesh', icon: '🕸️' },
            monitoring: { name: 'Monitoring', icon: '📊' },
            exposure: { name: 'Exposure', icon: '🚀' },
            admin: { name: 'Admin', icon: '⚙️' }
        };

        var html = ['<div class="dsw-section"><h3 class="dsw-section-title">📦 Features & Components</h3>'];

        Object.keys(categories).forEach(function(catId) {
            var cat = categories[catId];
            var features = Object.keys(self.features).filter(function(k) {
                return self.features[k].category === catId;
            }).map(function(k) { return self.features[k]; });

            if (!features.length) return;

            html.push('<div class="dsw-category" data-category="', catId, '">');
            html.push('<h4 class="dsw-category-title">', cat.icon, ' ', cat.name, '</h4>');
            html.push('<div class="dsw-features-grid">');

            features.forEach(function(feature) {
                var layer = self.layers[feature.layer];
                var componentsCount = (feature.components || []).length;
                var depsCount = ((feature.dependsOn || []).length) + ((feature.usedBy || []).length);

                var componentTags = (feature.components || []).slice(0, 4).map(function(c) {
                    var comp = self.components[c];
                    if (!comp) return '';
                    return '<span class="dsw-component-tag dsw-comp-' + comp.status + '">' + comp.name + '</span>';
                }).join('');

                var moreCount = (feature.components || []).length - 4;
                if (moreCount > 0) {
                    componentTags += '<span class="dsw-component-more">+' + moreCount + '</span>';
                }

                html.push([
                    '<div class="dsw-feature-card dsw-status-', feature.status, '" data-feature="', feature.id, '" data-layer="', feature.layer, '" data-status="', feature.status, '">',
                    '<div class="dsw-feature-header">',
                    '<span class="dsw-feature-icon">', feature.icon, '</span>',
                    '<span class="dsw-feature-name">', feature.name, '</span>',
                    '<span class="dsw-feature-status">', self.getStatusBadge(feature.status), '</span>',
                    '</div>',
                    '<p class="dsw-feature-desc">', feature.description, '</p>',
                    '<div class="dsw-feature-progress">',
                    '<div class="dsw-feature-bar">',
                    '<div class="dsw-feature-fill" style="width: ', feature.progress, '%; background: ', layer.color, '"></div>',
                    '</div>',
                    '<span>', feature.progress, '%</span>',
                    '</div>',
                    '<div class="dsw-feature-meta">',
                    '<span class="dsw-meta-item" title="Components">📦 ', componentsCount, '</span>',
                    '<span class="dsw-meta-item" title="Dependencies">🔗 ', depsCount, '</span>',
                    '<span class="dsw-meta-layer" style="background: ', layer.color, '">', layer.icon, '</span>',
                    '</div>',
                    '<div class="dsw-feature-components">', componentTags, '</div>',
                    '<div class="dsw-feature-details">',
                    self.renderFeatureDetails(feature),
                    '</div>',
                    '</div>'
                ].join(''));
            });

            html.push('</div></div>');
        });

        html.push('</div>');
        return html.join('');
    },

    renderFeatureDetails: function(feature) {
        var self = this;
        var html = [];

        // Dependencies
        if (feature.dependsOn && feature.dependsOn.length) {
            html.push('<div class="dsw-detail-section">');
            html.push('<strong>Depends on:</strong> ');
            html.push(feature.dependsOn.map(function(d) {
                var dep = self.features[d];
                return dep ? (dep.icon + ' ' + dep.name) : d;
            }).join(', '));
            html.push('</div>');
        }

        // Used by
        if (feature.usedBy && feature.usedBy.length) {
            html.push('<div class="dsw-detail-section">');
            html.push('<strong>Used by:</strong> ');
            html.push(feature.usedBy.map(function(u) {
                var user = self.features[u];
                return user ? (user.icon + ' ' + user.name) : u;
            }).join(', '));
            html.push('</div>');
        }

        // All components
        if (feature.components && feature.components.length) {
            html.push('<div class="dsw-detail-section">');
            html.push('<strong>All components:</strong><br>');
            html.push('<div class="dsw-all-components">');
            feature.components.forEach(function(c) {
                var comp = self.components[c];
                if (comp) {
                    html.push('<span class="dsw-component-full dsw-comp-' + comp.status + '">');
                    html.push(comp.name + ' <small>(' + comp.type + ')</small>');
                    html.push('</span>');
                }
            });
            html.push('</div></div>');
        }

        return html.join('');
    },

    renderDependencyGraph: function() {
        var self = this;
        var deps = [];

        Object.keys(this.features).forEach(function(fid) {
            var feature = self.features[fid];
            (feature.dependsOn || []).forEach(function(dep) {
                if (self.features[dep]) {
                    deps.push({ from: dep, to: fid, type: 'depends' });
                }
            });
            (feature.usedBy || []).forEach(function(user) {
                if (self.features[user]) {
                    deps.push({ from: fid, to: user, type: 'provides' });
                }
            });
        });

        // Remove duplicates
        var seen = {};
        deps = deps.filter(function(d) {
            var key = d.from + '->' + d.to;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });

        var depsHtml = deps.slice(0, 20).map(function(d) {
            var from = self.features[d.from];
            var to = self.features[d.to];
            return [
                '<div class="dsw-dep-item dsw-dep-', d.type, '">',
                '<span class="dsw-dep-from">', (from ? from.icon : ''), ' ', (from ? from.name : d.from), '</span>',
                '<span class="dsw-dep-arrow">', (d.type === 'depends' ? '→' : '←'), '</span>',
                '<span class="dsw-dep-to">', (to ? to.icon : ''), ' ', (to ? to.name : d.to), '</span>',
                '</div>'
            ].join('');
        }).join('');

        return [
            '<div class="dsw-section">',
            '<h3 class="dsw-section-title">🔗 Interconnections</h3>',
            '<div class="dsw-deps-container">',
            '<div class="dsw-deps-legend">',
            '<span class="dsw-legend-item"><span class="dsw-legend-dot dsw-dot-depends"></span> Dépend de</span>',
            '<span class="dsw-legend-item"><span class="dsw-legend-dot dsw-dot-provides"></span> Utilisé par</span>',
            '</div>',
            '<div class="dsw-deps-list">', depsHtml, '</div>',
            '<p class="dsw-deps-note">', deps.length, ' interconnections entre features</p>',
            '</div>',
            '</div>'
        ].join('');
    },

    renderMilestones: function() {
        var self = this;
        var html = this.milestones.map(function(m, i) {
            var isActive = m.status === 'in-progress';
            var highlightsHtml = m.highlights.map(function(h) {
                return '<li>' + h + '</li>';
            }).join('');

            return [
                '<div class="dsw-milestone ', (isActive ? 'dsw-milestone-active ' : ''), 'dsw-milestone-', m.status, '">',
                '<div class="dsw-milestone-marker">',
                '<div class="dsw-milestone-dot"></div>',
                (i < self.milestones.length - 1 ? '<div class="dsw-milestone-line"></div>' : ''),
                '</div>',
                '<div class="dsw-milestone-content">',
                '<div class="dsw-milestone-header">',
                '<span class="dsw-milestone-version">v', m.version, '</span>',
                '<span class="dsw-milestone-name">', m.name, '</span>',
                '<span class="dsw-milestone-date">', m.target, '</span>',
                '</div>',
                '<div class="dsw-milestone-progress">',
                '<div class="dsw-milestone-bar">',
                '<div class="dsw-milestone-fill" style="width: ', m.progress, '%"></div>',
                '</div>',
                '<span>', m.progress, '%</span>',
                '</div>',
                '<ul class="dsw-milestone-highlights">', highlightsHtml, '</ul>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');

        return [
            '<div class="dsw-section">',
            '<h3 class="dsw-section-title">🎯 Milestones → v', this.targetVersion, '</h3>',
            '<div class="dsw-milestones-timeline">', html, '</div>',
            '</div>'
        ].join('');
    },

    renderStats: function() {
        var stats = [
            { label: 'Packages', value: this.stats.totalPackages, icon: '📦' },
            { label: 'LuCI Apps', value: this.stats.luciApps, icon: '🖥️' },
            { label: 'LXC Running', value: this.stats.lxcContainers, icon: '📦' },
            { label: 'HAProxy Vhosts', value: this.stats.haproxyVhosts, icon: '🔀' },
            { label: 'SSL Certs', value: this.stats.sslCertificates, icon: '🔒' },
            { label: 'DNS Zones', value: this.stats.dnsZones, icon: '🌍' },
            { label: 'WAF Routes', value: this.stats.mitmproxyRoutes, icon: '🔥' },
            { label: 'Commits', value: this.stats.commits, icon: '📝' }
        ];

        var statsHtml = stats.map(function(s) {
            return [
                '<div class="dsw-stat-card">',
                '<span class="dsw-stat-icon">', s.icon, '</span>',
                '<span class="dsw-stat-value">', s.value, '</span>',
                '<span class="dsw-stat-label">', s.label, '</span>',
                '</div>'
            ].join('');
        }).join('');

        return [
            '<div class="dsw-section">',
            '<h3 class="dsw-section-title">📈 Production Stats (C3BOX gk2)</h3>',
            '<div class="dsw-stats-grid">', statsHtml, '</div>',
            '</div>'
        ].join('');
    },

    // ============================================================
    // HELPERS
    // ============================================================

    calculateOverallProgress: function() {
        var features = Object.keys(this.features).map(function(k) { return this.features[k]; }, this);
        var total = features.reduce(function(sum, f) { return sum + f.progress; }, 0);
        return Math.round(total / features.length);
    },

    getStatusBadge: function(status) {
        var badges = {
            'production': '✅',
            'beta': '🔶',
            'alpha': '🔷',
            'planned': '⬜'
        };
        return badges[status] || '⚪';
    },

    getCurrentPhase: function() {
        var current = this.milestones.find(function(m) { return m.status === 'in-progress'; });
        if (!current) current = this.milestones[0];
        return {
            phase: 'v' + current.version,
            name: current.name,
            period: current.target,
            status: current.status
        };
    },

    getOverallProgress: function() {
        return this.calculateOverallProgress();
    },

    applyFilters: function() {
        var self = this;
        var cards = document.querySelectorAll('.dsw-feature-card');
        var statusFilter = this.activeFilters.status;
        var categoryFilter = this.activeFilters.category;
        var layerFilter = this.activeFilters.layer;

        cards.forEach(function(card) {
            var feature = self.features[card.dataset.feature];
            if (!feature) return;

            var visible = true;

            if (statusFilter && statusFilter !== 'all' && feature.status !== statusFilter) {
                visible = false;
            }
            if (categoryFilter && categoryFilter !== 'all' && feature.category !== categoryFilter) {
                visible = false;
            }
            if (layerFilter && feature.layer !== layerFilter) {
                visible = false;
            }

            card.style.opacity = visible ? '1' : '0.2';
            card.style.pointerEvents = visible ? 'auto' : 'none';
        });

        // Update layer cards
        document.querySelectorAll('.dsw-layer-card').forEach(function(card) {
            card.classList.toggle('dsw-layer-active', card.dataset.layer === layerFilter);
        });
    },

    initInteractions: function() {
        var self = this;

        // Feature card click to expand
        document.querySelectorAll('.dsw-feature-card').forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
                card.classList.toggle('dsw-expanded');
            });
        });

        // Layer filter
        document.querySelectorAll('.dsw-layer-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var layer = card.dataset.layer;
                if (self.activeFilters.layer === layer) {
                    self.activeFilters.layer = null;
                } else {
                    self.activeFilters.layer = layer;
                }
                self.saveFiltersToStorage();
                self.applyFilters();
            });
        });

        // Status filter dropdown
        var statusSelect = document.querySelector('.dsw-filter-status');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                self.activeFilters.status = this.value === 'all' ? null : this.value;
                self.saveFiltersToStorage();
                self.applyFilters();
            });
        }

        // Category filter dropdown
        var categorySelect = document.querySelector('.dsw-filter-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', function() {
                self.activeFilters.category = this.value === 'all' ? null : this.value;
                self.saveFiltersToStorage();
                self.applyFilters();
            });
        }

        // Clear filters button
        var clearBtn = document.querySelector('.dsw-btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                self.activeFilters = { layer: null, status: null, category: null };
                self.saveFiltersToStorage();

                var statusSel = document.querySelector('.dsw-filter-status');
                var catSel = document.querySelector('.dsw-filter-category');
                if (statusSel) statusSel.value = 'all';
                if (catSel) catSel.value = 'all';

                self.applyFilters();
            });
        }

        // Refresh button
        var refreshBtn = document.querySelector('.dsw-btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                refreshBtn.classList.add('dsw-spinning');
                self.fetchLiveStats();
                setTimeout(function() {
                    refreshBtn.classList.remove('dsw-spinning');
                }, 1000);
            });
        }
    },

    renderStyles: function() {
        return [
            '<style>',
            '.dsw-v2 {',
            '    --dsw-bg: #0f1019;',
            '    --dsw-card: #1a1a24;',
            '    --dsw-border: #2a2a3a;',
            '    --dsw-text: #f1f5f9;',
            '    --dsw-muted: #94a3b8;',
            '    --dsw-dim: #64748b;',
            '    font-family: "Inter", -apple-system, sans-serif;',
            '    color: var(--dsw-text);',
            '    padding: 24px;',
            '}',
            '',
            '.dsw-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px; }',
            '.dsw-spinner { width: 40px; height: 40px; border: 3px solid var(--dsw-border); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }',
            '@keyframes spin { to { transform: rotate(360deg); } }',
            '',
            '.dsw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 20px; }',
            '.dsw-title { font-size: 28px; font-weight: 800; margin: 0; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }',
            '.dsw-subtitle { color: var(--dsw-muted); margin: 8px 0 0; font-size: 14px; }',
            '.dsw-header-right { display: flex; align-items: center; gap: 24px; }',
            '.dsw-progress-ring { position: relative; width: 80px; height: 80px; }',
            '.dsw-progress-ring svg { transform: rotate(-90deg); width: 100%; height: 100%; }',
            '.dsw-ring-bg { fill: none; stroke: var(--dsw-border); stroke-width: 8; }',
            '.dsw-ring-fill { fill: none; stroke: #10b981; stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray 1s ease; }',
            '.dsw-ring-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; font-weight: 700; color: #10b981; }',
            '.dsw-target { text-align: center; }',
            '.dsw-target-label { display: block; font-size: 11px; color: var(--dsw-dim); text-transform: uppercase; }',
            '.dsw-target-version { font-size: 20px; font-weight: 700; color: #06b6d4; }',
            '',
            '.dsw-controls { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; padding: 12px 16px; background: var(--dsw-card); border-radius: 8px; border: 1px solid var(--dsw-border); }',
            '.dsw-control-group { display: flex; align-items: center; gap: 8px; }',
            '.dsw-control-group label { font-size: 12px; color: var(--dsw-muted); }',
            '.dsw-control-group select { background: var(--dsw-bg); border: 1px solid var(--dsw-border); color: var(--dsw-text); padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; }',
            '.dsw-btn { background: var(--dsw-bg); border: 1px solid var(--dsw-border); color: var(--dsw-text); padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; }',
            '.dsw-btn:hover { border-color: #06b6d4; color: #06b6d4; }',
            '.dsw-btn-refresh.dsw-spinning { animation: spin 1s linear infinite; }',
            '.dsw-live-indicator { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dsw-dim); margin-left: auto; }',
            '.dsw-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-dim); }',
            '.dsw-live-indicator.dsw-live-active .dsw-live-dot { background: #10b981; animation: pulse 2s infinite; }',
            '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }',
            '',
            '.dsw-section { margin-bottom: 32px; }',
            '.dsw-section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }',
            '',
            '.dsw-layers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }',
            '.dsw-layer-card { background: var(--dsw-card); border: 1px solid var(--dsw-border); border-radius: 12px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; cursor: pointer; transition: all 0.2s; border-left: 4px solid var(--layer-color); }',
            '.dsw-layer-card:hover { transform: translateY(-2px); border-color: var(--layer-color); }',
            '.dsw-layer-card.dsw-layer-active { background: rgba(16, 185, 129, 0.1); border-color: var(--layer-color); }',
            '.dsw-layer-icon { font-size: 32px; }',
            '.dsw-layer-info { flex: 1; min-width: 0; }',
            '.dsw-layer-name { font-size: 14px; font-weight: 700; margin: 0 0 4px; }',
            '.dsw-layer-desc { font-size: 12px; color: var(--dsw-muted); margin: 0; }',
            '.dsw-layer-stats { text-align: right; }',
            '.dsw-layer-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }',
            '.dsw-layer-bar { width: 60px; height: 6px; background: var(--dsw-bg); border-radius: 3px; overflow: hidden; }',
            '.dsw-layer-fill { height: 100%; background: var(--layer-color); border-radius: 3px; }',
            '.dsw-layer-percent { font-size: 14px; font-weight: 700; color: var(--layer-color); min-width: 36px; }',
            '.dsw-layer-features { font-size: 11px; color: var(--dsw-dim); }',
            '',
            '.dsw-category { margin-bottom: 24px; }',
            '.dsw-category-title { font-size: 14px; font-weight: 600; color: var(--dsw-muted); margin-bottom: 12px; }',
            '.dsw-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }',
            '.dsw-feature-card { background: var(--dsw-card); border: 1px solid var(--dsw-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }',
            '.dsw-feature-card:hover { border-color: #06b6d4; transform: translateY(-2px); }',
            '.dsw-feature-card.dsw-expanded { grid-column: span 2; }',
            '.dsw-feature-card.dsw-expanded .dsw-feature-details { display: block; }',
            '.dsw-feature-details { display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--dsw-border); }',
            '.dsw-detail-section { font-size: 12px; color: var(--dsw-muted); margin-bottom: 8px; }',
            '.dsw-detail-section strong { color: var(--dsw-text); }',
            '.dsw-all-components { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }',
            '.dsw-component-full { font-size: 11px; padding: 4px 8px; background: var(--dsw-bg); border-radius: 4px; }',
            '.dsw-component-full small { color: var(--dsw-dim); }',
            '.dsw-feature-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }',
            '.dsw-feature-icon { font-size: 20px; }',
            '.dsw-feature-name { font-weight: 700; flex: 1; }',
            '.dsw-feature-status { font-size: 14px; }',
            '.dsw-feature-desc { font-size: 12px; color: var(--dsw-muted); margin-bottom: 12px; line-height: 1.4; }',
            '.dsw-feature-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }',
            '.dsw-feature-bar { flex: 1; height: 6px; background: var(--dsw-bg); border-radius: 3px; overflow: hidden; }',
            '.dsw-feature-fill { height: 100%; border-radius: 3px; }',
            '.dsw-feature-progress span { font-size: 12px; font-weight: 600; color: var(--dsw-muted); min-width: 32px; text-align: right; }',
            '.dsw-feature-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; }',
            '.dsw-meta-item { font-size: 11px; color: var(--dsw-dim); }',
            '.dsw-meta-layer { font-size: 12px; padding: 2px 6px; border-radius: 4px; margin-left: auto; }',
            '.dsw-feature-components { display: flex; flex-wrap: wrap; gap: 6px; }',
            '.dsw-component-tag { font-size: 10px; padding: 3px 8px; border-radius: 4px; background: var(--dsw-bg); color: var(--dsw-muted); }',
            '.dsw-comp-production { border-left: 2px solid #10b981; }',
            '.dsw-comp-beta { border-left: 2px solid #f59e0b; }',
            '.dsw-comp-alpha { border-left: 2px solid #3b82f6; }',
            '.dsw-comp-planned { border-left: 2px solid var(--dsw-dim); }',
            '.dsw-component-more { font-size: 10px; color: var(--dsw-dim); }',
            '',
            '.dsw-status-production { border-left: 3px solid #10b981; }',
            '.dsw-status-beta { border-left: 3px solid #f59e0b; }',
            '.dsw-status-alpha { border-left: 3px solid #3b82f6; }',
            '.dsw-status-planned { border-left: 3px solid var(--dsw-dim); opacity: 0.7; }',
            '',
            '.dsw-deps-container { background: var(--dsw-card); border: 1px solid var(--dsw-border); border-radius: 12px; padding: 20px; }',
            '.dsw-deps-legend { display: flex; gap: 20px; margin-bottom: 16px; }',
            '.dsw-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-muted); }',
            '.dsw-legend-dot { width: 10px; height: 10px; border-radius: 50%; }',
            '.dsw-dot-depends { background: #f59e0b; }',
            '.dsw-dot-provides { background: #10b981; }',
            '.dsw-deps-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }',
            '.dsw-dep-item { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 8px 12px; background: var(--dsw-bg); border-radius: 6px; }',
            '.dsw-dep-depends .dsw-dep-arrow { color: #f59e0b; }',
            '.dsw-dep-provides .dsw-dep-arrow { color: #10b981; }',
            '.dsw-dep-from, .dsw-dep-to { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
            '.dsw-dep-arrow { font-weight: 700; }',
            '.dsw-deps-note { margin-top: 12px; font-size: 12px; color: var(--dsw-dim); text-align: center; }',
            '',
            '.dsw-milestones-timeline { position: relative; }',
            '.dsw-milestone { display: flex; gap: 20px; }',
            '.dsw-milestone-marker { display: flex; flex-direction: column; align-items: center; padding-top: 6px; }',
            '.dsw-milestone-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--dsw-border); border: 3px solid var(--dsw-card); z-index: 1; }',
            '.dsw-milestone-line { width: 2px; flex: 1; background: var(--dsw-border); margin: 4px 0; }',
            '.dsw-milestone-in-progress .dsw-milestone-dot { background: #f59e0b; animation: pulse 2s infinite; }',
            '.dsw-milestone-completed .dsw-milestone-dot { background: #10b981; }',
            '.dsw-milestone-completed .dsw-milestone-line { background: #10b981; }',
            '.dsw-milestone-content { flex: 1; padding-bottom: 24px; }',
            '.dsw-milestone-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }',
            '.dsw-milestone-version { font-weight: 700; font-size: 16px; color: #06b6d4; }',
            '.dsw-milestone-name { font-weight: 600; }',
            '.dsw-milestone-date { font-size: 12px; color: var(--dsw-dim); margin-left: auto; font-family: "JetBrains Mono", monospace; }',
            '.dsw-milestone-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }',
            '.dsw-milestone-bar { flex: 1; max-width: 200px; height: 6px; background: var(--dsw-bg); border-radius: 3px; overflow: hidden; }',
            '.dsw-milestone-fill { height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); border-radius: 3px; }',
            '.dsw-milestone-progress span { font-size: 12px; color: var(--dsw-muted); min-width: 32px; }',
            '.dsw-milestone-highlights { margin: 0; padding-left: 16px; font-size: 12px; color: var(--dsw-muted); }',
            '.dsw-milestone-highlights li { margin-bottom: 4px; }',
            '.dsw-milestone-active { background: rgba(6, 182, 212, 0.05); margin: -8px; padding: 8px; border-radius: 8px; }',
            '',
            '.dsw-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }',
            '.dsw-stat-card { background: var(--dsw-card); border: 1px solid var(--dsw-border); border-radius: 12px; padding: 16px; text-align: center; transition: all 0.2s; }',
            '.dsw-stat-card:hover { border-color: #06b6d4; transform: translateY(-2px); }',
            '.dsw-stat-icon { font-size: 20px; display: block; margin-bottom: 8px; }',
            '.dsw-stat-value { font-size: 28px; font-weight: 800; color: #10b981; display: block; font-family: "JetBrains Mono", monospace; }',
            '.dsw-stat-label { font-size: 11px; color: var(--dsw-dim); text-transform: uppercase; }',
            '',
            '@media (max-width: 768px) {',
            '    .dsw-v2 { padding: 16px; }',
            '    .dsw-header { flex-direction: column; align-items: flex-start; }',
            '    .dsw-controls { flex-direction: column; align-items: stretch; }',
            '    .dsw-features-grid { grid-template-columns: 1fr; }',
            '    .dsw-feature-card.dsw-expanded { grid-column: span 1; }',
            '    .dsw-deps-list { grid-template-columns: 1fr; }',
            '    .dsw-live-indicator { margin-left: 0; }',
            '}',
            '</style>'
        ].join('\n');
    }
};

// Export for different module systems
if (typeof window !== 'undefined') {
    window.DevStatusWidget = DevStatusWidget;
}

// LuCI baseclass export
if (typeof baseclass !== 'undefined') {
    return baseclass.extend(DevStatusWidget);
}
