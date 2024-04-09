import { ipcRenderer } from 'electron'
import { IPC } from '~/src/shared/constants'

export function createAboutWindow() {
  const channel = IPC.WINDOWS.ABOUT.CREATE_WINDOW

  ipcRenderer.invoke(channel)
}
