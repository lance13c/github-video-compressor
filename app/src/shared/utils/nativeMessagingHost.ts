// NativeMessagingHost.ts
import { sendDebugMessage } from 'main/dev_websockets'
import process from 'process'
import { type Message } from 'shared/types'

export type Listener = (parsedData: Message) => void

const objectToStdMessage = (message: Record<string, any>): Buffer => {
  const buffer = Buffer.from(JSON.stringify(message))
  const header = Buffer.alloc(4)
  header.writeUInt32LE(buffer.length, 0)
  const data = Buffer.concat([header, buffer])

  return data
}

// Create stdMessageToObject
const bufferToObject = (buffer: Buffer): Record<string, any> | null => {
  // sendDebugMessage('buffer', buffer)
  if (buffer.length < 4) {
    sendDebugMessage('bufferObj', 'Buffer is too short to contain message length.')

    throw new Error('Buffer is too short to contain message length.')
  }

  // Read the first 4 bytes to get the message length
  const messageLength = buffer.readUInt32LE(0)

  sendDebugMessage('buffer length:', `${messageLength}`)

  if (buffer.length < 4 + messageLength) {
    sendDebugMessage('bufferObj', `Expected message length: ${messageLength + 4}`)
    sendDebugMessage('bufferObj', `Actual message length: ${buffer.byteLength}`)

    sendDebugMessage('bufferObj', 'Buffer does not contain the full message.')

    throw new Error('Buffer does not contain the full message.')
  }

  // Extract the JSON message from the buffer
  const messageBuffer = buffer.slice(4, 4 + messageLength)
  const messageString = new TextDecoder('utf-8').decode(messageBuffer)

  try {
    // Parse the JSON message back into an object
    return JSON.parse(messageString)
  } catch (error) {
    // @ts-ignore
    throw new Error('Error bufferObj parsing JSON from buffer:', error?.message || 'unknown')
  }
}

function convertJsonUint8ToObject(data: Record<string, any>): Record<string, any> | null {
  // Create a Uint8Array from the input object
  const dataArray = new Uint8Array(Object.values(data))

  // Read the length of the JSON message (first 4 bytes, little-endian format)
  const messageLength = new DataView(dataArray.buffer).getUint32(0, true)

  // Decode the JSON message from the byte array and parse it
  const jsonMessage = new TextDecoder('utf-8').decode(dataArray.slice(4, 4 + messageLength))

  try {
    return JSON.parse(jsonMessage)
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return null
  }
}

export class NativeMessagingHost {
  private listeners: Listener[] = []

  constructor() {
    process.stdin.on('data', (data: Buffer) => {
      // Handle incoming data from the Chrome extension
      // For example, process and send back video file
      // sendDebugMessage('buffer received', data.toString())
      this.onDataReceived(data)
    })
  }

  sendMessage(message: Message): void {
    try {
      const data = objectToStdMessage(message)
      process.stdout.write(data)
    } catch (e) {
      const error = objectToStdMessage({ message: e || '' })
      process.stderr.write(error)
    }
  }

  addListener = (listener: Listener) => {
    this.listeners.push(listener)
  }

  private onDataReceived(data: Buffer): void {
    try {
      const bufferObject = bufferToObject(data)
      const parsedData = convertJsonUint8ToObject(bufferObject || {})
      sendDebugMessage('onDataReceived', parsedData?.progress)
      // const dataAsString = JSON.stringify(parsedData)
      // this.sendMessage({ type: 'text', progress: 1, data: dataAsString })
      // sendDebugMessage('onDataReceived:', JSON.stringify(bufferObject))

      // this.listeners.forEach(listener => {
      //   listener(parsedData)
      // })
    } catch (e) {
      // @ts-ignore
      sendDebugMessage('onDataReceived error', e?.message)
    }
  }
}
