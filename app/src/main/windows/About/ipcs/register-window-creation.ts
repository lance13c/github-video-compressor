import { ipcMain } from 'electron'

import { registerWindowCreationByIPC } from 'main/factories'
import { IPC } from 'shared/constants'
import { AboutWindow } from '..'

export function registerAboutWindowCreationByIPC() {
  registerWindowCreationByIPC({
    channel: IPC.WINDOWS.ABOUT.CREATE_WINDOW,
    window: AboutWindow,

    callback(window, { sender }) {
      const channel = IPC.WINDOWS.ABOUT.WHEN_WINDOW_CLOSE

      ipcMain.removeHandler(channel)

      window.on('closed', () =>
        sender.send(channel, {
          message: 'About window closed!',
        })
      )
    },
  })
}
