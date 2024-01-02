import type { Message } from '@utils/zod.util';
import { Buffer } from 'buffer';

// Number between 0 and 1, a percentage of the total file size
export type ProgressCallback = (formattedProgress: string, progress: number) => void;
export type ChunkSendCallback = (message: Message) => void;
export type CompleteCallback = (message: Message) => void;

// 1000x coverts it to kilobytes
const BYTE_MULTIPLE = 1024;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export class NativeMessageTransceiver {
  private chunkSizeOut: number;

  // Chunksize is in kilobytes
  constructor({ chunkSizeOut }: { chunkSizeOut: number }) {
    this.chunkSizeOut = chunkSizeOut * BYTE_MULTIPLE;
  }

  createDataStream(addListener: (listener: (message: Message) => void) => void): DataStream {
    const dataStream = new DataStream();
    addListener((message: Message) => dataStream.receiveData(message));
    return dataStream;
  }

  async send(data: Uint8Array, type: Message['type'], onChunkSend: ChunkSendCallback, delayMs: number = 100) {
    let offset = 0;
    while (offset < data.byteLength) {
      const end = Math.min(offset + this.chunkSizeOut, data.byteLength);
      const chunk = data.subarray(offset, end);
      offset += chunk.byteLength; // Update offset by the actual chunk size

      onChunkSend({
        type,
        progress: offset / data.byteLength,
        data: chunk.toString(),
      } satisfies Message);

      // Wait for a delay
      await delay(delayMs);
    }
  }
}

export class DataStream {
  private onProgressCallback: ProgressCallback | null = null;
  private onCompleteCallback: CompleteCallback | null = null;
  private receivedData: Uint8Array[] = [];
  private totalSize: number = 0;
  private receivedSize: number = 0;

  constructor() {}

  onProgress(callback: ProgressCallback) {
    this.onProgressCallback = callback;
  }

  onComplete(callback: CompleteCallback) {
    this.onCompleteCallback = callback;
  }

  receiveData(message: Message) {
    console.log('message', message);
    const dataChunk = new Uint8Array(Buffer.from(message.data, 'binary'));

    this.receivedData.push(dataChunk);
    this.receivedSize += dataChunk.byteLength;
    // sendDebugMessage('background received data', JSON.stringify(message))

    if (this.onProgressCallback) {
      this.onProgressCallback(`${Math.floor(message.progress * 100) / 100}% Complete`, message.progress);
    }

    if (this.receivedSize >= this.totalSize && this.onCompleteCallback) {
      const completeData = new Uint8Array(
        this.receivedData.reduce((acc: number[], val: Uint8Array) => {
          return acc.concat(Array.from(val));
        }, []),
      );

      if (message.type === 'connection' || message.type === 'text') {
        console.log('hit connection');
        // convert completeData from Uint8Array to string
        const completeDataString = new TextDecoder().decode(completeData);
        this.onCompleteCallback({ type: message.type, progress: 1, data: completeDataString });
        return;
      } else {
        this.onCompleteCallback({ type: message.type, progress: 1, data: completeData.toString() });
      }
    }
  }
}
