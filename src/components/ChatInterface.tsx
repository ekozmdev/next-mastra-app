'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage, UIMessagePart } from 'ai'
import { useSession } from 'next-auth/react'
import { Send, User, Bot, MessageCircle, PlusCircle, Loader2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorAlert } from './ErrorAlert'

const SESSION_TITLE_FALLBACK = '新しいチャット'

type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error'

interface ToolMessagePart extends UIMessagePart {
  state?: ToolState
  input?: unknown
  output?: unknown
  errorText?: string
  toolName?: string
}

interface StoredChatMessage {
  _id?: string
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  sessionId?: string
}

interface ChatSessionSummary {
  id: string
  title: string
  updatedAt?: string
  lastMessage?: string
}

interface HistoryResponse {
  messages?: StoredChatMessage[]
  sessions?: (string | null | undefined)[]
  hasMore?: boolean
}

const isToolMessagePart = (part: UIMessagePart): part is ToolMessagePart => {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-')
}

const buildSessionTitle = (text?: string) => {
  if (!text) {
    return undefined
  }

  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return undefined
  }

  return normalized.length > 24 ? `${normalized.slice(0, 24)}…` : normalized
}

const createMessagePreview = (text?: string) => {
  if (!text) {
    return undefined
  }

  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return undefined
  }

  return normalized.length > 42 ? `${normalized.slice(0, 42)}…` : normalized
}

const getTimeValue = (value?: string) => {
  if (!value) {
    return 0
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

const formatTimestamp = (value?: string) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const toUIMessages = (messages: StoredChatMessage[]): UIMessage[] => {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .reverse()
    .map((message) => ({
      id: message._id ?? message.id ?? `${message.role}-${message.timestamp ?? generateSessionId()}`,
      role: message.role,
      parts: [
        {
          type: 'text',
          text: message.content
        }
      ]
    }))
}

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 12)
}

export function ChatInterface() {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>()
  const historyAbortControllerRef = useRef<AbortController | null>(null)
  const activeHistoryRequestRef = useRef<symbol | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string>()
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const { error, clearError, handleError } = useErrorHandler()
  const [input, setInput] = useState('')

  useEffect(() => {
    sessionIdRef.current = currentSessionId
  }, [currentSessionId])

  const upsertSession = useCallback((sessionId: string, updates: Partial<ChatSessionSummary> = {}) => {
    setSessions((prev) => {
      const existing = prev.find((item) => item.id === sessionId)
      const updated: ChatSessionSummary = {
        id: sessionId,
        title: updates.title ?? existing?.title ?? SESSION_TITLE_FALLBACK,
        updatedAt: updates.updatedAt ?? existing?.updatedAt ?? new Date().toISOString(),
        lastMessage: updates.lastMessage ?? existing?.lastMessage
      }

      const filtered = prev.filter((item) => item.id !== sessionId)
      const next = [updated, ...filtered]
      next.sort((a, b) => getTimeValue(b.updatedAt) - getTimeValue(a.updatedAt))
      return next
    })
  }, [])

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: async ({ body, id, messages, trigger, messageId }) => {
          const sessionId = sessionIdRef.current

          return {
            body: {
              ...body,
              id,
              messages,
              trigger,
              messageId,
              ...(sessionId ? { sessionId } : {})
            }
          }
        }
      }),
    []
  )

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    clearError: clearChatError
  } = useChat({
    transport: chatTransport,
    onFinish: (result) => {
      setIsTyping(false)
      if (sessionIdRef.current) {
        upsertSession(sessionIdRef.current, {
          updatedAt: new Date().toISOString(),
          lastMessage: createMessagePreview(result.text)
        })
      }
    },
    onError: (apiError: Error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Chat error:', apiError)
      }
      handleError(apiError)
      setIsTyping(false)
    }
  })

  const handleClearError = useCallback(() => {
    clearError()
    clearChatError()
  }, [clearError, clearChatError])

  const ensureSessionId = useCallback(() => {
    if (sessionIdRef.current) {
      return sessionIdRef.current
    }

    const newId = generateSessionId()
    sessionIdRef.current = newId
    setCurrentSessionId(newId)
    upsertSession(newId, {
      title: SESSION_TITLE_FALLBACK,
      updatedAt: new Date().toISOString()
    })
    return newId
  }, [upsertSession])

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    const requestId = Symbol('historyRequest')
    activeHistoryRequestRef.current = requestId

    historyAbortControllerRef.current?.abort()
    const controller = new AbortController()
    historyAbortControllerRef.current = controller

    setIsLoadingHistory(true)
    sessionIdRef.current = sessionId
    setCurrentSessionId(sessionId)
    handleClearError()

    try {
      const params = new URLSearchParams({ sessionId, limit: '100' })
      const response = await fetch(`/api/chat/history?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('チャット履歴の取得に失敗しました')
      }

      const data: HistoryResponse = await response.json()

      if (activeHistoryRequestRef.current !== requestId) {
        return
      }

      const apiMessages = data.messages ?? []
      const normalizedMessages = toUIMessages(apiMessages)

      setMessages(normalizedMessages)
      setInput('')
      setIsTyping(false)

      const latestMessage = apiMessages[0]
      const latestUserMessage = apiMessages.find((message) => message.sessionId === sessionId && message.role === 'user')
      const titleCandidate = buildSessionTitle(latestUserMessage?.content ?? latestMessage?.content)

      upsertSession(sessionId, {
        title: titleCandidate,
        updatedAt: latestMessage?.timestamp ?? new Date().toISOString(),
        lastMessage: createMessagePreview(latestMessage?.content)
      })
    } catch (fetchError) {
      if (controller.signal.aborted || activeHistoryRequestRef.current !== requestId) {
        return
      }

      const handledError = fetchError instanceof Error ? fetchError : new Error('チャット履歴の取得に失敗しました')
      handleError(handledError)
    } finally {
      if (activeHistoryRequestRef.current === requestId) {
        activeHistoryRequestRef.current = null
        historyAbortControllerRef.current = null
        setIsLoadingHistory(false)
      }
    }
  }, [handleClearError, handleError, setMessages, setInput, setIsTyping, upsertSession])

  useEffect(() => {
    if (!session) {
      return
    }

    let isCancelled = false

    const initialize = async () => {
      setIsLoadingHistory(true)

      try {
        const response = await fetch('/api/chat/history?limit=100', {
          method: 'GET',
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error('チャット履歴の取得に失敗しました')
        }

        const data: HistoryResponse = await response.json()
        const validSessionIds = (data.sessions ?? []).filter((id): id is string => Boolean(id))

        if (validSessionIds.length === 0) {
          const newId = generateSessionId()
          if (!isCancelled) {
            sessionIdRef.current = newId
            setCurrentSessionId(newId)
            upsertSession(newId, {
              title: SESSION_TITLE_FALLBACK,
              updatedAt: new Date().toISOString()
            })
            setMessages([])
          }
          return
        }

        const summaries = validSessionIds.map((id) => {
          const latestMessage = (data.messages ?? []).find((message) => message.sessionId === id)
          const latestUserMessage = (data.messages ?? []).find((message) => message.sessionId === id && message.role === 'user')
          const titleCandidate = buildSessionTitle(latestUserMessage?.content ?? latestMessage?.content)

          return {
            id,
            title: titleCandidate ?? SESSION_TITLE_FALLBACK,
            updatedAt: latestMessage?.timestamp ?? new Date().toISOString(),
            lastMessage: createMessagePreview(latestMessage?.content)
          }
        })

        const sorted = summaries.sort((a, b) => getTimeValue(b.updatedAt) - getTimeValue(a.updatedAt))

        if (!isCancelled) {
          setSessions(sorted)
          const initialId = sorted[0]?.id
          if (initialId) {
            await loadSessionMessages(initialId)
          }
        }
      } catch (initError) {
        if (!isCancelled) {
          const handledError = initError instanceof Error ? initError : new Error('チャット履歴の取得に失敗しました')
          handleError(handledError)
          const newId = generateSessionId()
          sessionIdRef.current = newId
          setCurrentSessionId(newId)
          upsertSession(newId, {
            title: SESSION_TITLE_FALLBACK,
            updatedAt: new Date().toISOString()
          })
          setMessages([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false)
        }
      }
    }

    void initialize()

    return () => {
      isCancelled = true
    }
  }, [session, handleError, loadSessionMessages, setMessages, upsertSession])

  useEffect(() => {
    return () => {
      historyAbortControllerRef.current?.abort()
      historyAbortControllerRef.current = null
      activeHistoryRequestRef.current = null
    }
  }, [])

  const chatMessages = messages as UIMessage[]
  const lastMessage = chatMessages[chatMessages.length - 1]
  const isStreaming = status === 'submitted' || status === 'streaming'
  const isBusy = isStreaming || isLoadingHistory

  useEffect(() => {
    if (chatMessages.length === 0) {
      return
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    setIsTyping(isStreaming)
  }, [isStreaming])

  const showTypingIndicator = !isLoadingHistory && isTyping && (!lastMessage || lastMessage.role !== 'assistant')

  const submitMessage = () => {
    const trimmed = input.trim()
    if (!trimmed || isBusy) {
      return
    }

    const sessionId = ensureSessionId()
    const nowIso = new Date().toISOString()
    const titleCandidate = buildSessionTitle(trimmed)

    handleClearError()
    sendMessage({ text: trimmed })
    setInput('')

    upsertSession(sessionId, {
      title: titleCandidate,
      updatedAt: nowIso,
      lastMessage: createMessagePreview(trimmed)
    })
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitMessage()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      submitMessage()
    }
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    const textarea = event.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`
  }

  const handleSessionSelect = useCallback((sessionId: string) => {
    if (!sessionId || sessionId === currentSessionId) {
      return
    }

    void loadSessionMessages(sessionId)
  }, [currentSessionId, loadSessionMessages])

  const handleCreateNewChat = useCallback(() => {
    const hasMessages = messages.length > 0
    const hasInput = input.trim().length > 0

    if (!hasMessages && !hasInput && !isTyping) {
      return
    }

    historyAbortControllerRef.current?.abort()
    historyAbortControllerRef.current = null
    activeHistoryRequestRef.current = null

    const newId = generateSessionId()
    sessionIdRef.current = newId
    setCurrentSessionId(newId)
    setMessages([])
    setInput('')
    setIsTyping(false)
    handleClearError()
    setIsLoadingHistory(false)
    upsertSession(newId, {
      title: SESSION_TITLE_FALLBACK,
      updatedAt: new Date().toISOString(),
      lastMessage: undefined
    })
  }, [handleClearError, input, isTyping, messages, setInput, setMessages, setIsTyping, upsertSession])

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) {
        return
      }

      setDeletingSessionId(sessionId)
      handleClearError()

      const abortActiveSession = sessionId === currentSessionId
      if (abortActiveSession) {
        historyAbortControllerRef.current?.abort()
        historyAbortControllerRef.current = null
        activeHistoryRequestRef.current = null
      }

      try {
        const response = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`, {
          method: 'DELETE',
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error('チャットの削除に失敗しました')
        }

        const remainingSessions = sessions.filter((item) => item.id !== sessionId)
        setSessions(remainingSessions)

        if (sessionId === currentSessionId) {
          if (remainingSessions.length > 0) {
            const nextSession = remainingSessions[0]
            sessionIdRef.current = nextSession.id
            setCurrentSessionId(nextSession.id)
            await loadSessionMessages(nextSession.id)
          } else {
            const newId = generateSessionId()
            sessionIdRef.current = newId
            setCurrentSessionId(newId)
            setMessages([])
            setInput('')
            setIsTyping(false)
            setIsLoadingHistory(false)
            upsertSession(newId, {
              title: SESSION_TITLE_FALLBACK,
              updatedAt: new Date().toISOString()
            })
          }
        }
      } catch (deleteError) {
        const handledError = deleteError instanceof Error ? deleteError : new Error('チャットの削除に失敗しました')
        handleError(handledError)
      } finally {
        setDeletingSessionId(null)
      }
    },
    [
      currentSessionId,
      handleClearError,
      handleError,
      loadSessionMessages,
      sessions,
      setInput,
      setIsTyping,
      setMessages,
      upsertSession
    ]
  )

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            AIチャットアプリ
          </h2>
          <p className="text-gray-600 mb-6 text-lg">サインインしてチャットを開始してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-100">
      <aside className="hidden md:flex md:w-72 lg:w-80 flex-col bg-white/85 backdrop-blur text-slate-800 border-r border-white/60">
        <div className="p-4 border-b border-white/60">
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-purple-700"
          >
            <PlusCircle className="h-4 w-4" />
            新しいチャット
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-slate-200/60 bg-white/90 p-4 text-sm text-slate-600">
              まだ保存されたチャットはありません。
            </div>
          ) : (
            sessions.map((item) => {
              const isActive = item.id === currentSessionId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSessionSelect(item.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition ${
                    isActive
                      ? 'bg-slate-100/90 text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium truncate">{item.title}</span>
                    <div className="flex items-center gap-2">
                      {item.updatedAt && (
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">
                          {formatTimestamp(item.updatedAt)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void handleDeleteSession(item.id)
                        }}
                        disabled={deletingSessionId === item.id}
                        className={`rounded p-1 transition ${
                          deletingSessionId === item.id
                            ? 'text-slate-400'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-600'
                        }`}
                        aria-label="チャットを削除"
                      >
                        {deletingSessionId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300 truncate">
                    {item.lastMessage ?? 'まだメッセージはありません'}
                  </p>
                </button>
              )
            })
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6 md:hidden">
          <div className="flex items-center justify-end gap-2 md:justify-start">
            {sessions.length === 0 && (
              <p className="text-sm text-slate-600 md:hidden">
                左上の「新しいチャット」ボタンから会話を開始してください。
              </p>
            )}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <PlusCircle className="h-4 w-4" />
                新しいチャット
              </button>
              {sessions.length > 0 && (
                <select
                  value={currentSessionId ?? ''}
                  onChange={(event) => handleSessionSelect(event.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 shadow-sm"
                >
                  {sessions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              )}
              {sessions.length > 0 && currentSessionId && (
                <button
                  type="button"
                  onClick={() => void handleDeleteSession(currentSessionId)}
                  disabled={deletingSessionId === currentSessionId}
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
                >
                  {deletingSessionId === currentSessionId ? '削除中…' : 'このチャットを削除'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoadingHistory && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <ErrorAlert
                error={error}
                onClose={handleClearError}
                className="mb-4"
              />
            )}

            {chatMessages.length === 0 && !isLoadingHistory && (
              <div className="py-16 text-center text-slate-500">
                最初のメッセージを送ってチャットを開始しましょう。
              </div>
            )}

            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-xs sm:max-w-sm lg:max-w-lg xl:max-w-xl items-start space-x-3 ${message.role === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : 'flex-row'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                      }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${message.role === 'user'
                      ? 'rounded-br-md bg-blue-100 text-blue-900 border border-blue-200'
                      : 'rounded-bl-md bg-slate-100 text-slate-900 border border-slate-200'
                      }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <div key={`${message.id}-${partIndex}`}>
                                {part.text}
                              </div>
                            )
                          case 'step-start':
                            return null
                          case 'tool-getCurrentTime':
                            if (!isToolMessagePart(part)) {
                              return null
                            }

                            switch (part.state) {
                              case 'input-streaming':
                              case 'input-available':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-500 italic mb-2">
                                    🕐 現在時刻を取得中...
                                  </div>
                                )
                              case 'output-available':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2">
                                    <strong>時刻ツール結果:</strong> {JSON.stringify(part.output, null, 2)}
                                  </div>
                                )
                              case 'output-error':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-red-500 mb-2">
                                    ⚠️ 時刻取得エラー: {part.errorText}
                                  </div>
                                )
                              default:
                                return null
                            }
                          case 'dynamic-tool':
                            if (!isToolMessagePart(part)) {
                              return null
                            }

                            switch (part.state) {
                              case 'input-streaming':
                              case 'input-available':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-500 italic mb-2">
                                    🔧 ツールを実行中: {part.toolName}
                                  </div>
                                )
                              case 'output-available':
                                return null
                              case 'output-error':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-red-500 mb-2">
                                    ⚠️ ツールエラー: {part.toolName} - {part.errorText}
                                  </div>
                                )
                              default:
                                return null
                            }
                          default:
                            if (part.type.startsWith('tool-')) {
                              if (!isToolMessagePart(part)) {
                                return null
                              }

                              switch (part.state) {
                                case 'input-streaming':
                                case 'input-available':
                                  return (
                                    <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-500 italic mb-2">
                                      🔧 {part.type.replace('tool-', '')}を実行中...
                                    </div>
                                  )
                                case 'output-available':
                                  return null
                                case 'output-error':
                                  return (
                                    <div key={`${message.id}-${partIndex}`} className="text-xs text-red-500 mb-2">
                                      ⚠️ {part.type.replace('tool-', '')}エラー: {part.errorText}
                                    </div>
                                  )
                                default:
                                  return null
                              }
                            }
                            return null
                        }
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {showTypingIndicator && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">AIが考えています...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border-t border-white/60 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={onSubmit} className="flex items-start space-x-3">
              <div className="flex-1 relative">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="メッセージを入力してください..."
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 pr-7 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-400 transition-all duration-200 shadow-sm text-slate-900 placeholder-slate-400 resize-none min-h-[40px] max-h-24 overflow-y-auto"
                    disabled={isBusy}
                    rows={1}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Ctrl+Enterで送信・Enterで改行
                </p>
              </div>
              <button
                type="submit"
                disabled={isBusy || !input.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white h-[40px] w-[40px] rounded-md flex items-center justify-center hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
