# 🚨 ALERTE.DEPOT — Formulaire Citoyen de Signalement

> Dispositif KISS de dépôt d'alertes pour non-professionnels  
> Conforme **Loi Waserman n°2022-401** · **Directive UE 2019/1937**  
> Intégration **Gitea** native · QR Code d'attestation · RIB SEPA

---

## 🚀 Installation rapide

```bash
# Cloner / télécharger le projet
cd alerte_streamlit

# Installer les dépendances
pip install -r requirements.txt

# Configurer les secrets Gitea
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
nano .streamlit/secrets.toml   # renseigner vos valeurs

# Lancer l'application
streamlit run app.py
```

L'application sera disponible sur `http://localhost:8501`

---

## ⚙️ Configuration Gitea

### Créer un token API dans Gitea
1. Connectez-vous à votre instance Gitea
2. `Paramètres` → `Applications` → `Générer un token`
3. Permissions nécessaires : **Issues** (write) + **Contents** (write)
4. Copiez le token dans `.streamlit/secrets.toml`

### Créer le dépôt récepteur
```
gitea.votredomaine.fr/<owner>/alertes
```
Le dépôt peut être **privé** — seul l'accès API est nécessaire.

---

## 🗂️ Structure des signalements dans Gitea

Chaque signalement crée :
- **Une Issue** : titre = `🚨 [type] gravité — TOKEN`
- **Un fichier Markdown** : `signalements/YYYY/MM/TOKEN.md` (optionnel)
- **Un label** : `🚨 alerte` (créé automatiquement)

---

## 📋 Fonctionnalités

| Fonctionnalité | Détail |
|---|---|
| 🕵️ **Anonymat** | 3 modes : anonyme / pseudo / identité protégée |
| 🎲 **Pseudonyme** | Génération aléatoire ou personnalisé |
| 📂 **8 catégories** | Fraude, Santé, Environnement, RGPD, Travail... |
| ⚡ **4 niveaux de gravité** | Faible → Critique |
| 📡 **5 canaux légaux** | Interne, AFA, DDD, Parquet, Public |
| 🔑 **Token de suivi** | Généré et téléchargeable en QR code |
| 📱 **QR Attestation** | PNG téléchargeable, encodage ECC niveau H |
| 🏦 **QR SEPA EPC** | Virement pré-rempli, montant sélectionnable |
| 📄 **Export Markdown** | Signalement complet téléchargeable |
| 🌿 **Gitea** | Issues + fichiers .md dans le dépôt |

---

## 🔒 Cadre légal intégré

- **Loi Sapin II** (2016) : fondements du dispositif
- **Directive UE 2019/1937** : délais (7j accusé, 3 mois retour)
- **Loi Waserman n°2022-401** (vigueur 01/09/2022) :
  - Libre choix canal interne/externe
  - Suppression désintéressement obligatoire
  - Extension aux personnes morales (facilitateurs)

---

## 🏦 RIB — Soutien participatif

```
Bénéficiaire : Gérald Kerma
IBAN         : FR76 2823 3000 0100 4454 7823 788
BIC          : REVOFRP2
Banque       : Revolut Bank UAB — 10 av. Kléber, 75116 Paris
```

---

## 🐛 Déploiement production

```bash
# Avec Docker
docker build -t alerte-depot .
docker run -p 8501:8501 -v $(pwd)/.streamlit:/app/.streamlit alerte-depot

# Avec systemd (Linux)
# Voir alerte.service
```

---

*CyberMind.FR — Usage éducatif et démonstratif*
