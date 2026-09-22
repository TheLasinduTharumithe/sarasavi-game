import Phaser from 'phaser'
import { prefersReducedMotion } from './motion'
import { THEME } from './presentation'
import type { ButtonDimensions } from './types'

const DEFAULT_BUTTON_DIMENSIONS: ButtonDimensions = {
  width: 320,
  height: 64,
  radius: 14,
}

export function createTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  dimensions: ButtonDimensions = DEFAULT_BUTTON_DIMENSIONS,
): Phaser.GameObjects.Container {
  const background = scene.add.graphics()
  const drawBackground = (fillColor: number, yOffset = 0): void => {
    background.clear()
    background.fillStyle(0x35261e, 0.18)
    background.fillRoundedRect(
      -dimensions.width / 2 + 3,
      -dimensions.height / 2 + 6,
      dimensions.width - 6,
      dimensions.height,
      dimensions.radius,
    )
    background.fillStyle(fillColor, 1)
    background.fillRoundedRect(
      -dimensions.width / 2,
      -dimensions.height / 2 + yOffset,
      dimensions.width,
      dimensions.height,
      dimensions.radius,
    )
    background.lineStyle(2, THEME.redDark, 1)
    background.strokeRoundedRect(
      -dimensions.width / 2,
      -dimensions.height / 2 + yOffset,
      dimensions.width,
      dimensions.height,
      dimensions.radius,
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
  button.setSize(dimensions.width, dimensions.height)
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
