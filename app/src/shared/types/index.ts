import { BrowserWindow, BrowserWindowConstructorOptions, IpcMainInvokeEvent } from 'electron'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

export interface WindowProps extends BrowserWindowConstructorOptions {
  id: string
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

export type Message = {
  type: 'text' | 'video/mp4' | 'video/mpeg' | 'video/ogg' | 'video/webm' | 'video/quicktime'
  progress: number // 0-1
  data: string // Files will be in binary chunks
}
