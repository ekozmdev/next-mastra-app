import mongoose, { type ConnectOptions } from "mongoose";

type MongooseInstance = typeof mongoose;

interface MongooseCache {
  conn: MongooseInstance | null;
  promise: Promise<MongooseInstance> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

function getMongoUri(): string {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  return process.env.MONGODB_URI;
}

const globalCache = globalThis as unknown as { mongoose?: MongooseCache };

if (!globalCache.mongoose) {
  globalCache.mongoose = { conn: null, promise: null };
}

const cached = globalCache.mongoose as MongooseCache;

async function connectToDatabase(): Promise<MongooseInstance> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongooseLib) => {
      console.log("Mongoose connected to MongoDB");
      return mongooseLib;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;

export async function testConnection(): Promise<boolean> {
  try {
    await connectToDatabase();
    console.log("Mongoose connection successful");
    return true;
  } catch (error) {
    console.error("Mongoose connection failed:", error);
    return false;
  }
}
