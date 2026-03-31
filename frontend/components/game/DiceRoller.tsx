'use client'

/**
 * DiceRoller.tsx — 주사위 굴리기 버튼 UI
 * Phaser가 실제 애니메이션을 담당, 이 컴포넌트는 트리거 버튼만 제공
 */

interface DiceRollerProps {
  isMyTurn:     boolean
  isRolling:    boolean
  canRoll:      boolean     // 이미 굴렸으면 false
  onRoll:       () => void
  lastRolls:    number[]
  lastTotal:    number | null
}

const DICE_FACE: Record<number, string> = {
  1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅',
}

export default function DiceRoller({
  isMyTurn, isRolling, canRoll, onRoll, lastRolls, lastTotal,
}: DiceRollerProps) {
  return (
    <div className="flex items-center gap-3">
      {/* 주사위 결과 표시 */}
      {lastRolls.length > 0 && (
        <div className="flex gap-1 items-center">
          {lastRolls.map((v, i) => (
            <span key={i} className="text-2xl" title={String(v)}>
              {DICE_FACE[v] ?? '🎲'}
            </span>
          ))}
          {lastTotal !== null && (
            <span className="ml-1 font-black text-brand-gold text-lg">= {lastTotal}</span>
          )}
        </div>
      )}

      {/* 굴리기 버튼 */}
      <button
        onClick={onRoll}
        disabled={!isMyTurn || !canRoll || isRolling}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white transition-all"
        style={{
          background: isMyTurn && canRoll && !isRolling
            ? 'linear-gradient(90deg,#7C3AED,#5B21B6)'
            : 'rgba(255,255,255,0.08)',
          boxShadow: isMyTurn && canRoll ? '0 4px 20px rgba(124,58,237,0.5)' : 'none',
          opacity: (!isMyTurn || !canRoll) ? 0.4 : 1,
        }}
      >
        <span className={isRolling ? 'animate-spin' : ''}>🎲</span>
        <span>{isRolling ? '...' : '주사위'}</span>
      </button>
    </div>
  )
}
