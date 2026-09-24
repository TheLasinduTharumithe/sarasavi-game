import Phaser from 'phaser'
import { SCENE_KEYS } from '../game/constants'
import { getSceneDimensions } from '../game/layout'
import { resolvePlayerName } from '../game/playerName'
import {
  createBookFairBackground,
  createBrandLabel,
  createPaperPanel,
} from '../game/presentation'
import { FallingItem } from '../game/objects/FallingItem'
import type { PlayerNameSceneData } from '../game/types'
import { createTextButton } from '../game/ui'

export class HowToPlayScene extends Phaser.Scene {
  private playerName = ''

  constructor() {
    super(SCENE_KEYS.HOW_TO_PLAY)
  }

  init(data?: PlayerNameSceneData): void {
    this.playerName = resolvePlayerName(data?.playerName)
  }

  create(): void {
    const { width, height, portrait } = getSceneDimensions(this)
    const centerX = width / 2
    createBookFairBackground(this)
    createPaperPanel(
      this,
      centerX,
      portrait ? 650 : 378,
      portrait ? 660 : 980,
      portrait ? 1130 : 600,
    )
    createBrandLabel(this, portrait ? 130 : 68)
    FallingItem.createItemTextures(this)

    this.add
      .text(centerX, portrait ? 225 : 135, 'HOW TO PLAY', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const itemGuide = [
      { key: 'normal-book-red', label: 'NORMAL BOOK\n+10' },
      { key: 'golden-book', label: 'GOLDEN BOOK\n+30' },
      { key: 'phone-item', label: 'PHONE\n-10' },
      { key: 'coffee-item', label: 'COFFEE\n-5' },
    ] as const
    itemGuide.forEach((item, index) => {
      const column = portrait ? index % 2 : index
      const row = portrait ? Math.floor(index / 2) : 0
      const x = portrait ? 210 + column * 300 : 340 + column * 200
      const imageY = portrait ? 350 + row * 220 : 226
      this.add.image(x, imageY, item.key).setScale(portrait ? 0.82 : 0.68)
      this.add
        .text(x, imageY + (portrait ? 78 : 60), item.label, {
          align: 'center',
          color: '#314457',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    })

    this.add
      .text(
        centerX,
        portrait ? 720 : 358,
        'Move the basket and catch as many books as possible before time runs out.',
        {
          align: 'center',
          color: '#7b241c',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          wordWrap: { width: portrait ? 600 : 920 },
        },
      )
      .setOrigin(0.5)

    this.add
      .text(
        centerX,
        portrait ? 885 : 480,
        'Keyboard:\nArrow Keys or A / D\n\nTouch:\nDrag the basket or hold the LEFT / RIGHT buttons',
        {
          align: 'center',
          color: '#1f3a5f',
          fontFamily: 'Arial, sans-serif',
          fontSize: '21px',
          lineSpacing: 3,
        },
      )
      .setOrigin(0.5)
      .setWordWrapWidth(portrait ? 610 : 920)

    createTextButton(
      this,
      portrait ? 190 : centerX - 190,
      portrait ? height - 105 : height - 62,
      'START GAME',
      () => {
        if (this.playerName) {
          this.scene.start(SCENE_KEYS.GAME, { playerName: this.playerName })
        } else {
          this.scene.start(SCENE_KEYS.HOME)
        }
      },
      { width: portrait ? 290 : 330, height: 80, radius: 14 },
    )

    createTextButton(
      this,
      portrait ? width - 190 : centerX + 190,
      portrait ? height - 105 : height - 62,
      'BACK',
      () => this.scene.start(SCENE_KEYS.HOME),
      { width: portrait ? 290 : 330, height: 80, radius: 14 },
    )
  }
}
