#!/bin/sh

#
# SecuBox State Machine
# State validation rules and transition logic
#

# State transition matrix
# Returns allowed next states for a given current state
get_allowed_transitions() {
	local state="$1"

	case "$state" in
		available)
			echo "installing"
			;;
		installing)
			echo "installed error"
			;;
		installed)
			echo "configuring uninstalling"
			;;
		configuring)
			echo "configured error"
			;;
		configured)
			echo "activating disabled"
			;;
		activating)
			echo "active error"
			;;
		active)
			echo "starting disabled frozen"
			;;
		starting)
			echo "running error"
			;;
		running)
			echo "stopping error frozen"
			;;
		stopping)
			echo "stopped error"
			;;
		stopped)
			echo "starting disabled uninstalling"
			;;
		error)
			echo "available installed stopped"
			;;
		frozen)
			echo "active"
			;;
		disabled)
			echo "active uninstalling"
			;;
		uninstalling)
			echo "available error"
			;;
		*)
			echo ""
			;;
	esac
}

# Validate if transition from state A to state B is allowed
# Returns 0 if allowed, 1 if not allowed
validate_transition() {
	local from_state="$1"
	local to_state="$2"

	# Get allowed transitions for current state
	local allowed=$(get_allowed_transitions "$from_state")

	# Check if target state is in allowed list
	for state in $allowed; do
		if [ "$state" = "$to_state" ]; then
			return 0
		fi
	done

	return 1
}

# Lock a component for state transition
# Uses flock for atomic operations
lock_component() {
	local component_id="$1"
	local lockfile="/var/lock/secubox-state-${component_id}.lock"
	local lockfd=200

	mkdir -p /var/lock

	# Try to acquire lock with 5 second timeout
	eval "exec ${lockfd}>${lockfile}"
	flock -w 5 ${lockfd} || return 1

	return 0
}

# Unlock a component after state transition
unlock_component() {
	local component_id="$1"
	local lockfd=200

	# Release lock
	flock -u ${lockfd} 2>/dev/null || true

	return 0
}

# Execute pre-transition hook
# Can be used for validation, resource checks, etc.
pre_transition_hook() {
	local component_id="$1"
	local from_state="$2"
	local to_state="$3"

	# Log transition attempt
	logger -t secubox-state "Pre-transition: $component_id: $from_state -> $to_state"

	# Add custom validation here if needed
	# For example, check if component has required dependencies

	return 0
}

# Execute post-transition hook
# Can be used for notifications, cleanup, etc.
post_transition_hook() {
	local component_id="$1"
	local from_state="$2"
	local to_state="$3"
	local success="$4"

	if [ "$success" = "1" ]; then
		logger -t secubox-state "Post-transition: $component_id: $from_state -> $to_state (SUCCESS)"
	else
		logger -t secubox-state "Post-transition: $component_id: $from_state -> $to_state (FAILED)"
	fi

	# Trigger state change event
	trigger_state_event "$component_id" "$to_state" "$from_state"

	return 0
}

# Trigger state change event
# Can be used to notify other systems, WebSocket clients, etc.
trigger_state_event() {
	local component_id="$1"
	local new_state="$2"
	local old_state="$3"

	# TODO: Implement event notification system
	# This could publish to WebSocket, write to event queue, etc.

	# For now, just write to system log
	logger -t secubox-state-event "Component $component_id changed state: $old_state -> $new_state"

	return 0
}

# Rollback transition on failure
# Reverts component to previous state
rollback_transition() {
	local component_id="$1"
	local previous_state="$2"
	local reason="${3:-rollback_on_failure}"

	logger -t secubox-state "Rolling back $component_id to state: $previous_state (reason: $reason)"

	# Note: This function should be called by secubox-state CLI
	# We don't directly modify state-db.json here to avoid circular dependencies

	return 0
}

# Execute state transition
# Main transition logic
execute_transition() {
	local component_id="$1"
	local current_state="$2"
	local new_state="$3"
	local reason="${4:-manual}"

	# Validate transition
	if ! validate_transition "$current_state" "$new_state"; then
		logger -t secubox-state "ERROR: Invalid transition: $current_state -> $new_state for $component_id"
		return 1
	fi

	# Pre-transition hook
	if ! pre_transition_hook "$component_id" "$current_state" "$new_state"; then
		logger -t secubox-state "ERROR: Pre-transition hook failed for $component_id"
		return 1
	fi

	# Transition is valid, caller should update state-db.json
	# Post-transition hook will be called by caller after DB update

	return 0
}

# Get all valid states
get_all_states() {
	echo "available installing installed configuring configured activating active starting running stopping stopped error frozen disabled uninstalling"
}

# Check if state is valid
is_valid_state() {
	local state="$1"
	local all_states=$(get_all_states)

	for s in $all_states; do
		if [ "$s" = "$state" ]; then
			return 0
		fi
	done

	return 1
}

# Get state category (persistent, transient, error)
get_state_category() {
	local state="$1"

	case "$state" in
		available|installed|active|disabled|frozen)
			echo "persistent"
			;;
		installing|configuring|starting|stopping|uninstalling|activating|configured)
			echo "transient"
			;;
		error)
			echo "error"
			;;
		running|stopped)
			echo "runtime"
			;;
		*)
			echo "unknown"
			;;
	esac
}
