import Phaser from 'phaser'
import { BOOK_EMBLEM_TEXTURE_KEY } from '../constants'
import type { FallingItemType } from '../types'

interface BookStyle {
  textureKey: string
  coverColor: number
  spineColor: number
}

const ITEM_WIDTH = 72
const ITEM_HEIGHT = 96

const NORMAL_BOOK_STYLES: readonly BookStyle[] = [
  { textureKey: 'normal-book-red', coverColor: 0xd94a4a, spineColor: 0x9f2929 },
  { textureKey: 'normal-book-blue', coverColor: 0x3f7fd5, spineColor: 0x24559a },
  { textureKey: 'normal-book-green', coverColor: 0x49a86b, spineColor: 0x287442 },
  { textureKey: 'normal-book-orange', coverColor: 0xf29b38, spineColor: 0xb96216 },
]

const SPECIAL_TEXTURE_KEYS: Readonly<Record<Exclude<FallingItemType, 'normalBook'>, string>> = {
  goldenBook: 'golden-book',
  phone: 'phone-item',
  coffee: 'coffee-item',
}

export class FallingItem extends Phaser.Physics.Arcade.Sprite {
  static readonly WIDTH = ITEM_WIDTH
  static readonly HEIGHT = ITEM_HEIGHT

  readonly itemType: FallingItemType
  private hasBeenCaught = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    fallSpeed: number,
    itemType: FallingItemType,
  ) {
    FallingItem.createItemTextures(scene)

    super(scene, x, -ITEM_HEIGHT / 2, FallingItem.getTextureKey(itemType))

    this.itemType = itemType
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setVelocity(0, fallSpeed)
    this.setDepth(5)
    this.setAngle(Phaser.Math.Between(-7, 7))

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setSize(ITEM_WIDTH - 8, ITEM_HEIGHT - 6, true)
  }

  collect(): boolean {
    if (!this.active || this.hasBeenCaught) {
      return false
    }

    this.hasBeenCaught = true
    this.disableBody(true, true)
    this.destroy()
    return true
  }

  static createItemTextures(scene: Phaser.Scene): void {
    for (const style of NORMAL_BOOK_STYLES) {
      if (!scene.textures.exists(style.textureKey)) {
        FallingItem.createBookTexture(scene, style)
      }
    }

    FallingItem.createGoldenBookTexture(scene)
    FallingItem.createPhoneTexture(scene)
    FallingItem.createCoffeeTexture(scene)
  }

  private static getTextureKey(itemType: FallingItemType): string {
    if (itemType === 'normalBook') {
      const styleIndex = Phaser.Math.Between(0, NORMAL_BOOK_STYLES.length - 1)
      return NORMAL_BOOK_STYLES[styleIndex].textureKey
    }

    return SPECIAL_TEXTURE_KEYS[itemType]
  }

  private static createBookTexture(scene: Phaser.Scene, style: BookStyle): void {
    const graphic = scene.add.graphics().setVisible(false)
    FallingItem.drawBook(graphic, style.coverColor, style.spineColor)
    graphic.generateTexture(style.textureKey, ITEM_WIDTH, ITEM_HEIGHT)
    graphic.destroy()
    FallingItem.addBookEmblem(scene, style.textureKey, 44, 52, 27)
  }

  private static createGoldenBookTexture(scene: Phaser.Scene): void {
    const textureKey = SPECIAL_TEXTURE_KEYS.goldenBook
    if (scene.textures.exists(textureKey)) {
      return
    }

    const graphic = scene.add.graphics().setVisible(false)
    FallingItem.drawBook(graphic, 0xf6c945, 0xc28c12)
    graphic.fillStyle(0x8f6511, 1)
    graphic.fillPoints(FallingItem.createStarPoints(56, 19, 9, 4), true)
    graphic.fillStyle(0xfff4b8, 1)
    graphic.fillPoints(FallingItem.createStarPoints(56, 19, 5, 2), true)
    graphic.generateTexture(textureKey, ITEM_WIDTH, ITEM_HEIGHT)
    graphic.destroy()
    FallingItem.addBookEmblem(scene, textureKey, 43, 53, 31)
  }

  private static addBookEmblem(
    scene: Phaser.Scene,
    bookTextureKey: string,
    centerX: number,
    centerY: number,
    size: number,
  ): void {
    if (!scene.textures.exists(BOOK_EMBLEM_TEXTURE_KEY)) {
      return
    }

    const bookTexture = scene.textures.get(
      bookTextureKey,
    ) as Phaser.Textures.CanvasTexture
    const bookCanvas = bookTexture.getSourceImage()
    const emblemSource = scene.textures
      .get(BOOK_EMBLEM_TEXTURE_KEY)
      .getSourceImage() as CanvasImageSource

    if (!(bookCanvas instanceof HTMLCanvasElement)) {
      return
    }

    const context = bookCanvas.getContext('2d')
    if (!context) {
      return
    }

    const halfSize = size / 2
    context.save()
    context.beginPath()
    context.arc(centerX, centerY, halfSize, 0, Math.PI * 2)
    context.clip()
    context.drawImage(
      emblemSource,
      centerX - halfSize,
      centerY - halfSize,
      size,
      size,
    )
    context.restore()
    bookTexture.refresh()
  }

  private static createPhoneTexture(scene: Phaser.Scene): void {
    const textureKey = SPECIAL_TEXTURE_KEYS.phone
    if (scene.textures.exists(textureKey)) {
      return
    }

    const graphic = scene.add.graphics().setVisible(false)
    graphic.fillStyle(0x263238, 1)
    graphic.fillRoundedRect(10, 2, 52, 92, 10)
    graphic.fillStyle(0x64b5f6, 1)
    graphic.fillRoundedRect(15, 12, 42, 65, 5)
    graphic.fillStyle(0xffffff, 0.8)
    graphic.fillCircle(36, 85, 4)
    graphic.lineStyle(3, 0xffffff, 0.65)
    graphic.lineBetween(23, 21, 49, 21)
    graphic.lineStyle(5, 0xf7d154, 1)
    graphic.lineBetween(27, 43, 45, 61)
    graphic.lineBetween(45, 43, 27, 61)
    graphic.generateTexture(textureKey, ITEM_WIDTH, ITEM_HEIGHT)
    graphic.destroy()
  }

  private static createCoffeeTexture(scene: Phaser.Scene): void {
    const textureKey = SPECIAL_TEXTURE_KEYS.coffee
    if (scene.textures.exists(textureKey)) {
      return
    }

    const graphic = scene.add.graphics().setVisible(false)
    graphic.lineStyle(5, 0x8d5a36, 1)
    graphic.strokeCircle(56, 55, 13)
    graphic.fillStyle(0xf5e1c8, 1)
    graphic.fillRoundedRect(8, 31, 49, 45, 9)
    graphic.fillStyle(0x6f3f23, 1)
    graphic.fillEllipse(32, 34, 43, 12)
    graphic.lineStyle(4, 0xb9784b, 0.8)
    graphic.lineBetween(23, 22, 20, 10)
    graphic.lineBetween(38, 22, 41, 9)
    graphic.lineBetween(31, 21, 32, 6)
    graphic.lineStyle(5, 0x8d5a36, 1)
    graphic.lineBetween(5, 80, 65, 80)
    graphic.generateTexture(textureKey, ITEM_WIDTH, ITEM_HEIGHT)
    graphic.destroy()
  }

  private static drawBook(
    graphic: Phaser.GameObjects.Graphics,
    coverColor: number,
    spineColor: number,
  ): void {
    graphic.fillStyle(coverColor, 1)
    graphic.fillRoundedRect(1, 1, ITEM_WIDTH - 2, ITEM_HEIGHT - 2, 7)
    graphic.fillStyle(0xfff8e7, 1)
    graphic.fillRoundedRect(13, 8, ITEM_WIDTH - 20, ITEM_HEIGHT - 16, 4)
    graphic.fillStyle(spineColor, 1)
    graphic.fillRoundedRect(1, 1, 17, ITEM_HEIGHT - 2, 7)
    graphic.fillRect(11, 1, 7, ITEM_HEIGHT - 2)
    graphic.lineStyle(3, spineColor, 1)
    graphic.strokeRoundedRect(1, 1, ITEM_WIDTH - 2, ITEM_HEIGHT - 2, 7)
    graphic.lineStyle(3, coverColor, 1)
    graphic.lineBetween(27, 27, 57, 27)
    graphic.lineBetween(27, 38, 52, 38)
    graphic.lineBetween(27, 67, 57, 67)
    graphic.fillStyle(spineColor, 1)
    graphic.fillTriangle(52, 1, 66, 1, 66, 18)
  }

  private static createStarPoints(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
  ): Phaser.Geom.Point[] {
    return Array.from({ length: 10 }, (_, index) => {
      const radius = index % 2 === 0 ? outerRadius : innerRadius
      const angle = -Math.PI / 2 + (index * Math.PI) / 5
      return new Phaser.Geom.Point(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
      )
    })
  }
}
