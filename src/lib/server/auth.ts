import { error, redirect, type Cookies } from '@sveltejs/kit';
import type { Role } from './db';

const COOKIE_NAME = 'sahi_session';
const SESSION_DAYS = 7;
// Cloudflare Workers Web Crypto currently accepts at most 100,000 PBKDF2 iterations.
const PBKDF2_ITERATIONS = 100_000;

const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export async function hashPassword(password: string, saltValue?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltValue ? base64ToBytes(saltValue) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}

export async function verifyPassword(password: string, salt: string, expected: string): Promise<boolean> {
  const actual = base64ToBytes((await hashPassword(password, salt)).hash);
  const wanted = base64ToBytes(expected);
  if (actual.length !== wanted.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual[index] ^ wanted[index];
  return difference === 0;
}

export async function createSession(db: D1Database, cookies: Cookies, userId: number, secure: boolean): Promise<void> {
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400_000);
  await db.prepare('INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(userId, tokenHash, expires.toISOString(), now.toISOString()).run();
  cookies.set(COOKIE_NAME, token, { path: '/', httpOnly: true, sameSite: 'lax', secure, expires });
}

export async function deleteSession(db: D1Database, cookies: Cookies): Promise<void> {
  const token = cookies.get(COOKIE_NAME);
  if (token) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function readSession(db: D1Database, cookies: Cookies): Promise<{ id: number; email: string; role: Role } | null> {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;
  const row = await db.prepare(`SELECT u.id, u.email, u.role FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(await sha256(token), new Date().toISOString()).first<{ id: number; email: string; role: Role }>();
  if (!row) cookies.delete(COOKIE_NAME, { path: '/' });
  return row;
}

export function requireUser(locals: App.Locals): NonNullable<App.Locals['user']> {
  if (!locals.user) redirect(303, '/login');
  return locals.user;
}

export function requireTeam(locals: App.Locals): NonNullable<App.Locals['team']> {
  const user = requireUser(locals);
  if (user.role !== 'team' || !locals.team) error(403, 'Team access required');
  return locals.team;
}

export function requireAdmin(locals: App.Locals): NonNullable<App.Locals['user']> {
  const user = requireUser(locals);
  if (user.role !== 'admin') error(403, 'Administrator access required');
  return user;
}
