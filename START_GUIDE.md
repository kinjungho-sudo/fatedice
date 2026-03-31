# 🎲 FateDice — Claude Code 시작 가이드

## 시작 전 준비사항

### 1. 프로젝트 초기화
```bash
# 이 폴더를 Mac으로 복사 후 실행
cd fatedice-claude-code

# 프론트엔드 초기화
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
cd ..

# 백엔드 초기화
cd backend
npm init -y
npm install express socket.io cors dotenv @supabase/supabase-js
npm install -D typescript @types/node @types/express ts-node nodemon
cd ..

# 공유 로직 초기화
cd shared
npm init -y
npm install -D typescript jest ts-jest @types/jest
cd ..
```

### 2. Supabase 프로젝트 생성
- https://supabase.com 접속
- 새 프로젝트 생성: `fatedice-game`
- URL, anon key, service key 복사
- `/backend/.env` 파일 생성 후 붙여넣기

---

## 터미널 5개 시작 방법

### 🔴 1단계 — 동시 시작 (Terminal 1, 2)

**Terminal 1 — Agent1 (게임 로직)**
```bash
cd fatedice-claude-code
claude
```
Claude Code 켜지면 입력:
```
CLAUDE.md와 .claude/agents/agent1-gamelogic.md를 읽고
/shared/gameLogic/ 폴더에 게임 로직을 구현해줘.
types.ts부터 시작하고, 완성되면 알려줘.
```

**Terminal 2 — Agent5 (DB)**
```bash
cd fatedice-claude-code
claude
```
Claude Code 켜지면 입력:
```
CLAUDE.md와 .claude/agents/agent5-db.md를 읽고
supabaseClient.ts와 schema.sql을 먼저 작성해줘.
완성되면 Agent3 시작할 수 있다고 알려줘.
```

---

### 🟡 2단계 — Agent1 완료 후 (Terminal 3, 4)

**Terminal 3 — Agent2 (소켓 서버)**
```bash
cd fatedice-claude-code
claude
```
```
CLAUDE.md와 .claude/agents/agent2-socket.md를 읽고
EVENTS.md부터 작성한 다음 Socket.io 서버를 구축해줘.
/shared/gameLogic/이 완성되어 있으니 import해서 사용해.
```

**Terminal 4 — Agent3 (캐릭터/뽑기)**
```bash
cd fatedice-claude-code
claude
```
```
CLAUDE.md와 .claude/agents/agent3-character.md를 읽고
캐릭터 12종 data.ts부터 정의해줘.
shared/gameLogic/types.ts와 backend/lib/supabaseClient.ts를 사용해.
```

---

### 🟢 3단계 — Agent2 완료 후 (Terminal 5)

**Terminal 5 — Agent4 (프론트엔드)**
```bash
cd fatedice-claude-code
claude
```
```
CLAUDE.md와 .claude/agents/agent4-frontend.md를 읽고
프론트엔드를 구현해줘.
/backend/socket/EVENTS.md를 반드시 참조해서 소켓 이벤트를 연결해줘.
gameStore → useSocket → GameBoard 순서로 만들어줘.
```

---

## 진행 상황 체크리스트

### ✅ Agent1 완료 기준
- [ ] /shared/gameLogic/types.ts — export 확인
- [ ] /shared/gameLogic/dice.ts — rollMovement(1|2) 테스트 통과
- [ ] /shared/gameLogic/battle.ts — diff>=7 태초 판정 테스트 통과
- [ ] /shared/gameLogic/skills.ts — AG 충전/발동 테스트 통과
- [ ] /shared/gameLogic/board.ts — isGoal, checkCollision 테스트 통과
- [ ] /shared/gameLogic/items.ts — 아이템 효과 처리 완료
- [ ] /shared/gameLogic/README.md — 함수 명세 작성

### ✅ Agent5 완료 기준
- [ ] /backend/lib/supabaseClient.ts — export 확인
- [ ] /backend/lib/DB_SCHEMA.md — 테이블 문서화
- [ ] schema.sql 실행 완료 (Supabase Dashboard SQL Editor)
- [ ] RLS 정책 전체 테이블 적용
- [ ] /backend/api/auth/ 회원가입/로그인 테스트 통과

### ✅ Agent2 완료 기준
- [ ] /backend/socket/EVENTS.md — 전체 이벤트 명세
- [ ] 소켓 서버 포트 4000 실행
- [ ] 두 탭: room:create → room:join → game:ready → game:started 흐름 확인

### ✅ Agent3 완료 기준
- [ ] 캐릭터 12종 data.ts 완성
- [ ] 뽑기 1000회 시뮬레이션 확률 검증
- [ ] POST /api/characters/gacha 동작
- [ ] POST /api/deck 덱 저장 + 유효성 검사

### ✅ Agent4 완료 기준
- [ ] 7개 페이지 라우팅 동작
- [ ] Phaser.js 보드판 렌더링
- [ ] 주사위 굴리기 애니메이션
- [ ] 전투 결과 + 태초 귀환 이펙트
- [ ] 소켓 game:started → 게임 화면 전환

---

## 절대 규칙 (모든 Agent 공통)
1. 자신의 담당 폴더 외 코드 수정 금지
2. 타입은 /shared/gameLogic/types.ts 에서만 import
3. 게임 로직 직접 계산 금지 (Agent1 함수 사용)
4. 소켓 이벤트명은 EVENTS.md와 100% 일치
5. .env 파일 절대 git commit 금지
