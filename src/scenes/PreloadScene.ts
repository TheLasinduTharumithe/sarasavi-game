import Phaser from 'phaser'
import {
  BOOK_EMBLEM_TEXTURE_KEY,
  SCENE_KEYS,
} from '../game/constants'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD)
  }

  preload(): void {
    this.load.image(
      BOOK_EMBLEM_TEXTURE_KEY,
      '/images/sarasavi-book-emblem.png',
    )
  }

  create(): void {
    this.scene.start(SCENE_KEYS.HOME)
  }
}
