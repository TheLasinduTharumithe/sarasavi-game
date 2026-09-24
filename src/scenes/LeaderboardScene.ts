import Phaser from 'phaser'
import { SCENE_KEYS } from '../game/constants'
import { getSceneDimensions } from '../game/layout'
import {
  loadTodaysLeaderboard,
  type LeaderboardEntry,
} from '../firebase/leaderboard'
import { resolvePlayerName } from '../game/playerName'
import {
  createBookFairBackground,
  createBrandLabel,
  createPaperPanel,
} from '../game/presentation'
import type { PlayerNameSceneData } from '../game/types'
import { createTextButton } from '../game/ui'

const PODIUM_STYLES = [
  { background: 0xfff4cc, rank: '#9a6b00' },
  { background: 0xe8eef5, rank: '#536475' },
  { background: 0xf8e2d3, rank: '#98572c' },
] as const

export class LeaderboardScene extends Phaser.Scene {
  private playerName = ''
  private requestId = 0
  private stateObjects: Phaser.GameObjects.GameObject[] = []
  private centerX = 0
  private tableLeft = 190
  private tableRight = 1090
  private tableHeaderY = 162
  private rowStartY = 205
  private rowSpacing = 38
  private rowHeight = 33
  private portrait = false

  constructor() {
    super(SCENE_KEYS.LEADERBOARD)
  }

  init(data?: PlayerNameSceneData): void {
    this.playerName = resolvePlayerName(data?.playerName)
    this.requestId = 0
    this.stateObjects = []
  }

  create(): void {
    const { width, height, portrait } = getSceneDimensions(this)
    const centerX = width / 2
    this.centerX = centerX
    this.portrait = portrait
    this.tableLeft = portrait ? 60 : 190
    this.tableRight = portrait ? width - 60 : width - 190
    this.tableHeaderY = portrait ? 285 : 162
    this.rowStartY = portrait ? 345 : 205
    this.rowSpacing = portrait ? 68 : 38
    this.rowHeight = portrait ? 56 : 33

    createBookFairBackground(this)
    createPaperPanel(
      this,
      centerX,
      portrait ? 650 : 382,
      portrait ? 660 : 980,
      portrait ? 1130 : 600,
    )
    createBrandLabel(this, portrait ? 130 : 65)

    this.add
      .text(centerX, portrait ? 225 : 130, "TODAY'S TOP PLAYERS", {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: portrait ? '42px' : '50px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: portrait ? 620 : 1000 },
      })
      .setOrigin(0.5)

    createTextButton(
      this,
      portrait ? 190 : centerX - 185,
      portrait ? height - 105 : height - 58,
      'PLAY',
      () => {
        if (this.playerName) {
          this.scene.start(SCENE_KEYS.GAME, { playerName: this.playerName })
        } else {
          this.scene.start(SCENE_KEYS.HOME)
        }
      },
      { width: portrait ? 290 : 320, height: 80, radius: 14 },
    )

    createTextButton(
      this,
      portrait ? width - 190 : centerX + 185,
      portrait ? height - 105 : height - 58,
      'HOME',
      () => this.scene.start(SCENE_KEYS.HOME),
      { width: portrait ? 290 : 320, height: 80, radius: 14 },
    )

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
    void this.loadLeaderboard()
  }

  private async loadLeaderboard(): Promise<void> {
    const activeRequestId = ++this.requestId

    if (!navigator.onLine) {
      this.showUnavailableState('Leaderboard unavailable while offline.')
      return
    }

    this.showStatus('Loading leaderboard...')

    const result = await loadTodaysLeaderboard()

    if (!this.sys.isActive() || activeRequestId !== this.requestId) {
      return
    }

    if (result.status === 'unavailable') {
      this.showUnavailableState(
        navigator.onLine
          ? 'Leaderboard is temporarily unavailable.'
          : 'Leaderboard unavailable while offline.',
      )
      return
    }

    if (result.entries.length === 0) {
      this.showStatus('No scores yet. Be the first champion!')
      return
    }

    this.showLeaderboard(result.entries)
  }

  private showLeaderboard(entries: LeaderboardEntry[]): void {
    this.clearStateObjects()
    this.addStateText(this.tableLeft + 20, this.tableHeaderY, 'RANK', {
      originX: 0,
      color: '#1f3a5f',
      fontSize: '20px',
      fontStyle: 'bold',
    })
    this.addStateText(
      this.portrait ? this.tableLeft + 125 : 350,
      this.tableHeaderY,
      'PLAYER',
      {
      originX: 0,
      color: '#1f3a5f',
      fontSize: '20px',
      fontStyle: 'bold',
      },
    )
    this.addStateText(this.tableRight - 20, this.tableHeaderY, 'SCORE', {
      originX: 1,
      color: '#1f3a5f',
      fontSize: '20px',
      fontStyle: 'bold',
    })

    entries.slice(0, 10).forEach((entry, index) => {
      this.addLeaderboardRow(index, entry)
    })
  }

  private addLeaderboardRow(index: number, entry: LeaderboardEntry): void {
    const y = this.rowStartY + index * this.rowSpacing
    const podiumStyle = PODIUM_STYLES[index]
    const background = this.add
      .rectangle(
        this.centerX,
        y,
        this.tableRight - this.tableLeft,
        this.rowHeight,
        podiumStyle?.background ?? 0xffffff,
        podiumStyle ? 1 : 0.68,
      )
      .setStrokeStyle(1, podiumStyle?.background ?? 0xd8dee5)

    this.stateObjects.push(background)
    this.addStateText(this.tableLeft + 40, y, String(index + 1), {
      originX: 0.5,
      color: podiumStyle?.rank ?? '#3d3d3d',
      fontSize: '23px',
      fontStyle: index < 3 ? 'bold' : 'normal',
    })
    this.addStateText(this.portrait ? this.tableLeft + 125 : 350, y, entry.playerName, {
      originX: 0,
      color: '#263645',
      fontSize: '23px',
      fontStyle: index < 3 ? 'bold' : 'normal',
    })
    this.addStateText(this.tableRight - 28, y, String(entry.score), {
      originX: 1,
      color: '#7b241c',
      fontSize: '23px',
      fontStyle: 'bold',
    })
  }

  private showStatus(message: string): void {
    this.clearStateObjects()
    this.addStateText(this.centerX, this.portrait ? 540 : 330, message, {
      originX: 0.5,
      color: '#3d3d3d',
      fontSize: '28px',
      fontStyle: 'normal',
    })
  }

  private showUnavailableState(message: string): void {
    this.showStatus(message)

    const retryButton = createTextButton(
      this,
      this.centerX,
      this.portrait ? 690 : 430,
      'RETRY',
      () => void this.loadLeaderboard(),
      { width: this.portrait ? 440 : 280, height: 80, radius: 14 },
    )
    this.stateObjects.push(retryButton)
  }

  private addStateText(
    x: number,
    y: number,
    value: string,
    options: {
      originX: number
      color: string
      fontSize: string
      fontStyle: string
    },
  ): void {
    const text = this.add
      .text(x, y, value, {
        color: options.color,
        fontFamily: 'Arial, sans-serif',
        fontSize: options.fontSize,
        fontStyle: options.fontStyle,
      })
      .setOrigin(options.originX, 0.5)

    this.stateObjects.push(text)
  }

  private clearStateObjects(): void {
    for (const gameObject of this.stateObjects) {
      gameObject.destroy()
    }
    this.stateObjects = []
  }

  private handleShutdown(): void {
    this.requestId += 1
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
    this.clearStateObjects()
  }
}
