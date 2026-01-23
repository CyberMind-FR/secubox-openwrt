/**
 * DPlayer Video Tag Helper
 * DPlayer is an HTML5 video player with danmaku support
 * 
 * Syntax: 
 *   {% dplayer url="video.mp4" %}
 *   OR
 *   {% dplayer url="video.mp4" pic="poster.jpg" %}
 *   OR
 *   {% dplayer url="video.mp4" %}{% enddplayer %}
 * 
 * Parameters:
 *   - url: Video URL (required)
 *   - pic: Poster/thumbnail image (optional)
 *   - type: Video type (auto/hls/dash, default: auto)
 *   - loop: Loop video (true/false)
 * 
 * Example:
 *   {% dplayer url="/videos/demo.mp4" pic="/images/poster.jpg" %}
 *   {% dplayer url="https://example.com/video.mp4" loop="true" %}
 */

hexo.extend.tag.register('dplayer', function(args, content) {
    // Parse arguments
    const params = {};
    args.forEach(arg => {
        const match = arg.match(/(\w+)=["']?([^"']+)["']?/);
        if (match) {
            params[match[1]] = match[2];
        }
    });
    
    const videoUrl = params.url || params.video;
    
    if (!videoUrl) {
        return '<p style="color: red;">Error: DPlayer requires a video URL. Usage: {% dplayer url="video.mp4" %}</p>';
    }
    
    const poster = params.pic || params.poster || '';
    const videoType = params.type || 'auto';
    const loop = params.loop === 'true' ? 'loop' : '';
    const autoplay = params.autoplay === 'true' ? 'autoplay' : '';
    
    // Generate unique ID for this player
    const playerId = 'dplayer-' + Math.random().toString(36).substr(2, 9);
    
    return `<div class="dplayer-container">
    <video 
        id="${playerId}"
        class="dplayer-video"
        controls
        ${loop}
        ${autoplay}
        ${poster ? `poster="${poster}"` : ''}
        preload="metadata">
        <source src="${videoUrl}" type="video/mp4">
        Votre navigateur ne supporte pas la lecture de vidéos.
    </video>
</div>`;
}, {ends: true});

/**
 * Video Tag (simpler alternative)
 * Syntax: {% video url %}
 */
hexo.extend.tag.register('video', function(args, content) {
    const videoUrl = args[0];
    const poster = args[1] || '';
    
    if (!videoUrl) {
        return '<p style="color: red;">Error: Video URL is required</p>';
    }
    
    const playerId = 'video-' + Math.random().toString(36).substr(2, 9);
    
    return `<div class="video-container">
    <video 
        id="${playerId}"
        class="video-player"
        controls
        preload="metadata"
        ${poster ? `poster="${poster}"` : ''}>
        <source src="${videoUrl}" type="video/mp4">
        Votre navigateur ne supporte pas la lecture de vidéos.
    </video>
</div>`;
}, {ends: true});
