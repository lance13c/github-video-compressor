// FileChunkSender.ts

export type FileChunkMessage = {
  type: 'fileChunk';
  chunk: ArrayBuffer;
  fileType: string;
  progress: number;
  isLast: boolean;
};

export class FileChunkSender {
  private readonly chunkSize: number;

  constructor(chunkSize: number = 1024 * 1024) {
    this.chunkSize = chunkSize; // Default to 1MB chunks
  }

  private async sendChunk({
    chunk,
    tabId,
    fileType,
    progress,
    isLast,
  }: {
    chunk: ArrayBuffer;
    tabId: number;
    fileType: string;
    progress: number;
    isLast: boolean;
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fileChunkMessage: FileChunkMessage = { type: 'fileChunk', chunk, progress, fileType, isLast };
      chrome.tabs.sendMessage(tabId, fileChunkMessage, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response.next);
      });
    });
  }

  public async sendFile({ blob, tabId }: { blob: Blob; tabId: number }): Promise<void> {
    const data = await blob.arrayBuffer();
    const fileType = blob.type;
    const totalChunks = Math.ceil(data.byteLength / this.chunkSize);

    for (let index = 0; index < totalChunks; index++) {
      const isLast = index + 1 < totalChunks;
      const chunk = data.slice(index * this.chunkSize, (index + 1) * this.chunkSize);
      // Do the math to figure out the progres between 0 and this chunk size
      const progress = Math.min((index + 1) * this.chunkSize, data.byteLength) / data.byteLength;

      await this.sendChunk({ chunk, tabId, fileType, progress, isLast });
    }

    console.log('Last chunk sent: ', totalChunks);
  }
}
