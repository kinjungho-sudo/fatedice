-- ============================================================
-- FateDice — 캐릭터 마스터 데이터 시드 (12종)
-- 실행 방법: Supabase Dashboard > SQL Editor에 붙여넣고 Run
-- ★ schema.sql 실행 후 실행해야 합니다.
-- ============================================================

INSERT INTO characters (id, name, class, grade, attribute, stats, abilities, image_url)
VALUES

-- ── Normal 등급 (4종) ──────────────────────────────────────────────

(
  'n_leon', '레온', 'Knight', 'Normal', 'Sword',
  '{"mov": 2, "atk": 1, "def": 1, "int": 0, "hp": 100}',
  '[{"id":"n_leon_charge","name":"돌격","attribute":"Sword","effectType":"ATK_BONUS","value":2,"duration":1}]',
  '/assets/characters/n_leon'
),
(
  'n_aria', '아리아', 'Pawn', 'Normal', 'Disk',
  '{"mov": 1, "atk": 1, "def": 2, "int": 0, "hp": 110}',
  '[{"id":"n_aria_shield","name":"방패막이","attribute":"Disk","effectType":"DEF_BONUS","value":2,"duration":1}]',
  '/assets/characters/n_aria'
),
(
  'n_theo', '테오', 'Bishop', 'Normal', 'Wand',
  '{"mov": 2, "atk": 1, "def": 1, "int": 2, "hp": 90}',
  '[{"id":"n_theo_focus","name":"마력 집중","attribute":"Wand","effectType":"INT_BONUS","value":3,"duration":2}]',
  '/assets/characters/n_theo'
),
(
  'n_luna', '루나', 'Rook', 'Normal', 'Cup',
  '{"mov": 1, "atk": 1, "def": 2, "int": 1, "hp": 105}',
  '[{"id":"n_luna_heal","name":"치유의 빛","attribute":"Cup","effectType":"DEF_BONUS","value":1,"duration":2}]',
  '/assets/characters/n_luna'
),

-- ── Rare 등급 (4종) ──────────────────────────────────────────────

(
  'r_seraphina', '세라피나', 'Queen', 'Rare', 'Sword',
  '{"mov": 1, "atk": 2, "def": 1, "int": 1, "hp": 95}',
  '[{"id":"r_seraphina_dual","name":"쌍검 난무","attribute":"Sword","effectType":"ATK_BONUS","value":3,"duration":1},{"id":"r_seraphina_swift","name":"신속","attribute":"Sword","effectType":"MOV_BONUS","value":2,"duration":1}]',
  '/assets/characters/r_seraphina'
),
(
  'r_gordan', '고르단', 'Rook', 'Rare', 'Disk',
  '{"mov": 1, "atk": 1, "def": 3, "int": 0, "hp": 130}',
  '[{"id":"r_gordan_fortress","name":"철벽 수호","attribute":"Disk","effectType":"DEF_BONUS","value":4,"duration":2},{"id":"r_gordan_taunt","name":"도발","attribute":"Disk","effectType":"DEF_BONUS","value":2,"duration":1}]',
  '/assets/characters/r_gordan'
),
(
  'r_mireia', '미레이아', 'Bishop', 'Rare', 'Wand',
  '{"mov": 2, "atk": 1, "def": 1, "int": 3, "hp": 85}',
  '[{"id":"r_mireia_arcane","name":"비전 폭발","attribute":"Wand","effectType":"INT_BONUS","value":5,"duration":1},{"id":"r_mireia_blink","name":"순간 이동","attribute":"Wand","effectType":"TELEPORT","value":10,"duration":1}]',
  '/assets/characters/r_mireia'
),
(
  'r_caspian', '카스피안', 'Knight', 'Rare', 'Cup',
  '{"mov": 2, "atk": 2, "def": 1, "int": 2, "hp": 100}',
  '[{"id":"r_caspian_bless","name":"신성 강복","attribute":"Cup","effectType":"ATK_BONUS","value":2,"duration":2},{"id":"r_caspian_spirit","name":"영혼 공명","attribute":"Cup","effectType":"INT_BONUS","value":3,"duration":1}]',
  '/assets/characters/r_caspian'
),

-- ── Epic 등급 (3종) ──────────────────────────────────────────────

(
  'e_vargoth', '바르고스', 'King', 'Epic', 'Sword',
  '{"mov": 2, "atk": 3, "def": 2, "int": 2, "hp": 120}',
  '[{"id":"e_vargoth_dark","name":"암흑 강림","attribute":"Sword","effectType":"ATK_BONUS","value":6,"duration":2},{"id":"e_vargoth_terror","name":"공포의 기사","attribute":"Sword","effectType":"DEF_BONUS","value":3,"duration":1},{"id":"e_vargoth_passive","name":"패시브: 암흑 군주","attribute":"Sword","effectType":"ATK_BONUS","value":1,"duration":999}]',
  '/assets/characters/e_vargoth'
),
(
  'e_celestia', '셀레스티아', 'Rook', 'Epic', 'Disk',
  '{"mov": 1, "atk": 2, "def": 4, "int": 1, "hp": 145}',
  '[{"id":"e_celestia_holy","name":"성벽 결계","attribute":"Disk","effectType":"DEF_BONUS","value":7,"duration":2},{"id":"e_celestia_repel","name":"신성 반격","attribute":"Disk","effectType":"ATK_BONUS","value":4,"duration":1},{"id":"e_celestia_passive","name":"패시브: 빛의 수호자","attribute":"Disk","effectType":"DEF_BONUS","value":1,"duration":999}]',
  '/assets/characters/e_celestia'
),
(
  'e_azalea', '아잘레아', 'Queen', 'Epic', 'Wand',
  '{"mov": 1, "atk": 2, "def": 1, "int": 5, "hp": 90}',
  '[{"id":"e_azalea_nova","name":"성운 폭발","attribute":"Wand","effectType":"INT_BONUS","value":8,"duration":1},{"id":"e_azalea_summon","name":"별의 소환","attribute":"Wand","effectType":"ATK_BONUS","value":5,"duration":2},{"id":"e_azalea_passive","name":"패시브: 마법왕의 혈통","attribute":"Wand","effectType":"INT_BONUS","value":2,"duration":999}]',
  '/assets/characters/e_azalea'
),

-- ── Legendary 등급 (1종) ─────────────────────────────────────────

(
  'l_genesis_king', '창세왕 크로노스', 'King', 'Legendary', 'Sword',
  '{"mov": 2, "atk": 4, "def": 4, "int": 4, "hp": 150}',
  '[{"id":"l_genesis_destroy","name":"창세 파멸 (Destroy)","attribute":"Sword","effectType":"ATK_FIX","value":24,"duration":2},{"id":"l_genesis_block","name":"창세 방벽 (Block)","attribute":"Disk","effectType":"DEF_FIX","value":24,"duration":2},{"id":"l_genesis_teleport","name":"시공 도약 (Teleport)","attribute":"Wand","effectType":"TELEPORT","value":15,"duration":1},{"id":"l_genesis_gs","name":"창세 강타 (Genesis Strike)","attribute":"Cup","effectType":"SPECIAL","value":30,"duration":1}]',
  '/assets/characters/l_genesis_king'
)

ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  class      = EXCLUDED.class,
  grade      = EXCLUDED.grade,
  attribute  = EXCLUDED.attribute,
  stats      = EXCLUDED.stats,
  abilities  = EXCLUDED.abilities,
  image_url  = EXCLUDED.image_url;
