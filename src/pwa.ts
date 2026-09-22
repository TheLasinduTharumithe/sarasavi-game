import type Phaser from 'phaser'
import { registerSW } from 'virtual:pwa-register'
import { SCENE_KEYS } from './game/constants'

export function initializePwa(game: Phaser.Game): void {
  let refreshAvailable = false
  let updateCheckTimer: number | undefined

  const prompt = document.createElement('div')
  prompt.className = 'pwa-update-prompt'
  prompt.hidden = true

  const message = document.createElement('span')
  message.textContent = 'A new version is ready.'

  const updateButton = document.createElement('button')
  updateButton.type = 'button'
  updateButton.textContent = 'UPDATE'

  const laterButton = document.createElement('button')
  laterButton.type = 'button'
  laterButton.className = 'pwa-update-prompt__later'
  laterButton.textContent = 'LATER'

  prompt.append(message, updateButton, laterButton)
  document.body.append(prompt)

  const gameIsActive = (): boolean =>
    game.scene.isActive(SCENE_KEYS.GAME)

  const refreshPromptState = (): void => {
    if (!refreshAvailable) {
      prompt.hidden = true
      return
    }

    prompt.hidden = gameIsActive()
  }

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      refreshAvailable = true
      refreshPromptState()

      if (updateCheckTimer === undefined) {
        updateCheckTimer = window.setInterval(refreshPromptState, 1000)
      }
    },
    onOfflineReady: () => {
      console.info('[PWA] Offline game files are ready.')
    },
    onRegisterError: () => {
      console.warn('[PWA] Service worker registration failed.')
    },
  })

  updateButton.addEventListener('click', () => {
    if (gameIsActive()) {
      return
    }

    refreshAvailable = false
    prompt.hidden = true
    if (updateCheckTimer !== undefined) {
      window.clearInterval(updateCheckTimer)
      updateCheckTimer = undefined
    }
    void updateServiceWorker(true)
  })

  laterButton.addEventListener('click', () => {
    refreshAvailable = false
    prompt.hidden = true
    if (updateCheckTimer !== undefined) {
      window.clearInterval(updateCheckTimer)
      updateCheckTimer = undefined
    }
  })
}
