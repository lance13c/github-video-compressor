import { ipcRenderer } from 'electron'
import { IPC } from 'shared/constants'

const channel = IPC.WINDOWS.SETUP.FFMPEG_INSTALLING
export function whenFfmpegInstalling(fn: (...args: any[]) => void) {
  ipcRenderer.on(channel, (_, ...args) => {
    fn(...args)
  })

  return () => {
    ipcRenderer.removeListener(channel, fn)
  }
}

export function sendFfmpegInstallationLogs(channel: string, ...args: any[]) {
  ipcRenderer.send(channel, ...args)
}
