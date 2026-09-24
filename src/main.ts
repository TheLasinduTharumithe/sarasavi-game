import Phaser from 'phaser'
import { gameConfig, initialGameDimensions } from './game/config'
import { initializeAnonymousAuth } from './firebase/auth'
import { initializeScoreSync } from './firebase/scores'
import { initializeFullscreenControl } from './fullscreen'
import { initializeAudioControls } from './game/managers/AudioManager'
import { initializeNetworkStatus } from './network/status'
import { initializePwa } from './pwa'
import { initializeResponsiveLayout } from './responsive'
import './styles/main.css'

void initializeAnonymousAuth()
initializeScoreSync()
initializeNetworkStatus()
initializeAudioControls()

document.body.classList.toggle(
  'game-portrait',
  initialGameDimensions.portrait,
)
const game = new Phaser.Game(gameConfig)
initializeFullscreenControl(game)
initializeResponsiveLayout(game)
initializePwa(game)
