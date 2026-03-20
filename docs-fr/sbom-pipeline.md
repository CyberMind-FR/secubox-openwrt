# Documentation du Pipeline SBOM SecuBox

🌐 **Langues :** [English](../docs/sbom-pipeline.md) | Français | [中文](../docs-zh/sbom-pipeline.md)

## Vue d'ensemble

Le pipeline SBOM (Software Bill of Materials) SecuBox génère des SBOMs conformes aux normes CycloneDX 1.6 et SPDX 2.3 pour la conformité à l'Annexe I du Cyber Resilience Act (CRA) européen.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Pipeline SBOM SecuBox                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │   Source A  │    │   Source B  │    │   Source C  │    │   Source D  │  │
│   │  OpenWrt    │    │   SecuBox   │    │   Rootfs    │    │  Firmware   │  │
│   │  Natif      │    │   Feed      │    │   Scan      │    │   Image     │  │
│   │             │    │             │    │             │    │             │  │
│   │ Packages    │    │ Makefiles   │    │ Scan Syft   │    │ Scan Syft   │  │
│   │ .manifest   │    │ vars PKG_*  │    │ dir:rootfs  │    │ file:*.bin  │  │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│          │                  │                  │                  │         │
│          └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                         │
│                                    ▼                                         │
│                          ┌─────────────────┐                                 │
│                          │ Fusion & Dédup  │                                 │
│                          │   (jq fusion)   │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                 │
│                          │   Validation    │                                 │
│                          │ cyclonedx-cli   │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                    ┌──────────────┼──────────────┐                           │
│                    ▼              ▼              ▼                           │
│             ┌───────────┐  ┌───────────┐  ┌───────────┐                      │
│             │ Scan CVE  │  │Rapport CRA│  │ Checksums │                      │
│             │  (grype)  │  │  Résumé   │  │ sha256sum │                      │
│             └───────────┘  └───────────┘  └───────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Fichiers de sortie :
├── secubox-VERSION.cdx.json          # CycloneDX 1.6 (principal)
├── secubox-VERSION.spdx.json         # SPDX 2.3 (alternatif)
├── secubox-VERSION-cve-report.json   # Résultats du scan CVE Grype
├── secubox-VERSION-cve-table.txt     # Table CVE lisible
├── secubox-VERSION-cra-summary.txt   # Résumé de conformité CRA
├── sbom-warnings.txt                 # Avertissements métadonnées manquantes
└── checksums.sha256                  # Sommes de contrôle d'intégrité
```

## Prérequis

### Versions minimales

| Outil | Version minimale | Utilisation |
|-------|------------------|-------------|
| OpenWrt | 22.03 | Support SBOM natif |
| Perl | 5.26+ | package-metadata.pl |
| jq | 1.6+ | Traitement JSON |
| Syft | 0.100+ | Scan du système de fichiers |
| Grype | 0.70+ | Scan CVE |
| cyclonedx-cli | 0.25+ | Validation SBOM |

### Configuration de l'environnement

```bash
# Vérifier les prérequis
./scripts/check-sbom-prereqs.sh

# Installer les outils SBOM (si absents)
# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin

# Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ~/.local/bin

# cyclonedx-cli
curl -sSfL -o ~/.local/bin/cyclonedx-cli \
  https://github.com/CycloneDX/cyclonedx-cli/releases/latest/download/cyclonedx-linux-x64
chmod +x ~/.local/bin/cyclonedx-cli

# Ajouter au PATH
export PATH="$HOME/.local/bin:$PATH"
```

### Configuration OpenWrt Kconfig

Activer la génération SBOM native dans `.config` :

```
CONFIG_JSON_CYCLONEDX_SBOM=y
CONFIG_COLLECT_KERNEL_DEBUG=n
```

## Utilisation

### Développement quotidien

```bash
# Génération SBOM complète (4 sources)
./scripts/sbom-generate.sh

# SBOM rapide depuis artefacts existants (sans reconstruction)
./scripts/sbom-generate.sh --version 0.20

# Mode hors ligne (sans réseau, utilise les bases de données en cache)
./scripts/sbom-generate.sh --offline

# Ignorer le scan CVE (plus rapide)
./scripts/sbom-generate.sh --no-cve
```

### Utilisation des cibles Makefile

```bash
# Build complet + SBOM
make sbom

# SBOM uniquement (sans reconstruction)
make sbom-quick

# Valider un SBOM existant
make sbom-validate

# Scan CVE uniquement
make sbom-scan

# Nettoyer les sorties SBOM
make sbom-clean

# Afficher l'aide
make sbom-help
```

### Audit des packages du Feed

```bash
# Vérifier tous les packages du feed SecuBox pour métadonnées manquantes
./scripts/sbom-audit-feed.sh

# Sortie : feeds/secubox/MANIFEST.md
```

## Ajouter un nouveau package

Lors de l'ajout d'un nouveau package au feed SecuBox, assurez-vous de la compatibilité SBOM :

### Liste de vérification

- [ ] **PKG_NAME** défini
- [ ] **PKG_VERSION** défini
- [ ] **PKG_LICENSE** défini (identifiant SPDX)
- [ ] **PKG_HASH** défini (sha256)
- [ ] **PKG_SOURCE_URL** défini (optionnel mais recommandé)

### Exemple de Makefile

```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=my-package
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_SOURCE_URL:=https://github.com/example/my-package/archive
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_HASH:=a1b2c3d4e5f6...  # sha256sum de l'archive source

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

PKG_MAINTAINER:=Votre Nom <email@example.com>
```

### Calculer PKG_HASH

```bash
# Télécharger et hasher la source
wget https://example.com/package-1.0.0.tar.gz
sha256sum package-1.0.0.tar.gz

# Ou utiliser l'assistant de téléchargement OpenWrt
make package/my-package/download V=s
sha256sum dl/my-package-1.0.0.tar.gz
```

## Correspondance Annexe I CRA

| Exigence CRA | Implémentation SBOM |
|--------------|---------------------|
| Art. 13(5) - Identification des composants | `components[].purl` (Package URL) |
| Art. 13(5) - Identification du fournisseur | `metadata.component.supplier` |
| Art. 13(5) - Information de version | `components[].version` |
| Art. 13(5) - Dépendances | Tableau `dependencies[]` |
| Art. 13(5) - Information de licence | `components[].licenses[]` |
| Art. 13(6) - Format lisible par machine | CycloneDX 1.6 JSON + SPDX 2.3 |
| Art. 13(6) - Divulgation des vulnérabilités | SECURITY.md + documents VEX |
| Art. 13(7) - Identification unique | PURL + UUID `serialNumber` |
| Annexe I(2) - Vérification d'intégrité | `hashes[]` avec SHA-256 |

## Soumission ANSSI CSPN

Pour la certification CSPN, incluez les éléments suivants dans votre dossier :

### Documents requis

1. **Fichiers SBOM**
   - `secubox-VERSION.cdx.json` (principal)
   - `secubox-VERSION.spdx.json` (alternatif)

2. **Provenance**
   - `checksums.sha256` (vérification d'intégrité)
   - Hash du commit Git depuis les métadonnées

3. **Analyse des vulnérabilités**
   - `secubox-VERSION-cve-report.json`
   - `secubox-VERSION-cra-summary.txt`

4. **Documentation du processus**
   - Ce document (`docs/sbom-pipeline.md`)
   - `SECURITY.md` (politique de divulgation des vulnérabilités)

### Liste de vérification pour la soumission

- [ ] Tous les composants ont PKG_HASH et PKG_LICENSE
- [ ] Le SBOM est validé avec cyclonedx-cli
- [ ] Aucune CVE Critique non traitée
- [ ] Le document VEX explique les risques acceptés
- [ ] Reproductibilité SOURCE_DATE_EPOCH vérifiée

## Dépannage

### Erreurs courantes

#### "OpenWrt version < 22.03"

Le support SBOM CycloneDX natif nécessite OpenWrt 22.03 ou ultérieur.

**Solution :** Mettez à jour votre fork OpenWrt ou utilisez `sbom-generate.sh` sans support natif (il se rabattra sur l'analyse des Makefiles).

#### "package-metadata.pl not found"

Le script de génération SBOM est absent de votre checkout OpenWrt.

**Solution :**
```bash
git checkout origin/master -- scripts/package-metadata.pl
```

#### "syft: command not found"

Syft n'est pas installé ou n'est pas dans le PATH.

**Solution :**
```bash
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
```

#### "SBOM validation failed"

Le SBOM généré contient des erreurs de schéma.

**Solution :**
1. Vérifiez `sbom-warnings.txt` pour les métadonnées manquantes
2. Corrigez les Makefiles avec PKG_HASH ou PKG_LICENSE manquants
3. Régénérez le SBOM

#### "Grype database update failed"

Problème de connectivité réseau ou limitation de débit.

**Solution :**
- Utilisez le mode `--offline` avec la base de données en cache
- Ou mettez à jour manuellement : `grype db update`

### Mode débogage

```bash
# Sortie verbeuse
DEBUG=1 ./scripts/sbom-generate.sh

# Conserver les fichiers intermédiaires
KEEP_TEMP=1 ./scripts/sbom-generate.sh
```

## Historique des versions

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 2026-03-04 | Implémentation initiale du pipeline |

---

_Maintenu par CyberMind Produits SASU_
_Contact : secubox@cybermind.fr_
