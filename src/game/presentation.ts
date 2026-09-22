import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants'

export const THEME = {
  ink: 0x213a57,
  inkCss: '#213a57',
  red: 0xb83b32,
  redDark: 0x812c27,
  redCss: '#b83b32',
  cream: 0xf8f1df,
  paper: 0xfffcf4,
  wood: 0x8a5a3b,
  woodDark: 0x603e2a,
  gold: 0xe3ad2f,
  green: 0x367a55,
  slateCss: '#405164',
} as const

interface BackgroundOptions {
  gameplay?: boolean
}

export function createBookFairBackground(
  scene: Phaser.Scene,
  options: BackgroundOptions = {},
): Phaser.GameObjects.Graphics {
  const graphic = scene.add.graphics().setDepth(-100)
  graphic.fillStyle(THEME.cream, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  // A restrained book-fair awning gives every scene a recognizable setting.
  graphic.fillStyle(THEME.ink, 1).fillRect(0, 0, GAME_WIDTH, 16)
  for (let x = 0; x < GAME_WIDTH; x += 80) {
    graphic.fillStyle((x / 80) % 2 === 0 ? THEME.red : 0xf1d6b5, 1)
    graphic.fillRect(x, 16, 80, 28)
  }
  graphic.fillStyle(THEME.woodDark, 0.16).fillRect(0, 44, GAME_WIDTH, 4)

  const shelfAlpha = options.gameplay ? 0.13 : 0.2
  drawShelf(graphic, 20, 180, shelfAlpha)
  drawShelf(graphic, GAME_WIDTH - 150, 180, shelfAlpha)

  graphic.fillStyle(0xd8bd91, options.gameplay ? 0.32 : 0.48)
  graphic.fillRect(0, GAME_HEIGHT - 84, GAME_WIDTH, 84)
  graphic.lineStyle(2, THEME.wood, options.gameplay ? 0.12 : 0.2)
  for (let y = GAME_HEIGHT - 66; y < GAME_HEIGHT; y += 22) {
    graphic.lineBetween(0, y, GAME_WIDTH, y)
  }

  return graphic
}

export function createPaperPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Graphics {
  const panel = scene.add.graphics()
  panel.fillStyle(0x4b382c, 0.12).fillRoundedRect(
    x - width / 2 + 5,
    y - height / 2 + 7,
    width,
    height,
    20,
  )
  panel.fillStyle(THEME.paper, 0.97).fillRoundedRect(
    x - width / 2,
    y - height / 2,
    width,
    height,
    20,
  )
  panel.lineStyle(2, 0xd9c6a6, 1).strokeRoundedRect(
    x - width / 2,
    y - height / 2,
    width,
    height,
    20,
  )
  return panel
}

export function createBrandLabel(
  scene: Phaser.Scene,
  y = 72,
): Phaser.GameObjects.Container {
  const mark = scene.add.graphics()
  mark.fillStyle(THEME.red, 1).fillRoundedRect(-196, -25, 392, 50, 12)
  mark.fillStyle(THEME.paper, 1).fillRect(-172, 12, 344, 4)
  const text = scene.add
    .text(0, -2, 'SARASAVI BOOK FAIR', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      letterSpacing: 1,
    })
    .setOrigin(0.5)
  return scene.add.container(GAME_WIDTH / 2, y, [mark, text])
}

function drawShelf(
  graphic: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  alpha: number,
): void {
  graphic.fillStyle(THEME.wood, alpha).fillRoundedRect(x, y, 130, 350, 8)
  graphic.fillStyle(THEME.woodDark, alpha).fillRect(x + 8, y + 12, 114, 8)
  graphic.fillRect(x + 8, y + 118, 114, 8)
  graphic.fillRect(x + 8, y + 224, 114, 8)
  graphic.fillRect(x + 8, y + 330, 114, 8)

  const colors = [THEME.red, THEME.ink, THEME.green, 0xd68132, 0x76528b]
  for (let shelf = 0; shelf < 3; shelf += 1) {
    for (let index = 0; index < 5; index += 1) {
      const height = 55 + ((index * 11 + shelf * 7) % 32)
      graphic.fillStyle(colors[(index + shelf) % colors.length], alpha + 0.06)
      graphic.fillRoundedRect(
        x + 14 + index * 21,
        y + 113 + shelf * 106 - height,
        16,
        height,
        2,
      )
    }
  }
}
