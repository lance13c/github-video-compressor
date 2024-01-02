import { z } from 'zod'

const MessageTypeSchema = z.union([
  z.literal('text'),
  z.literal('video/mp4'),
  z.literal('video/mpeg'),
  z.literal('video/ogg'),
  z.literal('video/webm'),
  z.literal('video/quicktime'),
  z.literal('connection'),
])

export const MessageSchema = z.object({
  type: MessageTypeSchema,
  progress: z.number().min(0).max(1),
  data: z.string(),
})

// Optional: Type alias for convenience
export type Message = z.infer<typeof MessageSchema>

// export const ExtensionMessageSchema = z.object({
//   type: z.union([z.literal('start_session'), z.literal('stop_session')]),
// })

export const StartSessionArgsSchema = z.object({
  type: z.literal('start_session'),
})

export type StartSessionArgs = z.infer<typeof StartSessionArgsSchema>

export const StartSessionResponseSchema = z.object({
  token: z.string(),
})

export type StartSessionResponse = z.infer<typeof StartSessionResponseSchema>

export const StopSessionArgsSchema = z.object({
  type: z.literal('stop_session'),
})

export type StopSessionArgs = z.infer<typeof StopSessionArgsSchema>

export const StopSessionResponseSchema = z.object({
  success: z.boolean(),
})

export type StopSessionResponse = z.infer<typeof StopSessionResponseSchema>

export const ExtensionMessageSchema = z.union([StartSessionArgsSchema, StopSessionArgsSchema])

export type ExtensionMessage = z.infer<typeof ExtensionMessageSchema>

// content.js -> start_session -> background.js
// * background.js -> create native connection, send init message, get session, send back to content.js
// * content.js then sends web app -> command + token
// * after command, stop_session -> background.js -> disconnects from native connection
