import Phaser from 'phaser'
import { SCENE_KEYS } from '../game/constants'
import { getSceneDimensions } from '../game/layout'
import {
  loadStoredPlayerName,
  storePlayerName,
  validatePlayerName,
} from '../game/playerName'
import {
  createBookFairBackground,
  createBrandLabel,
  createPaperPanel,
} from '../game/presentation'
import { createTextButton } from '../game/ui'

export class HomeScene extends Phaser.Scene {
  private nameInput?: HTMLInputElement
  private validationText?: Phaser.GameObjects.Text
  private positionFrame?: number
  private inputLogicalX = 0
  private inputLogicalY = 0
  private inputLogicalWidth = 380
  private inputLogicalHeight = 56

  constructor() {
    super(SCENE_KEYS.HOME)
  }

  create(): void {
    const { width, portrait } = getSceneDimensions(this)
    const centerX = width / 2
    const panelY = portrait ? 650 : 390
    const panelWidth = portrait ? 660 : 650
    const panelHeight = portrait ? 1130 : 580
    const brandY = portrait ? 130 : 78
    const titleY = portrait ? 230 : 153
    const subtitleY = portrait ? 292 : 207
    const playerLabelY = portrait ? 365 : 267
    const inputY = portrait ? 425 : 320
    const validationY = portrait ? 485 : 376
    const playY = portrait ? 590 : 430
    const howToY = portrait ? 710 : 520
    const leaderboardY = portrait ? 830 : 610
    const buttonWidth = portrait ? 500 : 320

    this.inputLogicalX = centerX
    this.inputLogicalY = inputY
    this.inputLogicalWidth = portrait ? 520 : 380
    this.inputLogicalHeight = portrait ? 68 : 56

    createBookFairBackground(this)
    createPaperPanel(this, centerX, panelY, panelWidth, panelHeight)
    createBrandLabel(this, brandY)

    this.add
      .text(centerX, titleY, 'CATCH THE FALLING BOOKS', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setWordWrapWidth(portrait ? 620 : 650)

    this.add
      .text(centerX, subtitleY, 'Catch the books. Avoid the distractions!', {
        color: '#3d3d3d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '25px',
      })
      .setOrigin(0.5)
      .setWordWrapWidth(portrait ? 590 : 650)

    this.add
      .text(centerX, playerLabelY, 'PLAYER NAME', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.createNameInput()

    this.validationText = this.add
      .text(centerX, validationY, '', {
        color: '#b42318',
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    createTextButton(
      this,
      centerX,
      playY,
      'PLAY',
      () => this.startGame(),
      { width: buttonWidth, height: portrait ? 90 : 80, radius: 16 },
    )
    createTextButton(
      this,
      centerX,
      howToY,
      'HOW TO PLAY',
      () => this.startInformationalScene(SCENE_KEYS.HOW_TO_PLAY),
      { width: buttonWidth, height: portrait ? 90 : 80, radius: 16 },
    )
    createTextButton(
      this,
      centerX,
      leaderboardY,
      'LEADERBOARD',
      () => this.startInformationalScene(SCENE_KEYS.LEADERBOARD),
      { width: buttonWidth, height: portrait ? 90 : 80, radius: 16 },
    )

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
    window.addEventListener('resize', this.scheduleNameInputPosition)
    window.addEventListener('orientationchange', this.scheduleNameInputPosition)
    window.visualViewport?.addEventListener(
      'resize',
      this.scheduleNameInputPosition,
    )
    this.scale.on(Phaser.Scale.Events.RESIZE, this.scheduleNameInputPosition)
    this.scheduleNameInputPosition()
  }

  private createNameInput(): void {
    const input = document.createElement('input')
    input.className = 'player-name-input'
    input.type = 'text'
    input.placeholder = 'Enter your name'
    input.maxLength = 20
    input.autocomplete = 'name'
    input.spellcheck = false
    input.setAttribute('aria-label', 'Player name')
    input.value = loadStoredPlayerName()
    input.addEventListener('input', this.handleNameInput)
    input.addEventListener('keydown', this.handleNameKeyDown)

    this.nameInput = input
    document.body.append(input)
    this.positionNameInput()
  }

  private readonly scheduleNameInputPosition = (): void => {
    if (this.positionFrame !== undefined) {
      window.cancelAnimationFrame(this.positionFrame)
    }

    this.positionFrame = window.requestAnimationFrame(() => {
      this.positionFrame = undefined
      this.positionNameInput()
    })
  }

  private positionNameInput(): void {
    if (!this.nameInput) {
      return
    }

    const canvasBounds = this.game.canvas.getBoundingClientRect()
    const gameSize = this.scale.gameSize
    const scaleX = canvasBounds.width / gameSize.width
    const scaleY = canvasBounds.height / gameSize.height
    const inputWidth = Math.min(
      this.inputLogicalWidth * scaleX,
      canvasBounds.width - 32,
    )
    const inputHeight = Math.max(40, this.inputLogicalHeight * scaleY)
    this.nameInput.style.left = `${canvasBounds.left + this.inputLogicalX * scaleX}px`
    this.nameInput.style.top = `${canvasBounds.top + this.inputLogicalY * scaleY}px`
    this.nameInput.style.width = `${inputWidth}px`
    this.nameInput.style.height = `${inputHeight}px`
    this.nameInput.style.fontSize = `${Math.max(16, 24 * scaleY)}px`
  }

  private readonly handleNameInput = (): void => {
    this.validationText?.setText('')
  }

  private readonly handleNameKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.startGame()
    }
  }

  private startGame(): void {
    const result = validatePlayerName(this.nameInput?.value ?? '')
    if (!result.isValid) {
      this.validationText?.setText(result.errorMessage)
      this.nameInput?.focus()
      return
    }

    storePlayerName(result.playerName)
    this.scene.start(SCENE_KEYS.GAME, { playerName: result.playerName })
  }

  private startInformationalScene(
    sceneKey: typeof SCENE_KEYS.HOW_TO_PLAY | typeof SCENE_KEYS.LEADERBOARD,
  ): void {
    const result = validatePlayerName(this.nameInput?.value ?? '')
    const playerName = result.isValid ? result.playerName : ''

    if (playerName) {
      storePlayerName(playerName)
    }

    this.scene.start(sceneKey, { playerName })
  }

  private handleShutdown(): void {
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
    this.nameInput?.removeEventListener('input', this.handleNameInput)
    this.nameInput?.removeEventListener('keydown', this.handleNameKeyDown)
    window.removeEventListener('resize', this.scheduleNameInputPosition)
    window.removeEventListener('orientationchange', this.scheduleNameInputPosition)
    window.visualViewport?.removeEventListener(
      'resize',
      this.scheduleNameInputPosition,
    )
    this.scale.off(Phaser.Scale.Events.RESIZE, this.scheduleNameInputPosition)
    if (this.positionFrame !== undefined) {
      window.cancelAnimationFrame(this.positionFrame)
      this.positionFrame = undefined
    }
    this.nameInput?.remove()
    this.nameInput = undefined
    this.validationText = undefined
  }
}
