import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../game/constants'
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

const TABLE_LEFT = 190
const TABLE_RIGHT = GAME_WIDTH - 190
const ROW_START_Y = 205
const ROW_SPACING = 38

const PODIUM_STYLES = [
  { background: 0xfff4cc, rank: '#9a6b00' },
  { background: 0xe8eef5, rank: '#536475' },
  { background: 0xf8e2d3, rank: '#98572c' },
] as const

export class LeaderboardScene extends Phaser.Scene {
  private playerName = ''
  private requestId = 0
  private stateObjects: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super(SCENE_KEYS.LEADERBOARD)
  }

  init(data?: PlayerNameSceneData): void {
    this.playerName = resolvePlayerName(data?.playerName)
    this.requestId = 0
    this.stateObjects = []
  }

  create(): void {
    const centerX = GAME_WIDTH / 2
    createBookFairBackground(this)
    createPaperPanel(this, centerX, 382, 980, 600)
    createBrandLabel(this, 65)

    this.add
      .text(centerX, 130, "TODAY'S TOP PLAYERS", {
        color: '#1f3a5f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '50px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    createTextButton(
      this,
      centerX - 185,
      GAME_HEIGHT - 58,
      'PLAY',
      () => {
        if (this.playerName) {
          this.scene.start(SCENE_KEYS.GAME, { playerName: this.playerName })
        } else {
          this.scene.start(SCENE_KEYS.HOME)
        }
      },
      { width: 320, height: 60, radius: 14 },
    )

    createTextButton(
      this,
      centerX + 185,
      GAME_HEIGHT - 58,
      'HOME',
      () => this.scene.start(SCENE_KEYS.HOME),
      { width: 320, height: 60, radius: 14 },
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
    this.addStateText(TABLE_LEFT + 20, 162, 'RANK', {
      originX: 0,
      color: '#1f3a5f',
      fontSize: '20px',
      fontStyle: 'bold',
    })
    this.addStateText(350, 162, 'PLAYER', {
      originX: 0,
      color: '#1f3a5f',
      fontSize: '20px',
      fontStyle: 'bold',
    })
    this.addStateText(TABLE_RIGHT - 20, 162, 'SCORE', {
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
    const y = ROW_START_Y + index * ROW_SPACING
    const podiumStyle = PODIUM_STYLES[index]
    const background = this.add
      .rectangle(
        GAME_WIDTH / 2,
        y,
        TABLE_RIGHT - TABLE_LEFT,
        33,
        podiumStyle?.background ?? 0xffffff,
        podiumStyle ? 1 : 0.68,
      )
      .setStrokeStyle(1, podiumStyle?.background ?? 0xd8dee5)

    this.stateObjects.push(background)
    this.addStateText(TABLE_LEFT + 40, y, String(index + 1), {
      originX: 0.5,
      color: podiumStyle?.rank ?? '#3d3d3d',
      fontSize: '23px',
      fontStyle: index < 3 ? 'bold' : 'normal',
    })
    this.addStateText(350, y, entry.playerName, {
      originX: 0,
      color: '#263645',
      fontSize: '23px',
      fontStyle: index < 3 ? 'bold' : 'normal',
    })
    this.addStateText(TABLE_RIGHT - 28, y, String(entry.score), {
      originX: 1,
      color: '#7b241c',
      fontSize: '23px',
      fontStyle: 'bold',
    })
  }

  private showStatus(message: string): void {
    this.clearStateObjects()
    this.addStateText(GAME_WIDTH / 2, 330, message, {
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
      GAME_WIDTH / 2,
      430,
      'RETRY',
      () => void this.loadLeaderboard(),
      { width: 280, height: 60, radius: 14 },
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
