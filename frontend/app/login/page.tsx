'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router   = useRouter()
  const { login, signup, user, isLoading, error, clearError } = useAuthStore()

  const [mode,     setMode]     = useState<Mode>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  // 이미 로그인 상태면 로비로
  useEffect(() => {
    if (user) router.replace('/lobby')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (mode === 'login') {
      await login(email, password)
    } else {
      await signup(email, password, nickname)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 70%)' }}>

      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent mb-2">
            FateDice
          </h1>
          <p className="text-white/40 text-sm">운명은 주사위가 결정한다</p>
        </div>

        {/* 카드 */}
        <div className="glass rounded-2xl p-8">
          {/* 탭 */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            {(['login', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); clearError() }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dice@fatedice.gg"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                minLength={6}
                required
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-white/60 mb-1.5">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="운명의 기사"
                  className="input-field"
                  maxLength={12}
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  처리 중...
                </span>
              ) : (
                mode === 'login' ? '게임 시작' : '계정 만들기'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          FateDice © 2026 Antigravity
        </p>
      </div>
    </div>
  )
}
