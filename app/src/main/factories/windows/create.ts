import { BrowserWindow } from 'electron'
import { createFileRoute, createURLRoute } from 'electron-router-dom'
import { join } from 'path'
import { ENVIRONMENT } from '~/src/shared/constants'

import { WindowProps } from '~/src/shared/types'

export function createWindow({ id, ...settings }: WindowProps) {
  const window = new BrowserWindow(settings)

  const devServerURL = createURLRoute(process.env['ELECTRON_RENDERER_URL']!, id)

  const fileRoute = createFileRoute(join(__dirname, '../renderer/index.html'), id)

  ENVIRONMENT.IS_DEV ? window.loadURL(devServerURL) : window.loadFile(...fileRoute)

  window.on('closed', window.destroy)

  return window
}
