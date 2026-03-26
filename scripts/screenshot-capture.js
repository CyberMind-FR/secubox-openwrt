#!/usr/bin/env node
/**
 * SecuBox Screenshot Capture Script
 * Uses Puppeteer for authenticated LuCI screenshot capture
 *
 * Authentication: Creates ubus session via SSH and uses sysauth cookie
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const CONFIG = {
    router: process.env.ROUTER || '192.168.255.1',
    username: process.env.LUCI_USER || 'root',
    password: process.env.LUCI_PASS || 'c3box',
    outputDir: process.env.OUTPUT_DIR || path.join(__dirname, '../docs/screenshots/router'),
    viewport: { width: 1920, height: 1080 },
    delay: 4000,  // Wait for page to render
    timeout: 60000
};

// Module definitions: name -> LuCI path
const MODULES = {
    // Core & Dashboard
    'hub': '/admin/status/overview',
    'portal': '/admin/secubox/portal',
    'metrics': '/admin/secubox/metrics',
    'admin': '/admin/secubox/admin',

    // Security
    'crowdsec': '/admin/secubox/crowdsec',
    'waf': '/admin/secubox/mitmproxy',
    'threats': '/admin/secubox/threats',
    'threat-analyst': '/admin/secubox/threat-analyst',
    'dnsguard': '/admin/secubox/dnsguard',
    'auth': '/admin/secubox/auth-guardian',
    'clients': '/admin/secubox/client-guardian',
    'mac': '/admin/secubox/mac-guardian',
    'iot': '/admin/secubox/iot-guard',
    'ipblocklist': '/admin/secubox/ipblocklist',
    'zkp': '/admin/secubox/zkp',
    'cve': '/admin/secubox/cve-triage',
    'cookies': '/admin/secubox/cookie-tracker',
    'avatar-tap': '/admin/secubox/avatar-tap',
    'interceptor': '/admin/secubox/interceptor',

    // Network
    'netmodes': '/admin/secubox/network-modes',
    'bandwidth': '/admin/secubox/bandwidth',
    'traffic': '/admin/secubox/traffic-shaper',
    'haproxy': '/admin/secubox/haproxy',
    'vhost': '/admin/secubox/vhost-manager',
    'cdn': '/admin/secubox/cdn-cache',
    'tweaks': '/admin/secubox/network-tweaks',
    'routes': '/admin/secubox/routes-status',
    'netdiag': '/admin/secubox/netdiag',
    'mqtt': '/admin/secubox/mqtt-bridge',

    // Monitoring
    'netdata': '/admin/secubox/netdata',
    'dpi': '/admin/secubox/netifyd',
    'dpi-dual': '/admin/secubox/dpi-dual',
    'device-intel': '/admin/secubox/device-intel',
    'mediaflow': '/admin/secubox/media-flow',
    'watchdog': '/admin/secubox/watchdog',
    'glances': '/admin/secubox/glances',
    'anomaly': '/admin/secubox/network-anomaly',
    'lan-flows': '/admin/secubox/lan-flows',

    // VPN & Mesh
    'wireguard': '/admin/secubox/wireguard',
    'mesh': '/admin/secubox/mesh',
    'p2p': '/admin/secubox/p2p',
    'mirror': '/admin/secubox/mirror',
    'master-link': '/admin/secubox/master-link',
    'turn': '/admin/secubox/turn',

    // DNS
    'dns': '/admin/secubox/dns-master',
    'vortex-dns': '/admin/secubox/vortex-dns',
    'meshname': '/admin/secubox/meshname-dns',
    'dns-provider': '/admin/secubox/dns-provider',

    // Privacy
    'tor': '/admin/secubox/tor-shield',
    'tor-services': '/admin/secubox/tor',
    'exposure': '/admin/secubox/exposure',

    // Publishing
    'metablogizer': '/admin/secubox/metablogizer',
    'droplet': '/admin/secubox/droplet',
    'streamforge': '/admin/secubox/streamlit-forge',
    'streamlit': '/admin/secubox/streamlit',
    'metacatalog': '/admin/secubox/metacatalog',
    'hexo': '/admin/secubox/hexojs',

    // Apps
    'jellyfin': '/admin/secubox/jellyfin',
    'lyrion': '/admin/secubox/lyrion',
    'nextcloud': '/admin/secubox/nextcloud',
    'gitea': '/admin/secubox/gitea',
    'peertube': '/admin/secubox/peertube',
    'photoprism': '/admin/secubox/photoprism',
    'jitsi': '/admin/secubox/jitsi',
    'matrix': '/admin/secubox/matrix',
    'jabber': '/admin/secubox/jabber',
    'simplex': '/admin/secubox/simplex',
    'voip': '/admin/secubox/voip',
    'domoticz': '/admin/secubox/domoticz',
    'zigbee': '/admin/secubox/zigbee2mqtt',
    'magicmirror': '/admin/secubox/magicmirror2',
    'torrent': '/admin/secubox/torrent',
    'webradio': '/admin/secubox/webradio',
    'mailserver': '/admin/secubox/mailserver',

    // System
    'settings': '/admin/secubox/settings',
    'config-vault': '/admin/secubox/config-vault',
    'config-advisor': '/admin/secubox/config-advisor',
    'smtp': '/admin/secubox/smtp-relay',
    'reporter': '/admin/secubox/reporter',
    'rtty': '/admin/secubox/rtty-remote',
    'backup': '/admin/secubox/backup',
    'cloner': '/admin/secubox/cloner',
    'users': '/admin/secubox/users',
    'cyberfeed': '/admin/secubox/cyberfeed',
    'rezapp': '/admin/secubox/rezapp',

    // AI
    'ai-gateway': '/admin/secubox/ai-gateway',
    'ai-insights': '/admin/secubox/ai-insights',
    'localai': '/admin/secubox/localai',
    'ollama': '/admin/secubox/ollama',
    'localrecall': '/admin/secubox/localrecall',

    // Theme & Login
    'theme': '/admin/system/system',
    'login': '/'
};

const log = (msg) => console.log(`[+] ${msg}`);
const warn = (msg) => console.log(`[!] ${msg}`);
const error = (msg) => console.log(`[-] ${msg}`);

/**
 * Create an authenticated ubus session via SSH and return the session ID.
 * This bypasses password-based login by creating a session directly on the router.
 */
function createUbusSession(router) {
    try {
        log('Creating ubus session via SSH...');

        // Create session
        const createCmd = `ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@${router} "ubus call session create '{\\\"timeout\\\":3600}'" 2>/dev/null`;
        const createResult = execSync(createCmd, { encoding: 'utf8' });
        const session = JSON.parse(createResult);
        const sessionId = session.ubus_rpc_session;

        if (!sessionId) {
            throw new Error('No session ID returned');
        }

        log(`Session created: ${sessionId.substring(0, 8)}...`);

        // Grant permissions via temp script
        const tmpScript = `/tmp/grant_session_${Date.now()}.sh`;
        const grantScript = `#!/bin/sh
ubus call session grant '{"ubus_rpc_session":"${sessionId}","scope":"access-group","objects":[["*","*"]]}'
ubus call session grant '{"ubus_rpc_session":"${sessionId}","scope":"ubus","objects":[["*","*"]]}'
ubus call session grant '{"ubus_rpc_session":"${sessionId}","scope":"uci","objects":[["*","*"]]}'
ubus call session set '{"ubus_rpc_session":"${sessionId}","values":{"username":"root"}}'
`;
        fs.writeFileSync(tmpScript, grantScript, { mode: 0o755 });

        try {
            execSync(`cat ${tmpScript} | ssh -o BatchMode=yes root@${router} sh`, {
                encoding: 'utf8'
            });
        } finally {
            fs.unlinkSync(tmpScript);
        }

        log('Session permissions granted');
        return sessionId;
    } catch (err) {
        error(`Failed to create ubus session: ${err.message}`);
        return null;
    }
}

async function loginToLuCI(page, baseUrl) {
    // Navigate to trigger login page
    log('Navigating to LuCI...');
    await page.goto(`${baseUrl}/admin/status/overview`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
    });

    await new Promise(r => setTimeout(r, 2000));
    const pageContent = await page.content();

    if (pageContent.includes('luci_username') || pageContent.includes('Authorization Required')) {
        log('Login form detected, authenticating...');

        // Wait for form
        await page.waitForSelector('input[name="luci_username"]', { timeout: 10000 });
        await page.waitForSelector('input[name="luci_password"]', { timeout: 10000 });

        // Clear fields and type credentials
        await page.$eval('input[name="luci_username"]', el => el.value = '');
        await page.type('input[name="luci_username"]', CONFIG.username);

        await page.$eval('input[name="luci_password"]', el => el.value = '');
        await page.type('input[name="luci_password"]', CONFIG.password);

        log(`Submitting login for ${CONFIG.username}...`);

        // Debug: screenshot before submit
        await page.screenshot({ path: '/tmp/login-before-submit.png' });

        // Submit form via JavaScript (more reliable than button click due to animations/overlays)
        await Promise.all([
            page.evaluate(() => {
                const form = document.querySelector('form');
                if (form) form.submit();
            }),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.timeout }).catch(() => {})
        ]);

        // Wait for page to stabilize
        await new Promise(r => setTimeout(r, 3000));

        // Debug: log current URL
        log(`After login URL: ${page.url()}`);

        // Verify login succeeded
        const afterLogin = await page.content();

        // Check for error messages
        if (afterLogin.includes('Invalid username')) {
            throw new Error('Login failed - invalid username');
        }
        if (afterLogin.includes('Invalid password') || afterLogin.includes('Wrong password')) {
            throw new Error('Login failed - invalid password');
        }

        if (afterLogin.includes('Authorization Required') || afterLogin.includes('luci_password')) {
            // Debug: save screenshot to see what happened
            await page.screenshot({ path: '/tmp/login-failed.png' });
            log('Debug screenshot saved to /tmp/login-failed.png');

            // Check if there's an error message in the page
            const errorMatch = afterLogin.match(/<div[^>]*class="[^"]*error[^"]*"[^>]*>([^<]*)</);
            if (errorMatch) {
                log(`Error message: ${errorMatch[1]}`);
            }

            throw new Error('Login failed - still seeing login form');
        }

        log('Login successful');
        return true;
    }

    log('Already authenticated');
    return true;
}

async function captureScreenshot(page, baseUrl, name, urlPath, outputDir) {
    const url = `${baseUrl}${urlPath}`;
    const outputPath = `${outputDir}/${name}.png`;

    try {
        // Navigate to page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: CONFIG.timeout
        });

        // Wait for JavaScript content to load
        await new Promise(r => setTimeout(r, CONFIG.delay));

        // Check if we hit login page again (session expired)
        const content = await page.content();
        if (content.includes('Authorization Required') && name !== 'login') {
            return { success: false, reason: 'session_expired' };
        }

        // Wait for view to load (LuCI loads views dynamically)
        await page.waitForFunction(() => {
            const view = document.getElementById('view');
            if (!view) return true;
            return !view.querySelector('.spinning');
        }, { timeout: 15000 }).catch(() => {});

        // Extra wait for dynamic content
        await new Promise(r => setTimeout(r, 2000));

        // Take screenshot
        await page.screenshot({
            path: outputPath,
            fullPage: false
        });

        const stats = fs.statSync(outputPath);
        return { success: true, size: stats.size };

    } catch (err) {
        return { success: false, reason: err.message };
    }
}

async function captureScreenshots(moduleFilter = null) {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    log(`SecuBox Screenshot Capture`);
    log(`Router: ${CONFIG.router}`);
    log(`Output: ${CONFIG.outputDir}`);

    const headless = process.env.HEADLESS !== 'false';
    log(`Browser mode: ${headless ? 'headless' : 'visible'}`);

    const browser = await puppeteer.launch({
        headless: headless ? 'new' : false,
        args: [
            '--ignore-certificate-errors',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport(CONFIG.viewport);

    // Set longer default timeout
    page.setDefaultNavigationTimeout(CONFIG.timeout);
    page.setDefaultTimeout(CONFIG.timeout);

    const baseUrl = `https://${CONFIG.router}/cgi-bin/luci`;

    try {
        // Login via form
        await loginToLuCI(page, baseUrl);

        // Determine which modules to capture
        const modulesToCapture = moduleFilter
            ? Object.entries(MODULES).filter(([name]) => name === moduleFilter || name.includes(moduleFilter))
            : Object.entries(MODULES);

        log(`Capturing ${modulesToCapture.length} modules...`);
        console.log();

        let captured = 0;
        let failed = 0;
        let reloginCount = 0;

        for (const [name, urlPath] of modulesToCapture) {
            process.stdout.write(`[${captured + failed + 1}/${modulesToCapture.length}] ${name}... `);

            let result = await captureScreenshot(page, baseUrl, name, urlPath, CONFIG.outputDir);

            // If session expired, try to re-login
            if (!result.success && result.reason === 'session_expired' && reloginCount < 3) {
                warn('Session expired, re-authenticating...');
                try {
                    await loginToLuCI(page, baseUrl);
                    result = await captureScreenshot(page, baseUrl, name, urlPath, CONFIG.outputDir);
                    reloginCount++;
                } catch (e) {
                    result = { success: false, reason: e.message };
                }
            }

            if (result.success) {
                console.log(`OK (${(result.size / 1024).toFixed(1)}KB)`);
                captured++;
            } else {
                console.log(`FAILED: ${result.reason}`);
                failed++;
            }
        }

        console.log();
        log(`Capture complete: ${captured} success, ${failed} failed`);
        log(`Output: ${CONFIG.outputDir}`);

    } catch (err) {
        error(`Fatal error: ${err.message}`);
        throw err;
    } finally {
        await browser.close();
    }
}

// CLI
const args = process.argv.slice(2);
const moduleFilter = args[0];

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
SecuBox Screenshot Capture

Usage:
  node screenshot-capture.js [module]    Capture specific module
  node screenshot-capture.js             Capture all modules
  node screenshot-capture.js --list      List available modules

Environment:
  ROUTER      Router IP (default: 192.168.255.1)
  LUCI_USER   Username (default: root)
  LUCI_PASS   Password (default: c3box)

Examples:
  node screenshot-capture.js crowdsec
  node screenshot-capture.js mesh
  LUCI_PASS=mypassword node screenshot-capture.js
`);
    process.exit(0);
}

if (args.includes('--list')) {
    console.log('Available modules:');
    Object.keys(MODULES).sort().forEach(m => console.log(`  ${m}`));
    console.log(`\nTotal: ${Object.keys(MODULES).length} modules`);
    process.exit(0);
}

captureScreenshots(moduleFilter).catch(err => {
    error(err.message);
    process.exit(1);
});
