import { startSession, stopSession } from '@root/src/utils/extension.util'
import { sendFileToServer } from '@root/src/utils/file.util'

const COMMAND_MAP = {
  compress_file: sendFileToServer,
}

export const closeNativeApp = async () => {
  return stopSession()
}

export const execCommand = async <T extends keyof typeof COMMAND_MAP>(
  commandName: T,
  commandOptions: Omit<Parameters<(typeof COMMAND_MAP)[T]>[0], 'token'>,
) => {
  const { token } = await startSession()
  // command
  const result = await COMMAND_MAP[commandName]({
    ...commandOptions,
    token,
  })

  return result
}
