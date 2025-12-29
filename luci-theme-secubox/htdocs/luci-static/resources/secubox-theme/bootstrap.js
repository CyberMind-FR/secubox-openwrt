'use strict';
'require secubox-theme/theme as Theme';

var initialized = false;

function detectLanguage() {
	if (typeof L !== 'undefined' && L.env && L.env.lang)
		return L.env.lang;

	if (document.documentElement && document.documentElement.getAttribute('lang'))
		return document.documentElement.getAttribute('lang');

	if (navigator.language)
		return navigator.language.split('-')[0];

	return 'en';
}

function ensureStylesheet() {
	if (typeof document === 'undefined' || !document.head)
		return;

	var href = L.resource('secubox-theme/secubox-theme.css');
	var selector = 'link[data-secubox-theme=\"true\"][href=\"' + href + '\"]';

	if (document.querySelector(selector))
		return;

	var linkEl = document.createElement('link');
	linkEl.rel = 'stylesheet';
	linkEl.href = href;
	linkEl.setAttribute('data-secubox-theme', 'true');
	document.head.appendChild(linkEl);
}

function initTheme() {
	if (initialized)
		return Theme;

	initialized = true;
	Theme.init({ language: detectLanguage() });
	ensureStylesheet();
	return Theme;
}

return initTheme();
