import { BrowserWindow } from 'electron'
import { createWindow } from 'main/factories'
import { join } from 'path'
import { ENVIRONMENT } from 'shared/constants'
import { displayName } from '~/package.json'

export async function SetupWindow() {
  const window = createWindow({
    id: 'setup',
    title: `${displayName} - Setup`,
    width: 800,
    height: 600,
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

  // Load the setup page URL
  const setupURL = ENVIRONMENT.IS_DEV
    ? 'http://localhost:4927/setup'
    : `file://${join(__dirname, '../../renderer/setup.html')}`

  console.log('Setting up', setupURL)
  window.loadURL(setupURL)

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: 'detach' })
    }
    window.show()
  })

  window.on('close', () => {
    BrowserWindow.getAllWindows().forEach(window => window.destroy())
  })

  return window
}
