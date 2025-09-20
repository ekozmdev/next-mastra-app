import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testAuthConfig() {
  try {
    console.log("Testing Auth.js configuration...")
    
    // Test that auth config can be imported
    const authConfigModule = await import("../auth.config")
    const providerCount = authConfigModule.authOptions.providers.length
    console.log(`✅ Auth config imported successfully (providers: ${providerCount})`)

    // Test that main auth can be imported
    const authModule = await import("../auth")
    console.log("✅ Auth module exported handlers:", Object.keys(authModule))
    
    // Check environment variables
    console.log("Checking environment variables...")
    console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "Missing")
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "Set" : "Missing")
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Missing")
    
    console.log("✅ Auth configuration test completed!")
    
  } catch (error) {
    console.error("❌ Auth configuration test failed:", error)
  }
}

testAuthConfig()
