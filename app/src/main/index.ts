import { app } from 'electron'

import { v4 as uuidv4 } from 'uuid'
import { sendDebugMessage } from '~/src/main/dev_websockets'
import { checkSetup } from '~/src/main/setup'
import { generateToken } from '~/src/shared/utils/crypto.util'
import { startHttpFileServer } from '~/src/shared/utils/httpFileServer'
import { NativeMessagingHost } from '~/src/shared/utils/nativeMessagingHost'
import { makeAppWithSingleInstanceLock } from './factories'

const port = 7777

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  const isDev = process.argv.includes('--development')
  sendDebugMessage('info', `isDev: ${isDev}`)

  const isNativeMessaging = process.argv.includes('--native-messaging')
  sendDebugMessage('info', `isNativeMessaging: ${isNativeMessaging}`)

  try {
    // Do not launch the app UI and setup if the app is running via native messaging
    if (!isNativeMessaging) {
      await checkSetup(app)
      process.stdin.on('end', () => {
        sendDebugMessage('info', 'stdin closed, shutting down Electron app')
        app.quit()
      })
    } else {
      const nativeMessagingHost = new NativeMessagingHost()
      if (isDev) {
        // initWebSocketServer()
      }

      const { server } = startHttpFileServer(app, port)

      if (!server) {
        sendDebugMessage('error', 'Failed to start HTTP file server')
        app.quit()
        return
      }

      nativeMessagingHost.addListener(message => {
        sendDebugMessage('debug', `Received message ${JSON.stringify(message)}`)
        if (message.type === 'connection') {
          sendDebugMessage('debug', 'Init connection - Received connection request')

          const token = generateToken({
            // generate random client uuid
            clientId: uuidv4(),
          })

          nativeMessagingHost.sendMessage({
            type: 'connection',
            progress: 1,
            data: token,
          })
        }
      })

      sendDebugMessage('info', 'Electron app started')

      process.stdin.on('end', () => {
        sendDebugMessage('info', 'stdin closed, shutting down Electron app')
        server.close()
        app.quit()
      })
    }
  } catch (e) {
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown')
    app.quit()
  }
})
