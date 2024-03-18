import { BrowserWindow } from 'electron'
import { displayName } from 'package.json'
import { join } from 'path'
import { createWindow } from '~/src/main/factories'
import { ENVIRONMENT } from '~/src/shared/constants'

export async function MainWindow() {
  const window = createWindow({
    id: 'main',
    title: displayName,
    width: 700,
    height: 473,
    show: false,
    center: true,
    movable: true,
    resizable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: 'detach' })
    }

    window.show()
  })

  window.on('close', () => BrowserWindow.getAllWindows().forEach(window => window.destroy()))

  return window
}
