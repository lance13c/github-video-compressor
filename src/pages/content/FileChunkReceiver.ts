// FileChunkReceiver.ts

import type { FileChunkMessage } from '@root/src/pages/background/FileChunkSender';
import { base64ToUint8Array } from '@root/src/pages/background/binaryHelpers';

export class FileChunkReceiver {
  private fileChunks: Uint8Array[] = [];

  constructor(listener: (message: { blob?: Blob; isComplete: boolean; progress?: number }) => void) {
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
          listener({
            blob,
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
      }
    });
  }
}
