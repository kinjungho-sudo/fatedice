# FateDice DB 스키마 (DB_SCHEMA.md)

> ★ Agent5가 작성, Agent3이 쿼리 작성 시 참조

---

## 테이블 목록

| 테이블명 | 역할 |
|---------|------|
| users | 유저 계정 및 재화 (GP, CP, Shard) |
| characters | 캐릭터 마스터 데이터 (읽기 전용) |
| user_characters | 유저 보유 캐릭터 |
| decks | 현재 덱 편성 (1인 1덱) |
| matches | 게임 전적 기록 |
| rankings | ELO 레이팅 기반 랭킹 |
| gacha_logs | 뽑기 이력 + 천장 카운터 |

---

## supabaseClient 사용법

```typescript
import { supabase } from '../lib/supabaseClient'

// 조회
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// 삽입
const { data, error } = await supabase
  .from('user_characters')
  .insert({ user_id: userId, character_id: charId })

// 업데이트
const { data, error } = await supabase
  .from('users')
  .update({ gp: newGP })
  .eq('id', userId)
```

---

## 테이블 상세 스키마 (Agent5 구현 완료)

### users
```
id: UUID (PK)
email: TEXT UNIQUE
nickname: TEXT UNIQUE
gp: INTEGER (default 1000)
cp: INTEGER (default 0)
shard: INTEGER (default 0)
created_at: TIMESTAMPTZ
```

### characters
```
id: UUID (PK)
name: TEXT
class: TEXT (King|Queen|Rook|Bishop|Knight|Pawn)
grade: TEXT (Normal|Rare|Epic|Legendary)
attribute: TEXT (Sword|Wand|Disk|Cup)
stats: JSONB { mov, atk, def, int, hp }
abilities: JSONB []
image_url: TEXT
```

### gacha_logs
```
id: UUID (PK)
user_id: UUID (FK → users)
character_id: UUID (FK → characters)
grade: TEXT
cost_type: TEXT (GP|CP)
pity_count: INTEGER  ← 천장 카운터
pulled_at: TIMESTAMPTZ
```
