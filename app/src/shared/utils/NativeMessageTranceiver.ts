import { sendDebugMessage } from 'main/dev_websockets'
import { Message } from 'shared/utils/zod.util'

// Number between 0 and 1, a percentage of the total file size
export type ProgressCallback = (formattedProgress: string, progress: number) => void
export type ChunkSendCallback = (message: Message) => void
export type CompleteCallback = (message: Message) => void

export class NativeMessageTransceiver {
  private chunkSizeOut: number
  private chunkSizeIn: number

  constructor({ chunkSizeOut, chunkSizeIn }: { chunkSizeOut: number; chunkSizeIn: number }) {
    this.chunkSizeOut = chunkSizeOut
    this.chunkSizeIn = chunkSizeIn
  }

  createDataStream(addListener: (listener: (message: Message) => void) => void): DataStream {
    const dataStream = new DataStream()
    addListener((message: Message) => dataStream.receiveData(message))
    return dataStream
  }

  send(data: Uint8Array, type: Message['type'], onChunkSend: ChunkSendCallback) {
    let offset = 0
    while (offset < data.byteLength) {
      const end = Math.min(offset + this.chunkSizeOut, data.byteLength)
      const chunk = data.subarray(offset, end)
      offset += chunk.byteLength // Update offset by the actual chunk size

      onChunkSend({
        type,
        progress: offset / data.byteLength,
        data: chunk.toString(),
      } satisfies Message)
    }
  }
}

export class DataStream {
  private onProgressCallback: ProgressCallback | null = null
  private onCompleteCallback: CompleteCallback | null = null
  private receivedData: Uint8Array[] = []
  private totalSize: number = 0
  private receivedSize: number = 0

  constructor() {}

  onProgress(callback: ProgressCallback) {
    this.onProgressCallback = callback
  }

  onComplete(callback: CompleteCallback) {
    this.onCompleteCallback = callback
  }

  receiveData(message: Message) {
    const dataChunk = new Uint8Array(Buffer.from(message.data, 'binary'))

    this.receivedData.push(dataChunk)
    this.receivedSize += dataChunk.byteLength
    sendDebugMessage('receiveData', JSON.stringify(message))

    if (this.onProgressCallback) {
      this.onProgressCallback(`${Math.floor(message.progress * 100) / 100}% Complete`, message.progress)
    }

    if (this.receivedSize >= this.totalSize && this.onCompleteCallback) {
      const completeData = new Uint8Array(
        this.receivedData.reduce((acc: number[], val: Uint8Array) => {
          return acc.concat(Array.from(val))
        }, [])
      )
      this.onCompleteCallback({ type: message.type, progress: 1, data: completeData.toString() })
    }
  }
}
