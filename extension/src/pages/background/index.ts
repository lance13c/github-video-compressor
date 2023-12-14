import { BackgroundFileChunkReceiver } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { NativeMessagingClient } from '@root/src/pages/background/nativeMessageClient';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

const init = async () => {
  console.log('init');
  console.log('window.navigator.hardwareConcurrency', globalThis.navigator.hardwareConcurrency);
  try {
    const nativeMessageClient = new NativeMessagingClient('com.dominic_cicilio.github_video_compressor');
    // nativeMessageClient.addListener(message => {
    //   console.log('testAddListener message: ', message);
    // });

    // nativeMessageClient.sendMessage({ test: '1' });
    // nativeMessageClient.sendMessage({ test: '1' });
    // nativeMessageClient.sendMessage({ test: '1' });
    // nativeMessageClient.sendMessage({ test: '1' });
    // nativeMessageClient.sendMessage({ test: 'test456' });
    let count = 0;
    setInterval(() => {
      nativeMessageClient.sendMessage({ test: `message from extension ${count}` });
      count += 1;
    }, 4000);
    

    new BackgroundFileChunkReceiver(async blob => {
      console.log('hit background file receiver');

      if (blob) {
        console.log('has blob');
        const fileExtension = blob.type.split('/')?.[1] || blob.type.split('.')?.[1];
        const fileName = `video.${fileExtension}`;

        // console.log('background file name', fileName)
        // nativeMessageClient.sendMessage('fileName:' + fileName);

        console.log('message sent complete');

        // await fileChunkSender.sendFile({ data: output, tabId, fileType: 'video/mp4' });
      }
    });
  } catch (err) {
    console.error('error in background:', err);
  }
};

init();
reloadOnUpdate('pages/background');
