import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const channel = IPC.WINDOWS.SETUP.FFMPEG_INSTALL_STATUS
export function onFfmpegInstallStatus(fn: (status: InstallStatus) => void) {
  ipcRenderer.on(channel, (_, status: InstallStatus) => {
    fn(status)
  })

  return () => {
    ipcRenderer.removeListener(channel, fn)
  }
}
