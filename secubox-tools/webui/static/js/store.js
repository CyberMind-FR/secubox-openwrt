/**
 * SecuBox WebUI - Alpine.js Global Store
 *
 * Manages application-wide state including:
 * - Active section navigation
 * - Search and filter state
 * - Toast notifications
 * - Modal state
 */

document.addEventListener('alpine:init', () => {
  Alpine.store('app', {
    // Current active section
    activeSection: 'modules',

    // Search and filter state
    searchQuery: '',
    filters: {
      tags: [],
      categories: [],
      health: null,
      installed: null,
    },

    // Toast notification state
    toast: {
      message: '',
      type: 'info', // 'info', 'success', 'warning', 'error'
      show: false,
    },

    // Modal state
    modal: {
      isOpen: false,
      title: '',
      content: '',
    },

    // Methods
    setSection(section) {
      this.activeSection = section;
      // Store in localStorage for persistence
      localStorage.setItem('secubox_active_section', section);
    },

    showToast(message, type = 'info', duration = 3000) {
      this.toast = { message, type, show: true };
      setTimeout(() => {
        this.toast.show = false;
      }, duration);
    },

    updateSearch(query) {
      this.searchQuery = query;
    },

    addFilter(filterType, value) {
      if (!this.filters[filterType]) {
        this.filters[filterType] = [];
      }
      if (!this.filters[filterType].includes(value)) {
        this.filters[filterType].push(value);
      }
    },

    removeFilter(filterType, value) {
      if (this.filters[filterType]) {
        this.filters[filterType] = this.filters[filterType].filter(v => v !== value);
      }
    },

    clearFilters() {
      this.filters = {
        tags: [],
        categories: [],
        health: null,
        installed: null,
      };
    },

    openModal(title, content) {
      this.modal = { isOpen: true, title, content };
    },

    closeModal() {
      this.modal.isOpen = false;
    },

    // Initialize from localStorage
    init() {
      const savedSection = localStorage.getItem('secubox_active_section');
      if (savedSection) {
        this.activeSection = savedSection;
      }
    }
  });

  // Initialize the store
  Alpine.store('app').init();
});
