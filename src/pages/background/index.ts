import { BackgroundFileChunkReceiver } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { NativeMessagingClient } from '@root/src/pages/background/nativeMessageClient';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';

const init = async () => {
  console.log('init');
  console.log('window.navigator.hardwareConcurrency', globalThis.navigator.hardwareConcurrency);
  const nativeMessageClient = new NativeMessagingClient('com.dominic_cicilio.github_video_compressor');
  //  nativeMessageClient.addListener((message) => {
  //     console.log('testAddListener message: ', message);
  //   });

  // setInterval(() => {
  //   nativeMessageClient.sendMessage('ping from extension');
  // }, 5000);

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
};

init();
reloadOnUpdate('pages/background');
