# Agent5 — DB / 인증 / 랭킹

> **담당 폴더:** `/backend/api/auth/` + `/backend/lib/`
> **시작 조건:** 즉시 시작 (1순위 — Agent3이 의존)
> **완료 기준:** supabaseClient.ts export + 회원가입/로그인 테스트 통과 + DB_SCHEMA.md 작성

---

## 역할
Supabase DB 스키마 설계, 공용 클라이언트, 인증 API, 랭킹 시스템을 구현한다.
**가장 먼저 완료해야** 다른 Agent들이 DB를 사용할 수 있다.

---

## 작업 목록 (반드시 이 순서대로)

### Step 1. supabaseClient.ts ← 최우선 (Agent3 의존)
```typescript
// /backend/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // ★ 백엔드 전용, 프론트 절대 노출 금지
)
```
완료 즉시 Agent3에게 위치 공지.

---

### Step 2. schema.sql — 전체 테이블 생성

```sql
-- 1. users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  nickname    TEXT UNIQUE NOT NULL,
  gp          INTEGER DEFAULT 1000,   -- 시작 골드
  cp          INTEGER DEFAULT 0,
  shard       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. characters (마스터 데이터 — 읽기 전용)
CREATE TABLE characters (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  class       TEXT NOT NULL,   -- King|Queen|Rook|Bishop|Knight|Pawn
  grade       TEXT NOT NULL,   -- Normal|Rare|Epic|Legendary
  attribute   TEXT NOT NULL,   -- Sword|Wand|Disk|Cup
  stats       JSONB NOT NULL,  -- { mov, atk, def, int, hp }
  abilities   JSONB NOT NULL,  -- Ability[]
  image_url   TEXT
);

-- 3. user_characters (보유 캐릭터)
CREATE TABLE user_characters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id),
  obtained_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_id)   -- 중복 소유 방지
);

-- 4. decks (덱 편성 — 1인 1덱)
CREATE TABLE decks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) UNIQUE,
  attacker_id      UUID REFERENCES characters(id),
  defender_id      UUID REFERENCES characters(id),
  intelligence_id  UUID REFERENCES characters(id),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. matches (전적)
CREATE TABLE matches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    TEXT NOT NULL,
  mode       TEXT NOT NULL,   -- 1v1|2v2
  winner_id  UUID REFERENCES users(id),
  players    JSONB NOT NULL,  -- 참가자 배열
  duration   INTEGER,         -- 게임 시간(초)
  played_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. rankings (ELO 레이팅)
CREATE TABLE rankings (
  user_id    UUID REFERENCES users(id) PRIMARY KEY,
  wins       INTEGER DEFAULT 0,
  losses     INTEGER DEFAULT 0,
  rating     INTEGER DEFAULT 1000,  -- ELO 시작값
  season     INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. gacha_logs (천장 시스템)
CREATE TABLE gacha_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id),
  character_id UUID REFERENCES characters(id),
  grade        TEXT NOT NULL,
  cost_type    TEXT NOT NULL,    -- GP | CP
  pity_count   INTEGER DEFAULT 0,
  pulled_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Step 3. RLS 정책 설정 (보안 필수)

```sql
-- users: 본인만 조회/수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON users
  USING (auth.uid() = id);

-- characters: 전체 공개 (읽기만)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters_read" ON characters
  FOR SELECT USING (true);

-- user_characters: 본인만
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_chars_own" ON user_characters
  USING (auth.uid() = user_id);

-- decks: 본인만
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decks_own" ON decks
  USING (auth.uid() = user_id);

-- matches, rankings: 전체 공개 (읽기만)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_read" ON matches FOR SELECT USING (true);

ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rankings_read" ON rankings FOR SELECT USING (true);
```

---

### Step 4. DB_SCHEMA.md — 스키마 문서화
`/backend/lib/DB_SCHEMA.md`에 테이블 목록과 관계 다이어그램 작성.
Agent3이 이 파일을 참조해서 쿼리 작성.

---

### Step 5. .env.example — 환경변수 템플릿

```env
# /backend/.env.example
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # ★ 절대 git 커밋 금지
SUPABASE_ANON_KEY=eyJ...
NODE_ENV=development
```

---

### Step 6. api/auth/routes.ts — 인증 API

```typescript
POST /api/auth/signup
// 회원가입 → users 테이블 생성 → GP 1000 초기 지급 → rankings 초기화

POST /api/auth/login
// Supabase Auth 로그인 → JWT 반환

POST /api/auth/logout

GET /api/auth/me
// 내 정보 (nickname, gp, cp, shard)
```

---

### Step 7. api/ranking/routes.ts — 랭킹 API

```typescript
GET /api/ranking
// 전체 랭킹 상위 100명 (rating 내림차순)

GET /api/ranking/me
// 내 현재 순위

POST /api/ranking/update   // 내부 전용 (소켓 서버에서 호출)
// 게임 결과 반영
// ELO 계산: newRating = rating + 32 * (actual - expected)
// actual: 승=1, 패=0
// expected: 1 / (1 + 10^((opponent_rating - my_rating) / 400))
```

---

## 규칙
- **SERVICE_KEY는 백엔드에서만 사용** — 프론트엔드 코드에 절대 노출 금지
- **스키마 변경 시 DB_SCHEMA.md 즉시 업데이트**
- **RLS 정책 없는 테이블 생성 금지**
- **완료 즉시 Agent3에게 supabaseClient.ts 위치 공지**
- **.env 파일 절대 git commit 금지** (.gitignore 확인)
