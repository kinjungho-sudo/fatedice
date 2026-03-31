'use client'

import { useState } from 'react'
import type { Character } from '@shared/gameLogic/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const GRADE_COLOR: Record<string, string> = {
  Normal: '#9CA3AF', Rare: '#60A5FA', Epic: '#A855F7', Legendary: '#F59E0B',
}

const GRADE_BG: Record<string, string> = {
  Normal:    'linear-gradient(135deg,#1F2937,#374151)',
  Rare:      'linear-gradient(135deg,#1E3A8A,#2563EB)',
  Epic:      'linear-gradient(135deg,#4C1D95,#7C3AED)',
  Legendary: 'linear-gradient(135deg,#78350F,#F59E0B,#78350F)',
}

export default function GachaPage() {
  const [results, setResults]   = useState<Character[]>([])
  const [pulling, setPulling]   = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [costType, setCostType] = useState<'GP' | 'CP'>('GP')

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') ?? '' : ''

  async function pull(type: 'single' | 'ten') {
    if (!userId) { alert('로그인이 필요합니다.'); return }
    setPulling(true)
    setShowCards(false)

    const endpoint = type === 'single'
      ? '/api/characters/gacha/single'
      : '/api/characters/gacha/ten'

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, costType }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }

      const pulled: Character[] = type === 'single' ? [data.character] : data.characters
      setResults(pulled)

      // 연출 딜레이
      setTimeout(() => setShowCards(true), 800)
    } finally {
      setPulling(false)
    }
  }

  return (
    <main className="min-h-screen bg-hero p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-2 text-white">뽑기</h1>
        <p className="text-sm opacity-40 mb-6">N 60% / R 30% / E 9% / L 1%</p>

        {/* 화폐 선택 */}
        <div className="flex gap-2 mb-6">
          {(['GP', 'CP'] as const).map(c => (
            <button key={c} onClick={() => setCostType(c)}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${costType === c ? 'bg-brand-purple text-white' : 'glass-panel text-purple-300'}`}>
              {c} ({c === 'GP' ? '100 / 900' : '10 / 90'})
            </button>
          ))}
        </div>

        {/* 뽑기 버튼 */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => pull('single')} disabled={pulling}
            className="flex-1 py-4 rounded-xl font-black text-white text-lg transition-all"
            style={{ background: pulling ? 'rgba(124,58,237,0.3)' : 'linear-gradient(90deg,#7C3AED,#5B21B6)' }}>
            {pulling ? '⏳' : '1회 뽑기'}
          </button>
          <button onClick={() => pull('ten')} disabled={pulling}
            className="flex-1 py-4 rounded-xl font-black text-white text-lg transition-all"
            style={{ background: pulling ? 'rgba(245,158,11,0.3)' : 'linear-gradient(90deg,#B45309,#F59E0B)' }}>
            {pulling ? '⏳' : '10연챠'}
          </button>
        </div>

        {/* 결과 카드 */}
        {results.length > 0 && (
          <div className={`grid gap-3 transition-opacity duration-500 ${showCards ? 'opacity-100' : 'opacity-0'}`}
            style={{ gridTemplateColumns: results.length === 1 ? '1fr' : 'repeat(5,1fr)' }}>
            {results.map((char, i) => (
              <GachaResultCard key={i} char={char} delay={i * 100} show={showCards} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function GachaResultCard({ char, delay, show }: { char: Character; delay: number; show: boolean }) {
  const isLegendary = char.grade === 'Legendary'

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-500 ${show ? 'animate-card-flip' : ''}`}
      style={{
        background:    GRADE_BG[char.grade],
        transitionDelay: delay + 'ms',
        border: `2px solid ${GRADE_COLOR[char.grade]}`,
        boxShadow: `0 0 20px ${GRADE_COLOR[char.grade]}60`,
      }}
    >
      <div className={`p-4 text-center ${isLegendary ? 'py-6' : ''}`}>
        <div className={`text-5xl mb-2 ${isLegendary ? 'animate-float' : ''}`}>🎭</div>
        <p className="font-black text-white text-sm">{char.name}</p>
        <p className="text-xs mt-1 font-bold" style={{ color: GRADE_COLOR[char.grade] }}>{char.grade}</p>
        <p className="text-xs opacity-40">{char.class}</p>
        {isLegendary && (
          <div className="mt-2 text-xs font-bold text-yellow-400 animate-pulse">★ LEGENDARY ★</div>
        )}
      </div>
    </div>
  )
}
