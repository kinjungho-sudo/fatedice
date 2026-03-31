'use client'

/**
 * CharacterCard.tsx — 사이드바 캐릭터 카드 (공격/방어/지력 슬롯)
 */

import type { Party } from '@shared/gameLogic/types'

const SLOT_ICON: Record<string, string> = {
  attacker:     '⚔️',
  defender:     '🛡️',
  intelligence: '✨',
}

const GRADE_BORDER: Record<string, string> = {
  Normal:    '#9CA3AF',
  Rare:      '#60A5FA',
  Epic:      '#A855F7',
  Legendary: '#F59E0B',
}

interface CharacterCardProps {
  party:     Party
  nickname:  string
  position:  number
  ag:        number
  isMe:      boolean
}

export default function CharacterCard({ party, nickname, position, ag, isMe }: CharacterCardProps) {
  const slots = [
    { key: 'attacker',     char: party.attacker },
    { key: 'defender',     char: party.defender },
    { key: 'intelligence', char: party.intelligence },
  ] as const

  return (
    <div className={`glass-panel p-2 space-y-1 ${isMe ? 'border-brand-purple' : 'border-red-500/30'}`}>
      {/* 플레이어 정보 */}
      <div className="flex items-center gap-1 px-1">
        <span className={`text-xs font-black ${isMe ? 'text-purple-300' : 'text-red-300'}`}>
          {isMe ? '▶' : '◀'} {nickname}
        </span>
        <span className="text-xs opacity-40 ml-auto">#{position}</span>
      </div>

      {/* 캐릭터 슬롯 3개 */}
      {slots.map(({ key, char }) => (
        <div
          key={key}
          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5"
          style={{ borderLeft: `2px solid ${GRADE_BORDER[char.grade]}` }}
        >
          <span className="text-sm">{SLOT_ICON[key]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{char.name}</p>
            <p className="text-xs opacity-40">{char.stats.atk}A {char.stats.def}D +{char.stats.int}</p>
          </div>
        </div>
      ))}

      {/* AG 미니 바 */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-xs opacity-40">AG</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10">
          <div className="h-full rounded-full ag-bar-fill" style={{ width: `${Math.min(100, ag)}%` }} />
        </div>
        <span className="text-xs opacity-40">{ag}</span>
      </div>
    </div>
  )
}
