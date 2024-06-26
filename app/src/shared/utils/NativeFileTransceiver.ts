// FileChunkSender.ts

import { ChunkBundler } from './ChunkBundler'
import { uint8ArrayToBase64 } from './binaryHelpers'
import { NativeMessagingHost } from './nativeMessagingHost'

export type FileChunkMessage = {
  type: 'fileChunk'
  chunk: string // base64 encoded file chunk;
  fileType: string
  progress: number
  isComplete: boolean
  url?: string
}

export type Listener = (parsedData: Record<string, any> | null, rawData: Buffer) => void

export class NativeFileTransceiver {
  private readonly chunkSize: number
  private nativeMessagingHost: NativeMessagingHost
  private chunkBundler: ChunkBundler | null = null

  constructor({
    nativeMessageHost,
    chunkSize = 0.9 * 1024 * 1024,
  }: {
    nativeMessageHost: NativeMessagingHost
    chunkSize: number
  }) {
    this.chunkSize = Math.floor(chunkSize) // Default to 0.9MB , the max size for native messaging to client is 1Mb
    this.nativeMessagingHost = nativeMessageHost
    this.nativeMessagingHost.addListener(data => {
      // const internalData = data
      // const chunk = data?.chunk as Uint8Array
      // const isFirst = data?.isFirst
      // if (!chunk) {
      //   // Do nothing when not a chunk.
      //   return
      // }
      // if (isFirst) {
      //   // Get total size one first load.
      //   this.chunkBundler = new ChunkBundler(20)
      //   this.chunkBundler.addFileChunk(data)
      // }
      // if (!!this.chunkBundler) {
      //   this.chunkBundler.addFileChunk(data)
      // }
      // if ()
      // // Send data back to client in chunks
      // this.sendFile({
      //   data: chunk,
      //   fileType: 'video/mp4',
      // });
    })
  }

  private async sendChunk({
    chunk,
    fileType,
    progress,
    isComplete,
  }: {
    chunk: Uint8Array
    fileType: string
    progress: number
    isComplete: boolean
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const chunkBase64 = uint8ArrayToBase64(chunk)
        const fileChunkMessage: FileChunkMessage = {
          type: 'fileChunk',
          chunk: chunkBase64,
          progress,
          fileType,
          isComplete,
        }

        // this.nativeMessagingHost.sendMessage(fileChunkMessage)
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }

  public async sendFile({
    data,
    fileType,
  }: {
    data: Uint8Array
    fileType: 'video/mp4' | 'video/mpeg' | 'video/webm'
  }): Promise<void> {
    console.error('hit send file')

    const totalChunks = Math.ceil(data.byteLength / this.chunkSize)

    for (let index = 0; index < totalChunks; index++) {
      console.error('chunk sent')
      // Determine if this is the last chunk
      const isComplete = index === totalChunks - 1

      // Calculate the start and end of the current chunk
      const start = index * this.chunkSize
      let end = start + this.chunkSize

      if (isComplete) {
        end = data.byteLength
      } else if (end > data.byteLength) {
        end = data.byteLength
      }

      // Slice the chunk from the data
      const chunk = data.slice(start, end)

      // Calculate the progress
      const progress = end / data.byteLength

      // Convert chunk to Uint8Array and send
      this.sendChunk({ chunk, fileType, progress, isComplete })
    }

    console.log('Last chunk sent: ', totalChunks)
  }
}
