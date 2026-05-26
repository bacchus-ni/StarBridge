import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  Clock3,
  Ellipsis,
  Heart,
  Mic,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  Search,
  Send,
  Smile,
  MessageCircleMore,
  Plus,
  Volume2,
} from 'lucide-react'
import { buddyChatArt } from '../../shared/assets/buddyChatArt'
import { artAssets } from '../../shared/assets/art'
import { Button } from '../../shared/components/Button'
import { PageShell } from '../../shared/components/PageShell'
import { SpeakButton } from '../../shared/components/SpeakButton'
import { buddyChatDefaultThreadId, buddyChatSystemPrompt, buddyChatThreads } from '../../shared/data/buddyChat'
import { requestDeepseekChat, requestDeepseekChatStream } from '../../shared/services/deepseekChat'
import type {
  BuddyChatMessage,
  BuddyChatThread,
  DeepseekChatMessage,
  DeepseekChatResponse,
} from '../../shared/types/chat'
import {
  buildBuddyChatTitleMessages,
  createBuddyChatThread,
  createFallbackBuddyChatTitle,
  formatMinuteLabel,
  sanitizeBuddyChatTitle,
  shouldGenerateBuddyChatTitle,
} from '../../shared/utils/buddyChat'
import { speak } from '../../shared/utils/speech'

const localBuddyReply =
  '我听见你了。先让自己慢一点，深呼吸一次，然后只做一件很小的事就好，比如喝一口水、坐稳一点，或者告诉我你最想先解决哪一部分。'

function buildThreadMessages(thread: BuddyChatThread) {
  return thread.messages.map((message) => ({ ...message }))
}

function buildHistoryMessages(thread: BuddyChatThread, messages: BuddyChatMessage[]): DeepseekChatMessage[] {
  const systemMessage: DeepseekChatMessage = { role: 'system', content: buddyChatSystemPrompt }
  const historyMessages = messages.map<DeepseekChatMessage>((message) => ({
    role: message.speaker === 'child' ? 'user' : 'assistant',
    content: message.content,
  }))
  const continueMessage: DeepseekChatMessage = {
    role: 'user',
    content: `请继续陪我完成这段聊天。当前主题是「${thread.title}」。如果合适，请先接住我的情绪，再给一个很具体的小建议。`,
  }

  return [systemMessage, ...historyMessages, continueMessage]
}

function getDeepseekStatusMessage(response: DeepseekChatResponse) {
  if (!response.fallback) {
    return 'DeepSeek 已连接并回复成功'
  }

  if (response.fallbackReason === 'missing_api_key') {
    return '未检测到 DeepSeek API Key，已使用本地回复'
  }

  if (response.fallbackReason === 'deepseek_api_error') {
    return response.fallbackStatus
      ? `DeepSeek 返回 ${response.fallbackStatus}，已使用本地回复`
      : 'DeepSeek 请求失败，已使用本地回复'
  }

  return '本地温和回复已接管'
}

function replaceMessageById(
  messages: BuddyChatMessage[],
  messageId: string,
  content: string,
) {
  return messages.map((message) => (message.id === messageId ? { ...message, content } : message))
}

export function BuddyChatPage() {
  const shellStyle = {
    '--world-background-image': `url(${artAssets.homeBackground})`,
  } as CSSProperties
  const [collapsed, setCollapsed] = useState(false)
  const [threads, setThreads] = useState<BuddyChatThread[]>(() =>
    buddyChatThreads.map((thread) => ({
      ...thread,
      messages: buildThreadMessages(thread),
      timeline: thread.timeline.map((item) => ({ ...item })),
      summaryPoints: [...thread.summaryPoints],
      quickQuestions: [...thread.quickQuestions],
    })),
  )
  const [activeThreadId, setActiveThreadId] = useState(buddyChatDefaultThreadId)
  const [draft, setDraft] = useState('')
  const [messagesByThread, setMessagesByThread] = useState<Record<string, BuddyChatMessage[]>>(() =>
    Object.fromEntries(buddyChatThreads.map((thread) => [thread.id, buildThreadMessages(thread)])),
  )
  const [isThinking, setIsThinking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('已连接星桥小鹿')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const messageIdRef = useRef(0)
  const threadSequenceRef = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [activeThreadId, threads],
  )

  const visibleThreads = useMemo(() => {
    const keyword = sidebarSearch.trim().toLowerCase()
    if (!keyword) return threads

    return threads.filter((thread) => {
      const haystack = [thread.title, thread.subtitle, thread.preview, thread.moodLabel].join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [sidebarSearch, threads])

  const activeMessages = messagesByThread[activeThread.id] ?? activeThread.messages
  const activeLastMessage = activeMessages.at(-1)
  const quickReplies = activeThread.quickQuestions.slice(0, 4)

  useEffect(() => {
    const list = messageListRef.current
    if (!list) return

    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [activeThreadId, activeMessages.length, activeLastMessage?.content])

  const handleNewChat = () => {
    const nextSequence = threadSequenceRef.current + 1
    threadSequenceRef.current = nextSequence

    const thread = createBuddyChatThread(nextSequence)
    setThreads((current) => [thread, ...current])
    setMessagesByThread((current) => ({
      ...current,
      [thread.id]: buildThreadMessages(thread),
    }))
    setActiveThreadId(thread.id)
    setDraft('')
    setSidebarSearch('')
    setStatusMessage('已开启新聊天，小鹿精灵正在等你说第一句话')
  }

  const generateTitleForThread = async (threadId: string, firstUserMessage: string) => {
    try {
      const response = await requestDeepseekChat({
        messages: buildBuddyChatTitleMessages(firstUserMessage),
      })
      const generatedTitle = response.fallback ? '' : sanitizeBuddyChatTitle(response.content)
      const title = generatedTitle || createFallbackBuddyChatTitle(firstUserMessage)

      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId && thread.title === '新聊天'
            ? {
                ...thread,
                title,
                subtitle: '小鹿根据第一句话整理了聊天主题',
              }
            : thread,
        ),
      )
      setStatusMessage(response.fallback ? '已用本地规则生成聊天标题' : 'DeepSeek 已生成聊天标题')
    } catch {
      const title = createFallbackBuddyChatTitle(firstUserMessage)
      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId && thread.title === '新聊天'
            ? {
                ...thread,
                title,
                subtitle: '小鹿根据第一句话整理了聊天主题',
              }
            : thread,
        ),
      )
      setStatusMessage('已用本地规则生成聊天标题')
    }
  }

  const sendMessage = async (content: string) => {
    const text = content.trim()
    if (!text || isThinking) {
      return
    }

    const nextMessageId = messageIdRef.current + 1
    messageIdRef.current = nextMessageId

    const userMessage: BuddyChatMessage = {
      id: `msg-${nextMessageId}`,
      speaker: 'child',
      content: text,
      timeLabel: formatMinuteLabel(),
    }

    const thread = activeThread
    const threadId = thread.id
    const replyId = `reply-${nextMessageId}`
    const reply: BuddyChatMessage = {
      id: replyId,
      speaker: 'buddy',
      content: '',
      timeLabel: formatMinuteLabel(),
    }
    const shouldGenerateTitle = shouldGenerateBuddyChatTitle(thread, activeMessages)
    const nextMessages = [...activeMessages, userMessage]

    setThreads((current) =>
      current.map((item) =>
        item.id === threadId
          ? {
              ...item,
              preview: text,
              subtitle: shouldGenerateTitle ? '小鹿正在根据第一句话整理主题' : item.subtitle,
              startedAtLabel: item.startedAtLabel === '刚刚创建' ? '开始于 刚刚' : item.startedAtLabel,
              moodLabel: shouldGenerateTitle ? '正在倾听' : item.moodLabel,
              moodProgress: Math.max(item.moodProgress, 32),
              timeline: shouldGenerateTitle
                ? [...item.timeline, { timeLabel: userMessage.timeLabel, label: '你发出了第一句话', done: true }]
                : item.timeline,
            }
          : item,
      ),
    )
    setMessagesByThread((current) => ({
      ...current,
      [threadId]: [...nextMessages, reply],
    }))
    setDraft('')
    setIsThinking(true)
    setStatusMessage(shouldGenerateTitle ? 'DeepSeek 正在回复，并整理聊天标题...' : 'DeepSeek 正在流式回复...')

    if (shouldGenerateTitle) {
      void generateTitleForThread(threadId, text)
    }

    try {
      const response = await requestDeepseekChatStream(
        {
          messages: buildHistoryMessages(thread, nextMessages),
        },
        {
          onDelta: ({ content: streamedContent }) => {
            setMessagesByThread((current) => {
              const currentMessages = current[threadId] ?? [...nextMessages, reply]
              return {
                ...current,
                [threadId]: replaceMessageById(currentMessages, replyId, streamedContent),
              }
            })
          },
        },
      )

      setMessagesByThread((current) => {
        const currentMessages = current[threadId] ?? [...nextMessages, reply]
        return {
          ...current,
          [threadId]: replaceMessageById(currentMessages, replyId, response.content),
        }
      })
      setStatusMessage(getDeepseekStatusMessage(response))
      void speak(response.content)
    } catch {
      setMessagesByThread((current) => {
        const currentMessages = current[threadId] ?? [...nextMessages, reply]
        return {
          ...current,
          [threadId]: replaceMessageById(currentMessages, replyId, localBuddyReply),
        }
      })
      setStatusMessage('已切换到本地温和回复')
      void speak(localBuddyReply)
    } finally {
      setIsThinking(false)
    }
  }

  const handleQuestion = (question: string) => {
    void sendMessage(question)
  }

  return (
    <PageShell activePath="/buddy-chat" activeRail="buddy" className="app-shell-world-bg" style={shellStyle}>
      <div className={collapsed ? 'buddy-chat-layout is-chat-sidebar-collapsed' : 'buddy-chat-layout'}>
        <aside className={collapsed ? 'buddy-chat-sidebar is-collapsed' : 'buddy-chat-sidebar'}>
          <div className="buddy-chat-sidebar-top">
            <Button className="buddy-chat-new-button" icon={<Plus size={20} />} onClick={handleNewChat}>
              新聊天
            </Button>

            <div className="buddy-chat-sidebar-toolbar">
              <button
                className="buddy-chat-toolbar-button"
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? '展开聊天侧栏' : '收起聊天侧栏'}
              >
                {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
              </button>
            </div>
          </div>

          <div className="buddy-chat-filter-row">
            <button className="buddy-chat-filter-chip" type="button">
              <MessageCircleMore size={16} />
              切换聊天
            </button>
            <button className="buddy-chat-filter-chip is-ghost" type="button">
              最新
              <ChevronRight size={16} />
            </button>
          </div>

          <label className="buddy-chat-search">
            <Search size={16} />
            <input
              value={sidebarSearch}
              onChange={(event) => setSidebarSearch(event.target.value)}
              placeholder="搜索聊天"
              aria-label="搜索聊天"
            />
          </label>

          <div className="buddy-chat-thread-list">
            {visibleThreads.map((thread) => {
              const active = thread.id === activeThread.id
              return (
                <button
                  key={thread.id}
                  className={active ? 'buddy-chat-thread is-active' : 'buddy-chat-thread'}
                  type="button"
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <img className="buddy-chat-thread-avatar" src={thread.avatar} alt="" />
                  <div className="buddy-chat-thread-copy">
                    <strong>{thread.title}</strong>
                    <p>{thread.preview}</p>
                    <span>{thread.startedAtLabel}</span>
                  </div>
                  <span className="buddy-chat-thread-dot" aria-hidden="true" />
                </button>
              )
            })}
          </div>

          <Button className="buddy-chat-history-button" variant="ghost" icon={<Clock3 size={18} />}>
            查看全部聊天记录
          </Button>

          <section className="buddy-chat-sidebar-emotion" aria-labelledby="buddy-chat-emotion-title">
            <div className="buddy-chat-card-heading">
              <Heart size={18} />
              <h2 id="buddy-chat-emotion-title">情绪状态</h2>
            </div>
            <div className="buddy-chat-emotion-box">
              <img src={buddyChatArt.emotionCloud} alt="" />
              <strong>{activeThread.moodLabel}</strong>
              <div className="buddy-chat-progress-row">
                <span>情绪能量</span>
                <div className="buddy-chat-progress-track">
                  <div style={{ width: `${activeThread.moodProgress}%` }} />
                </div>
                <b>{activeThread.moodProgress}%</b>
              </div>
              <p>{activeThread.moodNote}</p>
            </div>
          </section>
        </aside>

        <main className="buddy-chat-main">
          <section className="buddy-chat-stage paper-card">
            <div className="buddy-chat-stage-header">
              <div className="buddy-chat-stage-heading">
                <img className="buddy-chat-stage-avatar" src={activeThread.avatar} alt="" />
                <div>
                  <p className="buddy-chat-stage-kicker">星桥小助手</p>
                  <h1>{activeThread.title}</h1>
                  <p className="buddy-chat-stage-subtitle">{activeThread.subtitle}</p>
                </div>
              </div>

              <div className="buddy-chat-stage-tools">
                <button className="buddy-chat-icon-button" type="button" aria-label="搜索">
                  <Search size={20} />
                </button>
                <button className="buddy-chat-icon-button" type="button" aria-label="更多">
                  <Ellipsis size={20} />
                </button>
              </div>
            </div>

            <div className="buddy-chat-message-list" ref={messageListRef}>
              {activeMessages.map((message) => (
                <article
                  key={message.id}
                  className={
                    message.speaker === 'child' ? 'buddy-chat-message is-child' : 'buddy-chat-message is-buddy'
                  }
                >
                  <img
                    className="buddy-chat-message-avatar"
                    src={message.speaker === 'child' ? buddyChatArt.childAvatar : activeThread.avatar}
                    alt=""
                  />
                  <div className="buddy-chat-bubble">
                    <p>{message.content || (message.speaker === 'buddy' ? '小鹿正在输入...' : '')}</p>
                    <span>{message.timeLabel}</span>
                    <button
                      className="buddy-chat-play-button"
                      type="button"
                      aria-label={`朗读消息：${message.content || '小鹿正在输入'}`}
                      disabled={!message.content.trim()}
                      onClick={() => speak(message.content)}
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="buddy-chat-quick-replies">
              <p>你可以这样回复我：</p>
              <div className="buddy-chat-chip-row">
                {quickReplies.map((item) => (
                  <button
                    key={item}
                    className="buddy-chat-reply-chip"
                    type="button"
                    onClick={() => handleQuestion(item)}
                  >
                    {item}
                  </button>
                ))}
                <button
                  className="buddy-chat-reply-chip is-refresh"
                  type="button"
                  onClick={() => setStatusMessage('已换一组建议')}
                >
                  <RefreshCw size={16} />
                  换一组
                </button>
              </div>
            </div>

            <div className="buddy-chat-compose">
              <SpeakButton text={draft || '输入你想对星桥小鹿说的话'} label="朗读输入框" />
              <div className="buddy-chat-input-shell">
                <button className="buddy-chat-mic-button" type="button" aria-label="语音输入">
                  <Mic size={20} />
                </button>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void sendMessage(draft)
                    }
                  }}
                  placeholder="输入你想对精灵小鹿说的话..."
                  rows={2}
                />
                <button className="buddy-chat-smile-button" type="button" aria-label="表情">
                  <Smile size={18} />
                </button>
              </div>
              <Button
                className="buddy-chat-send-button"
                icon={<Send size={18} />}
                onClick={() => void sendMessage(draft)}
                disabled={isThinking || !draft.trim()}
              >
                发送
              </Button>
              <p className="buddy-chat-input-note">按 Enter 发送，按 Shift + Enter 换行</p>
            </div>
          </section>
        </main>

        <div className="buddy-chat-float-note">
          <img src={buddyChatArt.deerBedtime} alt="" />
          <div>
            <p>初始模式 已连接</p>
            <strong>{statusMessage}</strong>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
