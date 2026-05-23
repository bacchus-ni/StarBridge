import { buddyChatArt } from '../assets/buddyChatArt'
import type { BuddyChatMessage, BuddyChatThread, DeepseekChatMessage } from '../types/chat'

const newChatTitle = '新聊天'
const newChatSubtitle = '小鹿精灵正在等你说第一句话'
const newChatGuide =
  '你好呀，我是星桥小鹿。你可以告诉我今天想聊的事，也可以只说一个词，我会慢慢陪你整理。'

export function createBuddyChatThread(sequence: number, now = new Date()): BuddyChatThread {
  const id = `new-chat-${now.getTime()}-${sequence}`
  const timeLabel = formatMinuteLabel(now)

  return {
    id,
    title: newChatTitle,
    subtitle: newChatSubtitle,
    preview: newChatGuide,
    startedAtLabel: '刚刚创建',
    avatar: buddyChatArt.deerChatAvatar,
    moodLabel: '准备开始',
    moodProgress: 20,
    moodNote: '先说一句想说的话，小鹿会慢慢听你讲。',
    summaryPoints: ['等待第一句话', '小鹿会先接住感受', '聊天标题会在第一次发言后生成'],
    quickQuestions: ['我今天想聊一件事', '我有一点不开心', '我想练习怎么开口'],
    timeline: [{ timeLabel, label: '小鹿发出了聊天引导', done: true }],
    messages: [
      {
        id: `${id}-guide`,
        speaker: 'buddy',
        content: newChatGuide,
        timeLabel,
      },
    ],
  }
}

export function shouldGenerateBuddyChatTitle(
  thread: BuddyChatThread,
  messages: BuddyChatMessage[],
) {
  return thread.title === newChatTitle && !messages.some((message) => message.speaker === 'child')
}

export function buildBuddyChatTitleMessages(firstUserMessage: string): DeepseekChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是一个中文聊天标题生成器。请只返回一个 4 到 10 个中文字符的短标题，不要引号、句号、冒号、解释或换行。',
    },
    {
      role: 'user',
      content: `请为这段孩子和小鹿精灵的聊天生成一个温和、具体的短标题。孩子的第一句话：${firstUserMessage}`,
    },
  ]
}

export function sanitizeBuddyChatTitle(value: string) {
  const [firstLine = ''] = value.trim().split(/\r?\n/)
  return firstLine
    .replace(/^[《「“"'\s]+/, '')
    .replace(/[》」”"'\s。.!！?？:：,，;；]+$/g, '')
    .slice(0, 12)
}

export function createFallbackBuddyChatTitle(firstUserMessage: string) {
  const text = firstUserMessage.trim()
  if (!text) {
    return '新的小聊'
  }

  if (text.includes('不开心') || text.includes('难过') || text.includes('伤心')) {
    return '说说难过'
  }

  if (text.includes('生气') || text.includes('烦')) {
    return '整理生气'
  }

  if (text.includes('害怕') || text.includes('担心')) {
    return '害怕时刻'
  }

  if (text.includes('谢谢') || text.includes('开心')) {
    return '开心分享'
  }

  return text.replace(/\s+/g, '').replace(/[。.!！?？,，;；:：]/g, '').slice(0, 8) || '新的小聊'
}

export function formatMinuteLabel(date = new Date()) {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

