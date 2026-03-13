#!/bin/sh
# SecuBox Reporter - HTML Formatters
# Inline HTML generation for reports

# KissTheme CSS (embedded)
get_kisstheme_css() {
    cat << 'CSS'
:root{
  --bg:#0a0a0f;--surface:#12121a;--card:#1a1a2e;
  --ink:#f0f2ff;--dim:rgba(240,242,255,.5);--muted:#666;
  --primary:#6366f1;--primary-end:#8b5cf6;
  --cyan:#06b6d4;--green:#22c55e;--red:#ef4444;--yellow:#f59e0b;
  --glass:rgba(255,255,255,.04);--border:rgba(255,255,255,.08);
}
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:var(--bg);color:var(--ink);font-family:"Inter","Segoe UI",system-ui,sans-serif;padding:2rem;line-height:1.6}
.container{max-width:1200px;margin:0 auto}
h1{font-size:2rem;margin-bottom:.5rem;background:linear-gradient(90deg,var(--primary),var(--primary-end),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
h2{font-size:1.25rem;color:var(--cyan);margin:1.5rem 0 1rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}
h3{font-size:1rem;color:var(--ink);margin-bottom:.5rem}
h4{font-size:.9rem;color:var(--dim);margin-bottom:.5rem}
.header{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;padding:1.5rem;background:var(--card);border:1px solid var(--border);border-radius:12px}
.header-info{flex:1}
.header-meta{display:flex;gap:1rem;flex-wrap:wrap}
.meta-item{font-size:.75rem;color:var(--muted);padding:.25rem .75rem;background:var(--glass);border-radius:4px}
.score-badge{font-size:2rem;font-weight:700;padding:1rem 1.5rem;background:linear-gradient(135deg,var(--primary),var(--primary-end));border-radius:12px;text-align:center;min-width:100px}
.score-label{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;opacity:.7;display:block;margin-top:.25rem}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:2rem}
.stat-badge{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;text-align:center}
.stat-value{font-size:1.5rem;font-weight:700;background:linear-gradient(90deg,var(--primary),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-label{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:.25rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.25rem;margin-bottom:1.5rem}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:1px solid var(--border)}
.card-title{font-size:1rem;font-weight:600;display:flex;align-items:center;gap:.5rem}
.card-title::before{content:"";width:3px;height:1em;background:var(--primary);border-radius:2px}
ul{list-style:none;padding-left:0}
li{padding:.5rem 0;border-bottom:1px solid var(--border);font-size:.9rem}
li:last-child{border-bottom:none}
li strong{color:var(--cyan)}
.history-entry{margin-bottom:1.5rem}
.history-date{font-size:.8rem;color:var(--primary);font-weight:600;margin-bottom:.5rem;padding:.25rem .5rem;background:rgba(99,102,241,.1);border-radius:4px;display:inline-block}
.wip-section{margin-bottom:1rem}
.wip-section h4{color:var(--cyan);font-size:.85rem;margin-bottom:.5rem}
.roadmap-version{display:flex;align-items:center;gap:1rem;padding:.75rem;background:var(--glass);border-radius:8px;margin-bottom:.5rem}
.roadmap-version h4{margin:0;flex:1}
.status-badge{font-size:.65rem;padding:.25rem .5rem;border-radius:4px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.status-badge.complete,.status-badge.running{background:rgba(34,197,94,.15);color:var(--green)}
.status-badge.inprogress{background:rgba(99,102,241,.15);color:var(--primary)}
.status-badge.pending{background:rgba(102,102,102,.15);color:var(--muted)}
.services-table{width:100%;border-collapse:collapse;font-size:.85rem}
.services-table th,.services-table td{padding:.75rem;text-align:left;border-bottom:1px solid var(--border)}
.services-table th{color:var(--dim);font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.services-table a{color:var(--cyan);text-decoration:none}
.services-table a:hover{text-decoration:underline}
.services-table code{font-size:.75rem;padding:.15rem .35rem;background:var(--glass);border-radius:3px;font-family:"JetBrains Mono",monospace}
.muted{color:var(--muted);font-style:italic}
footer{margin-top:3rem;text-align:center;color:var(--muted);font-size:.75rem;padding-top:1.5rem;border-top:1px solid var(--border)}
footer a{color:var(--primary)}
@media(max-width:768px){body{padding:1rem}.header{flex-direction:column}.stats-grid{grid-template-columns:repeat(2,1fr)}}
CSS
}

# Generate development report HTML inline
generate_dev_html_inline() {
    local output_file="$1"
    local hostname="$2"
    local version="$3"
    local timestamp="$4"
    local health_score="$5"
    local history_entries="$6"
    local wip_entries="$7"
    local roadmap_data="$8"

    cat > "$output_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Development Status - $hostname</title>
<style>
$(get_kisstheme_css)
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="header-info">
            <h1>Development Status Report</h1>
            <div class="header-meta">
                <span class="meta-item">$hostname</span>
                <span class="meta-item">v$version</span>
                <span class="meta-item">$timestamp</span>
            </div>
        </div>
        <div class="score-badge">
            $health_score%
            <span class="score-label">Health Score</span>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Recent Completions</h3>
        </div>
        <div class="card-body">
            $history_entries
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Work In Progress</h3>
        </div>
        <div class="card-body">
            $wip_entries
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Roadmap Progress</h3>
        </div>
        <div class="card-body">
            $roadmap_data
        </div>
    </div>

    <footer>
        Generated by SecuBox Report Generator v1.0 | <a href="/cgi-bin/luci/admin/secubox/reporter">LuCI Dashboard</a>
    </footer>
</div>
</body>
</html>
EOF
}

# Generate services report HTML inline
generate_services_html_inline() {
    local output_file="$1"
    local hostname="$2"
    local timestamp="$3"
    local tor_count="$4"
    local dns_count="$5"
    local mesh_count="$6"
    local tor_services="$7"
    local dns_services="$8"
    local mesh_services="$9"

    local total=$((tor_count + dns_count + mesh_count))

    cat > "$output_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Services Status - $hostname</title>
<style>
$(get_kisstheme_css)
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="header-info">
            <h1>Distribution Status Report</h1>
            <div class="header-meta">
                <span class="meta-item">$hostname</span>
                <span class="meta-item">$timestamp</span>
            </div>
        </div>
        <div class="score-badge">
            $total
            <span class="score-label">Published Spaces</span>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-badge">
            <div class="stat-value">$tor_count</div>
            <div class="stat-label">Tor Services</div>
        </div>
        <div class="stat-badge">
            <div class="stat-value">$dns_count</div>
            <div class="stat-label">DNS/SSL Vhosts</div>
        </div>
        <div class="stat-badge">
            <div class="stat-value">$mesh_count</div>
            <div class="stat-label">Mesh Services</div>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Tor Hidden Services</h3>
        </div>
        <div class="card-body">
            $tor_services
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">DNS/SSL Services</h3>
        </div>
        <div class="card-body">
            $dns_services
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Mesh Services</h3>
        </div>
        <div class="card-body">
            $mesh_services
        </div>
    </div>

    <footer>
        Generated by SecuBox Report Generator v1.0 | <a href="/cgi-bin/luci/admin/secubox/reporter">LuCI Dashboard</a>
    </footer>
</div>
</body>
</html>
EOF
}
