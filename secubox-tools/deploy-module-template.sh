#!/bin/bash
# Template de déploiement standardisé pour modules SecuBox/System Hub
# Usage: ./deploy-module-template.sh <module-name>
#
# Exemple: ./deploy-module-template.sh system-hub

set -e  # Exit on error

# === Configuration ===
ROUTER="${ROUTER:-root@192.168.8.191}"
MODULE_NAME="${1}"
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Chemins
LOCAL_RESOURCES="$BASE_DIR/luci-app-$MODULE_NAME/htdocs/luci-static/resources"
LOCAL_ROOT="$BASE_DIR/luci-app-$MODULE_NAME/root"
REMOTE_RESOURCES="/www/luci-static/resources"
REMOTE_ROOT=""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === Functions ===

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  📦 Déploiement: $MODULE_NAME${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_prerequisites() {
    print_step "Vérification des prérequis..."

    # Vérifier que le module existe
    if [ ! -d "luci-app-$MODULE_NAME" ]; then
        print_error "Module luci-app-$MODULE_NAME non trouvé!"
        exit 1
    fi

    # Vérifier connectivité routeur
    if ! ssh -o ConnectTimeout=5 "$ROUTER" "exit" 2>/dev/null; then
        print_error "Impossible de se connecter à $ROUTER"
        exit 1
    fi

    print_success "Prérequis OK"
}

backup_remote() {
    print_step "Création backup sur le routeur..."

    BACKUP_DIR="/root/luci-backups/$(date +%Y%m%d-%H%M%S)"
    ssh "$ROUTER" "mkdir -p $BACKUP_DIR"

    # Backup view files
    if ssh "$ROUTER" "[ -d $REMOTE_RESOURCES/view/$MODULE_NAME ]" 2>/dev/null; then
        ssh "$ROUTER" "cp -r $REMOTE_RESOURCES/view/$MODULE_NAME $BACKUP_DIR/"
    fi

    # Backup module files
    if ssh "$ROUTER" "[ -d $REMOTE_RESOURCES/$MODULE_NAME ]" 2>/dev/null; then
        ssh "$ROUTER" "cp -r $REMOTE_RESOURCES/$MODULE_NAME $BACKUP_DIR/"
    fi

    # Backup RPCD
    if ssh "$ROUTER" "[ -f /usr/libexec/rpcd/luci.$MODULE_NAME ]" 2>/dev/null; then
        ssh "$ROUTER" "cp /usr/libexec/rpcd/luci.$MODULE_NAME $BACKUP_DIR/"
    fi

    print_success "Backup créé: $BACKUP_DIR"
}

deploy_js_files() {
    print_step "Déploiement fichiers JavaScript..."

    if [ -d "$LOCAL_RESOURCES/view/$MODULE_NAME" ]; then
        ssh "$ROUTER" "mkdir -p $REMOTE_RESOURCES/view/$MODULE_NAME"
        scp -q "$LOCAL_RESOURCES/view/$MODULE_NAME/"*.js "$ROUTER:$REMOTE_RESOURCES/view/$MODULE_NAME/" 2>/dev/null || true
        print_success "Fichiers JS vues déployés"
    fi

    if [ -d "$LOCAL_RESOURCES/$MODULE_NAME" ]; then
        if ls "$LOCAL_RESOURCES/$MODULE_NAME"/*.js >/dev/null 2>&1; then
            ssh "$ROUTER" "mkdir -p $REMOTE_RESOURCES/$MODULE_NAME"
            scp -q "$LOCAL_RESOURCES/$MODULE_NAME/"*.js "$ROUTER:$REMOTE_RESOURCES/$MODULE_NAME/" 2>/dev/null || true
            print_success "Scripts JS partagés déployés"
        fi
    fi
}

deploy_css_files() {
    print_step "Déploiement fichiers CSS..."

    if [ -d "$LOCAL_RESOURCES/$MODULE_NAME" ]; then
        ssh "$ROUTER" "mkdir -p $REMOTE_RESOURCES/$MODULE_NAME"
        scp -q "$LOCAL_RESOURCES/$MODULE_NAME/"*.css "$ROUTER:$REMOTE_RESOURCES/$MODULE_NAME/" 2>/dev/null || true
        print_success "Fichiers CSS déployés"
    fi
}

deploy_rpcd() {
    print_step "Déploiement backend RPCD..."

    RPCD_FILE="$LOCAL_ROOT/usr/libexec/rpcd/luci.$MODULE_NAME"
    if [ -f "$RPCD_FILE" ]; then
        scp -q "$RPCD_FILE" "$ROUTER:/usr/libexec/rpcd/" 2>/dev/null || true
        print_success "RPCD backend déployé"
    else
        print_warning "Pas de backend RPCD trouvé"
    fi
}

deploy_menu_acl() {
    print_step "Déploiement menu et ACL..."

    # Menu
    MENU_FILE="$LOCAL_ROOT/usr/share/luci/menu.d/luci-app-$MODULE_NAME.json"
    if [ -f "$MENU_FILE" ]; then
        ssh "$ROUTER" "mkdir -p /usr/share/luci/menu.d"
        scp -q "$MENU_FILE" "$ROUTER:/usr/share/luci/menu.d/" 2>/dev/null || true
        print_success "Menu déployé"
    fi

    # ACL
    ACL_FILE="$LOCAL_ROOT/usr/share/rpcd/acl.d/luci-app-$MODULE_NAME.json"
    if [ -f "$ACL_FILE" ]; then
        ssh "$ROUTER" "mkdir -p /usr/share/rpcd/acl.d"
        scp -q "$ACL_FILE" "$ROUTER:/usr/share/rpcd/acl.d/" 2>/dev/null || true
        print_success "ACL déployé"
    fi
}

fix_permissions() {
    print_step "Correction des permissions..."

    # RPCD = 755
    ssh "$ROUTER" "chmod 755 /usr/libexec/rpcd/luci.$MODULE_NAME 2>/dev/null" || true

    # CSS/JS = 644
    ssh "$ROUTER" "chmod 644 $REMOTE_RESOURCES/$MODULE_NAME/*.css 2>/dev/null" || true
    ssh "$ROUTER" "chmod 644 $REMOTE_RESOURCES/$MODULE_NAME/*.js 2>/dev/null" || true
    ssh "$ROUTER" "chmod 644 $REMOTE_RESOURCES/view/$MODULE_NAME/*.js 2>/dev/null" || true

    print_success "Permissions corrigées"
}

clear_cache() {
    print_step "Nettoyage du cache LuCI..."

    ssh "$ROUTER" "rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* 2>/dev/null" || true

    print_success "Cache nettoyé"
}

restart_services() {
    print_step "Redémarrage des services..."

    ssh "$ROUTER" "/etc/init.d/rpcd restart" >/dev/null 2>&1
    sleep 1
    ssh "$ROUTER" "/etc/init.d/uhttpd restart" >/dev/null 2>&1
    sleep 1

    print_success "Services redémarrés"
}

verify_deployment() {
    print_step "Vérification du déploiement..."

    # Vérifier ubus object
    if ssh "$ROUTER" "ubus list | grep -q luci.$MODULE_NAME" 2>/dev/null; then
        print_success "ubus object 'luci.$MODULE_NAME' détecté"
    else
        print_warning "ubus object 'luci.$MODULE_NAME' non trouvé"
    fi

    # Vérifier fichiers
    FILE_COUNT=$(ssh "$ROUTER" "find $REMOTE_RESOURCES -name '*$MODULE_NAME*' -type f | wc -l" 2>/dev/null)
    print_success "$FILE_COUNT fichiers déployés"
}

print_summary() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Déploiement terminé avec succès!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
    echo ""
    echo "1. Tester en mode privé (Ctrl+Shift+N):"
    echo -e "   ${BLUE}https://192.168.8.191/cgi-bin/luci/${NC}"
    echo ""
    echo "2. Vérifier console navigateur (F12):"
    echo "   - Onglet Console: pas d'erreurs"
    echo "   - Onglet Network: tous fichiers chargent (200)"
    echo ""
    echo "3. Tester fonctionnalités:"
    echo "   - Navigation entre pages"
    echo "   - Chargement des données"
    echo "   - Actions (boutons, formulaires)"
    echo ""
    echo "4. Tester responsive:"
    echo "   - Mode mobile (F12 > Toggle device toolbar)"
    echo "   - Dark/Light mode"
    echo ""
    echo -e "${YELLOW}🔧 Debug (si problème):${NC}"
    echo ""
    echo "# Vérifier ubus"
    echo "ssh $ROUTER 'ubus list | grep $MODULE_NAME'"
    echo "ssh $ROUTER 'ubus call luci.$MODULE_NAME getStatus'"
    echo ""
    echo "# Vérifier logs"
    echo "ssh $ROUTER 'logread | grep -i error | tail -20'"
    echo ""
    echo "# Rollback (si nécessaire)"
    echo "ssh $ROUTER 'ls -la /root/luci-backups/'"
    echo ""
}

# === Main Execution ===

main() {
    # Vérifier argument
    if [ -z "$MODULE_NAME" ]; then
        echo "Usage: $0 <module-name>"
        echo ""
        echo "Exemples:"
        echo "  $0 system-hub"
        echo "  $0 secubox"
        echo "  $0 netdata-dashboard"
        exit 1
    fi

    print_header
    check_prerequisites
    backup_remote
    deploy_js_files
    deploy_css_files
    deploy_rpcd
    deploy_menu_acl
    fix_permissions
    clear_cache
    restart_services
    verify_deployment
    print_summary
}

# Run main
main
