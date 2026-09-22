import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app'

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredEnvironmentVariables = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
}

let firebaseApp: FirebaseApp | null | undefined
let configurationMessageLogged = false

export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp !== undefined) {
    return firebaseApp
  }

  const missingVariables = Object.entries(requiredEnvironmentVariables)
    .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
    .map(([name]) => name)

  if (missingVariables.length > 0) {
    if (!configurationMessageLogged) {
      console.info(
        `[Firebase] Local-only mode: missing ${missingVariables.join(', ')}. ` +
          'Gameplay will continue, but score uploads are disabled.',
      )
      configurationMessageLogged = true
    }

    firebaseApp = null
    return firebaseApp
  }

  try {
    firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig)
  } catch {
    console.warn(
      '[Firebase] Initialization failed. Check the VITE_FIREBASE_* configuration. ' +
        'Gameplay will continue without online score saving.',
    )
    firebaseApp = null
  }

  return firebaseApp
}
