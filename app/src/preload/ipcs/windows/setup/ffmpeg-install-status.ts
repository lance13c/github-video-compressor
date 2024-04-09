import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const channel = IPC.WINDOWS.SETUP.FFMPEG_INSTALL_STATUS
type InstallStatusCallback = (event: Electron.IpcRendererEvent, args: [InstallStatus, string | undefined]) => void

export function onFfmpegInstallStatus(callback: InstallStatusCallback) {
  ipcRenderer.on(channel, callback)

  return () => {
    ipcRenderer.removeListener(channel, callback)
  }
}
