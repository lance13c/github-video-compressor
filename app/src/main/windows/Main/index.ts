import { BrowserWindow, shell } from 'electron'
import { displayName } from 'package.json'
import { join } from 'path'
import { createWindow } from '~/src/main/factories'
import { ENVIRONMENT } from '~/src/shared/constants'

export async function MainWindow() {
  const window = createWindow({
    id: 'main',
    title: displayName,
    width: 900,
    height: 573,
    show: false,
    center: true,
    movable: true,
    resizable: false,
    alwaysOnTop: false,
    autoHideMenuBar: true,

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
    },
  })

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: 'detach' })
    }

    window.show()
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  window.on('close', () => BrowserWindow.getAllWindows().forEach(window => window.destroy()))

  return window
}
