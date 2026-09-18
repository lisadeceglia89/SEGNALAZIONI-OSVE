// Service worker minimale: rete prima (cosi' gli aggiornamenti della pagina arrivano subito),
// copia in cache come ripiego quando non c'e' segnale. Intercetta solo le richieste dello stesso
// sito: le chiamate a Supabase passano sempre direttamente in rete.
const CACHE = "segnalazioni-osve-v1";
const GUSCIO = [
  "./",
  "index.html",
  "manifest.json",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png",
  "assets/favicon-32.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(GUSCIO)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== "GET" || new URL(richiesta.url).origin !== self.location.origin) return;

  const conTimeout = Promise.race([
    fetch(richiesta),
    new Promise((_, rifiuta) => setTimeout(() => rifiuta(new Error("timeout")), 4000)),
  ]);

  evento.respondWith(
    conTimeout
      .then((risposta) => {
        if (risposta.ok) {
          const copia = risposta.clone();
          caches.open(CACHE).then((cache) => cache.put(richiesta, copia));
        }
        return risposta;
      })
      .catch(() => caches.match(richiesta).then((r) => r || caches.match("index.html")))
  );
});
