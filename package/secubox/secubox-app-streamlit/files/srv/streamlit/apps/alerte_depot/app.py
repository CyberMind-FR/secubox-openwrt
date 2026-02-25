# -*- coding: utf-8 -*-
"""
ALERTE.DEPOT - Plateforme de Signalement Anonyme
CyberMind.FR | Conforme Loi Waserman n°2022-401

Features:
- Anonymous submission (no auth required)
- Token-based tracking portal
- Admin dashboard (SecuBox Users auth)
"""

import streamlit as st
import os
import requests
import qrcode
import json
import random
import string
import hashlib
import subprocess
from datetime import datetime
from io import BytesIO
import base64
import fcntl

# ─── AUDIT TRAIL (BLOCKCHAIN) ───────────────────────────────────────────────────
AUDIT_CHAIN_FILE = "/srv/secubox/mesh/alertes-chain.json"

def add_audit_entry(action: str, token_hash: str, data: dict = None) -> bool:
    """Add an immutable entry to the audit chain"""
    try:
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "token_hash": token_hash[:16] + "...",
            "data": data or {},
            "prev_hash": ""
        }

        # Read existing chain
        chain = {"chain": [], "version": "1.0"}
        if os.path.exists(AUDIT_CHAIN_FILE):
            with open(AUDIT_CHAIN_FILE, 'r') as f:
                fcntl.flock(f, fcntl.LOCK_SH)
                chain = json.load(f)
                fcntl.flock(f, fcntl.LOCK_UN)

        # Calculate prev_hash from last entry
        if chain.get("chain"):
            last_entry = json.dumps(chain["chain"][-1], sort_keys=True)
            entry["prev_hash"] = hashlib.sha256(last_entry.encode()).hexdigest()[:16]

        # Add entry hash
        entry["hash"] = hashlib.sha256(
            json.dumps(entry, sort_keys=True).encode()
        ).hexdigest()[:16]

        chain["chain"].append(entry)

        # Write back
        os.makedirs(os.path.dirname(AUDIT_CHAIN_FILE), exist_ok=True)
        with open(AUDIT_CHAIN_FILE, 'w') as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            json.dump(chain, f, indent=2)
            fcntl.flock(f, fcntl.LOCK_UN)

        return True
    except Exception:
        return False

# ─── CONFIG PAGE ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="ALERTE.DEPOT",
    page_icon="🚨",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ─── CSS ────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
  .main .block-container { max-width: 780px; padding: 2rem 2rem 4rem; }

  .step-bar { display:flex; gap:8px; margin-bottom:28px; }
  .step { flex:1; height:6px; border-radius:3px; background:#e5e7eb; transition:all 0.3s; }
  .step.done { background:#10b981; }
  .step.active { background:#f59e0b; }

  .card {
    background:#fff; border:1px solid #e5e7eb;
    border-radius:16px; padding:24px 28px;
    margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);
  }
  .card-title { font-size:18px; font-weight:600; color:#111827; margin-bottom:4px; }
  .card-sub   { font-size:13px; color:#6b7280; margin-bottom:16px; }

  .token-box {
    background:#f0fdf4; border:2px solid #10b981;
    border-radius:12px; padding:20px; text-align:center;
    font-family:monospace; font-size:20px; font-weight:700;
    letter-spacing:4px; color:#065f46; margin:16px 0;
  }

  .status-badge {
    display:inline-block; padding:4px 12px; border-radius:20px;
    font-size:12px; font-weight:600; text-transform:uppercase;
  }
  .status-received { background:#fef3c7; color:#92400e; }
  .status-validated { background:#dbeafe; color:#1e40af; }
  .status-investigating { background:#fce7f3; color:#9d174d; }
  .status-resolved { background:#d1fae5; color:#065f46; }
  .status-rejected { background:#fee2e2; color:#991b1b; }

  .alert-info    { background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px 16px; font-size:13px; color:#1e40af; margin:10px 0; }
  .alert-warning { background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:14px 16px; font-size:13px; color:#c2410c; margin:10px 0; }
  .alert-success { background:#f0fdf4; border:1px solid #a7f3d0; border-radius:10px; padding:14px 16px; font-size:13px; color:#065f46; margin:10px 0; }

  #MainMenu { visibility:hidden; }
  footer    { visibility:hidden; }

  [data-testid="stSidebar"] { background:#1f2937; }
  [data-testid="stSidebar"] * { color:#e5e7eb !important; }
  [data-testid="stSidebar"] .stMarkdown h3 { color:#f59e0b !important; font-size:14px; }
</style>
""", unsafe_allow_html=True)

# ─── CONSTANTS ──────────────────────────────────────────────────────────────────
CATEGORIES = {
    "corruption": ("💰 Corruption", "Pots-de-vin, favoritisme, conflits d'intérêts"),
    "fraude": ("💸 Fraude", "Détournement de fonds, faux documents"),
    "securite": ("🏥 Sécurité", "Risques pour la santé/sécurité publique"),
    "discrimination": ("⚖️ Discrimination", "Traitement inégal basé sur critères protégés"),
    "harcelement": ("🚫 Harcèlement", "Harcèlement moral ou sexuel"),
    "environnement": ("🌿 Environnement", "Pollution, violations réglementaires"),
    "autre": ("📋 Autre", "Autres signalements d'intérêt public"),
}

SEVERITY_LEVELS = {
    "low": ("🔵", "Faible", "Impact limité"),
    "medium": ("🟡", "Modéré", "Impact significatif"),
    "high": ("🔴", "Élevé", "Intérêt public majeur"),
    "critical": ("🆘", "Critique", "Danger immédiat"),
}

STATUS_LABELS = {
    "received": ("📥 Reçu", "status-received"),
    "validated": ("✅ Validé", "status-validated"),
    "investigating": ("🔍 En cours", "status-investigating"),
    "resolved": ("✔️ Résolu", "status-resolved"),
    "rejected": ("❌ Rejeté", "status-rejected"),
}

PSEUDOS_ADJ = ["Brave","Discret","Vigilant","Courageux","Sage","Libre","Éveillé","Lucide","Ferme","Vif"]
PSEUDOS_NOM = ["Colombe","Lanterne","Sentinelle","Phare","Boussole","Flambeau","Bouclier","Témoin","Voix","Éclaireur"]

# ─── GITEA CONFIG ───────────────────────────────────────────────────────────────
try:
    GITEA_URL = st.secrets.get("gitea", {}).get("url", "") or os.environ.get("GITEA_URL", "")
    GITEA_TOKEN = st.secrets.get("gitea", {}).get("token", "") or os.environ.get("GITEA_TOKEN", "")
    GITEA_OWNER = st.secrets.get("gitea", {}).get("owner", "") or os.environ.get("GITEA_OWNER", "")
    GITEA_REPO = st.secrets.get("gitea", {}).get("repo", "") or os.environ.get("GITEA_REPO", "alertes-depot")
    GITEA_CONFIGURED = bool(GITEA_URL and GITEA_TOKEN)
except Exception:
    GITEA_URL = GITEA_TOKEN = GITEA_OWNER = GITEA_REPO = ""
    GITEA_CONFIGURED = False

# ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────────
def gen_pseudo():
    return f"{random.choice(PSEUDOS_ADJ)}_{random.choice(PSEUDOS_NOM)}_{random.randint(100,9999)}"

def gen_token():
    parts = [''.join(random.choices(string.ascii_uppercase + string.digits, k=4)) for _ in range(4)]
    return '-'.join(parts)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def make_qr(data: str) -> BytesIO:
    qr = qrcode.QRCode(version=2, box_size=6, border=3,
                        error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#065f46", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

# ─── GITEA CLIENT ───────────────────────────────────────────────────────────────
class GiteaClient:
    def __init__(self, base_url: str, token: str, owner: str, repo: str):
        self.base_url = base_url.rstrip('/')
        self.headers  = {"Authorization": f"token {token}", "Content-Type": "application/json"}
        self.owner    = owner
        self.repo     = repo

    def test_connection(self) -> tuple:
        try:
            r = requests.get(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}",
                headers=self.headers, timeout=5
            )
            if r.status_code == 200:
                return True, f"Connected to {r.json().get('full_name','?')}"
            return False, f"Error {r.status_code}"
        except Exception as e:
            return False, str(e)

    def create_issue(self, title: str, body: str, labels: list = None) -> tuple:
        payload = {"title": title, "body": body}
        if labels:
            payload["labels"] = labels
        try:
            r = requests.post(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues",
                headers=self.headers, json=payload, timeout=10
            )
            if r.status_code in (200, 201):
                data = r.json()
                return True, data.get("html_url", ""), data.get("number", 0)
            return False, f"Error {r.status_code}: {r.text[:200]}", 0
        except Exception as e:
            return False, str(e), 0

    def search_issues(self, query: str) -> list:
        """Search issues by title containing the query (token)"""
        try:
            r = requests.get(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues",
                headers=self.headers,
                params={"state": "all", "q": query},
                timeout=10
            )
            if r.status_code == 200:
                return r.json()
            return []
        except Exception:
            return []

    def get_issue(self, number: int) -> dict:
        """Get single issue by number"""
        try:
            r = requests.get(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues/{number}",
                headers=self.headers, timeout=10
            )
            if r.status_code == 200:
                return r.json()
            return {}
        except Exception:
            return {}

    def get_issue_comments(self, number: int) -> list:
        """Get comments on an issue"""
        try:
            r = requests.get(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues/{number}/comments",
                headers=self.headers, timeout=10
            )
            if r.status_code == 200:
                return r.json()
            return []
        except Exception:
            return []

    def add_comment(self, number: int, body: str) -> bool:
        """Add comment to issue"""
        try:
            r = requests.post(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues/{number}/comments",
                headers=self.headers,
                json={"body": body},
                timeout=10
            )
            return r.status_code in (200, 201)
        except Exception:
            return False

    def update_issue_labels(self, number: int, labels: list) -> bool:
        """Update issue labels"""
        try:
            r = requests.patch(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues/{number}",
                headers=self.headers,
                json={"labels": labels},
                timeout=10
            )
            return r.status_code == 200
        except Exception:
            return False

    def list_all_issues(self, state: str = "open") -> list:
        """List all issues"""
        try:
            r = requests.get(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/issues",
                headers=self.headers,
                params={"state": state, "limit": 100},
                timeout=10
            )
            if r.status_code == 200:
                return r.json()
            return []
        except Exception:
            return []

    def get_or_create_label(self, name: str, color: str) -> int:
        r = requests.get(
            f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/labels",
            headers=self.headers, timeout=5
        )
        if r.status_code == 200:
            for lbl in r.json():
                if lbl["name"] == name:
                    return lbl["id"]
        rc = requests.post(
            f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/labels",
            headers=self.headers,
            json={"name": name, "color": color}, timeout=5
        )
        if rc.status_code in (200, 201):
            return rc.json()["id"]
        return None

    def push_file(self, path: str, content: str, message: str) -> tuple:
        encoded = base64.b64encode(content.encode()).decode()
        r_get = requests.get(
            f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/contents/{path}",
            headers=self.headers, timeout=5
        )
        payload = {"message": message, "content": encoded}
        if r_get.status_code == 200:
            payload["sha"] = r_get.json().get("sha", "")
        try:
            r = requests.post(
                f"{self.base_url}/api/v1/repos/{self.owner}/{self.repo}/contents/{path}",
                headers=self.headers, json=payload, timeout=10
            )
            return r.status_code in (200, 201), ""
        except Exception as e:
            return False, str(e)

# ─── SECUBOX USERS AUTH ─────────────────────────────────────────────────────────
def authenticate_admin(username: str, password: str) -> tuple:
    """Authenticate via SecuBox Users RPCD API (HTTP)"""
    try:
        # Use HTTP API to call RPCD (works inside container)
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "call",
            "params": [
                "00000000000000000000000000000000",  # Anonymous session
                "luci.secubox-users",
                "authenticate",
                {"username": username, "password": password}
            ]
        }
        resp = requests.post("http://127.0.0.1/ubus", json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            # RPCD returns {"result": [0, {...}]} on success
            if data.get("result") and len(data["result"]) > 1:
                result = data["result"][1]
                if result.get("success"):
                    return True, result.get("username", username), result.get("token", "")
        return False, "", ""
    except Exception as e:
        return False, "", str(e)


# ─── SESSION STATE ──────────────────────────────────────────────────────────────
def init_state():
    defaults = {
        "mode": "submit",  # submit, track, admin
        "step": 1,
        "pseudo": gen_pseudo(),
        "token": gen_token(),
        "anon_mode": "pseudo",
        "category": "corruption",
        "severity": "medium",
        "description": "",
        "period": "",
        "location": "",
        "evidence_types": [],
        "contact_pseudo": "",
        "submitted": False,
        "gitea_url": None,
        "issue_number": 0,
        # Tracking
        "track_token": "",
        "track_result": None,
        # Admin
        "admin_logged_in": False,
        "admin_user": "",
        "admin_token": "",
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()

# ─── SIDEBAR ────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🚨 ALERTE.DEPOT")
    st.markdown("---")

    # Mode selector
    mode = st.radio(
        "Mode",
        ["🆕 Nouveau signalement", "🔍 Suivre mon dossier", "🔐 Administration"],
        index=["submit", "track", "admin"].index(st.session_state.mode),
        label_visibility="collapsed"
    )

    mode_map = {
        "🆕 Nouveau signalement": "submit",
        "🔍 Suivre mon dossier": "track",
        "🔐 Administration": "admin"
    }
    if mode_map.get(mode) != st.session_state.mode:
        st.session_state.mode = mode_map[mode]
        st.rerun()

    st.markdown("---")

    if GITEA_CONFIGURED:
        st.success(f"✅ Gitea: {GITEA_OWNER}/{GITEA_REPO}")
    else:
        st.warning("⚠️ Gitea non configuré")

    st.markdown("---")
    st.markdown("### 🧅 Accès Tor")
    st.markdown("""
**Maximum d'anonymat :**
```
i7j46m67zvdksfhddbq273yydpuo5xvewsl2fjl5zlycjyo4qelysnid.onion
```
*Utilisez Tor Browser*
    """)

    st.markdown("---")
    st.markdown("### ⚖️ Cadre légal")
    st.markdown("""
**Loi Waserman** n°2022-401
Anonymat garanti · RGPD

**Directive UE** 2019/1937
Accusé : **7 jours**
Retour : **3 mois**
    """)
    st.markdown("---")
    st.caption("🔒 CyberMind.FR")

# ═══════════════════════════════════════════════════════════════════════════════
# MODE: SUBMIT (Anonymous Submission)
# ═══════════════════════════════════════════════════════════════════════════════
if st.session_state.mode == "submit":

    st.markdown("# 🚨 Déposer une alerte")
    st.markdown("**Simple, anonyme, protégé par la loi.** Pas d'inscription requise.")

    # Progress bar
    steps_total = 4
    bar_html = '<div class="step-bar">'
    for i in range(1, steps_total + 1):
        cls = "done" if i < st.session_state.step else ("active" if i == st.session_state.step else "step")
        bar_html += f'<div class="step {cls}"></div>'
    bar_html += '</div>'
    st.markdown(bar_html, unsafe_allow_html=True)

    step_labels = ["① Identité", "② Catégorie", "③ Description", "④ Envoi"]
    st.markdown(f"**Étape {st.session_state.step} / {steps_total}** — {step_labels[st.session_state.step-1]}")
    st.markdown("---")

    # STEP 1: Identity
    if st.session_state.step == 1:
        st.markdown("""
<div class="card">
  <div class="card-title">👤 Comment voulez-vous déposer ?</div>
  <div class="card-sub">Vous êtes protégé(e) dans tous les cas par la loi.</div>
</div>
""", unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            if st.button("🕵️ **Anonyme**\nPseudo auto-généré",
                        use_container_width=True,
                        type="primary" if st.session_state.anon_mode == "anon" else "secondary"):
                st.session_state.anon_mode = "anon"
                st.session_state.pseudo = gen_pseudo()
                st.rerun()
        with col2:
            if st.button("🎭 **Pseudonyme**\nVotre alias personnalisé",
                        use_container_width=True,
                        type="primary" if st.session_state.anon_mode == "pseudo" else "secondary"):
                st.session_state.anon_mode = "pseudo"
                st.rerun()

        st.markdown("#### Votre pseudonyme")
        c1, c2 = st.columns([3, 1])
        with c1:
            st.session_state.pseudo = st.text_input(
                "Alias", value=st.session_state.pseudo, label_visibility="collapsed"
            )
        with c2:
            if st.button("🎲 Nouveau"):
                st.session_state.pseudo = gen_pseudo()
                st.rerun()

        st.markdown("""
<div class="alert-info">
ℹ️ <strong>Ce pseudonyme sera votre identifiant.</strong> Notez-le précieusement.
</div>
""", unsafe_allow_html=True)

        if st.button("➡️ Suivant", type="primary", use_container_width=True):
            if len(st.session_state.pseudo) >= 3:
                st.session_state.step = 2
                st.rerun()
            else:
                st.error("Pseudonyme trop court (min 3 caractères)")

    # STEP 2: Category
    elif st.session_state.step == 2:
        st.markdown("""
<div class="card">
  <div class="card-title">🏷️ Type de signalement</div>
</div>
""", unsafe_allow_html=True)

        cat_options = [f"{v[0]} — {k}" for k, v in CATEGORIES.items()]
        cat_selected = st.selectbox("Catégorie", cat_options)
        st.session_state.category = cat_selected.split(" — ")[1] if " — " in cat_selected else "autre"

        st.markdown("#### ⚡ Gravité")
        sev_cols = st.columns(4)
        for i, (code, (emoji, label, desc)) in enumerate(SEVERITY_LEVELS.items()):
            with sev_cols[i]:
                is_active = st.session_state.severity == code
                if st.button(f"{emoji}\n{label}", key=f"sev_{code}",
                            type="primary" if is_active else "secondary",
                            use_container_width=True):
                    st.session_state.severity = code
                    st.rerun()

        c1, c2 = st.columns(2)
        with c1:
            if st.button("⬅️ Retour", use_container_width=True):
                st.session_state.step = 1
                st.rerun()
        with c2:
            if st.button("➡️ Suivant", type="primary", use_container_width=True):
                st.session_state.step = 3
                st.rerun()

    # STEP 3: Description
    elif st.session_state.step == 3:
        st.markdown("""
<div class="card">
  <div class="card-title">📝 Décrivez les faits</div>
  <div class="card-sub">Écrivez simplement, comme à un ami de confiance.</div>
</div>
""", unsafe_allow_html=True)

        desc = st.text_area(
            "Description",
            value=st.session_state.description,
            height=200,
            placeholder="Décrivez ce que vous avez constaté..."
        )
        st.session_state.description = desc

        char_count = len(desc)
        color = "#10b981" if char_count >= 100 else "#f59e0b" if char_count >= 50 else "#ef4444"
        st.markdown(f"<span style='color:{color}'>{char_count} caractères</span>", unsafe_allow_html=True)

        st.markdown("---")
        c1, c2 = st.columns(2)
        with c1:
            st.session_state.period = st.text_input("📅 Quand ?", value=st.session_state.period,
                                                     placeholder="Ex: depuis janvier 2024")
        with c2:
            st.session_state.location = st.text_input("📍 Où ?", value=st.session_state.location,
                                                       placeholder="Ex: Lyon, France")

        c1, c2 = st.columns(2)
        with c1:
            if st.button("⬅️ Retour", use_container_width=True):
                st.session_state.step = 2
                st.rerun()
        with c2:
            if st.button("➡️ Finaliser", type="primary", use_container_width=True):
                if len(desc) >= 50:
                    st.session_state.step = 4
                    st.rerun()
                else:
                    st.error("Description trop courte (min 50 caractères)")

    # STEP 4: Summary + Send
    elif st.session_state.step == 4 and not st.session_state.submitted:
        st.markdown("""
<div class="card">
  <div class="card-title">✅ Récapitulatif</div>
</div>
""", unsafe_allow_html=True)

        cat_info = CATEGORIES.get(st.session_state.category, ("📋 Autre", ""))
        sev_info = SEVERITY_LEVELS.get(st.session_state.severity, ("🟡", "Modéré", ""))

        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"🎭 **Pseudonyme** : `{st.session_state.pseudo}`")
            st.markdown(f"🏷️ **Catégorie** : {cat_info[0]}")
        with col2:
            st.markdown(f"⚡ **Gravité** : {sev_info[0]} {sev_info[1]}")
            if st.session_state.period:
                st.markdown(f"📅 **Période** : {st.session_state.period}")

        st.markdown("📝 **Description** :")
        st.info(st.session_state.description[:300] + ("..." if len(st.session_state.description) > 300 else ""))

        consent = st.checkbox("✅ Je déclare agir de bonne foi et avoir des motifs raisonnables.")

        c1, c2 = st.columns(2)
        with c1:
            if st.button("⬅️ Modifier", use_container_width=True):
                st.session_state.step = 3
                st.rerun()
        with c2:
            send_btn = st.button("🚀 ENVOYER", type="primary", use_container_width=True, disabled=not consent)

        if send_btn and consent:
            ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            token = st.session_state.token
            token_hash = hash_token(token)

            cat_info = CATEGORIES.get(st.session_state.category, ("📋 Autre", ""))
            sev_info = SEVERITY_LEVELS.get(st.session_state.severity, ("🟡", "Modéré", ""))

            md_content = f"""# 🚨 Signalement #{token[:8]}

| Champ | Valeur |
|-------|--------|
| **Token** | `{token}` |
| **Token Hash** | `{token_hash[:16]}...` |
| **Pseudonyme** | `{st.session_state.pseudo}` |
| **Date** | {ts} |
| **Catégorie** | {cat_info[0]} |
| **Gravité** | {sev_info[0]} {sev_info[1]} |
| **Période** | {st.session_state.period or 'Non précisé'} |
| **Lieu** | {st.session_state.location or 'Non précisé'} |
| **Statut** | 📥 REÇU |

## Description

{st.session_state.description}

---
*Loi Waserman n°2022-401 · Directive UE 2019/1937*
"""

            issue_title = f"🚨 [{cat_info[0]}] {sev_info[0]} {sev_info[1]} — {token}"

            gitea_url = ""
            issue_num = 0

            if GITEA_CONFIGURED:
                with st.spinner("📡 Envoi..."):
                    client = GiteaClient(GITEA_URL, GITEA_TOKEN, GITEA_OWNER, GITEA_REPO)
                    lbl_id = client.get_or_create_label("🚨 alerte", "#e11d48")
                    labels = [lbl_id] if lbl_id else []

                    ok, url, num = client.create_issue(issue_title, md_content, labels)
                    if ok:
                        gitea_url = url
                        issue_num = num

                        safe_token = token.replace('-','_')
                        file_path = f"signalements/{datetime.utcnow().strftime('%Y/%m')}/{safe_token}.md"
                        client.push_file(file_path, md_content, f"feat: signalement {token}")

            # Add audit trail entry
            add_audit_entry(
                action="submission",
                token_hash=token_hash,
                data={
                    "category": st.session_state.category,
                    "severity": st.session_state.severity,
                    "issue_number": issue_num,
                    "status": "received"
                }
            )

            st.session_state.submitted = True
            st.session_state.gitea_url = gitea_url
            st.session_state.issue_number = issue_num
            st.session_state.submit_ts = ts
            st.session_state.md_content = md_content
            st.rerun()

    # STEP 4: Confirmation
    elif st.session_state.step == 4 and st.session_state.submitted:
        token = st.session_state.token
        ts = st.session_state.get("submit_ts", "")

        st.markdown("""
<div class="alert-success">
🎉 <strong>Signalement déposé avec succès !</strong>
Conservez votre token de suivi.
</div>
""", unsafe_allow_html=True)

        st.markdown(f'<div class="token-box">🔑 {token}</div>', unsafe_allow_html=True)

        if st.session_state.gitea_url:
            st.markdown(f"📋 Issue #{st.session_state.issue_number}")

        st.caption(f"⏰ {ts}  ·  👤 {st.session_state.pseudo}")

        col_qr, col_info = st.columns([1, 2])
        with col_qr:
            qr_data = f"ALERTE:{token}"
            qr_buf = make_qr(qr_data)
            st.image(qr_buf, caption="📱 QR Code", width=160)
            qr_buf.seek(0)
            st.download_button("⬇️ QR Code", data=qr_buf, file_name=f"alerte-{token}.png", mime="image/png")

        with col_info:
            st.markdown(f"""
| | |
|---|---|
| 🔑 Token | `{token}` |
| 👤 Pseudo | `{st.session_state.pseudo}` |
| 📅 Date | {ts} |
| ⚖️ Protection | Loi Waserman |
""")

        st.markdown("---")
        st.markdown("#### ⏱️ Délais légaux")
        c1, c2 = st.columns(2)
        with c1:
            st.metric("Accusé de réception", "7 jours")
        with c2:
            st.metric("Retour d'information", "3 mois")

        st.markdown("---")
        if st.button("🔄 Nouveau signalement", use_container_width=True):
            for key in ["step","pseudo","token","category","severity","description",
                        "period","location","submitted","gitea_url","issue_number"]:
                if key in st.session_state:
                    del st.session_state[key]
            init_state()
            st.rerun()

# ═══════════════════════════════════════════════════════════════════════════════
# MODE: TRACK (Token-based lookup)
# ═══════════════════════════════════════════════════════════════════════════════
elif st.session_state.mode == "track":

    st.markdown("# 🔍 Suivre mon signalement")
    st.markdown("Entrez votre token de suivi pour consulter l'état de votre dossier.")

    track_token = st.text_input(
        "🔑 Token de suivi",
        value=st.session_state.track_token,
        placeholder="XXXX-XXXX-XXXX-XXXX"
    ).strip().upper()

    if st.button("🔍 Rechercher", type="primary", use_container_width=True):
        if len(track_token) >= 8:
            st.session_state.track_token = track_token

            if GITEA_CONFIGURED:
                with st.spinner("Recherche en cours..."):
                    client = GiteaClient(GITEA_URL, GITEA_TOKEN, GITEA_OWNER, GITEA_REPO)
                    issues = client.search_issues(track_token)

                    matching = [i for i in issues if track_token in i.get("title", "")]

                    if matching:
                        issue = matching[0]
                        comments = client.get_issue_comments(issue["number"])
                        st.session_state.track_result = {
                            "found": True,
                            "issue": issue,
                            "comments": comments
                        }
                    else:
                        st.session_state.track_result = {"found": False}
            else:
                st.error("Gitea non configuré")
            st.rerun()
        else:
            st.warning("Token trop court")

    # Display result
    if st.session_state.track_result:
        st.markdown("---")

        if st.session_state.track_result.get("found"):
            issue = st.session_state.track_result["issue"]
            comments = st.session_state.track_result.get("comments", [])

            st.markdown("### 📋 Votre dossier")

            # Extract status from labels
            labels = [l.get("name", "") for l in issue.get("labels", [])]
            status = "received"
            for lbl in labels:
                if "validé" in lbl.lower():
                    status = "validated"
                elif "cours" in lbl.lower() or "investigating" in lbl.lower():
                    status = "investigating"
                elif "résolu" in lbl.lower() or "resolved" in lbl.lower():
                    status = "resolved"
                elif "rejeté" in lbl.lower() or "rejected" in lbl.lower():
                    status = "rejected"

            status_info = STATUS_LABELS.get(status, ("📥 Reçu", "status-received"))
            st.markdown(f'<span class="status-badge {status_info[1]}">{status_info[0]}</span>',
                       unsafe_allow_html=True)

            # Issue info
            created = issue.get("created_at", "")[:10]
            updated = issue.get("updated_at", "")[:10]

            st.markdown(f"""
| | |
|---|---|
| 📅 Déposé | {created} |
| 🔄 Mis à jour | {updated} |
| 📝 N° dossier | #{issue.get("number", "?")} |
""")

            # Comments (investigator responses)
            if comments:
                st.markdown("### 💬 Messages de l'enquêteur")
                for c in comments:
                    author = c.get("user", {}).get("login", "Enquêteur")
                    body = c.get("body", "")
                    date = c.get("created_at", "")[:10]

                    # Filter internal notes (starting with [INTERNE])
                    if body.startswith("[INTERNE]"):
                        continue

                    st.markdown(f"**{author}** — {date}")
                    st.info(body)
            else:
                st.markdown("""
<div class="alert-info">
ℹ️ Aucun message de l'enquêteur pour le moment. Vous serez informé(e) de l'avancement.
</div>
""", unsafe_allow_html=True)

            # Add supplementary info
            st.markdown("---")
            st.markdown("### 📎 Ajouter des informations")

            supplement = st.text_area(
                "Message complémentaire",
                placeholder="Ajoutez des précisions, de nouvelles preuves..."
            )

            if st.button("📤 Envoyer", use_container_width=True):
                if supplement.strip():
                    client = GiteaClient(GITEA_URL, GITEA_TOKEN, GITEA_OWNER, GITEA_REPO)
                    msg = f"**📎 Information complémentaire du lanceur d'alerte**\n\n{supplement}"
                    if client.add_comment(issue["number"], msg):
                        st.success("Information ajoutée !")
                        st.session_state.track_result = None
                        st.rerun()
                    else:
                        st.error("Erreur lors de l'envoi")
        else:
            st.markdown("""
<div class="alert-warning">
⚠️ <strong>Aucun dossier trouvé</strong> pour ce token. Vérifiez votre saisie.
</div>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# MODE: ADMIN (SecuBox Users authenticated)
# ═══════════════════════════════════════════════════════════════════════════════
elif st.session_state.mode == "admin":

    if not st.session_state.admin_logged_in:
        st.markdown("# 🔐 Administration")
        st.markdown("Connexion réservée aux enquêteurs désignés.")

        with st.form("admin_login"):
            username = st.text_input("👤 Identifiant SecuBox")
            password = st.text_input("🔑 Mot de passe", type="password")
            submitted = st.form_submit_button("Se connecter", use_container_width=True)

            if submitted:
                if username and password:
                    with st.spinner("Authentification..."):
                        success, user, token = authenticate_admin(username, password)
                        if success:
                            st.session_state.admin_logged_in = True
                            st.session_state.admin_user = user
                            st.session_state.admin_token = token
                            st.rerun()
                        else:
                            st.error("❌ Identifiants incorrects")
                else:
                    st.warning("Remplissez tous les champs")

    else:
        # Logged in admin view
        st.markdown(f"# 🔐 Administration")
        st.markdown(f"Connecté : **{st.session_state.admin_user}**")

        if st.button("🚪 Déconnexion"):
            st.session_state.admin_logged_in = False
            st.session_state.admin_user = ""
            st.session_state.admin_token = ""
            st.rerun()

        st.markdown("---")

        if not GITEA_CONFIGURED:
            st.error("Gitea non configuré")
        else:
            client = GiteaClient(GITEA_URL, GITEA_TOKEN, GITEA_OWNER, GITEA_REPO)

            # Tabs for different views
            tab_open, tab_all, tab_stats = st.tabs(["📬 En cours", "📋 Tous", "📊 Stats"])

            with tab_open:
                st.markdown("### 📬 Signalements en cours")
                issues = client.list_all_issues(state="open")

                if issues:
                    for issue in issues:
                        with st.expander(f"#{issue['number']} — {issue['title'][:60]}..."):
                            st.markdown(issue.get("body", "")[:500] + "...")

                            # Status update
                            labels = [l.get("name", "") for l in issue.get("labels", [])]
                            current_status = "received"
                            for lbl in labels:
                                if "validé" in lbl.lower():
                                    current_status = "validated"
                                elif "cours" in lbl.lower():
                                    current_status = "investigating"

                            col1, col2 = st.columns(2)
                            with col1:
                                new_status = st.selectbox(
                                    "Statut",
                                    ["received", "validated", "investigating", "resolved", "rejected"],
                                    index=["received", "validated", "investigating", "resolved", "rejected"].index(current_status),
                                    key=f"status_{issue['number']}"
                                )
                            with col2:
                                if st.button("💾 Mettre à jour", key=f"update_{issue['number']}"):
                                    # Update labels
                                    status_labels = {
                                        "received": "📥 reçu",
                                        "validated": "✅ validé",
                                        "investigating": "🔍 en cours",
                                        "resolved": "✔️ résolu",
                                        "rejected": "❌ rejeté"
                                    }
                                    label_id = client.get_or_create_label(
                                        status_labels[new_status],
                                        {"received": "#fef3c7", "validated": "#dbeafe",
                                         "investigating": "#fce7f3", "resolved": "#d1fae5",
                                         "rejected": "#fee2e2"}.get(new_status, "#e5e7eb")
                                    )
                                    if label_id:
                                        client.update_issue_labels(issue['number'], [label_id])
                                        # Audit trail for status change
                                        title = issue.get("title", "")
                                        token_match = title.split("—")[-1].strip() if "—" in title else ""
                                        if token_match:
                                            add_audit_entry(
                                                action="status_change",
                                                token_hash=hashlib.sha256(token_match.encode()).hexdigest(),
                                                data={
                                                    "issue_number": issue['number'],
                                                    "from_status": current_status,
                                                    "to_status": new_status,
                                                    "actor": st.session_state.admin_user
                                                }
                                            )
                                        st.success("Statut mis à jour !")

                            # Add response
                            st.markdown("---")
                            response = st.text_area(
                                "Réponse au lanceur d'alerte",
                                key=f"resp_{issue['number']}",
                                placeholder="Votre message sera visible par le lanceur d'alerte..."
                            )
                            internal = st.text_area(
                                "Note interne (non visible)",
                                key=f"internal_{issue['number']}",
                                placeholder="Notes pour l'équipe..."
                            )

                            if st.button("📤 Envoyer", key=f"send_{issue['number']}"):
                                if response.strip():
                                    msg = f"**Réponse de l'enquêteur** ({st.session_state.admin_user})\n\n{response}"
                                    client.add_comment(issue['number'], msg)
                                if internal.strip():
                                    msg = f"[INTERNE] {st.session_state.admin_user}: {internal}"
                                    client.add_comment(issue['number'], msg)
                                st.success("Envoyé !")
                                st.rerun()
                else:
                    st.info("Aucun signalement en cours")

            with tab_all:
                st.markdown("### 📋 Tous les signalements")
                all_issues = client.list_all_issues(state="all")

                for issue in all_issues[:20]:
                    state_emoji = "🟢" if issue.get("state") == "open" else "⚫"
                    st.markdown(f"{state_emoji} **#{issue['number']}** — {issue['title'][:50]}...")

            with tab_stats:
                st.markdown("### 📊 Statistiques")

                all_issues = client.list_all_issues(state="all")
                open_count = len([i for i in all_issues if i.get("state") == "open"])
                closed_count = len([i for i in all_issues if i.get("state") == "closed"])

                c1, c2, c3 = st.columns(3)
                with c1:
                    st.metric("Total", len(all_issues))
                with c2:
                    st.metric("En cours", open_count)
                with c3:
                    st.metric("Résolus", closed_count)
