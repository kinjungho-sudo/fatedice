/**
 * api.ts — REST API 클라이언트 (fetch 래퍼)
 *
 * 백엔드 엔드포인트 호출 헬퍼 모음
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

type FetchOptions = Omit<RequestInit, 'body'> & { body?: object }

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data as T
}

// ── 인증 ────────────────────────────────────────────────────────

export const authApi = {
  signup: (email: string, password: string, nickname: string) =>
    request<{ user: { id: string; nickname: string } }>('/api/auth/signup', {
      method: 'POST',
      body:   { email, password, nickname },
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; nickname: string } }>('/api/auth/login', {
      method: 'POST',
      body:   { email, password },
    }),

  logout: (token: string) =>
    request<void>('/api/auth/logout', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  me: (token: string) =>
    request<{ user: { id: string; nickname: string; gp: number; cp: number } }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── 캐릭터 / 가챠 / 덱 ───────────────────────────────────────────

export const characterApi = {
  all: () =>
    request<{ characters: unknown[] }>('/api/characters'),

  my: (userId: string) =>
    request<{ characters: unknown[]; total: number }>('/api/characters/my', {
      headers: { 'X-User-Id': userId },
    }),

  get: (id: string) =>
    request<{ character: unknown }>(`/api/characters/${id}`),

  gachaSingle: (userId: string, costType: 'GP' | 'CP') =>
    request<{ character: unknown; cost: number; costType: string }>('/api/characters/gacha/single', {
      method: 'POST',
      body:   { userId, costType },
    }),

  gachaTen: (userId: string, costType: 'GP' | 'CP') =>
    request<{ characters: unknown[]; cost: number; costType: string }>('/api/characters/gacha/ten', {
      method: 'POST',
      body:   { userId, costType },
    }),

  getDeck: (userId: string) =>
    request<{ deck: unknown }>('/api/characters/deck', {
      headers: { 'X-User-Id': userId },
    }),

  saveDeck: (userId: string, attackerId: string, defenderId: string, intelligenceId: string) =>
    request<{ deck: unknown }>('/api/characters/deck', {
      method:  'PUT',
      headers: { 'X-User-Id': userId },
      body:    { attackerId, defenderId, intelligenceId },
    }),
}

// ── 랭킹 ────────────────────────────────────────────────────────

export const rankingApi = {
  top: () =>
    request<{ rankings: unknown[] }>('/api/ranking'),

  me: (userId: string) =>
    request<{ ranking: unknown }>('/api/ranking/me', {
      headers: { 'X-User-Id': userId },
    }),
}
