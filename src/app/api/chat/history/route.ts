import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth.config"
import { getChatHistory, getChatSessions, deleteChatHistory } from "@/lib/chat-service"
import { 
  withErrorHandler, 
  AuthenticationError, 
  ValidationError,
  DatabaseError 
} from "@/lib/errors"

export const GET = withErrorHandler(async (req: NextRequest) => {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new AuthenticationError("Authentication required")
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const limitParam = searchParams.get('limit')
  const beforeParam = searchParams.get('before')

  // Validate parameters
  const limit = limitParam ? parseInt(limitParam) : 50
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ValidationError("Limit must be between 1 and 100")
  }

  let before: Date | undefined
  if (beforeParam) {
    before = new Date(beforeParam)
    if (isNaN(before.getTime())) {
      throw new ValidationError("Invalid date format for 'before' parameter")
    }
  }

  try {
    // Get chat history
    const history = await getChatHistory(session.user.id, {
      sessionId: sessionId || undefined,
      limit,
      before
    })

    // Get available sessions
    const sessions = await getChatSessions(session.user.id)

    return Response.json({
      messages: history,
      sessions,
      hasMore: history.length === limit
    })
  } catch (error) {
    console.error("Database error in chat history:", error)
    throw new DatabaseError("Failed to retrieve chat history")
  }
})

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new AuthenticationError("Authentication required")
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    throw new ValidationError("sessionId is required")
  }

  try {
    const result = await deleteChatHistory(session.user.id, sessionId)

    return Response.json({
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error("Database error in chat history delete:", error)
    throw new DatabaseError("Failed to delete chat history")
  }
})
