/**
 * index.ts — shared/gameLogic barrel export
 * Agent2, Agent3, Agent4가 이 경로에서 import한다
 *
 * import { rollMovement, executeBattle, ... } from '@fatedice/shared/gameLogic'
 */

// 타입
export type {
  ChessClass, CharacterGrade, CharacterAttribute, PartySlot,
  AbilityEffectType, ItemEffectType, TileType, GamePhase,
  CharacterStats, Ability, Character, Party, Item,
  Player, ActiveAbility,
  Tile, BoardState, TileEvent, MoveResult,
  GameState, BattleResult,
  Deck,
  RoomCreatePayload, RoomJoinPayload, RoomMatchmakingPayload,
  GameUseItemPayload, GameUseAbilityPayload, GameBattleItemPayload,
} from './types'

// 주사위
export { rollDice, rollMovement, rollFixed, sumDice, applyIntBonus } from './dice'

// 전투
export { executeBattle, getBattleLoser, getBattleWinner } from './battle'

// 어빌리티/AG
export {
  AG_PER_TILE, AG_TILE_BONUS, AG_CURSE_PENALTY,
  chargeAG, chargeTileBonus, applyCursePenalty,
  canActivate, activateAbility, tickAbilityDuration,
  applyAbilityBonus, isAbilityActive,
} from './skills'

// 보드
export {
  BOARD_SIZE,
  initBoard, movePlayer, getTileEvent, getTile,
  checkCollision, applyDOA, isGoal,
} from './board'

// 아이템
export {
  ITEM_CATALOG, MAX_ITEMS,
  getItemById, canUseItem, addItem, removeItem,
  applyDiceDestroy, applyMoveFree,
  getItemsByType, getUsableItems,
} from './items'
