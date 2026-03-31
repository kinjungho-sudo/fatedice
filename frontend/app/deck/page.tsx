'use client'

import { useEffect, useState } from 'react'
import type { Character } from '@shared/gameLogic/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Slot = 'attacker' | 'defender' | 'intelligence'

const SLOT_LABEL: Record<Slot, string> = {
  attacker:     '⚔️ 어태커',
  defender:     '🛡️ 디펜더',
  intelligence: '✨ 인텔리전스',
}

const SLOT_ALLOWED: Record<Slot, string[]> = {
  attacker:     ['King', 'Queen', 'Knight'],
  defender:     ['King', 'Rook', 'Pawn'],
  intelligence: ['King', 'Bishop', 'Rook'],
}

export default function DeckPage() {
  const [myChars, setMyChars]   = useState<Character[]>([])
  const [deck, setDeck]         = useState<Record<Slot, Character | null>>({
    attacker: null, defender: null, intelligence: null,
  })
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [saved, setSaved]           = useState(false)

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') ?? '' : ''

  useEffect(() => {
    if (!userId) return
    fetch(`${API_URL}/api/characters/my`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(d => setMyChars(d.characters ?? []))
  }, [userId])

  function selectChar(char: Character) {
    if (!activeSlot) return
    const allowed = SLOT_ALLOWED[activeSlot]
    if (!allowed.includes(char.class)) {
      alert(`${char.name}(${char.class})은 ${SLOT_LABEL[activeSlot]} 포지션에 배치할 수 없습니다.\n가능: ${allowed.join(', ')}`)
      return
    }
    // 중복 방지
    const duplicate = Object.entries(deck).find(([s, c]) => s !== activeSlot && c?.id === char.id)
    if (duplicate) { alert('이미 다른 슬롯에 배치된 캐릭터입니다.'); return }

    setDeck(prev => ({ ...prev, [activeSlot]: char }))
    setActiveSlot(null)
  }

  async function saveDeck() {
    if (!deck.attacker || !deck.defender || !deck.intelligence) {
      alert('3개 슬롯을 모두 채워주세요.'); return
    }
    const body = {
      attackerId:     deck.attacker.id,
      defenderId:     deck.defender.id,
      intelligenceId: deck.intelligence.id,
    }
    localStorage.setItem('deck', JSON.stringify(body))
    const res = await fetch(`${API_URL}/api/characters/deck`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body:    JSON.stringify(body),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <main className="min-h-screen bg-hero p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-6 text-white">덱 편성</h1>

        {/* 3 슬롯 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(Object.entries(SLOT_LABEL) as [Slot, string][]).map(([slot, label]) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
              className={`glass-panel p-3 rounded-xl text-center transition-all ${activeSlot === slot ? 'border-brand-purple' : ''}`}
            >
              <p className="text-xs opacity-60 mb-2">{label}</p>
              {deck[slot] ? (
                <>
                  <div className="text-3xl mb-1">🎭</div>
                  <p className="text-sm font-bold text-white">{deck[slot]!.name}</p>
                  <p className="text-xs opacity-40">{deck[slot]!.class}</p>
                </>
              ) : (
                <div className="h-16 flex items-center justify-center text-2xl opacity-30">+</div>
              )}
            </button>
          ))}
        </div>

        {/* 캐릭터 선택 목록 */}
        {activeSlot && (
          <div className="glass-panel p-4 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
              {SLOT_LABEL[activeSlot]} 선택 (가능: {SLOT_ALLOWED[activeSlot].join(', ')})
            </p>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {myChars.filter(c => SLOT_ALLOWED[activeSlot].includes(c.class)).map(c => (
                <button key={c.id} onClick={() => selectChar(c)}
                  className={`glass-panel p-2 rounded-lg text-center hover:border-purple-400 transition-all grade-${c.grade}`}>
                  <div className="text-2xl mb-1">🎭</div>
                  <p className="text-xs font-bold">{c.name}</p>
                </button>
              ))}
            </div>
            {myChars.filter(c => SLOT_ALLOWED[activeSlot].includes(c.class)).length === 0 && (
              <p className="text-center text-sm opacity-40 py-4">해당 포지션에 배치 가능한 캐릭터가 없습니다</p>
            )}
          </div>
        )}

        <button
          onClick={saveDeck}
          className="w-full py-3 rounded-xl font-black text-white transition-all"
          style={{ background: 'linear-gradient(90deg,#7C3AED,#5B21B6)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
        >
          {saved ? '✅ 저장 완료!' : '덱 저장'}
        </button>
      </div>
    </main>
  )
}
