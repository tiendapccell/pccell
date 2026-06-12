/* ================================================================
   ShopNow — service-worker.js
   - Cachea los archivos principales en la primera visita.
   - Estrategia "cache first, network fallback" para recursos estáticos.
   - Estrategia "network first, cache fallback" para solicitudes externas
     (imágenes de productos y fuentes).
   - Permite abrir la app completamente offline.
   ================================================================ */

'use strict';

// Nombre del caché (cambiar al actualizar la app para limpiar caché vieja)
const CACHE_VERSION = 'shopnow-v1.0.0';
const RUNTIME_CACHE = 'shopnow-runtime-v1';

// Archivos estáticos que queremos cachear en la instalación
const PRECACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './img/logo.png',
    // Fallback offline por si una imagen no se puede cargar
    // (se puede agregar una offline.png, pero usamos index.html como fallback UI)
];

/* ---------------------------------------------------------------
   INSTALL: descargar recursos iniciales al caché
   --------------------------------------------------------------- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => {
                // cacheAll falla si algún recurso no existe.
                // Usamos un approach tolerante a fallos.
                return Promise.all(
                    PRECACHE_URLS.map((url) =>
                        fetch(url, { cache: 'no-cache' })
                            .then((response) => {
                                if (response && response.status === 200) {
                                    cache.put(url, response.clone());
                                }
                            })
                            .catch(() => { /* Ignorar fallos individuales */ })
                    )
                );
            })
            .then(() => self.skipWaiting()) // Forzar activación inmediata
    );
});

/* ---------------------------------------------------------------
   ACTIVATE: limpiar cachés antiguas con distinto nombre
   --------------------------------------------------------------- */
self.addEventListener('activate', (event) => {
    const validCaches = [CACHE_VERSION, RUNTIME_CACHE];

    event.waitUntil(
        caches.keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => !validCaches.includes(name))
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim()) // Tomar control inmediato sobre la app
    );
});

/* ---------------------------------------------------------------
   FETCH: interceptar solicitudes
   --------------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Solo manejar peticiones GET (otro tipo de requests pasa por red)
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Peticiones de navegación (cambio de página): network-first con fallback offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Si la URL pertenece a nuestro origen -> cache-first
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Recursos externos (imágenes, fuentes, Font Awesome CDN, etc): stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
});

/**
 * Estrategia Cache First: servir desde caché si existe;
 * si no, intentar la red y guardar la respuesta.
 */
function cacheFirst(request) {
    return caches.match(request)
        .then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(request)
                .then((networkResponse) => {
                    // Solo guardar respuestas válidas
                    if (
                        !networkResponse ||
                        networkResponse.status !== 200 ||
                        networkResponse.type === 'opaqueredirect'
                    ) {
                        return networkResponse;
                    }

                    const clone = networkResponse.clone();
                    caches.open(CACHE_VERSION)
                        .then((cache) => cache.put(request, clone))
                        .catch(() => { /* Silenciar */ });

                    return networkResponse;
                })
                .catch(() => {
                    // Fallback: para imágenes propias, no hay mucho más que hacer
                    return caches.match('./img/logo.png');
                });
        });
}

/**
 * Estrategia Stale While Revalidate: servir lo que haya en caché
 * mientras se actualiza desde la red en segundo plano.
 */
function staleWhileRevalidate(request) {
    return caches.open(RUNTIME_CACHE)
        .then((cache) =>
            cache.match(request)
                .then((cachedResponse) => {
                    const networkFetch = fetch(request)
                        .then((networkResponse) => {
                            // Guardar una copia en caché si la respuesta es válida
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(request, networkResponse.clone()).catch(() => {});
                            }
                            return networkResponse;
                        })
                        .catch(() => cachedResponse);

                    // Si hay algo en caché, devolverlo inmediatamente
                    return cachedResponse || networkFetch;
                })
        );
}

/* ---------------------------------------------------------------
   SKIP WAITING al recibir un mensaje de la app para actualizar
   --------------------------------------------------------------- */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
