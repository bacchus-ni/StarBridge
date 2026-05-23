import type {
  DeepseekChatMessage,
  DeepseekChatResponse,
  DeepseekChatStreamDelta,
} from '../types/chat'

export type DeepseekChatRequest = {
  messages: DeepseekChatMessage[]
  model?: string
}

type DeepseekChatStreamHandlers = {
  onDelta?: (chunk: DeepseekChatStreamDelta) => void
}

export async function requestDeepseekChat(
  request: DeepseekChatRequest,
): Promise<DeepseekChatResponse> {
  const response = await fetch('/api/deepseek-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model ?? 'deepseek-chat',
      messages: request.messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with ${response.status}`)
  }

  const data = (await response.json()) as Partial<DeepseekChatResponse>

  if (typeof data.content !== 'string' || !data.content.trim()) {
    throw new Error('DeepSeek response did not contain content')
  }

  return {
    content: data.content.trim(),
    fallback: Boolean(data.fallback),
    fallbackReason: typeof data.fallbackReason === 'string' ? data.fallbackReason : undefined,
    fallbackStatus: typeof data.fallbackStatus === 'number' ? data.fallbackStatus : undefined,
  }
}

export async function requestDeepseekChatStream(
  request: DeepseekChatRequest,
  handlers: DeepseekChatStreamHandlers = {},
): Promise<DeepseekChatResponse> {
  const response = await fetch('/api/deepseek-chat', {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model ?? 'deepseek-chat',
      messages: request.messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek stream failed with ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) {
    const data = (await response.json()) as Partial<DeepseekChatResponse>
    const content = typeof data.content === 'string' ? data.content.trim() : ''
    if (!content) {
      throw new Error('DeepSeek response did not contain content')
    }
    handlers.onDelta?.({ delta: content, content })
    return normalizeDeepseekResponse({ ...data, content })
  }

  if (!response.body) {
    throw new Error('DeepSeek stream did not contain a readable body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''
  let donePayload: Partial<DeepseekChatResponse> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseSseBuffer(buffer)
    buffer = parsed.remainder

    for (const event of parsed.events) {
      if (event.event === 'delta') {
        const delta = readStringField(event.data, 'content')
        if (delta) {
          fullContent += delta
          handlers.onDelta?.({ delta, content: fullContent })
        }
      }

      if (event.event === 'done') {
        donePayload = parseJsonObject(event.data)
      }
    }
  }

  if (buffer.trim()) {
    for (const event of parseSseBuffer(`${buffer}\n\n`).events) {
      if (event.event === 'delta') {
        const delta = readStringField(event.data, 'content')
        if (delta) {
          fullContent += delta
          handlers.onDelta?.({ delta, content: fullContent })
        }
      }

      if (event.event === 'done') {
        donePayload = parseJsonObject(event.data)
      }
    }
  }

  if (!fullContent.trim()) {
    throw new Error('DeepSeek stream did not contain content')
  }

  return normalizeDeepseekResponse({
    ...donePayload,
    content: fullContent,
  })
}

function normalizeDeepseekResponse(data: Partial<DeepseekChatResponse>): DeepseekChatResponse {
  return {
    content: typeof data.content === 'string' ? data.content.trim() : '',
    fallback: Boolean(data.fallback),
    fallbackReason: typeof data.fallbackReason === 'string' ? data.fallbackReason : undefined,
    fallbackStatus: typeof data.fallbackStatus === 'number' ? data.fallbackStatus : undefined,
  }
}

type SseEvent = {
  event: string
  data: string
}

function parseSseBuffer(buffer: string): { events: SseEvent[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const blocks = normalized.split('\n\n')
  const remainder = blocks.pop() ?? ''

  return {
    events: blocks.map(parseSseBlock).filter((event): event is SseEvent => Boolean(event)),
    remainder,
  }
}

function parseSseBlock(block: string): SseEvent | null {
  const lines = block.split('\n')
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() ?? 'message'
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (!data) {
    return null
  }

  return { event, data }
}

function readStringField(data: string, field: string) {
  const parsed = parseJsonObject(data)
  const value = parsed[field]
  return typeof value === 'string' ? value : ''
}

function parseJsonObject(data: string): Record<string, unknown> {
  try {
    const value = JSON.parse(data)
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
