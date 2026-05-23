import type { Difficulty } from '../types/game'

const SENTENCE_PROGRESS_ENDPOINT = '/api/sentence-progress'
const SENTENCE_PROGRESS_STORAGE_KEY = 'starbridge-sentence-progress-file-fallback:v1'

export type SentenceCompletionRecord = {
  levelId: string
  levelTitle: string
  difficulty: Difficulty
  sentence: string
  selectedLabels: string[]
  expressionStarsEarned: 1
  completedAt: string
}

export type SentenceProgressFile = {
  version: 1
  updatedAt: string | null
  expressionStars: number
  completedLevelIds: string[]
  records: SentenceCompletionRecord[]
}

const emptySentenceProgressFile: SentenceProgressFile = {
  version: 1,
  updatedAt: null,
  expressionStars: 0,
  completedLevelIds: [],
  records: [],
}

export async function loadSentenceProgressFile(): Promise<SentenceProgressFile> {
  try {
    const response = await fetch(SENTENCE_PROGRESS_ENDPOINT)
    if (!response.ok) {
      throw new Error(`Failed to load sentence progress: ${response.status}`)
    }

    return normalizeSentenceProgressFile(await response.json())
  } catch {
    return loadFallbackSentenceProgress()
  }
}

export async function saveSentenceCompletionRecord(record: SentenceCompletionRecord) {
  try {
    const response = await fetch(`${SENTENCE_PROGRESS_ENDPOINT}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })

    if (!response.ok) {
      throw new Error(`Failed to save sentence progress: ${response.status}`)
    }

    return {
      mode: 'file' as const,
      progress: normalizeSentenceProgressFile(await response.json()),
    }
  } catch {
    const progress = appendFallbackSentenceRecord(record)
    return { mode: 'localStorage' as const, progress }
  }
}

function loadFallbackSentenceProgress(): SentenceProgressFile {
  try {
    const rawProgress = window.localStorage.getItem(SENTENCE_PROGRESS_STORAGE_KEY)
    if (!rawProgress) {
      return emptySentenceProgressFile
    }

    return normalizeSentenceProgressFile(JSON.parse(rawProgress))
  } catch {
    return emptySentenceProgressFile
  }
}

function appendFallbackSentenceRecord(record: SentenceCompletionRecord): SentenceProgressFile {
  const progress = appendSentenceRecord(loadFallbackSentenceProgress(), record)
  window.localStorage.setItem(SENTENCE_PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  return progress
}

function appendSentenceRecord(
  progress: SentenceProgressFile,
  record: SentenceCompletionRecord,
): SentenceProgressFile {
  const records = [...progress.records, record]
  const completedLevelIds = Array.from(new Set(records.map((item) => item.levelId)))

  return {
    version: 1,
    updatedAt: record.completedAt,
    expressionStars: Math.min(3, completedLevelIds.length),
    completedLevelIds,
    records,
  }
}

function normalizeSentenceProgressFile(value: unknown): SentenceProgressFile {
  if (!value || typeof value !== 'object') {
    return emptySentenceProgressFile
  }

  const progress = value as Partial<SentenceProgressFile>
  const records = Array.isArray(progress.records)
    ? progress.records.filter(isSentenceCompletionRecord)
    : []
  const completedLevelIds =
    Array.isArray(progress.completedLevelIds) && progress.completedLevelIds.every(isString)
      ? progress.completedLevelIds
      : Array.from(new Set(records.map((record) => record.levelId)))

  return {
    version: 1,
    updatedAt: typeof progress.updatedAt === 'string' ? progress.updatedAt : null,
    expressionStars: Math.min(3, completedLevelIds.length),
    completedLevelIds,
    records,
  }
}

function isSentenceCompletionRecord(value: unknown): value is SentenceCompletionRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as SentenceCompletionRecord
  return (
    isString(record.levelId) &&
    isString(record.levelTitle) &&
    isString(record.difficulty) &&
    isString(record.sentence) &&
    Array.isArray(record.selectedLabels) &&
    record.selectedLabels.every(isString) &&
    record.expressionStarsEarned === 1 &&
    isString(record.completedAt)
  )
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}
