import { ipcRenderer } from 'electron'
import { IPC, InstallStatus } from '~/src/shared/constants'

const channel = IPC.WINDOWS.SETUP.FFMPEG_PATH
export function onFfmpegPathStatus(fn: (status: InstallStatus) => void) {
  ipcRenderer.on(channel, (_, status: InstallStatus) => {
    fn(status)
  })

  return () => {
    ipcRenderer.removeListener(channel, fn)
  }
}

export function setFfmpegPath(path: string) {
  ipcRenderer.send(IPC.WINDOWS.SETUP.FFMPEG_PATH, path)
}

export function onFfmpegPath(callback: (event: Electron.IpcRendererEvent, path: string) => void) {
  ipcRenderer.on(IPC.WINDOWS.SETUP.FFMPEG_PATH, callback)

  return () => {
    ipcRenderer.removeListener(IPC.WINDOWS.SETUP.FFMPEG_PATH, callback)
  }
}
