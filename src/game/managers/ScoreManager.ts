import Phaser from 'phaser'
import {
  COFFEE_PENALTY,
  GOLDEN_BOOK_SCORE,
  NORMAL_BOOK_SCORE,
  PHONE_PENALTY,
} from '../constants'
import { applyItemCatch, createEmptyGameStats } from '../logic/score'
import { audioManager } from './AudioManager'
import type { FallingItemType, GameStats } from '../types'

interface FeedbackStyle {
  message: string
  color: string
}

const SCORE_HUD_X = 170

export class ScoreManager {
  private readonly scene: Phaser.Scene
  private stats: GameStats = createEmptyGameStats()

  private readonly scoreValueText: Phaser.GameObjects.Text
  private scoringEnabled = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    scene.add
      .text(SCORE_HUD_X, 30, 'SCORE', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setDepth(100)

    this.scoreValueText = scene.add
      .text(SCORE_HUD_X, 58, '000', {
        color: '#7b241c',
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setDepth(100)
  }

  start(): void {
    this.scoringEnabled = true
  }

  stop(): void {
    this.scoringEnabled = false
  }

  recordItemCatch(itemType: FallingItemType, x: number, y: number): void {
    if (!this.scoringEnabled) {
      return
    }

    const feedback = this.applyItemResult(itemType)
    this.updateHud()
    this.showCatchFeedback(x, y, feedback)
  }

  getStats(): GameStats {
    return { ...this.stats }
  }

  private applyItemResult(itemType: FallingItemType): FeedbackStyle {
    this.stats = applyItemCatch(this.stats, itemType)

    switch (itemType) {
      case 'normalBook':
        audioManager.play('normalBook')
        return { message: `+${NORMAL_BOOK_SCORE}`, color: '#278a45' }
      case 'goldenBook':
        audioManager.play('goldenBook')
        return { message: `+${GOLDEN_BOOK_SCORE} BONUS!`, color: '#b77900' }
      case 'phone':
        audioManager.play('negative')
        return { message: `-${PHONE_PENALTY}`, color: '#c0392b' }
      case 'coffee':
        audioManager.play('negative')
        return { message: `-${COFFEE_PENALTY}`, color: '#c0392b' }
    }
  }

  private updateHud(): void {
    this.scoreValueText.setText(String(this.stats.score).padStart(3, '0'))
  }

  private showCatchFeedback(
    x: number,
    y: number,
    feedbackStyle: FeedbackStyle,
  ): void {
    const feedback = this.scene.add
      .text(x, y, feedbackStyle.message, {
        color: feedbackStyle.color,
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(110)

    this.scene.tweens.add({
      targets: feedback,
      y: y - 60,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => feedback.destroy(),
    })
  }
}
