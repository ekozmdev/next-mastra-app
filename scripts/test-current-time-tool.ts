import { currentTimeTool } from "../src/lib/tools/current-time"

async function testCurrentTimeTool() {
  console.log("🧪 Testing currentTimeTool...")
  
  try {
    // Test with default timezone (Asia/Tokyo)
    console.log("\n📍 Testing with default timezone (Asia/Tokyo):")
    const result1 = await currentTimeTool.execute({ 
      context: { timezone: "Asia/Tokyo" } 
    })
    console.log("Result:", result1)
    
    // Test with UTC timezone
    console.log("\n📍 Testing with UTC timezone:")
    const result2 = await currentTimeTool.execute({ 
      context: { timezone: "UTC" } 
    })
    console.log("Result:", result2)
    
    // Test with US Eastern timezone
    console.log("\n📍 Testing with America/New_York timezone:")
    const result3 = await currentTimeTool.execute({ 
      context: { timezone: "America/New_York" } 
    })
    console.log("Result:", result3)
    
    // Test with empty context (should use default)
    console.log("\n📍 Testing with empty context (should use default):")
    const result4 = await currentTimeTool.execute({ 
      context: {} 
    })
    console.log("Result:", result4)
    
    // Verify the structure of the response
    console.log("\n✅ Verifying response structure:")
    console.log("- Has currentTime:", typeof result1.currentTime === "string")
    console.log("- Has timezone:", typeof result1.timezone === "string")
    console.log("- Has timestamp:", typeof result1.timestamp === "string")
    console.log("- Timestamp is valid ISO:", !isNaN(Date.parse(result1.timestamp)))
    
    console.log("\n✅ currentTimeTool test completed successfully!")
    
  } catch (error) {
    console.error("❌ currentTimeTool test failed:", error)
    process.exit(1)
  }
}

testCurrentTimeTool()