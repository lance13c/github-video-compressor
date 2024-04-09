import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const MANIFEST_STATUS_CHANNEL = IPC.WINDOWS.SETUP.MANIFEST_STATUS
type InstallStatusCallback = (event: Electron.IpcRendererEvent, args: [InstallStatus, string | undefined]) => void

export function onManifestInstallStatus(callback: InstallStatusCallback) {
  ipcRenderer.on(MANIFEST_STATUS_CHANNEL, callback)

  return () => {
    ipcRenderer.removeListener(MANIFEST_STATUS_CHANNEL, callback)
  }
}

const UPDATE_MANIFEST_FILE_CHANNEL = IPC.WINDOWS.SETUP.UPDATE_MANIFEST_FILE

export function updateManifestFile() {
  ipcRenderer.send(UPDATE_MANIFEST_FILE_CHANNEL)
}
