#!/bin/sh /etc/rc.common

START=99
STOP=10

USE_PROCD=1

EXTRA_COMMANDS="status"
EXTRA_HELP="	status	Show container status"

start_service() {
	local enabled
	config_load APPNAME
	config_get enabled main enabled '0'

	[ "$enabled" = "1" ] || {
		echo "APPNAME is disabled in /etc/config/APPNAME"
		return 0
	}

	local container memory_limit
	config_get container main container 'APPNAME'
	config_get memory_limit main memory_limit 'MEMORY'

	# Generate LXC config
	generate_lxc_config

	echo "Starting APPNAME container..."
	lxc-start -n "$container" -d
	sleep 2

	if lxc-info -n "$container" 2>/dev/null | grep -q "RUNNING"; then
		echo "APPNAME started successfully"
	else
		echo "Failed to start APPNAME"
		return 1
	fi
}

stop_service() {
	local container
	config_load APPNAME
	config_get container main container 'APPNAME'

	if lxc-info -n "$container" 2>/dev/null | grep -q "RUNNING"; then
		echo "Stopping APPNAME container..."
		lxc-stop -n "$container" -t 30
		echo "APPNAME stopped"
	else
		echo "APPNAME is not running"
	fi
}

status() {
	local container
	config_load APPNAME
	config_get container main container 'APPNAME'

	if lxc-info -n "$container" 2>/dev/null | grep -q "RUNNING"; then
		lxc-info -n "$container"
	else
		echo "APPNAME is not running"
	fi
}

generate_lxc_config() {
	local container lxc_dir memory_limit network
	config_load APPNAME
	config_get container main container 'APPNAME'
	config_get lxc_dir main lxc_dir '/srv/lxc'
	config_get memory_limit main memory_limit 'MEMORY'
	config_get network main network 'host'

	local config_file="${lxc_dir}/${container}/config"
	local rootfs="${lxc_dir}/${container}/rootfs"

	cat > "$config_file" << EOF
lxc.uts.name = ${container}
lxc.rootfs.path = dir:${rootfs}
lxc.init.cmd = /start-lxc.sh

# Namespaces
lxc.namespace.share.net = 1

# Capabilities
lxc.cap.drop = sys_admin sys_boot sys_module

# Memory limit
lxc.cgroup2.memory.max = ${memory_limit}

# TTY
lxc.tty.max = 1
lxc.pty.max = 1

# Mounts
lxc.mount.auto = proc:mixed sys:ro cgroup:mixed
EOF
}
