# Agent4 — 프론트엔드 UI

> **담당 폴더:** `/frontend/`
> **시작 조건:** Agent2 `EVENTS.md` 완료 + Agent5 인증 API 완료 후 시작
> **완료 기준:** 로비→매칭→게임→결과 전체 플로우 + 주사위/전투 애니메이션 동작

---

## 역할
FateDice의 전체 게임 화면을 구현한다.
게임 로직을 **절대 직접 계산하지 않고**, 소켓 이벤트를 받아서 화면만 그린다.

---

## 작업 목록 (반드시 이 순서대로)

### Step 1. store/gameStore.ts — Zustand 상태 관리

```typescript
import { create } from 'zustand'
import type { GameState, Player, Item } from '../../../shared/gameLogic/types'

interface GameStore {
  // 상태
  gameState:       GameState | null
  myPlayerId:      string | null
  socketConnected: boolean
  isMyTurn:        boolean

  // 액션
  setGameState:    (state: GameState) => void
  updatePlayer:    (player: Player) => void
  setConnected:    (v: boolean) => void
  reset:           () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  myPlayerId: null,
  socketConnected: false,
  isMyTurn: false,
  setGameState: (gameState) => set({ gameState }),
  updatePlayer: (player) => set((s) => ({
    gameState: s.gameState ? {
      ...s.gameState,
      players: s.gameState.players.map(p => p.id === player.id ? player : p)
    } : null
  })),
  setConnected: (socketConnected) => set({ socketConnected }),
  reset: () => set({ gameState: null, myPlayerId: null })
}))
```

---

### Step 2. hooks/useSocket.ts — 소켓 연결 훅

```typescript
// ★ 반드시 /backend/socket/EVENTS.md 기준으로 이벤트명 사용
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  // 연결
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL)

  // 수신 이벤트 (EVENTS.md 참조)
  socket.on('game:started', (data) => { /* gameStore.setGameState */ })
  socket.on('game:diceResult', (data) => { /* 주사위 애니메이션 트리거 */ })
  socket.on('game:battleResult', (data) => { /* 전투 결과 애니메이션 */ })
  socket.on('game:stateUpdate', (data) => { /* 전체 상태 동기화 */ })
  socket.on('game:over', (data) => { /* 결과 화면 전환 */ })

  // 송신 함수 반환
  return {
    rollDice:    (roomId: string) => socket.emit('game:rollDice', { roomId }),
    useItem:     (roomId: string, itemId: string) => socket.emit('game:useItem', { roomId, itemId }),
    useAbility:  (roomId: string, abilityId: string) => socket.emit('game:useAbility', { roomId, abilityId }),
    endTurn:     (roomId: string) => socket.emit('game:endTurn', { roomId }),
  }
}
```

---

### Step 3. 페이지 구조 (app/ 7개)

```
app/
├── page.tsx                    ← 메인 (로그인/홈)
├── lobby/
│   └── page.tsx                ← 로비 (매칭 대기)
├── collection/
│   └── page.tsx                ← 캐릭터 컬렉션
├── deck/
│   └── page.tsx                ← 덱 편성
├── gacha/
│   └── page.tsx                ← 뽑기 화면
├── game/
│   └── [roomId]/
│       └── page.tsx            ← 게임 보드 (핵심)
└── ranking/
    └── page.tsx                ← 랭킹
```

---

### Step 4. components/game/GameBoard.tsx — Phaser.js 보드판

```typescript
// Canvas(Phaser.js)와 React UI 레이어 분리
//
// Canvas 레이어 (Phaser.js 담당):
//   - 보드판 타일 렌더링
//   - 플레이어 말(sprite) 위치
//   - 주사위 굴리기 애니메이션
//   - 전투 이펙트 (태초 귀환 특수 연출)
//   - 타일 이벤트 이펙트
//
// React 레이어 (DOM 담당):
//   - 인벤토리 (아이템 카드)
//   - 캐릭터 스탯창
//   - AG 게이지 바
//   - 어빌리티 버튼
//   - 채팅창

import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  // 소켓 이벤트 수신 후 Phaser 씬에서 애니메이션 실행
  // ★ 게임 로직 계산 절대 금지
  // ★ 소켓에서 받은 결과만 시각화
}
```

---

### Step 5. 핵심 컴포넌트 목록

```
components/
├── game/
│   ├── GameBoard.tsx           ← Phaser.js 보드판 (핵심)
│   ├── DiceRoller.tsx          ← 주사위 굴리기 UI + 애니메이션
│   ├── BattleScreen.tsx        ← 전투 연출 (태초 귀환 이펙트 포함)
│   ├── CharacterCard.tsx       ← 캐릭터 카드 (공격/방어/지력 슬롯)
│   ├── AbilityBar.tsx          ← AG 게이지 + 어빌리티 버튼
│   ├── ItemHand.tsx            ← 보유 아이템 카드 패 (최대 5장)
│   └── TurnIndicator.tsx       ← 현재 턴 표시
├── lobby/
│   ├── MatchMaking.tsx         ← 매칭 대기 (스피너 + 상대 찾는 중)
│   └── RoomList.tsx            ← 방 목록
├── collection/
│   ├── CardGrid.tsx            ← 캐릭터 카드 그리드
│   └── GachaAnimation.tsx      ← 뽑기 연출 (카드 뒤집기 효과)
└── common/
    ├── Header.tsx
    └── Loading.tsx
```

---

### Step 6. 태초 귀환 특수 연출 (중요)
```typescript
// game:battleResult 이벤트 수신 시
socket.on('game:battleResult', (data) => {
  if (data.isGenesisReturn) {
    // ★ 특수 연출 필수
    // 1. 화면 전체 빨간 플래시
    // 2. 패배자 말이 시작 지점으로 날아가는 애니메이션
    // 3. "태초로 귀환!" 텍스트 이펙트
    playGenesisReturnEffect(data.defenderId)
  }
})
```

---

## 규칙
- **게임 로직 직접 계산 절대 금지**
- **이벤트명은 /backend/socket/EVENTS.md 와 100% 일치** (한 글자도 틀리면 안 됨)
- **타입 import:** `import type { GameState, Player } from '../../../shared/gameLogic/types'`
- **Phaser.js Canvas와 React UI는 레이어 분리 유지**
- **API 호출:** `process.env.NEXT_PUBLIC_API_URL` 사용
