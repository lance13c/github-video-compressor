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

  let isNativeMessaging = false
  let server: any = null
  const nativeMessagingHost = new NativeMessagingHost()

  try {
    if (isDev) {
      // initWebSocketServer()
    }

    nativeMessagingHost.addListener(message => {
      sendDebugMessage('debug', `Received message ${JSON.stringify(message)}`)
      if (message.type === 'connection') {
        isNativeMessaging = true
        sendDebugMessage('debug', 'Init connection - Received connection request')

        const fileServer = startHttpFileServer(app, port)
        server = fileServer?.server

        if (!server) {
          sendDebugMessage('error', 'Failed to start HTTP file server')
          app.quit()
          return
        }

        sendDebugMessage('info', 'Electron app started')

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

    // Delay main execution to allow to see if it is the native messaging connection or not.
    await setTimeout(async () => {
      sendDebugMessage('info', 'Is native messaging: ' + isNativeMessaging)
      if (!isNativeMessaging) {
        await checkSetup(app)

        process.stdin.on('end', () => {
          sendDebugMessage('info', 'stdin closed, shutting down Electron app')
          app.quit()
        })
      }
    }, 3000)

    process.on('exit', () => {
      sendDebugMessage('info', 'Shutting down Electron app')
      server?.close?.()
      app.quit()
    })
  } catch (e) {
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown')
    app.quit()
  }
})
