// FileChunkReceiver.ts

import type { FileChunkMessage } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { base64ToUint8Array, uint8ArrayToBase64 } from '@root/src/pages/background/binaryHelpers';

export class FileChunkReceiver {
  private fileChunks: Uint8Array[] = [];

  constructor(listener: (message: { blob?: Blob; fileName?: string; isComplete: boolean; progress?: number }) => void) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'fileChunk') {
        const fileChunkMessage = message as FileChunkMessage;
        const chunkUint8 = base64ToUint8Array(fileChunkMessage.chunk);

        console.log('chunk length', chunkUint8);

        this.fileChunks.push(chunkUint8);

        if (fileChunkMessage.isComplete) {
          console.log('fileChunks', this.fileChunks);

          const blob = new Blob(this.fileChunks, { type: fileChunkMessage.fileType });
          console.log('blob', blob);
          const fileExtension = fileChunkMessage.fileType.split('/')?.[1] || fileChunkMessage.fileType.split('.')?.[1];
          const fileName = `compressed-video.${fileExtension}`;

          listener({
            blob,
            fileName,
            progress: 1,
            isComplete: fileChunkMessage.isComplete,
          });

          console.log('complete! send');
          // ... proceed to create URL and download
          // Optionally, you can use an event or callback to notify completion
        } else {
          listener({
            progress: fileChunkMessage.progress,
            isComplete: false,
          });
        }

        sendResponse({ next: true });
      } else if (message.type === 'progress') {
        console.info('progress', message);
        sendResponse({ next: true });
      }
    });
  }
}

export class FileChunkSender {
  private readonly chunkSize: number = 35 * 1024 * 1024; // Default to 70MB chunks ish

  constructor(chunkSize?: number) {
    if (chunkSize) {
      this.chunkSize = chunkSize;
    }
  }

  private async readFileChunk(file: File, start: number, end: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Read operation did not return an ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(start, end));
    });
  }

  public async sendFile(file: File): Promise<void> {
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / this.chunkSize);

    for (let index = 0; index < totalChunks; index++) {
      const start = index * this.chunkSize;
      const end = Math.min(start + this.chunkSize, fileSize);
      const chunkUint8 = await this.readFileChunk(file, start, end);
      const base64Chunk = uint8ArrayToBase64(chunkUint8);
      console.info('chunk progress', end / fileSize);

      // In the content.js get the url of the browser tab
      // const url =

      const message: FileChunkMessage = {
        type: 'fileChunk',
        chunk: base64Chunk,
        progress: end / fileSize,
        fileType: file.type,
        isComplete: end >= fileSize,
        // @ts-expect-error -- window is valid global
        url: window.location.href,
      };

      chrome.runtime.sendMessage(message);
    }
  }
}
