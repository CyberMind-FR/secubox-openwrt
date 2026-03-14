#!/bin/sh
# SecuBox NFO Schema Validator Library
# Validates NFO module manifests against type-specific schemas
# Source this file to use the validation functions

# ═══════════════════════════════════════════════════════════════════════════════
# Schema Definitions
# ═══════════════════════════════════════════════════════════════════════════════

# Required fields by app type
# Format: section.field (space-separated)
NFO_SCHEMA_COMMON="identity.id identity.name identity.version"
NFO_SCHEMA_STREAMLIT="$NFO_SCHEMA_COMMON runtime.type runtime.port"
NFO_SCHEMA_METABLOG="$NFO_SCHEMA_COMMON runtime.type runtime.framework"
NFO_SCHEMA_DOCKER="$NFO_SCHEMA_COMMON runtime.type runtime.image"

# Recommended fields (warnings if missing)
NFO_RECOMMENDED_COMMON="description.short tags.category tags.keywords identity.author"
NFO_RECOMMENDED_STREAMLIT="$NFO_RECOMMENDED_COMMON runtime.memory launcher.priority"
NFO_RECOMMENDED_METABLOG="$NFO_RECOMMENDED_COMMON content.posts_dir exposure.domain_prefix"
NFO_RECOMMENDED_DOCKER="$NFO_RECOMMENDED_COMMON runtime.ports runtime.volumes"

# Optional fields that enhance AI/mesh integration
NFO_AI_FIELDS="dynamics.prompt_context dynamics.capabilities dynamics.input_types dynamics.output_types"
NFO_MESH_FIELDS="mesh.publish mesh.visibility mesh.syndicate"

# ═══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════════

# Get field value from NFO file
# Usage: _validator_get_field <file> <section> <field>
_validator_get_field() {
	local file="$1"
	local section="$2"
	local field="$3"

	[ ! -f "$file" ] && return 1

	# Use nfo_get if available from nfo-parser.sh
	if type nfo_get >/dev/null 2>&1; then
		nfo_get "$file" "$section" "$field"
		return $?
	fi

	# Fallback: basic parsing
	awk -v section="$section" -v field="$field" '
		/^\[/ { in_section = ($0 ~ "\\[" section "\\]") }
		in_section && /^[a-zA-Z_]+=/ {
			split($0, kv, "=")
			gsub(/^[ \t]+|[ \t]+$/, "", kv[1])
			if (kv[1] == field) {
				gsub(/^[^=]+=/, "")
				gsub(/^[ \t]+|[ \t]+$/, "")
				print
				exit
			}
		}
	' "$file"
}

# Check if section exists
# Usage: _validator_has_section <file> <section>
_validator_has_section() {
	local file="$1"
	local section="$2"
	grep -q "^\[$section\]" "$file" 2>/dev/null
}

# Detect app type from NFO
# Usage: _validator_detect_type <file>
_validator_detect_type() {
	local file="$1"
	local type=$(_validator_get_field "$file" "runtime" "type")

	case "$type" in
		streamlit)  echo "streamlit" ;;
		metablog)   echo "metablog" ;;
		docker)     echo "docker" ;;
		*)          echo "generic" ;;
	esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# Validation Functions
# ═══════════════════════════════════════════════════════════════════════════════

# Basic validation - check required sections exist
# Usage: nfo_validate_basic <file>
# Returns: 0 if valid, 1 if errors
nfo_validate_basic() {
	local file="$1"
	local errors=0

	[ ! -f "$file" ] && { echo "[ERROR] File not found: $file"; return 1; }

	# Check required sections
	for section in identity description tags runtime; do
		if ! _validator_has_section "$file" "$section"; then
			echo "[ERROR] Missing required section: [$section]"
			errors=$((errors + 1))
		fi
	done

	# Check minimum identity fields
	local id=$(_validator_get_field "$file" "identity" "id")
	local name=$(_validator_get_field "$file" "identity" "name")
	local version=$(_validator_get_field "$file" "identity" "version")

	[ -z "$id" ] && { echo "[ERROR] Missing identity.id"; errors=$((errors + 1)); }
	[ -z "$name" ] && { echo "[ERROR] Missing identity.name"; errors=$((errors + 1)); }
	[ -z "$version" ] && { echo "[ERROR] Missing identity.version"; errors=$((errors + 1)); }

	return $errors
}

# Full validation with type-specific schema
# Usage: nfo_validate_strict <file>
# Returns: 0 if valid, 1+ if errors/warnings
nfo_validate_strict() {
	local file="$1"
	local errors=0
	local warnings=0

	[ ! -f "$file" ] && { echo "[ERROR] File not found: $file"; return 1; }

	# Detect type
	local app_type=$(_validator_detect_type "$file")

	echo "Validating NFO manifest: $file"
	echo "Detected type: $app_type"
	echo ""

	# Get schema for type
	local required=""
	local recommended=""

	case "$app_type" in
		streamlit)
			required="$NFO_SCHEMA_STREAMLIT"
			recommended="$NFO_RECOMMENDED_STREAMLIT"
			;;
		metablog)
			required="$NFO_SCHEMA_METABLOG"
			recommended="$NFO_RECOMMENDED_METABLOG"
			;;
		docker)
			required="$NFO_SCHEMA_DOCKER"
			recommended="$NFO_RECOMMENDED_DOCKER"
			;;
		*)
			required="$NFO_SCHEMA_COMMON"
			recommended="$NFO_RECOMMENDED_COMMON"
			;;
	esac

	# Check required fields
	for field_spec in $required; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")

		if [ -z "$value" ]; then
			echo "[ERROR] Missing required field: $section.$field"
			errors=$((errors + 1))
		fi
	done

	# Check recommended fields
	for field_spec in $recommended; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")

		if [ -z "$value" ]; then
			echo "[WARN] Missing recommended field: $section.$field"
			warnings=$((warnings + 1))
		fi
	done

	# Cross-section dependency validation
	local auto_expose=$(_validator_get_field "$file" "exposure" "auto_expose")
	if [ "$auto_expose" = "1" ]; then
		local port=$(_validator_get_field "$file" "runtime" "port")
		if [ -z "$port" ]; then
			echo "[ERROR] exposure.auto_expose=1 requires runtime.port"
			errors=$((errors + 1))
		fi
	fi

	# Check mesh dependencies
	local mesh_publish=$(_validator_get_field "$file" "mesh" "publish")
	if [ "$mesh_publish" = "1" ]; then
		local mesh_visibility=$(_validator_get_field "$file" "mesh" "visibility")
		if [ -z "$mesh_visibility" ]; then
			echo "[WARN] mesh.publish=1 should have mesh.visibility set"
			warnings=$((warnings + 1))
		fi
	fi

	# Summary
	echo ""
	if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
		echo "✓ NFO manifest is valid"
		return 0
	elif [ $errors -eq 0 ]; then
		echo "⚠ NFO valid with $warnings warning(s)"
		return 0
	else
		echo "✗ NFO invalid: $errors error(s), $warnings warning(s)"
		return 1
	fi
}

# Validate against a specific type schema
# Usage: nfo_validate_schema <file> <type>
nfo_validate_schema() {
	local file="$1"
	local type="$2"
	local errors=0

	[ ! -f "$file" ] && { echo "[ERROR] File not found: $file"; return 1; }
	[ -z "$type" ] && { echo "[ERROR] Type required"; return 1; }

	local required=""
	case "$type" in
		streamlit)  required="$NFO_SCHEMA_STREAMLIT" ;;
		metablog)   required="$NFO_SCHEMA_METABLOG" ;;
		docker)     required="$NFO_SCHEMA_DOCKER" ;;
		common)     required="$NFO_SCHEMA_COMMON" ;;
		*)          echo "[ERROR] Unknown type: $type"; return 1 ;;
	esac

	echo "Validating against $type schema..."

	for field_spec in $required; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")

		if [ -z "$value" ]; then
			echo "[ERROR] Missing: $section.$field"
			errors=$((errors + 1))
		else
			echo "[OK] $section.$field = $value"
		fi
	done

	return $errors
}

# List missing recommended fields
# Usage: nfo_get_missing_recommended <file>
nfo_get_missing_recommended() {
	local file="$1"

	[ ! -f "$file" ] && { echo "[ERROR] File not found: $file"; return 1; }

	local app_type=$(_validator_detect_type "$file")
	local recommended=""

	case "$app_type" in
		streamlit)  recommended="$NFO_RECOMMENDED_STREAMLIT" ;;
		metablog)   recommended="$NFO_RECOMMENDED_METABLOG" ;;
		docker)     recommended="$NFO_RECOMMENDED_DOCKER" ;;
		*)          recommended="$NFO_RECOMMENDED_COMMON" ;;
	esac

	local missing=""
	for field_spec in $recommended; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")

		if [ -z "$value" ]; then
			missing="$missing $field_spec"
		fi
	done

	echo "$missing" | tr ' ' '\n' | grep -v '^$'
}

# Get field suggestions for AI context completion
# Usage: nfo_get_field_suggestions <file>
nfo_get_field_suggestions() {
	local file="$1"

	[ ! -f "$file" ] && { echo "[ERROR] File not found: $file"; return 1; }

	echo "Field Suggestions for AI Enhancement:"
	echo ""

	# Check dynamics section
	local has_ai=0
	for field_spec in $NFO_AI_FIELDS; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")

		if [ -z "$value" ]; then
			case "$field" in
				prompt_context)
					echo "- dynamics.prompt_context: Add description for AI assistants"
					;;
				capabilities)
					echo "- dynamics.capabilities: List what the app can do (comma-separated)"
					;;
				input_types)
					echo "- dynamics.input_types: Data formats accepted (json,csv,api)"
					;;
				output_types)
					echo "- dynamics.output_types: Outputs generated (charts,tables,pdf)"
					;;
			esac
		else
			has_ai=1
		fi
	done

	[ $has_ai -eq 0 ] && echo "  No AI context fields set - consider adding [dynamics] section"

	echo ""
	echo "Mesh Publishing Suggestions:"

	# Check mesh section
	local has_mesh=0
	for field_spec in $NFO_MESH_FIELDS; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")

		if [ -z "$value" ]; then
			case "$field" in
				publish)
					echo "- mesh.publish: Set to 1 to include in mesh catalog"
					;;
				visibility)
					echo "- mesh.visibility: private|internal|public"
					;;
				syndicate)
					echo "- mesh.syndicate: Set to 1 for federation"
					;;
			esac
		else
			has_mesh=1
		fi
	done

	[ $has_mesh -eq 0 ] && echo "  No mesh fields set - consider adding [mesh] section"
}

# Check if NFO has minimum viable AI context
# Usage: nfo_has_ai_context <file>
# Returns: 0 if has AI context, 1 otherwise
nfo_has_ai_context() {
	local file="$1"

	[ ! -f "$file" ] && return 1

	# Check for prompt_context or capabilities
	local context=$(_validator_get_field "$file" "dynamics" "prompt_context")
	local caps=$(_validator_get_field "$file" "dynamics" "capabilities")

	[ -n "$context" ] || [ -n "$caps" ]
}

# Check if NFO is mesh-ready
# Usage: nfo_is_mesh_ready <file>
# Returns: 0 if mesh-ready, 1 otherwise
nfo_is_mesh_ready() {
	local file="$1"

	[ ! -f "$file" ] && return 1

	# Check required mesh fields
	local publish=$(_validator_get_field "$file" "mesh" "publish")
	local visibility=$(_validator_get_field "$file" "mesh" "visibility")

	[ "$publish" = "1" ] && [ -n "$visibility" ]
}

# Get validation score (0-100)
# Usage: nfo_get_completeness_score <file>
nfo_get_completeness_score() {
	local file="$1"

	[ ! -f "$file" ] && { echo "0"; return 1; }

	local app_type=$(_validator_detect_type "$file")
	local total=0
	local filled=0

	# Required fields (weight: 3 each)
	local required=""
	case "$app_type" in
		streamlit)  required="$NFO_SCHEMA_STREAMLIT" ;;
		metablog)   required="$NFO_SCHEMA_METABLOG" ;;
		docker)     required="$NFO_SCHEMA_DOCKER" ;;
		*)          required="$NFO_SCHEMA_COMMON" ;;
	esac

	for field_spec in $required; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")
		total=$((total + 3))
		[ -n "$value" ] && filled=$((filled + 3))
	done

	# Recommended fields (weight: 2 each)
	local recommended=""
	case "$app_type" in
		streamlit)  recommended="$NFO_RECOMMENDED_STREAMLIT" ;;
		metablog)   recommended="$NFO_RECOMMENDED_METABLOG" ;;
		docker)     recommended="$NFO_RECOMMENDED_DOCKER" ;;
		*)          recommended="$NFO_RECOMMENDED_COMMON" ;;
	esac

	for field_spec in $recommended; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")
		total=$((total + 2))
		[ -n "$value" ] && filled=$((filled + 2))
	done

	# AI fields (weight: 1 each)
	for field_spec in $NFO_AI_FIELDS; do
		local section=$(echo "$field_spec" | cut -d. -f1)
		local field=$(echo "$field_spec" | cut -d. -f2)
		local value=$(_validator_get_field "$file" "$section" "$field")
		total=$((total + 1))
		[ -n "$value" ] && filled=$((filled + 1))
	done

	# Calculate percentage
	if [ $total -gt 0 ]; then
		echo $((filled * 100 / total))
	else
		echo "0"
	fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# CLI Interface (when run directly)
# ═══════════════════════════════════════════════════════════════════════════════

if [ "${0##*/}" = "nfo-validator.sh" ]; then
	case "$1" in
		validate|check)
			shift
			nfo_validate_strict "$@"
			;;
		schema)
			shift
			nfo_validate_schema "$@"
			;;
		missing)
			shift
			nfo_get_missing_recommended "$@"
			;;
		suggest)
			shift
			nfo_get_field_suggestions "$@"
			;;
		score)
			shift
			score=$(nfo_get_completeness_score "$1")
			echo "Completeness: ${score}%"
			;;
		*)
			echo "NFO Schema Validator"
			echo ""
			echo "Usage: nfo-validator.sh <command> <file> [options]"
			echo ""
			echo "Commands:"
			echo "  validate <file>        Full validation with warnings"
			echo "  schema <file> <type>   Validate against specific schema"
			echo "  missing <file>         List missing recommended fields"
			echo "  suggest <file>         Get field suggestions"
			echo "  score <file>           Get completeness score (0-100)"
			echo ""
			echo "Types: streamlit, metablog, docker, common"
			;;
	esac
fi
