/**
 * ═══════════════════════════════════════════════════════════════════════════
 * smart-thumbnails.js - Système intelligent de vignettes pour les apps
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Hiérarchie des vignettes (fallback) :
 * 1. cover      - Image spécifiée dans le front matter
 * 2. thumbnail  - Alias de cover
 * 3. images[0]  - Première image du front matter ou contenu
 * 4. og:image   - Image Open Graph de l'URL embed (si disponible)
 * 5. screenshot - Screenshot de la page (via service externe)
 * 6. summary    - Carte avec résumé du contenu
 * 7. generated  - Image générée dynamiquement avec tags/catégories
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

// Configuration des couleurs par catégorie
const CATEGORY_COLORS = {
  'meditation': { bg: '#0e1628', accent: '#06b6d4', gradient: ['#06b6d4', '#3b82f6'] },
  'wellness': { bg: '#0e1f1a', accent: '#10b981', gradient: ['#10b981', '#06b6d4'] },
  'creative': { bg: '#1f0e1f', accent: '#ec4899', gradient: ['#ec4899', '#a855f7'] },
  'philosophy': { bg: '#1a0e28', accent: '#a855f7', gradient: ['#a855f7', '#6366f1'] },
  'security': { bg: '#1f0e0e', accent: '#ef4444', gradient: ['#ef4444', '#f97316'] },
  'cybersecurity': { bg: '#0e1f1a', accent: '#00ff88', gradient: ['#00ff88', '#06b6d4'] },
  'dev': { bg: '#0e1628', accent: '#3b82f6', gradient: ['#3b82f6', '#06b6d4'] },
  'tools': { bg: '#1f1a0e', accent: '#f97316', gradient: ['#f97316', '#eab308'] },
  'default': { bg: '#12121a', accent: '#6366f1', gradient: ['#6366f1', '#a855f7'] }
};

// Icônes par tag
const TAG_ICONS = {
  'meditation': '🧘', 'audio': '🎵', 'visual': '👁️', 'pwa': '📱',
  'frequencies': '〰️', 'wellness': '💚', 'rife': '〰️', 'spooky2': '📡',
  'creative': '🎨', 'generative': '✨', 'art': '🖼️', 'geometry': '🔮',
  'neuroscience': '🧠', 'brainwave': '🌊', 'audiostrobe': '💡',
  'security': '🛡️', 'linux': '🐧', 'embedded': '⚙️', 'philosophy': '☯️'
};

/**
 * Helper: Obtenir la vignette intelligente d'une page
 * Retourne un objet avec { type, src, data }
 */
hexo.extend.helper.register('get_smart_thumbnail', function(page) {
  const result = {
    type: 'none',
    src: null,
    data: null
  };
  
  // 1. Cover explicite
  if (page.cover) {
    result.type = 'cover';
    result.src = page.cover;
    return result;
  }
  
  // 2. Thumbnail (alias)
  if (page.thumbnail) {
    result.type = 'thumbnail';
    result.src = page.thumbnail;
    return result;
  }
  
  // 3. Premier élément du tableau images
  if (page.images && Array.isArray(page.images) && page.images.length > 0) {
    result.type = 'images';
    result.src = page.images[0];
    return result;
  }
  
  // 4. Extraire la première image du contenu
  if (page.content) {
    const imgMatch = page.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
      result.type = 'content-image';
      result.src = imgMatch[1];
      return result;
    }
  }
  
  // 5. og:image depuis embed_url (placeholder - nécessite fetch côté client)
  if (page.embed_url) {
    result.type = 'embed-preview';
    result.src = page.embed_url;
    result.data = {
      url: page.embed_url,
      fallback: 'screenshot'
    };
    return result;
  }
  
  // 6. Générer une carte résumé
  if (page.description || page.excerpt) {
    result.type = 'summary';
    result.data = {
      title: page.title || 'App',
      description: page.description || page.excerpt || '',
      icon: page.icon || '🚀',
      category: page.category || 'app'
    };
    return result;
  }
  
  // 7. Image générée avec tags/catégories
  result.type = 'generated';
  result.data = {
    title: page.title || 'Application',
    icon: page.icon || '🚀',
    category: page.category || 'default',
    tags: []
  };
  
  // Extraire les tags
  if (page.tags && page.tags.length > 0) {
    try {
      const tagsArray = page.tags.toArray ? page.tags.toArray() : 
                        (Array.isArray(page.tags) ? page.tags : []);
      result.data.tags = tagsArray.map(t => typeof t === 'string' ? t : (t.name || '')).filter(Boolean);
    } catch(e) {}
  }
  
  return result;
});

/**
 * Helper: Générer le HTML de la vignette
 */
hexo.extend.helper.register('render_thumbnail', function(page, options = {}) {
  const thumb = this.get_smart_thumbnail(page);
  const width = options.width || 400;
  const height = options.height || 225;
  const className = options.class || 'smart-thumbnail';
  
  // Couleurs de la catégorie
  const category = page.category || 'default';
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  
  switch (thumb.type) {
    case 'cover':
    case 'thumbnail':
    case 'images':
    case 'content-image':
      return `<div class="${className}" style="aspect-ratio: 16/9;">
        <img src="${thumb.src}" alt="${page.title || 'Thumbnail'}" loading="lazy" 
             style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
      </div>`;
    
    case 'embed-preview':
      // Affiche un iframe miniature ou une capture
      return `<div class="${className} embed-preview" 
                   style="aspect-ratio:16/9;background:${colors.bg};border-radius:12px;overflow:hidden;position:relative;">
        <iframe src="${thumb.src}" style="width:200%;height:200%;transform:scale(0.5);transform-origin:0 0;pointer-events:none;border:none;" loading="lazy"></iframe>
        <div class="embed-overlay" style="position:absolute;inset:0;background:linear-gradient(135deg,transparent 60%,rgba(0,0,0,0.5));"></div>
      </div>`;
    
    case 'summary':
      return this.render_summary_card(thumb.data, colors, className);
    
    case 'generated':
      return this.render_generated_card(thumb.data, colors, className);
    
    default:
      return this.render_placeholder_card(page, colors, className);
  }
});

/**
 * Helper: Carte résumé avec description
 */
hexo.extend.helper.register('render_summary_card', function(data, colors, className) {
  const truncatedDesc = (data.description || '').substring(0, 100) + (data.description?.length > 100 ? '...' : '');
  
  return `<div class="${className} summary-card" style="
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, ${colors.bg}, #0a0a0f);
    border: 1px solid ${colors.accent}30;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  ">
    <div style="font-size:2.5rem;margin-bottom:0.5rem;">${data.icon}</div>
    <div style="font-size:1.1rem;font-weight:600;color:${colors.accent};margin-bottom:0.5rem;">${data.title}</div>
    <div style="font-size:0.8rem;color:#9898a6;line-height:1.4;">${truncatedDesc}</div>
    <div style="margin-top:auto;padding-top:0.75rem;">
      <span style="background:${colors.accent}20;color:${colors.accent};padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;text-transform:uppercase;">${data.category}</span>
    </div>
  </div>`;
});

/**
 * Helper: Carte générée avec tags
 */
hexo.extend.helper.register('render_generated_card', function(data, colors, className) {
  // Construire les tags avec icônes
  let tagsHtml = '';
  const displayTags = data.tags.slice(0, 5);
  
  displayTags.forEach(tag => {
    const icon = TAG_ICONS[tag.toLowerCase()] || '🏷️';
    tagsHtml += `<span style="
      display:inline-flex;align-items:center;gap:0.3rem;
      background:rgba(255,255,255,0.1);padding:0.25rem 0.5rem;
      border-radius:4px;font-size:0.7rem;color:#c8c8d0;
    ">${icon} ${tag}</span>`;
  });
  
  return `<div class="${className} generated-card" style="
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, ${colors.gradient[0]}15, ${colors.gradient[1]}15), 
                linear-gradient(180deg, ${colors.bg}, #0a0a0f);
    border: 1px solid ${colors.accent}30;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  ">
    <!-- Décoration de fond -->
    <div style="position:absolute;top:-20%;right:-10%;width:60%;height:80%;
                background:radial-gradient(circle,${colors.accent}10 0%,transparent 70%);
                pointer-events:none;"></div>
    
    <!-- Contenu -->
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:auto;">
      <span style="font-size:2.5rem;">${data.icon}</span>
      <span style="font-size:1.2rem;font-weight:600;color:${colors.accent};">${data.title}</span>
    </div>
    
    <!-- Tags -->
    <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:1rem;">
      ${tagsHtml}
    </div>
    
    <!-- Badge catégorie -->
    <div style="position:absolute;top:1rem;right:1rem;">
      <span style="background:${colors.accent};color:#000;padding:0.2rem 0.6rem;
                   border-radius:4px;font-size:0.65rem;font-weight:600;text-transform:uppercase;">
        ${data.category}
      </span>
    </div>
  </div>`;
});

/**
 * Helper: Placeholder minimal
 */
hexo.extend.helper.register('render_placeholder_card', function(page, colors, className) {
  const icon = page.icon || '🚀';
  const title = page.title || 'Application';
  
  return `<div class="${className} placeholder-card" style="
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, ${colors.bg}, #0a0a0f);
    border: 1px solid ${colors.accent}30;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 0.5rem;
  ">
    <span style="font-size:3rem;opacity:0.7;">${icon}</span>
    <span style="font-size:0.9rem;color:${colors.accent};font-weight:500;">${title}</span>
  </div>`;
});

/**
 * Helper: Obtenir les couleurs d'une catégorie
 */
hexo.extend.helper.register('get_category_colors', function(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
});

hexo.log.info('[smart-thumbnails] Helpers de vignettes intelligentes chargés');
hexo.log.info('  → get_smart_thumbnail(page) - Analyse et retourne le type de vignette');
hexo.log.info('  → render_thumbnail(page, options) - Génère le HTML de la vignette');
