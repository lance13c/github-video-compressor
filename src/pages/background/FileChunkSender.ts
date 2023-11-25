// FileChunkSender.ts

import { uint8ArrayToBase64 } from '@root/src/pages/background/binaryHelpers';

export type FileChunkMessage = {
  type: 'fileChunk';
  chunk: string; // base64 encoded file chunk;
  fileType: string;
  progress: number;
  isComplete: boolean;
};

export class FileChunkSender {
  private readonly chunkSize: number;

  constructor(chunkSize: number = 1024 * 1024 * 1024) {
    this.chunkSize = chunkSize; // Default to 1MB chunks
  }

  private async sendChunk({
    chunk,
    tabId,
    fileType,
    progress,
    isComplete,
  }: {
    chunk: Uint8Array;
    tabId: number;
    fileType: string;
    progress: number;
    isComplete: boolean;
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const chunkBase64 = uint8ArrayToBase64(chunk);
      console.log('chunkBase64', chunkBase64);
      const fileChunkMessage: FileChunkMessage = {
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
    data,
    tabId,
    fileType,
  }: {
    data: Uint8Array;
    tabId: number;
    fileType: string;
  }): Promise<void> {
    const totalChunks = Math.ceil(data.byteLength / this.chunkSize);

    for (let index = 0; index < totalChunks; index++) {
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
      this.sendChunk({ chunk, tabId, fileType, progress, isComplete });
    }

    console.log('Last chunk sent: ', totalChunks);
  }
}
