import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type SentenceCompletionRecord = {
  levelId: string
  levelTitle: string
  difficulty: string
  sentence: string
  selectedLabels: string[]
  expressionStarsEarned: 1
  completedAt: string
}

type SentenceProgressFile = {
  version: 1
  updatedAt: string | null
  expressionStars: number
  completedLevelIds: string[]
  records: SentenceCompletionRecord[]
}

const sentenceProgressPath = path.resolve(process.cwd(), 'local-data', 'sentence-progress.json')

function sentenceProgressFilePlugin(): Plugin {
  return {
    name: 'starbridge-sentence-progress-file',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestPath = request.url?.split('?')[0]

        if (requestPath !== '/api/sentence-progress' && requestPath !== '/api/sentence-progress/complete') {
          next()
          return
        }

        try {
          if (request.method === 'GET' && requestPath === '/api/sentence-progress') {
            sendJson(response, 200, await readSentenceProgress())
            return
          }

          if (request.method === 'POST' && requestPath === '/api/sentence-progress/complete') {
            const record = normalizeSentenceCompletionRecord(await readRequestBody(request))
            if (!record) {
              sendJson(response, 400, { error: 'Invalid sentence completion record' })
              return
            }

            const progress = appendSentenceRecord(await readSentenceProgress(), record)
            await writeSentenceProgress(progress)
            sendJson(response, 200, progress)
            return
          }

          sendJson(response, 405, { error: 'Method not allowed' })
        } catch (error) {
          server.config.logger.error(error instanceof Error ? error.message : String(error))
          sendJson(response, 500, { error: 'Unable to update local sentence progress file' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sentenceProgressFilePlugin()],
})

async function readSentenceProgress(): Promise<SentenceProgressFile> {
  try {
    const rawProgress = await fs.readFile(sentenceProgressPath, 'utf-8')
    return normalizeSentenceProgressFile(JSON.parse(rawProgress))
  } catch {
    return {
      version: 1,
      updatedAt: null,
      expressionStars: 0,
      completedLevelIds: [],
      records: [],
    }
  }
}

async function writeSentenceProgress(progress: SentenceProgressFile) {
  await fs.mkdir(path.dirname(sentenceProgressPath), { recursive: true })
  await fs.writeFile(sentenceProgressPath, `${JSON.stringify(progress, null, 2)}\n`, 'utf-8')
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
    return {
      version: 1,
      updatedAt: null,
      expressionStars: 0,
      completedLevelIds: [],
      records: [],
    }
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

function normalizeSentenceCompletionRecord(value: unknown): SentenceCompletionRecord | null {
  if (!isSentenceCompletionRecord(value)) {
    return null
  }

  return {
    levelId: value.levelId,
    levelTitle: value.levelTitle,
    difficulty: value.difficulty,
    sentence: value.sentence,
    selectedLabels: value.selectedLabels,
    expressionStarsEarned: 1,
    completedAt: value.completedAt,
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

function readRequestBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    request.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    request.on('error', reject)
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}'))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}
