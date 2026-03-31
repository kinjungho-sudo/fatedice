'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuthStore } from '../../../store/authStore'
import { useGameStore } from '../../../store/gameStore'

// Phaser는 SSR 불가 → 클라이언트 전용 동적 import
const PhaserBoard = dynamic(() => import('../../../components/game/PhaserBoard'), { ssr: false })
import GameHUD from '../../../components/game/GameHUD'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const { user } = useAuthStore()
  const {
    gameState, uiPhase, mySocketId,
    battleResult, winner, eventLog,
    setReady, endTurn, clearBattle,
  } = useGameStore()

  const [showBattle, setShowBattle] = useState(false)
  const [isReady,    setIsReady]    = useState(false)

  // 미로그인 처리
  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  // 전투 결과 표시
  useEffect(() => {
    if (battleResult) {
      setShowBattle(true)
      const timer = setTimeout(() => {
        setShowBattle(false)
        clearBattle()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [battleResult, clearBattle])

  // 게임 종료
  useEffect(() => {
    if (uiPhase === 'game_over') {
      // 5초 후 로비로
      const timer = setTimeout(() => router.push('/lobby'), 5000)
      return () => clearTimeout(timer)
    }
  }, [uiPhase, router])

  const handleReady = () => {
    if (!user) return
    setReady(roomId, user.id)
    setIsReady(true)
  }

  if (!user) return null

  // ── 대기실 화면 ─────────────────────────────────────────────────
  if (uiPhase === 'waiting_room') {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 70%)' }}>
        <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-2">게임 대기 중</h2>
          <p className="text-white/40 text-sm mb-6">방 ID: {roomId}</p>

          <div className="space-y-3 mb-8">
            <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70">
              상대방 입장 대기 중...
              <span className="inline-block ml-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>

          {!isReady ? (
            <button onClick={handleReady} className="btn-primary w-full">
              준비 완료
            </button>
          ) : (
            <div className="btn-secondary w-full text-center cursor-default opacity-70">
              준비 완료 — 상대방 대기 중
            </div>
          )}

          <button onClick={() => router.push('/lobby')} className="mt-4 text-white/30 hover:text-white/60 text-sm transition-colors">
            방 나가기
          </button>
        </div>
      </div>
    )
  }

  // ── 게임 종료 화면 ──────────────────────────────────────────────
  if (uiPhase === 'game_over') {
    const isWinner = gameState?.players.find(p => p.userId === winner)?.id === mySocketId

    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 70%)' }}>
        <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
          <div className="text-6xl mb-4">{isWinner ? '🏆' : '💀'}</div>
          <h2 className={`text-3xl font-black mb-2 ${isWinner ? 'text-yellow-400' : 'text-red-400'}`}>
            {isWinner ? '승리!' : '패배'}
          </h2>
          <p className="text-white/40 text-sm mb-6">5초 후 로비로 이동합니다</p>
          <button onClick={() => router.push('/lobby')} className="btn-primary">
            로비로 이동
          </button>
        </div>
      </div>
    )
  }

  // ── 인게임 화면 ─────────────────────────────────────────────────
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40">게임 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)' }}>

      {/* 상단 헤더 */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-black bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
          FateDice
        </span>
        <div className="text-xs text-white/30">
          {gameState.mode} · 방 {roomId.slice(0, 8)}
        </div>
      </header>

      {/* 메인 게임 영역 */}
      <main className="flex-1 flex items-start justify-center gap-6 p-6">
        {/* 보드 캔버스 */}
        <div className="flex-1 flex justify-center">
          <PhaserBoard
            gameState={gameState}
            mySocketId={mySocketId ?? ''}
          />
        </div>

        {/* HUD */}
        <GameHUD
          gameState={gameState}
          mySocketId={mySocketId ?? ''}
          roomId={roomId}
        />
      </main>

      {/* 전투 결과 오버레이 */}
      {showBattle && battleResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => { setShowBattle(false); clearBattle() }}>
          <div className="glass rounded-2xl p-8 text-center max-w-sm mx-4 animate-float">
            <div className="text-4xl mb-3">
              {battleResult.winner === 'draw' ? '🤝' :
               battleResult.winner === 'attacker' ? '⚔️' : '🛡️'}
            </div>
            <h3 className={`text-2xl font-black mb-1 ${
              battleResult.winner === 'draw' ? 'text-white' :
              battleResult.winner === 'attacker' ? 'text-red-400' : 'text-blue-400'
            }`}>
              {battleResult.winner === 'draw' ? '무승부' :
               battleResult.winner === 'attacker' ? '공격 승리' : '방어 승리'}
            </h3>

            <div className="flex items-center justify-center gap-6 my-4 text-2xl font-black">
              <span className="text-red-400">{battleResult.atkTotal}</span>
              <span className="text-white/30 text-lg">vs</span>
              <span className="text-blue-400">{battleResult.defTotal}</span>
            </div>

            {battleResult.isGenesisReturn && (
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-4 py-2 text-yellow-400 text-sm font-bold">
                🌟 태초 귀환! (차이: {battleResult.diff})
              </div>
            )}

            <p className="text-white/30 text-xs mt-4">클릭하여 닫기</p>
          </div>
        </div>
      )}
    </div>
  )
}
