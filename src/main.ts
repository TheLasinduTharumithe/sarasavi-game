import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { initializeAnonymousAuth } from './firebase/auth'
import { initializeScoreSync } from './firebase/scores'
import { initializeAudioControls } from './game/managers/AudioManager'
import { initializeNetworkStatus } from './network/status'
import { initializePwa } from './pwa'
import { initializeResponsiveLayout } from './responsive'
import './styles/main.css'

void initializeAnonymousAuth()
initializeScoreSync()
initializeNetworkStatus()
initializeAudioControls()

const game = new Phaser.Game(gameConfig)
initializeResponsiveLayout(game)
initializePwa(game)
