'use client'

/**
 * ItemHand.tsx — 보유 아이템 카드 패 (최대 5장)
 */

import type { Item } from '@shared/gameLogic/types'

const TIMING_LABEL: Record<string, string> = {
  before_roll:   '이동 전',
  during_battle: '전투 중',
  anytime:       '언제든',
}

const TIMING_COLOR: Record<string, string> = {
  before_roll:   '#10B981',
  during_battle: '#EF4444',
  anytime:       '#F59E0B',
}

interface ItemHandProps {
  items:      Item[]
  isMyTurn:   boolean
  inBattle:   boolean
  onUseItem:  (itemId: string) => void
}

export default function ItemHand({ items, isMyTurn, inBattle, onUseItem }: ItemHandProps) {
  function canUse(item: Item): boolean {
    if (!isMyTurn) return false
    if (item.useTiming === 'anytime') return true
    if (item.useTiming === 'during_battle') return inBattle
    if (item.useTiming === 'before_roll') return !inBattle
    return false
  }

  if (items.length === 0) {
    return (
      <div className="glass-panel p-2 text-center text-xs opacity-30">
        아이템 없음
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((item, i) => {
        const usable = canUse(item)
        return (
          <button
            key={i}
            onClick={() => usable && onUseItem(item.id)}
            disabled={!usable}
            title={`${item.name}\n${TIMING_LABEL[item.useTiming]}`}
            className={`glass-panel px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
              usable
                ? 'hover:border-yellow-400 hover:scale-105 cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <span className="block text-base">🃏</span>
              <span className="text-white truncate max-w-12 block">{item.name}</span>
              <span className="text-xs" style={{ color: TIMING_COLOR[item.useTiming] }}>
                {TIMING_LABEL[item.useTiming]}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
