import { getAuth, signInAnonymously, type User } from 'firebase/auth'
import { getFirebaseApp } from './firebase'

let authenticationPromise: Promise<User | null> | undefined

export function initializeAnonymousAuth(): Promise<User | null> {
  const app = getFirebaseApp()
  if (!app) {
    return Promise.resolve(null)
  }

  if (authenticationPromise) {
    return authenticationPromise
  }

  try {
    const auth = getAuth(app)
    if (auth.currentUser) {
      return Promise.resolve(auth.currentUser)
    }

    authenticationPromise = signInAnonymously(auth)
      .then((credential) => credential.user)
      .catch(() => {
        console.warn(
          '[Firebase] Anonymous sign-in failed. Gameplay will continue, and score upload may be retried later.',
        )
        authenticationPromise = undefined
        return null
      })

    return authenticationPromise
  } catch {
    console.warn(
      '[Firebase] Authentication could not start. Gameplay will continue without online score saving.',
    )
    return Promise.resolve(null)
  }
}

export function getAuthenticatedUser(): Promise<User | null> {
  return initializeAnonymousAuth()
}
