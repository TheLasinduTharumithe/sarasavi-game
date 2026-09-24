import Phaser from 'phaser'
import {
  GAME_DURATION,
  SCENE_KEYS,
} from '../game/constants'
import { getSceneDimensions } from '../game/layout'
import { RoundTimerManager } from '../game/managers/RoundTimerManager'
import { ScoreManager } from '../game/managers/ScoreManager'
import { SpawnManager } from '../game/managers/SpawnManager'
import { Basket } from '../game/objects/Basket'
import { FallingItem } from '../game/objects/FallingItem'
import { resolvePlayerName } from '../game/playerName'
import {
  createBookFairBackground,
  createLogoSeal,
  createPaperPanel,
} from '../game/presentation'
import { audioManager } from '../game/managers/AudioManager'
import { prefersReducedMotion } from '../game/motion'
import type { GameSceneData, GameState } from '../game/types'
import { createTextButton } from '../game/ui'
import { saveScore } from '../firebase/scores'

type ArcadeOverlapObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile

export class GameScene extends Phaser.Scene {
  private gameState: GameState = 'READY'
  private playerName = ''
  private submissionId = ''
  private basket?: Basket
  private spawnManager?: SpawnManager
  private scoreManager?: ScoreManager
  private roundTimer?: RoundTimerManager
  private basketItemOverlap?: Phaser.Physics.Arcade.Collider

  constructor() {
    super(SCENE_KEYS.GAME)
  }

  init(data?: Partial<GameSceneData>): void {
    this.playerName = resolvePlayerName(data?.playerName)
  }

  create(): void {
    this.gameState = 'READY'
    this.submissionId = Phaser.Utils.String.UUID()

    if (!this.playerName) {
      this.scene.start(SCENE_KEYS.HOME)
      return
    }

    const { width, portrait } = getSceneDimensions(this)
    const hudY = portrait ? 105 : 66
    const hudPanelWidth = portrait ? 210 : 170
    const hudPanelHeight = portrait ? 120 : 94
    const scorePanelX = portrait ? 130 : 224
    const timePanelX = portrait ? width - 130 : width - 224
    const titleY = portrait ? 205 : 62

    createBookFairBackground(this, { gameplay: true })
    createPaperPanel(
      this,
      scorePanelX,
      hudY,
      hudPanelWidth,
      hudPanelHeight,
    )
    createPaperPanel(
      this,
      timePanelX,
      hudY,
      hudPanelWidth,
      hudPanelHeight,
    )

    createLogoSeal(
      this,
      portrait ? 150 : width / 2 - 205,
      titleY,
      portrait ? 54 : 48,
    ).setDepth(101)

    this.add
      .text(
        portrait ? 425 : width / 2 + 28,
        titleY,
        'CATCH THE BOOKS',
        {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: portrait ? '34px' : '38px',
        fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(101)

    this.basket = new Basket(this)
    this.basket.setGameplayInputEnabled(false)
    this.scoreManager = new ScoreManager(this)
    this.roundTimer = new RoundTimerManager(this)
    this.spawnManager = new SpawnManager(this, () =>
      this.roundTimer?.getProgress() ?? 0,
    )

    this.basketItemOverlap = this.physics.add.overlap(
      this.basket,
      this.spawnManager.items,
      this.handleBasketItemOverlap,
      undefined,
      this,
    )
    this.basketItemOverlap.active = false

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
    this.gameState = 'COUNTDOWN'
    this.roundTimer.startCountdown(
      () => this.beginGameplay(),
      () => this.finishGame(),
    )
  }

  update(_time: number, delta: number): void {
    if (this.gameState !== 'PLAYING') {
      return
    }

    this.basket?.update(delta)
    this.spawnManager?.update()
  }

  private beginGameplay(): void {
    if (this.gameState !== 'COUNTDOWN') {
      return
    }

    this.gameState = 'PLAYING'
    this.basket?.setGameplayInputEnabled(true)
    this.scoreManager?.start()
    this.spawnManager?.start()

    if (this.basketItemOverlap) {
      this.basketItemOverlap.active = true
    }
  }

  private handleBasketItemOverlap(
    _basketObject: ArcadeOverlapObject,
    itemObject: ArcadeOverlapObject,
  ): void {
    if (
      this.gameState !== 'PLAYING' ||
      !(itemObject instanceof FallingItem)
    ) {
      return
    }

    const itemType = itemObject.itemType
    const catchX = itemObject.x
    const catchY = itemObject.y

    if (!itemObject.collect()) {
      return
    }

    this.scoreManager?.recordItemCatch(itemType, catchX, catchY)

    if (itemType === 'phone' || itemType === 'coffee') {
      this.basket?.playPenaltyShake()
    }
  }

  private finishGame(): void {
    if (this.gameState === 'FINISHED') {
      return
    }

    this.gameState = 'FINISHED'
    audioManager.play('gameOver')
    this.roundTimer?.stop()
    this.spawnManager?.stop(true)
    this.scoreManager?.stop()
    this.basket?.setGameplayInputEnabled(false)

    if (this.basketItemOverlap) {
      this.basketItemOverlap.active = false
    }

    const stats = this.scoreManager?.getStats() ?? {
      score: 0,
      booksCaught: 0,
      goldenBooksCaught: 0,
      phoneItemsCaught: 0,
      coffeeItemsCaught: 0,
      totalDistractionsCaught: 0,
    }

    const { width, height, portrait } = getSceneDimensions(this)
    const centerX = width / 2
    const centerY = height / 2

    const timeUpText = this.add
      .text(centerX, centerY, "TIME'S UP!", {
        color: '#c0392b',
        fontFamily: 'Arial, sans-serif',
        fontSize: portrait ? '66px' : '76px',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(300)
      .setScale(0.85)

    // Queue the completed score now so choosing an immediate replay cannot
    // skip it. saveScore de-duplicates this submission if ResultScene opens.
    void saveScore(
      {
        playerName: this.playerName,
        stats: { ...stats },
        gameDurationSeconds: GAME_DURATION,
      },
      this.submissionId,
    )

    createTextButton(
      this,
      portrait ? centerX : centerX - 185,
      centerY + (portrait ? 150 : 125),
      'PLAY AGAIN',
      () => this.replayGame(),
      { width: portrait ? 470 : 320, height: 80, radius: 14 },
    ).setDepth(301)

    createTextButton(
      this,
      portrait ? centerX : centerX + 185,
      centerY + (portrait ? 270 : 125),
      'VIEW RESULTS',
      () => this.openResultScene(stats),
      { width: portrait ? 470 : 320, height: 80, radius: 14 },
    ).setDepth(301)

    if (prefersReducedMotion()) {
      return
    }

    this.tweens.add({
      targets: timeUpText,
      scale: 1.08,
      duration: 300,
      yoyo: true,
      hold: 500,
      ease: 'Sine.easeInOut',
    })
  }

  private replayGame(): void {
    // Restart the currently active GameScene. Starting an already-running
    // scene can be ignored by Phaser and leave the game-over screen visible.
    this.scene.restart({ playerName: this.playerName })
  }

  private openResultScene(stats: ReturnType<ScoreManager['getStats']>): void {
    this.scene.start(SCENE_KEYS.RESULT, {
      playerName: this.playerName,
      stats,
      gameDurationSeconds: GAME_DURATION,
      submissionId: this.submissionId,
    })
  }

  private handleShutdown(): void {
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)

    // Arcade Physics owns colliders and destroys them during Scene shutdown.
    // Avoid touching a collider whose World may already have been disposed.
    this.spawnManager?.destroy()
    this.roundTimer?.destroy()
    this.scoreManager?.stop()

    this.basketItemOverlap = undefined
    this.spawnManager = undefined
    this.scoreManager = undefined
    this.roundTimer = undefined
    this.basket = undefined
    this.gameState = 'FINISHED'
  }
}
