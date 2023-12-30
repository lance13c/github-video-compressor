// FileChunkSender.ts

import { base64ToUint8Array, uint8ArrayToBase64 } from '@root/src/pages/background/binaryHelpers';

export type FileChunkMessage = {
  id: string;
  type: 'fileChunk';
  chunk: string; // base64 encoded file chunk;
  fileType: string;
  progress: number;
  isComplete: boolean;
  url?: string;
};

export class BackgroundFileChunkSender {
  private readonly chunkSize: number;

  constructor(chunkSize: number = 35 * 1024 * 1024) {
    this.chunkSize = chunkSize; // Default to 70MB chunks ish
  }

  private async sendChunk({
    id,
    chunk,
    tabId,
    fileType,
    progress,
    isComplete,
  }: {
    id,
    chunk: Uint8Array;
    tabId: number;
    fileType: string;
    progress: number;
    isComplete: boolean;
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const chunkBase64 = uint8ArrayToBase64(chunk);
      const fileChunkMessage: FileChunkMessage = {
        id,
        type: 'fileChunk',
        chunk: chunkBase64,
        progress,
        fileType,
        isComplete,
      };
      chrome.tabs.sendMessage(tabId, fileChunkMessage, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        resolve(response.next);
      });
    });
  }

  public async sendFile({
    id,
    data,
    tabId,
    fileType,
  }: {
    id: string;
    data: Uint8Array;
    tabId?: number;
    fileType: string;
  }): Promise<void> {
    const totalChunks = Math.ceil(data.byteLength / this.chunkSize);

    for (let index = 0; index < totalChunks; index++) {
      console.log('chunk sent');
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
      this.sendChunk({id, chunk, tabId, fileType, progress, isComplete });
    }

    console.log('Last chunk sent: ', totalChunks);
  }
}

export class BackgroundFileChunkReceiver {
  private fileChunks: Uint8Array[] = [];
  private fileType: string = '';
  private totalReceived: number = 0;
  private listener: (blob: Blob, tabId: number, messageId: string) => Promise<void>;
  private tabId: number = -1;
  private messageId: string;
  private url: string = '';

  constructor(listener: (blob: Blob, tabId: number, messageId: string) => Promise<void>) {
    this.listener = listener;
    chrome.runtime.onMessage.addListener((message: FileChunkMessage, sender) => {
      this.url = message.url;
      if (message.type === 'fileChunk') {
        this.tabId = sender.tab?.id;
        this.messageId = message.id,
        this.handleFileChunk(message);
      }
    });
  }

  private handleFileChunk(message: { chunk: string; progress: number; fileType: string; isComplete: boolean }): void {
    const chunkUint8 = base64ToUint8Array(message.chunk);
    this.fileChunks.push(chunkUint8);
    this.totalReceived += chunkUint8.length;
    this.fileType = message.fileType;

    if (message.isComplete) {
      this.assembleFile();
    }
  }

  private async assembleFile() {
    const completeFile = new File(this.fileChunks, 'test.mp4', { type: this.fileType });
    console.log('File received and assembled', completeFile);

    const test_repo = this.url.split('/').slice(-2).join('/');
    console.log('test_repo', test_repo);

    this.listener(completeFile, this.tabId, this.messageId);
  }
}
