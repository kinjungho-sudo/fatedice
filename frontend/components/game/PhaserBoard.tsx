'use client'

/**
 * PhaserBoard.tsx — Phaser.js 캔버스 래퍼
 *
 * Next.js SSR에서 Phaser는 window 객체를 사용하므로
 * dynamic import + ssr:false 로만 사용 가능합니다.
 * 이 컴포넌트는 반드시 동적으로 import 해야 합니다.
 *   const PhaserBoard = dynamic(() => import('./PhaserBoard'), { ssr: false })
 */

import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import type { GameState } from '../../../../shared/gameLogic/types'

interface Props {
  gameState:  GameState
  mySocketId: string
  onReady?:   (scene: import('./phaser/GameScene').GameScene) => void
}

export default function PhaserBoard({ gameState, mySocketId, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<Phaser.Game | null>(null)
  const sceneRef     = useRef<import('./phaser/GameScene').GameScene | null>(null)

  // 게임 초기화 (마운트 시 1회)
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const init = async () => {
      const PhaserLib  = (await import('phaser')).default
      const { GameScene } = await import('./phaser/GameScene')

      const scene = new GameScene()
      sceneRef.current = scene

      const config: Phaser.Types.Core.GameConfig = {
        type:   PhaserLib.AUTO,
        width:  800,
        height: 430,
        parent: containerRef.current!,
        backgroundColor: '#0a0a0f',
        scene,
      }

      const game = new PhaserLib.Game(config)
      gameRef.current = game

      // 씬 준비 완료 콜백
      game.events.once('ready', () => {
        scene.scene.start('GameScene', { gameState, mySocketId })
        onReady?.(scene)
      })
    }

    init()

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
      sceneRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // gameState 업데이트 시 씬에 반영
  useEffect(() => {
    sceneRef.current?.updateState(gameState)
  }, [gameState])

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-white/10"
      style={{ width: 800, height: 430 }}
    />
  )
}
