import Phaser from 'phaser'
import {
  DIFFICULTY_CONFIG,
  GAME_HEIGHT,
  ITEM_SPAWN_PROBABILITIES,
  MAX_ACTIVE_ITEMS,
} from '../constants'
import {
  interpolateDifficultyRange,
  type DifficultyRanges,
  type NumericRange,
} from '../logic/difficulty'
import { FallingItem } from '../objects/FallingItem'
import type { FallingItemType } from '../types'

const HORIZONTAL_SAFE_MARGIN = 20
const ITEM_ROLL_ORDER: readonly FallingItemType[] = [
  'normalBook',
  'phone',
  'coffee',
  'goldenBook',
]

export class SpawnManager {
  readonly items: Phaser.Physics.Arcade.Group

  private readonly scene: Phaser.Scene
  private readonly maximumActiveItems: number
  private readonly getRoundProgress: () => number
  private spawnEvent?: Phaser.Time.TimerEvent
  private isRunning = false
  private isDestroyed = false

  constructor(
    scene: Phaser.Scene,
    getRoundProgress: () => number,
    maximumActiveItems = MAX_ACTIVE_ITEMS,
  ) {
    this.scene = scene
    this.getRoundProgress = getRoundProgress
    this.maximumActiveItems = maximumActiveItems
    FallingItem.createItemTextures(scene)
    this.items = scene.physics.add.group()

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
  }

  start(): void {
    if (this.isRunning || this.isDestroyed) {
      return
    }

    this.isRunning = true
    this.scheduleNextSpawn()
  }

  stop(clearActiveItems = true): void {
    this.isRunning = false
    this.spawnEvent?.remove(false)
    this.spawnEvent = undefined

    if (clearActiveItems) {
      this.items.clear(true, true)
    }
  }

  update(): void {
    const removalY = this.scene.scale.gameSize.height + FallingItem.HEIGHT / 2

    for (const child of this.items.getChildren()) {
      if (child instanceof FallingItem && child.y > removalY) {
        child.destroy()
      }
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)

    // Scene shutdown owns destruction of the Arcade Physics group and its
    // children. At this point Phaser may already have cleared Group.children,
    // so only cancel our scheduling state here.
    this.stop(false)
  }

  private scheduleNextSpawn(): void {
    if (!this.isRunning || this.isDestroyed) {
      return
    }

    const intervalRange = this.interpolateDifficultyRange(
      DIFFICULTY_CONFIG.spawnIntervalMs,
    )
    const delay = Phaser.Math.Between(
      Math.round(intervalRange.min),
      Math.round(intervalRange.max),
    )

    this.spawnEvent = this.scene.time.delayedCall(delay, () => {
      this.spawnEvent = undefined

      if (!this.isRunning || this.isDestroyed) {
        return
      }

      this.spawnItem()
      this.scheduleNextSpawn()
    })
  }

  private spawnItem(): void {
    if (this.items.countActive(true) >= this.maximumActiveItems) {
      return
    }

    const gameWidth = this.scene.scale.gameSize.width
    const halfItemWidth = FallingItem.WIDTH / 2
    const minimumX = Math.ceil(halfItemWidth + HORIZONTAL_SAFE_MARGIN)
    const maximumX = Math.floor(
      gameWidth - halfItemWidth - HORIZONTAL_SAFE_MARGIN,
    )
    const speedRange = this.interpolateDifficultyRange(
      DIFFICULTY_CONFIG.fallingSpeed,
    )
    const verticalScale = this.scene.scale.gameSize.height / GAME_HEIGHT

    const x = Phaser.Math.Between(minimumX, Math.max(minimumX, maximumX))
    const fallSpeed = Phaser.Math.Between(
      Math.round(speedRange.min * verticalScale),
      Math.round(speedRange.max * verticalScale),
    )
    const itemType = this.chooseItemType()
    const item = new FallingItem(this.scene, x, fallSpeed, itemType)
    this.items.add(item)

    // Arcade Physics Groups apply their default velocity (0, 0) when a child
    // is added. Restore this item's configured speed after the group callback.
    item.setVelocityY(fallSpeed)
  }

  private chooseItemType(): FallingItemType {
    const roll = Math.random()
    let cumulativeProbability = 0

    for (const itemType of ITEM_ROLL_ORDER) {
      cumulativeProbability += ITEM_SPAWN_PROBABILITIES[itemType]
      if (roll < cumulativeProbability) {
        return itemType
      }
    }

    return 'normalBook'
  }

  private interpolateDifficultyRange(ranges: DifficultyRanges): NumericRange {
    return interpolateDifficultyRange(ranges, this.getRoundProgress())
  }
}
