import Phaser from 'phaser'
import {
  GAME_DURATION,
  SCENE_KEYS,
} from '../game/constants'
import { getSceneDimensions } from '../game/layout'
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
    const { width, height, portrait } = getSceneDimensions(this)
    const centerX = width / 2
    const achievement = getAchievementTitle(this.stats.score)
    createBookFairBackground(this)
    createPaperPanel(
      this,
      centerX,
      portrait ? 650 : 378,
      portrait ? 660 : 1100,
      portrait ? 1130 : 600,
    )
    createBrandLabel(this, portrait ? 130 : 65)

    this.add
      .text(
        centerX,
        portrait ? 225 : 132,
        `GREAT JOB, ${this.playerName}!`,
        {
        color: '#7b241c',
        fontFamily: 'Arial, sans-serif',
        fontSize: portrait ? '42px' : '46px',
        fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: portrait ? 600 : 1000 },
        },
      )
      .setOrigin(0.5)

    this.saveStatusText = this.add
      .text(centerX, portrait ? 820 : 515, 'Saving score...', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: portrait ? '20px' : '22px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: portrait ? 590 : 900 },
      })
      .setOrigin(0.5)

    void this.submitScore()

    this.addResultValue(
      centerX,
      portrait ? 305 : 184,
      'FINAL SCORE',
      this.stats.score,
      54,
    )

    if (portrait) {
      this.addResultValue(190, 455, 'BOOKS CAUGHT', this.stats.booksCaught)
      this.addResultValue(
        width - 190,
        455,
        'GOLDEN BOOKS',
        this.stats.goldenBooksCaught,
      )
      this.addResultValue(
        centerX,
        585,
        'DISTRACTIONS CAUGHT',
        this.stats.totalDistractionsCaught,
      )
    } else {
      this.addResultValue(300, 315, 'BOOKS CAUGHT', this.stats.booksCaught)
      this.addResultValue(
        centerX,
        315,
        'GOLDEN BOOKS',
        this.stats.goldenBooksCaught,
      )
      this.addResultValue(
        width - 300,
        315,
        'DISTRACTIONS CAUGHT',
        this.stats.totalDistractionsCaught,
      )
    }

    this.add
      .text(centerX, portrait ? 705 : 422, 'ACHIEVEMENT', {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, portrait ? 755 : 467, achievement, {
        color: '#b77900',
        fontFamily: 'Arial, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    createTextButton(
      this,
      portrait ? centerX : 240,
      portrait ? 945 : height - 95,
      'PLAY AGAIN',
      () => {
        this.scene.start(SCENE_KEYS.GAME, { playerName: this.playerName })
      },
      { width: portrait ? 500 : 300, height: 80, radius: 14 },
    )

    createTextButton(
      this,
      centerX,
      portrait ? 1055 : height - 95,
      'VIEW LEADERBOARD',
      () => {
        this.scene.start(SCENE_KEYS.LEADERBOARD, {
          playerName: this.playerName,
        })
      },
      { width: portrait ? 500 : 360, height: 80, radius: 14 },
    )

    createTextButton(
      this,
      portrait ? centerX : width - 240,
      portrait ? 1165 : height - 95,
      'HOME',
      () => this.scene.start(SCENE_KEYS.HOME),
      { width: portrait ? 500 : 300, height: 80, radius: 14 },
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
