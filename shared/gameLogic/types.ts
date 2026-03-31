// ============================================================
// FateDice — 공유 타입 정의 (Single Source of Truth)
// 모든 Agent는 반드시 이 파일에서만 타입을 import한다
// ============================================================

/** 캐릭터 클래스 (체스 기물) */
export type ChessClass = 'King' | 'Queen' | 'Rook' | 'Bishop' | 'Knight' | 'Pawn'

/** 캐릭터 등급 */
export type CharacterGrade = 'Normal' | 'Rare' | 'Epic' | 'Legendary'

/** 캐릭터 속성 */
export type CharacterAttribute = 'Sword' | 'Wand' | 'Disk' | 'Cup'

/** 파티 슬롯 포지션 */
export type PartySlot = 'attacker' | 'defender' | 'intelligence'

/** 캐릭터 스탯 */
export interface CharacterStats {
  mov: 1 | 2    // 이동력: 1=1D6(균등), 2=2D4(삼각분포)
  atk: number   // 공격 주사위 개수 (D6 기준)
  def: number   // 방어 주사위 개수 (D6 기준)
  int: number   // 지력 고정 보너스 (주사위 없음)
  hp:  number   // 체력
}

/** 어빌리티 효과 타입 */
export type AbilityEffectType =
  | 'ATK_FIX'    // 공격값 고정 (Destroy: 24)
  | 'DEF_FIX'    // 방어값 고정 (Block: 24)
  | 'ATK_BONUS'  // 공격 보너스 가산
  | 'DEF_BONUS'  // 방어 보너스 가산
  | 'TELEPORT'   // 지정 타일로 순간이동
  | 'INT_BONUS'  // 지력 보너스 일시 증가
  | 'MOV_BONUS'  // 이동력 보너스
  | 'SPECIAL'    // 캐릭터 전용 특수 효과

/** 어빌리티 정의 */
export interface Ability {
  id:         string
  name:       string
  attribute:  CharacterAttribute
  effectType: AbilityEffectType
  value:      number   // 고정값 또는 보너스 수치
  duration:   number   // 지속 턴 수
}

/** 캐릭터 (마스터 데이터) */
export interface Character {
  id:        string
  name:      string
  class:     ChessClass
  grade:     CharacterGrade
  attribute: CharacterAttribute
  stats:     CharacterStats
  abilities: Ability[]
  imageUrl:  string
}

/** 파티 구성 (3슬롯) */
export interface Party {
  attacker:     Character
  defender:     Character
  intelligence: Character
}

/** 아이템 효과 타입 */
export type ItemEffectType =
  | 'MOVE_FREE'       // 날개: 주사위 없이 자유 이동
  | 'MOVE_BONUS'      // 여신의 신발: 이동력 보너스
  | 'BATTLE_NULLIFY'  // 오리발: 전투 무효화
  | 'SWAP_VALUES'     // 체인지: 공격/방어 값 교환
  | 'MUTUAL_GENESIS'  // 자폭: 양측 태초 귀환
  | 'COPY_DICE'       // 발키리의 창: 상대 주사위 절반 복사
  | 'STAT_HALVE'      // 아마겟돈: 상대 스탯 절반
  | 'DICE_DESTROY'    // 홀수/짝수 저주: 조건부 주사위 파괴

/** 아이템 사용 타이밍 */
export type ItemUseTiming = 'before_roll' | 'during_battle' | 'anytime'

/** 아이템 카드 */
export interface Item {
  id:         string
  name:       string
  effectType: ItemEffectType
  value:      number | null  // 효과 수치 (없으면 null)
  useTiming:  ItemUseTiming
}

/** 플레이어 인게임 상태 */
export interface Player {
  id:            string
  userId:        string
  nickname:      string
  party:         Party
  position:      number        // 보드 타일 인덱스 (0 = 시작)
  ag:            number        // 어빌리티 게이지 0~100
  items:         Item[]        // 보유 아이템 최대 5장
  activeAbility: ActiveAbility | null
  isConnected:   boolean
}

/** 활성화된 어빌리티 (지속 턴 관리) */
export interface ActiveAbility {
  ability:          Ability
  remainingDuration: number   // 남은 지속 턴
}

/** 게임 페이즈 */
export type GamePhase =
  | 'waiting'    // 게임 시작 대기
  | 'rolling'    // 주사위 굴리기
  | 'moving'     // 이동 중
  | 'battle'     // 전투 중
  | 'skill'      // 스킬 사용
  | 'itemUse'    // 아이템 사용
  | 'result'     // 결과 처리
  | 'finished'   // 게임 종료

/** 타일 타입 */
export type TileType =
  | 'normal'         // 일반 타일
  | 'warp_green'     // 워프 (초록)
  | 'warp_yellow'    // 워프 (노랑)
  | 'warp_blue'      // 워프 (파랑)
  | 'doa'            // 즉사 타일 (Defeated on Arrival)
  | 'ability_charge' // 어빌리티 게이지 충전 타일
  | 'blessing'       // 축복 타일
  | 'curse'          // 저주 타일
  | 'goal'           // 골 타일 (50번째)

/** 타일 정의 */
export interface Tile {
  index:      number
  type:       TileType
  warpTarget: number | null  // 워프 목적지 인덱스 (워프 타일만)
}

/** 보드 상태 */
export interface BoardState {
  tiles:      Tile[]
  totalTiles: number
}

/** 게임 전체 상태 */
export interface GameState {
  roomId:      string
  mode:        '1v1' | '2v2'
  players:     Player[]
  currentTurn: string        // 현재 턴 playerId
  turnNumber:  number
  phase:       GamePhase
  boardState:  BoardState
  winner:      string | null
  startedAt:   number        // Unix timestamp (ms)
}

/** 전투 결과 */
export interface BattleResult {
  attackerId:      string
  defenderId:      string
  atkRolls:        number[]   // 공격 주사위 결과 배열
  defRolls:        number[]   // 방어 주사위 결과 배열
  atkTotal:        number     // 합산 + INT 보너스
  defTotal:        number     // 합산 + INT 보너스
  diff:            number     // |atkTotal - defTotal|
  winner:          'attacker' | 'defender' | 'draw'
  isGenesisReturn: boolean    // diff >= 7 → 태초 귀환
  loserNewPos:     number     // 패배자 이동 후 위치
}

/** 타일 이벤트 결과 */
export interface TileEvent {
  type:     TileType
  playerId: string
  data:     {
    warpTarget?: number   // 워프 목적지
    agChange?:   number   // AG 변화량
    message?:    string   // 이벤트 설명
  }
}

/** 이동 결과 */
export interface MoveResult {
  player:     Player
  path:       number[]    // 이동 경로 타일 인덱스 배열
  tileEvent:  TileEvent | null
}

/** 덱 편성 (API / 소켓 페이로드용) */
export interface Deck {
  attackerId:     string   // character UUID
  defenderId:     string
  intelligenceId: string
}

// ========== 소켓 이벤트 페이로드 타입 ==========

export interface RoomCreatePayload {
  mode:   '1v1' | '2v2'
  userId: string
}

export interface RoomJoinPayload {
  roomId: string
  userId: string
  deck:   Deck
}

export interface RoomMatchmakingPayload {
  mode:   '1v1' | '2v2'
  userId: string
  deck:   Deck
}

export interface GameUseItemPayload {
  roomId:    string
  itemId:    string
  targetId?: string
}

export interface GameUseAbilityPayload {
  roomId:    string
  abilityId: string
}

export interface GameBattleItemPayload {
  roomId: string
  itemId: string
}

// ========== 로비 타입 ==========

/** 로비에 표시되는 공개 방 정보 (password 제외) */
export interface LobbyRoom {
  id:           string
  title:        string
  mode:         '1v1' | '2v2'
  playerCount:  number
  maxPlayers:   2 | 4
  isPrivate:    boolean
  hostNickname: string
  createdAt:    number    // Unix timestamp (ms)
}

/** 로비 방 목록 요청 */
export interface LobbyGetRoomsPayload {
  mode?: '1v1' | '2v2'
}

/** 로비 실시간 구독 */
export interface LobbySubscribePayload {}

// ========== 확장된 소켓 페이로드 ==========

// RoomCreatePayload — title/isPrivate/password 추가
export interface RoomCreateExtPayload {
  mode:       '1v1' | '2v2'
  userId:     string
  title?:     string    // 방 제목 (기본값: '{닉네임}의 방')
  isPrivate?: boolean   // 비공개 방 여부 (기본값: false)
  password?:  string    // 비공개 방 비밀번호
}

// RoomJoinPayload — password 추가
export interface RoomJoinExtPayload {
  roomId:    string
  userId:    string
  deck:      Deck
  password?: string    // 비공개 방 입장 시 필요
}
