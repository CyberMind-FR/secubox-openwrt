# OpenWrt Package Makefile — zkp-hamiltonian
## Spécification complète des fichiers de packaging OpenWrt
### CyberMind.FR / SecuBox — Version 1.0

---

## Structure des fichiers de packaging

```
openwrt/
├── Makefile                           ← Package principal (bibliothèque + CLI)
├── luci-app-zkp/
│   └── Makefile                       ← Package LuCI interface
├── secubox-zkpd/
│   └── Makefile                       ← Package daemon
└── files/
    ├── etc/
    │   ├── config/
    │   │   └── secubox_zkp            ← Configuration UCI par défaut
    │   ├── init.d/
    │   │   └── secubox-zkpd           ← Script init.d
    │   └── secubox/
    │       └── zkp/
    │           └── init.sh            ← Script d'initialisation
    └── usr/
        └── share/
            └── secubox-zkp/
                └── README             ← Documentation embarquée
```

---

## Fichier 1 : Makefile principal (bibliothèque + CLI)

**Emplacement** : `openwrt/Makefile`

```makefile
# SPDX-License-Identifier: GPL-2.0-or-later
#
# zkp-hamiltonian — Zero-Knowledge Proof basé sur cycle hamiltonien
# CyberMind.FR / SecuBox
# Contact: gerald@cybermind.fr
#

include $(TOPDIR)/rules.mk

PKG_NAME        := zkp-hamiltonian
PKG_VERSION     := 0.1.0
PKG_RELEASE     := 1

# Source : dépôt local ou distant
# Option A : source locale (développement)
PKG_SOURCE_PROTO   := git
PKG_SOURCE_URL     := https://git.cybermind.fr/secubox/zkp-hamiltonian.git
PKG_SOURCE_VERSION := main
PKG_MIRROR_HASH    := skip

# Option B (décommenter pour release) :
# PKG_SOURCE        := $(PKG_NAME)-$(PKG_VERSION).tar.gz
# PKG_SOURCE_URL    := https://releases.cybermind.fr/secubox/
# PKG_HASH          := <sha256sum du tarball>

PKG_BUILD_DIR      := $(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)
PKG_INSTALL        := 1
PKG_BUILD_PARALLEL := 1

PKG_CONFIG_DEPENDS := \
    CONFIG_ZKP_USE_LIBSODIUM \
    CONFIG_ZKP_MAX_NODES \
    CONFIG_ZKP_SECURITY_LEVEL

PKG_LICENSE        := GPL-2.0-or-later
PKG_LICENSE_FILES  := LICENSE
PKG_MAINTAINER     := Gérald Kerma <gerald@cybermind.fr>

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

# ─── Définition des packages ────────────────────────────────────────────────

define Package/zkp-hamiltonian
    SECTION    := secubox
    CATEGORY   := SecuBox
    SUBMENU    := Authentication
    TITLE      := ZKP Hamiltonien — Bibliothèque et outils
    URL        := https://cybermind.fr/secubox/zkp
    DEPENDS    := +libsodium
    MENU       := 1
endef

define Package/zkp-hamiltonian/description
    Protocole de preuve à divulgation nulle de connaissance (Zero-Knowledge
    Proof) basé sur le problème NP-complet du cycle hamiltonien.
    Implémente la transformation NIZK Fiat-Shamir pour une authentification
    sans transmission de secret entre nœuds OpenWrt SecuBox.

    Ce package inclut :
    - Bibliothèque libzkp-hamiltonian.so
    - Outils CLI : zkp_keygen, zkp_prover, zkp_verifier
endef

define Package/zkp-hamiltonian/config
    source "$(SOURCE)/Config.in"
endef

# Package développement (headers)
define Package/zkp-hamiltonian-dev
    SECTION    := secubox
    CATEGORY   := SecuBox
    SUBMENU    := Authentication
    TITLE      := ZKP Hamiltonien — Headers de développement
    DEPENDS    := zkp-hamiltonian
endef

define Package/zkp-hamiltonian-dev/description
    Headers C pour intégrer zkp-hamiltonian dans d'autres modules SecuBox.
endef

# ─── Configuration CMake ────────────────────────────────────────────────────

CMAKE_OPTIONS += \
    -DOPENWRT_BUILD=ON \
    -DBUILD_TESTS=OFF \
    -DBUILD_TOOLS=ON \
    -DBUILD_SHARED_LIBS=ON \
    -DUSE_LIBSODIUM=ON \
    -DZKP_MAX_N=$(CONFIG_ZKP_MAX_NODES) \
    -DCMAKE_BUILD_TYPE=MinSizeRel

# Optimisations embarquées
TARGET_CFLAGS += -Os -ffunction-sections -fdata-sections -fomit-frame-pointer
TARGET_LDFLAGS += -Wl,--gc-sections

# ─── Installation ───────────────────────────────────────────────────────────

define Package/zkp-hamiltonian/install
    $(INSTALL_DIR) $(1)/usr/lib
    $(INSTALL_DIR) $(1)/usr/sbin
    $(INSTALL_DIR) $(1)/etc/secubox/zkp/prover
    $(INSTALL_DIR) $(1)/etc/secubox/zkp/verifier/trusted
    $(INSTALL_DIR) $(1)/etc/secubox/zkp/verifier/sessions
    $(INSTALL_DIR) $(1)/usr/share/secubox-zkp

    # Bibliothèque partagée
    $(CP) \
        $(PKG_INSTALL_DIR)/usr/lib/libzkp-hamiltonian.so* \
        $(1)/usr/lib/

    # Outils CLI
    $(INSTALL_BIN) \
        $(PKG_INSTALL_DIR)/usr/bin/zkp_keygen \
        $(1)/usr/sbin/
    $(INSTALL_BIN) \
        $(PKG_INSTALL_DIR)/usr/bin/zkp_prover \
        $(1)/usr/sbin/
    $(INSTALL_BIN) \
        $(PKG_INSTALL_DIR)/usr/bin/zkp_verifier \
        $(1)/usr/sbin/

    # Script d'initialisation
    $(INSTALL_BIN) ./files/etc/secubox/zkp/init.sh \
        $(1)/etc/secubox/zkp/init.sh

    # Documentation
    $(INSTALL_DATA) ./files/usr/share/secubox-zkp/README \
        $(1)/usr/share/secubox-zkp/README
endef

define Package/zkp-hamiltonian-dev/install
    $(INSTALL_DIR) $(1)/usr/include/zkp-hamiltonian

    $(CP) \
        $(PKG_INSTALL_DIR)/usr/include/zkp-hamiltonian/*.h \
        $(1)/usr/include/zkp-hamiltonian/
endef

# ─── Scripts UCI post-install ────────────────────────────────────────────────

define Package/zkp-hamiltonian/postinst
#!/bin/sh
# Post-installation : génération initiale si pas de clé existante

if [ ! -f /etc/secubox/zkp/prover/identity.graph ]; then
    logger -t secubox-zkp "Première installation : génération du graphe..."
    /etc/secubox/zkp/init.sh || {
        logger -t secubox-zkp "AVERTISSEMENT : génération automatique échouée."
        logger -t secubox-zkp "Lancez manuellement : /etc/secubox/zkp/init.sh"
    }
fi
endef

define Package/zkp-hamiltonian/prerm
#!/bin/sh
# Pré-désinstallation : arrêt du daemon si en cours

if [ -f /var/run/secubox-zkpd.pid ]; then
    kill $(cat /var/run/secubox-zkpd.pid) 2>/dev/null
fi
endef

# ─── Évaluation ─────────────────────────────────────────────────────────────

$(eval $(call BuildPackage,zkp-hamiltonian))
$(eval $(call BuildPackage,zkp-hamiltonian-dev))
```

---

## Fichier 2 : Config.in (menu Kconfig)

**Emplacement** : `openwrt/Config.in`

```kconfig
# Configuration du package zkp-hamiltonian

config ZKP_USE_LIBSODIUM
    bool "Utiliser libsodium pour les primitives cryptographiques"
    default y
    help
      Utilise libsodium pour SHA3-256 et la génération aléatoire sécurisée.
      Si désactivé, utilise OpenSSL (plus lourd mais disponible si libsodium absent).

config ZKP_MAX_NODES
    int "Nombre maximum de nœuds dans le graphe"
    range 20 128
    default 128
    help
      Taille maximale du graphe supportée à la compilation.
      Réduit la mémoire requise si votre cas d'usage n'excède pas 64 nœuds.
      Valeur recommandée pour production : 128 (permet n=50-80 confortablement).

config ZKP_SECURITY_LEVEL
    int "Niveau de sécurité cible en bits"
    range 80 256
    default 128
    help
      Niveau de sécurité λ du protocole.
      Affecte les vérifications de paramètres au runtime.
      128 : recommandé pour usage standard
      256 : recommandé pour données très sensibles (plus lent)

config ZKP_ENABLE_TIMING_PROTECTION
    bool "Activer les protections contre les attaques par timing"
    default y
    help
      Active les comparaisons en temps constant et les délais aléatoires
      pour prévenir les attaques par canal auxiliaire (timing side-channel).
      Légère pénalité de performance. Recommandé en production.

config ZKP_ENABLE_DEBUG_LOGS
    bool "Activer les logs de debug (ne pas utiliser en production)"
    default n
    help
      Active des logs verbeux incluant des informations sensibles.
      NE PAS ACTIVER EN PRODUCTION.
```

---

## Fichier 3 : Makefile daemon (secubox-zkpd)

**Emplacement** : `openwrt/secubox-zkpd/Makefile`

```makefile
# SPDX-License-Identifier: GPL-2.0-or-later
# secubox-zkpd — Daemon d'authentification ZKP pour SecuBox

include $(TOPDIR)/rules.mk

PKG_NAME    := secubox-zkpd
PKG_VERSION := 0.1.0
PKG_RELEASE := 1

# Même source que zkp-hamiltonian (sous-composant)
PKG_BUILD_DIR := $(BUILD_DIR)/zkp-hamiltonian-$(PKG_VERSION)

PKG_LICENSE      := GPL-2.0-or-later
PKG_MAINTAINER   := Gérald Kerma <gerald@cybermind.fr>

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Package/secubox-zkpd
    SECTION    := secubox
    CATEGORY   := SecuBox
    SUBMENU    := Authentication
    TITLE      := SecuBox ZKP Daemon
    URL        := https://cybermind.fr/secubox/zkp
    DEPENDS    := +zkp-hamiltonian +libuci +libopenssl
endef

define Package/secubox-zkpd/description
    Daemon réseau gérant les authentifications ZKP entre nœuds SecuBox.
    Gère les connexions entrantes, les sessions, les politiques de ban,
    et la journalisation syslog conforme ANSSI.
endef

CMAKE_OPTIONS += \
    -DOPENWRT_BUILD=ON \
    -DBUILD_DAEMON=ON \
    -DBUILD_TESTS=OFF \
    -DBUILD_TOOLS=OFF

define Package/secubox-zkpd/install
    $(INSTALL_DIR) $(1)/usr/sbin
    $(INSTALL_DIR) $(1)/etc/init.d
    $(INSTALL_DIR) $(1)/etc/config

    # Binaire du daemon
    $(INSTALL_BIN) \
        $(PKG_INSTALL_DIR)/usr/sbin/secubox-zkpd \
        $(1)/usr/sbin/secubox-zkpd

    # Script init.d (procd)
    $(INSTALL_BIN) \
        ./files/etc/init.d/secubox-zkpd \
        $(1)/etc/init.d/secubox-zkpd

    # Configuration UCI par défaut
    $(INSTALL_CONF) \
        ./files/etc/config/secubox_zkp \
        $(1)/etc/config/secubox_zkp
endef

define Package/secubox-zkpd/postinst
#!/bin/sh
/etc/init.d/secubox-zkpd enable
endef

define Package/secubox-zkpd/prerm
#!/bin/sh
/etc/init.d/secubox-zkpd stop
/etc/init.d/secubox-zkpd disable
endef

$(eval $(call BuildPackage,secubox-zkpd))
```

---

## Fichier 4 : Makefile LuCI

**Emplacement** : `openwrt/luci-app-zkp/Makefile`

```makefile
# SPDX-License-Identifier: Apache-2.0
# luci-app-zkp — Interface LuCI pour SecuBox ZKP

include $(TOPDIR)/rules.mk

LUCI_TITLE   := SecuBox ZKP Authentication Interface
LUCI_DESCRIPTION := Interface LuCI pour gérer le module d'authentification \
    Zero-Knowledge Proof dans SecuBox.
LUCI_DEPENDS := +secubox-zkpd +luci-base +luci-compat

PKG_LICENSE  := Apache-2.0
PKG_MAINTAINER := Gérald Kerma <gerald@cybermind.fr>

# Utiliser le build system LuCI standard
include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-zkp/description
    $(LUCI_DESCRIPTION)

    Fonctionnalités :
    - Tableau de bord d'authentification ZKP
    - Gestion des graphes publics (pairs de confiance)
    - Génération et rotation des clés
    - Journal d'authentification avec filtres
    - Configuration UCI complète
endef

# Le reste est géré par luci.mk automatiquement
$(eval $(call BuildPackage,luci-app-zkp))
```

---

## Fichier 5 : Configuration UCI par défaut

**Emplacement** : `openwrt/files/etc/config/secubox_zkp`

```uci
# SecuBox ZKP — Configuration par défaut
# Générée par secubox-zkpd v0.1.0
# Documentation : /usr/share/secubox-zkp/README

config zkp 'global'
    option enabled         '0'
    option identity        ''
    option graph_n         '50'
    option extra_ratio     '100'
    option log_level       'info'
    option initialized     '0'

config zkp 'network'
    option listen_port     '7890'
    option bind_addr       '0.0.0.0'
    option use_tls         '1'
    option timeout_ms      '5000'
    option max_attempts    '3'
    option ban_duration    '300'
    option session_ttl     '30'

config zkp 'security'
    option security_level  '128'
    option timing_protect  '1'
    option key_rotation_days '90'
    option nonce_cleanup_interval '60'
```

---

## Fichier 6 : Script init.d

**Emplacement** : `openwrt/files/etc/init.d/secubox-zkpd`

```sh
#!/bin/sh /etc/rc.common
# SecuBox ZKP Daemon — Script init.d pour OpenWrt (procd)
# CyberMind.FR

START=85
STOP=15
USE_PROCD=1

NAME=secubox-zkpd
PROG=/usr/sbin/secubox-zkpd
PIDFILE=/var/run/$NAME.pid

. /lib/functions.sh

validate_zkp_section() {
    uci_load_validate secubox_zkp zkp "$1" "$2" \
        'enabled:bool:0'         \
        'identity:string:'       \
        'graph_n:uinteger:50'    \
        'log_level:string:info'
}

validate_network_section() {
    uci_load_validate secubox_zkp network "$1" "$2" \
        'listen_port:port:7890'     \
        'bind_addr:ipaddr:0.0.0.0'  \
        'timeout_ms:uinteger:5000'  \
        'max_attempts:uinteger:3'   \
        'ban_duration:uinteger:300'
}

start_service() {
    local enabled identity graph_n log_level
    local listen_port bind_addr timeout_ms max_attempts ban_duration

    validate_zkp_section global || {
        logger -t $NAME "Configuration invalide dans secubox_zkp.global"
        return 1
    }

    [ "$enabled" = "0" ] && {
        logger -t $NAME "Module désactivé (enabled=0)"
        return 0
    }

    [ -z "$identity" ] && {
        logger -t $NAME "ERREUR : identity non configurée"
        return 1
    }

    validate_network_section network || {
        logger -t $NAME "Configuration réseau invalide"
        return 1
    }

    [ ! -f /etc/secubox/zkp/prover/identity.graph ] && {
        logger -t $NAME "Graphe absent, lancement de l'initialisation..."
        /etc/secubox/zkp/init.sh || {
            logger -t $NAME "ERREUR : initialisation échouée"
            return 1
        }
    }

    procd_open_instance
    procd_set_param command "$PROG" \
        --identity    "$identity"   \
        --port        "$listen_port" \
        --bind        "$bind_addr"  \
        --graph       /etc/secubox/zkp/prover/identity.graph \
        --key         /etc/secubox/zkp/prover/identity.key.enc \
        --trusted-dir /etc/secubox/zkp/verifier/trusted/ \
        --sessions    /etc/secubox/zkp/verifier/sessions/ \
        --timeout-ms  "$timeout_ms" \
        --max-attempts "$max_attempts" \
        --ban-duration "$ban_duration" \
        --log-level   "$log_level" \
        --pidfile     "$PIDFILE"

    procd_set_param pidfile "$PIDFILE"
    procd_set_param respawn \
        $((3600))   `# intervalle de respawn (s)` \
        $((5))      `# tentatives avant abandon`  \
        $((0))      `# délai minimum de fonctionnement (0=toujours)`

    procd_set_param stdout 1
    procd_set_param stderr 1

    # Rechargement si les fichiers de config changent
    procd_set_param file \
        /etc/config/secubox_zkp \
        /etc/secubox/zkp/prover/identity.graph

    procd_set_param limits core="0"   # pas de core dump
    procd_close_instance

    logger -t $NAME "Démarré sur $bind_addr:$listen_port (identity=$identity)"
}

stop_service() {
    logger -t $NAME "Arrêt du daemon"
}

reload_service() {
    logger -t $NAME "Rechargement de la configuration"
    stop
    start
}

service_triggers() {
    procd_add_reload_trigger "secubox_zkp"
}
```

---

## Fichier 7 : Script d'initialisation

**Emplacement** : `openwrt/files/etc/secubox/zkp/init.sh`

```sh
#!/bin/sh
# SecuBox ZKP — Initialisation du nœud
# Génère la paire (graphe public G, clé secrète H)
# CyberMind.FR

set -e

ZKP_BASE=/etc/secubox/zkp
ZKP_PROVER=$ZKP_BASE/prover
ZKP_VERIFIER=$ZKP_BASE/verifier

log() { logger -t secubox-zkp "$@"; echo "[secubox-zkp] $@" >&2; }

# Lecture de la configuration UCI
IDENTITY=$(uci -q get secubox_zkp.global.identity)
N=$(uci -q get secubox_zkp.global.graph_n || echo 50)
RATIO_CENTS=$(uci -q get secubox_zkp.global.extra_ratio || echo 100)

[ -z "$IDENTITY" ] && {
    IDENTITY=$(cat /proc/sys/kernel/hostname 2>/dev/null || echo "secubox-node")
    uci set secubox_zkp.global.identity="$IDENTITY"
    uci commit secubox_zkp
}

log "Initialisation pour $IDENTITY (n=$N, ratio=${RATIO_CENTS}%)"

# Création des répertoires
mkdir -p $ZKP_PROVER
mkdir -p $ZKP_VERIFIER/trusted
mkdir -p $ZKP_VERIFIER/sessions
chmod 700 $ZKP_PROVER
chmod 755 $ZKP_VERIFIER/trusted

# Génération de la paire (G, H)
RATIO_FLOAT=$(echo "$RATIO_CENTS" | awk '{printf "%.2f", $1/100}')

log "Génération du graphe (peut prendre quelques secondes)..."
if ! zkp_keygen \
        --nodes     "$N" \
        --ratio     "$RATIO_FLOAT" \
        --output    "$ZKP_PROVER/identity"; then
    log "ERREUR : zkp_keygen a échoué"
    exit 1
fi

# Vérification des fichiers générés
[ -f "$ZKP_PROVER/identity.graph" ] || { log "ERREUR : identity.graph absent"; exit 1; }
[ -f "$ZKP_PROVER/identity.key.enc" ] || { log "ERREUR : identity.key.enc absent"; exit 1; }

# Sécurisation des permissions
chmod 600 $ZKP_PROVER/identity.key.enc
chmod 644 $ZKP_PROVER/identity.graph

# Calcul du fingerprint (SHA256 du graphe public)
FINGERPRINT=$(sha256sum $ZKP_PROVER/identity.graph | cut -d' ' -f1)
echo "$FINGERPRINT" > $ZKP_PROVER/key.pub.fingerprint
chmod 644 $ZKP_PROVER/key.pub.fingerprint

# Mise à jour UCI
uci set secubox_zkp.global.initialized=1
uci commit secubox_zkp

log "Initialisation terminée."
log "Fingerprint du graphe public : $FINGERPRINT"
log "IMPORTANT : partagez $ZKP_PROVER/identity.graph avec vos pairs de confiance."
log "CONFIDENTIEL : $ZKP_PROVER/identity.key.enc ne doit JAMAIS être partagé."
```

---

## Commandes de build de référence

```sh
# === Préparer l'environnement de build OpenWrt ===

# 1. Cloner OpenWrt
git clone https://github.com/openwrt/openwrt.git
cd openwrt
git checkout v23.05.3   # version stable recommandée

# 2. Ajouter le feed SecuBox
echo "src-git secubox https://git.cybermind.fr/secubox/openwrt-feed.git" \
    >> feeds.conf.default

# 3. Mettre à jour les feeds
./scripts/feeds update -a
./scripts/feeds install -a

# 4. Configurer (activer zkp-hamiltonian dans menuconfig)
make menuconfig
# → SecuBox → Authentication → zkp-hamiltonian [M]
#                             → secubox-zkpd [M]
#                             → luci-app-zkp [M]

# 5. Build des packages uniquement
make package/zkp-hamiltonian/compile -j$(nproc) V=s
make package/secubox-zkpd/compile -j$(nproc) V=s
make package/luci-app-zkp/compile -j$(nproc) V=s
make package/index

# === Installation sur routeur cible ===

ROUTER=192.168.1.1
ARCH=arm_cortex-a7_neon-vfpv4  # adapter à votre cible

scp bin/packages/$ARCH/secubox/*.ipk root@$ROUTER:/tmp/
ssh root@$ROUTER << 'EOF'
    opkg update
    opkg install /tmp/zkp-hamiltonian_*.ipk
    opkg install /tmp/secubox-zkpd_*.ipk
    opkg install /tmp/luci-app-zkp_*.ipk

    # Configuration initiale
    uci set secubox_zkp.global.identity="$(hostname)"
    uci set secubox_zkp.global.enabled=1
    uci commit secubox_zkp

    # Génération des clés et démarrage
    /etc/secubox/zkp/init.sh
    /etc/init.d/secubox-zkpd enable
    /etc/init.d/secubox-zkpd start
EOF
```
