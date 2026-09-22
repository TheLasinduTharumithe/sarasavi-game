import {
  COFFEE_PENALTY,
  GOLDEN_BOOK_SCORE,
  NORMAL_BOOK_SCORE,
  PHONE_PENALTY,
} from '../constants.ts'
import type { FallingItemType, GameStats } from '../types'

export function createEmptyGameStats(): GameStats {
  return {
    score: 0,
    booksCaught: 0,
    goldenBooksCaught: 0,
    phoneItemsCaught: 0,
    coffeeItemsCaught: 0,
    totalDistractionsCaught: 0,
  }
}

export function applyItemCatch(
  currentStats: Readonly<GameStats>,
  itemType: FallingItemType,
): GameStats {
  const stats = { ...currentStats }

  switch (itemType) {
    case 'normalBook':
      stats.score += NORMAL_BOOK_SCORE
      stats.booksCaught += 1
      break
    case 'goldenBook':
      stats.score += GOLDEN_BOOK_SCORE
      stats.goldenBooksCaught += 1
      break
    case 'phone':
      stats.score = Math.max(0, stats.score - PHONE_PENALTY)
      stats.phoneItemsCaught += 1
      stats.totalDistractionsCaught += 1
      break
    case 'coffee':
      stats.score = Math.max(0, stats.score - COFFEE_PENALTY)
      stats.coffeeItemsCaught += 1
      stats.totalDistractionsCaught += 1
      break
  }

  return stats
}
