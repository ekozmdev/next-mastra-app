import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testRegisterAPI() {
  try {
    console.log("Testing registration API...")
    
    // Start Next.js server in background for testing
    const testEmail = `api-test-${Date.now()}@example.com`
    
    // Test successful registration
    console.log("Testing successful registration...")
    const registerResponse = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "API Test User",
        email: testEmail,
        password: "testpassword123"
      })
    })
    
    if (registerResponse.ok) {
      const result = await registerResponse.json()
      console.log("✅ Registration successful:", result)
    } else {
      const error = await registerResponse.json()
      console.log("❌ Registration failed:", error)
    }
    
    // Test duplicate registration
    console.log("Testing duplicate registration...")
    const duplicateResponse = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail,
        password: "anotherpassword"
      })
    })
    
    if (duplicateResponse.status === 409) {
      const error = await duplicateResponse.json()
      console.log("✅ Duplicate registration properly rejected:", error)
    } else {
      console.log("❌ Duplicate registration should have been rejected")
    }
    
    // Test invalid data
    console.log("Testing invalid data...")
    const invalidResponse = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email",
        password: "123" // Too short
      })
    })
    
    if (invalidResponse.status === 400) {
      const error = await invalidResponse.json()
      console.log("✅ Invalid data properly rejected:", error)
    } else {
      console.log("❌ Invalid data should have been rejected")
    }
    
    console.log("All registration API tests completed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    console.log("Note: Make sure Next.js server is running on localhost:3000")
  }
}

testRegisterAPI()