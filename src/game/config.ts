import Phaser from 'phaser'
import { getPreferredGameDimensions } from './layout'
import { BootScene } from '../scenes/BootScene'
import { PreloadScene } from '../scenes/PreloadScene'
import { HomeScene } from '../scenes/HomeScene'
import { HowToPlayScene } from '../scenes/HowToPlayScene'
import { GameScene } from '../scenes/GameScene'
import { ResultScene } from '../scenes/ResultScene'
import { LeaderboardScene } from '../scenes/LeaderboardScene'

export const initialGameDimensions = getPreferredGameDimensions()

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: initialGameDimensions.width,
  height: initialGameDimensions.height,
  backgroundColor: '#f7f1e3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    HomeScene,
    HowToPlayScene,
    GameScene,
    ResultScene,
    LeaderboardScene,
  ],
}
