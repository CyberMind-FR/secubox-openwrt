/**
 * APlayer Audio Tag Helper
 * APlayer is an HTML5 audio player
 * 
 * Syntax: 
 *   {% aplayer title author url %}
 *   OR
 *   {% aplayer title author url pic %}
 *   OR
 *   {% aplayer title author url %}{% endaplayer %}
 * 
 * Parameters:
 *   - title: Song title (required)
 *   - author: Artist name (required)
 *   - url: Audio file URL (required)
 *   - pic: Cover image (optional)
 * 
 * Example:
 *   {% aplayer "Song Title" "Artist Name" "/music/song.mp3" %}
 *   {% aplayer "Song Title" "Artist Name" "/music/song.mp3" "/images/cover.jpg" %}
 */

hexo.extend.tag.register('aplayer', function(args, content) {
    // Parse arguments - they may be quoted
    let params = [];
    let current = '';
    let inQuote = false;
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('"') || arg.startsWith("'")) {
            inQuote = true;
            current = arg.substring(1);
            if (arg.endsWith('"') || arg.endsWith("'")) {
                inQuote = false;
                params.push(current.slice(0, -1));
                current = '';
            }
        } else if (inQuote) {
            current += ' ' + arg;
            if (arg.endsWith('"') || arg.endsWith("'")) {
                inQuote = false;
                params.push(current.slice(0, -1));
                current = '';
            }
        } else {
            params.push(arg);
        }
    }
    
    const title = params[0] || 'Audio';
    const author = params[1] || 'Unknown';
    const url = params[2];
    const pic = params[3] || '';
    
    if (!url) {
        return '<p style="color: red;">Error: APlayer requires at least title, author, and audio URL. Usage: {% aplayer "Title" "Artist" "/music/song.mp3" %}</p>';
    }
    
    // Generate unique ID for this player
    const playerId = 'aplayer-' + Math.random().toString(36).substr(2, 9);
    
    return `<div class="aplayer-container">
    <div class="aplayer-info">
        ${pic ? `<img src="${pic}" alt="${title}" class="aplayer-cover">` : ''}
        <div class="aplayer-meta">
            <div class="aplayer-title">🎵 ${title}</div>
            <div class="aplayer-author">🎤 ${author}</div>
        </div>
    </div>
    <audio 
        id="${playerId}"
        class="aplayer-audio"
        controls
        preload="metadata">
        <source src="${url}" type="audio/mpeg">
        Votre navigateur ne supporte pas la lecture audio.
    </audio>
</div>`;
}, {ends: true});

/**
 * Audio Tag (simpler alternative)
 * Syntax: {% audio url %}
 */
hexo.extend.tag.register('audio', function(args, content) {
    const audioUrl = args[0];
    
    if (!audioUrl) {
        return '<p style="color: red;">Error: Audio URL is required</p>';
    }
    
    const playerId = 'audio-' + Math.random().toString(36).substr(2, 9);
    
    return `<div class="audio-container">
    <audio 
        id="${playerId}"
        class="audio-player"
        controls
        preload="metadata">
        <source src="${audioUrl}" type="audio/mpeg">
        Votre navigateur ne supporte pas la lecture audio.
    </audio>
</div>`;
}, {ends: true});
