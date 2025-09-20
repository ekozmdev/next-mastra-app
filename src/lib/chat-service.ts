import type { FilterQuery } from "mongoose";
import connectToDatabase from "./mongodb";
import ChatMessage, { IChatMessage } from "./models/ChatMessage";
import { DatabaseError, ValidationError } from "./errors";

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
  sessionId?: string;
}

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(
  userId: string, 
  messageData: ChatMessageData
): Promise<IChatMessage> {
  try {
    await connectToDatabase();
    
    // Validate input
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    
    if (!messageData.content || messageData.content.trim() === '') {
      throw new ValidationError("Message content cannot be empty");
    }
    
    if (!['user', 'assistant'].includes(messageData.role)) {
      throw new ValidationError("Invalid message role");
    }
    
    const message = new ChatMessage({
      userId,
      role: messageData.role,
      content: messageData.content.trim(),
      sessionId: messageData.sessionId,
      timestamp: new Date(),
    });
    
    return await message.save();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Database error in saveChatMessage:", error);
    throw new DatabaseError("Failed to save chat message");
  }
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(
  userId: string, 
  options: {
    limit?: number;
    sessionId?: string;
    before?: Date;
  } = {}
): Promise<IChatMessage[]> {
  try {
    await connectToDatabase();
    
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    
    const { limit = 50, sessionId, before } = options;
    
    // Validate limit
    if (limit < 1 || limit > 100) {
      throw new ValidationError("Limit must be between 1 and 100");
    }
    
    // Build query
    const query: FilterQuery<IChatMessage> = { userId };
    
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    if (before) {
      query.timestamp = { $lt: before };
    }
    
    return await ChatMessage
      .find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .limit(limit)
      .exec();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Database error in getChatHistory:", error);
    throw new DatabaseError("Failed to retrieve chat history");
  }
}

/**
 * Get recent chat history in chronological order (for AI context)
 */
export async function getRecentChatHistory(
  userId: string,
  limit: number = 20,
  sessionId?: string
): Promise<IChatMessage[]> {
  try {
    const messages = await getChatHistory(userId, { limit, sessionId });
    return messages.reverse(); // Return in chronological order for AI context
  } catch (error) {
    console.error("Error in getRecentChatHistory:", error);
    throw error; // Re-throw the original error
  }
}

/**
 * Delete chat history for a user
 */
export async function deleteChatHistory(
  userId: string,
  sessionId?: string
): Promise<{ deletedCount: number }> {
  try {
    await connectToDatabase();
    
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    
    const query: FilterQuery<IChatMessage> = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    const result = await ChatMessage.deleteMany(query);
    return { deletedCount: result.deletedCount || 0 };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Database error in deleteChatHistory:", error);
    throw new DatabaseError("Failed to delete chat history");
  }
}

/**
 * Get chat sessions for a user
 */
export async function getChatSessions(userId: string): Promise<string[]> {
  try {
    await connectToDatabase();
    
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    
    const sessions = await ChatMessage.distinct('sessionId', {
      userId,
      sessionId: { $exists: true, $ne: null }
    });
    
    return sessions.filter(Boolean); // Remove null/undefined values
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Database error in getChatSessions:", error);
    throw new DatabaseError("Failed to retrieve chat sessions");
  }
}

/**
 * Count total messages for a user
 */
export async function getMessageCount(userId: string, sessionId?: string): Promise<number> {
  try {
    await connectToDatabase();
    
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    
    const query: FilterQuery<IChatMessage> = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    return await ChatMessage.countDocuments(query);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Database error in getMessageCount:", error);
    throw new DatabaseError("Failed to count messages");
  }
}
