type Message = {
  type: 'text' | 'video/mp4' | 'video/mpeg' | 'video/ogg' | 'video/webm' | 'video/quicktime'
  progress: number
  data: string
}

export type ProgressCallback = (progress: number, total: number) => void
export type CompleteCallback = (message: Message) => void

export class NativeMessageTransceiver {
  private chunkSizeOut: number
  private chunkSizeIn: number
  private totalSize: number = 0
  private receivedSize: number = 0

  constructor({ chunkSizeOut, chunkSizeIn }: { chunkSizeOut: number; chunkSizeIn: number }) {
    this.chunkSizeOut = chunkSizeOut
    this.chunkSizeIn = chunkSizeIn
  }

  createDataStream(addListener: (listener: (message: Message) => void) => void): DataStream {
    const dataStream = new DataStream(this.chunkSizeIn)
    addListener((message: Message) => dataStream.receiveData(message))
    return dataStream
  }

  send(data: Uint8Array, type: string, onChunkSend: ProgressCallback) {
    let offset = 0
    while (offset < data.byteLength) {
      const end = Math.min(offset + this.chunkSizeOut, data.byteLength)
      const chunk = data.subarray(offset, end)
      offset += chunk.byteLength // Update offset by the actual chunk size

      onChunkSend(chunk.byteLength, data.byteLength)
    }
  }
}

export class DataStream {
  private chunkSizeIn: number
  private onProgressCallback: ProgressCallback | null = null
  private onCompleteCallback: CompleteCallback | null = null
  private receivedData: Uint8Array[] = []
  private totalSize: number = 0
  private receivedSize: number = 0

  constructor(chunkSizeIn: number) {
    this.chunkSizeIn = chunkSizeIn
  }

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

    if (this.onProgressCallback) {
      this.onProgressCallback(this.receivedSize, this.totalSize)
    }

    if (this.receivedSize >= this.totalSize && this.onCompleteCallback) {
      const completeData = new Uint8Array(
        this.receivedData.reduce((acc: number[], val: Uint8Array) => {
          return acc.concat(Array.from(val))
        }, [])
      )
      this.onCompleteCallback({ ...message, data: completeData.toString() })
    }
  }
}
