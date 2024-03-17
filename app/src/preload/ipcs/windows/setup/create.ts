import { ipcRenderer } from 'electron'
import { IPC } from 'shared/constants'

export function createSetupWindow() {
  const channel = IPC.WINDOWS.SETUP.CREATE_WINDOW

  ipcRenderer.invoke(channel)
}
