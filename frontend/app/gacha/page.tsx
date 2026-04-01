'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'
import { characterApi } from '../../lib/api'
import type { Character } from '@shared/gameLogic/types'

const GRADE_STYLE: Record<string, string> = {
  Normal:    'text-slate-300 border-slate-500/40 bg-slate-500/10',
  Rare:      'text-blue-400  border-blue-500/40  bg-blue-500/10',
  Epic:      'text-purple-400 border-purple-500/40 bg-purple-500/10',
  Legendary: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
}

const RATE_TABLE = [
  { grade: 'Normal',    rate: '60%', color: 'text-slate-400' },
  { grade: 'Rare',      rate: '30%', color: 'text-blue-400'  },
  { grade: 'Epic',      rate: '9%',  color: 'text-purple-400'},
  { grade: 'Legendary', rate: '1%',  color: 'text-yellow-400'},
]

function CharacterResult({ char }: { char: Character }) {
  return (
    <div className={`glass rounded-xl p-4 border ${GRADE_STYLE[char.grade]} flex flex-col items-center gap-2 card-hover`}>
      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
        {char.class === 'King' ? '♔' : char.class === 'Queen' ? '♕' :
         char.class === 'Rook' ? '♖' : char.class === 'Bishop' ? '♗' :
         char.class === 'Knight' ? '♞' : '♟'}
      </div>
      <div className="text-center">
        <div className={`text-xs font-bold ${GRADE_STYLE[char.grade].split(' ')[0]}`}>{char.grade}</div>
        <div className="text-sm font-semibold mt-0.5">{char.name}</div>
        <div className="text-xs text-white/40">{char.class} · {char.attribute}</div>
      </div>
    </div>
  )
}

export default function GachaPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [results,   setResults]   = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [costType,  setCostType]  = useState<'GP' | 'CP'>('GP')
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) return null

  const pull = async (count: 1 | 10) => {
    setIsLoading(true)
    setError(null)
    setResults([])
    try {
      if (count === 1) {
        const res = await characterApi.gachaSingle(user.id, costType)
        setResults([res.character as Character])
      } else {
        const res = await characterApi.gachaTen(user.id, costType)
        setResults(res.characters as Character[])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '뽑기 실패')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)' }}>
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-black bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">FateDice</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-yellow-400 font-bold">GP {user.gp.toLocaleString()}</span>
            <span className="text-blue-400 font-bold">CP {user.cp.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <nav className="flex gap-2 mb-8">
          {[
            { href: '/lobby',   label: '로비' },
            { href: '/gacha',   label: '뽑기', active: true },
            { href: '/deck',    label: '덱 편성' },
            { href: '/ranking', label: '랭킹' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                item.active ? 'bg-brand-600 text-white' : 'glass text-white/60 hover:text-white'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 뽑기 패널 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">캐릭터 뽑기</h2>

              {/* 재화 선택 */}
              <div className="flex gap-2 mb-4">
                {(['GP', 'CP'] as const).map(ct => (
                  <button key={ct} onClick={() => setCostType(ct)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      costType === ct ? 'bg-brand-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}>
                    {ct}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <button onClick={() => pull(1)} disabled={isLoading}
                  className="btn-primary w-full">
                  {isLoading ? '뽑는 중...' : `1회 뽑기 (${costType === 'GP' ? '100GP' : '10CP'})`}
                </button>
                <button onClick={() => pull(10)} disabled={isLoading}
                  className="btn-secondary w-full">
                  {`10연챠 (${costType === 'GP' ? '900GP' : '90CP'}) — 10% 할인`}
                </button>
              </div>

              {error && (
                <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* 확률표 */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white/60 mb-3">확률 정보</h3>
              <div className="space-y-2">
                {RATE_TABLE.map(r => (
                  <div key={r.grade} className="flex justify-between text-sm">
                    <span className={r.color}>{r.grade}</span>
                    <span className="text-white/50">{r.rate}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/30 space-y-1">
                <div>천장: 50회 → Epic 확정</div>
                <div>천장: 100회 → Legendary 확정</div>
              </div>
            </div>
          </div>

          {/* 결과 영역 */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 min-h-64">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <div className="text-5xl mb-3">🎰</div>
                  <p className="text-sm">뽑기 결과가 여기에 표시됩니다</p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-white/60 mb-4">
                    뽑기 결과 ({results.length}종)
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {results.map((char, i) => (
                      <CharacterResult key={i} char={char} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
