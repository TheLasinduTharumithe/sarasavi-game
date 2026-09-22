import Phaser from 'phaser'
import {
  GAME_DURATION,
  GAME_HEIGHT,
  GAME_WIDTH,
  SCENE_KEYS,
} from '../game/constants'
import { saveScore } from '../firebase/scores'
import { getAchievementTitle } from '../game/logic/achievement'
import { createEmptyGameStats } from '../game/logic/score'
import { resolvePlayerName } from '../game/playerName'
import {
  createBookFairBackground,
  createBrandLabel,
  createPaperPanel,
} from '../game/presentation'
import type { GameStats, ResultSceneData } from '../game/types'
import { createTextButton } from '../game/ui'

export class ResultScene extends Phaser.Scene {
  private playerName = ''
  private stats: GameStats = createEmptyGameStats()
  private gameDurationSeconds = GAME_DURATION
  private submissionId = ''
  private scoreSubmissionStarted = false
  private saveStatusText?: Phaser.GameObjects.Text

  constructor() {
    super(SCENE_KEYS.RESULT)
  }

  init(data?: Partial<ResultSceneData>): void {
    this.playerName = resolvePlayerName(data?.playerName)
    this.stats = data?.stats ? { ...data.stats } : createEmptyGameStats()
    this.gameDurationSeconds = data?.gameDurationSeconds ?? GAME_DURATION
    this.submissionId = data?.submissionId ?? ''
    this.scoreSubmissionStarted = false
    this.saveStatusText = undefined
  }

  create(): void {
    const centerX = GAME_WIDTH / 2
    const achievement = getAchievementTitle(this.stats.score)
    createBookFairBackground(this)
    createPaperPanel(this, centerX, 378, 1100, 600)
    createBrandLabel(this, 65)

    this.add
      .text(centerX, 122, `GREAT JOB, ${this.playerName}!`, {
        color: '#7b241c',
        fontFamily: 'Arial, sans-serif',
        fontSize: '46px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.saveStatusText = this.add
      .text(centerX, 515, 'Saving score...', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    void this.submitScore()

    this.addResultValue(centerX, 184, 'FINAL SCORE', this.stats.score, 54)
    this.addResultValue(300, 315, 'BOOKS CAUGHT', this.stats.booksCaught)
    this.addResultValue(
      centerX,
      315,
      'GOLDEN BOOKS',
      this.stats.goldenBooksCaught,
    )
    this.addResultValue(
      GAME_WIDTH - 300,
      315,
      'DISTRACTIONS CAUGHT',
      this.stats.totalDistractionsCaught,
    )

    this.add
      .text(centerX, 422, 'ACHIEVEMENT', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, 467, achievement, {
        color: '#b77900',
        fontFamily: 'Arial, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    createTextButton(
      this,
      240,
      GAME_HEIGHT - 95,
      'PLAY AGAIN',
      () => {
        this.scene.start(SCENE_KEYS.GAME, { playerName: this.playerName })
      },
      { width: 300, height: 64, radius: 14 },
    )

    createTextButton(
      this,
      centerX,
      GAME_HEIGHT - 95,
      'VIEW LEADERBOARD',
      () => {
        this.scene.start(SCENE_KEYS.LEADERBOARD, {
          playerName: this.playerName,
        })
      },
      { width: 360, height: 64, radius: 14 },
    )

    createTextButton(
      this,
      GAME_WIDTH - 240,
      GAME_HEIGHT - 95,
      'HOME',
      () => this.scene.start(SCENE_KEYS.HOME),
      { width: 300, height: 64, radius: 14 },
    )
  }

  private addResultValue(
    x: number,
    y: number,
    label: string,
    value: number,
    valueFontSize = 44,
  ): void {
    this.add
      .text(x, y, label, {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(x, y + 48, String(value), {
        color: '#7b241c',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${valueFontSize}px`,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
  }

  private async submitScore(): Promise<void> {
    if (this.scoreSubmissionStarted) {
      return
    }

    this.scoreSubmissionStarted = true

    if (!this.submissionId) {
      this.setSaveStatus(
        'Score could not be uploaded. You can still keep playing.',
        '#8a3b12',
      )
      return
    }

    const status = await saveScore(
      {
        playerName: this.playerName,
        stats: { ...this.stats },
        gameDurationSeconds: this.gameDurationSeconds,
      },
      this.submissionId,
    )

    if (!this.sys.isActive()) {
      return
    }

    if (status === 'saved') {
      this.setSaveStatus('Score saved!', '#278a45')
      return
    }

    this.setSaveStatus(
      'Score could not be uploaded. You can still keep playing.',
      '#8a3b12',
    )
  }

  private setSaveStatus(message: string, color: string): void {
    this.saveStatusText?.setText(message).setColor(color)
  }

}
