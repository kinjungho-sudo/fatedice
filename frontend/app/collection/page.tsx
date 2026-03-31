'use client'

import { useEffect, useState } from 'react'
import type { Character } from '@shared/gameLogic/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const GRADE_LABEL: Record<string, string> = {
  Normal: 'N', Rare: 'R', Epic: 'E', Legendary: 'L',
}

export default function CollectionPage() {
  const [characters, setCharacters]   = useState<Character[]>([])
  const [ownedIds, setOwnedIds]       = useState<Set<string>>(new Set())
  const [filterGrade, setFilterGrade] = useState<string>('ALL')

  useEffect(() => {
    fetch(`${API_URL}/api/characters`)
      .then(r => r.json())
      .then(d => setCharacters(d.characters ?? []))

    const userId = localStorage.getItem('userId')
    if (userId) {
      fetch(`${API_URL}/api/characters/my`, {
        headers: { 'x-user-id': userId },
      })
        .then(r => r.json())
        .then(d => {
          const ids = (d.characters ?? []).map((c: Character) => c.id)
          setOwnedIds(new Set(ids))
        })
    }
  }, [])

  const grades  = ['ALL', 'Legendary', 'Epic', 'Rare', 'Normal']
  const filtered = filterGrade === 'ALL'
    ? characters
    : characters.filter(c => c.grade === filterGrade)

  return (
    <main className="min-h-screen bg-hero p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-6 text-white">캐릭터 컬렉션</h1>

        {/* 등급 필터 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {grades.map(g => (
            <button
              key={g}
              onClick={() => setFilterGrade(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                filterGrade === g ? 'bg-brand-purple text-white' : 'glass-panel text-purple-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* 캐릭터 그리드 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {filtered.map(char => (
            <CharacterCard
              key={char.id}
              character={char}
              owned={ownedIds.has(char.id)}
            />
          ))}
        </div>

        <p className="text-xs opacity-30 text-center mt-6">
          보유 {ownedIds.size} / {characters.length}종
        </p>
      </div>
    </main>
  )
}

function CharacterCard({ character: c, owned }: { character: Character; owned: boolean }) {
  return (
    <div className={`relative border-2 rounded-xl overflow-hidden transition-transform hover:scale-105 cursor-pointer grade-${c.grade} ${!owned ? 'opacity-40 grayscale' : ''}`}
      style={{ background: '#1A1542', aspectRatio: '3/4' }}>
      {/* 이미지 영역 */}
      <div className="w-full h-3/4 flex items-center justify-center bg-white/5 text-4xl">
        🎭
      </div>
      {/* 정보 */}
      <div className="p-1.5">
        <p className="text-xs font-bold truncate text-white">{c.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs opacity-50">{c.class}</span>
          <span className={`text-xs font-black grade-${c.grade} px-1 rounded`} style={{ color: gradeColor(c.grade) }}>
            {GRADE_LABEL[c.grade]}
          </span>
        </div>
      </div>
      {/* 미보유 오버레이 */}
      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  )
}

function gradeColor(grade: string) {
  return ({ Normal: '#9CA3AF', Rare: '#60A5FA', Epic: '#A855F7', Legendary: '#F59E0B' } as Record<string, string>)[grade] ?? '#fff'
}
