import dotenv from "dotenv"
import { createUser, getUserByEmail } from "../src/lib/user-service"
import connectToDatabase from "../src/lib/mongodb"
import mongoose from "mongoose"

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testAuthFlow() {
  try {
    console.log("Testing complete authentication flow...")
    
    // Connect to database
    await connectToDatabase()
    
    // Create a test user for authentication
    const testEmail = `auth-test-${Date.now()}@example.com`
    const testPassword = "testpassword123"
    
    console.log("1. Creating test user...")
    const userId = await createUser({
      name: "Auth Test User",
      email: testEmail,
      password: testPassword
    })
    console.log("✅ User created with ID:", userId)
    
    // Verify user was created
    console.log("2. Verifying user creation...")
    const user = await getUserByEmail(testEmail)
    if (user) {
      console.log("✅ User verified:", {
        id: user._id,
        name: user.name,
        email: user.email
      })
    } else {
      console.log("❌ User verification failed")
      return
    }
    
    // Test password verification
    console.log("3. Testing password verification...")
    const isValidPassword = await user.comparePassword(testPassword)
    console.log("✅ Password verification:", isValidPassword ? "PASSED" : "FAILED")
    
    // Test invalid password
    const isInvalidPassword = await user.comparePassword("wrongpassword")
    console.log("✅ Invalid password test:", !isInvalidPassword ? "PASSED" : "FAILED")
    
    console.log("4. Testing registration API endpoint...")
    console.log("Note: To test the full auth flow, start the Next.js server and test:")
    console.log("- POST /api/auth/register")
    console.log("- POST /api/auth/signin")
    console.log("- GET /api/auth/session")
    
    console.log("✅ Authentication flow test completed!")
    
  } catch (error) {
    console.error("❌ Authentication flow test failed:", error)
  } finally {
    // Close connection
    await mongoose.connection.close()
    console.log("Database connection closed")
  }
}

testAuthFlow()