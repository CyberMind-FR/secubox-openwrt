/**
 * ═══════════════════════════════════════════════════════════════════════════
 * blog-posts-generator.js
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce script permet d'utiliser source/blog/{category}/*.md comme source d'articles
 * au lieu de source/_posts/
 * 
 * Les articles sont automatiquement ajoutés à site.posts et la catégorie
 * est détectée depuis le dossier parent.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const pathFn = require('path');

// Configuration des catégories
const CATEGORIES_INFO = {
  'cybersecurity': { name: 'Cybersécurité', color: '#00ff88', icon: '🛡️' },
  'embedded': { name: 'Embarqué', color: '#ff6600', icon: '⚙️' },
  'linux': { name: 'Linux', color: '#ffcc00', icon: '🐧' },
  'creative': { name: 'Créativité', color: '#ff6699', icon: '🎨' },
  'philosophy': { name: 'Philosophie', color: '#9966ff', icon: '🧘' },
  'tutorials': { name: 'Tutoriels', color: '#66ccff', icon: '📖' },
  'projects': { name: 'Projets', color: '#06b6d4', icon: '🚀' }
};

// ═══════════════════════════════════════════════════════════════════════════
// FILTRE: Ajouter la catégorie depuis le chemin pour les pages dans /blog/
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.filter.register('before_post_render', function(data) {
  // Seulement pour les fichiers dans blog/
  if (!data.source || !data.source.includes('blog/')) {
    return data;
  }
  
  // Extraire la catégorie du chemin
  const match = data.source.match(/blog\/([^\/]+)\//);
  if (match && match[1] !== 'index.md') {
    const catSlug = match[1].toLowerCase();
    
    // Ne pas écraser si déjà défini
    if (!data.category) {
      data.category = catSlug;
    }
    
    // Ajouter les infos de catégorie
    if (CATEGORIES_INFO[catSlug]) {
      data._categoryInfo = CATEGORIES_INFO[catSlug];
    }
  }
  
  return data;
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Récupérer tous les articles du blog (posts + pages dans /blog/)
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.helper.register('get_blog_posts', function() {
  const site = this.site;
  const allPosts = [];
  
  // 1. Ajouter les posts classiques (source/_posts/)
  if (site.posts && site.posts.length) {
    site.posts.forEach(function(post) {
      allPosts.push(post);
    });
  }
  
  // 2. Ajouter les pages qui sont dans blog/ (sauf index.md)
  if (site.pages && site.pages.length) {
    site.pages.forEach(function(page) {
      if (page.source && page.source.includes('blog/')) {
        // Exclure les index de catégorie
        if (page.source.endsWith('index.md')) {
          return;
        }
        // Exclure si layout est 'category' ou 'blog-index'
        if (page.layout === 'category' || page.layout === 'blog-index') {
          return;
        }
        allPosts.push(page);
      }
    });
  }
  
  // Trier par date décroissante
  allPosts.sort(function(a, b) {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  return allPosts;
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Récupérer les articles d'une catégorie
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.helper.register('get_posts_by_category', function(categorySlug) {
  if (!categorySlug) return [];
  
  const targetSlug = categorySlug.toLowerCase();
  const allPosts = this.get_blog_posts();
  
  return allPosts.filter(function(post) {
    // 1. Depuis category (string)
    if (post.category) {
      if (String(post.category).toLowerCase() === targetSlug) {
        return true;
      }
    }
    
    // 2. Depuis categories (Hexo)
    if (post.categories && post.categories.length) {
      try {
        const cats = post.categories.toArray ? post.categories.toArray() : [];
        for (let i = 0; i < cats.length; i++) {
          const c = cats[i];
          const name = (c.name || c.slug || c || '').toLowerCase();
          if (name === targetSlug) return true;
        }
      } catch(e) {}
    }
    
    // 3. Depuis le chemin
    if (post.source) {
      const pathMatch = post.source.match(/blog\/([^\/]+)\//);
      if (pathMatch && pathMatch[1].toLowerCase() === targetSlug) {
        return true;
      }
    }
    
    return false;
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Compter les articles par catégorie
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.helper.register('count_posts_by_category', function(categorySlug) {
  return this.get_posts_by_category(categorySlug).length;
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Obtenir les infos d'une catégorie
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.helper.register('get_category_info', function(slug) {
  if (!slug) return { name: 'Catégorie', color: '#888888', icon: '📁' };
  const key = String(slug).toLowerCase();
  return CATEGORIES_INFO[key] || { name: slug, color: '#888888', icon: '📁' };
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Obtenir toutes les catégories avec leur count
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.helper.register('get_all_categories_with_counts', function() {
  const self = this;
  return Object.keys(CATEGORIES_INFO).map(function(slug) {
    return {
      slug: slug,
      name: CATEGORIES_INFO[slug].name,
      color: CATEGORIES_INFO[slug].color,
      icon: CATEGORIES_INFO[slug].icon,
      count: self.count_posts_by_category(slug)
    };
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Extraire la catégorie d'un post
// ═══════════════════════════════════════════════════════════════════════════

hexo.extend.helper.register('get_post_category', function(post) {
  if (!post) return null;
  
  // 1. Depuis category
  if (post.category) {
    return String(post.category).toLowerCase();
  }
  
  // 2. Depuis categories
  if (post.categories && post.categories.length) {
    try {
      const cats = post.categories.toArray ? post.categories.toArray() : [];
      if (cats.length > 0) {
        const c = cats[0];
        return (c.name || c.slug || c || '').toLowerCase();
      }
    } catch(e) {}
  }
  
  // 3. Depuis le chemin
  if (post.source) {
    const match = post.source.match(/blog\/([^\/]+)\//);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  
  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// LOG
// ═══════════════════════════════════════════════════════════════════════════

hexo.log.info('[blog-posts-generator] Chargé');
hexo.log.info('  → Supporte les articles dans source/blog/{category}/');
hexo.log.info('  → Helpers: get_blog_posts, get_posts_by_category, count_posts_by_category');
