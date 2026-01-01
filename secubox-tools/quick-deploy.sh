#!/bin/bash
set -euo pipefail

ROUTER="${ROUTER:-root@192.168.8.191}"
TARGET_PATH="${TARGET_PATH:-/www/luci-static}"
SSH_OPTS=${SSH_OPTS:--o RequestTTY=no -o ForwardX11=no}
SCP_OPTS=${SCP_OPTS:-}
CACHE_BUST=${CACHE_BUST:-1}
VERIFY=${VERIFY:-1}
FORCE_ROOT="false"
INCLUDE_PATHS=()
VERIFY_ERRORS=0
PROFILE=""
APP_NAME=""
APP_PATH=""
AUTO_PROFILE=${AUTO_PROFILE:-1}
LIST_APPS=0
REMOTE_HASH_CMD=""

MODE=""
PKG_PATH=""
SRC_PATH=""
GIT_URL=""
GIT_BRANCH=""
POST_CMD=""
BACKUP_DIR="${BACKUP_DIR:-/tmp/quickdeploy-backups}"
HISTORY_DIR="${HOME}/.secubox"
HISTORY_FILE="$HISTORY_DIR/quickdeploy-history.log"
LAST_BACKUP_FILE="$HISTORY_DIR/quickdeploy-last"
LAST_BACKUP=""
UNINSTALL_TARGET=""

usage() {
	cat <<'USAGE'
Usage: quick-deploy.sh [options]

Deploy packages or source archives to the development router.

Options (choose one source):
  --ipk <file.ipk>          Upload + install an IPK via opkg.
  --apk <file.apk>          Upload + install an APK via apk add.
  --src <path>              Tar + upload a local directory to --target-path.
  --src-clean <path>        Remove files previously deployed from a local directory (no upload).
  --git <repo_url>          Clone repo (optionally --branch) then upload.
  --profile <name>          Use a predefined deployment profile (e.g. theme, luci-app).
  --app <name>              Shortcut for --profile luci-app; auto-resolves `luci-app-<name>`
  --list-apps               List detected `luci-app-*` directories and exit.

Common flags:
  --router <user@host>      Override router target (default root@192.168.8.191).
  --target-path <path>      Destination for source uploads (default /www/luci-static).
  --include <subpath>       Repeatable. Only include matching subpaths when using --src/--git.
  --branch <name>           Git branch/tag when using --git.
  --no-cache-bust           Skip clearing /tmp/luci-* after deploy.
  --no-verify               Skip post-deploy file verification.
  --force-root              Allow --src to write directly under /. Use with caution.
  --no-auto-profile         Disable automatic LuCI app detection when using --src.
  --uninstall [backup]      Restore the latest (or specific) quick-deploy backup.
  --post <command>          Extra remote command to run after deploy.
  -h, --help                Show this message.

Environment variables:
  ROUTER, TARGET_PATH, SSH_OPTS, SCP_OPTS can also be exported ahead of time.
USAGE
	exit 1
}

log() {
	echo -e "[$(date +'%H:%M:%S')] $*"
}

remote_exec() {
	ssh $SSH_OPTS "$ROUTER" "$@"
}

copy_file() {
	scp $SCP_OPTS "$1" "$ROUTER:$2"
}

join_path() {
	local base="$1"
	local rel="$2"
	if [[ "$base" == "/" ]]; then
		echo "/$rel" | sed 's#//\+#/#g'
	else
		echo "$base/$rel" | sed 's#//\+#/#g'
	fi
}

gather_deploy_files() {
	local dir="$1"
	local -n out_ref="$2"
	out_ref=()
	[[ ! -d "$dir" ]] && return 0
	if [[ ${#INCLUDE_PATHS[@]} -gt 0 ]]; then
		for inc in "${INCLUDE_PATHS[@]}"; do
			local path="$dir/$inc"
			if [[ -d "$path" ]]; then
				while IFS= read -r f; do out_ref+=("$f"); done < <(find "$path" -type f -not -path '*/.git/*' | sort)
			elif [[ -f "$path" ]]; then
				out_ref+=("$path")
			fi
		done
	else
		while IFS= read -r f; do out_ref+=("$f"); done < <(find "$dir" -type f -not -path '*/.git/*' | sort)
	fi
}

record_backup_metadata() {
	local backup_file="$1"
	[[ -z "$backup_file" ]] && return
	mkdir -p "$HISTORY_DIR"
	printf '%s | %s | %s\n' "$(date -Iseconds)" "$ROUTER" "$backup_file" >> "$HISTORY_FILE"
	printf '%s\n' "$backup_file" > "$LAST_BACKUP_FILE"
	LAST_BACKUP="$backup_file"
	log "🗂  Backup saved to $backup_file (restore with --uninstall $(basename "$backup_file" .tar.gz))"
}

backup_remote_list() {
	local -a remote_paths=("$@")
	if [[ ${#remote_paths[@]} -eq 0 ]]; then
		log "No remote paths to backup; skipping snapshot."
		return 0
	fi
	local unique_paths
	unique_paths=$(printf '%s\n' "${remote_paths[@]}" | awk 'length && !seen[$0]++')
	local trimmed_list=""
	while IFS= read -r path; do
		local trimmed="${path#/}"
		[[ -z "$trimmed" ]] && continue
		trimmed_list+="$trimmed"$'\n'
	done <<< "$unique_paths"
	if [[ -z "$trimmed_list" ]]; then
		log "No existing remote files detected to backup."
		return 0
	fi
	local backup_id
	backup_id=$(date +%Y%m%d_%H%M%S)
	local backup_file="$BACKUP_DIR/$backup_id.tar.gz"
	local list_file="$BACKUP_DIR/$backup_id.list"
	remote_exec "mkdir -p '$BACKUP_DIR'"
	remote_exec "cat <<'EOF' > '$list_file'
$trimmed_list
EOF"
	if remote_exec "cd / && tar --ignore-failed-read -czf '$backup_file' -T '$list_file' >/dev/null"; then
		record_backup_metadata "$backup_file"
	else
		log "⚠️  Failed to create backup archive."
		remote_exec "rm -f '$backup_file' '$list_file'"
	fi
}

backup_remote_paths() {
	local dir="$1"
	local base="$2"
	local -a files=()
	gather_deploy_files "$dir" files
	if [[ ${#files[@]} -eq 0 ]]; then
		log "No local files detected for $dir; skipping backup."
		return 0
	fi
	local -a remote_paths=()
	for file in "${files[@]}"; do
		local rel=${file#$dir/}
		[[ -z "$rel" ]] && continue
		remote_paths+=("$(join_path "$base" "$rel")")
	done
	backup_remote_list "${remote_paths[@]}"
}

ensure_remote_hash() {
	if [[ -n "$REMOTE_HASH_CMD" ]]; then
		return 0
	fi
	local cmd
	cmd=$(remote_exec "for c in sha1sum sha256sum md5sum; do if command -v \$c >/dev/null 2>&1; then echo \$c; break; fi; done") || true
	if [[ -z "$cmd" ]]; then
		log "⚠️  No hash utility found on router; skipping verification"
		VERIFY=0
		return 1
	fi
	REMOTE_HASH_CMD="$cmd"
	return 0
}

verify_remote() {
	local dir="$1"
	local base="$TARGET_PATH"
	[[ "$FORCE_ROOT" == "true" ]] && base="/"
	ensure_remote_hash || return
	local -a candidates=()
	gather_deploy_files "$dir" candidates
	local -a samples
	for f in "${candidates[@]}"; do
		samples+=("$f")
		[[ ${#samples[@]} -ge 5 ]] && break
	done
	if [[ ${#samples[@]} -eq 0 ]]; then
		log "No files to verify"
		return
	fi
	log "Verifying ${#samples[@]} files on router..."
	for file in "${samples[@]}"; do
		local rel=${file#$dir/}
		local local_sum=$($REMOTE_HASH_CMD "$file" | awk '{print $1}')
		local remote_path=$(join_path "$base" "$rel")
		local remote_sum
		remote_sum=$(remote_exec "if [ -f '$remote_path' ]; then $REMOTE_HASH_CMD '$remote_path' | awk '{print \$1}'; fi") || true
		if [[ -z "$remote_sum" ]]; then
			log "⚠️  Missing remote file: $remote_path"
			VERIFY_ERRORS=1
		elif [[ "$remote_sum" != "$local_sum" ]]; then
			log "⚠️  Mismatch for $remote_path"
			log "    local:  $local_sum"
			log "    remote: $remote_sum"
			VERIFY_ERRORS=1
		else
			log "✅ $rel"
		fi
	 done
}

collect_luci_apps() {
	find . -maxdepth 1 -type d -name 'luci-app-*' | LC_ALL=C sort
}

list_luci_apps() {
	local apps=()
	while IFS= read -r d; do
		apps+=("${d#./}")
	done < <(collect_luci_apps)
	if [[ ${#apps[@]} -eq 0 ]]; then
		log "No luci-app-* directories detected in $(pwd)"
		return 1
	fi
	log "Available LuCI apps:"
	for d in "${apps[@]}"; do
		printf '  - %s\n' "$d"
	done
	return 0
}

prompt_select_app() {
	local apps=()
	while IFS= read -r d; do
		apps+=("${d#./}")
	done < <(collect_luci_apps)
	if [[ ${#apps[@]} -eq 0 ]]; then
		echo "No LuCI apps discovered." >&2
		return 1
	fi
	if [[ ! -t 0 ]]; then
		printf 'Available apps:%s' "\n"
		for d in "${apps[@]}"; do
			printf '  - %s\n' "$d"
		done
		echo "(non-interactive shell: rerun with --app <name>)" >&2
		return 1
	fi
	local old_ps3=${PS3:-""}
	local selected=""
	PS3="Choice (q to abort): "
	{
		echo "Select a LuCI app to deploy (type number or name, q to abort):"
		select choice in "${apps[@]}"; do
			if [[ "$REPLY" == "q" || "$REPLY" == "quit" ]]; then
				break
			fi
			if [[ -n "$choice" ]]; then
				selected="$choice"
				break
			fi
			echo "Invalid selection." >&2
		done
	} >&2
	PS3="$old_ps3"
	if [[ -z "$selected" ]]; then
		return 1
	fi
	echo "$selected"
	return 0
}

resolve_app_dir() {
	local input="$1"
	if [[ -z "$input" ]]; then
		return 1
	fi
	if [[ -d "$input" ]]; then
		echo "$input"
		return 0
	fi
	if [[ -d "luci-app-$input" ]]; then
		echo "luci-app-$input"
		return 0
	fi
	return 1
}

normalize_app_path() {
	local input="$1"
	local candidate=""

	if [[ -z "$input" ]]; then
		return 1
	fi

	# If absolute path, trust it
	if [[ "$input" == /* ]]; then
		candidate="$input"
	else
		candidate="$PWD/$input"
	fi

	if [[ -d "$candidate" ]]; then
		echo "$candidate"
		return 0
	fi

	# Fall back to raw input (in case caller already passed ./relative)
	if [[ -d "$input" ]]; then
		if [[ "$input" == /* ]]; then
			echo "$input"
		else
			echo "$PWD/$input"
		fi
		return 0
	fi

	return 1
}

deploy_profile_theme() {
	log "🎨 Deploying theme profile to $ROUTER"
	local files=(
		"luci-app-secubox/root/usr/libexec/rpcd/luci.secubox:/usr/libexec/rpcd/"
		"luci-app-secubox/root/usr/share/rpcd/acl.d/luci-app-secubox.json:/usr/share/rpcd/acl.d/"
		"luci-app-secubox/htdocs/luci-static/resources/secubox/api.js:/www/luci-static/resources/secubox/"
		"luci-app-secubox/htdocs/luci-static/resources/secubox/theme.js:/www/luci-static/resources/secubox/"
		"luci-app-secubox/htdocs/luci-static/resources/secubox/secubox.css:/www/luci-static/resources/secubox/"
		"luci-app-secubox/htdocs/luci-static/resources/view/secubox/dashboard.js:/www/luci-static/resources/view/secubox/"
		"luci-app-system-hub/htdocs/luci-static/resources/system-hub/theme.js:/www/luci-static/resources/system-hub/"
		"luci-app-system-hub/htdocs/luci-static/resources/system-hub/dashboard.css:/www/luci-static/resources/system-hub/"
		"luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/overview.js:/www/luci-static/resources/view/system-hub/"
	)
	remote_exec "mkdir -p /usr/libexec/rpcd /usr/share/rpcd/acl.d /www/luci-static/resources/secubox /www/luci-static/resources/view/secubox /www/luci-static/resources/system-hub /www/luci-static/resources/view/system-hub /www/luci-static/resources/secubox-theme"
	local -a backup_targets=()
	for entry in "${files[@]}"; do
		local src=${entry%%:*}
		local dest=${entry##*:}
		local remote_file=$(join_path "$dest" "$(basename "$src")")
		backup_targets+=("$remote_file")
	done
	backup_remote_list "${backup_targets[@]}"
	for entry in "${files[@]}"; do
		local src=${entry%%:*}
		local dest=${entry##*:}
		log "Copying $src -> $dest"
		copy_file "$src" "$dest"
	done

	local theme_src_dir="luci-theme-secubox/htdocs/luci-static/resources"
	if [[ -d "$theme_src_dir/secubox-theme" ]]; then
		backup_remote_paths "$theme_src_dir/secubox-theme" "/www/luci-static/resources/secubox-theme"
		local theme_archive=$(mktemp /tmp/secubox-theme-XXXX.tar.gz)
		( cd "$theme_src_dir" && tar -czf "$theme_archive" secubox-theme/ )
		local remote_theme="/tmp/secubox-theme.tar.gz"
		log "Copying theme bundle to /www/luci-static/resources/secubox-theme"
		copy_file "$theme_archive" "$remote_theme"
		remote_exec "mkdir -p /www/luci-static/resources && tar -xzf '$remote_theme' -C /www/luci-static/resources && rm -f '$remote_theme'"
		rm -f "$theme_archive"
	fi

	log "Setting permissions + restarting rpcd"
	remote_exec "chmod +x /usr/libexec/rpcd/luci.secubox && \\
		chmod 644 /www/luci-static/resources/secubox/*.{js,css} 2>/dev/null || true && \\
		chmod 644 /www/luci-static/resources/system-hub/*.{js,css} 2>/dev/null || true && \\
		chmod 644 /www/luci-static/resources/view/secubox/*.js 2>/dev/null || true && \\
		chmod 644 /www/luci-static/resources/view/system-hub/*.js 2>/dev/null || true && \\
		rm -rf /tmp/luci-* && /etc/init.d/rpcd restart"
}

deploy_profile_luci_app() {
	local app_dir="$1"
	if [[ -z "$app_dir" || ! -d "$app_dir" ]]; then
		echo "Error: --profile luci-app requires --src to point at the application root" >&2
		exit 1
	fi
	local app_name=$(basename "$app_dir")
	log "📦 Deploying LuCI app $app_name"
	local prev_target="$TARGET_PATH"
	local prev_force="$FORCE_ROOT"
	local prev_includes=("${INCLUDE_PATHS[@]}")
	INCLUDE_PATHS=()
	local root_src="$app_dir/root"
	local htdocs_src="$app_dir/htdocs"
	if [[ -d "$root_src" ]]; then
		FORCE_ROOT="true"
		TARGET_PATH="/"
		upload_source_dir "$root_src"
	fi
	if [[ -d "$htdocs_src" ]]; then
		FORCE_ROOT="false"
		TARGET_PATH="/www"
		upload_source_dir "$htdocs_src"
	fi
	remote_exec "rm -rf /tmp/luci-*"
	TARGET_PATH="$prev_target"
	FORCE_ROOT="$prev_force"
	INCLUDE_PATHS=("${prev_includes[@]}")
}

cleanup_tmp=""
trap '[[ -n "$cleanup_tmp" && -d "$cleanup_tmp" ]] && rm -rf "$cleanup_tmp"' EXIT

while [[ $# -gt 0 ]]; do
	case "$1" in
		--router)
			ROUTER="$2"; shift 2 ;;
		--target-path)
			TARGET_PATH="$2"; shift 2 ;;
		--include)
			INCLUDE_PATHS+=("$2"); shift 2 ;;
		--ipk)
			MODE="ipk"; PKG_PATH="$2"; shift 2 ;;
		--apk)
			MODE="apk"; PKG_PATH="$2"; shift 2 ;;
		--src)
			MODE="src"; SRC_PATH="$2"; shift 2 ;;
		--src-clean)
			MODE="src-clean"; SRC_PATH="$2"; shift 2 ;;
		--src-select)
			MODE="src"; SRC_PATH=""; shift ;;
		--git)
			MODE="git"; GIT_URL="$2"; shift 2 ;;
		--profile)
			PROFILE="$2"; shift 2 ;;
		--app)
			APP_NAME="$2"; shift 2 ;;
		--list-apps)
			LIST_APPS=1; shift ;;
		--branch)
			GIT_BRANCH="$2"; shift 2 ;;
		--post)
			POST_CMD="$2"; shift 2 ;;
		--no-cache-bust)
			CACHE_BUST=0; shift ;;
		--no-verify)
			VERIFY=0; shift ;;
		--force-root)
			FORCE_ROOT="true"; shift ;;
		--no-auto-profile)
			AUTO_PROFILE=0; shift ;;
		--uninstall)
			MODE="uninstall"
			if [[ $# -gt 1 && "$2" != --* ]]; then
				UNINSTALL_TARGET="$2"; shift 2
			else
				UNINSTALL_TARGET="latest"; shift
			fi ;;
		-h|--help)
			usage ;;
		*)
			echo "Unknown option: $1" >&2
			usage ;;
	esac
done

if [[ "$APP_NAME" == "list" ]]; then
	LIST_APPS=1
	APP_NAME=""
fi

if [[ "$MODE" == "uninstall" ]]; then
	perform_uninstall "$UNINSTALL_TARGET"
fi

if [[ $LIST_APPS -eq 1 ]]; then
	list_luci_apps
	exit 0
fi

if [[ -n "$APP_NAME" ]]; then
	APP_PATH=$(resolve_app_dir "$APP_NAME") || true
	if [[ -z "$APP_PATH" ]]; then
		echo "Unable to locate LuCI app '$APP_NAME'" >&2
		list_luci_apps
		exit 1
	fi
	SRC_PATH=$(normalize_app_path "$APP_PATH") || {
		echo "Unable to normalize app path '$APP_PATH'" >&2
		exit 1
	}
	PROFILE="luci-app"
	MODE=""
fi

if [[ "$MODE" == "src" && -z "$SRC_PATH" ]]; then
	if [[ -t 0 ]]; then
		selection=$(prompt_select_app) || { echo "Aborting." >&2; exit 1; }
		SRC_PATH=$(normalize_app_path "$selection") || {
			echo "Unable to locate LuCI app directory for '$selection'" >&2
			exit 1
		}
		PROFILE="${PROFILE:-luci-app}"
		MODE=""
		log "Selected LuCI app path: $SRC_PATH"
	else
		list_luci_apps
		exit 1
	fi
elif [[ -n "$SRC_PATH" && ! -d "$SRC_PATH" ]]; then
	echo "Specified --src path '$SRC_PATH' not found."
	if [[ -t 0 ]]; then
		selection=$(prompt_select_app) || { echo "Aborting." >&2; exit 1; }
		SRC_PATH=$(normalize_app_path "$selection") || {
			echo "Unable to locate LuCI app directory for '$selection'" >&2
			exit 1
		}
		PROFILE="${PROFILE:-luci-app}"
		MODE=""
		log "Selected LuCI app path: $SRC_PATH"
	else
		list_luci_apps
		exit 1
	fi
fi

if [[ -z "$PROFILE" && "$MODE" == "src" && "$AUTO_PROFILE" -eq 1 && -n "$SRC_PATH" && ( -d "$SRC_PATH/root" || -d "$SRC_PATH/htdocs" ) ]]; then
	PROFILE="luci-app"
	MODE=""
	log "Auto-detected LuCI app at $SRC_PATH (use --no-auto-profile to disable)."
fi

if [[ "$MODE" == "src-clean" ]]; then
	if [[ -z "$SRC_PATH" || ! -d "$SRC_PATH" ]]; then
		echo "Error: --src-clean requires a valid --src path" >&2
		exit 1
	fi
fi

if [[ -z "$MODE" && -z "$PROFILE" ]]; then
    echo "Error: specify one of --ipk/--apk/--src/--git or --profile" >&2
    usage
fi

if [[ -n "$MODE" && -n "$PROFILE" ]]; then
    echo "Error: --profile cannot be combined with other source options" >&2
    exit 1
fi

if [[ "$FORCE_ROOT" == "true" && "$MODE" != "src" && "$MODE" != "src-clean" && "$PROFILE" != "luci-app" ]]; then
    echo "Error: --force-root is only valid with --src" >&2
    exit 1
fi

if [[ "$FORCE_ROOT" == "true" && "$PROFILE" != "luci-app" ]]; then
    log "⚠️  Force root mode enabled: archives will extract relative to /"
fi

if [[ "$MODE" =~ ^(ipk|apk)$ && ! -f "$PKG_PATH" ]]; then
	echo "Error: package file not found: $PKG_PATH" >&2
	exit 1
fi

if [[ "$MODE" == "git" && -z "$GIT_URL" ]]; then
	echo "Error: --git requires a repository URL" >&2
	exit 1
fi

install_ipk() {
	local file="$1"
	local remote="/tmp/$(basename "$file")"
	log "Uploading $file to $remote"
	copy_file "$file" "$remote"
	log "Installing via opkg"
	remote_exec "if command -v opkg >/dev/null 2>&1; then opkg install --force-reinstall $remote; else echo 'opkg not available' >&2; exit 1; fi"
	remote_exec "rm -f $remote"
}

install_apk() {
	local file="$1"
	local remote="/tmp/$(basename "$file")"
	log "Uploading $file to $remote"
	copy_file "$file" "$remote"
	log "Installing via apk"
	remote_exec "if command -v apk >/dev/null 2>&1; then apk add --allow-untrusted $remote; else echo 'apk not available' >&2; exit 1; fi"
	remote_exec "rm -f $remote"
}

upload_source_dir() {
	local dir="$1"
	local archive
	archive=$(mktemp /tmp/secubox-src-XXXX.tar.gz)
	log "Packing $dir"
	if [[ ${#INCLUDE_PATHS[@]} -gt 0 ]]; then
		( cd "$dir" && tar -czf "$archive" "${INCLUDE_PATHS[@]}" )
	else
		tar -C "$dir" -czf "$archive" .
	fi
	local remote="/tmp/$(basename "$archive")"
	log "Uploading archive to $remote"
	copy_file "$archive" "$remote"
	local extract_target="$TARGET_PATH"
	if [[ "$FORCE_ROOT" == "true" ]]; then
		extract_target="/"
	fi
	backup_remote_paths "$dir" "$extract_target"
	log "Extracting to $extract_target"
	remote_exec "mkdir -p $extract_target && tar -xzf $remote -C $extract_target && rm -f $remote"
	if [[ "$CACHE_BUST" -eq 1 ]]; then
		remote_exec "rm -rf /tmp/luci-*"
	fi
	rm -f "$archive"
	if [[ "$VERIFY" -eq 1 ]]; then
		verify_remote "$dir"
	fi
}

clone_and_upload() {
	cleanup_tmp=$(mktemp -d /tmp/secubox-git-XXXX)
	log "Cloning $GIT_URL"
	if [[ -n "$GIT_BRANCH" ]]; then
		git clone --depth 1 --branch "$GIT_BRANCH" "$GIT_URL" "$cleanup_tmp"
	else
		git clone --depth 1 "$GIT_URL" "$cleanup_tmp"
	fi
	upload_source_dir "$cleanup_tmp"
}

clean_source_dir() {
	local dir="$1"
	if [[ -z "$dir" || ! -d "$dir" ]]; then
		echo "Error: --src-clean requires a valid local directory" >&2
		exit 1
	fi
	local base="$TARGET_PATH"
	[[ "$FORCE_ROOT" == "true" ]] && base="/"
	log "🧹 Removing files deployed from $dir (target base: $base)"
	local -a files=()
	gather_deploy_files "$dir" files
	if [[ ${#files[@]} -eq 0 ]]; then
		log "No files detected within $dir; nothing to remove."
		return 0
	fi
	local list=""
	for file in "${files[@]}"; do
		local rel=${file#$dir/}
		[[ -z "$rel" ]] && continue
		local remote=$(join_path "$base" "$rel")
		list+="$remote"$'\n'
	done
	remote_exec "cat <<'EOF' > /tmp/quickdeploy-clean.list
$list
EOF"
	remote_exec "while IFS= read -r f || [ -n \"\$f\" ]; do [ -z \"\$f\" ] && continue; rm -f \"\$f\" 2>/dev/null || true; done < /tmp/quickdeploy-clean.list; rm -f /tmp/quickdeploy-clean.list"
	if [[ "$CACHE_BUST" -eq 1 ]]; then
		remote_exec "rm -rf /tmp/luci-*"
	fi
	log "Cleanup complete."
}

resolve_backup_file() {
	local target="$1"
	local backup_file=""
	if [[ "$target" == "latest" || -z "$target" ]]; then
		backup_file=$(remote_exec "ls -1t '$BACKUP_DIR'/*.tar.gz 2>/dev/null | head -n1") || true
	else
		if [[ "$target" == /* ]]; then
			backup_file="$target"
		else
			backup_file="$BACKUP_DIR/$target"
			[[ "$target" != *.tar.gz ]] && backup_file="$backup_file.tar.gz"
		fi
	fi
	echo "$backup_file"
}

perform_uninstall() {
	local target="$1"
	local backup_file
	backup_file=$(resolve_backup_file "$target")
	if [[ -z "$backup_file" ]]; then
		echo "No backup archives found in $BACKUP_DIR" >&2
		exit 1
	fi
	local list_file="${backup_file%.tar.gz}.list"
	log "Restoring from backup: $backup_file"
	if ! remote_exec "if [ ! -f '$backup_file' ]; then echo 'Backup $backup_file not found' >&2; exit 1; fi"; then
		exit 1
	fi
	if ! remote_exec "if [ ! -f '$list_file' ]; then echo 'Warning: manifest $list_file missing; proceeding without cleanup.' >&2; fi"; then
		true
	fi
	remote_exec "if [ -f '$list_file' ]; then while IFS= read -r rel || [ -n \"\$rel\" ]; do [ -z \"\$rel\" ] && continue; rm -f \"/\$rel\" 2>/dev/null || true; done < '$list_file'; fi"
	remote_exec "cd / && tar -xzf '$backup_file'"
	if [[ "$CACHE_BUST" -eq 1 ]]; then
		remote_exec "rm -rf /tmp/luci-*"
	fi
	log "Rollback complete."
	exit 0
}

if [[ -n "$PROFILE" ]]; then
	case "$PROFILE" in
		theme|theme-system)
			deploy_profile_theme ;;
		luci-app)
			if [[ -z "$SRC_PATH" ]]; then
				if [[ -t 0 ]]; then
					selection=$(prompt_select_app) || { echo "Aborting." >&2; exit 1; }
					SRC_PATH=$(normalize_app_path "$selection") || {
						echo "Unable to locate LuCI app directory for '$selection'" >&2
						exit 1
					}
				else
					list_luci_apps
					exit 1
				fi
			fi
			deploy_profile_luci_app "$SRC_PATH" ;;
		*)
			echo "Unknown profile: $PROFILE" >&2
			exit 1 ;;
	esac
else
	case "$MODE" in
		ipk)
			install_ipk "$PKG_PATH" ;;
		apk)
			install_apk "$PKG_PATH" ;;
		src)
			upload_source_dir "$SRC_PATH" ;;
		src-clean)
			clean_source_dir "$SRC_PATH" ;;
		git)
			clone_and_upload ;;
		*)
			echo "Unsupported mode: $MODE" >&2
			exit 1 ;;
	esac
fi

if [[ -n "$POST_CMD" ]]; then
	log "Running post-deploy command: $POST_CMD"
	remote_exec "$POST_CMD"
fi

if [[ "$VERIFY" -eq 1 && $VERIFY_ERRORS -ne 0 ]]; then
	log "⚠️  Verification reported differences. Inspect logs above."
fi

log "Deployment complete ✅"
