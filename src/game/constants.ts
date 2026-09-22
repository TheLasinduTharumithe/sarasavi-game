import type { FallingItemType } from './types'

export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720
export const GAME_DURATION = 30
export const GAME_VERSION = '1.0.0'

export const NORMAL_BOOK_SCORE = 10
export const GOLDEN_BOOK_SCORE = 30
export const PHONE_PENALTY = 10
export const COFFEE_PENALTY = 5

export const MAX_ACTIVE_ITEMS = 12

export const PLAYER_NAME_STORAGE_KEY = 'sarasaviCatchBooks.playerName'

export const ACHIEVEMENT_THRESHOLDS = [
  { minimumScore: 400, title: 'Sarasavi Book Champion' },
  { minimumScore: 300, title: 'Book Master' },
  { minimumScore: 200, title: 'Book Hunter' },
  { minimumScore: 100, title: 'Book Explorer' },
  { minimumScore: 0, title: 'Book Beginner' },
] as const

export const ITEM_SPAWN_PROBABILITIES = {
  normalBook: 0.72,
  phone: 0.13,
  coffee: 0.09,
  goldenBook: 0.06,
} as const satisfies Readonly<Record<FallingItemType, number>>

export const DIFFICULTY_CONFIG = {
  spawnIntervalMs: {
    start: { min: 850, max: 950 },
    middle: { min: 600, max: 750 },
    end: { min: 420, max: 550 },
  },
  fallingSpeed: {
    start: { min: 190, max: 260 },
    middle: { min: 330, max: 430 },
    end: { min: 500, max: 620 },
  },
} as const

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  HOME: 'HomeScene',
  HOW_TO_PLAY: 'HowToPlayScene',
  GAME: 'GameScene',
  RESULT: 'ResultScene',
  LEADERBOARD: 'LeaderboardScene',
} as const
