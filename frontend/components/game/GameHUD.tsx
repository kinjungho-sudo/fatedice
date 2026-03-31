'use client'

/**
 * GameHUD.tsx — 게임 인게임 UI 오버레이
 *
 * 플레이어 상태, AG 게이지, 아이템, 이벤트 로그, 액션 버튼
 */

import type { GameState, Player, Item } from '../../../../shared/gameLogic/types'
import { useGameStore } from '../../store/gameStore'

interface Props {
  gameState:  GameState
  mySocketId: string
  roomId:     string
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────

function AGGauge({ ag }: { ag: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>AG</span>
        <span className={ag >= 100 ? 'text-purple-400 font-bold' : ''}>{ag}/100</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            ag >= 100 ? 'bg-purple-400 animate-pulse' : 'bg-purple-600'
          }`}
          style={{ width: `${Math.min(ag, 100)}%` }}
        />
      </div>
    </div>
  )
}

function PlayerCard({ player, isMe, isTurn }: { player: Player; isMe: boolean; isTurn: boolean }) {
  return (
    <div className={`glass rounded-xl p-3 transition-all ${
      isTurn ? 'ring-2 ring-brand-500 shadow-lg shadow-brand-500/20' : ''
    } ${!player.isConnected ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isMe ? 'bg-brand-600' : 'bg-blue-600'
        }`}>
          {player.nickname[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate flex items-center gap-1">
            {player.nickname}
            {isMe && <span className="text-xs text-brand-400">(나)</span>}
            {isTurn && <span className="text-xs text-yellow-400 animate-pulse">턴</span>}
          </div>
          <div className="text-xs text-white/40">타일 {player.position}</div>
        </div>
        {!player.isConnected && (
          <span className="text-xs text-red-400">연결 끊김</span>
        )}
      </div>

      <AGGauge ag={player.ag} />

      {/* 아이템 슬롯 */}
      {player.items.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {player.items.map((item: Item) => (
            <div key={item.id} title={item.name}
              className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-xs cursor-help">
              {getItemIcon(item.effectType)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getItemIcon(effectType: string): string {
  const icons: Record<string, string> = {
    MOVE_FREE:      '🕊',
    MOVE_BONUS:     '👟',
    BATTLE_NULLIFY: '🐟',
    SWAP_VALUES:    '🔄',
    MUTUAL_GENESIS: '💣',
    COPY_DICE:      '⚔',
    STAT_HALVE:     '☄',
    DICE_DESTROY:   '🎭',
  }
  return icons[effectType] ?? '?'
}

// ── 메인 HUD ─────────────────────────────────────────────────────

export default function GameHUD({ gameState, mySocketId, roomId }: Props) {
  const { rollDice, endTurn, useAbility, eventLog, isRolling } = useGameStore()

  const me     = gameState.players.find(p => p.id === mySocketId)
  const isMyTurn = gameState.currentTurn === mySocketId
  const phase    = gameState.phase

  const canRoll    = isMyTurn && phase === 'rolling'
  const canEndTurn = isMyTurn && (phase === 'result' || phase === 'skill')

  return (
    <div className="flex flex-col gap-4 w-72">
      {/* 플레이어 카드 */}
      <div className="space-y-3">
        {gameState.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isMe={player.id === mySocketId}
            isTurn={player.id === gameState.currentTurn}
          />
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
          {isMyTurn ? '내 차례' : '상대 차례 대기 중...'}
        </div>

        <button
          onClick={() => rollDice(roomId)}
          disabled={!canRoll || isRolling}
          className="btn-primary w-full"
        >
          {isRolling ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              주사위 굴리는 중...
            </span>
          ) : '🎲 주사위 굴리기'}
        </button>

        {me && me.ag >= 100 && me.party.attacker.abilities.length > 0 && isMyTurn && (
          <button
            onClick={() => useAbility(roomId, me.party.attacker.abilities[0].id)}
            className="btn-secondary w-full text-sm py-2"
          >
            ⚡ 어빌리티 사용
          </button>
        )}

        {canEndTurn && (
          <button
            onClick={() => endTurn(roomId)}
            className="btn-secondary w-full text-sm py-2"
          >
            턴 종료
          </button>
        )}
      </div>

      {/* 이벤트 로그 */}
      <div className="glass rounded-xl p-3">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">이벤트 로그</div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {eventLog.slice(0, 12).map((evt, i) => (
            <div key={i} className={`text-xs px-2 py-1 rounded-lg ${
              evt.type === 'battle'  ? 'bg-red-500/10 text-red-300' :
              evt.type === 'system'  ? 'bg-white/5 text-white/40'  :
              evt.type === 'ability' ? 'bg-purple-500/10 text-purple-300' :
              'bg-white/5 text-white/60'
            }`}>
              {evt.message}
            </div>
          ))}
          {eventLog.length === 0 && (
            <div className="text-xs text-white/20 text-center py-2">게임 이벤트가 여기에 표시됩니다</div>
          )}
        </div>
      </div>

      {/* 턴 / 페이즈 정보 */}
      <div className="glass rounded-xl px-4 py-2 flex justify-between text-xs text-white/40">
        <span>턴 {gameState.turnNumber}</span>
        <span className="capitalize">{phase}</span>
      </div>
    </div>
  )
}
