import { app } from 'electron';


import { sendDebugMessage } from 'main/dev_websockets';
import { NativeMessagingHost } from '../shared/utils/nativeMessagingHost';
import { makeAppWithSingleInstanceLock } from './factories';
import { registerAboutWindowCreationByIPC } from './windows';





makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  try {
    // console.log('ad--------------------------f', tempIcon)
    const nativeMessagingHost = new NativeMessagingHost();

    nativeMessagingHost.addListener((data) => {
      sendDebugMessage('nativeMessagingHostData', data.toString());
    });

    // process.stdin.on('data', (data) => {
    //   sendDebugMessage('stdinData', data.toString());
    //   // Rest of your onDataReceived logic
    // });

    // console.log(JSON.stringify({test: '123abc'}))
    nativeMessagingHost.sendMessage({ text: 'Init ping' });
    let count = 1;
    const sendInterval = setInterval(() => {
      sendDebugMessage('info', `ping-${count}`);
      nativeMessagingHost.sendMessage({ text: `v3-ping-${count}` });
      // // SEnd this in stdin  { text: `console-${count}` }
      // const message = Buffer.from(JSON.stringify({ text: `console-${count}` }));
      // process.stdout.write(message);
      // console.log('test-ping')
      count += 1;
    }, 4000);

    process.stdin.on('end', () => {
      console.log('stdin closed, shutting down Electron app');
      sendDebugMessage('info', 'stdin closed, shutting down Electron app');
      clearInterval(sendInterval);
      app.quit();
    });

    registerAboutWindowCreationByIPC();
  } catch (e) {
    console.error('app error:', e);
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown');
  }
});
