/**
 * GameScene.ts — Phaser.js 게임 씬
 *
 * 보드 레이아웃: 50타일 스네이크 패턴
 *   Row 0 (하단): 타일 0~9  (→ 방향)
 *   Row 1:        타일 10~19 (← 방향)
 *   Row 2:        타일 20~29 (→ 방향)
 *   Row 3:        타일 30~39 (← 방향)
 *   Row 4 (상단): 타일 40~49 (→ 방향, 49=골)
 *
 * 타일 크기: 72×72px, 간격 4px
 * 캐말스: 800×430px
 */

import Phaser from "phaser"
import type { GameState, TileType } from "../../../../../shared/gameLogic/types"

const COLS       = 10
const ROWS       = 5
const TILE_SIZE  = 72
const TILE_GAP   = 4
const STRIDE     = TILE_SIZE + TILE_GAP
const BOARD_PAD  = 8

const TILE_COLORS: Record<TileType, number> = {
  normal:         0x1e293b,
  warp_green:     0x15803d,
  warp_yellow:    0xa16207,
  warp_blue:      0x1d4ed8,
  doa:            0xb91c1c,
  ability_charge: 0x6d28d9,
  blessing:       0x0e7490,
  curse:          0x9f1239,
  goal:           0xb45309,
}

const TILE_BORDER: Record<TileType, number> = {
  normal:         0x334155,
  warp_green:     0x22c55e,
  warp_yellow:    0xfbbf24,
  warp_blue:      0x60a5fa,
  doa:            0xef4444,
  ability_charge: 0xa78bfa,
  blessing:       0x22d3ee,
  curse:          0xfb7185,
  goal:           0xfbbf24,
}

const TILE_LABELS: Partial<Record<TileType, string>> = {
  warp_green:     "WARP",
  warp_yellow:    "WARP",
  warp_blue:      "WARP",
  doa:            "DOA",
  ability_charge: "AG+",
  blessing:       "BLESS",
  curse:          "CURSE",
  goal:           "GOAL",
}

const PLAYER_COLORS = [0xd946ef, 0x38bdf8]

function getTileXY(index: number): { x: number; y: number } {
  const row = Math.floor(index / COLS)
  const col = index % COLS
  const actualCol = row % 2 === 0 ? col : (COLS - 1 - col)
  const actualRow = ROWS - 1 - row

  return {
    x: BOARD_PAD + actualCol * STRIDE + TILE_SIZE / 2,
    y: BOARD_PAD + actualRow * STRIDE + TILE_SIZE / 2,
  }
}

export interface GameSceneData {
  gameState:  GameState
  mySocketId: string
}

export class GameScene extends Phaser.Scene {
  private gameState!:  GameState
  private mySocketId!: string
  private playerTokens: Map<string, Phaser.GameObjects.Container> = new Map()
  private isAnimating = false

  constructor() {
    super({ key: "GameScene" })
  }

  init(data: GameSceneData) {
    this.gameState  = data.gameState
    this.mySocketId = data.mySocketId
  }

  create() {
    this.cameras.main.setBackgroundColor("#0a0a0f")
    this.drawBoard()
    this.drawWarpArrows()
    this.createPlayerTokens()
    this.updatePlayerPositions()
  }

  private drawBoard() {
    const tiles = this.gameState.boardState.tiles

    tiles.forEach((tile, i) => {
      const { x, y } = getTileXY(i)
      const g = this.add.graphics()

      g.fillStyle(TILE_COLORS[tile.type], 1)
      g.fillRoundedRect(x - TILE_SIZE/2, y - TILE_SIZE/2, TILE_SIZE, TILE_SIZE, 6)
      g.lineStyle(1.5, TILE_BORDER[tile.type], 0.8)
      g.strokeRoundedRect(x - TILE_SIZE/2, y - TILE_SIZE/2, TILE_SIZE, TILE_SIZE, 6)

      this.add.text(x, y - 14, String(i), {
        fontSize: "11px",
        color:    "#94a3b8",
        fontFamily: "monospace",
      }).setOrigin(0.5)

      if (TILE_LABELS[tile.type]) {
        this.add.text(x, y + 8, TILE_LABELS[tile.type]!, {
          fontSize:   "9px",
          color:      "#ffffff",
          fontFamily: "monospace",
          fontStyle:  "bold",
        }).setOrigin(0.5)
      }
    })
  }

  private drawWarpArrows() {
    const warpTiles = this.gameState.boardState.tiles.filter(t => t.warpTarget !== null)

    warpTiles.forEach(tile => {
      const from = getTileXY(tile.index)
      const to   = getTileXY(tile.warpTarget!)

      const g = this.add.graphics()
      g.lineStyle(1.5, TILE_BORDER[tile.type], 0.35)

      const cx = (from.x + to.x) / 2
      const cy = (from.y + to.y) / 2 - 30

      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(from.x, from.y),
        new Phaser.Math.Vector2(cx, cy),
        new Phaser.Math.Vector2(to.x, to.y),
      )
      curve.draw(g, 32)
    })
  }

  private createPlayerTokens() {
    this.gameState.players.forEach((player, idx) => {
      const container = this.add.container(0, 0)

      const circle = this.add.graphics()
      circle.fillStyle(PLAYER_COLORS[idx % PLAYER_COLORS.length], 1)
      circle.fillCircle(0, 0, 14)
      circle.lineStyle(2, 0xffffff, 0.8)
      circle.strokeCircle(0, 0, 14)

      const initial = this.add.text(0, 0, player.nickname[0].toUpperCase(), {
        fontSize:   "12px",
        color:      "#ffffff",
        fontFamily: "monospace",
        fontStyle:  "bold",
      }).setOrigin(0.5)

      container.add([circle, initial])
      this.playerTokens.set(player.id, container)

      if (player.id === this.mySocketId) {
        this.tweens.add({
          targets:  container,
          scaleX:   1.15,
          scaleY:   1.15,
          yoyo:     true,
          repeat:   -1,
          duration: 800,
          ease:     "Sine.easeInOut",
        })
      }
    })
  }

  private updatePlayerPositions(animated = false) {
    this.gameState.players.forEach((player, idx) => {
      const token = this.playerTokens.get(player.id)
      if (!token) return

      const { x, y } = getTileXY(player.position)
      const offset = idx * 16 - 8

      if (animated) {
        this.tweens.add({
          targets:  token,
          x:        x + offset,
          y:        y + offset,
          duration: 300,
          ease:     "Power2",
        })
      } else {
        token.setPosition(x + offset, y + offset)
      }
    })
  }

  animateMove(playerId: string, path: number[], onComplete: () => void) {
    if (this.isAnimating) return
    this.isAnimating = true

    const token = this.playerTokens.get(playerId)
    if (!token || path.length === 0) {
      this.isAnimating = false
      onComplete()
      return
    }

    const playerIdx = this.gameState.players.findIndex(p => p.id === playerId)
    const offset = playerIdx * 16 - 8

    const timeline = this.tweens.createTimeline()

    path.forEach(tileIdx => {
      const { x, y } = getTileXY(tileIdx)
      timeline.add({
        targets:  token,
        x:        x + offset,
        y:        y + offset,
        duration: 180,
        ease:     "Power1",
      })
    })

    timeline.setCallback("onComplete", () => {
      this.isAnimating = false
      onComplete()
    })

    timeline.play()
  }

  updateState(newState: GameState, path?: number[], movedPlayerId?: string) {
    this.gameState = newState

    if (path && path.length > 0 && movedPlayerId) {
      this.animateMove(movedPlayerId, path, () => {
        this.highlightCurrentTurn()
      })
    } else {
      this.updatePlayerPositions(true)
    }

    this.highlightCurrentTurn()
  }

  private highlightCurrentTurn() {
    this.playerTokens.forEach((token, playerId) => {
      token.setAlpha(playerId === this.gameState.currentTurn ? 1 : 0.6)
    })
  }

  flashAgCharge(playerId: string) {
    const player = this.gameState.players.find(p => p.id === playerId)
    if (!player) return

    const { x, y } = getTileXY(player.position)
    const flash = this.add.graphics()
    flash.fillStyle(0xa78bfa, 0.6)
    flash.fillCircle(x, y, 40)

    this.tweens.add({
      targets:  flash,
      alpha:    0,
      scaleX:   2,
      scaleY:   2,
      duration: 500,
      onComplete: () => flash.destroy(),
    })
  }
}
