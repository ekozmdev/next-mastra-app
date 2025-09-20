import { Mastra } from "@mastra/core"
import { Agent } from "@mastra/core/agent"
import { createOpenAI } from "@ai-sdk/openai"
import { currentTimeTool } from "./tools/current-time"

// Ensure the API key is provided without leaking it to logs
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is not set!')
}

// Create OpenAI provider with explicit API key
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Create the chat agent
export const chatAgent = new Agent({
  name: "ChatAgent",
  instructions: `あなたは親切なAIアシスタントです。明確で簡潔な回答を提供してください。

重要な指示：
- 現在時刻が必要な場合は、必ずgetCurrentTimeツールを使用してください
- ツールを実行した後は、必ずその結果を基に自然な日本語で回答してください
- ツールの結果だけでなく、ユーザーにとって分かりやすい形で情報を伝えてください
- 例：「現在の時刻は2025年9月17日水曜日の18時26分です。」のように回答してください

日本語で自然に会話してください。`,
  model: openaiProvider("gpt-4o"),
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
