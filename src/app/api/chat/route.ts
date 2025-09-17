import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth.config"
import { streamText, convertToModelMessages, UIMessage, stepCountIs, tool } from "ai"
import { z } from "zod"
import { saveChatMessage } from "@/lib/chat-service"
import {
  withErrorHandler,
  AuthenticationError,
  ValidationError,
  ExternalServiceError,
  DatabaseError
} from "@/lib/errors"

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new AuthenticationError("Authentication required")
  }

  // Parse request body
  const { messages, sessionId }: { messages: UIMessage[], sessionId?: string } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    throw new ValidationError("Invalid messages format")
  }

  if (messages.length === 0) {
    throw new ValidationError("Messages array cannot be empty")
  }

  try {
    // Save the user's message to database
    const userMessage = messages[messages.length - 1]
    if (userMessage && userMessage.role === 'user') {
      // Extract text content from the parts array (AI SDK 5.0 format)
      const userTextContent = userMessage.parts?.find(part => part.type === 'text')?.text

      if (userTextContent) {
        await saveChatMessage(session.user.id, {
          role: 'user',
          content: userTextContent,
          sessionId
        })
      }
    }
  } catch (error) {
    console.error("Failed to save user message:", error)
    throw new DatabaseError("Failed to save message to database")
  }

  try {
    // Convert UIMessage[] to ModelMessage[] for AI SDK Core
    const modelMessages = convertToModelMessages(messages)

    // Use direct AI SDK approach
    const { createOpenAI } = await import('@ai-sdk/openai')
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Use AI SDK's streamText directly
    const result = await streamText({
      model: openai('gpt-4o'),
      messages: modelMessages,
      tools: {
        getCurrentTime: tool({
          description: '現在の日時を取得します',
          inputSchema: z.object({
            timezone: z.string().describe('タイムゾーン (例: Asia/Tokyo, UTC)').default('Asia/Tokyo')
          }),
          execute: async ({ timezone }) => {
            const now = new Date()
            const formatter = new Intl.DateTimeFormat("ja-JP", {
              timeZone: timezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              weekday: "long"
            })

            return {
              currentTime: formatter.format(now),
              timezone,
              timestamp: now.toISOString()
            }
          }
        })
      },
      system: `あなたは親切なAIアシスタントです。明確で簡潔な回答を提供してください。

重要な指示：
- 現在時刻が必要な場合は、必ずgetCurrentTimeツールを使用してください
- ツールを実行した後は、必ずその結果を基に自然な日本語で回答してください
- ツールの結果だけでなく、ユーザーにとって分かりやすい形で情報を伝えてください
- 例：「現在の時刻は2025年9月17日水曜日の18時26分です。」のように回答してください

日本語で自然に会話してください。`,
      stopWhen: stepCountIs(5), // Allow multiple steps for tool usage
      onFinish: async (result) => {
        console.log('Stream finished with result:', {
          text: result.text,
          toolCalls: result.toolCalls,
          toolResults: result.toolResults,
          steps: result.steps
        })

        // Save the assistant's response to database
        if (result.text) {
          try {
            await saveChatMessage(session.user.id, {
              role: 'assistant',
              content: result.text,
              sessionId
            })
          } catch (error) {
            console.error("Failed to save assistant message:", error)
            // Don't throw here as the response was already generated
          }
        }
      }
    })

    // Return streaming response
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("AI service error:", error)
    throw new ExternalServiceError("Failed to generate AI response")
  }
})