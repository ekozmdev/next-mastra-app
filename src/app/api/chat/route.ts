import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth.config"
import { chatAgent } from "@/lib/mastra"
import { streamText } from "ai"
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
  const { messages, sessionId } = await req.json()
  
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
      await saveChatMessage(session.user.id, {
        role: 'user',
        content: userMessage.content,
        sessionId
      })
    }
  } catch (error) {
    console.error("Failed to save user message:", error)
    throw new DatabaseError("Failed to save message to database")
  }

  try {
    // Use AI SDK's streamText with Mastra agent
    const result = await streamText({
      model: chatAgent.model,
      messages,
      tools: chatAgent.tools,
      system: chatAgent.instructions,
      onFinish: async (result) => {
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
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("AI service error:", error)
    throw new ExternalServiceError("Failed to generate AI response")
  }
})