import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const channel = IPC.WINDOWS.SETUP.EXTENSION_STATUS
type InstallStatusCallback = (event: Electron.IpcRendererEvent, args: [InstallStatus, string | undefined]) => void

export function onExtensionInstallStatus(callback: InstallStatusCallback) {
  ipcRenderer.on(channel, callback)

  return () => {
    ipcRenderer.removeListener(channel, callback)
  }
}

export function verifyChromeExtensionIsInstalled() {
  ipcRenderer.send(IPC.WINDOWS.SETUP.VERIFY_EXTENSION)
}
