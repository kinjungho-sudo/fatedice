import {
  initBoard, movePlayer, getTileEvent,
  checkCollision, applyDOA, isGoal, getTile,
  BOARD_SIZE,
} from './board'
import type { Player, BoardState } from './types'

function makePlayer(id: string, position: number): Player {
  return {
    id,
    userId: `user-${id}`,
    nickname: id,
    party: {
      attacker:     { id: 'a', name: 'A', class: 'Knight', grade: 'Normal', attribute: 'Sword', stats: { mov: 1, atk: 2, def: 1, int: 0, hp: 10 }, abilities: [], imageUrl: '' },
      defender:     { id: 'b', name: 'B', class: 'Rook',   grade: 'Normal', attribute: 'Disk',  stats: { mov: 1, atk: 1, def: 2, int: 0, hp: 10 }, abilities: [], imageUrl: '' },
      intelligence: { id: 'c', name: 'C', class: 'Bishop', grade: 'Normal', attribute: 'Wand',  stats: { mov: 1, atk: 0, def: 0, int: 1, hp: 10 }, abilities: [], imageUrl: '' },
    },
    position,
    ag: 0,
    items: [],
    activeAbility: null,
    isConnected: true,
  }
}

describe('initBoard', () => {
  let board: BoardState

  beforeEach(() => { board = initBoard() })

  test(`타일 개수가 ${BOARD_SIZE}개다`, () => {
    expect(board.tiles).toHaveLength(BOARD_SIZE)
    expect(board.totalTiles).toBe(BOARD_SIZE)
  })

  test('index 0은 normal 타일', () => {
    expect(board.tiles[0].type).toBe('normal')
  })

  test('마지막 타일(index 49)은 goal', () => {
    expect(board.tiles[49].type).toBe('goal')
  })

  test('ability_charge 타일이 인덱스 5, 15, 25에 있다', () => {
    expect(board.tiles[5].type).toBe('ability_charge')
    expect(board.tiles[15].type).toBe('ability_charge')
    expect(board.tiles[25].type).toBe('ability_charge')
  })

  test('DOA 타일이 인덱스 12에 있다', () => {
    expect(board.tiles[12].type).toBe('doa')
  })

  test('warp_green(7)의 warpTarget이 22다', () => {
    expect(board.tiles[7].warpTarget).toBe(22)
  })

  test('warp_yellow(17)의 warpTarget이 32다', () => {
    expect(board.tiles[17].warpTarget).toBe(32)
  })

  test('warp_blue(27)의 warpTarget이 42다', () => {
    expect(board.tiles[27].warpTarget).toBe(42)
  })

  test('curse 타일이 인덱스 8, 20, 35에 있다', () => {
    expect(board.tiles[8].type).toBe('curse')
    expect(board.tiles[20].type).toBe('curse')
    expect(board.tiles[35].type).toBe('curse')
  })
})

describe('movePlayer', () => {
  const board = initBoard()

  test('기본 이동: position+steps', () => {
    const p = makePlayer('P1', 0)
    const result = movePlayer(p, board, 3)
    expect(result.player.position).toBe(3)
    expect(result.path).toHaveLength(3)
  })

  test('워프 타일 착지 → 워프 목적지로 이동', () => {
    const p = makePlayer('P1', 4)
    // 3칸 이동 → index 7 (warp_green → 22)
    const result = movePlayer(p, board, 3)
    expect(result.player.position).toBe(22)
    expect(result.tileEvent?.type).toBe('warp_green')
  })

  test('DOA 타일 착지 → position=0', () => {
    const p = makePlayer('P1', 9)
    // 3칸 이동 → index 12 (DOA)
    const result = movePlayer(p, board, 3)
    expect(result.player.position).toBe(0)
    expect(result.tileEvent?.type).toBe('doa')
  })

  test('goal(49) 착지 → 이동 중단', () => {
    const p = makePlayer('P1', 46)
    const result = movePlayer(p, board, 5) // 골 넘어서 이동 시도
    expect(result.player.position).toBe(49) // goal에서 멈춤
    expect(result.tileEvent?.type).toBe('goal')
  })

  test('ability_charge 타일 이벤트 반환', () => {
    const p = makePlayer('P1', 2)
    const result = movePlayer(p, board, 3) // → index 5
    expect(result.tileEvent?.type).toBe('ability_charge')
    expect(result.tileEvent?.data.agChange).toBe(30)
  })

  test('일반 타일 이벤트는 null', () => {
    const p = makePlayer('P1', 0)
    const result = movePlayer(p, board, 1) // → index 1 (normal)
    expect(result.tileEvent).toBeNull()
  })
})

describe('checkCollision', () => {
  test('같은 위치에 다른 플레이어가 있으면 반환', () => {
    const p1 = makePlayer('P1', 10)
    const p2 = makePlayer('P2', 10)
    const found = checkCollision([p1, p2], 10, 'P1')
    expect(found?.id).toBe('P2')
  })

  test('같은 위치에 플레이어가 없으면 null', () => {
    const p1 = makePlayer('P1', 10)
    const p2 = makePlayer('P2', 15)
    const found = checkCollision([p1, p2], 10, 'P1')
    expect(found).toBeNull()
  })

  test('자기 자신은 제외된다', () => {
    const p1 = makePlayer('P1', 10)
    const found = checkCollision([p1], 10, 'P1')
    expect(found).toBeNull()
  })
})

describe('applyDOA', () => {
  test('플레이어 position이 0으로 리셋된다', () => {
    const p = makePlayer('P1', 30)
    const result = applyDOA(p)
    expect(result.position).toBe(0)
  })

  test('원본 불변성', () => {
    const p = makePlayer('P1', 30)
    applyDOA(p)
    expect(p.position).toBe(30)
  })
})

describe('isGoal', () => {
  const board = initBoard()

  test('position=49이면 true', () => {
    const p = makePlayer('P1', 49)
    expect(isGoal(p, board)).toBe(true)
  })

  test('position=48이면 false', () => {
    const p = makePlayer('P1', 48)
    expect(isGoal(p, board)).toBe(false)
  })
})

describe('getTile', () => {
  const board = initBoard()

  test('유효한 인덱스는 Tile 반환', () => {
    expect(getTile(board, 0)).not.toBeNull()
    expect(getTile(board, 49)?.type).toBe('goal')
  })

  test('범위 밖 인덱스는 null 반환', () => {
    expect(getTile(board, 100)).toBeNull()
    expect(getTile(board, -1)).toBeNull()
  })
})
