import { app } from 'electron'

// import { sendDebugMessage } from 'main/dev_websockets'
import { sendDebugMessage } from 'main/dev_websockets'
import { generateToken } from 'shared/utils/crypto.util'
import { startHttpFileServer } from 'shared/utils/httpFileServer'
import { NativeMessagingHost } from 'shared/utils/nativeMessagingHost'
import { v4 as uuidv4 } from 'uuid'
import { makeAppWithSingleInstanceLock } from './factories'
import { registerAboutWindowCreationByIPC } from './windows'

const port = 7777

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  try {
    const nativeMessagingHost = new NativeMessagingHost()
    const { server } = startHttpFileServer(app, port)

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

    sendDebugMessage('info', 'Electron app started - HELLO 3333')

    // const sendInterval = setInterval(() => {
    //   sendDebugMessage('info', 'TEST ELECTRON 646464')
    //   nativeMessagingHost.sendMessage({
    //     type: 'text',
    //     progress: 1,
    //     data: 'Hello world',
    //   })
    // }, 6000)

    // const nativeMessageTransceiver = new NativeMessageTransceiver({
    //   chunkSizeIn: 1024,
    //   chunkSizeOut: 1024,
    // })

    // const dataStream = nativeMessageTransceiver.createDataStream(nativeMessagingHost.addListener)

    // dataStream.onProgress(formattedProgress => {
    //   sendDebugMessage('info', `Progress ${formattedProgress}`)
    // })

    // dataStream.onComplete(message => {
    //   sendDebugMessage('info', `electron complete ${message}`)
    // })

    process.stdin.on('end', () => {
      sendDebugMessage('info', 'stdin closed, shutting down Electron app')
      // clearInterval(sendInterval)
      server.close()
      app.quit()
    })

    registerAboutWindowCreationByIPC()
  } catch (e) {
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown')
    app.quit()
    console.error('app error:', e)
  }
})
