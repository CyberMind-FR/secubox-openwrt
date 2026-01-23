'use strict';
'require baseclass';
'require rpc';

// ============================================
// Status & Statistics
// ============================================

var callStatus = rpc.declare({
	object: 'luci.hexojs',
	method: 'status',
	expect: {}
});

var callSiteStats = rpc.declare({
	object: 'luci.hexojs',
	method: 'site_stats',
	expect: {}
});

// ============================================
// Posts
// ============================================

var callListPosts = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_posts',
	expect: { posts: [] }
});

var callGetPost = rpc.declare({
	object: 'luci.hexojs',
	method: 'get_post',
	params: ['slug'],
	expect: {}
});

var callCreatePost = rpc.declare({
	object: 'luci.hexojs',
	method: 'create_post',
	params: ['title', 'content', 'categories', 'tags', 'excerpt'],
	expect: {}
});

var callUpdatePost = rpc.declare({
	object: 'luci.hexojs',
	method: 'update_post',
	params: ['slug', 'title', 'content', 'categories', 'tags', 'excerpt', 'cover'],
	expect: {}
});

var callDeletePost = rpc.declare({
	object: 'luci.hexojs',
	method: 'delete_post',
	params: ['slug'],
	expect: {}
});

var callPublishPost = rpc.declare({
	object: 'luci.hexojs',
	method: 'publish_post',
	params: ['slug'],
	expect: {}
});

var callListDrafts = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_drafts',
	expect: { drafts: [] }
});

var callSearchPosts = rpc.declare({
	object: 'luci.hexojs',
	method: 'search_posts',
	params: ['query', 'category', 'tag'],
	expect: { posts: [] }
});

// ============================================
// Taxonomy
// ============================================

var callListCategories = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_categories',
	expect: { categories: [] }
});

var callListTags = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_tags',
	expect: { tags: [] }
});

// ============================================
// Media
// ============================================

var callListMedia = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_media',
	expect: { media: [] }
});

var callDeleteMedia = rpc.declare({
	object: 'luci.hexojs',
	method: 'delete_media',
	params: ['path'],
	expect: {}
});

// ============================================
// Apps
// ============================================

var callListApps = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_apps',
	expect: { apps: [] }
});

var callCreateApp = rpc.declare({
	object: 'luci.hexojs',
	method: 'create_app',
	params: ['title', 'icon', 'description', 'url', 'category', 'content'],
	expect: {}
});

// ============================================
// Build & Deploy
// ============================================

var callGenerate = rpc.declare({
	object: 'luci.hexojs',
	method: 'generate',
	expect: {}
});

var callClean = rpc.declare({
	object: 'luci.hexojs',
	method: 'clean',
	expect: {}
});

var callDeploy = rpc.declare({
	object: 'luci.hexojs',
	method: 'deploy',
	expect: {}
});

var callDeployStatus = rpc.declare({
	object: 'luci.hexojs',
	method: 'deploy_status',
	expect: {}
});

// ============================================
// Preview
// ============================================

var callPreviewStart = rpc.declare({
	object: 'luci.hexojs',
	method: 'preview_start',
	expect: {}
});

var callPreviewStatus = rpc.declare({
	object: 'luci.hexojs',
	method: 'preview_status',
	expect: {}
});

// ============================================
// Configuration
// ============================================

var callGetConfig = rpc.declare({
	object: 'luci.hexojs',
	method: 'get_config',
	expect: {}
});

var callSaveConfig = rpc.declare({
	object: 'luci.hexojs',
	method: 'save_config',
	params: ['enabled', 'http_port', 'title', 'subtitle', 'author', 'language', 'url', 'deploy_repo', 'deploy_branch'],
	expect: {}
});

var callGetThemeConfig = rpc.declare({
	object: 'luci.hexojs',
	method: 'get_theme_config',
	expect: {}
});

var callSaveThemeConfig = rpc.declare({
	object: 'luci.hexojs',
	method: 'save_theme_config',
	params: ['default_mode', 'allow_toggle', 'accent_color', 'logo_symbol', 'logo_text'],
	expect: {}
});

var callListPresets = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_presets',
	expect: { presets: [] }
});

var callApplyPreset = rpc.declare({
	object: 'luci.hexojs',
	method: 'apply_preset',
	params: ['preset_id'],
	expect: {}
});

// ============================================
// Service Control
// ============================================

var callServiceStart = rpc.declare({
	object: 'luci.hexojs',
	method: 'service_start',
	expect: {}
});

var callServiceStop = rpc.declare({
	object: 'luci.hexojs',
	method: 'service_stop',
	expect: {}
});

var callServiceRestart = rpc.declare({
	object: 'luci.hexojs',
	method: 'service_restart',
	expect: {}
});

// ============================================
// GitHub Sync
// ============================================

var callGitStatus = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_status',
	expect: {}
});

var callGitInit = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_init',
	params: ['repo', 'branch'],
	expect: {}
});

var callGitClone = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_clone',
	params: ['repo', 'branch'],
	expect: {}
});

var callGitPull = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_pull',
	expect: {}
});

var callGitPush = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_push',
	params: ['message', 'force'],
	expect: {}
});

var callGitFetch = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_fetch',
	expect: {}
});

var callGitLog = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_log',
	expect: {}
});

var callGitReset = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_reset',
	params: ['hard'],
	expect: {}
});

var callGitSetCredentials = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_set_credentials',
	params: ['name', 'email'],
	expect: {}
});

var callGitGetCredentials = rpc.declare({
	object: 'luci.hexojs',
	method: 'git_get_credentials',
	expect: {}
});

// ============================================
// Utility Functions
// ============================================

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
	if (!dateStr) return '-';
	var d = new Date(dateStr);
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function slugify(text) {
	return text.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

function getStatusIcon(running) {
	return running ? '\u2705' : '\u26AA';
}

function getCategoryIcon(category) {
	var icons = {
		'security': '\uD83D\uDD10',
		'linux': '\uD83D\uDC27',
		'dev': '\uD83D\uDCBB',
		'tutorials': '\uD83D\uDCDA',
		'tools': '\uD83D\uDEE0',
		'default': '\uD83D\uDCC1'
	};
	return icons[category] || icons['default'];
}

// ============================================
// Combined Data Fetchers
// ============================================

function getDashboardData() {
	return Promise.all([
		callStatus(),
		callSiteStats(),
		callListPosts(),
		callPreviewStatus()
	]).then(function(results) {
		return {
			status: results[0],
			stats: results[1],
			posts: results[2].posts || [],
			preview: results[3]
		};
	});
}

function getPostsData() {
	return Promise.all([
		callListPosts(),
		callListDrafts(),
		callListCategories(),
		callListTags()
	]).then(function(results) {
		return {
			posts: results[0].posts || [],
			drafts: results[1].drafts || [],
			categories: results[2].categories || [],
			tags: results[3].tags || []
		};
	});
}

function getEditorData(slug) {
	if (slug) {
		return Promise.all([
			callGetPost(slug),
			callListCategories(),
			callListTags()
		]).then(function(results) {
			return {
				post: results[0],
				categories: results[1].categories || [],
				tags: results[2].tags || []
			};
		});
	}
	return Promise.all([
		callListCategories(),
		callListTags()
	]).then(function(results) {
		return {
			post: null,
			categories: results[0].categories || [],
			tags: results[1].tags || []
		};
	});
}

function getDeployData() {
	return Promise.all([
		callStatus(),
		callDeployStatus(),
		callGetConfig()
	]).then(function(results) {
		return {
			status: results[0],
			deploy: results[1],
			config: results[2]
		};
	});
}

function getGitSyncData() {
	return Promise.all([
		callGitStatus(),
		callGitGetCredentials(),
		callGitLog()
	]).then(function(results) {
		return {
			status: results[0],
			credentials: results[1],
			commits: results[2].commits || []
		};
	}).catch(function() {
		return {
			status: { is_repo: false },
			credentials: {},
			commits: []
		};
	});
}

// ============================================
// Export API Module
// ============================================

return baseclass.extend({
	// Status
	getStatus: callStatus,
	getSiteStats: callSiteStats,

	// Posts
	listPosts: callListPosts,
	getPost: callGetPost,
	createPost: callCreatePost,
	updatePost: callUpdatePost,
	deletePost: callDeletePost,
	publishPost: callPublishPost,
	listDrafts: callListDrafts,
	searchPosts: callSearchPosts,

	// Taxonomy
	listCategories: callListCategories,
	listTags: callListTags,

	// Media
	listMedia: callListMedia,
	deleteMedia: callDeleteMedia,

	// Apps
	listApps: callListApps,
	createApp: callCreateApp,

	// Build & Deploy
	generate: callGenerate,
	clean: callClean,
	deploy: callDeploy,
	getDeployStatus: callDeployStatus,

	// Preview
	previewStart: callPreviewStart,
	previewStatus: callPreviewStatus,

	// Configuration
	getConfig: callGetConfig,
	saveConfig: callSaveConfig,
	getThemeConfig: callGetThemeConfig,
	saveThemeConfig: callSaveThemeConfig,
	listPresets: callListPresets,
	applyPreset: callApplyPreset,

	// Service
	serviceStart: callServiceStart,
	serviceStop: callServiceStop,
	serviceRestart: callServiceRestart,

	// Utility
	formatBytes: formatBytes,
	formatDate: formatDate,
	slugify: slugify,
	getStatusIcon: getStatusIcon,
	getCategoryIcon: getCategoryIcon,

	// Git Sync
	gitStatus: callGitStatus,
	gitInit: callGitInit,
	gitClone: callGitClone,
	gitPull: callGitPull,
	gitPush: callGitPush,
	gitFetch: callGitFetch,
	gitLog: callGitLog,
	gitReset: callGitReset,
	gitSetCredentials: callGitSetCredentials,
	gitGetCredentials: callGitGetCredentials,

	// Combined fetchers
	getDashboardData: getDashboardData,
	getPostsData: getPostsData,
	getEditorData: getEditorData,
	getDeployData: getDeployData,
	getGitSyncData: getGitSyncData
});
