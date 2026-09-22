import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DIFFICULTY_CONFIG } from '../constants.ts'
import { validatePlayerName } from '../playerName.ts'
import { getAchievementTitle } from './achievement.ts'
import { interpolateDifficultyRange } from './difficulty.ts'
import {
  deserializePlayerResult,
  serializePlayerResult,
} from './result.ts'
import { applyItemCatch, createEmptyGameStats } from './score.ts'

describe('score calculations', () => {
  it('applies every item value and tracks matching counters', () => {
    let stats = createEmptyGameStats()
    stats = applyItemCatch(stats, 'normalBook')
    stats = applyItemCatch(stats, 'goldenBook')
    stats = applyItemCatch(stats, 'phone')
    stats = applyItemCatch(stats, 'coffee')

    assert.deepEqual(stats, {
      score: 25,
      booksCaught: 1,
      goldenBooksCaught: 1,
      phoneItemsCaught: 1,
      coffeeItemsCaught: 1,
      totalDistractionsCaught: 2,
    })
  })

  it('never lets penalties reduce the score below zero', () => {
    const afterPhone = applyItemCatch(createEmptyGameStats(), 'phone')
    const afterCoffee = applyItemCatch(afterPhone, 'coffee')
    assert.equal(afterCoffee.score, 0)
  })
})

describe('achievement calculation', () => {
  const cases = [
    [0, 'Book Beginner'],
    [99, 'Book Beginner'],
    [100, 'Book Explorer'],
    [200, 'Book Hunter'],
    [300, 'Book Master'],
    [400, 'Sarasavi Book Champion'],
    [900, 'Sarasavi Book Champion'],
  ]

  for (const [score, title] of cases) {
    it(`maps ${score} to ${title}`, () => {
      assert.equal(getAchievementTitle(score), title)
    })
  }
})

describe('player-name validation', () => {
  it('trims a valid name and accepts letters, numbers, and spaces', () => {
    assert.deepEqual(validatePlayerName('  Nimal 7  '), {
      isValid: true,
      playerName: 'Nimal 7',
      errorMessage: '',
    })
  })

  for (const value of ['', 'A', 'a'.repeat(21), '<script>', 'Amy!']) {
    it(`rejects invalid value ${JSON.stringify(value)}`, () => {
      assert.equal(validatePlayerName(value).isValid, false)
    })
  }
})

describe('difficulty calculation', () => {
  it('matches start, middle, and end configuration', () => {
    const ranges = DIFFICULTY_CONFIG.spawnIntervalMs
    assert.deepEqual(interpolateDifficultyRange(ranges, 0), ranges.start)
    assert.deepEqual(interpolateDifficultyRange(ranges, 0.5), ranges.middle)
    assert.deepEqual(interpolateDifficultyRange(ranges, 1), ranges.end)
  })

  it('changes smoothly and clamps progress', () => {
    const ranges = DIFFICULTY_CONFIG.fallingSpeed
    const quarter = interpolateDifficultyRange(ranges, 0.25)
    assert.equal(quarter.min, (ranges.start.min + ranges.middle.min) / 2)
    assert.deepEqual(interpolateDifficultyRange(ranges, -1), ranges.start)
    assert.deepEqual(interpolateDifficultyRange(ranges, 2), ranges.end)
  })
})

describe('game-result serialization', () => {
  const result = {
    playerName: 'Amanda 2',
    stats: {
      score: 120,
      booksCaught: 9,
      goldenBooksCaught: 1,
      phoneItemsCaught: 0,
      coffeeItemsCaught: 0,
      totalDistractionsCaught: 0,
    },
    gameDurationSeconds: 30,
  }

  it('round-trips a valid result', () => {
    assert.deepEqual(deserializePlayerResult(serializePlayerResult(result)), result)
  })

  it('rejects malformed and negative results', () => {
    assert.equal(deserializePlayerResult('not json'), null)
    assert.equal(
      deserializePlayerResult(
        JSON.stringify({ ...result, stats: { ...result.stats, score: -1 } }),
      ),
      null,
    )
  })
})
