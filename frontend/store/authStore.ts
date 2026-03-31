/**
 * authStore.ts — 인증 상태 관리 (Zustand)
 *
 * 로그인/로그아웃, 사용자 정보, JWT 토큰 보관
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../lib/api'

export interface AuthUser {
  id:       string
  nickname: string
  gp:       number
  cp:       number
}

interface AuthState {
  user:    AuthUser | null
  token:   string | null
  isLoading: boolean
  error:   string | null

  // Actions
  login:   (email: string, password: string) => Promise<void>
  signup:  (email: string, password: string, nickname: string) => Promise<void>
  logout:  () => Promise<void>
  fetchMe: () => Promise<void>
  clearError: () => void
  updatePoints: (gp: number, cp: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,
      error:     null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.login(email, password)
          set({ token: res.token, user: { ...res.user, gp: 0, cp: 0 }, isLoading: false })
          // 포인트 정보 조회
          await get().fetchMe()
        } catch (err) {
          set({ error: err instanceof Error ? err.message : '로그인 실패', isLoading: false })
        }
      },

      signup: async (email, password, nickname) => {
        set({ isLoading: true, error: null })
        try {
          await authApi.signup(email, password, nickname)
          // 가입 후 자동 로그인
          await get().login(email, password)
        } catch (err) {
          set({ error: err instanceof Error ? err.message : '회원가입 실패', isLoading: false })
        }
      },

      logout: async () => {
        const { token } = get()
        if (token) {
          try { await authApi.logout(token) } catch { /* ignore */ }
        }
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        const { token } = get()
        if (!token) return
        try {
          const res = await authApi.me(token)
          set({ user: res.user })
        } catch {
          set({ user: null, token: null })
        }
      },

      clearError: () => set({ error: null }),
      updatePoints: (gp, cp) => set(s => ({ user: s.user ? { ...s.user, gp, cp } : null })),
    }),
    {
      name:    'fatedice-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
)
