/**
 * data.ts — 캐릭터 12종 마스터 데이터
 *
 * 등급 구성: Normal 4종 / Rare 4종 / Epic 3종 / Legendary 1종
 * 체스 클래스: King / Queen / Rook / Bishop / Knight / Pawn
 * 어트리뷰트: Sword / Wand / Disk / Cup
 *
 * Design Director 확정 캐릭터 라인업 (2026-03-31)
 * imageUrl 규칙: /assets/characters/{id}/{type}.png
 *   type: portrait | card | sprite | battle
 */

import type { Character, CharacterGrade } from '../../../../shared/gameLogic/types'

// ── Normal 등급 (4종) ─────────────────────────────────────────────

const NORMAL_CHARACTERS: Character[] = [
  {
    id:        'n_leon',
    name:      '레온',
    class:     'Knight',
    grade:     'Normal',
    attribute: 'Sword',
    stats: { mov: 2, atk: 1, def: 1, int: 0, hp: 100 },
    abilities: [
      {
        id:         'n_leon_charge',
        name:       '돌격',
        attribute:  'Sword',
        effectType: 'ATK_BONUS',
        value:      2,
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/n_leon',
  },
  {
    id:        'n_aria',
    name:      '아리아',
    class:     'Pawn',
    grade:     'Normal',
    attribute: 'Disk',
    stats: { mov: 1, atk: 1, def: 2, int: 0, hp: 110 },
    abilities: [
      {
        id:         'n_aria_shield',
        name:       '방패막이',
        attribute:  'Disk',
        effectType: 'DEF_BONUS',
        value:      2,
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/n_aria',
  },
  {
    id:        'n_theo',
    name:      '테오',
    class:     'Bishop',
    grade:     'Normal',
    attribute: 'Wand',
    stats: { mov: 2, atk: 1, def: 1, int: 2, hp: 90 },
    abilities: [
      {
        id:         'n_theo_focus',
        name:       '마력 집중',
        attribute:  'Wand',
        effectType: 'INT_BONUS',
        value:      3,
        duration:   2,
      },
    ],
    imageUrl: '/assets/characters/n_theo',
  },
  {
    id:        'n_luna',
    name:      '루나',
    class:     'Rook',
    grade:     'Normal',
    attribute: 'Cup',
    stats: { mov: 1, atk: 1, def: 2, int: 1, hp: 105 },
    abilities: [
      {
        id:         'n_luna_heal',
        name:       '치유의 빛',
        attribute:  'Cup',
        effectType: 'DEF_BONUS',
        value:      1,
        duration:   2,
      },
    ],
    imageUrl: '/assets/characters/n_luna',
  },
]

// ── Rare 등급 (4종) ──────────────────────────────────────────────

const RARE_CHARACTERS: Character[] = [
  {
    id:        'r_seraphina',
    name:      '세라피나',
    class:     'Queen',
    grade:     'Rare',
    attribute: 'Sword',
    stats: { mov: 1, atk: 2, def: 1, int: 1, hp: 95 },
    abilities: [
      {
        id:         'r_seraphina_dual',
        name:       '쌍검 난무',
        attribute:  'Sword',
        effectType: 'ATK_BONUS',
        value:      3,
        duration:   1,
      },
      {
        id:         'r_seraphina_swift',
        name:       '신속',
        attribute:  'Sword',
        effectType: 'MOV_BONUS',
        value:      2,
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/r_seraphina',
  },
  {
    id:        'r_gordan',
    name:      '고르단',
    class:     'Rook',
    grade:     'Rare',
    attribute: 'Disk',
    stats: { mov: 1, atk: 1, def: 3, int: 0, hp: 130 },
    abilities: [
      {
        id:         'r_gordan_fortress',
        name:       '철벽 수호',
        attribute:  'Disk',
        effectType: 'DEF_BONUS',
        value:      4,
        duration:   2,
      },
      {
        id:         'r_gordan_taunt',
        name:       '도발',
        attribute:  'Disk',
        effectType: 'DEF_BONUS',
        value:      2,
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/r_gordan',
  },
  {
    id:        'r_mireia',
    name:      '미레이아',
    class:     'Bishop',
    grade:     'Rare',
    attribute: 'Wand',
    stats: { mov: 2, atk: 1, def: 1, int: 3, hp: 85 },
    abilities: [
      {
        id:         'r_mireia_arcane',
        name:       '비전 폭발',
        attribute:  'Wand',
        effectType: 'INT_BONUS',
        value:      5,
        duration:   1,
      },
      {
        id:         'r_mireia_blink',
        name:       '순간 이동',
        attribute:  'Wand',
        effectType: 'TELEPORT',
        value:      10,
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/r_mireia',
  },
  {
    id:        'r_caspian',
    name:      '카스피안',
    class:     'Knight',
    grade:     'Rare',
    attribute: 'Cup',
    stats: { mov: 2, atk: 2, def: 1, int: 2, hp: 100 },
    abilities: [
      {
        id:         'r_caspian_bless',
        name:       '신성 강복',
        attribute:  'Cup',
        effectType: 'ATK_BONUS',
        value:      2,
        duration:   2,
      },
      {
        id:         'r_caspian_spirit',
        name:       '영혼 공명',
        attribute:  'Cup',
        effectType: 'INT_BONUS',
        value:      3,
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/r_caspian',
  },
]

// ── Epic 등급 (3종) ──────────────────────────────────────────────

const EPIC_CHARACTERS: Character[] = [
  {
    id:        'e_vargoth',
    name:      '바르고스',
    class:     'King',
    grade:     'Epic',
    attribute: 'Sword',
    stats: { mov: 2, atk: 3, def: 2, int: 2, hp: 120 },
    abilities: [
      {
        id:         'e_vargoth_dark',
        name:       '암흑 강림',
        attribute:  'Sword',
        effectType: 'ATK_BONUS',
        value:      6,
        duration:   2,
      },
      {
        id:         'e_vargoth_terror',
        name:       '공포의 기사',
        attribute:  'Sword',
        effectType: 'DEF_BONUS',
        value:      3,
        duration:   1,
      },
      {
        id:         'e_vargoth_passive',
        name:       '패시브: 암흑 군주',
        attribute:  'Sword',
        effectType: 'ATK_BONUS',
        value:      1,
        duration:   999,  // 패시브 — 상시 적용
      },
    ],
    imageUrl: '/assets/characters/e_vargoth',
  },
  {
    id:        'e_celestia',
    name:      '셀레스티아',
    class:     'Rook',
    grade:     'Epic',
    attribute: 'Disk',
    stats: { mov: 1, atk: 2, def: 4, int: 1, hp: 145 },
    abilities: [
      {
        id:         'e_celestia_holy',
        name:       '성벽 결계',
        attribute:  'Disk',
        effectType: 'DEF_BONUS',
        value:      7,
        duration:   2,
      },
      {
        id:         'e_celestia_repel',
        name:       '신성 반격',
        attribute:  'Disk',
        effectType: 'ATK_BONUS',
        value:      4,
        duration:   1,
      },
      {
        id:         'e_celestia_passive',
        name:       '패시브: 빛의 수호자',
        attribute:  'Disk',
        effectType: 'DEF_BONUS',
        value:      1,
        duration:   999,
      },
    ],
    imageUrl: '/assets/characters/e_celestia',
  },
  {
    id:        'e_azalea',
    name:      '아잘레아',
    class:     'Queen',
    grade:     'Epic',
    attribute: 'Wand',
    stats: { mov: 1, atk: 2, def: 1, int: 5, hp: 90 },
    abilities: [
      {
        id:         'e_azalea_nova',
        name:       '성운 폭발',
        attribute:  'Wand',
        effectType: 'INT_BONUS',
        value:      8,
        duration:   1,
      },
      {
        id:         'e_azalea_summon',
        name:       '별의 소환',
        attribute:  'Wand',
        effectType: 'ATK_BONUS',
        value:      5,
        duration:   2,
      },
      {
        id:         'e_azalea_passive',
        name:       '패시브: 마법왕의 혈통',
        attribute:  'Wand',
        effectType: 'INT_BONUS',
        value:      2,
        duration:   999,
      },
    ],
    imageUrl: '/assets/characters/e_azalea',
  },
]

// ── Legendary 등급 (1종) ─────────────────────────────────────────
// "창세의 왕" — 4개 고유 어빌리티 전부 보유
// Destroy / Block / Teleport / GS

const LEGENDARY_CHARACTERS: Character[] = [
  {
    id:        'l_genesis_king',
    name:      '창세왕 크로노스',
    class:     'King',
    grade:     'Legendary',
    attribute: 'Sword',  // 속성 초월 (UI에서는 "ALL" 표기)
    stats: { mov: 2, atk: 4, def: 4, int: 4, hp: 150 },
    abilities: [
      {
        // Destroy: 공격 24 고정
        id:         'l_genesis_destroy',
        name:       '창세 파멸 (Destroy)',
        attribute:  'Sword',
        effectType: 'ATK_FIX',
        value:      24,
        duration:   2,
      },
      {
        // Block: 방어 24 고정
        id:         'l_genesis_block',
        name:       '창세 방벽 (Block)',
        attribute:  'Disk',
        effectType: 'DEF_FIX',
        value:      24,
        duration:   2,
      },
      {
        // Teleport: 전방 1~15칸 랜덤 워프
        id:         'l_genesis_teleport',
        name:       '시공 도약 (Teleport)',
        attribute:  'Wand',
        effectType: 'TELEPORT',
        value:      15,
        duration:   1,
      },
      {
        // GS (Genesis Strike): 공격 30 / 방어 18 고정
        id:         'l_genesis_gs',
        name:       '창세 강타 (Genesis Strike)',
        attribute:  'Cup',
        effectType: 'SPECIAL',
        value:      30,  // 공격 30, 방어 18은 SPECIAL 내부 처리
        duration:   1,
      },
    ],
    imageUrl: '/assets/characters/l_genesis_king',
  },
]

// ── 전체 캐릭터 카탈로그 ──────────────────────────────────────────

export const CHARACTER_CATALOG: Readonly<Character[]> = [
  ...NORMAL_CHARACTERS,
  ...RARE_CHARACTERS,
  ...EPIC_CHARACTERS,
  ...LEGENDARY_CHARACTERS,
]

/** 등급별 캐릭터 목록 */
export const CHARACTERS_BY_GRADE: Record<CharacterGrade, Character[]> = {
  Normal:    NORMAL_CHARACTERS,
  Rare:      RARE_CHARACTERS,
  Epic:      EPIC_CHARACTERS,
  Legendary: LEGENDARY_CHARACTERS,
}

/**
 * ID로 캐릭터 조회
 */
export function getCharacterById(id: string): Character | undefined {
  return CHARACTER_CATALOG.find(c => c.id === id)
}

/**
 * 등급별 캐릭터 목록 조회
 */
export function getCharactersByGrade(grade: CharacterGrade): Character[] {
  return CHARACTERS_BY_GRADE[grade]
}

/**
 * 포지션 가능 클래스 맵
 * 덱 편성 유효성 검사에 활용
 */
export const POSITION_ALLOWED_CLASSES = {
  attacker:     ['King', 'Queen', 'Knight'],
  defender:     ['King', 'Rook', 'Pawn'],
  intelligence: ['King', 'Bishop', 'Rook'],
} as const
