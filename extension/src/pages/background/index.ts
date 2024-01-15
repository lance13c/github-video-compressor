import { NativeMessageTransceiver } from '@pages/background/NativeMessageTransceiver'
import { NativeMessagingClient } from '@pages/background/nativeMessageClient'
import type { StartSessionResponse, StopSessionResponse } from '@root/src/utils/zod.util'
import { ExtensionMessageSchema } from '@root/src/utils/zod.util'
import { getToken, setToken } from '@utils/token.util'
// import { sendFileToServer } from '@root/src/util/file.util';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script'
import 'webextension-polyfill'

const APP_NAME = 'com.dominic_cicilio.github_video_compressor'

const init = async () => {
  console.log('init')
  console.log('window.navigator.hardwareConcurrency', globalThis.navigator.hardwareConcurrency)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  let nativeMessageClient: null | NativeMessagingClient = null

  const startSession = () =>
    new Promise<{ token: string }>((resolve, reject) => {
      try {
        if (nativeMessageClient) {
          // Get the existing token
          getToken().then(token => {
            if (!token) {
              throw new Error('No token found')
            }
            resolve({ token })
          })
        } else {
          nativeMessageClient = new NativeMessagingClient(APP_NAME)
          const nativeMessageTransceiver = new NativeMessageTransceiver({
            chunkSizeOut: 512,
          })

          const dataStream = nativeMessageTransceiver.createDataStream(nativeMessageClient.addListener)

          dataStream.onProgress((progress, total) => {
            console.log('extension progress', progress, total)
          })

          dataStream.onComplete(async message => {
            console.log('extension complete', message)
            if (message.type === 'connection') {
              const token = message.data
              console.log('info', `Received token ${token}`)
              setToken(token)

              resolve({ token })
            }
          })
        }
      } catch (e) {
        reject(e)
      }
    })

  const stopSession = () => {
    if (!nativeMessageClient) {
      console.warn('No native message client')
      return false
    }

    console.log('disconnecting native message client')
    nativeMessageClient?.disconnect()
    nativeMessageClient = null

    return true
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const parsedMessage = ExtensionMessageSchema.safeParse(message)
    if (!parsedMessage.success) throw new Error('Invalid message: ' + parsedMessage)

    console.log('message', parsedMessage.data)
    if (parsedMessage.data.type === 'start_session') {
      startSession().then(({ token }) => {
        console.log('retrieved token:', token)
        console.log('hit session timeout')
        sendResponse({ token } satisfies StartSessionResponse)
      })

      return true
    } else if (parsedMessage.data.type === 'stop_session') {
      const success = stopSession()
      sendResponse({ success } satisfies StopSessionResponse)
      return true
    }
  })
}

init()
reloadOnUpdate('pages/background')
