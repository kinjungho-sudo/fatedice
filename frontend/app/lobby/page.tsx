'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'
import { useGameStore } from '../../store/gameStore'

export default function LobbyPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { connect, createRoom, startMatchmaking, roomId, uiPhase } = useGameStore()

  const [mode,  setMode]  = useState<'1v1' | '2v2'>('1v1')
  const [title, setTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  // 미로그인 → 로그인 페이지
  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  // 소켓 연결 (로비 진입 시)
  useEffect(() => {
    if (!user) return
    // TODO: 실제 deck은 deck 페이지에서 편성 후 localStorage에 저장된 것 사용
    const savedDeck = JSON.parse(localStorage.getItem('fatedice-deck') ?? 'null')
    connect(user.nickname, savedDeck ?? {})
  }, [user, connect])

  // 방 생성 완료 → 게임 대기 페이지로
  useEffect(() => {
    if (uiPhase === 'waiting_room' && roomId) {
      router.push(`/game/${roomId}`)
    }
  }, [uiPhase, roomId, router])

  if (!user) return null

  const handleCreate = () => {
    createRoom(user.id, mode, title || `${user.nickname}의 방`)
    setShowCreate(false)
  }

  const handleMatchmaking = () => {
    const savedDeck = JSON.parse(localStorage.getItem('fatedice-deck') ?? 'null')
    if (!savedDeck) {
      alert('덱을 먼저 편성해주세요!')
      router.push('/deck')
      return
    }
    startMatchmaking(user.id, mode, savedDeck)
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)' }}>
      {/* 헤더 */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              FateDice
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/50 text-sm">로비</span>
          </div>

          <div className="flex items-center gap-4">
            {/* 재화 표시 */}
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-2 text-sm">
              <span className="text-yellow-400 font-bold">GP {user.gp.toLocaleString()}</span>
              <span className="text-white/30">|</span>
              <span className="text-blue-400 font-bold">CP {user.cp.toLocaleString()}</span>
            </div>
            <span className="text-white/70 text-sm">{user.nickname}</span>
            <button onClick={() => logout()} className="btn-secondary text-sm py-1.5 px-4">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 내비게이션 */}
        <nav className="flex gap-2 mb-8">
          {[
            { href: '/lobby',   label: '로비',   active: true },
            { href: '/gacha',   label: '뽑기',   active: false },
            { href: '/deck',    label: '덱 편성', active: false },
            { href: '/ranking', label: '랭킹',   active: false },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                item.active
                  ? 'bg-brand-600 text-white'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 빠른 게임 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">빠른 대전</h2>

              {/* 모드 선택 */}
              <div className="flex gap-2 mb-4">
                {(['1v1', '2v2'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      mode === m
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={handleMatchmaking}
                className="btn-primary w-full"
              >
                매치메이킹 시작
              </button>

              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  방 직접 만들기
                </button>
              </div>
            </div>

            {/* 방 만들기 모달 */}
            {showCreate && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4">방 만들기</h3>
                <div className="space-y-3">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={`${user.nickname}의 방`}
                    className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    {(['1v1', '2v2'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                          mode === m ? 'bg-brand-600 text-white' : 'bg-white/5 text-white/50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreate} className="btn-primary flex-1 py-2 text-sm">
                      생성
                    </button>
                    <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 py-2 text-sm">
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 우측: 공개 방 목록 */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">공개 방</h2>
                <span className="text-white/40 text-sm">실시간 방 목록</span>
              </div>

              {/* 빈 상태 */}
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">🎲</div>
                <p className="text-sm">현재 열린 방이 없습니다</p>
                <p className="text-xs mt-1">방을 만들거나 매치메이킹을 시작해보세요!</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
