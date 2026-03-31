# FateDice Socket.io 이벤트 명세 (EVENTS.md)

> ★ Agent2가 작성, Agent4가 반드시 이 파일 기준으로 구현
> ★ 이벤트명은 대소문자, 콜론 포함 100% 일치 필수

---

## 클라이언트 → 서버 (socket.emit)

### 로비 이벤트

| 이벤트명 | payload | 설명 |
|---------|---------|------|
| `lobby:subscribe` | `{}` | 로비 실시간 업데이트 구독 시작 |
| `lobby:unsubscribe` | `{}` | 로비 구독 해제 |
| `lobby:getRooms` | `{ mode?: '1v1'\|'2v2' }` | 현재 대기 방 목록 요청 |

### 방/게임 이벤트

| 이벤트명 | payload | 설명 |
|---------|---------|------|
| `room:create` | `{ mode: '1v1'\|'2v2', userId: string, title?: string, isPrivate?: boolean, password?: string }` | 게임 방 생성 |
| `room:join` | `{ roomId: string, userId: string, deck: Deck, password?: string }` | 기존 방 입장 |
| `room:matchmaking` | `{ mode: '1v1'\|'2v2', userId: string, deck: Deck }` | 자동 매칭 큐 |
| `room:leave` | `{ roomId: string }` | 방 나가기 |
| `game:ready` | `{ roomId: string }` | 게임 준비 완료 |
| `game:rollDice` | `{ roomId: string }` | 이동 주사위 굴리기 |
| `game:useItem` | `{ roomId: string, itemId: string, targetId?: string }` | 아이템 사용 |
| `game:useAbility` | `{ roomId: string, abilityId: string }` | 어빌리티 발동 |
| `game:battleItem` | `{ roomId: string, itemId: string }` | 전투 중 아이템 |
| `game:endTurn` | `{ roomId: string }` | 턴 종료 |

---

## 서버 → 클라이언트 (socket.on)

### 로비 이벤트 (lobby:subscribe 이후 수신)

| 이벤트명 | payload | 설명 |
|---------|---------|------|
| `lobby:rooms` | `{ rooms: LobbyRoom[] }` | 방 목록 응답 (lobby:getRooms 응답) |
| `lobby:roomCreated` | `{ room: LobbyRoom }` | 새 공개 방 생성 알림 |
| `lobby:roomUpdated` | `{ room: LobbyRoom }` | 방 인원 변경 알림 |
| `lobby:roomRemoved` | `{ roomId: string }` | 방 삭제 알림 (빈 방 정리) |

### 방/게임 이벤트

| 이벤트명 | payload | 설명 |
|---------|---------|------|
| `room:created` | `{ roomId: string, mode: string, title: string }` | 방 생성 완료 |
| `room:joined` | `{ roomId: string, players: Player[] }` | 입장 완료 |
| `room:matched` | `{ roomId: string, opponent: Player }` | 자동 매칭 성공 |
| `room:full` | `{ roomId: string }` | 방 정원 초과 |
| `game:started` | `{ gameState: GameState }` | 게임 시작 + 초기 상태 |
| `game:diceResult` | `{ playerId: string, rolls: number[], total: number, newPos: number }` | 이동 결과 |
| `game:tileEvent` | `{ playerId: string, tileType: TileType, effect: any }` | 타일 이벤트 |
| `game:battleStart` | `{ attackerId: string, defenderId: string }` | 전투 시작 |
| `game:battleResult` | `{ result: BattleResult }` | 전투 결과 |
| `game:abilityUsed` | `{ playerId: string, ability: Ability, effect: any }` | 어빌리티 발동 |
| `game:itemUsed` | `{ playerId: string, item: Item, effect: any }` | 아이템 사용 결과 |
| `game:stateUpdate` | `{ gameState: GameState }` | 전체 상태 동기화 |
| `game:turnChanged` | `{ currentTurn: string, turnNumber: number }` | 다음 턴 알림 |
| `game:over` | `{ winner: string, finalState: GameState }` | 게임 종료 |
| `game:playerDisconnected` | `{ playerId: string, timeout: 30 }` | 접속 끊김 (30초 대기) |
| `error:game` | `{ code: string, message: string }` | 게임 오류 |

---

## LobbyRoom 타입 (shared/gameLogic/types.ts 참조)

```typescript
interface LobbyRoom {
  id:           string
  title:        string
  mode:         '1v1' | '2v2'
  playerCount:  number
  maxPlayers:   2 | 4
  isPrivate:    boolean      // true이면 lobby에서 숨겨짐
  hostNickname: string
  createdAt:    number       // Unix timestamp (ms)
}
```

---

## 소켓 연결 handshake.auth 필수 필드

```typescript
// Socket.io 연결 시 auth 객체에 포함
{
  nickname: string  // 필수 — 미포함 시 연결 거부
  deck?: Deck       // 선택 — 게임 입장 전 설정 가능
  userId?: string   // 선택 — 인증된 유저 ID
}
```
