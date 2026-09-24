import type Phaser from 'phaser'
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PORTRAIT_GAME_HEIGHT,
  PORTRAIT_GAME_WIDTH,
} from './constants'

export interface GameDimensions {
  width: number
  height: number
  portrait: boolean
}

export function getPreferredGameDimensions(): GameDimensions {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const portrait = viewportHeight > viewportWidth

  return portrait
    ? {
        width: PORTRAIT_GAME_WIDTH,
        height: PORTRAIT_GAME_HEIGHT,
        portrait: true,
      }
    : { width: GAME_WIDTH, height: GAME_HEIGHT, portrait: false }
}

export function getSceneDimensions(scene: Phaser.Scene): GameDimensions {
  const { width, height } = scene.scale.gameSize
  return { width, height, portrait: height > width }
}

