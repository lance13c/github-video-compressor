import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const channel = IPC.WINDOWS.SETUP.MANIFEST_STATUS
type InstallStatusCallback = (event: Electron.IpcRendererEvent, args: [InstallStatus, string | undefined]) => void

export function onManifestInstallStatus(callback: InstallStatusCallback) {
  ipcRenderer.on(channel, callback)

  return () => {
    ipcRenderer.removeListener(channel, callback)
  }
}
