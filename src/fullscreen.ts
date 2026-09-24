import type Phaser from 'phaser'

interface WebkitFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

interface WebkitFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

export function initializeFullscreenControl(game: Phaser.Game): void {
  if (document.querySelector('.fullscreen-toggle')) {
    return
  }

  const fullscreenDocument = document as WebkitFullscreenDocument
  // Fullscreen the document root so the game and its DOM controls (sound,
  // network state, and this exit button) remain visible together.
  const target = document.documentElement as WebkitFullscreenElement
  const supportsFullscreen = Boolean(
    typeof target.requestFullscreen === 'function' ||
      typeof target.webkitRequestFullscreen === 'function',
  )
  const runsAsInstalledApp =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as StandaloneNavigator).standalone === true

  if (!supportsFullscreen || runsAsInstalledApp) {
    return
  }

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'fullscreen-toggle'
  button.setAttribute('aria-label', 'Enter full screen')
  button.setAttribute('aria-pressed', 'false')

  const isFullscreen = (): boolean =>
    Boolean(document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement)

  const refreshGameLayout = (): void => {
    window.requestAnimationFrame(() => game.scale.refresh())
  }

  const updateButton = (): void => {
    const active = isFullscreen()
    button.textContent = active ? 'EXIT FULL SCREEN' : 'FULL SCREEN'
    button.setAttribute(
      'aria-label',
      active ? 'Exit full screen' : 'Enter full screen',
    )
    button.setAttribute('aria-pressed', String(active))
    button.classList.toggle('fullscreen-toggle--active', active)
    refreshGameLayout()
  }

  const enterFullscreen = async (): Promise<void> => {
    if (typeof target.requestFullscreen === 'function') {
      await target.requestFullscreen({ navigationUI: 'hide' })
      return
    }

    await target.webkitRequestFullscreen?.()
  }

  const exitFullscreen = async (): Promise<void> => {
    if (typeof document.exitFullscreen === 'function') {
      await document.exitFullscreen()
      return
    }

    await fullscreenDocument.webkitExitFullscreen?.()
  }

  button.addEventListener('click', () => {
    const toggleFullscreen = isFullscreen() ? exitFullscreen : enterFullscreen
    void toggleFullscreen().catch(() => {
      // Some browsers reject fullscreen outside an eligible user gesture.
      // The control remains available so the next tap can retry safely.
      updateButton()
    })
  })

  document.addEventListener('fullscreenchange', updateButton)
  document.addEventListener('webkitfullscreenchange', updateButton)
  document.body.append(button)
  updateButton()
}
