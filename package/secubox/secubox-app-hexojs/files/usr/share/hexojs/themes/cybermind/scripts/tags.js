/**
 * Additional Tag Helpers for Hexo Theme CyberMind
 */

// Image with caption
// Syntax: {% img src "alt text" "caption" %}
hexo.extend.tag.register('img', function(args) {
    const src = args[0];
    const alt = args[1] ? args[1].replace(/"/g, '') : '';
    const caption = args[2] ? args[2].replace(/"/g, '') : '';
    
    if (!src) {
        return '<p style="color: red;">Error: Image source is required</p>';
    }
    
    let html = '<figure class="post-image">';
    html += `<img src="${src}" alt="${alt}" loading="lazy">`;
    if (caption) {
        html += `<figcaption>${caption}</figcaption>`;
    }
    html += '</figure>';
    
    return html;
});

// Blockquote with author
// Syntax: {% quote author %}text{% endquote %}
hexo.extend.tag.register('quote', function(args, content) {
    const author = args.join(' ');
    
    let html = '<blockquote class="custom-quote">';
    html += content;
    if (author) {
        html += `<cite>— ${author}</cite>`;
    }
    html += '</blockquote>';
    
    return html;
}, {ends: true});

// Note/Alert box
// Syntax: {% note type %}content{% endnote %}
// Types: info, warning, success, error
hexo.extend.tag.register('note', function(args, content) {
    const type = args[0] || 'info';
    const validTypes = ['info', 'warning', 'success', 'error'];
    const noteType = validTypes.includes(type) ? type : 'info';
    
    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✅',
        error: '❌'
    };
    
    return `<div class="note note-${noteType}">
    <div class="note-icon">${icons[noteType]}</div>
    <div class="note-content">${content}</div>
</div>`;
}, {ends: true});

// Code group (tabs for multiple code blocks)
// Syntax: {% codegroup %}
// {% code lang:python %}...{% endcode %}
// {% code lang:javascript %}...{% endcode %}
// {% endcodegroup %}
hexo.extend.tag.register('codegroup', function(args, content) {
    return `<div class="code-group">${content}</div>`;
}, {ends: true});

// Collapsible/Accordion
// Syntax: {% collapse title %}content{% endcollapse %}
hexo.extend.tag.register('collapse', function(args, content) {
    const title = args.join(' ') || 'Cliquez pour déplier';
    const id = 'collapse-' + Math.random().toString(36).substr(2, 9);
    
    return `<details class="collapse-section">
    <summary>${title}</summary>
    <div class="collapse-content">${content}</div>
</details>`;
}, {ends: true});

// Link button
// Syntax: {% button url "text" %}
hexo.extend.tag.register('button', function(args) {
    const url = args[0];
    const text = args.slice(1).join(' ').replace(/"/g, '') || 'Cliquez ici';
    
    if (!url) {
        return '<p style="color: red;">Error: URL is required</p>';
    }
    
    return `<a href="${url}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${text}</a>`;
});

// Alias court pour button
// Syntax: {% btn url "text" %}
hexo.extend.tag.register('btn', function(args) {
    const url = args[0];
    const text = args.slice(1).join(' ').replace(/"/g, '') || 'Cliquez ici';
    
    if (!url) {
        return '<p style="color: red;">Error: URL is required</p>';
    }
    
    return `<a href="${url}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${text}</a>`;
});

// Vimeo Video
// Syntax: {% vimeo video_id %}
hexo.extend.tag.register('vimeo', function(args) {
    const videoId = args[0];
    
    if (!videoId) {
        return '<p style="color: red;">Error: Vimeo video ID is required</p>';
    }
    
    return `<div class="vimeo-embed">
    <iframe 
        src="https://player.vimeo.com/video/${videoId}" 
        frameborder="0" 
        allow="autoplay; fullscreen; picture-in-picture" 
        allowfullscreen>
    </iframe>
</div>`;
});

// GitHub Gist
// Syntax: {% gist user/gist_id %}
hexo.extend.tag.register('gist', function(args) {
    const gistPath = args[0];
    
    if (!gistPath) {
        return '<p style="color: red;">Error: Gist path is required (user/gist_id)</p>';
    }
    
    return `<script src="https://gist.github.com/${gistPath}.js"></script>`;
});

// CodePen
// Syntax: {% codepen user/pen_id %}
hexo.extend.tag.register('codepen', function(args) {
    const penPath = args[0];
    const height = args[1] || '400';
    
    if (!penPath) {
        return '<p style="color: red;">Error: CodePen path is required (user/pen_id)</p>';
    }
    
    const [user, penId] = penPath.split('/');
    
    return `<iframe 
    height="${height}" 
    style="width: 100%; margin: 2rem 0; border-radius: 8px;" 
    scrolling="no" 
    title="CodePen Embed" 
    src="https://codepen.io/${user}/embed/${penId}?default-tab=result" 
    frameborder="no" 
    loading="lazy" 
    allowtransparency="true" 
    allowfullscreen="true">
</iframe>`;
});
