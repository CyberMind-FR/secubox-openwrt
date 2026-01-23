'use strict';
'require baseclass';
'require rpc';

// ============================================
// Core Status & Monitoring
// ============================================

var callStatus = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'status',
	expect: {}
});

var callListRules = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_rules',
	expect: { rules: [] }
});

var callAddRule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'add_rule',
	params: ['name', 'type', 'target', 'limit_down', 'limit_up', 'priority'],
	expect: {}
});

var callDeleteRule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_rule',
	params: ['rule_id'],
	expect: {}
});

var callListQuotas = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_quotas',
	expect: { quotas: [] }
});

var callGetQuota = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_quota',
	params: ['mac'],
	expect: {}
});

var callSetQuota = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'set_quota',
	params: ['mac', 'name', 'limit_mb', 'action', 'reset_day'],
	expect: {}
});

var callResetQuota = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'reset_quota',
	params: ['mac'],
	expect: {}
});

var callGetUsageRealtime = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_usage_realtime',
	expect: { clients: [] }
});

var callGetUsageHistory = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_usage_history',
	params: ['timeframe', 'mac'],
	expect: { history: [] }
});

var callGetMedia = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_media',
	expect: { media: [] }
});

var callGetClasses = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_classes',
	expect: { classes: [] }
});

// ============================================
// Smart QoS & DPI
// ============================================

var callGetDpiApplications = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_dpi_applications',
	expect: { applications: [] }
});

var callGetSmartSuggestions = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_smart_suggestions',
	expect: { suggestions: [] }
});

var callApplyDpiRule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'apply_dpi_rule',
	params: ['app_name', 'priority', 'limit_down', 'limit_up'],
	expect: {}
});

// ============================================
// Device Groups
// ============================================

var callListGroups = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_groups',
	expect: { groups: [] }
});

var callGetGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_group',
	params: ['group_id'],
	expect: {}
});

var callCreateGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'create_group',
	params: ['name', 'description', 'quota_mb', 'priority', 'members'],
	expect: {}
});

var callUpdateGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'update_group',
	params: ['group_id', 'name', 'description', 'quota_mb', 'priority', 'members'],
	expect: {}
});

var callDeleteGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_group',
	params: ['group_id'],
	expect: {}
});

var callAddToGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'add_to_group',
	params: ['group_id', 'mac'],
	expect: {}
});

var callRemoveFromGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'remove_from_group',
	params: ['group_id', 'mac'],
	expect: {}
});

// ============================================
// Analytics
// ============================================

var callGetAnalyticsSummary = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_analytics_summary',
	params: ['period'],
	expect: {}
});

var callGetHourlyData = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_hourly_data',
	params: ['days'],
	expect: { hourly_data: [] }
});

var callRecordStats = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'record_stats',
	expect: {}
});

// ============================================
// Device Profiles
// ============================================

var callGetBuiltinProfiles = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_builtin_profiles',
	expect: { profiles: [] }
});

var callListProfiles = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_profiles',
	expect: { profiles: [] }
});

var callGetProfile = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_profile',
	params: ['profile_id'],
	expect: {}
});

var callCreateProfile = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'create_profile',
	params: ['name', 'description', 'icon', 'color', 'priority', 'limit_down', 'limit_up', 'latency_mode', 'content_filter', 'isolate', 'schedule'],
	expect: {}
});

var callUpdateProfile = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'update_profile',
	params: ['profile_id', 'name', 'description', 'icon', 'color', 'priority', 'limit_down', 'limit_up', 'latency_mode', 'content_filter', 'isolate', 'schedule', 'enabled'],
	expect: {}
});

var callDeleteProfile = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_profile',
	params: ['profile_id'],
	expect: {}
});

var callCloneProfile = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'clone_profile',
	params: ['source_id', 'new_name'],
	expect: {}
});

var callAssignProfileToDevice = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'assign_profile_to_device',
	params: ['mac', 'profile_id', 'custom_limit_down', 'custom_limit_up'],
	expect: {}
});

var callAssignProfileToGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'assign_profile_to_group',
	params: ['group_id', 'profile_id'],
	expect: {}
});

var callRemoveProfileAssignment = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'remove_profile_assignment',
	params: ['mac'],
	expect: {}
});

var callListProfileAssignments = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_profile_assignments',
	expect: { assignments: [] }
});

// ============================================
// Parental Controls
// ============================================

var callListParentalSchedules = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_parental_schedules',
	expect: { schedules: [] }
});

var callCreateParentalSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'create_parental_schedule',
	params: ['name', 'target_type', 'target', 'action', 'start_time', 'end_time', 'days'],
	expect: {}
});

var callUpdateParentalSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'update_parental_schedule',
	params: ['schedule_id', 'name', 'target_type', 'target', 'action', 'start_time', 'end_time', 'days', 'enabled'],
	expect: {}
});

var callDeleteParentalSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_parental_schedule',
	params: ['schedule_id'],
	expect: {}
});

var callToggleParentalSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'toggle_parental_schedule',
	params: ['schedule_id', 'enabled'],
	expect: {}
});

var callListPresetModes = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_preset_modes',
	expect: { presets: [] }
});

var callActivatePresetMode = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'activate_preset_mode',
	params: ['preset_id', 'enabled'],
	expect: {}
});

var callGetFilterCategories = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_filter_categories',
	expect: { categories: [] }
});

// ============================================
// Bandwidth Alerts
// ============================================

var callGetAlertSettings = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_alert_settings',
	expect: {}
});

var callUpdateAlertSettings = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'update_alert_settings',
	params: ['enabled', 'quota_threshold_80', 'quota_threshold_90', 'quota_threshold_100', 'new_device_alert', 'high_bandwidth_alert', 'high_bandwidth_threshold'],
	expect: {}
});

var callConfigureEmail = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'configure_email',
	params: ['smtp_server', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_tls', 'recipient', 'sender'],
	expect: {}
});

var callConfigureSms = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'configure_sms',
	params: ['provider', 'account_sid', 'auth_token', 'from_number', 'to_number'],
	expect: {}
});

var callTestNotification = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'test_notification',
	params: ['type'],
	expect: {}
});

var callGetAlertHistory = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_alert_history',
	params: ['limit'],
	expect: { alerts: [] }
});

var callAcknowledgeAlert = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'acknowledge_alert',
	params: ['timestamp'],
	expect: {}
});

var callGetPendingAlerts = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_pending_alerts',
	expect: { alerts: [], count: 0 }
});

var callCheckAlertThresholds = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'check_alert_thresholds',
	expect: {}
});

// ============================================
// Traffic Graphs
// ============================================

var callGetRealtimeBandwidth = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_realtime_bandwidth',
	expect: {}
});

var callGetHistoricalTraffic = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_historical_traffic',
	params: ['period', 'granularity'],
	expect: { data: [] }
});

var callGetDeviceTraffic = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_device_traffic',
	params: ['mac', 'period'],
	expect: {}
});

var callGetTopTalkers = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_top_talkers',
	params: ['period', 'limit'],
	expect: { talkers: [] }
});

var callGetProtocolBreakdown = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_protocol_breakdown',
	params: ['period'],
	expect: { protocols: [] }
});

// ============================================
// Export API Module
// ============================================

return baseclass.extend({
	// Core
	getStatus: callStatus,
	listRules: callListRules,
	addRule: callAddRule,
	deleteRule: callDeleteRule,
	listQuotas: callListQuotas,
	getQuota: callGetQuota,
	setQuota: callSetQuota,
	resetQuota: callResetQuota,
	getUsageRealtime: callGetUsageRealtime,
	getUsageHistory: callGetUsageHistory,
	getMedia: callGetMedia,
	getClasses: callGetClasses,

	// Smart QoS
	getDpiApplications: callGetDpiApplications,
	getSmartSuggestions: callGetSmartSuggestions,
	applyDpiRule: callApplyDpiRule,

	// Groups
	listGroups: callListGroups,
	getGroup: callGetGroup,
	createGroup: callCreateGroup,
	updateGroup: callUpdateGroup,
	deleteGroup: callDeleteGroup,
	addToGroup: callAddToGroup,
	removeFromGroup: callRemoveFromGroup,

	// Analytics
	getAnalyticsSummary: callGetAnalyticsSummary,
	getHourlyData: callGetHourlyData,
	recordStats: callRecordStats,

	// Profiles
	getBuiltinProfiles: callGetBuiltinProfiles,
	listProfiles: callListProfiles,
	getProfile: callGetProfile,
	createProfile: callCreateProfile,
	updateProfile: callUpdateProfile,
	deleteProfile: callDeleteProfile,
	cloneProfile: callCloneProfile,
	assignProfileToDevice: callAssignProfileToDevice,
	assignProfileToGroup: callAssignProfileToGroup,
	removeProfileAssignment: callRemoveProfileAssignment,
	listProfileAssignments: callListProfileAssignments,

	// Parental Controls
	listParentalSchedules: callListParentalSchedules,
	createParentalSchedule: callCreateParentalSchedule,
	updateParentalSchedule: callUpdateParentalSchedule,
	deleteParentalSchedule: callDeleteParentalSchedule,
	toggleParentalSchedule: callToggleParentalSchedule,
	listPresetModes: callListPresetModes,
	activatePresetMode: callActivatePresetMode,
	getFilterCategories: callGetFilterCategories,

	// Alerts
	getAlertSettings: callGetAlertSettings,
	updateAlertSettings: callUpdateAlertSettings,
	configureEmail: callConfigureEmail,
	configureSms: callConfigureSms,
	testNotification: callTestNotification,
	getAlertHistory: callGetAlertHistory,
	acknowledgeAlert: callAcknowledgeAlert,
	getPendingAlerts: callGetPendingAlerts,
	checkAlertThresholds: callCheckAlertThresholds,

	// Traffic Graphs
	getRealtimeBandwidth: callGetRealtimeBandwidth,
	getHistoricalTraffic: callGetHistoricalTraffic,
	getDeviceTraffic: callGetDeviceTraffic,
	getTopTalkers: callGetTopTalkers,
	getProtocolBreakdown: callGetProtocolBreakdown
});
