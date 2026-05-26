import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'

type DoubaoTtsOptions = {
  apiKey?: string
  appId?: string
  accessKey?: string
  speakerId?: string
  resourceId?: string
  outputFormat?: 'mp3' | 'ogg_opus' | 'pcm'
  sampleRate?: number
  speechRate?: number
  loudnessRate?: number
  model?: string
}

type DoubaoTtsPayload = {
  text?: string
}

type DoubaoTtsEvent = {
  code?: number
  message?: string
  data?: string
  usage?: unknown
}

const ttsUrl = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
const defaultResourceId = 'seed-icl-2.0'
const defaultOutputFormat = 'mp3'
const defaultSampleRate = 24000

export function doubaoTtsProxyPlugin(options: DoubaoTtsOptions = {}): Plugin {
  return {
    name: 'starbridge-doubao-tts-proxy',
    configureServer(server) {
      server.middlewares.use(createDoubaoTtsMiddleware(server, options))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createDoubaoTtsMiddleware(server, options))
    },
  }
}

function createDoubaoTtsMiddleware(
  server: ViteDevServer | PreviewServer,
  options: DoubaoTtsOptions,
) {
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (request.url?.split('?')[0] !== '/api/doubao-tts') {
      next()
      return
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const payload = normalizePayload(await readRequestBody(request))
      if (!payload.text) {
        sendJson(response, 400, { error: 'Missing text' })
        return
      }

      const speakerId = resolveSpeakerId(options)
      if (!speakerId) {
        sendJson(response, 503, { error: 'Missing Doubao TTS speaker id' })
        return
      }

      const headers = buildRequestHeaders(options)
      if (!headers) {
        sendJson(response, 503, { error: 'Missing Volcengine credentials' })
        return
      }

      const outputFormat = options.outputFormat ?? defaultOutputFormat
      const ttsResponse = await fetch(ttsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user: { uid: 'starbridge-demo' },
          namespace: 'BidirectionalTTS',
          req_params: {
            text: payload.text,
            speaker: speakerId,
            audio_params: {
              format: outputFormat,
              sample_rate: options.sampleRate ?? defaultSampleRate,
              speech_rate: options.speechRate ?? 0,
              loudness_rate: options.loudnessRate ?? 0,
            },
            ...(options.model ? { model: options.model } : {}),
          },
        }),
      })

      const logid = ttsResponse.headers.get('X-Tt-Logid')
      if (!ttsResponse.ok || !ttsResponse.body) {
        const errorBody = await ttsResponse.text().catch(() => '')
        server.config.logger.warn(
          `Doubao TTS returned ${ttsResponse.status}; logid=${logid ?? 'none'}; body=${truncateForLog(errorBody)}`,
        )
        sendJson(response, 502, { error: 'Doubao TTS request failed', status: ttsResponse.status, logid })
        return
      }

      const audio = await collectAudioFromEvents(ttsResponse.body, logid)
      if (!audio.byteLength) {
        sendJson(response, 502, { error: 'Doubao TTS returned empty audio', logid })
        return
      }

      response.statusCode = 200
      response.setHeader('Content-Type', getContentType(outputFormat))
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('X-Tt-Logid', logid ?? '')
      response.end(audio)
    } catch (error) {
      server.config.logger.error(error instanceof Error ? error.message : String(error))
      sendJson(response, 500, { error: 'Unable to synthesize speech' })
    }
  }
}

function normalizePayload(value: unknown): DoubaoTtsPayload {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const text = (value as DoubaoTtsPayload).text
  return {
    text: typeof text === 'string' ? text.trim() : undefined,
  }
}

function resolveSpeakerId(options: DoubaoTtsOptions) {
  return firstEnvValue(
    options.speakerId,
    process.env.DOUBAO_TTS_SPEAKER_ID,
    process.env.DOUBAO_VOICE_ID,
    process.env.VOLCENGINE_DOUBAO_VOICE_ID,
  )
}

function buildRequestHeaders(options: DoubaoTtsOptions) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Request-Id': randomUUID(),
    'X-Api-Resource-Id': options.resourceId ?? process.env.DOUBAO_TTS_RESOURCE_ID ?? defaultResourceId,
    'X-Control-Require-Usage-Tokens-Return': 'text_words',
  }

  const apiKey = firstEnvValue(options.apiKey, process.env.VOLCENGINE_API_KEY)
  const appId = firstEnvValue(options.appId, process.env.VOLCENGINE_APP_ID)
  const accessKey = firstEnvValue(options.accessKey, process.env.VOLCENGINE_ACCESS_KEY)

  if (apiKey) {
    headers['X-Api-Key'] = apiKey
    return headers
  }

  if (appId && accessKey) {
    headers['X-Api-App-Id'] = appId
    headers['X-Api-Access-Key'] = accessKey
    return headers
  }

  return null
}

async function collectAudioFromEvents(body: ReadableStream<Uint8Array>, logid: string | null) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const audioChunks: Buffer[] = []
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseEventLines(buffer)
    buffer = parsed.remainder
    for (const event of parsed.events) {
      appendAudioEvent(audioChunks, event, logid)
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    for (const event of parseEventLines(`${buffer}\n`).events) {
      appendAudioEvent(audioChunks, event, logid)
    }
  }

  return Buffer.concat(audioChunks)
}

function parseEventLines(buffer: string) {
  const lines = buffer.replace(/\r\n/g, '\n').split('\n')
  const remainder = lines.pop() ?? ''
  const events: DoubaoTtsEvent[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('event:')) {
      continue
    }

    const dataLine = line.startsWith('data:') ? line.slice(5).trim() : line
    try {
      const event = JSON.parse(dataLine)
      if (event && typeof event === 'object') {
        events.push(event as DoubaoTtsEvent)
      }
    } catch {
      throw new Error(`Unable to parse Doubao TTS event; logid=${logidForError(dataLine)}`)
    }
  }

  return { events, remainder }
}

function appendAudioEvent(audioChunks: Buffer[], event: DoubaoTtsEvent, logid: string | null) {
  const code = event.code
  if (code !== undefined && code !== 0 && code !== 20000000) {
    throw new Error(`Doubao TTS event failed; logid=${logid ?? 'none'}; code=${code}; message=${event.message ?? ''}`)
  }

  if (event.data) {
    audioChunks.push(Buffer.from(event.data, 'base64'))
  }
}

function getContentType(format: string) {
  if (format === 'ogg_opus') return 'audio/ogg'
  if (format === 'pcm') return 'audio/L16'
  return 'audio/mpeg'
}

function firstEnvValue(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim()
}

function logidForError(value: string) {
  return value.replace(/\s+/g, ' ').slice(0, 120)
}

function truncateForLog(value: string) {
  return value.replace(/\s+/g, ' ').slice(0, 320)
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

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}
