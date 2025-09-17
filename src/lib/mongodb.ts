import mongoose from 'mongoose';

function getMongoUri(): string {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  return process.env.MONGODB_URI;
}

// Global cache for Mongoose connection
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongoose) => {
      console.log('Mongoose connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    await connectToDatabase();
    console.log('Mongoose connection successful');
    return true;
  } catch (error) {
    console.error('Mongoose connection failed:', error);
    return false;
  }
}