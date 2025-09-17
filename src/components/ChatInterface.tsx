'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useSession } from 'next-auth/react'
import { Send, Clock, User, Bot, Sparkles, MessageCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorAlert } from './ErrorAlert'

export function ChatInterface() {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const { error, clearError, handleError } = useErrorHandler()

  // Manage input state locally
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onFinish: () => {
      console.log('Chat finished')
      setIsTyping(false)
    },
    onError: (error: Error) => {
      console.error('Chat error:', error)
      handleError(error)
      setIsTyping(false)
    },
  })

  // Convert status to isLoading for compatibility
  const isLoading = status === 'submitted' || status === 'streaming'

  // Custom submit handler with logging
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with input:', input)
    if (input && input.trim() && !isLoading) {
      console.log('Sending message')
      sendMessage({ text: input })
      setInput('') // Clear input after sending
    } else {
      console.log('Submit blocked - input empty or loading:', { input: input?.trim(), isLoading })
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debug: Log messages structure
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Current messages:', messages)
      const lastMessage = messages[messages.length - 1]
      console.log('Last message structure:', lastMessage)
      console.log('Last message parts:', lastMessage.parts)
      
      // Detailed part analysis
      lastMessage.parts.forEach((part, index) => {
        console.log(`Part ${index}:`, {
          type: part.type,
          ...(part.type === 'text' && { text: part.text }),
          ...(part.type.startsWith('tool-') && { 
            state: (part as any).state,
            input: (part as any).input,
            output: (part as any).output,
            errorText: (part as any).errorText
          })
        })
      })
    }
  }, [messages])

  // Handle typing indicator
  useEffect(() => {
    if (isLoading) {
      setIsTyping(true)
    } else {
      setIsTyping(false)
    }
  }, [isLoading])

  // Debug: Log status changes
  useEffect(() => {
    console.log('Chat status changed:', status)
  }, [status])

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 chat-messages">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Error Display */}
          {error && (
            <ErrorAlert
              error={error}
              onClose={clearError}
              className="mb-4"
            />
          )}
          {messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Clock className="w-10 h-10 text-blue-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">チャットを開始しましょう</h3>
              <p className="text-gray-600 text-lg mb-6">「今何時？」と聞いてみてください</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  現在時刻
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  質問応答
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  会話
                </span>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`flex max-w-xs sm:max-w-sm lg:max-w-lg xl:max-w-xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                } items-start space-x-3`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 ml-3'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 mr-3'
                  }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
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
                          // ステップ開始の表示（通常は非表示）
                          return null
                        case 'tool-getCurrentTime':
                          switch (part.state) {
                            case 'input-streaming':
                            case 'input-available':
                              return (
                                <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-500 italic mb-2">
                                  🕐 現在時刻を取得中...
                                </div>
                              )
                            case 'output-available':
                              // デバッグ用：ツールの結果を一時的に表示
                              console.log('getCurrentTime tool output:', part.output)
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
                          switch (part.state) {
                            case 'input-streaming':
                            case 'input-available':
                              return (
                                <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-500 italic mb-2">
                                  🔧 ツールを実行中: {part.toolName}
                                </div>
                              )
                            case 'output-available':
                              // ツールの結果は非表示にして、AIのテキスト回答に任せる
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
                          // Handle other tool types dynamically
                          if (part.type.startsWith('tool-')) {
                            const toolName = part.type.replace('tool-', '')
                            switch ((part as any).state) {
                              case 'input-streaming':
                              case 'input-available':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-gray-500 italic mb-2">
                                    🔧 {toolName}を実行中...
                                  </div>
                                )
                              case 'output-available':
                                // ツールの結果は非表示にして、AIのテキスト回答に任せる
                                return null
                              case 'output-error':
                                return (
                                  <div key={`${message.id}-${partIndex}`} className="text-xs text-red-500 mb-2">
                                    ⚠️ {toolName}エラー: {(part as any).errorText}
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
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                    {new Date().toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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

      {/* Input Form */}
      <div className="bg-white/80 backdrop-blur-md border-t border-white/20 p-4 sm:p-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={onSubmit} className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="メッセージを入力してください..."
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-lg text-gray-800 placeholder-gray-400 resize-none"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      console.log('Enter key pressed')
                      if (input && input.trim() && !isLoading) {
                        console.log('Submitting via Enter key')
                        onSubmit(e as any)
                      }
                    }
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {input && input.trim() && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-1 left-4 text-xs text-gray-400">
                Enterで送信 • Shift+Enterで改行
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center animate-fade-in">
              <button
                onClick={() => {
                  if (!isLoading) {
                    sendMessage({ text: '今何時ですか？' })
                  }
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                🕐 現在時刻
              </button>
              <button
                onClick={() => {
                  if (!isLoading) {
                    sendMessage({ text: 'こんにちは！' })
                  }
                }}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                👋 挨拶
              </button>
              <button
                onClick={() => {
                  if (!isLoading) {
                    sendMessage({ text: '何ができますか？' })
                  }
                }}
                className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                ❓ 機能について
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}