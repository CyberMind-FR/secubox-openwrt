'use strict';
'require view';

return view.extend({
    render: function() {
        return E('div', {}, 'TEST: This text should appear if JavaScript works!');
    }
});
