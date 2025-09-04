/**
 * Modern Portfolio Website JavaScript
 * Enhanced with modern ES6+ features, performance optimizations, and accessibility
 */

class ModernPortfolio {
    constructor() {
        this.state = {
            isMenuOpen: false,
            isDarkMode: this.getStoredTheme() === 'dark',
            scrollY: 0,
            isScrolling: false
        };
        
        this.elements = {};
        this.observers = new Map();
        this.rafId = null;
        
        this.init();
    }

    async init() {
        await this.waitForDOM();
        this.cacheElements();
        this.setupEventListeners();
        this.initializeComponents();
        this.initializeAnimations();
    }

    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    cacheElements() {
        this.elements = {
            header: document.querySelector('.header'),
            navToggle: document.querySelector('.nav-toggle'),
            navMenu: document.querySelector('.nav-menu'),
            navLinks: document.querySelectorAll('.nav-link'),
            sections: document.querySelectorAll('section[id]'),
            backToTop: document.querySelector('#backToTop'),
            heroStats: document.querySelectorAll('.stat-number'),
            floatingCards: document.querySelectorAll('.floating-card'),
            typingElement: document.querySelector('.typing-text')
        };
    }

    setupEventListeners() {
        // Optimized scroll handler with RAF
        this.handleScroll = this.throttle(() => {
            this.updateScrollState();
        }, 16);

        // Event listeners with proper cleanup
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        
        // Navigation
        this.initializeNavigation();
        this.initializeMobileMenu();
        this.initializeSmoothScrolling();
        this.initializeBackToTop();
    }

    // Utility functions
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    getStoredTheme() {
        return localStorage.getItem('theme') || 
               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    initializeNavigation() {
        if (!this.elements.header) return;

        // Initialize Lucide icons
        this.initializeLucideIcons();
        
        // Set up intersection observer for active nav links
        this.setupNavIntersectionObserver();
    }

    async initializeLucideIcons() {
        try {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            } else {
                // Load Lucide dynamically if not available
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js';
                script.onload = () => lucide.createIcons();
                document.head.appendChild(script);
            }
        } catch (error) {
            console.warn('Lucide icons could not be loaded:', error);
        }
    }

    setupNavIntersectionObserver() {
        const options = {
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateActiveNavLink(entry.target.id);
                }
            });
        }, options);

        this.elements.sections.forEach(section => {
            observer.observe(section);
        });

        this.observers.set('navigation', observer);
    }

    updateActiveNavLink(activeId) {
        this.elements.navLinks.forEach(link => {
            const isActive = link.getAttribute('data-section') === activeId;
            link.classList.toggle('active', isActive);
        });
    }

    updateScrollState() {
        this.state.scrollY = window.scrollY;
        
        // Update header state
        if (this.elements.header) {
            this.elements.header.classList.toggle('scrolled', this.state.scrollY > 50);
        }
        
        // Update back to top button
        if (this.elements.backToTop) {
            this.elements.backToTop.classList.toggle('visible', this.state.scrollY > 300);
        }
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 768 && this.state.isMenuOpen) {
            this.closeMobileMenu();
        }
    }

    initializeSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', this.handleSmoothScroll.bind(this));
        });
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const headerHeight = this.elements.header?.offsetHeight || 80;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            // Close mobile menu if open
            if (this.state.isMenuOpen) {
                this.closeMobileMenu();
            }
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    initializeMobileMenu() {
        if (!this.elements.navToggle || !this.elements.navMenu) return;

        // Toggle mobile menu
        this.elements.navToggle.addEventListener('click', this.toggleMobileMenu.bind(this));

        // Close menu when clicking nav links
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', this.closeMobileMenu.bind(this));
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.state.isMenuOpen && 
                !this.elements.navToggle.contains(e.target) && 
                !this.elements.navMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        
        this.elements.navMenu.classList.toggle('active', this.state.isMenuOpen);
        this.elements.navToggle.classList.toggle('active', this.state.isMenuOpen);
        this.elements.navToggle.setAttribute('aria-expanded', this.state.isMenuOpen);
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = this.state.isMenuOpen ? 'hidden' : '';
    }

    closeMobileMenu() {
        if (!this.state.isMenuOpen) return;
        
        this.state.isMenuOpen = false;
        this.elements.navMenu.classList.remove('active');
        this.elements.navToggle.classList.remove('active');
        this.elements.navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    initializeBackToTop() {
        if (!this.elements.backToTop) return;

        this.elements.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    initializeThemeToggle() {
        if (!this.elements.themeToggle) return;

        this.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.state.isDarkMode = e.matches;
                this.applyTheme();
            }
        });
    }

    toggleTheme() {
        this.state.isDarkMode = !this.state.isDarkMode;
        this.setStoredTheme(this.state.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.isDarkMode ? 'dark' : 'light');
    }

    initializeComponents() {
        // Initialize stats counter animation
        this.initializeStatsCounter();
        
        // Initialize typing animation for hero title
        this.initializeTypingAnimation();
        
        // Initialize scroll-triggered animations
        this.initializeScrollAnimations();
    }

    initializeStatsCounter() {
        const options = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        this.elements.heroStats.forEach(stat => {
            observer.observe(stat);
        });

        this.observers.set('stats', observer);
    }

    animateCounter(element) {
        const numberElement = element.querySelector('.stat-number');
        if (!numberElement) return;

        const finalNumber = parseInt(numberElement.textContent.replace(/\D/g, ''));
        const duration = 2000;
        const increment = finalNumber / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < finalNumber) {
                numberElement.textContent = Math.floor(current) + (numberElement.textContent.includes('+') ? '+' : '');
                requestAnimationFrame(updateCounter);
            } else {
                numberElement.textContent = finalNumber + (numberElement.textContent.includes('+') ? '+' : '');
            }
        };

        updateCounter();
    }

    initializeTypingAnimation() {
        const titleRole = document.querySelector('.title-role');
        if (!titleRole) return;

        const roles = ['Full-Stack Developer', 'Problem Solver', 'Tech Innovator', 'World Record Holder'];
        let currentRole = 0;
        let currentChar = 0;
        let isDeleting = false;

        const typeWriter = () => {
            const current = roles[currentRole];
            
            if (isDeleting) {
                titleRole.textContent = current.substring(0, currentChar - 1);
                currentChar--;
            } else {
                titleRole.textContent = current.substring(0, currentChar + 1);
                currentChar++;
            }

            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && currentChar === current.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && currentChar === 0) {
                isDeleting = false;
                currentRole = (currentRole + 1) % roles.length;
                typeSpeed = 500;
            }

            setTimeout(typeWriter, typeSpeed);
        };

        // Start typing animation after a delay
        setTimeout(typeWriter, 1000);
    }

    initializeScrollAnimations() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe elements that should animate in
        const animateElements = document.querySelectorAll('.stat-item, .floating-card, .hero-badge');
        animateElements.forEach(el => observer.observe(el));

        this.observers.set('scroll', observer);
    }

    initializeAnimations() {
        // Add staggered animation delays to stats
        this.elements.heroStats.forEach((stat, index) => {
            stat.style.animationDelay = `${index * 100}ms`;
        });

        // Add floating animation to cards
        this.elements.floatingCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 2}s`;
        });
    }

    // Cleanup method for when the app is destroyed
    destroy() {
        // Cancel any pending RAF
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize the modern portfolio application
const portfolio = new ModernPortfolio();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernPortfolio;
}

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when page is hidden
        document.documentElement.style.setProperty('--animation-play-state', 'paused');
    } else {
        // Resume animations when page is visible
        document.documentElement.style.setProperty('--animation-play-state', 'running');
    }
});

