import { PLAYER_NAME_STORAGE_KEY } from './constants.ts'

export interface PlayerNameValidationResult {
  isValid: boolean
  playerName: string
  errorMessage: string
}

const PLAYER_NAME_PATTERN = /^[\p{L}\p{N} ]+$/u
const MINIMUM_NAME_LENGTH = 2
const MAXIMUM_NAME_LENGTH = 20

export function validatePlayerName(value: string): PlayerNameValidationResult {
  const playerName = value.trim()

  if (playerName.length === 0) {
    return {
      isValid: false,
      playerName,
      errorMessage: 'Please enter your name.',
    }
  }

  if (playerName.length < MINIMUM_NAME_LENGTH) {
    return {
      isValid: false,
      playerName,
      errorMessage: 'Name must be at least 2 characters.',
    }
  }

  if (playerName.length > MAXIMUM_NAME_LENGTH) {
    return {
      isValid: false,
      playerName,
      errorMessage: 'Name must be 20 characters or fewer.',
    }
  }

  if (!PLAYER_NAME_PATTERN.test(playerName)) {
    return {
      isValid: false,
      playerName,
      errorMessage: 'Use only letters, numbers, and spaces.',
    }
  }

  return { isValid: true, playerName, errorMessage: '' }
}

export function loadStoredPlayerName(): string {
  try {
    const storedValue = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY)
    if (!storedValue) {
      return ''
    }

    const result = validatePlayerName(storedValue)
    if (result.isValid) {
      return result.playerName
    }

    window.localStorage.removeItem(PLAYER_NAME_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return ''
}

export function storePlayerName(playerName: string): void {
  const result = validatePlayerName(playerName)
  if (!result.isValid) {
    return
  }

  try {
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, result.playerName)
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

export function resolvePlayerName(value?: string): string {
  const providedName = validatePlayerName(value ?? '')
  return providedName.isValid ? providedName.playerName : loadStoredPlayerName()
}
