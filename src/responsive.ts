import Phaser from 'phaser'

export function initializeResponsiveLayout(game: Phaser.Game): void {
  let refreshFrame: number | undefined

  const refreshLayout = (): void => {
    if (refreshFrame !== undefined) {
      window.cancelAnimationFrame(refreshFrame)
    }

    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = undefined
      game.scale.refresh()
    })
  }

  window.addEventListener('resize', refreshLayout)
  window.addEventListener('orientationchange', refreshLayout)
  window.visualViewport?.addEventListener('resize', refreshLayout)
  window.visualViewport?.addEventListener('scroll', refreshLayout)

  refreshLayout()
}
