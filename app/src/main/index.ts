import { app } from 'electron'

// import { sendDebugMessage } from 'main/dev_websockets'
import { sendDebugMessage } from 'main/dev_websockets'
import { NativeMessagingHost } from 'shared/utils/nativeMessagingHost'
import { makeAppWithSingleInstanceLock } from './factories'
import { registerAboutWindowCreationByIPC } from './windows'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  try {
    const nativeMessagingHost = new NativeMessagingHost()

    nativeMessagingHost.addListener(parsedData => sendDebugMessage('nativeMessagingHostData', parsedData))

    sendDebugMessage('info', 'Electron app started - HELLO 2222')

    const sendInterval = setInterval(() => {
      sendDebugMessage('info', 'TEST ELECTRON 646464')
      nativeMessagingHost.sendMessage({
        type: 'video/mp4',
        progress: 1,
        data: 'Hello world',
      })
    }, 4000)

    process.stdin.on('end', () => {
      sendDebugMessage('info', 'stdin closed, shutting down Electron app')
      clearInterval(sendInterval)
      app.quit()
    })

    registerAboutWindowCreationByIPC()
  } catch (e) {
    console.error('app error:', e)
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown')
  }
})
