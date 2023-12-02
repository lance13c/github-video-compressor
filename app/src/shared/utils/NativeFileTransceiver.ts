// FileChunkSender.ts

import { NativeMessagingHost } from 'shared/utils/nativeMessagingHost';
import { uint8ArrayToBase64 } from './binaryHelpers';

export type FileChunkMessage = {
  type: 'fileChunk';
  chunk: string; // base64 encoded file chunk;
  fileType: string;
  progress: number;
  isComplete: boolean;
  url?: string;
};

export type Listener = (message: Record<string, any>) => void;

export class NativeFileTransceiver {
  private readonly chunkSize: number;
  private readonly nativeMessagingHost: NativeMessagingHost


  constructor({nativeMessageHost, chunkSize = 0.9 * 1024 * 1024}: {
    nativeMessageHost: NativeMessagingHost;
    chunkSize: number;
    
  }) {
    this.chunkSize = Math.floor(chunkSize); // Default to 0.9MB , the max size for native messaging to client is 1Mb
    this.nativeMessagingHost = nativeMessageHost;
    this.nativeMessagingHost.addListener((data) => {
      const chunk = data?.chunk as Uint8Array;
      if (!chunk) {
        console.error(chunk);
      }
      // Send data back to client in chunks
      this.sendFile({
        data: chunk,
        fileType: 'video/mp4',
      });

    })
  }

  private async sendChunk({
    chunk,
    fileType,
    progress,
    isComplete,
  }: {
    chunk: Uint8Array;
    fileType: string;
    progress: number;
    isComplete: boolean;
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const chunkBase64 = uint8ArrayToBase64(chunk);
        console.log('chunkBase64', chunkBase64);
        const fileChunkMessage: FileChunkMessage = {
          type: 'fileChunk',
          chunk: chunkBase64,
          progress,
          fileType,
          isComplete,
        };
        this.nativeMessagingHost.sendMessage(fileChunkMessage);
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  public async sendFile({
    data,
    fileType,
  }: {
    data: Uint8Array;
    fileType: 'video/mp4' | 'video/mpeg' | 'video/webm';
  }): Promise<void> {
    console.error('hit send file');

    const totalChunks = Math.ceil(data.byteLength / this.chunkSize);

    for (let index = 0; index < totalChunks; index++) {
      console.error('chunk sent');
      // Determine if this is the last chunk
      const isComplete = index === totalChunks - 1;

      // Calculate the start and end of the current chunk
      const start = index * this.chunkSize;
      let end = start + this.chunkSize;

      if (isComplete) {
        end = data.byteLength;
      } else if (end > data.byteLength) {
        end = data.byteLength;
      }

      // Slice the chunk from the data
      const chunk = data.slice(start, end);

      // Calculate the progress
      const progress = end / data.byteLength;

      // Convert chunk to Uint8Array and send
      this.sendChunk({ chunk, fileType, progress, isComplete });
    }

    console.log('Last chunk sent: ', totalChunks);
  }
}

// export class BackgroundFileChunkReceiver {
//   private fileChunks: Uint8Array[] = [];
//   private fileType: string = '';
//   private totalReceived: number = 0;
//   private listener: (blob: Blob, tabId: number) => Promise<void>;
//   private tabId: number = -1;
//   private url: string = '';

  constructor(listener: (blob: Blob, tabId: number) => Promise<void>) {
    this.listener = listener;
    chrome.runtime.onMessage.addListener((message: FileChunkMessage, sender) => {
      this.url = message.url;
      if (message.type === 'fileChunk') {
        this.tabId = sender.tab?.id;
        this.handleFileChunk(message);
      }
    });
  }

//   private handleFileChunk(message: { chunk: string; progress: number; fileType: string; isComplete: boolean }): void {
//     const chunkUint8 = base64ToUint8Array(message.chunk);
//     this.fileChunks.push(chunkUint8);
//     this.totalReceived += chunkUint8.length;
//     this.fileType = message.fileType;

//     if (message.isComplete) {
//       this.assembleFile();
//     }
//   }

//   private async assembleFile() {
//     const completeFile = new File(this.fileChunks, 'test.mp4', { type: this.fileType });
//     console.log('File received and assembled', completeFile);

//     const test_repo = this.url.split('/').slice(-2).join('/');
//     console.log('test_repo', test_repo);

//     this.listener(completeFile, this.tabId);
//   }
// }
