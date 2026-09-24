import Phaser from 'phaser'
import { GAME_WIDTH } from '../constants'
import { prefersReducedMotion } from '../motion'

interface BasketControlKeys {
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  a: Phaser.Input.Keyboard.Key
  d: Phaser.Input.Keyboard.Key
}

interface BasketTouchControl {
  container: Phaser.GameObjects.Container
  background: Phaser.GameObjects.Graphics
  direction: -1 | 1
}

const BASKET_WIDTH = 220
const BASKET_HEIGHT = 150
const BASKET_BOTTOM_OFFSET = 80
const MAX_MOVE_SPEED = 650
const MOVE_ACCELERATION = 2400
const MOVE_DECELERATION = 3200
const TOUCH_CONTROL_WIDTH = 160
const TOUCH_CONTROL_HEIGHT = 88
const TOUCH_CONTROL_SIDE_OFFSET = 110
const TOUCH_CONTROL_BOTTOM_OFFSET = 190

function moveTowards(current: number, target: number, maximumDelta: number): number {
  if (Math.abs(target - current) <= maximumDelta) {
    return target
  }

  return current + Math.sign(target - current) * maximumDelta
}

export class Basket extends Phaser.GameObjects.Container {
  private readonly basketGraphic: Phaser.GameObjects.Graphics
  private controlKeys?: BasketControlKeys
  private readonly touchControls: BasketTouchControl[] = []
  private touchDirection: -1 | 0 | 1 = 0
  private horizontalVelocity = 0
  private isDragging = false
  private gameplayInputEnabled = true
  private inputCleanedUp = false

  constructor(scene: Phaser.Scene) {
    const gameSize = scene.scale.gameSize
    super(scene, gameSize.width / 2, gameSize.height - BASKET_BOTTOM_OFFSET)

    scene.add.existing(this)
    this.basketGraphic = this.createBasketGraphic()
    this.add(this.basketGraphic)
    this.setSize(BASKET_WIDTH, BASKET_HEIGHT)
    this.setDepth(10)
    this.configurePhysicsBody()

    this.configureKeyboardControls()
    this.configureDragControls()
    this.createTouchControls()

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.clampToGameBounds()
  }

  update(delta: number): void {
    if (!this.gameplayInputEnabled || this.isDragging) {
      return
    }

    const deltaSeconds = Math.min(delta, 50) / 1000
    const direction = this.getMovementDirection()
    const movementScale = this.scene.scale.gameSize.width / GAME_WIDTH
    const targetVelocity = direction * MAX_MOVE_SPEED * movementScale
    const acceleration =
      (direction === 0 ? MOVE_DECELERATION : MOVE_ACCELERATION) * movementScale

    this.horizontalVelocity = moveTowards(
      this.horizontalVelocity,
      targetVelocity,
      acceleration * deltaSeconds,
    )

    this.x += this.horizontalVelocity * deltaSeconds
    this.clampToGameBounds()
    this.syncPhysicsBody()
  }

  setGameplayInputEnabled(enabled: boolean): void {
    if (this.inputCleanedUp) {
      return
    }

    this.gameplayInputEnabled = enabled
    this.horizontalVelocity = 0
    this.isDragging = false
    this.touchDirection = 0

    if (this.input) {
      this.input.enabled = enabled
    }

    this.scene.input.setDraggable(this, enabled)

    if (this.controlKeys) {
      this.controlKeys.left.enabled = enabled
      this.controlKeys.right.enabled = enabled
      this.controlKeys.a.enabled = enabled
      this.controlKeys.d.enabled = enabled
    }

    for (const control of this.touchControls) {
      if (control.container.input) {
        control.container.input.enabled = enabled
      }
      control.container.setAlpha(enabled ? 0.9 : 0.38)
      control.container.setScale(1)
      this.drawTouchControl(control, false)
    }
  }

  playPenaltyShake(): void {
    if (prefersReducedMotion()) {
      return
    }
    this.scene.tweens.killTweensOf(this.basketGraphic)
    this.basketGraphic.x = 0

    this.scene.tweens.add({
      targets: this.basketGraphic,
      x: { from: -6, to: 6 },
      duration: 45,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.basketGraphic.x = 0
      },
    })
  }

  private configurePhysicsBody(): void {
    this.scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
    body.setSize(190, 70, true)
  }

  private createBasketGraphic(): Phaser.GameObjects.Graphics {
    const graphic = this.scene.add.graphics()

    graphic.fillStyle(0x4b382c, 0.16)
    graphic.fillEllipse(0, 58, 206, 24)

    graphic.lineStyle(16, 0x704526, 1)
    graphic.beginPath()
    graphic.arc(0, -18, 68, Math.PI, Math.PI * 2)
    graphic.strokePath()
    graphic.lineStyle(7, 0xc58442, 1)
    graphic.beginPath()
    graphic.arc(0, -18, 68, Math.PI, Math.PI * 2)
    graphic.strokePath()

    graphic.fillStyle(0xf0a52b, 1)
    graphic.fillRoundedRect(-105, -22, 210, 78, 22)

    graphic.lineStyle(6, 0xb9671e, 1)
    graphic.strokeRoundedRect(-105, -22, 210, 78, 22)
    graphic.lineStyle(4, 0xcf7b20, 0.8)
    for (let x = -72; x <= 72; x += 36) {
      graphic.lineBetween(x - 8, -12, x + 2, 46)
    }
    graphic.lineBetween(-94, 15, 94, 15)
    graphic.lineBetween(-88, 36, 88, 36)

    graphic.lineStyle(9, 0x704526, 1)
    graphic.lineBetween(-96, -8, 96, -8)

    // Small open-book badge keeps the object readable as a book basket.
    graphic.fillStyle(0xfffbef, 1)
    graphic.fillTriangle(-24, 11, -2, 16, -2, 39)
    graphic.fillTriangle(24, 11, 2, 16, 2, 39)
    graphic.lineStyle(2, 0x704526, 1)
    graphic.lineBetween(0, 16, 0, 40)

    return graphic
  }

  private configureKeyboardControls(): void {
    const keyboard = this.scene.input.keyboard

    if (!keyboard) {
      return
    }

    this.controlKeys = keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as unknown as BasketControlKeys
  }

  private configureDragControls(): void {
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -BASKET_WIDTH / 2,
        -BASKET_HEIGHT / 2,
        BASKET_WIDTH,
        BASKET_HEIGHT,
      ),
      Phaser.Geom.Rectangle.Contains,
    )
    this.scene.input.setDraggable(this)

    this.on(Phaser.Input.Events.DRAG_START, this.handleDragStart, this)
    this.on(Phaser.Input.Events.DRAG, this.handleDrag, this)
    this.on(Phaser.Input.Events.DRAG_END, this.handleDragEnd, this)
  }

  private createTouchControls(): void {
    this.touchControls.push(
      this.createTouchControl(-1, 'LEFT'),
      this.createTouchControl(1, 'RIGHT'),
    )
    this.positionTouchControls(this.scene.scale.gameSize)
    this.scene.input.on(
      Phaser.Input.Events.POINTER_UP,
      this.handleGlobalPointerRelease,
      this,
    )
    this.scene.input.on(
      Phaser.Input.Events.GAME_OUT,
      this.handleGlobalPointerRelease,
      this,
    )
  }

  private createTouchControl(
    direction: -1 | 1,
    label: string,
  ): BasketTouchControl {
    const background = this.scene.add.graphics()
    const text = this.scene.add
      .text(0, 24, label, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
    const container = this.scene.add
      .container(0, 0, [background, text])
      .setDepth(90)
      .setSize(TOUCH_CONTROL_WIDTH, TOUCH_CONTROL_HEIGHT)
      .setInteractive({ useHandCursor: true })
      .setName(`${label} BASKET CONTROL`)

    const control: BasketTouchControl = {
      container,
      background,
      direction,
    }
    this.drawTouchControl(control, false)

    container.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (!this.gameplayInputEnabled) {
        return
      }

      this.isDragging = false
      this.touchDirection = direction
      this.horizontalVelocity = 0
      container.setScale(0.97)
      this.drawTouchControl(control, true)
    })
    container.on(Phaser.Input.Events.POINTER_UP, () => {
      this.releaseTouchControl(direction)
    })
    container.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.releaseTouchControl(direction)
    })

    return control
  }

  private drawTouchControl(
    control: BasketTouchControl,
    active: boolean,
  ): void {
    const graphic = control.background
    const halfWidth = TOUCH_CONTROL_WIDTH / 2
    const halfHeight = TOUCH_CONTROL_HEIGHT / 2
    graphic.clear()
    graphic.fillStyle(0x35261e, 0.2)
    graphic.fillRoundedRect(
      -halfWidth + 3,
      -halfHeight + 5,
      TOUCH_CONTROL_WIDTH - 6,
      TOUCH_CONTROL_HEIGHT,
      22,
    )
    graphic.fillStyle(active ? 0x812c27 : 0x213a57, 0.9)
    graphic.fillRoundedRect(
      -halfWidth,
      -halfHeight,
      TOUCH_CONTROL_WIDTH,
      TOUCH_CONTROL_HEIGHT,
      22,
    )
    graphic.lineStyle(3, 0xfffcf4, active ? 1 : 0.78)
    graphic.strokeRoundedRect(
      -halfWidth,
      -halfHeight,
      TOUCH_CONTROL_WIDTH,
      TOUCH_CONTROL_HEIGHT,
      22,
    )
    graphic.fillStyle(0xfffcf4, 1)

    if (control.direction === -1) {
      graphic.fillTriangle(-30, -25, 8, -8, 8, -42)
    } else {
      graphic.fillTriangle(30, -25, -8, -42, -8, -8)
    }
  }

  private releaseTouchControl(direction: -1 | 1): void {
    if (this.touchDirection === direction) {
      this.touchDirection = 0
    }

    const control = this.touchControls.find(
      (touchControl) => touchControl.direction === direction,
    )
    if (control) {
      control.container.setScale(1)
      this.drawTouchControl(control, false)
    }
  }

  private readonly handleGlobalPointerRelease = (): void => {
    this.touchDirection = 0
    for (const control of this.touchControls) {
      control.container.setScale(1)
      this.drawTouchControl(control, false)
    }
  }

  private getMovementDirection(): number {
    if (this.touchDirection !== 0) {
      return this.touchDirection
    }

    return this.getKeyboardDirection()
  }

  private getKeyboardDirection(): number {
    if (!this.controlKeys) {
      return 0
    }

    const movingLeft = this.controlKeys.left.isDown || this.controlKeys.a.isDown
    const movingRight =
      this.controlKeys.right.isDown || this.controlKeys.d.isDown

    if (movingLeft === movingRight) {
      return 0
    }

    return movingLeft ? -1 : 1
  }

  private handleDragStart(): void {
    if (!this.gameplayInputEnabled) {
      return
    }

    this.isDragging = true
    this.horizontalVelocity = 0
  }

  private handleDrag(
    _pointer: Phaser.Input.Pointer,
    dragX: number,
    _dragY: number,
  ): void {
    this.x = dragX
    this.clampToGameBounds()
    this.syncPhysicsBody()
  }

  private handleDragEnd(): void {
    this.isDragging = false
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.y = gameSize.height - BASKET_BOTTOM_OFFSET
    this.positionTouchControls(gameSize)
    this.clampToGameBounds(gameSize.width)
    this.syncPhysicsBody()
  }

  private positionTouchControls(gameSize: Phaser.Structs.Size): void {
    const y = Math.max(
      TOUCH_CONTROL_HEIGHT / 2,
      gameSize.height - TOUCH_CONTROL_BOTTOM_OFFSET,
    )
    const [leftControl, rightControl] = this.touchControls
    leftControl?.container.setPosition(TOUCH_CONTROL_SIDE_OFFSET, y)
    rightControl?.container.setPosition(
      gameSize.width - TOUCH_CONTROL_SIDE_OFFSET,
      y,
    )
  }

  private syncPhysicsBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null
    body?.updateFromGameObject()
  }

  private clampToGameBounds(gameWidth = this.scene.scale.gameSize.width): void {
    const halfWidth = BASKET_WIDTH / 2
    const minimumX = halfWidth
    const maximumX = Math.max(halfWidth, gameWidth - halfWidth)
    const clampedX = Phaser.Math.Clamp(this.x, minimumX, maximumX)

    if (clampedX !== this.x) {
      this.horizontalVelocity = 0
      this.x = clampedX
    }
  }

  protected preDestroy(): void {
    // DisplayList shutdown destroys Game Objects before later Scene shutdown
    // listeners run. Clean up while this.scene and its input plugins are still
    // available, then let Container dispose its children and transform state.
    this.cleanupInput()
    super.preDestroy()
  }

  private cleanupInput(): void {
    if (this.inputCleanedUp) {
      return
    }

    this.inputCleanedUp = true
    this.gameplayInputEnabled = false
    this.horizontalVelocity = 0
    this.touchDirection = 0

    // Phaser owns scene tweens and clears them as part of scene shutdown.
    // Do not access the TweenManager here: depending on shutdown listener order,
    // its internal tween collection may already have been destroyed.
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.scene.input.setDraggable(this, false)
    this.off(Phaser.Input.Events.DRAG_START, this.handleDragStart, this)
    this.off(Phaser.Input.Events.DRAG, this.handleDrag, this)
    this.off(Phaser.Input.Events.DRAG_END, this.handleDragEnd, this)
    this.scene.input.off(
      Phaser.Input.Events.POINTER_UP,
      this.handleGlobalPointerRelease,
      this,
    )
    this.scene.input.off(
      Phaser.Input.Events.GAME_OUT,
      this.handleGlobalPointerRelease,
      this,
    )

    for (const control of this.touchControls) {
      control.container.removeAllListeners()
      control.container.destroy()
    }
    this.touchControls.length = 0

    const keyboard = this.scene.input.keyboard
    if (keyboard && this.controlKeys) {
      keyboard.removeKey(this.controlKeys.left, true)
      keyboard.removeKey(this.controlKeys.right, true)
      keyboard.removeKey(this.controlKeys.a, true)
      keyboard.removeKey(this.controlKeys.d, true)
    }

    this.controlKeys = undefined
  }
}
