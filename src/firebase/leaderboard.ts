import {
  collection,
  type DocumentData,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'
import { getAuthenticatedUser } from './auth'
import { getFirebaseApp } from './firebase'

export interface LeaderboardEntry {
  playerName: string
  score: number
}

export type LeaderboardLoadResult =
  | { status: 'success'; entries: LeaderboardEntry[] }
  | { status: 'unavailable'; entries: [] }

const LEADERBOARD_LIMIT = 10
let useDateIndexFallback = false

export async function loadTodaysLeaderboard(): Promise<LeaderboardLoadResult> {
  const app = getFirebaseApp()
  if (!app) {
    return { status: 'unavailable', entries: [] }
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return { status: 'unavailable', entries: [] }
  }

  const { startOfToday, startOfTomorrow } = getLocalDayRange()

  if (useDateIndexFallback) {
    return loadTodaysLeaderboardFallback(startOfToday, startOfTomorrow)
  }

  try {
    const database = getFirestore(app)
    const scoresQuery = query(
      collection(database, 'scores'),
      where('score', '>=', 0),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday)),
      where('createdAt', '<', Timestamp.fromDate(startOfTomorrow)),
      orderBy('score', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(LEADERBOARD_LIMIT),
    )
    const snapshot = await getDocs(scoresQuery)
    const entries: LeaderboardEntry[] = []

    for (const scoreDocument of snapshot.docs) {
      const data = scoreDocument.data() as {
        playerName?: unknown
        score?: unknown
      }

      if (
        typeof data.playerName === 'string' &&
        data.playerName.length >= 2 &&
        data.playerName.length <= 20 &&
        typeof data.score === 'number' &&
        Number.isInteger(data.score) &&
        data.score >= 0
      ) {
        entries.push({ playerName: data.playerName, score: data.score })
      }
    }

    return { status: 'success', entries }
  } catch (error: unknown) {
    const errorCode = getFirebaseErrorCode(error)

    if (errorCode === 'failed-precondition') {
      // A newly deployed Firestore composite index may take several minutes
      // to become ready. Use the indexed date query for the rest of this page
      // session instead of repeating a known-to-fail request every time the
      // player opens or retries the leaderboard.
      useDateIndexFallback = true
      return loadTodaysLeaderboardFallback(startOfToday, startOfTomorrow)
    }

    console.warn(
      `[Firebase] Leaderboard query failed${errorCode ? ` (${errorCode})` : ''}. ` +
        'Check Firestore rules and the deployed composite index.',
    )
    return { status: 'unavailable', entries: [] }
  }
}

/**
 * Keeps the leaderboard available while a new composite index is building.
 * Every request is restricted to today's scores and a maximum of ten documents,
 * which also satisfies the Firestore list rule. Once the composite index is
 * ready, the primary single-request query above is used automatically.
 */
async function loadTodaysLeaderboardFallback(
  startOfToday: Date,
  startOfTomorrow: Date,
): Promise<LeaderboardLoadResult> {
  const app = getFirebaseApp()
  if (!app) {
    return { status: 'unavailable', entries: [] }
  }

  const database = getFirestore(app)
  const scoresCollection = collection(database, 'scores')
  const startTimestamp = Timestamp.fromDate(startOfToday)
  const endTimestamp = Timestamp.fromDate(startOfTomorrow)
  const rankedEntries: RankedLeaderboardEntry[] = []
  let lastDocument: QueryDocumentSnapshot<DocumentData> | undefined

  try {
    while (true) {
      const pageQuery = lastDocument
        ? query(
            scoresCollection,
            where('createdAt', '>=', startTimestamp),
            where('createdAt', '<', endTimestamp),
            orderBy('createdAt', 'asc'),
            startAfter(lastDocument),
            limit(LEADERBOARD_LIMIT),
          )
        : query(
            scoresCollection,
            where('createdAt', '>=', startTimestamp),
            where('createdAt', '<', endTimestamp),
            orderBy('createdAt', 'asc'),
            limit(LEADERBOARD_LIMIT),
          )

      const snapshot = await getDocs(pageQuery)

      for (const scoreDocument of snapshot.docs) {
        const data = scoreDocument.data()
        const entry = parseLeaderboardEntry(data)
        if (entry) {
          rankedEntries.push(entry)
        }
      }

      if (snapshot.size < LEADERBOARD_LIMIT) {
        break
      }

      lastDocument = snapshot.docs[snapshot.docs.length - 1]
    }

    rankedEntries.sort(
      (first, second) =>
        second.score - first.score || first.createdAtMs - second.createdAtMs,
    )

    return {
      status: 'success',
      entries: rankedEntries
        .slice(0, LEADERBOARD_LIMIT)
        .map(({ playerName, score }) => ({ playerName, score })),
    }
  } catch (error: unknown) {
    const errorCode = getFirebaseErrorCode(error)
    console.warn(
      `[Firebase] Leaderboard fallback failed${errorCode ? ` (${errorCode})` : ''}. ` +
        'Check Firestore rules and authentication.',
    )
    return { status: 'unavailable', entries: [] }
  }
}

interface RankedLeaderboardEntry extends LeaderboardEntry {
  createdAtMs: number
}

function parseLeaderboardEntry(
  data: DocumentData,
): RankedLeaderboardEntry | null {
  const playerName: unknown = data.playerName
  const score: unknown = data.score
  const createdAt: unknown = data.createdAt

  if (
    typeof playerName !== 'string' ||
    playerName.length < 2 ||
    playerName.length > 20 ||
    typeof score !== 'number' ||
    !Number.isInteger(score) ||
    score < 0 ||
    !(createdAt instanceof Timestamp)
  ) {
    return null
  }

  return {
    playerName,
    score,
    createdAtMs: createdAt.toMillis(),
  }
}

function getFirebaseErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }

  return ''
}

function getLocalDayRange(): {
  startOfToday: Date
  startOfTomorrow: Date
} {
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  )

  return { startOfToday, startOfTomorrow }
}
