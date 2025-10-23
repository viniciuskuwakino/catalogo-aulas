'use server'

import { cookies } from "next/headers"
import { BACKEND_URL, SESSION_EXPIRE, SESSION_SECRET } from "@/lib/contants"
import { jwtVerify, SignJWT } from "jose"

const key = new TextEncoder().encode(SESSION_SECRET)

export async function manualStoreToken(token: any) {

  if (!token) return

  (await cookies()).set('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 60 * 60, // 1h
  })

}

export async function getManualToken() {
  const token = (await cookies()).get('token')?.value

  if (!token) return null

  return token
}

export async function storeSession(user: any) {

  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(key);

  (await cookies()).set('token', token, {
    httpOnly: true,
    secure: false, // true -> só envia via HTTPS
    sameSite: "strict",
    // maxAge: 10, // 2h
    maxAge: 60 * 60 * 12, // 12h
  })

}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256']
  })

  return payload
}

export async function getToken() {
  const token = (await cookies()).get('token')?.value

  if (!token) return null

  return await decrypt(token)
}

export async function login(credentials: any) {
  const { email, password } = credentials
  
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return {
    response: await response.json(),
    ok: response.ok
  }

}

export async function logoutUser() {

  (await cookies()).set('token', '', {
    expires: new Date(0)
  })

}