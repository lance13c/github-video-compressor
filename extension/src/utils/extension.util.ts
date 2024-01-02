import type { StartSessionArgs, StopSessionArgs } from '@utils/zod.util'
import { StartSessionResponseSchema, StopSessionResponseSchema } from '@utils/zod.util'

export const startSession = async () => {
  try {
    const responsePromise = chrome.runtime.sendMessage({
      type: 'start_session',
    } satisfies StartSessionArgs)
    const response = await responsePromise
    return StartSessionResponseSchema.parse(response)
  } catch (err) {
    console.error(err)
  }
}

export const stopSession = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'stop_session',
    } satisfies StopSessionArgs)
    return StopSessionResponseSchema.parse(response)
  } catch (err) {
    console.error(err)
  }
}
