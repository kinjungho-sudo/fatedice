# 🎲 FateDice — 메인 CLAUDE.md (오케스트레이터)

## 프로젝트 한 줄 설명
주사위 + 캐릭터 카드 기반 실시간 1v1/2v2 대전 온라인 보드게임
레퍼런스: 창세기전 - 주사위의 잔영 (소프트맥스, 2001) 현대적 재해석

---

## 기술 스택 (확정)
| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 14 + TypeScript + Tailwind CSS |
| 게임 렌더링 | Phaser.js (Canvas 기반) |
| 실시간 통신 | Socket.io |
| 백엔드 | Node.js + Express + TypeScript |
| 상태 관리 | Zustand (클라이언트) |
| DB / Auth | Supabase (PostgreSQL + Auth) |
| 배포 | Vercel (프론트) + Railway (백엔드) |

---

## Agent 역할 분리 (절대 침범 금지)
| Agent | 터미널 | 담당 폴더 | 역할 |
|-------|--------|----------|------|
| Agent1 | Terminal 1 | /shared/gameLogic/ | 게임 로직 엔진 |
| Agent2 | Terminal 3 | /backend/socket/ | 실시간 소켓 서버 |
| Agent3 | Terminal 4 | /backend/api/characters/ | 캐릭터/뽑기/덱 |
| Agent4 | Terminal 5 | /frontend/ | UI/보드판/애니메이션 |
| Agent5 | Terminal 2 | /backend/api/auth/ + /backend/lib/ | DB/인증/랭킹 |

---

## 실행 순서 (의존성 기반)

### 1단계 — 동시 시작
```bash
# Terminal 1: Agent1
claude # → "CLAUDE.md와 .claude/agents/agent1-gamelogic.md 읽고 시작해줘"

# Terminal 2: Agent5
claude # → "CLAUDE.md와 .claude/agents/agent5-db.md 읽고 시작해줘"
```

### 2단계 — Agent1 완료 후
```bash
# Terminal 3: Agent2
claude # → "CLAUDE.md와 .claude/agents/agent2-socket.md 읽고 시작해줘"

# Terminal 4: Agent3
claude # → "CLAUDE.md와 .claude/agents/agent3-character.md 읽고 시작해줘"
```

### 3단계 — Agent2 완료 후
```bash
# Terminal 5: Agent4
claude # → "CLAUDE.md와 .claude/agents/agent4-frontend.md 읽고 시작해줘"
```

---

## 절대 규칙 (모든 Agent 공통)
1. **자신의 담당 폴더 외 코드 수정 금지**
2. **타입은 반드시 /shared/gameLogic/types.ts 에서만 import**
3. **게임 로직 직접 계산 금지** (Agent1 함수 import해서 사용)
4. **소켓 이벤트명은 /backend/socket/EVENTS.md 와 100% 일치**
5. **.env 파일 절대 git commit 금지**
6. **완료된 작업은 자신의 담당 README에 즉시 업데이트**

---

## 공유 파일 위치 (모든 Agent 참조)
- 타입 정의: `/shared/gameLogic/types.ts`
- DB 클라이언트: `/backend/lib/supabaseClient.ts`
- 소켓 이벤트 명세: `/backend/socket/EVENTS.md`
- DB 스키마 문서: `/backend/lib/DB_SCHEMA.md`

---

## 로컬 개발 실행
```bash
# 백엔드 (포트 4000)
cd backend && npm run dev

# 프론트엔드 (포트 3000)
cd frontend && npm run dev
```
