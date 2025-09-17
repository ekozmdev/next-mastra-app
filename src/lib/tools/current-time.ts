import { createTool } from "@mastra/core/tools"
import { z } from "zod"

export const currentTimeTool = createTool({
  id: "getCurrentTime",
  description: "現在の日時を取得します",
  inputSchema: z.object({
    timezone: z.string().describe("タイムゾーン (例: Asia/Tokyo, UTC)").default("Asia/Tokyo")
  }),
  outputSchema: z.object({
    currentTime: z.string().describe("フォーマットされた現在時刻"),
    timezone: z.string().describe("使用されたタイムゾーン"),
    timestamp: z.string().describe("ISO形式のタイムスタンプ")
  }),
  execute: async ({ context: { timezone = "Asia/Tokyo" } }) => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long"
    })
    
    return {
      currentTime: formatter.format(now),
      timezone,
      timestamp: now.toISOString()
    }
  }
})