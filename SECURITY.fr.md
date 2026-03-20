# Politique de Sécurité

🌐 **Langues :** [English](SECURITY.md) | Français | [中文](SECURITY.zh.md)

## Politique de Divulgation de Sécurité SecuBox

Ce document décrit la politique de sécurité du firmware SecuBox, en conformité avec
les exigences de l'**Article 13 §6 du Cyber Resilience Act (CRA) de l'UE** pour les produits de Classe I.

**Fabricant :** CyberMind Produits SASU
**Contact :** Gérald Kerma, Notre-Dame-du-Cruet, Savoie, France
**Site Web :** https://cybermind.fr | https://secubox.in

---

## Versions Supportées

| Version | Statut de Support | Fin de Support |
|---------|-------------------|----------------|
| 1.0.x   | ✅ Actuelle (Beta) | Développement actif |
| 0.19.x  | ✅ LTS        | Mars 2027 |
| 0.18.x  | ⚠️ Sécurité uniquement | Septembre 2026 |
| < 0.18  | ❌ Fin de Vie        | Non supporté |

### Version Beta v1.0.0

La version Beta v1.0.0 est maintenant disponible pour les tests de sécurité. Voir [BETA-RELEASE.md](BETA-RELEASE.md) pour :
- Vue d'ensemble de la surface d'attaque
- Cibles à haute valeur
- Points faibles connus (divulgation intentionnelle)
- Périmètre du bug bounty et directives de signalement

**Politique de support :**
- **Actuelle :** Toutes les corrections de bugs et patches de sécurité
- **LTS (Support à Long Terme) :** Patches de sécurité critiques uniquement, 18 mois
- **Sécurité uniquement :** Vulnérabilités critiques uniquement, 6 mois après la prochaine version majeure
- **Fin de Vie :** Aucune mise à jour, mise à niveau fortement recommandée

---

## Signaler une Vulnérabilité

Nous prenons les vulnérabilités de sécurité au sérieux. Si vous découvrez un problème de sécurité,
veuillez le signaler de manière responsable.

### Contact Principal

**Email :** security@cybermind.fr

**Clé PGP :** [0xABCD1234](https://secubox.in/pgp/security-key.asc)
**Empreinte :** `1234 5678 9ABC DEF0 1234 5678 9ABC DEF0 1234 5678`

### Contact Alternatif

Pour les vulnérabilités critiques nécessitant une attention immédiate :
- **Téléphone :** +33 (0)4 79 XX XX XX (heures ouvrables françaises)
- **Signal :** Disponible sur demande par email

### Communication Chiffrée

Nous **recommandons fortement** l'utilisation du chiffrement PGP pour les rapports de vulnérabilité.
Notre clé publique est disponible sur :
- https://secubox.in/pgp/security-key.asc
- https://keys.openpgp.org (rechercher : security@cybermind.fr)

### Que Fournir

Veuillez inclure :
1. **Description :** Description claire de la vulnérabilité
2. **Impact :** Impact potentiel sur la sécurité (confidentialité, intégrité, disponibilité)
3. **Versions affectées :** Quelles versions de SecuBox sont concernées
4. **Étapes de reproduction :** Instructions étape par étape pour reproduire
5. **Preuve de concept :** Code, logs ou captures d'écran si applicable
6. **Correction suggérée :** Si vous en avez une (optionnel)

### Délais de Réponse

| Phase | Délai |
|-------|-------|
| Accusé de réception | Sous 48 heures |
| Triage initial | Sous 5 jours ouvrables |
| Mise à jour du statut | Tous les 7 jours pendant l'investigation |
| Développement du correctif | Selon la sévérité (voir ci-dessous) |
| Divulgation publique | 90 jours après le correctif, ou coordonnée |

**Délai de correction selon la sévérité :**
- **Critique (CVSS 9.0+) :** 7 jours
- **Haute (CVSS 7.0-8.9) :** 30 jours
- **Moyenne (CVSS 4.0-6.9) :** 60 jours
- **Basse (CVSS < 4.0) :** Prochaine version régulière

---

## Software Bill of Materials (SBOM)

Comme requis par l'Annexe I du CRA, nous publions des SBOM en format lisible par machine pour toutes les versions.

### Emplacement du SBOM

Les SBOM sont joints à chaque Release GitHub :
- **CycloneDX 1.6 :** `secubox-VERSION.cdx.json`
- **SPDX 2.3 :** `secubox-VERSION.spdx.json`
- **Rapport CVE :** `secubox-VERSION-cve-report.json`
- **Checksums :** `checksums.sha256`

**Lien direct :** https://github.com/cybermind/secubox/releases/latest

### Contenu du SBOM

Notre SBOM inclut :
- Tous les paquets de base OpenWrt
- Les paquets personnalisés SecuBox et leurs dépendances
- Les modules noyau et blobs firmware
- Les bibliothèques cryptographiques et versions
- Les informations de licence (identifiants SPDX)
- Les identifiants PURL (Package URL) pour chaque composant

### Vérification de l'Intégrité du SBOM

```bash
# Télécharger le SBOM et les checksums
wget https://github.com/cybermind/secubox/releases/latest/download/secubox-0.20.cdx.json
wget https://github.com/cybermind/secubox/releases/latest/download/checksums.sha256

# Vérifier le checksum
sha256sum -c checksums.sha256 --ignore-missing
```

---

## Divulgation de Vulnérabilité (VEX)

Nous utilisons des documents **Vulnerability Exploitability eXchange (VEX)** pour communiquer
le statut des CVE affectant les composants SecuBox.

### Politique VEX

Voir [docs/vex-policy.md](docs/vex-policy.md) pour notre politique complète de gestion VEX.

**Définitions des statuts :**
- `not_affected` : Le CVE n'affecte pas SecuBox (composant non utilisé, conditions non remplies)
- `affected` : Le CVE affecte SecuBox, correctif en cours
- `fixed` : CVE corrigé dans la version spécifiée
- `under_investigation` : Analyse en cours

Les documents VEX sont publiés avec les releases :
- `secubox-VERSION.vex.json` (format CycloneDX VEX)

---

## Déclaration de Conformité CRA

### Cyber Resilience Act de l'UE — Déclaration Classe I

SecuBox est un **produit de Classe I** selon le Cyber Resilience Act de l'UE (Règlement 2024/XXX),
car c'est un routeur/appliance VPN avec des fonctions de connectivité réseau.

**Statut de conformité :**
- ✅ SBOM publié en format lisible par machine (CycloneDX + SPDX)
- ✅ Contact de divulgation de vulnérabilité établi
- ✅ Mécanisme de mise à jour de sécurité implémenté (opkg + secubox-update)
- ✅ Configuration sécurisée par défaut
- ⏳ Certification ANSSI CSPN : En cours (cible T3 2026)

### Parcours de Certification

Nous poursuivons la certification **ANSSI CSPN (Certification de Sécurité de Premier Niveau)**
pour SecuBox, avec une finalisation prévue au T3 2026.

**Périmètre de certification :**
- Fonctionnalité pare-feu
- Implémentation VPN (WireGuard)
- Détection d'intrusion (intégration CrowdSec)
- Chaîne de démarrage sécurisé
- Vérification d'intégrité des mises à jour

---

## Architecture de Sécurité

### Défense en Profondeur

SecuBox implémente plusieurs couches de sécurité :

1. **Segmentation Réseau :** Isolation VLAN, séparation réseau invité
2. **Protection WAF :** Pare-feu applicatif web basé sur mitmproxy
3. **Détection d'Intrusion :** Renseignement sur les menaces communautaire CrowdSec
4. **VPN Chiffré :** WireGuard avec cryptographie moderne
5. **Contrôle d'Accès :** Portail SSO avec support MFA
6. **Journalisation d'Audit :** Journalisation complète des événements de sécurité

### Souveraineté des Données

SecuBox inclut une **Passerelle IA** qui applique la classification des données :
- **LOCAL_ONLY :** Les données sensibles (IPs, credentials) ne quittent jamais l'appareil
- **SANITIZED :** PII supprimés avant traitement cloud EU (Mistral)
- **CLOUD_DIRECT :** Requêtes génériques vers fournisseurs opt-in

Voir [documentation AI Gateway](docs/ai-gateway.md) pour plus de détails.

---

## Composants Tiers

SecuBox s'appuie sur :
- **OpenWrt :** GPL-2.0, https://openwrt.org
- **CrowdSec :** MIT, https://crowdsec.net
- **WireGuard :** GPL-2.0, https://wireguard.com
- **mitmproxy :** MIT, https://mitmproxy.org

Nous surveillons les avis de sécurité upstream et intégrons les patches rapidement.

---

## Pratiques de Développement Sécurisé

- **Revue de code :** Toutes les modifications nécessitent une revue par les pairs
- **Scan des dépendances :** Scan CVE automatisé dans la CI/CD
- **Génération SBOM :** Automatisée à chaque release
- **Builds reproductibles :** SOURCE_DATE_EPOCH appliqué
- **Releases signées :** (Planifié) Signatures cosign pour les releases

---

## Contact

- **Sécurité générale :** security@cybermind.fr
- **Support :** support@cybermind.fr
- **Commercial :** contact@cybermind.fr

**Adresse :**
CyberMind Produits SASU
Notre-Dame-du-Cruet
73130 Savoie, France

---

## Hall of Fame

Chercheurs en sécurité ayant divulgué des vulnérabilités de manière responsable :

| Chercheur | Date | Sévérité | Description |
|-----------|------|----------|-------------|
| *Votre nom ici* | — | — | — |

Nous remercions tous les contributeurs qui aident à rendre SecuBox plus sûr.

---

_Dernière mise à jour : 2026-03-15_
_Version du document : 1.1_
