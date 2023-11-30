import { Menu, Tray, app } from 'electron'

import { NativeMessagingHost } from '../shared/utils/nativeMessaging'
import { makeAppWithSingleInstanceLock } from './factories'
import { registerAboutWindowCreationByIPC } from './windows'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  const tray = new Tray(__dirname + '/../../../../shared/assets/icon-32.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' },
  ])
  tray.setToolTip('Github Compressor')
  tray.setContextMenu(contextMenu)

  const nativeMessagingHost = new NativeMessagingHost()

  setInterval(() => {
    nativeMessagingHost.sendMessage({ message: 'app ping' })
  }, 3000)

  registerAboutWindowCreationByIPC()
})
