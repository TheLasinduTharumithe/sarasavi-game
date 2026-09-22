import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants'
import { BootScene } from '../scenes/BootScene'
import { PreloadScene } from '../scenes/PreloadScene'
import { HomeScene } from '../scenes/HomeScene'
import { HowToPlayScene } from '../scenes/HowToPlayScene'
import { GameScene } from '../scenes/GameScene'
import { ResultScene } from '../scenes/ResultScene'
import { LeaderboardScene } from '../scenes/LeaderboardScene'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
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
