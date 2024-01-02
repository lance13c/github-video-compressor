export type FileChunkMessage = {
  id: string
  type: 'fileChunk'
  chunk: string // base64 encoded file chunk;
  fileType: string
  progress: number
  isComplete: boolean
  url?: string
}

export type Command<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Options extends { token: string; [key: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReturnValue extends Promise<any>,
> = (options: Options) => ReturnValue

export type BrowserExtensionType = 'chrome' | 'firefox' | 'safari' | 'edge'
