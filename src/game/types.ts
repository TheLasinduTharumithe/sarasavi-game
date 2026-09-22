import type { SCENE_KEYS } from './constants'

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS]

export type FallingItemType =
  | 'normalBook'
  | 'goldenBook'
  | 'phone'
  | 'coffee'

export interface GameStats {
  score: number
  booksCaught: number
  goldenBooksCaught: number
  phoneItemsCaught: number
  coffeeItemsCaught: number
  totalDistractionsCaught: number
}

export interface PlayerResult {
  playerName: string
  stats: GameStats
  gameDurationSeconds: number
}

export interface PlayerNameSceneData {
  playerName?: string
}

export interface GameSceneData {
  playerName: string
}

export interface ResultSceneData extends PlayerResult {
  submissionId: string
}

export type GameState = 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED'

export interface ButtonDimensions {
  width: number
  height: number
  radius: number
}
