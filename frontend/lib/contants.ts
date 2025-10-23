export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
export const SESSION_EXPIRE = process.env.NEXT_PUBLIC_SESSION_EXPIRE ?? (7 * 24 * 60 * 60 * 1000)
export const SESSION_SECRET = process.env.NEXT_PUBLIC_SESSION_SECRET ?? 'default'


