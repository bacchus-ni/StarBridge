export type BuddyChatSpeaker = 'child' | 'buddy'

export type DeepseekChatRole = 'system' | 'user' | 'assistant'

export interface BuddyChatMessage {
  id: string
  speaker: BuddyChatSpeaker
  content: string
  timeLabel: string
}

export interface BuddyChatTimelineItem {
  timeLabel: string
  label: string
  done: boolean
}

export interface BuddyChatThread {
  id: string
  title: string
  subtitle: string
  preview: string
  startedAtLabel: string
  avatar: string
  moodLabel: string
  moodProgress: number
  moodNote: string
  summaryPoints: string[]
  quickQuestions: string[]
  timeline: BuddyChatTimelineItem[]
  messages: BuddyChatMessage[]
}

export interface DeepseekChatMessage {
  role: DeepseekChatRole
  content: string
}

export interface DeepseekChatResponse {
  content: string
  fallback: boolean
  fallbackReason?: string
  fallbackStatus?: number
}

export type DeepseekChatStreamDelta = {
  delta: string
  content: string
}
