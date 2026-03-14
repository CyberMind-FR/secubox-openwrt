#!/bin/sh
# Gitea API helper functions

. /lib/functions.sh

# Get Gitea configuration
gitea_load_config() {
    config_load config-vault
    config_get GITEA_URL gitea url ""
    config_get GITEA_REPO gitea repo ""
    config_get GITEA_BRANCH gitea branch "main"

    # Token from main gitea config
    GITEA_TOKEN=$(uci -q get gitea.main.api_token)
}

# Create repository if not exists
gitea_ensure_repo() {
    gitea_load_config

    [ -z "$GITEA_URL" ] || [ -z "$GITEA_TOKEN" ] && return 1

    local repo_name=$(echo "$GITEA_REPO" | cut -d/ -f2)

    # Check if repo exists
    local exists=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: token $GITEA_TOKEN" \
        "$GITEA_URL/api/v1/repos/$GITEA_REPO")

    if [ "$exists" = "404" ]; then
        # Create repo
        curl -s -X POST "$GITEA_URL/api/v1/user/repos" \
            -H "Authorization: token $GITEA_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$repo_name\",
                \"description\": \"SecuBox Configuration Vault\",
                \"private\": true,
                \"auto_init\": true
            }"
    fi
}

# Push with authentication
gitea_push() {
    gitea_load_config

    local vault_path=$(uci -q get config-vault.global.vault_path)
    cd "$vault_path" || return 1

    # Set remote URL with token
    local auth_url=$(echo "$GITEA_URL" | sed "s|://|://oauth2:${GITEA_TOKEN}@|")
    git remote set-url origin "${auth_url}/${GITEA_REPO}.git"

    git push -u origin "$GITEA_BRANCH"
    local result=$?

    # Reset URL
    git remote set-url origin "${GITEA_URL}/${GITEA_REPO}.git"

    return $result
}
