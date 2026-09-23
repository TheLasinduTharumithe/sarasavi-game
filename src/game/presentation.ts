import Phaser from 'phaser'
import {
  BOOK_EMBLEM_SEAL_TEXTURE_KEY,
  BOOK_EMBLEM_TEXTURE_KEY,
  GAME_HEIGHT,
  GAME_WIDTH,
} from './constants'

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

  if (!options.gameplay) {
    drawFairBunting(graphic)
  }

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
  panel.fillStyle(THEME.red, 1).fillRoundedRect(
    x - width / 2 + 16,
    y - height / 2 + 9,
    Math.max(24, width - 32),
    5,
    3,
  )
  panel.fillStyle(THEME.gold, 0.9).fillCircle(
    x - width / 2 + 19,
    y - height / 2 + 11,
    3,
  )
  panel.fillCircle(
    x + width / 2 - 19,
    y - height / 2 + 11,
    3,
  )
  return panel
}

export function createBrandLabel(
  scene: Phaser.Scene,
  y = 72,
): Phaser.GameObjects.Container {
  const mark = scene.add.graphics()
  mark.fillStyle(0x35261e, 0.18).fillRoundedRect(-256, -31, 512, 68, 16)
  mark.fillStyle(THEME.paper, 1).fillRoundedRect(-258, -35, 516, 68, 16)
  mark.fillStyle(THEME.ink, 1).fillRoundedRect(-252, -29, 504, 58, 13)
  mark.fillStyle(THEME.red, 1).fillRoundedRect(-252, 15, 504, 14, 5)
  mark.fillStyle(THEME.gold, 1).fillRect(-185, 12, 405, 3)

  const logo = createLogoSeal(scene, -214, 0, 58)
  const text = scene.add
    .text(32, -7, 'SARASAVI', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '29px',
      fontStyle: 'bold',
      letterSpacing: 2,
    })
    .setOrigin(0.5)
  const subtext = scene.add
    .text(32, 21, 'BOOK FAIR', {
      color: '#f7d67a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      letterSpacing: 4,
    })
    .setOrigin(0.5)

  return scene.add.container(GAME_WIDTH / 2, y, [mark, logo, text, subtext])
}

export function createLogoSeal(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  alpha = 1,
): Phaser.GameObjects.Container {
  ensureLogoSealTexture(scene)

  const frame = scene.add.graphics()
  frame.fillStyle(0x35261e, 0.2).fillCircle(3, 4, size / 2 + 3)
  frame.fillStyle(THEME.paper, 1).fillCircle(0, 0, size / 2 + 3)
  frame.lineStyle(3, THEME.gold, 1).strokeCircle(0, 0, size / 2 + 1)

  const emblem = scene.add
    .image(0, 0, BOOK_EMBLEM_SEAL_TEXTURE_KEY)
    .setDisplaySize(size - 7, size - 7)

  return scene.add.container(x, y, [frame, emblem]).setAlpha(alpha)
}

function ensureLogoSealTexture(scene: Phaser.Scene): void {
  if (
    scene.textures.exists(BOOK_EMBLEM_SEAL_TEXTURE_KEY) ||
    !scene.textures.exists(BOOK_EMBLEM_TEXTURE_KEY)
  ) {
    return
  }

  const sealSize = 256
  const sealTexture = scene.textures.createCanvas(
    BOOK_EMBLEM_SEAL_TEXTURE_KEY,
    sealSize,
    sealSize,
  )
  if (!sealTexture) {
    return
  }

  const source = scene.textures
    .get(BOOK_EMBLEM_TEXTURE_KEY)
    .getSourceImage() as CanvasImageSource
  const context = sealTexture.context
  context.save()
  context.beginPath()
  context.arc(sealSize / 2, sealSize / 2, sealSize / 2, 0, Math.PI * 2)
  context.clip()
  context.drawImage(source, 0, 0, sealSize, sealSize)
  context.restore()
  sealTexture.refresh()
}

function drawFairBunting(graphic: Phaser.GameObjects.Graphics): void {
  graphic.lineStyle(2, THEME.ink, 0.28)
  graphic.lineBetween(170, 58, GAME_WIDTH - 170, 58)

  const colors = [THEME.red, THEME.gold, THEME.ink, THEME.green]
  for (let x = 188, index = 0; x < GAME_WIDTH - 175; x += 54, index += 1) {
    graphic.fillStyle(colors[index % colors.length], 0.88)
    graphic.fillTriangle(x, 58, x + 34, 58, x + 17, 78)
  }
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
