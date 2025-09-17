import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId?: string;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true // Index for efficient queries by user
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['user', 'assistant'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Index for efficient sorting by time
  },
  sessionId: {
    type: String,
    required: false,
    index: true // Index for session-based queries
  }
}, {
  timestamps: false // We're using our own timestamp field
});

// Compound index for efficient user + timestamp queries
ChatMessageSchema.index({ userId: 1, timestamp: -1 });

// Compound index for session-based queries
ChatMessageSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });

const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;