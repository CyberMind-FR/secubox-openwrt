'use strict';

return {
    stylesheet: function(name) {
        var primary = L.resource('secubox-theme/system-hub/' + name);
        var fallback = L.resource('system-hub/' + name);
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = primary;
        link.onerror = function() {
            if (link.dataset.fallbackApplied) return;
            link.dataset.fallbackApplied = '1';
            console.warn('System Hub theme asset missing:', primary, 'falling back to', fallback);
            link.href = fallback;
        };
        return link;
    }
};
