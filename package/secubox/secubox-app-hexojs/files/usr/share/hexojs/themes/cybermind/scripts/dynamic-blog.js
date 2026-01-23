/**
 * ═══════════════════════════════════════════════════════════════════════════
 * dynamic-blog.js - Génération dynamique des catégories et menus
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce script scanne automatiquement source/blog/ pour :
 * - Découvrir les catégories depuis les sous-dossiers
 * - Lire les métadonnées depuis les index.md de chaque catégorie
 * - Générer les helpers pour les templates
 * - Créer les données de menu dynamiquement
 * 
 * Structure attendue :
 * source/blog/
 * ├── index.md              # Page d'accueil du blog
 * ├── cybersecurity/
 * │   ├── index.md          # Métadonnées de la catégorie
 * │   ├── article1.md
 * │   └── article2.md
 * ├── embedded/
 * │   ├── index.md
 * │   └── ...
 * 
 * Les métadonnées de catégorie sont lues depuis le front matter de index.md :
 * ---
 * title: "Cybersécurité"
 * layout: category
 * category: cybersecurity
 * icon: "🛡️"
 * color: "#00ff88"
 * description: "Articles sur la sécurité"
 * order: 1
 * ---
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const pathFn = require('path');

// Cache des catégories découvertes
let discoveredCategories = null;
let categoriesLastScan = 0;
const CACHE_TTL = 5000; // 5 secondes

// Couleurs et icônes par défaut
const DEFAULT_COLORS = [
  '#00ff88', '#ff6600', '#ffcc00', '#ff6699', 
  '#9966ff', '#66ccff', '#06b6d4', '#ef4444'
];
const DEFAULT_ICONS = ['📁', '📂', '🗂️', '📋', '📄', '📝', '📑', '🏷️'];

/**
 * Parse le front matter YAML d'un fichier markdown
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const yaml = match[1];
  const data = {};
  
  // Parser simple pour YAML basique
  yaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Enlever les guillemets
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Convertir les nombres
      if (/^\d+$/.test(value)) {
        value = parseInt(value, 10);
      }
      
      data[key] = value;
    }
  });
  
  return data;
}

/**
 * Scanne le dossier source/blog/ pour découvrir les catégories
 */
function scanCategories(hexo) {
  const now = Date.now();
  
  // Utiliser le cache si récent
  if (discoveredCategories && (now - categoriesLastScan) < CACHE_TTL) {
    return discoveredCategories;
  }
  
  const sourceDir = hexo.source_dir;
  const blogDir = pathFn.join(sourceDir, 'blog');
  const categories = [];
  
  // Vérifier que le dossier blog existe
  if (!fs.existsSync(blogDir)) {
    hexo.log.warn('[dynamic-blog] Dossier source/blog/ non trouvé');
    return [];
  }
  
  // Lister les sous-dossiers
  const items = fs.readdirSync(blogDir, { withFileTypes: true });
  let orderIndex = 0;
  
  items.forEach(item => {
    if (!item.isDirectory()) return;
    
    const slug = item.name.toLowerCase();
    const catDir = pathFn.join(blogDir, item.name);
    const indexFile = pathFn.join(catDir, 'index.md');
    
    // Valeurs par défaut
    let catData = {
      slug: slug,
      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      icon: DEFAULT_ICONS[orderIndex % DEFAULT_ICONS.length],
      color: DEFAULT_COLORS[orderIndex % DEFAULT_COLORS.length],
      description: '',
      order: 100 + orderIndex,
      path: `/blog/${slug}/`
    };
    
    // Lire les métadonnées depuis index.md si présent
    if (fs.existsSync(indexFile)) {
      try {
        const content = fs.readFileSync(indexFile, 'utf-8');
        const frontMatter = parseFrontMatter(content);
        
        if (frontMatter.title) catData.name = frontMatter.title.replace(/^[^\w\s]*\s*/, ''); // Enlever emoji du début
        if (frontMatter.icon) catData.icon = frontMatter.icon;
        if (frontMatter.color) catData.color = frontMatter.color;
        if (frontMatter.description) catData.description = frontMatter.description;
        if (frontMatter.order !== undefined) catData.order = frontMatter.order;
        
        // Garder le titre original avec emoji si présent
        if (frontMatter.title && /^[^\w]/.test(frontMatter.title)) {
          catData.fullTitle = frontMatter.title;
        }
      } catch (e) {
        hexo.log.warn(`[dynamic-blog] Erreur lecture ${indexFile}: ${e.message}`);
      }
    }
    
    categories.push(catData);
    orderIndex++;
  });
  
  // Trier par ordre
  categories.sort((a, b) => a.order - b.order);
  
  // Mettre en cache
  discoveredCategories = categories;
  categoriesLastScan = now;
  
  hexo.log.info(`[dynamic-blog] ${categories.length} catégories découvertes: ${categories.map(c => c.slug).join(', ')}`);
  
  return categories;
}

/**
 * Compte les articles dans une catégorie
 */
function countPostsInCategory(hexo, categorySlug) {
  const targetSlug = categorySlug.toLowerCase();
  let count = 0;
  
  // Compter dans site.posts
  if (hexo.locals.get('posts')) {
    hexo.locals.get('posts').forEach(post => {
      if (getPostCategory(post) === targetSlug) {
        count++;
      }
    });
  }
  
  // Compter dans site.pages (pour les articles dans blog/)
  if (hexo.locals.get('pages')) {
    hexo.locals.get('pages').forEach(page => {
      if (!page.source) return;
      if (page.source.endsWith('index.md')) return;
      if (page.layout === 'category' || page.layout === 'blog-index') return;
      
      if (getPostCategory(page) === targetSlug) {
        count++;
      }
    });
  }
  
  return count;
}

/**
 * Extrait la catégorie d'un post/page
 */
function getPostCategory(post) {
  // 1. Depuis category (string)
  if (post.category && typeof post.category === 'string') {
    return post.category.toLowerCase();
  }
  
  // 2. Depuis categories (Hexo)
  if (post.categories && post.categories.length > 0) {
    try {
      const cats = post.categories.toArray ? post.categories.toArray() : [];
      if (cats.length > 0 && cats[0]) {
        const c = cats[0];
        if (typeof c === 'string') return c.toLowerCase();
        if (c.name) return c.name.toLowerCase();
        if (c.slug) return c.slug.toLowerCase();
      }
    } catch(e) {}
  }
  
  // 3. Depuis le chemin source
  if (post.source) {
    const match = post.source.match(/blog\/([^\/]+)\//);
    if (match) return match[1].toLowerCase();
  }
  
  return null;
}

/**
 * Récupère tous les articles du blog
 */
function getAllBlogPosts(hexo) {
  const allPosts = [];
  const categories = scanCategories(hexo);
  const validSlugs = categories.map(c => c.slug);
  
  // Posts classiques
  if (hexo.locals.get('posts')) {
    hexo.locals.get('posts').forEach(post => {
      allPosts.push(post);
    });
  }
  
  // Pages dans blog/
  if (hexo.locals.get('pages')) {
    hexo.locals.get('pages').forEach(page => {
      if (!page.source || !page.source.includes('blog/')) return;
      if (page.source.endsWith('index.md')) return;
      if (page.layout === 'category' || page.layout === 'blog-index') return;
      allPosts.push(page);
    });
  }
  
  // Trier par date décroissante
  allPosts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  return allPosts;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS HEXO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper: Obtenir toutes les catégories découvertes
 */
hexo.extend.helper.register('get_blog_categories', function() {
  const categories = scanCategories(hexo);
  const self = this;
  
  // Ajouter le count à chaque catégorie
  return categories.map(cat => ({
    ...cat,
    count: countPostsInCategory(hexo, cat.slug)
  }));
});

/**
 * Helper: Obtenir les infos d'une catégorie
 */
hexo.extend.helper.register('get_category_info', function(slug) {
  if (!slug) return { name: 'Catégorie', color: '#888888', icon: '📁' };
  
  const categories = scanCategories(hexo);
  const cat = categories.find(c => c.slug === slug.toLowerCase());
  
  if (cat) return cat;
  
  // Fallback
  return { 
    slug: slug, 
    name: slug, 
    color: '#888888', 
    icon: '📁',
    description: ''
  };
});

/**
 * Helper: Obtenir tous les articles du blog
 */
hexo.extend.helper.register('get_blog_posts', function() {
  return getAllBlogPosts(hexo);
});

/**
 * Helper: Obtenir les articles d'une catégorie
 */
hexo.extend.helper.register('get_posts_by_category', function(categorySlug) {
  if (!categorySlug) return [];
  
  const targetSlug = categorySlug.toLowerCase();
  const allPosts = getAllBlogPosts(hexo);
  
  return allPosts.filter(post => getPostCategory(post) === targetSlug);
});

/**
 * Helper: Compter les articles d'une catégorie
 */
hexo.extend.helper.register('count_posts_by_category', function(categorySlug) {
  return countPostsInCategory(hexo, categorySlug);
});

/**
 * Helper: Extraire la catégorie d'un post
 */
hexo.extend.helper.register('get_post_category', function(post) {
  return getPostCategory(post);
});

/**
 * Helper: Générer le menu du blog
 */
hexo.extend.helper.register('get_blog_menu', function() {
  const categories = scanCategories(hexo);
  
  return categories.map(cat => ({
    name: cat.name,
    icon: cat.icon,
    path: cat.path,
    color: cat.color
  }));
});

/**
 * Helper: Générer les données pour le menu principal
 */
hexo.extend.helper.register('get_dynamic_menu', function() {
  const categories = scanCategories(hexo);
  
  // Menu blog avec sous-catégories
  const blogMenu = {
    name: 'Blog',
    icon: '📚',
    path: '/blog/',
    children: categories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      path: cat.path,
      color: cat.color
    }))
  };
  
  return blogMenu;
});

// ═══════════════════════════════════════════════════════════════════════════
// FILTRE: Ajouter la catégorie depuis le chemin
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.filter.register('before_post_render', function(data) {
  if (!data.source || !data.source.includes('blog/')) {
    return data;
  }
  
  const match = data.source.match(/blog\/([^\/]+)\//);
  if (match && match[1] !== 'index.md') {
    const catSlug = match[1].toLowerCase();
    
    if (!data.category) {
      data.category = catSlug;
    }
    
    // Ajouter les infos de catégorie
    const categories = scanCategories(hexo);
    const catInfo = categories.find(c => c.slug === catSlug);
    if (catInfo) {
      data._categoryInfo = catInfo;
    }
  }
  
  return data;
});

// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR: Injecter les données de catégories dans le thème
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.generator.register('blog_categories_data', function(locals) {
  const categories = scanCategories(hexo);
  
  // Ajouter les counts
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: countPostsInCategory(hexo, cat.slug)
  }));
  
  // Stocker dans hexo.theme.config pour accès dans les templates
  if (!hexo.theme) hexo.theme = {};
  if (!hexo.theme.config) hexo.theme.config = {};
  hexo.theme.config.blog_categories = categoriesWithCounts;
  
  // Pas de fichier généré, juste injection de données
  return [];
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════════════════════════

hexo.log.info('[dynamic-blog] Script chargé');
hexo.log.info('  → Scanne automatiquement source/blog/ pour les catégories');
hexo.log.info('  → Helpers: get_blog_categories, get_blog_posts, get_posts_by_category');
hexo.log.info('  → Menu dynamique: get_blog_menu, get_dynamic_menu');
