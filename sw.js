/**
 * Enhanced Service Worker for Portfolio Website
 * Advanced caching strategies for optimal performance and offline experience
 */

const CACHE_NAME = 'portfolio-v2.0.0';
const OFFLINE_CACHE = 'offline-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

// Cache priorities (higher = more important)
const CACHE_PRIORITIES = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

// Static assets to cache during install
const STATIC_ASSETS = [
    { url: '/', priority: CACHE_PRIORITIES.CRITICAL },
    { url: '/index.html', priority: CACHE_PRIORITIES.CRITICAL },
    { url: '/style.css', priority: CACHE_PRIORITIES.HIGH },
    { url: '/script.js', priority: CACHE_PRIORITIES.HIGH },
    { url: '/modern-styles.css', priority: CACHE_PRIORITIES.HIGH },
    { url: '/modern-features.js', priority: CACHE_PRIORITIES.HIGH },
    { url: '/manifest.json', priority: CACHE_PRIORITIES.HIGH },
    { url: '/images/profile.png', priority: CACHE_PRIORITIES.HIGH },
    { url: '/images/CS.png', priority: CACHE_PRIORITIES.MEDIUM },
    { url: '/images/GWR.png', priority: CACHE_PRIORITIES.MEDIUM },
    { url: '/images/OU.png', priority: CACHE_PRIORITIES.MEDIUM },
    { url: '/images/gear.png', priority: CACHE_PRIORITIES.MEDIUM },
    { url: '/images/hero-bg.jpg', priority: CACHE_PRIORITIES.MEDIUM },
    { url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap', priority: CACHE_PRIORITIES.HIGH },
    { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', priority: CACHE_PRIORITIES.HIGH },
];

// Offline fallback page
const OFFLINE_URL = '/offline.html';

// Cache size limits (in bytes)
const CACHE_LIMIT = 50 * 1024 * 1024; // 50MB
const IMAGE_CACHE_LIMIT = 30 * 1024 * 1024; // 30MB

// Install event - cache static assets with priorities
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            // Open caches
            caches.open(CACHE_NAME),
            caches.open(IMAGE_CACHE),
            caches.open(OFFLINE_CACHE)
        ]).then(([mainCache, imageCache, offlineCache]) => {
            // Cache static assets
            const cachePromises = STATIC_ASSETS.map(asset => {
                return caches.match(asset.url).then(response => {
                    if (!response) {
                        return fetch(asset.url, { credentials: 'same-origin' })
                            .then(fetchResponse => {
                                if (!fetchResponse || fetchResponse.status !== 200) {
                                    return Promise.reject('Failed to fetch: ' + asset.url);
                                }
                                
                                // Clone the response
                                const responseToCache = fetchResponse.clone();
                                
                                // Add to appropriate cache based on file type
                                if (asset.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
                                    return imageCache.put(asset.url, responseToCache);
                                } else {
                                    return mainCache.put(asset.url, responseToCache);
                                }
                            })
                            .catch(err => {
                                console.warn('Caching failed for:', asset.url, err);
                            });
                    }
                    return response;
                });
            });

            // Cache offline page
            const offlinePage = new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>You're Offline</title>
                    <style>
                        body { 
                            font-family: 'Inter', sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                            padding: 20px; 
                            text-align: center;
                            background: #f5f5f5;
                            color: #333;
                        }
                        .offline-container { 
                            max-width: 500px; 
                            padding: 2rem; 
                            background: white; 
                            border-radius: 10px; 
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        h1 { color: #0ea5e9; }
                        .emoji { font-size: 3rem; margin-bottom: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="offline-container">
                        <div class="emoji">📶</div>
                        <h1>You're Offline</h1>
                        <p>It seems you've lost your internet connection. Don't worry, you can still browse the content that's been cached.</p>
                        <p>Check your connection and try again when you're back online.</p>
                        <button onclick="window.location.reload()">Try Again</button>
                    </div>
                </body>
                </html>
                `,
                { headers: { 'Content-Type': 'text/html' } }
            );

            return Promise.all([
                ...cachePromises,
                offlineCache.put(OFFLINE_URL, offlinePage)
            ]);
        })
        .then(() => self.skipWaiting())
        .catch(err => {
            console.error('Service Worker installation failed:', err);
        })
    );
});

// Activate event - clean up old caches and manage storage
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all([
                // Delete old caches
                ...cacheNames
                    .filter(cacheName => 
                        cacheName !== CACHE_NAME && 
                        cacheName !== IMAGE_CACHE &&
                        cacheName !== OFFLINE_CACHE &&
                        !cacheName.startsWith('workbox-')
                    )
                    .map(cacheName => {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }),
                
                // Claim clients to ensure they use the updated service worker
                self.clients.claim()
            ]);
        })
        .then(() => {
            // Clean up old caches that might have been missed
            return caches.keys().then(keys => {
                return Promise.all(
                    keys.map(key => {
                        if (key !== CACHE_NAME && key !== IMAGE_CACHE && key !== OFFLINE_CACHE) {
                            return caches.delete(key);
                        }
                    })
                );
            });
        })
        .catch(err => {
            console.error('Service Worker activation failed:', err);
        })
    );
});

// Fetch event handler with advanced strategies
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests and browser extensions
    if (request.method !== 'GET' || 
        request.url.startsWith('chrome-extension:') || 
        request.url.includes('browser-sync') ||
        request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
        return;
    }

    // Handle different types of requests with appropriate strategies
    if (request.headers.get('accept').includes('text/html')) {
        // HTML: Network first, then cache
        event.respondWith(
            fetchWithTimeout(event.request, 3000)
                .then(response => {
                    // Update cache with fresh response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(request, responseClone));
                    return response;
                })
                .catch(() => {
                    // Return from cache or offline page
                    return caches.match(request)
                        .then(response => response || caches.match(OFFLINE_URL));
                })
        );
    } else if (request.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        // Images: Cache first, then network
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    // Return cached image if available
                    if (cachedResponse) {
                        // Update cache in the background
                        fetchAndCache(request, IMAGE_CACHE);
                        return cachedResponse;
                    }
                    
                    // Otherwise fetch from network
                    return fetchAndCache(request, IMAGE_CACHE);
                })
        );
    } else if (request.url.match(/\.(js|css|woff2?|ttf|eot)$/)) {
        // Static assets: Cache first, then network
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    // Return cached asset if available
                    if (cachedResponse) {
                        // Update cache in the background
                        fetchAndCache(request, CACHE_NAME);
                        return cachedResponse;
                    }
                    
                    // Otherwise fetch from network
                    return fetchAndCache(request, CACHE_NAME);
                })
        );
    } else {
        // Default: Network first, then cache
        event.respondWith(
            fetchWithTimeout(request)
                .then(response => {
                    // If it's a valid response, cache it
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Return from cache if available
                    return caches.match(request);
                })
        );
    }
});

// Helper function to fetch with timeout
function fetchWithTimeout(request, timeout = 5000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Helper function to fetch and cache a request
function fetchAndCache(request, cacheName) {
    return fetch(request)
        .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(cacheName)
                .then(cache => cache.put(request, responseToCache));

            return response;
        })
        .catch(err => {
            console.error('Fetch failed:', err);
            throw err;
        });
}

// Background sync for failed requests
self.addEventListener('sync', event => {
    if (event.tag === 'sync-messages') {
        console.log('Background sync running...');
        // Handle background sync for failed requests
    }
});

// Push notification event listener
self.addEventListener('push', event => {
    const options = {
        body: event.data?.text() || 'New update available!',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            { action: 'explore', title: 'Explore' },
            { action: 'close', title: 'Close' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Sarthak Ojha', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        clients.openWindow('/');
    } else if (event.action === 'close') {
        // Handle close action if needed
    } else {
        clients.openWindow('/');
    }
});

