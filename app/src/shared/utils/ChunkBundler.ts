import { base64ToUint8Array } from 'shared/utils/binaryHelpers';

export class ChunkBundler {
  private fileChunks: Uint8Array[] = [];
  private totalChunks: number = 0;
  private totalChunksReceived: number = 0;
  private fileType: string = '';

  constructor(totalChunks: number) {
    this.totalChunks = totalChunks;
  }

  public addFileChunk(message: {
    chunk: string;
    progress: number;
    fileType: string;
    isComplete: boolean;
    isStart: boolean;
  }): { progress: number; isComplete: boolean } {
    const chunkUint8 = base64ToUint8Array(message.chunk);
    this.fileChunks.push(chunkUint8);
    this.totalChunksReceived += chunkUint8.length;
    this.fileType = message.fileType;

    return {
      progress: this.totalChunksReceived / this.totalChunks,
      isComplete: message.isComplete,
    };
  }

  public async assembleFile(outputFileName: string) {
    return new File(this.fileChunks, outputFileName, { type: this.fileType });
  }
}
