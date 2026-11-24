// Login por convite (Supabase). A URL e a chave pública podem ficar no código: a chave "publishable"
// é feita para o navegador, e o acesso aos dados é limitado pelas regras do banco (cada um só vê o seu).
export const SUPABASE_URL = 'https://hfvhgzesunuswprclqam.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_4JTrjFrTIXSJKokSA8fcTA_3-miXtWl'

/** O login pede só o nome de usuário; por baixo, o Supabase usa um e-mail fictício (nenhum e-mail é enviado). */
export const USER_DOMAIN = 'camotracker.app'
export const usernameOf = (email: string | undefined | null) => (email ?? '').split('@')[0]

/** Cookie com o token de acesso, lido pelo porteiro da Vercel (middleware.ts) para liberar os arquivos do app. */
export const SESSION_COOKIE = 'ct-session'
