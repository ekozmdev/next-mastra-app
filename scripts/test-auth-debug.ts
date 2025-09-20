import dotenv from "dotenv"
import mongoose from "mongoose"

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testAuthDebug() {
  try {
    console.log("=== Auth Configuration Debug ===")
    
    // Check environment variables
    console.log("\n1. Environment Variables:")
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing")
    console.log("AUTH_SECRET:", process.env.AUTH_SECRET ? "✅ Set" : "❌ Missing")
    console.log("AUTH_TRUST_HOST:", process.env.AUTH_TRUST_HOST ? "✅ Set" : "❌ Missing")
    
    // Test imports
    console.log("\n2. Module Imports:")
    try {
      const authConfig = await import("../auth.config")
      console.log("auth.config.ts: ✅ Imported successfully")
      console.log("Providers configured:", authConfig.authOptions.providers.length)
    } catch (error) {
      console.log("auth.config.ts: ❌ Import failed:", error)
    }

    try {
      const auth = await import("../auth")
      console.log("auth.ts: ✅ Imported successfully", Object.keys(auth))
    } catch (error) {
      console.log("auth.ts: ❌ Import failed:", error)
    }

    try {
      const userService = await import("../lib/user-service")
      console.log(
        "user-service.ts: ✅ Imported successfully",
        Object.keys(userService)
      )
    } catch (error) {
      console.log("user-service.ts: ❌ Import failed:", error)
    }

    try {
      const User = await import("../lib/models/User")
      console.log("User model: ✅ Imported successfully", Object.keys(User))
    } catch (error) {
      console.log("User model: ❌ Import failed:", error)
    }
    
    // Test database connection
    console.log("\n3. Database Connection:")
    try {
      const connectToDatabase = await import("../lib/mongodb")
      await connectToDatabase.default()
      console.log("MongoDB: ✅ Connected successfully")
    } catch (error) {
      console.log("MongoDB: ❌ Connection failed:", error)
    }
    
    console.log("\n=== Debug Complete ===")
    
  } catch (error) {
    console.error("❌ Debug test failed:", error)
  } finally {
    try {
      await mongoose.connection.close()
    } catch (cleanupError) {
      console.log("MongoDB cleanup warning:", cleanupError)
    }
  }
}

testAuthDebug()
