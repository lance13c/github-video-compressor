import { app } from 'electron'

// import { sendDebugMessage } from 'main/dev_websockets'
import { sendDebugMessage } from 'main/dev_websockets'
import { NativeMessagingHost } from 'shared/utils/nativeMessagingHost'
import { makeAppWithSingleInstanceLock } from './factories'
import { registerAboutWindowCreationByIPC } from './windows'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  try {
    // console.log('ad--------------------------f', tempIcon)
    const nativeMessagingHost = new NativeMessagingHost()

    nativeMessagingHost.addListener(parsedData => sendDebugMessage('nativeMessagingHostData', parsedData))

    process.stdin.on('data', data => {
      sendDebugMessage('stdinData', `${data}`)
      // Rest of your onDataReceived logic
    })

    process.stdin.on('end', () => {
      console.log('stdin closed, shutting down Electron app')
      sendDebugMessage('info', 'stdin closed, shutting down Electron app')
      // clearInterval(sendInterval)
      app.quit()
    })

    registerAboutWindowCreationByIPC()
  } catch (e) {
    console.error('app error:', e)
    // @ts-ignore
    // sendDebugMessage('error', e?.message || 'unknown')
  }
})
