import { NativeMessageTransceiver } from '@pages/background/NativeMessageTransceiver'
import { NativeMessagingClient } from '@pages/background/nativeMessageClient'
import type { StartSessionResponse, StopSessionResponse } from '@root/src/utils/zod.util'
import { ExtensionMessageSchema } from '@root/src/utils/zod.util'
import { pingTest } from '@utils/file.util'
import { getToken, setToken } from '@utils/token.util'
// import { sendFileToServer } from '@root/src/util/file.util';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script'
import 'webextension-polyfill'

const APP_NAME = 'com.dominic_cicilio.github_video_compressor'
let nativeMessageClient: null | NativeMessagingClient = null

const startSession = () =>
  new Promise<{ token: string }>((resolve, reject) => {
    try {
      if (nativeMessageClient) {
        console.error('Native Message Client already exists')

        // Get the existing token
        getToken().then(token => {
          console.log('existing token: ' + token)
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

            await pingTest()
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
  nativeMessageClient?.disconnect()
  nativeMessageClient = null

  return true
}

const init = async () => {
  console.log('init')
  console.log('window.navigator.hardwareConcurrency', globalThis.navigator.hardwareConcurrency)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const parsedMessage = ExtensionMessageSchema.safeParse(message)
    if (!parsedMessage.success) throw new Error('Invalid message: ' + parsedMessage)

    console.log('message', parsedMessage.data)
    if (parsedMessage.data.type === 'start_session') {
      startSession().then(({ token }) => {
        console.log('retrieved token:', token)
        setTimeout(() => {
          console.log('hit session timeout')
          sendResponse({ token } satisfies StartSessionResponse)
        }, 5000)
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
