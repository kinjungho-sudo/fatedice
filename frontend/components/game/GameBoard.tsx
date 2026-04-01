'use client'

/**
 * GameBoard.tsx — Phaser.js 보드판 (Canvas 레이어)
 *
 * ★ 게임 로직 계산 절대 금지 — 소켓 이벤트 결과만 시각화
 * ★ Canvas(Phaser) 와 React DOM 레이어 분리 유지
 */

import { useEffect, useRef } from 'react'
import type { GameState, Player, TileType } from '@shared/gameLogic/types'

interface DiceResultEvent {
  playerId: string
  rolls:    number[]
  total:    number
  newPos:   number
}

// ── Phaser 씬 상수 ────────────────────────────────────────────────

const TILE_SIZE    = 56    // 헥사곤 타일 크기 (px)
const BOARD_COLS   = 10
const BOARD_ROWS   = 5
const CANVAS_W     = 800
const CANVAS_H     = 480

// 타일 타입별 색상 (Design Bible 기준)
const TILE_COLORS: Record<TileType, number> = {
  normal:          0x2D4A22,
  warp_green:      0x10B981,
  warp_yellow:     0xF59E0B,
  warp_blue:       0x3B82F6,
  doa:             0x7F1D1D,
  ability_charge:  0x7C3AED,
  blessing:        0xF59E0B,
  curse:           0x4C1D95,
  goal:            0xFFD700,
}

interface GameBoardProps {
  gameState:        GameState | null
  myPlayerId:       string | null
  diceEvent:        DiceResultEvent | null
  onDiceAnimDone:   () => void
  onGenesisReturn:  (loserId: string) => void
}

export default function GameBoard({
  gameState,
  myPlayerId,
  diceEvent,
  onDiceAnimDone,
  onGenesisReturn,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<any>(null)   // Phaser.Game 인스턴스
  const sceneRef     = useRef<any>(null)   // GameScene 인스턴스

  // ── Phaser 초기화 ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    let destroyed = false

    import('phaser').then(({ default: Phaser }) => {
      if (destroyed) return

      class GameScene extends Phaser.Scene {
        private tiles:   Phaser.GameObjects.Rectangle[] = []
        private pieces:  Map<string, Phaser.GameObjects.Container> = new Map()
        private tilePositions: { x: number; y: number }[]         = []

        constructor() { super({ key: 'GameScene' }) }

        create() {
          sceneRef.current = this

          this.cameras.main.setBackgroundColor(0x0F0B2E)
          this.buildBoard()
          if (gameState) this.syncPlayers(gameState.players)
        }

        // ── 보드 생성 ──────────────────────────────────────────

        buildBoard() {
          const board = gameState?.boardState
          if (!board) return

          this.tilePositions = []

          board.tiles.forEach((tile, i) => {
            const col = i % BOARD_COLS
            const row = Math.floor(i / BOARD_COLS)
            const x   = 60 + col * (TILE_SIZE + 4)
            const y   = 60 + row * (TILE_SIZE + 4)

            this.tilePositions.push({ x, y })

            const color = TILE_COLORS[tile.type] ?? 0x2D4A22
            const rect  = this.add.rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4, color)
            rect.setStrokeStyle(1.5, 0xFFFFFF, 0.12)
            rect.setInteractive()

            // 타일 번호
            this.add.text(x, y + 18, String(i), {
              fontSize: '9px',
              color:    '#ffffff',
            }).setOrigin(0.5).setAlpha(0.3)

            // 타일 타입 아이콘
            const icon = this.getTileIcon(tile.type)
            if (icon) {
              this.add.text(x, y - 6, icon, { fontSize: '16px' }).setOrigin(0.5)
            }

            this.tiles.push(rect)
          })
        }

        getTileIcon(type: TileType): string {
          const icons: Partial<Record<TileType, string>> = {
            warp_green:     '🌀',
            warp_yellow:    '🟡',
            warp_blue:      '💠',
            doa:            '💀',
            ability_charge: '⚡',
            blessing:       '✨',
            curse:          '🌑',
            goal:           '🏆',
          }
          return icons[type] ?? ''
        }

        // ── 플레이어 말(Piece) 렌더링 ─────────────────────────

        syncPlayers(players: Player[]) {
          players.forEach(player => {
            const pos = this.tilePositions[player.position]
            if (!pos) return

            if (!this.pieces.has(player.id)) {
              this.createPiece(player)
            }
            this.movePieceTo(player.id, pos.x, pos.y)
          })
        }

        createPiece(player: Player) {
          const isMe    = player.id === myPlayerId
          const color   = isMe ? 0x7C3AED : 0xEF4444
          const circle  = this.add.circle(0, 0, 14, color)
          const outline = this.add.circle(0, 0, 14)
          outline.setStrokeStyle(2, 0xFFFFFF, 0.8)

          const label = this.add.text(0, 0, player.nickname.slice(0, 2), {
            fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
          }).setOrigin(0.5)

          const container = this.add.container(0, 0, [circle, outline, label])
          this.pieces.set(player.id, container)
        }

        movePieceTo(playerId: string, x: number, y: number, animate = false) {
          const piece = this.pieces.get(playerId)
          if (!piece) return

          if (animate) {
            this.tweens.add({
              targets:  piece,
              x, y,
              duration: 300,
              ease:     'Quad.easeInOut',
            })
          } else {
            piece.setPosition(x, y)
          }
        }

        // ── 주사위 굴림 애니메이션 ─────────────────────────────

        playDiceAnimation(result: DiceResultEvent, onDone: () => void) {
          const cx = CANVAS_W / 2
          const cy = CANVAS_H / 2

          // 주사위 배경
          const bg = this.add.rectangle(cx, cy, 200, 120, 0x000000, 0.7)
          bg.setStrokeStyle(2, 0x7C3AED)

          const rollText = this.add.text(cx, cy - 20, '🎲', { fontSize: '40px' })
            .setOrigin(0.5)

          const totalText = this.add.text(cx, cy + 20, '', {
            fontSize:  '28px',
            color:     '#F59E0B',
            fontStyle: 'bold',
          }).setOrigin(0.5)

          // 주사위 스핀
          this.tweens.add({
            targets:  rollText,
            angle:    720,
            duration: 800,
            ease:     'Quad.easeOut',
            onComplete: () => {
              totalText.setText(String(result.total))

              this.time.delayedCall(600, () => {
                // 이동 애니메이션
                const pos = this.tilePositions[result.newPos]
                if (pos) this.movePieceTo(result.playerId, pos.x, pos.y, true)

                this.time.delayedCall(400, () => {
                  bg.destroy(); rollText.destroy(); totalText.destroy()
                  onDone()
                })
              })
            },
          })
        }
      }

      const config: any = {
        type:   Phaser.AUTO,
        width:  CANVAS_W,
        height: CANVAS_H,
        parent: containerRef.current!,
        scene:  GameScene,
        backgroundColor: '#0F0B2E',
        scale: {
          mode:            Phaser.Scale.FIT,
          autoCenter:      Phaser.Scale.CENTER_BOTH,
        },
      }

      gameRef.current = new Phaser.Game(config)
    })

    return () => {
      destroyed = true
      gameRef.current?.destroy(true)
      gameRef.current = null
      sceneRef.current = null
    }
  }, []) // eslint-disable-line

  // ── gameState 변경 시 플레이어 위치 동기화 ─────────────────────

  useEffect(() => {
    if (!sceneRef.current || !gameState) return
    sceneRef.current.syncPlayers?.(gameState.players)
  }, [gameState])

  // ── 주사위 이벤트 수신 시 애니메이션 실행 ─────────────────────

  useEffect(() => {
    if (!sceneRef.current || !diceEvent) return
    sceneRef.current.playDiceAnimation?.(diceEvent, onDiceAnimDone)
  }, [diceEvent]) // eslint-disable-line

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
    />
  )
}
