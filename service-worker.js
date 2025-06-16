const CACHE_NAME = 'registro-ocorrencias-v5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker v5 instalado');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker v5 ativado');
  event.waitUntil(self.clients.claim());
  
  // Limpar todos os caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia de cache: Bypass cache completamente para script.google.com
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Para requisições ao script do Google, NUNCA use cache
  if (url.hostname.includes('script.google.com')) {
    console.log('Requisição para script do Google, ignorando cache:', url.toString());
    
    // Cria uma nova requisição com cabeçalhos que impedem o cache
    const noCacheRequest = new Request(event.request.url, {
      method: event.request.method,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      mode: 'cors',
      credentials: event.request.credentials
    });
    
    event.respondWith(fetch(noCacheRequest));
    return;
  }
  
  // Para todo o resto, use a estratégia padrão
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});
