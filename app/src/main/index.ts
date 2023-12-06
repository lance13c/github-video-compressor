import { app } from 'electron';

import { NativeMessagingHost } from '../shared/utils/nativeMessagingHost';
import { makeAppWithSingleInstanceLock } from './factories';
import { registerAboutWindowCreationByIPC } from './windows';

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  try {
    // console.log('ad--------------------------f', tempIcon)

    // const icon = await nativeImage.createThumbnailFromPath(tempIcon, {
    //   width: 22,
    //   height: 22,
    // })

    // const tray = new Tray('../resources/public/icon-128.png')
    // const contextMenu = Menu.buildFromTemplate([
    //   { label: 'Item1', type: 'radio' },
    //   { label: 'Item2', type: 'radio' },
    //   { label: 'Item3', type: 'radio', checked: true },
    //   { label: 'Item4', type: 'radio' },
    // ])
    // tray.setToolTip('Github Compressor')
    // tray.setContextMenu(contextMenu)

    const nativeMessagingHost = new NativeMessagingHost();
    // Hello World

    // const message = new TextEncoder().encode()
    nativeMessagingHost.sendMessage({ text: '---ping---3333' });
    setInterval(() => {
      nativeMessagingHost.sendMessage({ text: '---ping---doe-ray-me-fa' });
    }, 3500);

    registerAboutWindowCreationByIPC();
  } catch (e) {
    console.error('app error:', e);
  }
});
