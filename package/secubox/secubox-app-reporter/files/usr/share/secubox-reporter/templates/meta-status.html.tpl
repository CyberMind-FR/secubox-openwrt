<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SecuBox Meta Report - {{HOSTNAME}}</title>
<style>
:root{
  --bg:#0a0a0f;--surface:#0f0f1a;--card:#151525;--card-hover:#1a1a30;
  --ink:#f0f2ff;--dim:rgba(240,242,255,.6);--muted:#666;
  --purple:#6366f1;--violet:#8b5cf6;--cyan:#06b6d4;--teal:#14b8a6;
  --green:#22c55e;--lime:#84cc16;--yellow:#f59e0b;--orange:#f97316;
  --red:#ef4444;--pink:#ec4899;
  --glass:rgba(255,255,255,.03);--border:rgba(255,255,255,.06);
  --glow:0 0 40px rgba(99,102,241,.15);
}
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:var(--bg);color:var(--ink);font-family:"SF Pro Display","Inter",system-ui,sans-serif;line-height:1.5}
.container{max-width:1400px;margin:0 auto;padding:2rem}

/* Header */
.hero{text-align:center;padding:3rem 2rem;margin-bottom:2rem;background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(6,182,212,.05));border-radius:20px;border:1px solid var(--border)}
.hero h1{font-size:2.5rem;font-weight:800;background:linear-gradient(135deg,var(--purple),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}
.hero-sub{color:var(--dim);font-size:1rem;margin-bottom:1.5rem}
.hero-meta{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap}
.meta-chip{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;background:var(--glass);border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--dim)}
.meta-chip strong{color:var(--ink)}

/* Stats Ring */
.stats-ring{display:flex;justify-content:center;gap:3rem;margin:2rem 0;flex-wrap:wrap}
.ring-stat{text-align:center;position:relative}
.ring{width:120px;height:120px;border-radius:50%;background:conic-gradient(var(--purple) calc(var(--pct) * 1%),var(--glass) 0);display:flex;align-items:center;justify-content:center;position:relative}
.ring::before{content:"";position:absolute;inset:12px;background:var(--bg);border-radius:50%}
.ring-value{position:relative;z-index:1;font-size:1.75rem;font-weight:700}
.ring-label{margin-top:.75rem;font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.ring.cyan{background:conic-gradient(var(--cyan) calc(var(--pct) * 1%),var(--glass) 0)}
.ring.green{background:conic-gradient(var(--green) calc(var(--pct) * 1%),var(--glass) 0)}
.ring.orange{background:conic-gradient(var(--orange) calc(var(--pct) * 1%),var(--glass) 0)}

/* Grid Layout */
.grid{display:grid;gap:1.5rem}
.grid-2{grid-template-columns:repeat(2,1fr)}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-4{grid-template-columns:repeat(4,1fr)}
@media(max-width:1024px){.grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.grid-2,.grid-3,.grid-4{grid-template-columns:1fr}}

/* Stat Cards */
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;text-align:center;transition:all .2s;position:relative;overflow:hidden}
.stat-card:hover{background:var(--card-hover);transform:translateY(-2px);box-shadow:var(--glow)}
.stat-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--purple),var(--cyan));opacity:.6}
.stat-icon{font-size:2rem;margin-bottom:.5rem;filter:drop-shadow(0 0 8px currentColor)}
.stat-value{font-size:2.5rem;font-weight:800;background:linear-gradient(135deg,var(--ink),var(--dim));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:.25rem}
.stat-card.purple .stat-icon{color:var(--purple)}
.stat-card.cyan .stat-icon{color:var(--cyan)}
.stat-card.green .stat-icon{color:var(--green)}
.stat-card.orange .stat-icon{color:var(--orange)}

/* Channel Distribution */
.channels{display:flex;gap:1rem;margin:1.5rem 0}
.channel{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center;transition:all .2s}
.channel:hover{transform:scale(1.02)}
.channel-icon{font-size:1.5rem;margin-bottom:.5rem}
.channel-value{font-size:1.75rem;font-weight:700}
.channel-label{font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.channel-bar{height:4px;background:var(--glass);border-radius:2px;margin-top:.75rem;overflow:hidden}
.channel-fill{height:100%;border-radius:2px;transition:width .3s}
.channel.tor .channel-fill{background:var(--purple)}
.channel.dns .channel-fill{background:var(--cyan)}
.channel.mesh .channel-fill{background:var(--green)}

/* Cards */
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;margin-bottom:1.5rem;overflow:hidden}
.card-header{padding:1rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.75rem}
.card-icon{font-size:1.25rem}
.card-title{font-size:1rem;font-weight:600;flex:1}
.card-badge{font-size:.65rem;padding:.25rem .75rem;background:rgba(99,102,241,.15);color:var(--purple);border-radius:20px;font-weight:600}
.card-body{padding:1.5rem;max-height:400px;overflow-y:auto}

/* Tables */
.data-table{width:100%;border-collapse:collapse;font-size:.85rem}
.data-table th{text-align:left;padding:.75rem;color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600;border-bottom:1px solid var(--border)}
.data-table td{padding:.75rem;border-bottom:1px solid var(--border)}
.data-table tr:hover{background:var(--glass)}
.data-table a{color:var(--cyan);text-decoration:none}
.data-table a:hover{text-decoration:underline}
.data-table code{font-size:.75rem;padding:.2rem .4rem;background:var(--glass);border-radius:4px;font-family:"JetBrains Mono",monospace}

/* Status Indicators */
.status{display:inline-flex;align-items:center;gap:.35rem;font-size:.7rem;padding:.2rem .6rem;border-radius:20px;font-weight:600}
.status.up{background:rgba(34,197,94,.12);color:var(--green)}
.status.down{background:rgba(239,68,68,.12);color:var(--red)}
.status.warning{background:rgba(245,158,11,.12);color:var(--yellow)}

/* Progress Bars */
.progress{height:6px;background:var(--glass);border-radius:3px;overflow:hidden;margin:.5rem 0}
.progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--purple),var(--cyan));transition:width .3s}

/* Lists */
.item-list{list-style:none}
.item-list li{padding:.75rem 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.75rem}
.item-list li:last-child{border-bottom:none}
.item-dot{width:8px;height:8px;border-radius:50%;background:var(--purple);flex-shrink:0}
.item-list .item-text{flex:1;font-size:.9rem}
.item-list .item-meta{font-size:.75rem;color:var(--muted)}

/* Footer */
footer{text-align:center;padding:2rem;color:var(--muted);font-size:.75rem;border-top:1px solid var(--border);margin-top:2rem}
footer a{color:var(--purple);text-decoration:none}
footer a:hover{text-decoration:underline}

/* Responsive */
@media(max-width:768px){
  .container{padding:1rem}
  .hero{padding:2rem 1rem}
  .hero h1{font-size:1.75rem}
  .stats-ring{gap:1.5rem}
  .ring{width:90px;height:90px}
  .ring-value{font-size:1.25rem}
}
</style>
</head>
<body>
<div class="container">
  <!-- Hero Header -->
  <div class="hero">
    <h1>SecuBox Meta Report</h1>
    <p class="hero-sub">Unified Status Dashboard</p>
    <div class="hero-meta">
      <div class="meta-chip"><span>Node</span><strong>{{HOSTNAME}}</strong></div>
      <div class="meta-chip"><span>Version</span><strong>{{VERSION}}</strong></div>
      <div class="meta-chip"><span>Generated</span><strong>{{TIMESTAMP}}</strong></div>
    </div>
  </div>

  <!-- Stats Rings -->
  <div class="stats-ring">
    <div class="ring-stat">
      <div class="ring" style="--pct:{{HEALTH_SCORE}}">
        <span class="ring-value">{{HEALTH_SCORE}}%</span>
      </div>
      <div class="ring-label">Health Score</div>
    </div>
    <div class="ring-stat">
      <div class="ring cyan" style="--pct:{{SERVICES_PCT}}">
        <span class="ring-value">{{TOTAL_SERVICES}}</span>
      </div>
      <div class="ring-label">Total Services</div>
    </div>
    <div class="ring-stat">
      <div class="ring green" style="--pct:{{UPTIME_PCT}}">
        <span class="ring-value">{{UPTIME_PCT}}%</span>
      </div>
      <div class="ring-label">Uptime</div>
    </div>
  </div>

  <!-- Channel Distribution -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">📡</span>
      <span class="card-title">Distribution Channels</span>
      <span class="card-badge">{{TOTAL_SERVICES}} Published</span>
    </div>
    <div class="card-body">
      <div class="channels">
        <div class="channel tor">
          <div class="channel-icon">🧅</div>
          <div class="channel-value">{{TOR_COUNT}}</div>
          <div class="channel-label">Tor Hidden</div>
          <div class="channel-bar"><div class="channel-fill" style="width:{{TOR_PCT}}%"></div></div>
        </div>
        <div class="channel dns">
          <div class="channel-icon">🔐</div>
          <div class="channel-value">{{DNS_COUNT}}</div>
          <div class="channel-label">DNS/SSL</div>
          <div class="channel-bar"><div class="channel-fill" style="width:{{DNS_PCT}}%"></div></div>
        </div>
        <div class="channel mesh">
          <div class="channel-icon">🌐</div>
          <div class="channel-value">{{MESH_COUNT}}</div>
          <div class="channel-label">Mesh P2P</div>
          <div class="channel-bar"><div class="channel-fill" style="width:{{MESH_PCT}}%"></div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-4">
    <div class="stat-card purple">
      <div class="stat-icon">📦</div>
      <div class="stat-value">{{PACKAGES_COUNT}}</div>
      <div class="stat-label">Packages</div>
    </div>
    <div class="stat-card cyan">
      <div class="stat-icon">🐳</div>
      <div class="stat-value">{{CONTAINERS_COUNT}}</div>
      <div class="stat-label">Containers</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">✅</div>
      <div class="stat-value">{{FEATURES_DONE}}</div>
      <div class="stat-label">Features Done</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-icon">🚧</div>
      <div class="stat-value">{{WIP_COUNT}}</div>
      <div class="stat-label">In Progress</div>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="grid grid-2" style="margin-top:1.5rem">
    <!-- Recent Completions -->
    <div class="card">
      <div class="card-header">
        <span class="card-icon">✨</span>
        <span class="card-title">Recent Completions</span>
      </div>
      <div class="card-body">
        {{HISTORY_ENTRIES}}
      </div>
    </div>

    <!-- Work In Progress -->
    <div class="card">
      <div class="card-header">
        <span class="card-icon">🔧</span>
        <span class="card-title">Work In Progress</span>
      </div>
      <div class="card-body">
        {{WIP_ENTRIES}}
      </div>
    </div>
  </div>

  <!-- Roadmap Progress -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">🗺️</span>
      <span class="card-title">Roadmap Progress</span>
      <span class="card-badge">v{{VERSION}} → v1.0</span>
    </div>
    <div class="card-body">
      {{ROADMAP_DATA}}
    </div>
  </div>

  <!-- Services Tables -->
  <div class="grid grid-2">
    <div class="card">
      <div class="card-header">
        <span class="card-icon">🧅</span>
        <span class="card-title">Tor Hidden Services</span>
        <span class="card-badge">{{TOR_COUNT}}</span>
      </div>
      <div class="card-body">
        {{TOR_SERVICES}}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-icon">🔐</span>
        <span class="card-title">Top DNS/SSL Vhosts</span>
        <span class="card-badge">{{DNS_COUNT}}</span>
      </div>
      <div class="card-body">
        {{DNS_SERVICES}}
      </div>
    </div>
  </div>

  <footer>
    SecuBox Meta Report v1.0 · Generated by <a href="https://github.com/gkerma/secubox-openwrt">SecuBox Report Generator</a>
  </footer>
</div>
</body>
</html>
