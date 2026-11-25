// Service worker: deixa o app funcionando offline depois da primeira visita.
// Páginas: rede primeiro (pega atualizações), cache se estiver offline.
// Arquivos com hash no nome (assets/): cache primeiro (o nome muda a cada versão).
// Demais arquivos (logos, fotos, texturas, fontes): devolve o que está no cache e atualiza em
// segundo plano — assim um logo trocado com o mesmo nome aparece na abertura seguinte.
// Trocar o nome do cache apaga o cache antigo dos aparelhos.
// Com o login por convite, o app só é entregue a quem entrou: o que vier redirecionado para o login
// (sessão vencida) não entra no cache, senão o app abriria na tela de login mesmo offline.
const CACHE = 'camo-tracker-v4'
const CORE = ['./manifest.webmanifest', './icon-192.png', './favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (!sameOrigin && !isFont) return

  const isLogin = (u) => new URL(u).pathname.endsWith('/login.html')
  if (req.mode === 'navigate') {
    if (isLogin(req.url)) return // a página de login sempre vem da rede
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !res.redirected && !isLogin(res.url)) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put('./index.html', copy))
          }
          return res
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  const save = (res) => {
    if ((res.ok && !res.redirected) || res.type === 'opaque') {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copy))
    }
    return res
  }
  const hashed = sameOrigin && url.pathname.includes('/assets/')
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit && hashed) return hit
      const fresh = fetch(req).then(save)
      if (hit) {
        fresh.catch(() => {})
        return hit
      }
      return fresh
    })
  )
})
