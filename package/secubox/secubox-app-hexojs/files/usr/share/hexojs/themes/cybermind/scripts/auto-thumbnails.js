/**
 * ═══════════════════════════════════════════════════════════════════════════
 * auto-thumbnails.js - Génération automatique de vignettes pour Hexo
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Hiérarchie de sélection de vignette :
 * 1. cover       - Image spécifiée manuellement
 * 2. thumbnail   - Alias de cover
 * 3. images[0]   - Première image du front matter
 * 4. og_image    - Image Open Graph
 * 5. screenshot  - Capture de l'embed_url (si service configuré)
 * 6. content     - Première image extraite du contenu HTML
 * 7. generated   - Image générée automatiquement avec tags/catégorie
 * 
 * Pour la génération automatique:
 * - Utilise thumbnail-generator.py si disponible
 * - Sinon génère une carte HTML/CSS dynamique
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const pathFn = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Dossier de sortie des vignettes générées
  thumbnailsDir: 'source/images/thumbnails',
  
  // Préfixe des fichiers générés
  prefix: 'auto-thumb-',
  
  // Dimensions
  width: 1200,
  height: 630,
  
  // Service de screenshot (optionnel)
  screenshotService: null, // 'https://api.screenshotmachine.com?...'
  
  // Activer la génération Python
  usePython: true
};

// Couleurs par catégorie
const CATEGORY_COLORS = {
  'meditation': { bg: '#0e1628', accent: '#06b6d4', gradient: ['#06b6d4', '#3b82f6'] },
  'wellness': { bg: '#0e1f1a', accent: '#10b981', gradient: ['#10b981', '#06b6d4'] },
  'creative': { bg: '#1f0e1f', accent: '#ec4899', gradient: ['#ec4899', '#a855f7'] },
  'philosophy': { bg: '#1a0e28', accent: '#a855f7', gradient: ['#a855f7', '#6366f1'] },
  'security': { bg: '#1f0e0e', accent: '#ef4444', gradient: ['#ef4444', '#f97316'] },
  'cybersecurity': { bg: '#0e1f1a', accent: '#00ff88', gradient: ['#00ff88', '#06b6d4'] },
  'dev': { bg: '#0e1628', accent: '#3b82f6', gradient: ['#3b82f6', '#06b6d4'] },
  'tools': { bg: '#1f1a0e', accent: '#f97316', gradient: ['#f97316', '#eab308'] },
  'projects': { bg: '#0e1628', accent: '#06b6d4', gradient: ['#06b6d4', '#a855f7'] },
  'default': { bg: '#12121a', accent: '#6366f1', gradient: ['#6366f1', '#a855f7'] }
};

// Icônes par tag
const TAG_ICONS = {
  'meditation': '🧘', 'audio': '🎵', 'visual': '👁️', 'pwa': '📱',
  'frequencies': '〰️', 'wellness': '💚', 'rife': '〰️', 'spooky2': '📡',
  'creative': '🎨', 'generative': '✨', 'art': '🖼️', 'geometry': '🔮',
  'neuroscience': '🧠', 'brainwave': '🌊', 'audiostrobe': '💡',
  'security': '🛡️', 'linux': '🐧', 'embedded': '⚙️', 'philosophy': '☯️',
  'open-source': '🔓', 'python': '🐍', 'javascript': '📜', 'default': '🏷️'
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extrait les tags d'une page
 */
function extractTags(page) {
  const tags = [];
  if (page.tags && page.tags.length > 0) {
    try {
      const arr = page.tags.toArray ? page.tags.toArray() : 
                  (Array.isArray(page.tags) ? page.tags : []);
      arr.forEach(t => {
        const name = typeof t === 'string' ? t : (t.name || '');
        if (name) tags.push(name);
      });
    } catch(e) {}
  }
  return tags;
}

/**
 * Génère un slug à partir du titre
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Vérifie si le générateur Python est disponible
 */
function isPythonAvailable() {
  const scriptPath = pathFn.join(__dirname, 'thumbnail-generator.py');
  if (!fs.existsSync(scriptPath)) return false;
  
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return true;
  } catch(e) {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RÉSOLUTION DE VIGNETTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Résout la meilleure vignette disponible pour une page
 * Retourne { type, src, needsGeneration, data }
 */
function resolveThumbnail(page, hexo) {
  const result = {
    type: 'none',
    src: null,
    needsGeneration: false,
    data: null
  };
  
  // 1. Cover explicite
  if (page.cover) {
    result.type = 'cover';
    result.src = page.cover;
    return result;
  }
  
  // 2. Thumbnail
  if (page.thumbnail) {
    result.type = 'thumbnail';
    result.src = page.thumbnail;
    return result;
  }
  
  // 3. Images array
  if (page.images && Array.isArray(page.images) && page.images.length > 0) {
    result.type = 'images';
    result.src = page.images[0];
    return result;
  }
  
  // 4. og_image
  if (page.og_image) {
    result.type = 'og_image';
    result.src = page.og_image;
    return result;
  }
  
  // 5. Screenshot de l'embed (si service configuré)
  if (page.embed_url && CONFIG.screenshotService) {
    result.type = 'screenshot';
    result.src = `${CONFIG.screenshotService}&url=${encodeURIComponent(page.embed_url)}`;
    return result;
  }
  
  // 6. Première image du contenu
  if (page.content) {
    const imgMatch = page.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
      result.type = 'content';
      result.src = imgMatch[1];
      return result;
    }
  }
  
  // 7. Génération nécessaire
  result.type = 'generated';
  result.needsGeneration = true;
  result.data = {
    title: page.title || 'Application',
    icon: page.icon || '🚀',
    category: page.category || 'default',
    tags: extractTags(page),
    description: page.description || ''
  };
  
  // Calculer le chemin attendu
  const slug = slugify(page.title || 'app');
  result.src = `/images/thumbnails/${CONFIG.prefix}${slug}.jpg`;
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATION PYTHON
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère une vignette via le script Python
 */
function generateWithPython(data, outputPath, hexo) {
  const scriptPath = pathFn.join(__dirname, 'thumbnail-generator.py');
  
  const tagsArg = data.tags.join(',');
  const cmd = `python3 "${scriptPath}" ` +
    `--title "${data.title.replace(/"/g, '\\"')}" ` +
    `--icon "${data.icon}" ` +
    `--category "${data.category}" ` +
    `--tags "${tagsArg}" ` +
    `--description "${(data.description || '').substring(0, 100).replace(/"/g, '\\"')}" ` +
    `--output "${outputPath}"`;
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch(e) {
    hexo.log.warn(`[auto-thumbnails] Erreur génération Python: ${e.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATION HTML/CSS (FALLBACK)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère le HTML/CSS pour une vignette dynamique
 */
function generateDynamicHTML(data) {
  const colors = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.default;
  
  // Tags avec icônes
  let tagsHTML = '';
  data.tags.slice(0, 5).forEach(tag => {
    const icon = TAG_ICONS[tag.toLowerCase()] || TAG_ICONS.default;
    tagsHTML += `<span class="tag">${icon} ${tag}</span>`;
  });
  
  return `
<div class="dynamic-thumbnail" style="
  width: 100%;
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
  box-sizing: border-box;
">
  <!-- Glow effect -->
  <div style="
    position: absolute;
    top: -20%;
    right: -10%;
    width: 60%;
    height: 80%;
    background: radial-gradient(circle, ${colors.accent}15 0%, transparent 70%);
    pointer-events: none;
  "></div>
  
  <!-- Category badge -->
  <div style="
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: ${colors.accent};
    color: #000;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  ">${data.category}</div>
  
  <!-- Header -->
  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: auto;">
    <span style="font-size: 2.5rem;">${data.icon}</span>
    <span style="font-size: 1.3rem; font-weight: 600; color: ${colors.accent};">${data.title}</span>
  </div>
  
  <!-- Description -->
  ${data.description ? `
  <div style="
    font-size: 0.85rem;
    color: #9898a6;
    line-height: 1.4;
    margin: 0.5rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  ">${data.description.substring(0, 120)}${data.description.length > 120 ? '...' : ''}</div>
  ` : ''}
  
  <!-- Tags -->
  <div style="
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: auto;
  ">
    ${data.tags.slice(0, 5).map(tag => {
      const icon = TAG_ICONS[tag.toLowerCase()] || TAG_ICONS.default;
      return `<span style="
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: rgba(255,255,255,0.08);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        color: #c8c8d0;
      ">${icon} ${tag}</span>`;
    }).join('')}
  </div>
  
  <!-- Bottom gradient line -->
  <div style="
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]});
  "></div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS HEXO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper: Obtenir la vignette résolue
 */
hexo.extend.helper.register('get_thumbnail', function(page) {
  return resolveThumbnail(page, hexo);
});

/**
 * Helper: Rendre la vignette (image ou HTML dynamique)
 */
hexo.extend.helper.register('render_smart_thumbnail', function(page, options = {}) {
  const thumb = resolveThumbnail(page, hexo);
  const className = options.class || 'smart-thumbnail';
  
  // Si on a une image
  if (thumb.src && !thumb.needsGeneration) {
    return `<div class="${className}">
      <img src="${thumb.src}" alt="${page.title || 'Thumbnail'}" loading="lazy" 
           style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
    </div>`;
  }
  
  // Si génération nécessaire mais image générée existe
  if (thumb.needsGeneration && thumb.src) {
    // Vérifier si le fichier existe
    const absolutePath = pathFn.join(hexo.source_dir, thumb.src.replace(/^\//, ''));
    if (fs.existsSync(absolutePath)) {
      return `<div class="${className}">
        <img src="${thumb.src}" alt="${page.title || 'Thumbnail'}" loading="lazy" 
             style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
      </div>`;
    }
  }
  
  // Fallback: HTML dynamique
  if (thumb.data) {
    return `<div class="${className}">${generateDynamicHTML(thumb.data)}</div>`;
  }
  
  // Placeholder minimal
  const colors = CATEGORY_COLORS[page.category] || CATEGORY_COLORS.default;
  return `<div class="${className}" style="
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, ${colors.bg}, #0a0a0f);
    border: 1px solid ${colors.accent}30;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <span style="font-size: 3rem; opacity: 0.5;">${page.icon || '🚀'}</span>
  </div>`;
});

/**
 * Helper: Obtenir les couleurs d'une catégorie
 */
hexo.extend.helper.register('get_thumbnail_colors', function(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
});

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR: Pré-génère les vignettes au build
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.generator.register('auto_thumbnails', function(locals) {
  if (!CONFIG.usePython || !isPythonAvailable()) {
    hexo.log.info('[auto-thumbnails] Génération Python désactivée, utilisation du fallback HTML');
    return [];
  }
  
  // Créer le dossier de vignettes
  const thumbDir = pathFn.join(hexo.source_dir, 'images', 'thumbnails');
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }
  
  // Collecter les pages nécessitant génération
  const toGenerate = [];
  
  // Apps
  locals.pages.forEach(page => {
    if (page.layout !== 'app') return;
    
    const thumb = resolveThumbnail(page, hexo);
    if (thumb.needsGeneration) {
      const slug = slugify(page.title || 'app');
      const outputPath = pathFn.join(thumbDir, `${CONFIG.prefix}${slug}.jpg`);
      
      // Ne pas régénérer si existe
      if (!fs.existsSync(outputPath)) {
        toGenerate.push({ data: thumb.data, outputPath });
      }
    }
  });
  
  // Générer
  if (toGenerate.length > 0) {
    hexo.log.info(`[auto-thumbnails] Génération de ${toGenerate.length} vignettes...`);
    
    toGenerate.forEach(item => {
      generateWithPython(item.data, item.outputPath, hexo);
    });
  }
  
  return [];
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════════════════════════

hexo.log.info('[auto-thumbnails] Système de vignettes intelligentes chargé');
hexo.log.info('  → get_thumbnail(page) - Résout la meilleure vignette');
hexo.log.info('  → render_smart_thumbnail(page, options) - Génère le HTML');
if (isPythonAvailable()) {
  hexo.log.info('  → Génération Python disponible ✓');
} else {
  hexo.log.info('  → Fallback HTML/CSS (Python non disponible)');
}
