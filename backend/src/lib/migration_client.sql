-- ============================================================
-- FateDice — 클라이언트 기능 추가 마이그레이션 (migration_client.sql)
-- 실행 방법: Supabase Dashboard > SQL Editor에 붙여넣고 Run
-- 전제 조건: schema.sql (기본 테이블)이 먼저 실행되어 있어야 함
-- ============================================================

-- ============================================================
-- 1. point_transactions — GP 거래 이력
--    amount 양수=획득, 음수=소비
-- ============================================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        INTEGER     NOT NULL,
  balance_after INTEGER     NOT NULL,
  source        TEXT        NOT NULL,  -- match_reward | daily_bonus | gacha_spend | item_purchase | admin
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. cash_transactions — CP 거래 이력
--    amount 양수=충전, 음수=소비
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_transactions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        INTEGER     NOT NULL,
  balance_after INTEGER     NOT NULL,
  source        TEXT        NOT NULL,  -- purchase | gacha_spend | premium_purchase | admin
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. daily_rewards — 일일 출석 보너스 수령 이력
--    PRIMARY KEY (user_id, reward_date) → 하루 1회 보장
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_rewards (
  user_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_date DATE    NOT NULL DEFAULT CURRENT_DATE,
  amount      INTEGER NOT NULL DEFAULT 200,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reward_date)
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pt_select_own" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pt_insert_service" ON point_transactions
  FOR INSERT WITH CHECK (true);  -- service role key 사용 시 RLS 우회

ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ct_select_own" ON cash_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ct_insert_service" ON cash_transactions
  FOR INSERT WITH CHECK (true);

ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dr_select_own" ON daily_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dr_insert_service" ON daily_rewards
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pt_user_created
  ON point_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ct_user_created
  ON cash_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dr_user_date
  ON daily_rewards(user_id, reward_date DESC);

-- ============================================================
-- Postgres Functions (RPC) — 원자적 포인트/캐시 처리
-- SECURITY DEFINER: service role 권한으로 실행
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- claim_daily_reward(p_user_id)
-- 하루 1회 출석 보너스 수령 (+200 GP)
-- 반환: success, new_gp, message
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, new_gp INTEGER, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rows   INTEGER;
  v_new_gp INTEGER;
BEGIN
  INSERT INTO daily_rewards (user_id, reward_date, amount)
  VALUES (p_user_id, CURRENT_DATE, 200)
  ON CONFLICT (user_id, reward_date) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN QUERY SELECT FALSE, 0, '오늘 이미 출석 보너스를 수령했습니다.';
    RETURN;
  END IF;

  UPDATE users SET gp = gp + 200
  WHERE id = p_user_id
  RETURNING gp INTO v_new_gp;

  INSERT INTO point_transactions (user_id, amount, balance_after, source, description)
  VALUES (p_user_id, 200, v_new_gp, 'daily_bonus', '일일 출석 보너스');

  RETURN QUERY SELECT TRUE, v_new_gp, '200 GP 수령 완료!';
END;
$$;

-- ────────────────────────────────────────────────────────────
-- add_match_reward(p_user_id, p_amount, p_match_id)
-- 게임 종료 후 서버에서 호출하여 GP 지급
-- 반환: 새 GP 잔액
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_match_reward(
  p_user_id UUID,
  p_amount  INTEGER,
  p_match_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_gp INTEGER;
BEGIN
  UPDATE users SET gp = gp + p_amount
  WHERE id = p_user_id
  RETURNING gp INTO v_new_gp;

  INSERT INTO point_transactions (user_id, amount, balance_after, source, description)
  VALUES (p_user_id, p_amount, v_new_gp, 'match_reward',
          '게임 보상 (매치 ID: ' || p_match_id || ')');

  RETURN v_new_gp;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- spend_points(p_user_id, p_amount, p_source, p_description)
-- GP 소비 (가챠, 아이템 구매 등)
-- 반환: success, new_gp, message
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION spend_points(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_source     TEXT,
  p_description TEXT
)
RETURNS TABLE(success BOOLEAN, new_gp INTEGER, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_gp INTEGER;
  v_new_gp     INTEGER;
BEGIN
  SELECT gp INTO v_current_gp FROM users WHERE id = p_user_id FOR UPDATE;

  IF v_current_gp < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_gp, 'GP가 부족합니다.';
    RETURN;
  END IF;

  UPDATE users SET gp = gp - p_amount
  WHERE id = p_user_id
  RETURNING gp INTO v_new_gp;

  INSERT INTO point_transactions (user_id, amount, balance_after, source, description)
  VALUES (p_user_id, -p_amount, v_new_gp, p_source, p_description);

  RETURN QUERY SELECT TRUE, v_new_gp, '소비 완료';
END;
$$;

-- ────────────────────────────────────────────────────────────
-- spend_cash(p_user_id, p_amount, p_source, p_description)
-- CP 소비 (프리미엄 가챠, 상점 구매 등)
-- 반환: success, new_cp, message
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION spend_cash(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_source     TEXT,
  p_description TEXT
)
RETURNS TABLE(success BOOLEAN, new_cp INTEGER, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_cp INTEGER;
  v_new_cp     INTEGER;
BEGIN
  SELECT cp INTO v_current_cp FROM users WHERE id = p_user_id FOR UPDATE;

  IF v_current_cp < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_cp, 'CP가 부족합니다.';
    RETURN;
  END IF;

  UPDATE users SET cp = cp - p_amount
  WHERE id = p_user_id
  RETURNING cp INTO v_new_cp;

  INSERT INTO cash_transactions (user_id, amount, balance_after, source, description)
  VALUES (p_user_id, -p_amount, v_new_cp, p_source, p_description);

  RETURN QUERY SELECT TRUE, v_new_cp, '소비 완료';
END;
$$;

-- ────────────────────────────────────────────────────────────
-- add_cash(p_user_id, p_amount, p_source, p_description)
-- CP 충전 (결제 완료 후 결제 서버에서 호출)
-- 반환: 새 CP 잔액
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_cash(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_source     TEXT,
  p_description TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_cp INTEGER;
BEGIN
  UPDATE users SET cp = cp + p_amount
  WHERE id = p_user_id
  RETURNING cp INTO v_new_cp;

  INSERT INTO cash_transactions (user_id, amount, balance_after, source, description)
  VALUES (p_user_id, p_amount, v_new_cp, p_source, p_description);

  RETURN v_new_cp;
END;
$$;
