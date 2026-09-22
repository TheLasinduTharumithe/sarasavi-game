import type { GameStats, PlayerResult } from '../types'
import { validatePlayerName } from '../playerName.ts'

const STAT_FIELDS = [
  'score',
  'booksCaught',
  'goldenBooksCaught',
  'phoneItemsCaught',
  'coffeeItemsCaught',
  'totalDistractionsCaught',
] as const satisfies readonly (keyof GameStats)[]

export function serializePlayerResult(result: PlayerResult): string {
  return JSON.stringify(result)
}

export function deserializePlayerResult(value: string): PlayerResult | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed) || !isRecord(parsed.stats)) {
      return null
    }
    const stats = parsed.stats

    if (typeof parsed.playerName !== 'string') {
      return null
    }

    const nameResult = validatePlayerName(parsed.playerName)
    if (
      !nameResult.isValid ||
      !isNonNegativeInteger(parsed.gameDurationSeconds) ||
      !STAT_FIELDS.every((field) => isNonNegativeInteger(stats[field]))
    ) {
      return null
    }

    return {
      playerName: nameResult.playerName,
      stats: {
        score: stats.score as number,
        booksCaught: stats.booksCaught as number,
        goldenBooksCaught: stats.goldenBooksCaught as number,
        phoneItemsCaught: stats.phoneItemsCaught as number,
        coffeeItemsCaught: stats.coffeeItemsCaught as number,
        totalDistractionsCaught: stats.totalDistractionsCaught as number,
      },
      gameDurationSeconds: parsed.gameDurationSeconds,
    }
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}
