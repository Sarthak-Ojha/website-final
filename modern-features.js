/**
 * Modern Portfolio Enhancements
 * Adding modern features, optimizations, and interactivity
 */

class ModernEnhancements {
    constructor() {
        this.observerOptions = {
            root: null,
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.animations = [];
        this.init();
    }

    async init() {
        await this.waitForDOM();
        this.setupIntersectionObserver();
        this.addSmoothScrolling();
        this.addLazyLoading();
        this.addParticleEffect();
        this.addCustomCursor();
        this.setupServiceWorker();
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

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        // Observe all sections and cards
        document.querySelectorAll('section, .card, .project-card').forEach(el => {
            el.classList.add('fade-up');
            this.observer.observe(el);
        });
    }

    addSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                    // Close mobile menu if open
                    document.querySelector('.nav-menu')?.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                }
            });
        });
    }

    addLazyLoading() {
        // Lazy load images with Intersection Observer
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    addParticleEffect() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = window.innerWidth < 768 ? 30 : 50;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speedX: Math.random() * 1 - 0.5,
                    speedY: Math.random() * 1 - 0.5
                });
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Update position
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Bounce off edges
                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                
                // Draw particle
                ctx.fillStyle = 'rgba(14, 165, 233, 0.5)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.strokeStyle = `rgba(14, 165, 233, ${1 - distance/100})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(animateParticles);
        };

        resizeCanvas();
        initParticles();
        animateParticles();
    }

    addCustomCursor() {
        if (window.innerWidth > 992) { // Only for desktop
            const cursor = document.createElement('div');
            cursor.classList.add('custom-cursor');
            document.body.appendChild(cursor);

            const cursorDot = document.createElement('div');
            cursorDot.classList.add('cursor-dot');
            cursor.appendChild(cursorDot);

            let mouseX = 0;
            let mouseY = 0;
            let cursorX = 0;
            let cursorY = 0;
            let isHovering = false;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            // Handle hover states
            const hoverElements = document.querySelectorAll('a, button, .project-card, .nav-link');
            hoverElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    isHovering = true;
                    cursor.classList.add('hover');
                });
                el.addEventListener('mouseleave', () => {
                    isHovering = false;
                    cursor.classList.remove('hover');
                });
            });

            const animateCursor = () => {
                // Easing for smooth movement
                cursorX += (mouseX - cursorX) * 0.2;
                cursorY += (mouseY - cursorY) * 0.2;
                
                const size = isHovering ? 80 : 40;
                cursor.style.transform = `translate(${cursorX - size/2}px, ${cursorY - size/2}px) scale(${isHovering ? 1.5 : 1})`;
                
                requestAnimationFrame(animateCursor);
            };

            animateCursor();
        }
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            } catch (error) {
                console.error('ServiceWorker registration failed: ', error);
            }
        }
    }
}

// Initialize modern enhancements
const modernEnhancements = new ModernEnhancements();
