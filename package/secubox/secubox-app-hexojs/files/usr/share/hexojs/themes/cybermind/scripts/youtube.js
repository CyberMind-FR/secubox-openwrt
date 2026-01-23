/**
 * YouTube Video Tag Helper
 * Syntax: 
 *   {% youtuber video_id %}
 *   OR
 *   {% youtuber video_id %}{% endyoutuber %}
 * 
 * Example: 
 *   {% youtuber dQw4w9WgXcQ %}
 *   {% youtuber dQw4w9WgXcQ %}{% endyoutuber %}
 */

hexo.extend.tag.register('youtuber', function(args, content) {
    const videoId = args[0];
    
    if (!videoId) {
        return '<p style="color: red;">Error: YouTube video ID is required</p>';
    }
    
    return `<div class="youtube-embed">
    <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        title="YouTube video player"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
    </iframe>
</div>`;
}, {ends: true});

/**
 * YouTube Video Tag with custom title
 * Syntax: 
 *   {% youtube video_id "Custom Title" %}
 *   OR
 *   {% youtube video_id %}...{% endyoutube %}
 */
hexo.extend.tag.register('youtube', function(args, content) {
    const videoId = args[0];
    const title = args.slice(1).join(' ').replace(/"/g, '');
    
    if (!videoId) {
        return '<p style="color: red;">Error: YouTube video ID is required</p>';
    }
    
    const videoTitle = title || 'YouTube video player';
    
    return `<div class="youtube-embed">
    <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        title="${videoTitle}"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
    </iframe>
</div>`;
}, {ends: true});
