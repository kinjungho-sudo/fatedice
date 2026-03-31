'use client'

/**
 * BattleScreen.tsx — 전투 연출 + ★ 태초귀환 특수 이펙트 ★
 *
 * Design Bible VFX 명세:
 *   태초귀환 총 4.5초 시퀀스:
 *   0.0~0.3s : 화면 전체 빨간 플래시
 *   0.3~0.8s : 흑백 + 슬로우모션 느낌 (desaturate)
 *   0.8~1.6s : "태 초 귀 환" 글자 한 자씩 등장
 *   1.6~2.5s : 소용돌이 파티클 (CSS 애니메이션)
 *   2.5~3.5s : 번개+소멸 → 귀환 빛 materialise
 *   3.5~4.5s : 화면 정상 복귀 + "귀환 완료" 텍스트
 */

import { useEffect, useState, useRef } from 'react'
import type { BattleResult } from '@shared/gameLogic/types'

interface BattleScreenProps {
  result:   BattleResult | null
  players:  { id: string; nickname: string }[]
  onClose:  () => void
}

type BattlePhase =
  | 'idle'
  | 'battle-start'
  | 'battle-result'
  | 'genesis-flash'
  | 'genesis-desaturate'
  | 'genesis-text'
  | 'genesis-storm'
  | 'genesis-vanish'
  | 'genesis-return'
  | 'done'

export default function BattleScreen({ result, players, onClose }: BattleScreenProps) {
  const [phase, setPhase] = useState<BattlePhase>('idle')
  const [genesisChars, setGenesisChars] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const attackerNick = players.find(p => p.id === result?.attackerId)?.nickname ?? '???'
  const defenderNick = players.find(p => p.id === result?.defenderId)?.nickname ?? '???'

  useEffect(() => {
    if (!result) { setPhase('idle'); return }

    setPhase('battle-start')
    setGenesisChars([])

    const t1 = setTimeout(() => setPhase('battle-result'), 600)

    if (result.isGenesisReturn) {
      // ── 태초귀환 시퀀스 ────────────────────────────────────
      const t2 = setTimeout(() => setPhase('genesis-flash'),       1800)
      const t3 = setTimeout(() => setPhase('genesis-desaturate'),  2100)
      const t4 = setTimeout(() => {
        setPhase('genesis-text')
        // 글자 한 자씩 등장
        const chars = ['태', '초', '귀', '환']
        chars.forEach((c, i) => {
          setTimeout(() => setGenesisChars(prev => [...prev, c]), i * 200)
        })
      }, 2600)
      const t5 = setTimeout(() => setPhase('genesis-storm'),  3500)
      const t6 = setTimeout(() => setPhase('genesis-vanish'), 4300)
      const t7 = setTimeout(() => setPhase('genesis-return'), 5000)
      const t8 = setTimeout(() => { setPhase('done'); onClose() }, 6200)

      return () => [t1,t2,t3,t4,t5,t6,t7,t8].forEach(clearTimeout)
    } else {
      const t2 = setTimeout(() => { setPhase('done'); onClose() }, 3000)
      return () => [t1, t2].forEach(clearTimeout)
    }
  }, [result]) // eslint-disable-line

  if (phase === 'idle' || !result) return null

  const isGenesis     = result.isGenesisReturn
  const loserId       = result.winner === 'attacker' ? result.defenderId : result.attackerId
  const loserNick     = players.find(p => p.id === loserId)?.nickname ?? '???'
  const winnerNick    = result.winner === 'attacker' ? attackerNick : defenderNick

  // ── 태초귀환 단계별 오버레이 ─────────────────────────────────────

  const showFlash      = phase === 'genesis-flash'
  const showDesaturate = phase === 'genesis-desaturate' || phase === 'genesis-text'
  const showText       = phase === 'genesis-text' || phase === 'genesis-storm'
  const showStorm      = phase === 'genesis-storm' || phase === 'genesis-vanish'
  const showReturn     = phase === 'genesis-return'

  return (
    <>
      {/* ── 태초귀환: 빨간 플래시 ── */}
      {showFlash && (
        <div
          className="fixed inset-0 z-50 pointer-events-none animate-genesis-flash"
          style={{ background: 'rgba(255,0,0,0.7)' }}
        />
      )}

      {/* ── 태초귀환: 흑백 필터 ── */}
      {showDesaturate && (
        <div
          className="fixed inset-0 z-40 pointer-events-none transition-all duration-500"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'saturate(0.1)' }}
        />
      )}

      {/* ── 태초귀환: 글자 등장 ── */}
      {showText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="flex gap-4">
            {genesisChars.map((c, i) => (
              <span
                key={i}
                className="text-7xl font-black text-white"
                style={{
                  textShadow: '0 0 30px #FF0000, 0 0 60px #FF0000',
                  animation:  `slideUp 0.3s ease-out both`,
                  letterSpacing: '0.1em',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 태초귀환: 소용돌이 파티클 ── */}
      {showStorm && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width:    Math.random() * 12 + 4 + 'px',
                height:   Math.random() * 12 + 4 + 'px',
                top:      40 + Math.random() * 20 + '%',
                left:     30 + Math.random() * 40 + '%',
                background: ['#FF4444','#CC00FF','#FF0088'][i % 3],
                opacity:  0.7,
                animationDelay:    Math.random() * 0.5 + 's',
                animationDuration: Math.random() * 0.8 + 0.4 + 's',
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-black text-white animate-pulse"
              style={{ textShadow: '0 0 40px #FF0000' }}>
              ⚡
            </div>
          </div>
        </div>
      )}

      {/* ── 태초귀환: 귀환 materialise ── */}
      {showReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-slide-up">
            <div className="text-6xl mb-4 animate-float">✨</div>
            <p className="text-2xl font-black text-white"
              style={{ textShadow: '0 0 20px #FFD700' }}>
              {loserNick}
            </p>
            <p className="text-lg font-bold text-yellow-400 mt-1">태초로 귀환!</p>
          </div>
        </div>
      )}

      {/* ── 일반 배틀 화면 ── */}
      {!isGenesis && (phase === 'battle-start' || phase === 'battle-result') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-8 min-w-96 text-center animate-slide-up">
            {/* BATTLE 타이틀 */}
            <h2 className="text-5xl font-black mb-6 text-white"
              style={{ textShadow: '0 0 20px #EF4444', letterSpacing: '0.1em' }}>
              BATTLE
            </h2>

            {/* 대결 구도 */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <PlayerStats
                nickname={attackerNick}
                rolls={result.atkRolls}
                total={result.atkTotal}
                isWinner={result.winner === 'attacker'}
              />
              <span className="text-3xl font-black text-white opacity-40">VS</span>
              <PlayerStats
                nickname={defenderNick}
                rolls={result.defRolls}
                total={result.defTotal}
                isWinner={result.winner === 'defender'}
              />
            </div>

            {/* 결과 */}
            {phase === 'battle-result' && (
              <div className="animate-slide-up">
                {result.winner === 'draw' ? (
                  <p className="text-xl font-black text-gray-400">무승부</p>
                ) : (
                  <>
                    <p className="text-2xl font-black text-yellow-400">
                      {winnerNick} 승리!
                    </p>
                    <p className="text-sm opacity-40 mt-1">차이: {result.diff}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function PlayerStats({
  nickname, rolls, total, isWinner,
}: {
  nickname: string
  rolls:    number[]
  total:    number
  isWinner: boolean
}) {
  return (
    <div className={`text-center transition-all ${isWinner ? 'scale-110' : 'opacity-50'}`}>
      <p className="text-sm font-bold text-white mb-2">{nickname}</p>
      <div className="flex gap-1 justify-center mb-2">
        {rolls.map((v, i) => (
          <span key={i} className="text-lg">
            {({1:'⚀',2:'⚁',3:'⚂',4:'⚃',5:'⚄',6:'⚅'} as Record<number,string>)[v] ?? '🎲'}
          </span>
        ))}
      </div>
      <p
        className="text-4xl font-black"
        style={{ color: isWinner ? '#F59E0B' : '#9CA3AF' }}
      >
        {total}
      </p>
    </div>
  )
}
