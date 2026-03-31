'use client'

/**
 * AbilityBar.tsx — AG 게이지 + 어빌리티 버튼
 */

import type { Player } from '@shared/gameLogic/types'

interface AbilityBarProps {
  player:       Player
  isMyTurn:     boolean
  onUseAbility: (abilityId: string) => void
}

export default function AbilityBar({ player, isMyTurn, onUseAbility }: AbilityBarProps) {
  const agPct  = Math.min(100, player.ag)
  const isReady = agPct >= 100

  // AG 바 색상: 보라 → 금 (충전도에 따라)
  const agColor = isReady
    ? '#F59E0B'
    : `hsl(${270 - agPct * 1.5}, 80%, 60%)`

  return (
    <div className="glass-panel p-3 space-y-2">
      {/* AG 게이지 바 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide opacity-60 w-8">AG</span>
        <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isReady ? 'animate-pulse' : ''}`}
            style={{ width: `${agPct}%`, background: `linear-gradient(90deg, #7C3AED, ${agColor})` }}
          />
        </div>
        <span className="text-xs font-mono font-black w-12 text-right" style={{ color: agColor }}>
          {player.ag} / 100
        </span>
      </div>

      {/* ABILITY READY 표시 */}
      {isReady && (
        <div className="text-center text-xs font-black animate-ag-ready" style={{ color: '#F59E0B' }}>
          ⚡ ABILITY READY
        </div>
      )}

      {/* 어빌리티 버튼 목록 */}
      <div className="flex gap-2 flex-wrap">
        {player.party.attacker.abilities.map(ab => (
          <button
            key={ab.id}
            onClick={() => isReady && isMyTurn && onUseAbility(ab.id)}
            disabled={!isReady || !isMyTurn}
            title={`${ab.name} (${ab.effectType})`}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              isReady && isMyTurn
                ? 'bg-brand-purple text-white hover:bg-purple-500'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {ab.name}
          </button>
        ))}
      </div>

      {/* 활성 어빌리티 표시 */}
      {player.activeAbility && (
        <div className="text-xs glass-panel px-2 py-1 text-yellow-400 font-bold">
          🟡 {player.activeAbility.ability.name} ({player.activeAbility.remainingDuration}턴 남음)
        </div>
      )}
    </div>
  )
}
