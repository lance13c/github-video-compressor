// FileChunkReceiver.ts

import type { FileChunkMessage } from '@root/src/pages/background/FileChunkSender';

export class FileChunkReceiver {
  private fileChunks: Uint8Array[] = [];

  constructor(listener: ({ blob, progress }: { blob?: Blob; progress?: number }) => void) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'fileChunk') {
        const fileChunkMessage = message as FileChunkMessage;
        this.fileChunks.push(new Uint8Array(fileChunkMessage.chunk));
        listener({
          progress: fileChunkMessage.progress,
        });

        if (fileChunkMessage.isLast) {
          const blob = new Blob(this.fileChunks, { type: fileChunkMessage.fileType });
          console.log('file', blob.toString());
          listener({
            blob,
            progress: 1,
          });

          console.log('complete! send');
          // ... proceed to create URL and download
          // Optionally, you can use an event or callback to notify completion
        }

        sendResponse({ next: true });
      }
    });
  }
}
