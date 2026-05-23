import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import type { DeepseekChatMessage } from './src/shared/types/chat'

type DeepseekProxyOptions = {
  apiKey?: string
  apiBaseUrl?: string
  model?: string
}

type DeepseekProxyPayload = {
  model?: string
  messages?: DeepseekChatMessage[]
  stream?: boolean
}

type DeepseekApiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type DeepseekApiStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}

type FallbackReason =
  | 'missing_api_key'
  | 'missing_messages'
  | 'deepseek_api_error'
  | 'empty_deepseek_response'
  | 'proxy_error'

const defaultApiBaseUrl = 'https://api.deepseek.com'
const defaultModel = 'deepseek-chat'

export function deepseekProxyPlugin(options: DeepseekProxyOptions = {}): Plugin {
  return {
    name: 'starbridge-deepseek-proxy',
    configureServer(server) {
      server.middlewares.use(createDeepseekMiddleware(server, options))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createDeepseekMiddleware(server, options))
    },
  }
}

function createDeepseekMiddleware(
  server: ViteDevServer | PreviewServer,
  options: DeepseekProxyOptions,
) {
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (!isDeepseekRequest(request.url)) {
      next()
      return
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const payload = normalizePayload(await readRequestBody(request))
      const fallbackContent = buildFallbackContent(payload.messages)
      const apiKey = resolveApiKey(options)
      const shouldStream = payload.stream === true || acceptsEventStream(request)

      if (!payload.messages?.length) {
        sendFallbackResponse(response, fallbackContent, 'missing_messages', shouldStream)
        return
      }

      if (!apiKey) {
        sendFallbackResponse(response, fallbackContent, 'missing_api_key', shouldStream)
        return
      }

      const completion = await fetch(resolveDeepseekApiUrl(options), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: payload.model ?? options.model ?? defaultModel,
          messages: payload.messages,
          temperature: 0.7,
          stream: shouldStream,
        }),
      })

      if (!completion.ok) {
        const errorBody = await completion.text().catch(() => '')
        server.config.logger.warn(
          `DeepSeek API returned ${completion.status}${errorBody ? `: ${truncateForLog(errorBody)}` : ''}`,
        )
        sendFallbackResponse(response, fallbackContent, 'deepseek_api_error', shouldStream, completion.status)
        return
      }

      if (shouldStream) {
        if (!completion.body) {
          sendFallbackStream(response, fallbackContent, 'empty_deepseek_response')
          return
        }

        await streamDeepseekCompletion(completion.body, response, fallbackContent)
        return
      }

      const data = (await completion.json()) as DeepseekApiChatResponse
      const content = data.choices?.[0]?.message?.content?.trim()

      if (!content) {
        sendFallback(response, fallbackContent, 'empty_deepseek_response')
        return
      }

      sendJson(response, 200, { content, fallback: false })
    } catch (error) {
      server.config.logger.error(error instanceof Error ? error.message : String(error))
      if (isSseStarted(response)) {
        sendSse(response, 'done', { fallback: true, fallbackReason: 'proxy_error' })
        response.end()
        return
      }

      sendFallbackResponse(
        response,
        buildFallbackContent(),
        'proxy_error',
        acceptsEventStream(request),
      )
    }
  }
}

function isDeepseekRequest(url: string | undefined) {
  return url?.split('?')[0] === '/api/deepseek-chat'
}

function acceptsEventStream(request: IncomingMessage) {
  return request.headers.accept?.includes('text/event-stream') ?? false
}

function resolveApiKey(options: DeepseekProxyOptions) {
  return options.apiKey ?? process.env.DEEPSEEK_API_KEY ?? process.env.VITE_DEEPSEEK_API_KEY
}

function resolveDeepseekApiUrl(options: DeepseekProxyOptions) {
  const baseUrl = options.apiBaseUrl ?? process.env.DEEPSEEK_API_BASE_URL ?? defaultApiBaseUrl
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`
}

function normalizePayload(value: unknown): DeepseekProxyPayload {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const payload = value as DeepseekProxyPayload
  return {
    model: typeof payload.model === 'string' ? payload.model : undefined,
    messages: Array.isArray(payload.messages) ? payload.messages.filter(isDeepseekChatMessage) : [],
    stream: payload.stream === true,
  }
}

function isDeepseekChatMessage(value: unknown): value is DeepseekChatMessage {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as DeepseekChatMessage).role === 'string' &&
      typeof (value as DeepseekChatMessage).content === 'string',
  )
}

function buildFallbackContent(messages?: DeepseekChatMessage[]) {
  const lastUserMessage =
    [...(messages ?? [])].reverse().find((item) => item.role === 'user')?.content ?? ''

  if (lastUserMessage.includes('生气') || lastUserMessage.includes('烦躁')) {
    return '我听见你的烦躁了。先别急着把它赶走，我们可以先慢慢吸气一次，再把今天最让你不舒服的那一刻说给我听。'
  }

  if (lastUserMessage.includes('害怕') || lastUserMessage.includes('担心')) {
    return '我听见你的担心了。我们先把周围看一眼，找一个能让你安心的小东西，再告诉大人你现在需要陪伴。'
  }

  if (lastUserMessage.includes('谢谢')) {
    return '你把感谢说出来了，这很棒。可以再轻轻补一句“谢谢你今天帮我”，让那份开心更完整一点。'
  }

  if (lastUserMessage.includes('晚安')) {
    return '晚安呀，今天已经做得很好了。把小心事先放到一边，闭上眼睛慢慢休息，我们明天再继续。'
  }

  return '我听见你了。先让自己慢一点，深呼吸一次，再告诉我你最想先解决哪一件事。'
}

function sendFallback(
  response: ServerResponse,
  content: string,
  fallbackReason: FallbackReason,
  fallbackStatus?: number,
) {
  sendJson(response, 200, {
    content,
    fallback: true,
    fallbackReason,
    fallbackStatus,
  })
}

function sendFallbackResponse(
  response: ServerResponse,
  content: string,
  fallbackReason: FallbackReason,
  stream: boolean,
  fallbackStatus?: number,
) {
  if (stream) {
    sendFallbackStream(response, content, fallbackReason, fallbackStatus)
    return
  }

  sendFallback(response, content, fallbackReason, fallbackStatus)
}

async function streamDeepseekCompletion(
  body: ReadableStream<Uint8Array>,
  response: ServerResponse,
  fallbackContent: string,
) {
  startSse(response)

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let hasContent = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseSseBuffer(buffer)
    buffer = parsed.remainder

    for (const eventData of parsed.data) {
      if (eventData === '[DONE]') {
        continue
      }

      const chunk = parseDeepseekStreamChunk(eventData)
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        hasContent = true
        sendSse(response, 'delta', { content })
      }
    }
  }

  if (buffer.trim()) {
    for (const eventData of parseSseBuffer(`${buffer}\n\n`).data) {
      if (eventData !== '[DONE]') {
        const content = parseDeepseekStreamChunk(eventData).choices?.[0]?.delta?.content
        if (content) {
          hasContent = true
          sendSse(response, 'delta', { content })
        }
      }
    }
  }

  if (!hasContent) {
    writeFallbackChunks(response, fallbackContent)
    sendSse(response, 'done', { fallback: true, fallbackReason: 'empty_deepseek_response' })
    response.end()
    return
  }

  sendSse(response, 'done', { fallback: false })
  response.end()
}

function sendFallbackStream(
  response: ServerResponse,
  content: string,
  fallbackReason: FallbackReason,
  fallbackStatus?: number,
) {
  startSse(response)
  writeFallbackChunks(response, content)
  sendSse(response, 'done', {
    fallback: true,
    fallbackReason,
    fallbackStatus,
  })
  response.end()
}

function startSse(response: ServerResponse) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('Connection', 'keep-alive')
  response.setHeader('X-Accel-Buffering', 'no')
  response.flushHeaders?.()
}

function sendSse(response: ServerResponse, event: string, payload: unknown) {
  response.write(`event: ${event}\n`)
  response.write(`data: ${JSON.stringify(payload)}\n\n`)
}

function writeFallbackChunks(response: ServerResponse, content: string) {
  for (const chunk of chunkText(content, 16)) {
    sendSse(response, 'delta', { content: chunk })
  }
}

function chunkText(content: string, chunkSize: number) {
  const chunks: string[] = []
  for (let index = 0; index < content.length; index += chunkSize) {
    chunks.push(content.slice(index, index + chunkSize))
  }
  return chunks
}

function parseSseBuffer(buffer: string) {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const blocks = normalized.split('\n\n')
  const remainder = blocks.pop() ?? ''

  return {
    data: blocks.flatMap((block) =>
      block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart()),
    ),
    remainder,
  }
}

function parseDeepseekStreamChunk(data: string): DeepseekApiStreamChunk {
  try {
    const value = JSON.parse(data)
    return value && typeof value === 'object' ? (value as DeepseekApiStreamChunk) : {}
  } catch {
    return {}
  }
}

function isSseStarted(response: ServerResponse) {
  return response.getHeader('Content-Type')?.toString().includes('text/event-stream') ?? false
}

function truncateForLog(value: string) {
  return value.replace(/\s+/g, ' ').slice(0, 320)
}

async function readRequestBody(request: IncomingMessage): Promise<unknown> {
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
