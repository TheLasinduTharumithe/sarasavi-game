import Phaser from 'phaser'
import { prefersReducedMotion } from './motion'
import { THEME } from './presentation'
import type { ButtonDimensions } from './types'

const DEFAULT_BUTTON_DIMENSIONS: ButtonDimensions = {
  width: 320,
  height: 80,
  radius: 14,
}

const MINIMUM_BUTTON_HEIGHT = 80

export function createTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  dimensions: ButtonDimensions = DEFAULT_BUTTON_DIMENSIONS,
): Phaser.GameObjects.Container {
  const buttonDimensions = {
    ...dimensions,
    height: Math.max(dimensions.height, MINIMUM_BUTTON_HEIGHT),
  }
  const background = scene.add.graphics()
  const drawBackground = (fillColor: number, yOffset = 0): void => {
    background.clear()
    background.fillStyle(0x35261e, 0.18)
    background.fillRoundedRect(
      -buttonDimensions.width / 2 + 3,
      -buttonDimensions.height / 2 + 6,
      buttonDimensions.width - 6,
      buttonDimensions.height,
      buttonDimensions.radius,
    )
    background.fillStyle(fillColor, 1)
    background.fillRoundedRect(
      -buttonDimensions.width / 2,
      -buttonDimensions.height / 2 + yOffset,
      buttonDimensions.width,
      buttonDimensions.height,
      buttonDimensions.radius,
    )
    background.fillStyle(THEME.ink, 1)
    background.fillRoundedRect(
      -buttonDimensions.width / 2,
      -buttonDimensions.height / 2 + yOffset,
      15,
      buttonDimensions.height,
      {
        tl: buttonDimensions.radius,
        bl: buttonDimensions.radius,
        tr: 0,
        br: 0,
      },
    )
    background.fillStyle(THEME.gold, 0.95)
    background.fillRoundedRect(
      -buttonDimensions.width / 2 + 25,
      -buttonDimensions.height / 2 + 8 + yOffset,
      buttonDimensions.width - 50,
      3,
      2,
    )
    background.lineStyle(2, 0xfffcf4, 0.45)
    background.lineBetween(
      buttonDimensions.width / 2 - 22,
      -8 + yOffset,
      buttonDimensions.width / 2 - 10,
      -8 + yOffset,
    )
    background.lineBetween(
      buttonDimensions.width / 2 - 22,
      yOffset,
      buttonDimensions.width / 2 - 10,
      yOffset,
    )
    background.lineBetween(
      buttonDimensions.width / 2 - 22,
      8 + yOffset,
      buttonDimensions.width / 2 - 10,
      8 + yOffset,
    )
    background.lineStyle(2, THEME.redDark, 1)
    background.strokeRoundedRect(
      -buttonDimensions.width / 2,
      -buttonDimensions.height / 2 + yOffset,
      buttonDimensions.width,
      buttonDimensions.height,
      buttonDimensions.radius,
    )
  }
  drawBackground(THEME.red)

  const text = scene.add
    .text(0, 0, label, {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)

  const button = scene.add.container(x, y, [background, text])
  button.setSize(buttonDimensions.width, buttonDimensions.height)
  button.setName(label)
  button.setInteractive({ useHandCursor: true })
  button.on('pointerover', () => drawBackground(0xc94b41))
  button.on('pointerout', () => {
    button.setScale(1)
    drawBackground(THEME.red)
  })
  button.on('pointerdown', () => {
    if (!prefersReducedMotion()) {
      button.setScale(0.98)
    }
    drawBackground(THEME.redDark, 2)
    onClick()
  })
  button.on('pointerup', () => {
    button.setScale(1)
    drawBackground(0xc94b41)
  })

  return button
}
