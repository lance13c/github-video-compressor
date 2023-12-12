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

    // nativeMessagingHost.sendMessage({ text: 'ping start 456' });
    let count = 1;
    // const sendInterval = setInterval(() => {
    //   nativeMessagingHost.sendMessage({ text: `v3-ping-${count}` });
    //   count += 1;
    // }, 6000);

    process.stdin.on('end', () => {
      console.log('stdin closed, shutting down Electron app');
      // clearInterval(sendInterval);
      app.quit();
    });

    registerAboutWindowCreationByIPC();
  } catch (e) {
    console.error('app error:', e);
  }
});
