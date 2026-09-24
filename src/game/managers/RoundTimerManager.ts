import Phaser from 'phaser'
import { GAME_DURATION } from '../constants'
import { getSceneDimensions } from '../layout'
import { prefersReducedMotion } from '../motion'
import { audioManager } from './AudioManager'

const COUNTDOWN_VALUES = ['3', '2', '1'] as const
export class RoundTimerManager {
  private readonly scene: Phaser.Scene
  private readonly timeValueText: Phaser.GameObjects.Text
  private countdownText?: Phaser.GameObjects.Text
  private finalCountdownText?: Phaser.GameObjects.Text
  private countdownEvent?: Phaser.Time.TimerEvent
  private roundEvent?: Phaser.Time.TimerEvent
  private remainingSeconds = GAME_DURATION
  private isDestroyed = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const { width, portrait } = getSceneDimensions(scene)
    const hudX = portrait ? width - 60 : width - 170
    const labelY = portrait ? 58 : 30
    const valueY = portrait ? 88 : 58

    scene.add
      .text(hudX, labelY, 'TIME', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(100)

    this.timeValueText = scene.add
      .text(hudX, valueY, this.formatTime(GAME_DURATION), {
        color: '#7b241c',
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(100)

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
  }

  startCountdown(onGo: () => void, onComplete: () => void): void {
    if (this.countdownEvent || this.roundEvent || this.isDestroyed) {
      return
    }

    let countdownIndex = 0
    this.countdownText = this.createCenteredText(COUNTDOWN_VALUES[0], 92)
    audioManager.play('countdown')

    this.countdownEvent = this.scene.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN_VALUES.length - 1,
      callback: () => {
        countdownIndex += 1

        if (countdownIndex < COUNTDOWN_VALUES.length) {
          this.countdownText?.setText(COUNTDOWN_VALUES[countdownIndex])
          this.pulseText(this.countdownText)
          audioManager.play('countdown')
          return
        }

        this.countdownEvent = undefined
        this.countdownText?.setText('GO!')
        this.pulseText(this.countdownText)
        audioManager.play('go')
        onGo()
        this.startRoundTimer(onComplete)

        const goText = this.countdownText
        if (goText) {
          this.scene.tweens.add({
            targets: goText,
            alpha: 0,
            duration: 650,
            delay: 250,
            onComplete: () => goText.destroy(),
          })
        }
        this.countdownText = undefined
      },
    })
  }

  getProgress(): number {
    return Phaser.Math.Clamp(
      (GAME_DURATION - this.remainingSeconds) / GAME_DURATION,
      0,
      1,
    )
  }

  stop(): void {
    this.countdownEvent?.remove(false)
    this.roundEvent?.remove(false)
    this.countdownEvent = undefined
    this.roundEvent = undefined

    if (this.countdownText) {
      this.scene.tweens.killTweensOf(this.countdownText)
      this.countdownText.destroy()
      this.countdownText = undefined
    }

    if (this.finalCountdownText) {
      this.scene.tweens.killTweensOf(this.finalCountdownText)
      this.finalCountdownText.destroy()
      this.finalCountdownText = undefined
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)

    // Phaser disposes Scene timers, tweens, and display objects during
    // shutdown. Clear our references without touching plugins that may have
    // already completed their own shutdown handlers.
    this.countdownEvent = undefined
    this.roundEvent = undefined
    this.countdownText = undefined
    this.finalCountdownText = undefined
  }

  private startRoundTimer(onComplete: () => void): void {
    this.remainingSeconds = GAME_DURATION
    this.updateTimeHud()

    this.roundEvent = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.remainingSeconds = Math.max(0, this.remainingSeconds - 1)
        this.updateTimeHud()

        if (this.remainingSeconds > 0 && this.remainingSeconds <= 5) {
          this.showFinalCountdown(this.remainingSeconds)
        }

        if (this.remainingSeconds === 0) {
          this.roundEvent?.remove(false)
          this.roundEvent = undefined
          this.clearFinalCountdown()
          onComplete()
        }
      },
    })
  }

  private updateTimeHud(): void {
    this.timeValueText.setText(this.formatTime(this.remainingSeconds))
  }

  private showFinalCountdown(value: number): void {
    this.clearFinalCountdown()
    this.finalCountdownText = this.createCenteredText(String(value), 74)
    const { portrait } = getSceneDimensions(this.scene)
    this.finalCountdownText.setY(portrait ? 330 : 190)
    this.pulseText(this.finalCountdownText)
  }

  private clearFinalCountdown(): void {
    if (!this.finalCountdownText) {
      return
    }

    this.scene.tweens.killTweensOf(this.finalCountdownText)
    this.finalCountdownText.destroy()
    this.finalCountdownText = undefined
  }

  private createCenteredText(
    value: string,
    fontSize: number,
  ): Phaser.GameObjects.Text {
    const { width, height } = getSceneDimensions(this.scene)
    return this.scene.add
      .text(width / 2, height / 2, value, {
        color: '#c0392b',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(200)
  }

  private pulseText(text?: Phaser.GameObjects.Text): void {
    if (!text) {
      return
    }

    if (prefersReducedMotion()) {
      text.setScale(1)
      return
    }

    this.scene.tweens.killTweensOf(text)
    text.setScale(0.88)
    this.scene.tweens.add({
      targets: text,
      scale: 1.08,
      duration: 220,
      yoyo: true,
      ease: 'Sine.easeInOut',
    })
  }

  private formatTime(seconds: number): string {
    return `00:${String(seconds).padStart(2, '0')}`
  }
}
