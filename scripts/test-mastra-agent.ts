import { mastra, chatAgent } from "../src/lib/mastra"

async function testMastraAgent() {
  console.log("🧪 Testing Mastra Agent...")
  
  try {
    // Test 1: Check if agent is registered correctly
    console.log("\n📍 Testing agent registration:")
    const retrievedAgent = mastra.getAgent("chatAgent")
    console.log("- Agent retrieved successfully:", !!retrievedAgent)
    console.log("- Agent name:", retrievedAgent.name)
    
    // Test 2: Check agent configuration
    console.log("\n📍 Testing agent configuration:")
    console.log("- Agent has instructions:", typeof chatAgent.instructions === "string")
    console.log("- Agent has model:", !!chatAgent.model)
    console.log("- Agent has tools:", !!chatAgent.tools)
    
    // Test 3: Check tools availability
    console.log("\n📍 Testing tools availability:")
    const tools = chatAgent.tools
    if (typeof tools === "object" && tools !== null) {
      console.log("- Available tools:", Object.keys(tools))
      console.log("- getCurrentTime tool exists:", "getCurrentTime" in tools)
    }
    
    // Test 4: Test tool execution directly (without OpenAI API call)
    console.log("\n📍 Testing tool execution:")
    if (typeof tools === "object" && tools !== null && "getCurrentTime" in tools) {
      const currentTimeTool = tools.getCurrentTime
      if (currentTimeTool && typeof currentTimeTool.execute === "function") {
        const toolResult = await currentTimeTool.execute({
          context: { timezone: "Asia/Tokyo" }
        })
        console.log("- Tool execution result:", toolResult)
      }
    }
    
    console.log("\n✅ Mastra Agent test completed successfully!")
    console.log("Note: Full agent conversation testing requires a valid OpenAI API key")
    
  } catch (error) {
    console.error("❌ Mastra Agent test failed:", error)
    process.exit(1)
  }
}

testMastraAgent()