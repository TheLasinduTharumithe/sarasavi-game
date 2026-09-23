import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../game/constants'
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
    const centerX = GAME_WIDTH / 2
    createBookFairBackground(this)
    createPaperPanel(this, centerX, 378, 980, 600)
    createBrandLabel(this, 68)
    FallingItem.createItemTextures(this)

    this.add
      .text(centerX, 135, 'HOW TO PLAY', {
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
      const x = 340 + index * 200
      this.add.image(x, 226, item.key).setScale(0.68)
      this.add
        .text(x, 286, item.label, {
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
        358,
        'Move the basket and catch as many books as possible before time runs out.',
        {
          align: 'center',
          color: '#7b241c',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          wordWrap: { width: 920 },
        },
      )
      .setOrigin(0.5)

    this.add
      .text(
        centerX,
        480,
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

    createTextButton(
      this,
      centerX - 190,
      GAME_HEIGHT - 62,
      'START GAME',
      () => {
        if (this.playerName) {
          this.scene.start(SCENE_KEYS.GAME, { playerName: this.playerName })
        } else {
          this.scene.start(SCENE_KEYS.HOME)
        }
      },
      { width: 330, height: 64, radius: 14 },
    )

    createTextButton(
      this,
      centerX + 190,
      GAME_HEIGHT - 62,
      'BACK',
      () => this.scene.start(SCENE_KEYS.HOME),
      { width: 330, height: 64, radius: 14 },
    )
  }
}
