import { app } from 'electron'

// import { initWebSocketServer, sendDebugMessage } from '~/src/main/dev_websockets'
import { sendDebugMessage } from '~/src/main/dev_websockets'
import { checkSetup } from '~/src/main/setup'
import { startHttpFileServer } from '~/src/shared/utils/httpFileServer'
import { makeAppWithSingleInstanceLock } from './factories'

const port = 7777

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  await checkSetup(app)

  const isDev = process.argv.includes('--development')

  try {
    // const nativeMessagingHost = new NativeMessagingHost()
    if (isDev) {
      // initWebSocketServer()
    }
    const { server } = startHttpFileServer(app, port)

    // nativeMessagingHost.addListener(message => {
    //   sendDebugMessage('debug', `Received message ${JSON.stringify(message)}`)
    //   if (message.type === 'connection') {
    //     sendDebugMessage('debug', 'Init connection - Received connection request')

    //     const token = generateToken({
    //       // generate random client uuid
    //       clientId: uuidv4(),
    //     })

    //     nativeMessagingHost.sendMessage({
    //       type: 'connection',
    //       progress: 1,
    //       data: token,
    //     })
    //   }
    // })

    sendDebugMessage('info', 'Electron app started')

    process.stdin.on('end', () => {
      sendDebugMessage('info', 'stdin closed, shutting down Electron app')
      server.close()
      app.quit()
    })
  } catch (e) {
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown')
    app.quit()
  }
})
