// Porteiro da Vercel: só entrega o app (e os dados) a quem fez login.
// Confere o cookie com o token do Supabase (assinatura pela chave pública do projeto e validade).
// Sem login válido: páginas vão para /login.html; os demais arquivos respondem 401.
import { next } from '@vercel/functions/middleware'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { SUPABASE_URL, SESSION_COOKIE } from './src/authConfig'

export const config = { matcher: '/:path*' }

// Arquivos liberados sem login: a página de login e o que ela (e o ícone do app) usa.
const PUBLIC = new Set([
  '/login.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/sw.js',
  '/home/bg.webp',
])

const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

function readCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') ?? ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export default async function middleware(req: Request) {
  const url = new URL(req.url)
  if (PUBLIC.has(url.pathname)) return next()

  const token = readCookie(req, SESSION_COOKIE)
  if (token) {
    try {
      await jwtVerify(token, JWKS, { issuer: `${SUPABASE_URL}/auth/v1`, audience: 'authenticated' })
      return next()
    } catch {
      // token vencido ou inválido: segue para o login (que renova a sessão sozinho)
    }
  }

  const wantsPage = req.method === 'GET' && (req.headers.get('accept') ?? '').includes('text/html')
  if (wantsPage) {
    const login = new URL('/login.html', url)
    if (url.pathname !== '/' && url.pathname !== '/index.html')
      login.searchParams.set('next', url.pathname + url.search)
    return Response.redirect(login, 302)
  }
  return new Response('Login necessário', { status: 401, headers: { 'cache-control': 'no-store' } })
}
