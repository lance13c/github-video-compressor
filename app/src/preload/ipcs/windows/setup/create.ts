import { ipcRenderer } from 'electron'
import { IPC } from '~/src/shared/constants'

export function createSetupWindow() {
  const channel = IPC.WINDOWS.SETUP.CREATE_WINDOW

  ipcRenderer.invoke(channel)
}
