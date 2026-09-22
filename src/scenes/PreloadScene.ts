import Phaser from 'phaser'
import { SCENE_KEYS } from '../game/constants'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD)
  }

  create(): void {
    this.scene.start(SCENE_KEYS.HOME)
  }
}
