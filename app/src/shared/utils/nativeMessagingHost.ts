// NativeMessagingHost.ts
import { sendDebugMessage } from 'main/dev_websockets'
import process from 'process'
import { type Message } from 'shared/types'
import { Listener } from 'shared/utils/NativeFileTransceiver'

const objectToStdMessage = (message: Record<string, any>): Buffer => {
  const buffer = Buffer.from(JSON.stringify(message))
  const header = Buffer.alloc(4)
  header.writeUInt32LE(buffer.length, 0)
  const data = Buffer.concat([header, buffer])

  return data
}

// Create stdMessageToObject
const bufferToObject = (buffer: Buffer): Record<string, any> | null => {
  sendDebugMessage('BUFFER', buffer.toString('hex'))
  if (buffer.length < 4) {
    sendDebugMessage('bufferObj', 'Buffer is too short to contain message length.')
    return null
  }

  // Read the first 4 bytes to get the message length
  const messageLength = buffer.readUInt32LE(0)

  if (buffer.length < 4 + messageLength) {
    sendDebugMessage('bufferObj', 'Buffer does not contain the full message.')
    return null
  }

  // Extract the JSON message from the buffer
  const jsonMessage = buffer.slice(4, 4 + messageLength).toString('utf-8')

  try {
    // Parse the JSON message back into an object
    return JSON.parse(jsonMessage)
  } catch (error) {
    // @ts-ignore
    sendDebugMessage('Error bufferObj parsing JSON from buffer:', error?.message || 'unknown')
    return null
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
      sendDebugMessage('buffer received', data.toString())
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

  addListener(listener: Listener): void {
    this.listeners.push(listener)
  }

  private onDataReceived(data: Buffer): void {
    const bufferObject = bufferToObject(data)
    const parsedData = convertJsonUint8ToObject(bufferObject || {})
    sendDebugMessage('onDataReceived', parsedData)
    const dataAsString = JSON.stringify(parsedData)
    this.sendMessage({ type: 'text', progress: 1, data: dataAsString })

    this.listeners.forEach(listener => {
      listener(parsedData, data)
    })
  }
}
