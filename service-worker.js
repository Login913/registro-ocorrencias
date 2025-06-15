const CACHE_NAME = 'ocorrencias-app-v2'; // VersÃ£o atualizada
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// InstalaÃ§Ã£o do Service Worker
self.addEventListener('install', event => {
  // ForÃ§a a ativaÃ§Ã£o imediata do novo Service Worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// AtivaÃ§Ã£o do Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  // Toma controle imediatamente de todas as pÃ¡ginas
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Deleta caches antigos que nÃ£o estÃ£o na whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// EstratÃ©gia de cache: Cache First, falling back to Network
self.addEventListener('fetch', event => {
  // Regra especial para o script do Google - sempre buscar da rede
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('Erro ao buscar script do Google:', error);
          return new Response('Erro de conexÃ£o', { 
            status: 503,
            statusText: 'ServiÃ§o indisponÃ­vel'
          });
        })
    );
    return; // Importante: interrompe o processamento do evento
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response;
        }

        // Clone da requisiÃ§Ã£o
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Verifica se recebemos uma resposta vÃ¡lida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone da resposta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
