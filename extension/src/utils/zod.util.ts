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
