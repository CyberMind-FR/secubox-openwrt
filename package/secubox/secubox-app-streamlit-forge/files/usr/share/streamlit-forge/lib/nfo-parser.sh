#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════════
#  NFO Parser Library - SecuBox Module Manifest Parser
#  Parses flat-file UCI-style .nfo manifests for Streamlit/MetaBlog apps
# ═══════════════════════════════════════════════════════════════════════════════

# Current section being parsed
_NFO_SECTION=""
_NFO_FILE=""
_NFO_HEREDOC=""
_NFO_HEREDOC_KEY=""

# ─────────────────────────────────────────────────────────────────────────────────
# Parse NFO file and export variables as NFO_<section>_<key>=value
# Usage: nfo_parse <file>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_parse() {
    _NFO_FILE="$1"
    [ ! -f "$_NFO_FILE" ] && return 1

    _NFO_SECTION=""
    _NFO_HEREDOC=""
    _NFO_HEREDOC_KEY=""

    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments (unless in heredoc)
        if [ -z "$_NFO_HEREDOC" ]; then
            case "$line" in
                ""|\#*|" "*\#*) continue ;;
            esac
        fi

        # Check for heredoc end
        if [ -n "$_NFO_HEREDOC" ]; then
            if [ "$line" = "$_NFO_HEREDOC" ]; then
                _NFO_HEREDOC=""
                _NFO_HEREDOC_KEY=""
            else
                # Append to heredoc value
                eval "_val=\"\$NFO_${_NFO_SECTION}_${_NFO_HEREDOC_KEY}\""
                if [ -n "$_val" ]; then
                    eval "NFO_${_NFO_SECTION}_${_NFO_HEREDOC_KEY}=\"\${_val}
\${line}\""
                else
                    eval "NFO_${_NFO_SECTION}_${_NFO_HEREDOC_KEY}=\"\${line}\""
                fi
            fi
            continue
        fi

        # Section header [section]
        case "$line" in
            \[*\])
                _NFO_SECTION=$(echo "$line" | sed 's/\[\(.*\)\]/\1/' | tr '-' '_')
                continue
                ;;
        esac

        # Skip if no section yet
        [ -z "$_NFO_SECTION" ] && continue

        # Key=value parsing
        case "$line" in
            *=*)
                key=$(echo "$line" | cut -d'=' -f1 | tr '-' '_')
                value=$(echo "$line" | cut -d'=' -f2-)

                # Check for heredoc start
                case "$value" in
                    \<\<*)
                        _NFO_HEREDOC=$(echo "$value" | sed 's/<<\(.*\)/\1/')
                        _NFO_HEREDOC_KEY="$key"
                        eval "NFO_${_NFO_SECTION}_${key}=\"\""
                        ;;
                    *)
                        # Clean value (remove surrounding quotes if present)
                        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
                        eval "NFO_${_NFO_SECTION}_${key}=\"\${value}\""
                        ;;
                esac
                ;;
        esac
    done < "$_NFO_FILE"

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────────
# Get NFO value
# Usage: nfo_get <section> <key> [default]
# ─────────────────────────────────────────────────────────────────────────────────
nfo_get() {
    local section=$(echo "$1" | tr '-' '_')
    local key=$(echo "$2" | tr '-' '_')
    local default="$3"

    eval "local val=\"\$NFO_${section}_${key}\""
    if [ -n "$val" ]; then
        echo "$val"
    else
        echo "$default"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────────
# Check if NFO section exists
# Usage: nfo_has_section <section>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_has_section() {
    local section=$(echo "$1" | tr '-' '_')
    local found=0

    set | grep -q "^NFO_${section}_" && found=1
    return $((1 - found))
}

# ─────────────────────────────────────────────────────────────────────────────────
# List all keys in a section
# Usage: nfo_list_keys <section>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_list_keys() {
    local section=$(echo "$1" | tr '-' '_')
    set | grep "^NFO_${section}_" | sed "s/^NFO_${section}_//" | cut -d'=' -f1
}

# ─────────────────────────────────────────────────────────────────────────────────
# Export NFO section to UCI
# Usage: nfo_to_uci <nfo_section> <uci_config> <uci_section>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_to_uci() {
    local nfo_section=$(echo "$1" | tr '-' '_')
    local uci_config="$2"
    local uci_section="$3"

    nfo_list_keys "$nfo_section" | while read key; do
        local val=$(nfo_get "$nfo_section" "$key")
        [ -z "$val" ] && continue

        # Skip heredoc markers and multi-line values for UCI
        case "$val" in
            *"
"*) continue ;;
        esac

        uci -q set "${uci_config}.${uci_section}.${key}=${val}"
    done
}

# ─────────────────────────────────────────────────────────────────────────────────
# Generate JSON from NFO
# Usage: nfo_to_json [sections...]
# ─────────────────────────────────────────────────────────────────────────────────
nfo_to_json() {
    local first_section=1
    local sections="$*"

    [ -z "$sections" ] && sections="identity description tags runtime dependencies exposure launcher settings dynamics mesh media"

    printf '{'

    for section in $sections; do
        section=$(echo "$section" | tr '-' '_')
        nfo_has_section "$section" || continue

        [ $first_section -eq 0 ] && printf ','
        first_section=0

        printf '"%s":{' "$section"

        local first_key=1
        nfo_list_keys "$section" | while read key; do
            local val=$(nfo_get "$section" "$key")
            [ -z "$val" ] && continue

            [ $first_key -eq 0 ] && printf ','
            first_key=0

            # Escape JSON special chars
            val=$(echo "$val" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' ')
            printf '"%s":"%s"' "$key" "$val"
        done

        printf '}'
    done

    printf '}\n'
}

# ─────────────────────────────────────────────────────────────────────────────────
# Validate NFO file
# Usage: nfo_validate <file>
# Returns: 0 if valid, 1 if errors
# ─────────────────────────────────────────────────────────────────────────────────
nfo_validate() {
    local file="$1"
    local errors=0

    [ ! -f "$file" ] && { echo "ERROR: File not found: $file"; return 1; }

    nfo_parse "$file" || { echo "ERROR: Failed to parse NFO file"; return 1; }

    # Required fields
    local required="identity_id identity_name identity_version runtime_type"
    for field in $required; do
        local section=$(echo "$field" | cut -d'_' -f1)
        local key=$(echo "$field" | cut -d'_' -f2-)
        local val=$(nfo_get "$section" "$key")

        if [ -z "$val" ]; then
            echo "ERROR: Missing required field: [$section] $key"
            errors=$((errors + 1))
        fi
    done

    # Validate runtime type
    local rtype=$(nfo_get runtime type)
    case "$rtype" in
        streamlit|metablog|hexo|static|python|node|docker) ;;
        *) echo "WARNING: Unknown runtime type: $rtype" ;;
    esac

    # Validate version format
    local version=$(nfo_get identity version)
    case "$version" in
        [0-9]*.[0-9]*.[0-9]*) ;;
        [0-9]*.[0-9]*) ;;
        *) echo "WARNING: Non-standard version format: $version" ;;
    esac

    return $errors
}

# ─────────────────────────────────────────────────────────────────────────────────
# Create NFO from template
# Usage: nfo_create <output_file> <app_id> <app_name> <type> [short_desc]
# ─────────────────────────────────────────────────────────────────────────────────
nfo_create() {
    local output="$1"
    local app_id="$2"
    local app_name="$3"
    local app_type="${4:-streamlit}"
    local short_desc="${5:-A SecuBox application}"
    local date=$(date "+%Y-%m-%d")

    local template
    case "$app_type" in
        streamlit) template="/usr/share/streamlit-forge/nfo-template.nfo" ;;
        metablog)  template="/usr/share/metablogizer/nfo-template.nfo" ;;
        *)         template="/usr/share/streamlit-forge/nfo-template.nfo" ;;
    esac

    [ ! -f "$template" ] && { echo "ERROR: Template not found: $template"; return 1; }

    sed -e "s/{{APP_ID}}/$app_id/g" \
        -e "s/{{APP_NAME}}/$app_name/g" \
        -e "s/{{SHORT_DESC}}/$short_desc/g" \
        -e "s/{{VERSION}}/1.0.0/g" \
        -e "s/{{DATE}}/$date/g" \
        "$template" > "$output"

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────────
# Print NFO summary
# Usage: nfo_summary
# ─────────────────────────────────────────────────────────────────────────────────
nfo_summary() {
    local name=$(nfo_get identity name)
    local version=$(nfo_get identity version)
    local rtype=$(nfo_get runtime type)
    local short=$(nfo_get description short)
    local category=$(nfo_get tags category)
    local keywords=$(nfo_get tags keywords)

    printf '┌─────────────────────────────────────────────────────────────────┐\n'
    printf '│  %s v%s\n' "$name" "$version"
    printf '│  Type: %s | Category: %s\n' "$rtype" "$category"
    printf '├─────────────────────────────────────────────────────────────────┤\n'
    printf '│  %s\n' "$short"
    printf '│  Tags: %s\n' "$keywords"
    printf '└─────────────────────────────────────────────────────────────────┘\n'
}

# ═══════════════════════════════════════════════════════════════════════════════
#  NFO UPDATE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────────
# Backup NFO file
# Usage: nfo_backup <file>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_backup() {
    local file="$1"
    [ ! -f "$file" ] && return 1
    cp "$file" "${file}.bak"
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────────
# Restore NFO from backup
# Usage: nfo_restore <file>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_restore() {
    local file="$1"
    [ ! -f "${file}.bak" ] && { echo "ERROR: No backup found"; return 1; }
    mv "${file}.bak" "$file"
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────────
# Update a single field in NFO file
# Usage: nfo_update <file> <section> <key> <value>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_update() {
    local file="$1"
    local section="$2"
    local key="$3"
    local value="$4"

    [ ! -f "$file" ] && { echo "ERROR: File not found: $file"; return 1; }

    # Escape special characters for sed
    local escaped_value=$(printf '%s' "$value" | sed 's/[&/\]/\\&/g')

    # Check if key exists in section
    if grep -q "^\[${section}\]" "$file"; then
        # Find the section and update or add the key
        if grep -A 50 "^\[${section}\]" "$file" | grep -q "^${key}="; then
            # Key exists - update it
            # Use awk for more reliable section-aware editing
            awk -v section="$section" -v key="$key" -v value="$value" '
                BEGIN { in_section = 0 }
                /^\[/ {
                    if ($0 ~ "\\[" section "\\]") { in_section = 1 }
                    else { in_section = 0 }
                }
                in_section && $0 ~ "^" key "=" {
                    print key "=" value
                    next
                }
                { print }
            ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
        else
            # Key doesn't exist in section - add it after section header
            awk -v section="$section" -v key="$key" -v value="$value" '
                /^\[/ {
                    if (in_section) { print key "=" value }
                    in_section = ($0 ~ "\\[" section "\\]")
                }
                { print }
                END { if (in_section) { print key "=" value } }
            ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
        fi
    else
        # Section doesn't exist - add it at the end
        printf '\n[%s]\n%s=%s\n' "$section" "$key" "$value" >> "$file"
    fi

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────────
# Update multiple fields from JSON
# Usage: nfo_update_from_json <file> <json_data>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_update_from_json() {
    local file="$1"
    local json="$2"

    [ ! -f "$file" ] && { echo "ERROR: File not found: $file"; return 1; }

    # Backup before multi-update
    nfo_backup "$file"

    # Parse JSON and update each field
    # Format: {"section":{"key":"value",...},...}
    echo "$json" | jsonfilter -e '@' 2>/dev/null | while read -r line; do
        # Simple JSON parsing for flat structure
        local section key value
        # This is a simplified parser - works for basic cases
        echo "$json" | sed 's/[{}]//g; s/,/\n/g' | while IFS=':' read -r k v; do
            k=$(echo "$k" | tr -d '"' | tr -d ' ')
            v=$(echo "$v" | tr -d '"')
            [ -n "$k" ] && [ -n "$v" ] && nfo_update "$file" "$section" "$k" "$v"
        done
    done

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────────
# Sync NFO from UCI config
# Usage: nfo_sync_from_uci <file> <uci_config> <uci_section>
# ─────────────────────────────────────────────────────────────────────────────────
nfo_sync_from_uci() {
    local file="$1"
    local uci_config="$2"
    local uci_section="$3"

    [ ! -f "$file" ] && { echo "ERROR: File not found: $file"; return 1; }

    # Backup before sync
    nfo_backup "$file"

    # Map UCI options to NFO sections
    local port=$(uci -q get "${uci_config}.${uci_section}.port")
    local memory=$(uci -q get "${uci_config}.${uci_section}.memory")
    local domain=$(uci -q get "${uci_config}.${uci_section}.domain")
    local enabled=$(uci -q get "${uci_config}.${uci_section}.enabled")

    [ -n "$port" ] && nfo_update "$file" "runtime" "port" "$port"
    [ -n "$memory" ] && nfo_update "$file" "runtime" "memory" "$memory"
    [ -n "$domain" ] && nfo_update "$file" "exposure" "domain_prefix" "${domain%%.*}"
    [ "$enabled" = "1" ] && nfo_update "$file" "runtime" "enabled" "1"

    # Update timestamp
    nfo_update "$file" "identity" "updated" "$(date +%Y-%m-%d)"

    return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
#  AI CONTEXT EXTRACTION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────────
# Get full AI context from NFO
# Usage: nfo_get_ai_context [file]
# Returns: Complete prompt context for LLMs
# ─────────────────────────────────────────────────────────────────────────────────
nfo_get_ai_context() {
    local file="$1"

    if [ -n "$file" ]; then
        nfo_parse "$file" || return 1
    fi

    local name=$(nfo_get identity name)
    local version=$(nfo_get identity version)
    local short=$(nfo_get description short)
    local long=$(nfo_get description long)
    local capabilities=$(nfo_get dynamics capabilities)
    local input_types=$(nfo_get dynamics input_types)
    local output_types=$(nfo_get dynamics output_types)
    local prompt_context=$(nfo_get dynamics prompt_context)
    local category=$(nfo_get tags category)
    local keywords=$(nfo_get tags keywords)

    cat << AIEOF
# Application: $name v$version
Category: $category
Keywords: $keywords

## Description
$short

$long

## Capabilities
$capabilities

## Input/Output
- Accepts: $input_types
- Produces: $output_types

## Context
$prompt_context
AIEOF
}

# ─────────────────────────────────────────────────────────────────────────────────
# Build system prompt for LLM interaction
# Usage: nfo_build_system_prompt [file]
# Returns: Formatted system prompt
# ─────────────────────────────────────────────────────────────────────────────────
nfo_build_system_prompt() {
    local file="$1"

    if [ -n "$file" ]; then
        nfo_parse "$file" || return 1
    fi

    local name=$(nfo_get identity name)
    local version=$(nfo_get identity version)
    local short=$(nfo_get description short)
    local capabilities=$(nfo_get dynamics capabilities)
    local input_types=$(nfo_get dynamics input_types)
    local output_types=$(nfo_get dynamics output_types)
    local prompt_context=$(nfo_get dynamics prompt_context)

    cat << SYSEOF
You are an AI assistant helping users interact with: $name v$version

Description: $short

Capabilities: $capabilities
Input types: $input_types
Output types: $output_types

$prompt_context

When assisting users:
- Focus on tasks within the app's capabilities
- Suggest appropriate input formats
- Describe expected output types
- Be helpful and concise
SYSEOF
}

# ─────────────────────────────────────────────────────────────────────────────────
# Get capabilities as array/list
# Usage: nfo_get_capabilities_list [file]
# Returns: One capability per line
# ─────────────────────────────────────────────────────────────────────────────────
nfo_get_capabilities_list() {
    local file="$1"

    if [ -n "$file" ]; then
        nfo_parse "$file" || return 1
    fi

    local capabilities=$(nfo_get dynamics capabilities)
    echo "$capabilities" | tr ',' '\n' | tr -d ' '
}

# ─────────────────────────────────────────────────────────────────────────────────
# Get input/output types summary
# Usage: nfo_get_io_types [file]
# Returns: JSON-like summary
# ─────────────────────────────────────────────────────────────────────────────────
nfo_get_io_types() {
    local file="$1"

    if [ -n "$file" ]; then
        nfo_parse "$file" || return 1
    fi

    local input_types=$(nfo_get dynamics input_types)
    local output_types=$(nfo_get dynamics output_types)

    printf '{"input":[%s],"output":[%s]}\n' \
        "$(echo "$input_types" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')" \
        "$(echo "$output_types" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')"
}

# ─────────────────────────────────────────────────────────────────────────────────
# Check if app has AI capabilities
# Usage: nfo_has_ai_context [file]
# Returns: 0 if has AI context, 1 otherwise
# ─────────────────────────────────────────────────────────────────────────────────
nfo_has_ai_context() {
    local file="$1"

    if [ -n "$file" ]; then
        nfo_parse "$file" || return 1
    fi

    local prompt_context=$(nfo_get dynamics prompt_context)
    local capabilities=$(nfo_get dynamics capabilities)

    [ -n "$prompt_context" ] || [ -n "$capabilities" ]
}

# ─────────────────────────────────────────────────────────────────────────────────
# Get keywords as array
# Usage: nfo_get_keywords_list [file]
# Returns: One keyword per line
# ─────────────────────────────────────────────────────────────────────────────────
nfo_get_keywords_list() {
    local file="$1"

    if [ -n "$file" ]; then
        nfo_parse "$file" || return 1
    fi

    local keywords=$(nfo_get tags keywords)
    echo "$keywords" | tr ',' '\n' | tr -d ' '
}
