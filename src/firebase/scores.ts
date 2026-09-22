import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { GAME_VERSION } from '../game/constants'
import type { PlayerResult } from '../game/types'
import { getAuthenticatedUser } from './auth'
import { getFirebaseApp } from './firebase'

export type ScoreSaveStatus = 'saved' | 'unavailable' | 'failed'

const completedSubmissionIds = new Set<string>()
const pendingSubmissions = new Map<string, Promise<ScoreSaveStatus>>()
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/
const PENDING_SCORES_STORAGE_KEY = 'sarasaviCatchBooks.pendingScores'
const MAXIMUM_PENDING_SCORES = 10

interface PendingScoreSubmission {
  submissionId: string
  result: PlayerResult
  gameVersion: string
}

let scoreSyncInitialized = false
let retryInProgress = false

export function initializeScoreSync(): void {
  if (scoreSyncInitialized) {
    return
  }

  scoreSyncInitialized = true
  window.addEventListener('online', handleOnline)

  if (navigator.onLine) {
    void retryPendingScores()
  }
}

export function saveScore(
  result: PlayerResult,
  submissionId: string,
): Promise<ScoreSaveStatus> {
  if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
    return Promise.resolve('failed')
  }

  if (completedSubmissionIds.has(submissionId)) {
    removePendingScore(submissionId)
    return Promise.resolve('saved')
  }

  const pendingScore = { submissionId, result, gameVersion: GAME_VERSION }
  queuePendingScore(pendingScore)
  return startScoreSave(pendingScore)
}

function startScoreSave(
  pendingScore: PendingScoreSubmission,
): Promise<ScoreSaveStatus> {
  const pendingSubmission = pendingSubmissions.get(pendingScore.submissionId)
  if (pendingSubmission) {
    return pendingSubmission
  }

  const submission = performScoreSave(
    pendingScore.result,
    pendingScore.submissionId,
    pendingScore.gameVersion,
  )
    .then((status) => {
      if (status === 'saved') {
        removePendingScore(pendingScore.submissionId)
      }
      return status
    })
    .finally(() => {
      pendingSubmissions.delete(pendingScore.submissionId)
    })

  pendingSubmissions.set(pendingScore.submissionId, submission)
  return submission
}

async function performScoreSave(
  result: PlayerResult,
  submissionId: string,
  gameVersion: string,
): Promise<ScoreSaveStatus> {
  const app = getFirebaseApp()
  if (!app) {
    return 'unavailable'
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return 'failed'
  }

  try {
    const database = getFirestore(app)
    const scoreDocument = doc(database, 'scores', submissionId)

    const existingDocument = await getDoc(scoreDocument)
    if (existingDocument.exists()) {
      completedSubmissionIds.add(submissionId)
      return 'saved'
    }

    await setDoc(scoreDocument, {
      uid: user.uid,
      playerName: result.playerName,
      score: result.stats.score,
      booksCaught: result.stats.booksCaught,
      goldenBooksCaught: result.stats.goldenBooksCaught,
      phoneItemsCaught: result.stats.phoneItemsCaught,
      coffeeItemsCaught: result.stats.coffeeItemsCaught,
      totalDistractionsCaught: result.stats.totalDistractionsCaught,
      gameDurationSeconds: result.gameDurationSeconds,
      gameVersion,
      createdAt: serverTimestamp(),
    })

    completedSubmissionIds.add(submissionId)
    return 'saved'
  } catch {
    try {
      const existingDocument = await getDoc(
        doc(getFirestore(app), 'scores', submissionId),
      )
      if (existingDocument.exists()) {
        completedSubmissionIds.add(submissionId)
        return 'saved'
      }
    } catch {
      // Keep the validated submission queued for the next online retry.
    }

    console.warn(
      '[Firebase] Score upload failed. Check Authentication, Firestore, and deployed security rules.',
    )
    return 'failed'
  }
}

async function retryPendingScores(): Promise<void> {
  if (retryInProgress || !navigator.onLine) {
    return
  }

  retryInProgress = true

  try {
    for (const pendingScore of loadPendingScores()) {
      if (!navigator.onLine) {
        break
      }

      if (completedSubmissionIds.has(pendingScore.submissionId)) {
        removePendingScore(pendingScore.submissionId)
        continue
      }

      const status = await startScoreSave(pendingScore)

      if (status === 'saved') {
        removePendingScore(pendingScore.submissionId)
      } else if (status === 'unavailable') {
        break
      }
    }
  } finally {
    retryInProgress = false
  }
}

function handleOnline(): void {
  void retryPendingScores()
}

function queuePendingScore(submission: PendingScoreSubmission): void {
  const pendingScores = loadPendingScores().filter(
    (pendingScore) => pendingScore.submissionId !== submission.submissionId,
  )
  pendingScores.push(submission)
  savePendingScores(pendingScores.slice(-MAXIMUM_PENDING_SCORES))
}

function removePendingScore(submissionId: string): void {
  const pendingScores = loadPendingScores().filter(
    (pendingScore) => pendingScore.submissionId !== submissionId,
  )
  savePendingScores(pendingScores)
}

function loadPendingScores(): PendingScoreSubmission[] {
  try {
    const storedValue = window.localStorage.getItem(PENDING_SCORES_STORAGE_KEY)
    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isPendingScoreSubmission)
  } catch {
    return []
  }
}

function savePendingScores(pendingScores: PendingScoreSubmission[]): void {
  try {
    if (pendingScores.length === 0) {
      window.localStorage.removeItem(PENDING_SCORES_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      PENDING_SCORES_STORAGE_KEY,
      JSON.stringify(pendingScores),
    )
  } catch {
    console.warn('[Firebase] Pending score could not be stored locally.')
  }
}

function isPendingScoreSubmission(
  value: unknown,
): value is PendingScoreSubmission {
  if (!isRecord(value) || !isRecord(value.result)) {
    return false
  }

  const result = value.result
  if (!isRecord(result.stats)) {
    return false
  }

  const stats = result.stats
  const statFields = [
    'score',
    'booksCaught',
    'goldenBooksCaught',
    'phoneItemsCaught',
    'coffeeItemsCaught',
    'totalDistractionsCaught',
  ] as const

  return (
    typeof value.submissionId === 'string' &&
    SUBMISSION_ID_PATTERN.test(value.submissionId) &&
    typeof value.gameVersion === 'string' &&
    value.gameVersion.length > 0 &&
    value.gameVersion.length <= 20 &&
    typeof result.playerName === 'string' &&
    result.playerName.length >= 2 &&
    result.playerName.length <= 20 &&
    result.gameDurationSeconds === 30 &&
    statFields.every((field) => isNonNegativeInteger(stats[field]))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}
