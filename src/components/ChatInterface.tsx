'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage, UIMessagePart } from 'ai'
import { useSession } from 'next-auth/react'
import { Send, User, Bot, MessageCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorAlert } from './ErrorAlert'

type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error'

interface ToolMessagePart extends UIMessagePart {
  state?: ToolState
  input?: unknown
  output?: unknown
  errorText?: string
  toolName?: string
}

const isToolMessagePart = (part: UIMessagePart): part is ToolMessagePart => {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-')
}

export function ChatInterface() {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const { error, clearError, handleError } = useErrorHandler()
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onFinish: () => {
      setIsTyping(false)
    },
    onError: (apiError: Error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Chat error:', apiError)
      }
      handleError(apiError)
      setIsTyping(false)
    },
  })

  const chatMessages = messages as UIMessage[]
  const lastMessage = chatMessages[chatMessages.length - 1]

  const isLoading = status === 'submitted' || status === 'streaming'

  const submitMessage = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) {
      return
    }

    sendMessage({ text: trimmed })
    setInput('')
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

  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (chatMessages.length === 0) {
      return
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    setIsTyping(isLoading)
  }, [isLoading])

  const showTypingIndicator = isTyping && (!lastMessage || lastMessage.role !== 'assistant')

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 chat-messages">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <ErrorAlert
              error={error}
              onClose={clearError}
              className="mb-4"
            />
          )}

          {chatMessages.length === 0 && (
            <div className="py-16" />
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

      <div className="bg-white/80 backdrop-blur-md border-t border-white/20 p-4 sm:p-6 sticky bottom-0">
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
                  disabled={isLoading}
                  rows={1}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Ctrl+Enterで送信・Enterで改行
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white h-[40px] w-[40px] rounded-md flex items-center justify-center hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Quick actions removed per request */}
        </div>
      </div>
    </div>
  )
}
