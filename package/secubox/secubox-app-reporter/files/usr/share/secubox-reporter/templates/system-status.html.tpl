<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SecuBox System Report - {{HOSTNAME}}</title>
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
.hero{text-align:center;padding:3rem 2rem;margin-bottom:2rem;background:linear-gradient(135deg,rgba(6,182,212,.1),rgba(34,197,94,.05));border-radius:20px;border:1px solid var(--border)}
.hero h1{font-size:2.5rem;font-weight:800;background:linear-gradient(135deg,var(--cyan),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}
.hero-sub{color:var(--dim);font-size:1rem;margin-bottom:1.5rem}
.hero-meta{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap}
.meta-chip{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;background:var(--glass);border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--dim)}
.meta-chip strong{color:var(--ink)}

/* Gauge Ring */
.gauge-row{display:flex;justify-content:center;gap:3rem;margin:2rem 0;flex-wrap:wrap}
.gauge{text-align:center;position:relative}
.gauge-ring{width:140px;height:140px;border-radius:50%;background:conic-gradient(var(--green) calc(var(--pct) * 1%),var(--glass) 0);display:flex;align-items:center;justify-content:center;position:relative;transition:all .3s}
.gauge-ring::before{content:"";position:absolute;inset:15px;background:var(--bg);border-radius:50%}
.gauge-ring.warn{background:conic-gradient(var(--yellow) calc(var(--pct) * 1%),var(--glass) 0)}
.gauge-ring.crit{background:conic-gradient(var(--red) calc(var(--pct) * 1%),var(--glass) 0)}
.gauge-value{position:relative;z-index:1;font-size:1.5rem;font-weight:700}
.gauge-unit{font-size:.75rem;color:var(--muted)}
.gauge-label{margin-top:.75rem;font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}

/* Grid */
.grid{display:grid;gap:1.5rem}
.grid-2{grid-template-columns:repeat(2,1fr)}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-4{grid-template-columns:repeat(4,1fr)}
@media(max-width:1024px){.grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.grid-2,.grid-3,.grid-4{grid-template-columns:1fr}}

/* Stat Cards */
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;text-align:center;transition:all .2s;position:relative;overflow:hidden}
.stat-card:hover{background:var(--card-hover);transform:translateY(-2px);box-shadow:var(--glow)}
.stat-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--cyan),var(--green));opacity:.6}
.stat-icon{font-size:2rem;margin-bottom:.5rem}
.stat-value{font-size:2rem;font-weight:800;color:var(--ink)}
.stat-label{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:.25rem}
.stat-card.cyan .stat-icon{color:var(--cyan)}
.stat-card.green .stat-icon{color:var(--green)}
.stat-card.orange .stat-icon{color:var(--orange)}
.stat-card.purple .stat-icon{color:var(--purple)}

/* Histogram */
.histogram{display:flex;align-items:flex-end;gap:4px;height:120px;padding:1rem 0}
.histogram-bar{flex:1;background:linear-gradient(180deg,var(--cyan),var(--purple));border-radius:4px 4px 0 0;min-width:8px;transition:height .3s;position:relative}
.histogram-bar:hover{opacity:.8}
.histogram-bar::after{content:attr(data-label);position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:.6rem;color:var(--muted);white-space:nowrap}
.histogram-label{display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);margin-top:1.5rem}

/* Cards */
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;margin-bottom:1.5rem;overflow:hidden}
.card-header{padding:1rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.75rem}
.card-icon{font-size:1.25rem}
.card-title{font-size:1rem;font-weight:600;flex:1}
.card-badge{font-size:.65rem;padding:.25rem .75rem;background:rgba(6,182,212,.15);color:var(--cyan);border-radius:20px;font-weight:600}
.card-body{padding:1.5rem}

/* Info Grid */
.info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
.info-item{padding:.75rem;background:var(--glass);border-radius:8px}
.info-label{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.25rem}
.info-value{font-size:.9rem;color:var(--ink);font-family:"JetBrains Mono",monospace}

/* Process Table */
.process-table{width:100%;border-collapse:collapse;font-size:.8rem}
.process-table th{text-align:left;padding:.5rem;color:var(--muted);font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)}
.process-table td{padding:.5rem;border-bottom:1px solid var(--border)}
.process-table tr:hover{background:var(--glass)}
.process-bar{height:6px;background:var(--glass);border-radius:3px;overflow:hidden;min-width:60px}
.process-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--green),var(--cyan))}
.process-fill.warn{background:linear-gradient(90deg,var(--yellow),var(--orange))}
.process-fill.crit{background:linear-gradient(90deg,var(--orange),var(--red))}

/* Recommendations */
.rec-list{list-style:none}
.rec-item{display:flex;gap:1rem;padding:1rem;margin-bottom:.5rem;background:var(--glass);border-radius:12px;border-left:3px solid var(--cyan)}
.rec-item.warn{border-left-color:var(--yellow)}
.rec-item.crit{border-left-color:var(--red)}
.rec-item.ok{border-left-color:var(--green)}
.rec-icon{font-size:1.5rem}
.rec-content{flex:1}
.rec-title{font-weight:600;margin-bottom:.25rem}
.rec-desc{font-size:.85rem;color:var(--dim)}

/* Environmental Impact */
.eco-card{background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(132,204,22,.05));border:1px solid rgba(34,197,94,.2);border-radius:16px;padding:2rem;text-align:center}
.eco-value{font-size:3rem;font-weight:800;background:linear-gradient(135deg,var(--green),var(--lime));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.eco-label{font-size:.85rem;color:var(--dim);margin-top:.5rem}
.eco-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:1.5rem}
.eco-stat{text-align:center}
.eco-stat-value{font-size:1.5rem;font-weight:700;color:var(--green)}
.eco-stat-label{font-size:.7rem;color:var(--muted);text-transform:uppercase}

/* Debug Log */
.debug-log{background:#0a0a0f;border-radius:8px;padding:1rem;font-family:"JetBrains Mono",monospace;font-size:.75rem;max-height:300px;overflow-y:auto}
.debug-log .line{padding:.25rem 0;border-bottom:1px solid rgba(255,255,255,.03)}
.debug-log .time{color:var(--muted)}
.debug-log .level-info{color:var(--cyan)}
.debug-log .level-warn{color:var(--yellow)}
.debug-log .level-err{color:var(--red)}
.debug-log .level-ok{color:var(--green)}

/* Footer */
footer{text-align:center;padding:2rem;color:var(--muted);font-size:.75rem;border-top:1px solid var(--border);margin-top:2rem}
footer a{color:var(--cyan);text-decoration:none}

/* Responsive */
@media(max-width:768px){
  .container{padding:1rem}
  .hero{padding:2rem 1rem}
  .hero h1{font-size:1.75rem}
  .gauge-row{gap:1.5rem}
  .gauge-ring{width:100px;height:100px}
  .gauge-value{font-size:1.25rem}
  .info-grid{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div class="container">
  <!-- Hero Header -->
  <div class="hero">
    <h1>🖥️ System Report</h1>
    <p class="hero-sub">Hardware Performance & Debug Analysis</p>
    <div class="hero-meta">
      <div class="meta-chip"><span>Node</span><strong>{{HOSTNAME}}</strong></div>
      <div class="meta-chip"><span>Model</span><strong>{{DEVICE_MODEL}}</strong></div>
      <div class="meta-chip"><span>Uptime</span><strong>{{UPTIME}}</strong></div>
      <div class="meta-chip"><span>Generated</span><strong>{{TIMESTAMP}}</strong></div>
    </div>
  </div>

  <!-- Resource Gauges -->
  <div class="gauge-row">
    <div class="gauge">
      <div class="gauge-ring {{CPU_CLASS}}" style="--pct:{{CPU_PCT}}">
        <span class="gauge-value">{{CPU_PCT}}<span class="gauge-unit">%</span></span>
      </div>
      <div class="gauge-label">CPU Usage</div>
    </div>
    <div class="gauge">
      <div class="gauge-ring {{MEM_CLASS}}" style="--pct:{{MEM_PCT}}">
        <span class="gauge-value">{{MEM_PCT}}<span class="gauge-unit">%</span></span>
      </div>
      <div class="gauge-label">Memory</div>
    </div>
    <div class="gauge">
      <div class="gauge-ring {{DISK_CLASS}}" style="--pct:{{DISK_PCT}}">
        <span class="gauge-value">{{DISK_PCT}}<span class="gauge-unit">%</span></span>
      </div>
      <div class="gauge-label">Disk</div>
    </div>
    <div class="gauge">
      <div class="gauge-ring {{TEMP_CLASS}}" style="--pct:{{TEMP_PCT}}">
        <span class="gauge-value">{{TEMP_VAL}}<span class="gauge-unit">°C</span></span>
      </div>
      <div class="gauge-label">Temperature</div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-4">
    <div class="stat-card cyan">
      <div class="stat-icon">⚡</div>
      <div class="stat-value">{{CPU_FREQ}}</div>
      <div class="stat-label">CPU Frequency</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">🧠</div>
      <div class="stat-value">{{MEM_USED}}</div>
      <div class="stat-label">RAM Used / {{MEM_TOTAL}}</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-icon">💾</div>
      <div class="stat-value">{{DISK_USED}}</div>
      <div class="stat-label">Disk Used / {{DISK_TOTAL}}</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-icon">📦</div>
      <div class="stat-value">{{PROCESS_COUNT}}</div>
      <div class="stat-label">Processes</div>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="grid grid-2" style="margin-top:1.5rem">
    <!-- Hardware Info -->
    <div class="card">
      <div class="card-header">
        <span class="card-icon">🔧</span>
        <span class="card-title">Hardware Details</span>
      </div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">CPU Model</div>
            <div class="info-value">{{CPU_MODEL}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">CPU Cores</div>
            <div class="info-value">{{CPU_CORES}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Architecture</div>
            <div class="info-value">{{ARCH}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Kernel</div>
            <div class="info-value">{{KERNEL}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Board</div>
            <div class="info-value">{{BOARD}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">OpenWrt</div>
            <div class="info-value">{{OPENWRT_VER}}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load History -->
    <div class="card">
      <div class="card-header">
        <span class="card-icon">📊</span>
        <span class="card-title">CPU Load History (24h)</span>
        <span class="card-badge">{{LOAD_AVG}}</span>
      </div>
      <div class="card-body">
        <div class="histogram">
          {{CPU_HISTOGRAM}}
        </div>
        <div class="histogram-label">
          <span>24h ago</span>
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Top Processes -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">⚙️</span>
      <span class="card-title">Top Processes by CPU</span>
      <span class="card-badge">{{PROCESS_COUNT}} running</span>
    </div>
    <div class="card-body">
      <table class="process-table">
        <thead>
          <tr>
            <th>Process</th>
            <th>PID</th>
            <th>CPU</th>
            <th>Memory</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {{TOP_PROCESSES}}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Network Stats -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">🌐</span>
      <span class="card-title">Network Interfaces</span>
    </div>
    <div class="card-body">
      <div class="info-grid">
        {{NETWORK_STATS}}
      </div>
    </div>
  </div>

  <!-- Environmental Impact -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">🌱</span>
      <span class="card-title">Environmental Impact</span>
      <span class="card-badge">Estimated</span>
    </div>
    <div class="card-body">
      <div class="eco-card">
        <div class="eco-value">{{POWER_WATTS}}W</div>
        <div class="eco-label">Current Power Consumption</div>
        <div class="eco-grid">
          <div class="eco-stat">
            <div class="eco-stat-value">{{DAILY_KWH}} kWh</div>
            <div class="eco-stat-label">Daily Energy</div>
          </div>
          <div class="eco-stat">
            <div class="eco-stat-value">{{MONTHLY_KWH}} kWh</div>
            <div class="eco-stat-label">Monthly Energy</div>
          </div>
          <div class="eco-stat">
            <div class="eco-stat-value">{{CO2_MONTHLY}} kg</div>
            <div class="eco-stat-label">Monthly CO₂</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Health Recommendations -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">💡</span>
      <span class="card-title">Health Recommendations</span>
    </div>
    <div class="card-body">
      <ul class="rec-list">
        {{RECOMMENDATIONS}}
      </ul>
    </div>
  </div>

  <!-- Debug Log -->
  <div class="card">
    <div class="card-header">
      <span class="card-icon">🔍</span>
      <span class="card-title">System Debug Log</span>
      <span class="card-badge">Last 50 entries</span>
    </div>
    <div class="card-body">
      <div class="debug-log">
        {{DEBUG_LOG}}
      </div>
    </div>
  </div>

  <footer>
    SecuBox System Report v1.0 · Generated by <a href="https://github.com/gkerma/secubox-openwrt">SecuBox Report Generator</a>
  </footer>
</div>
</body>
</html>
