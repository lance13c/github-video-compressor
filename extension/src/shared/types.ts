export type FileChunkMessage = {
  id: string;
  type: 'fileChunk';
  chunk: string; // base64 encoded file chunk;
  fileType: string;
  progress: number;
  isComplete: boolean;
  url?: string;
};
