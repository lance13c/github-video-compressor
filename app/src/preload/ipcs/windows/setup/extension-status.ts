import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const channel = IPC.WINDOWS.SETUP.EXTENSION_STATUS
type InstallStatusCallback = (event: Electron.IpcRendererEvent, args: [InstallStatus, string | undefined]) => void

export function onExtensionInstallStatus(callback: InstallStatusCallback) {
  console.log('adding listener')

  ipcRenderer.on(channel, callback)
  console.log('init ipcRenderer listener count', ipcRenderer.listenerCount(channel))

  return () => {
    console.log('Removing listener')
    ipcRenderer.removeListener(channel, callback)

    console.log('ipcRenderer listener count', ipcRenderer.listenerCount(channel))
  }
}

export function verifyChromeExtensionIsInstalled() {
  ipcRenderer.send(IPC.WINDOWS.SETUP.VERIFY_EXTENSION)
}
