import Phaser from 'phaser'
import { GAME_WIDTH, SCENE_KEYS } from '../game/constants'
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

  constructor() {
    super(SCENE_KEYS.HOME)
  }

  create(): void {
    const centerX = GAME_WIDTH / 2
    createBookFairBackground(this)
    createPaperPanel(this, centerX, 390, 650, 580)
    createBrandLabel(this, 78)

    this.add
      .text(centerX, 153, 'CATCH THE FALLING BOOKS', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, 207, 'Catch the books. Avoid the distractions!', {
        color: '#3d3d3d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '25px',
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, 267, 'PLAYER NAME', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.createNameInput(centerX)

    this.validationText = this.add
      .text(centerX, 376, '', {
        color: '#b42318',
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    createTextButton(this, centerX, 430, 'PLAY', () => this.startGame())
    createTextButton(this, centerX, 520, 'HOW TO PLAY', () => {
      this.startInformationalScene(SCENE_KEYS.HOW_TO_PLAY)
    })
    createTextButton(this, centerX, 610, 'LEADERBOARD', () => {
      this.startInformationalScene(SCENE_KEYS.LEADERBOARD)
    })

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

  private createNameInput(x: number): void {
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
    this.positionNameInput(x, 320)
  }

  private readonly scheduleNameInputPosition = (): void => {
    if (this.positionFrame !== undefined) {
      window.cancelAnimationFrame(this.positionFrame)
    }

    this.positionFrame = window.requestAnimationFrame(() => {
      this.positionFrame = undefined
      this.positionNameInput(GAME_WIDTH / 2, 320)
    })
  }

  private positionNameInput(logicalX: number, logicalY: number): void {
    if (!this.nameInput) {
      return
    }

    const canvasBounds = this.game.canvas.getBoundingClientRect()
    const scale = canvasBounds.width / GAME_WIDTH
    const inputWidth = Math.min(380 * scale, canvasBounds.width - 32)
    const inputHeight = Math.max(40, 56 * scale)
    this.nameInput.style.left = `${canvasBounds.left + logicalX * scale}px`
    this.nameInput.style.top = `${canvasBounds.top + logicalY * scale}px`
    this.nameInput.style.width = `${inputWidth}px`
    this.nameInput.style.height = `${inputHeight}px`
    this.nameInput.style.fontSize = `${Math.max(16, 24 * scale)}px`
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
