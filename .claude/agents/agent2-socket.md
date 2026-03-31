# Agent2 — 실시간 소켓 서버

> **담당 폴더:** `/backend/socket/`
> **시작 조건:** Agent1 `types.ts` 완료 후 시작
> **완료 기준:** EVENTS.md 작성 완료 + 두 브라우저 탭에서 1v1 매칭 → 게임 시작 흐름 성공

---

## 역할
Socket.io 기반 실시간 멀티플레이어 통신 서버를 구축한다.
게임 로직은 **절대 직접 계산하지 않고** Agent1 함수를 import해서 사용한다.

---

## 작업 목록 (반드시 이 순서대로)

### Step 1. EVENTS.md ← 가장 먼저 작성 (Agent4가 참조)
아래 이벤트 명세를 `/backend/socket/EVENTS.md`에 문서화한다.

#### 클라이언트 → 서버 (emit)
| 이벤트명 | payload | 설명 |
|---------|---------|------|
| `room:create` | `{ mode: '1v1'\|'2v2', userId }` | 게임 방 생성 |
| `room:join` | `{ roomId, userId, deck }` | 기존 방 입장 |
| `room:matchmaking` | `{ mode, userId, deck }` | 자동 매칭 큐 등록 |
| `room:leave` | `{ roomId }` | 방 나가기 |
| `game:ready` | `{ roomId }` | 게임 준비 완료 |
| `game:rollDice` | `{ roomId }` | 이동 주사위 굴리기 |
| `game:useItem` | `{ roomId, itemId, targetId? }` | 아이템 사용 |
| `game:useAbility` | `{ roomId, abilityId }` | 어빌리티 발동 |
| `game:battleItem` | `{ roomId, itemId }` | 전투 중 아이템 |
| `game:endTurn` | `{ roomId }` | 턴 종료 |

#### 서버 → 클라이언트 (on)
| 이벤트명 | payload | 설명 |
|---------|---------|------|
| `room:created` | `{ roomId, mode }` | 방 생성 완료 |
| `room:joined` | `{ roomId, players[] }` | 입장 완료 |
| `room:matched` | `{ roomId, opponent }` | 자동 매칭 성공 |
| `room:full` | `{ roomId }` | 방 정원 초과 |
| `game:started` | `{ gameState: GameState }` | 게임 시작 |
| `game:diceResult` | `{ playerId, rolls, total, newPos }` | 이동 주사위 결과 |
| `game:tileEvent` | `{ playerId, tileType, effect }` | 타일 이벤트 |
| `game:battleStart` | `{ attackerId, defenderId }` | 전투 시작 |
| `game:battleResult` | `{ BattleResult }` | 전투 결과 |
| `game:abilityUsed` | `{ playerId, ability, effect }` | 어빌리티 발동 |
| `game:itemUsed` | `{ playerId, item, effect }` | 아이템 사용 |
| `game:stateUpdate` | `{ gameState: GameState }` | 전체 상태 동기화 |
| `game:turnChanged` | `{ currentTurn, turnNumber }` | 다음 턴 알림 |
| `game:over` | `{ winner, finalState }` | 게임 종료 |
| `game:playerDisconnected` | `{ playerId, timeout: 30 }` | 접속 끊김 |
| `error:game` | `{ code, message }` | 게임 오류 |

---

### Step 2. index.ts — Socket.io 서버 초기화
```typescript
import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] }
})

// health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

httpServer.listen(process.env.PORT || 4000)
```

---

### Step 3. roomManager.ts — 룸 생성/관리

```typescript
interface Room {
  id:         string
  mode:       '1v1' | '2v2'
  players:    Player[]
  maxPlayers: 2 | 4
  gameState:  GameState | null
  status:     'waiting' | 'playing' | 'finished'
  createdAt:  number
}

// 서버 메모리 관리 (Redis는 v2에서)
const rooms = new Map<string, Room>()
const matchmakingQueue = new Map<'1v1' | '2v2', Player[]>()

export function createRoom(mode: '1v1' | '2v2'): Room
export function joinRoom(roomId: string, player: Player): Room
export function leaveRoom(roomId: string, playerId: string): void
export function matchmaking(player: Player, mode: '1v1' | '2v2'): Room | null
export function getRoomByPlayer(playerId: string): Room | null
```

---

### Step 4. events.ts — 이벤트 핸들러

각 소켓 이벤트에 대한 핸들러 구현.
게임 로직 호출 예시:
```typescript
import { executeBattle, rollMovement, movePlayer } from '../../shared/gameLogic'

socket.on('game:rollDice', ({ roomId }) => {
  const room = getRoomByPlayer(socket.id)
  const player = room.gameState.players.find(p => p.id === socket.id)

  // Agent1 함수 사용 (직접 계산 절대 금지)
  const steps = rollMovement(player.party.attacker.stats.mov)
  const { player: movedPlayer, path } = movePlayer(player, room.gameState.boardState, steps)

  // 상태 업데이트 후 브로드캐스트
  io.to(roomId).emit('game:diceResult', {
    playerId: socket.id, rolls: [steps], total: steps, newPos: movedPlayer.position
  })
})
```

---

### Step 5. gameSync.ts — 상태 동기화

```typescript
// 접속 끊김 처리
export function handleDisconnect(playerId: string): void
// → 30초 타이머 시작
// → 30초 내 재접속 없으면 몰수패 처리

// 턴 관리
export function nextTurn(room: Room): Room
export function broadcastState(io: Server, roomId: string, state: GameState): void
```

---

## 규칙
- **게임 로직 직접 계산 절대 금지**
  ```typescript
  // ❌ 금지
  const result = Math.floor(Math.random() * 6) + 1

  // ✅ 허용
  import { rollDice } from '../../shared/gameLogic/dice'
  const result = rollDice(1, 6)[0]
  ```
- **이벤트명은 EVENTS.md와 100% 일치** (대소문자, 콜론 포함)
- **완료 시 EVENTS.md Agent4에게 공지**
