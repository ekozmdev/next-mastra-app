import dotenv from "dotenv"
import mongoose from "mongoose"
import { createUser, getUserByEmail, verifyPassword } from "../src/lib/user-service"
import connectToDatabase from "../src/lib/mongodb"

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testUserService() {
  try {
    console.log("Testing Mongoose-based user service...")
    await connectToDatabase()
    console.log("✅ Connected to MongoDB")
    
    // Test user creation
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = "testpassword123"
    
    console.log("Creating test user...")
    const userId = await createUser({
      name: "Test User",
      email: testEmail,
      password: testPassword
    })
    console.log("✅ User created with ID:", userId)
    
    // Test user retrieval
    console.log("Retrieving user by email...")
    const user = await getUserByEmail(testEmail)
    if (user) {
      console.log("✅ User retrieved:", { 
        id: user._id,
        name: user.name, 
        email: user.email,
        createdAt: user.createdAt
      })
    } else {
      console.log("❌ User not found")
      return
    }
    
    // Test password verification using user method
    console.log("Testing password verification...")
    const isValidPassword = await verifyPassword(testPassword, user)
    console.log("✅ Password verification:", isValidPassword ? "PASSED" : "FAILED")
    
    const isInvalidPassword = await verifyPassword("wrongpassword", user)
    console.log("✅ Invalid password test:", !isInvalidPassword ? "PASSED" : "FAILED")
    
    // Test duplicate user creation
    console.log("Testing duplicate user creation...")
    try {
      await createUser({
        name: "Duplicate User",
        email: testEmail,
        password: "anotherpassword"
      })
      console.log("❌ Duplicate user creation should have failed")
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        console.log("✅ Duplicate user creation properly rejected")
      } else {
        console.log("❌ Unexpected error:", error)
      }
    }
    
    // Test validation
    console.log("Testing validation...")
    try {
      await createUser({
        name: "",
        email: "invalid-email",
        password: "123"
      })
      console.log("❌ Validation should have failed")
    } catch (error) {
      if (error instanceof Error) {
        console.log("✅ Validation properly rejected invalid data:", error.message)
      } else {
        console.log("✅ Validation properly rejected invalid data")
      }
    }
    
    console.log("All Mongoose user service tests completed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    // Close Mongoose connection
    try {
      await mongoose.connection.close()
      console.log("Mongoose connection closed")
    } catch (cleanupError) {
      console.log("Note: Connection cleanup completed", cleanupError)
    }
  }
}

testUserService()
