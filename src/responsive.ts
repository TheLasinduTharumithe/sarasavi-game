import Phaser from 'phaser'
import { SCENE_KEYS } from './game/constants'

const MOBILE_PORTRAIT_QUERY =
  '(orientation: portrait) and (max-width: 1100px)'

export function initializeResponsiveLayout(game: Phaser.Game): void {
  const orientationQuery = window.matchMedia(MOBILE_PORTRAIT_QUERY)
  const overlay = createOrientationOverlay()
  let gamePausedForOrientation = false
  let refreshFrame: number | undefined

  const refreshLayout = (): void => {
    if (refreshFrame !== undefined) {
      window.cancelAnimationFrame(refreshFrame)
    }

    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = undefined
      const portraitMobile = orientationQuery.matches
      overlay.hidden = !portraitMobile
      document.body.classList.toggle('mobile-portrait', portraitMobile)

      if (portraitMobile && game.scene.isActive(SCENE_KEYS.GAME)) {
        game.scene.pause(SCENE_KEYS.GAME)
        gamePausedForOrientation = true
      } else if (!portraitMobile && gamePausedForOrientation) {
        if (game.scene.isPaused(SCENE_KEYS.GAME)) {
          game.scene.resume(SCENE_KEYS.GAME)
        }
        gamePausedForOrientation = false
      }

      game.scale.refresh()
    })
  }

  window.addEventListener('resize', refreshLayout)
  window.addEventListener('orientationchange', refreshLayout)
  orientationQuery.addEventListener('change', refreshLayout)
  window.visualViewport?.addEventListener('resize', refreshLayout)
  window.visualViewport?.addEventListener('scroll', refreshLayout)

  refreshLayout()
}

function createOrientationOverlay(): HTMLElement {
  const overlay = document.createElement('aside')
  overlay.className = 'orientation-hint'
  overlay.hidden = true
  overlay.setAttribute('role', 'status')
  overlay.setAttribute('aria-live', 'polite')

  const icon = document.createElement('span')
  icon.className = 'orientation-hint__icon'
  icon.textContent = '↻'
  icon.setAttribute('aria-hidden', 'true')

  const title = document.createElement('strong')
  title.textContent = 'Rotate your device'

  const description = document.createElement('span')
  description.textContent =
    'This game works best in landscape. Your game will continue when you rotate.'

  overlay.append(icon, title, description)
  document.body.append(overlay)
  return overlay
}
