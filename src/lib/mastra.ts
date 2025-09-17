import { Mastra } from "@mastra/core"
import { Agent } from "@mastra/core/agent"
import { openai } from "@ai-sdk/openai"
import { currentTimeTool } from "./tools/current-time"

// Create the chat agent
export const chatAgent = new Agent({
  name: "ChatAgent",
  instructions: `あなたは親切なAIアシスタントです。明確で簡潔な回答を提供してください。
現在時刻が必要な場合は、getCurrentTimeツールを使用してください。
日本語で自然に会話してください。`,
  model: openai("gpt-4o"),
  tools: {
    getCurrentTime: currentTimeTool,
  },
})

// Create and configure Mastra instance
export const mastra = new Mastra({
  agents: {
    chatAgent,
  },
})