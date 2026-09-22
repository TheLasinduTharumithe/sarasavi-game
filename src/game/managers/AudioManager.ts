const MUTE_STORAGE_KEY = 'sarasaviCatchBooks.muted'

type AudioCue =
  | 'normalBook'
  | 'goldenBook'
  | 'negative'
  | 'countdown'
  | 'go'
  | 'gameOver'

interface ToneOptions {
  frequency: number
  duration: number
  volume: number
  type?: OscillatorType
  delay?: number
}

class AudioManager {
  private context?: AudioContext
  private musicTimer?: number
  private musicStep = 0
  private initialized = false
  private muted = this.loadMuteState()
  private readonly listeners = new Set<(muted: boolean) => void>()

  initialize(): void {
    if (this.initialized) {
      return
    }

    this.initialized = true
    document.addEventListener('pointerdown', this.handleFirstInteraction, {
      capture: true,
      once: true,
    })
    document.addEventListener('keydown', this.handleFirstInteraction, {
      capture: true,
      once: true,
    })
  }

  isMuted(): boolean {
    return this.muted
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    this.storeMuteState()

    if (this.muted) {
      this.stopBackgroundMusic()
    } else {
      void this.unlock().then(() => this.startBackgroundMusic())
    }

    for (const listener of this.listeners) {
      listener(this.muted)
    }

    return this.muted
  }

  subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener)
    listener(this.muted)
    return () => this.listeners.delete(listener)
  }

  play(cue: AudioCue): void {
    if (this.muted) {
      return
    }

    void this.unlock().then(() => {
      if (this.muted) {
        return
      }

      switch (cue) {
        case 'normalBook':
          this.playTone({ frequency: 523.25, duration: 0.11, volume: 0.09 })
          this.playTone({ frequency: 659.25, duration: 0.12, volume: 0.07, delay: 0.07 })
          break
        case 'goldenBook':
          this.playTone({ frequency: 659.25, duration: 0.13, volume: 0.1 })
          this.playTone({ frequency: 783.99, duration: 0.14, volume: 0.09, delay: 0.08 })
          this.playTone({ frequency: 1046.5, duration: 0.2, volume: 0.08, delay: 0.16 })
          break
        case 'negative':
          this.playTone({ frequency: 180, duration: 0.17, volume: 0.08, type: 'triangle' })
          this.playTone({ frequency: 135, duration: 0.2, volume: 0.06, type: 'triangle', delay: 0.09 })
          break
        case 'countdown':
          this.playTone({ frequency: 392, duration: 0.1, volume: 0.07, type: 'square' })
          break
        case 'go':
          this.playTone({ frequency: 523.25, duration: 0.13, volume: 0.08 })
          this.playTone({ frequency: 783.99, duration: 0.2, volume: 0.08, delay: 0.1 })
          break
        case 'gameOver':
          this.playTone({ frequency: 392, duration: 0.18, volume: 0.08 })
          this.playTone({ frequency: 329.63, duration: 0.2, volume: 0.07, delay: 0.15 })
          this.playTone({ frequency: 261.63, duration: 0.3, volume: 0.07, delay: 0.3 })
          break
      }
    })
  }

  private readonly handleFirstInteraction = (): void => {
    document.removeEventListener('pointerdown', this.handleFirstInteraction, true)
    document.removeEventListener('keydown', this.handleFirstInteraction, true)
    void this.unlock().then(() => this.startBackgroundMusic())
  }

  private async unlock(): Promise<void> {
    if (!this.context) {
      const AudioContextClass = window.AudioContext
      if (!AudioContextClass) {
        return
      }
      this.context = new AudioContextClass()
    }

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume()
      } catch {
        // A later user gesture can retry without affecting gameplay.
      }
    }
  }

  private startBackgroundMusic(): void {
    if (this.muted || this.musicTimer !== undefined || !this.context) {
      return
    }

    const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23]
    const playNextNote = (): void => {
      if (this.muted) {
        return
      }
      this.playTone({
        frequency: melody[this.musicStep % melody.length],
        duration: 0.28,
        volume: 0.018,
        type: 'triangle',
      })
      this.musicStep += 1
    }

    playNextNote()
    this.musicTimer = window.setInterval(playNextNote, 440)
  }

  private stopBackgroundMusic(): void {
    if (this.musicTimer !== undefined) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = undefined
    }
  }

  private playTone(options: ToneOptions): void {
    const context = this.context
    if (!context || context.state !== 'running') {
      return
    }

    const startTime = context.currentTime + (options.delay ?? 0)
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = options.type ?? 'sine'
    oscillator.frequency.setValueAtTime(options.frequency, startTime)
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(options.volume, startTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + options.duration,
    )
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startTime)
    oscillator.stop(startTime + options.duration + 0.02)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      gain.disconnect()
    }, { once: true })
  }

  private loadMuteState(): boolean {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  }

  private storeMuteState(): void {
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted))
    } catch {
      // Audio controls still work for the current session.
    }
  }
}

export const audioManager = new AudioManager()

export function initializeAudioControls(): void {
  audioManager.initialize()

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'audio-toggle'
  button.setAttribute('aria-label', 'Toggle game sound')

  const updateButton = (muted: boolean): void => {
    button.textContent = muted ? 'SOUND OFF' : 'SOUND ON'
    button.setAttribute('aria-pressed', String(muted))
    button.classList.toggle('audio-toggle--muted', muted)
  }

  audioManager.subscribe(updateButton)
  button.addEventListener('click', () => audioManager.toggleMute())
  document.body.append(button)
}
