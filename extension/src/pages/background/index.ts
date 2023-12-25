import { BackgroundFileChunkReceiver } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { NativeMessageTransceiver } from '@root/src/pages/background/NativeMessageTransceiver';
import { NativeMessagingClient } from '@root/src/pages/background/nativeMessageClient';
import { setToken } from '@root/src/pages/background/tokenManager';
import { sendFileToServer } from '@root/src/util/file.util';
// import { sendFileToServer } from '@root/src/util/file.util';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

const init = async () => {
  console.log('init');
  console.log('window.navigator.hardwareConcurrency', globalThis.navigator.hardwareConcurrency);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  try {
    const nativeMessageClient = new NativeMessagingClient('com.dominic_cicilio.github_video_compressor');
    const nativeMessageTransceiver = new NativeMessageTransceiver({
      chunkSizeOut: 512,
    });

    const dataStream = nativeMessageTransceiver.createDataStream(nativeMessageClient.addListener)

    dataStream.onProgress((progress, total) => {
      console.log('extension progress', progress, total);
    })

    dataStream.onComplete(async (message) => {
      console.log('extension complete', message);
      if (message.type === 'connection') {
        const token = message.data;
        console.log('info', `Received token ${token}`);
        setToken(token);
      }
    })

    new BackgroundFileChunkReceiver(async blob => {
      console.log('hit background file receiver');

      if (blob) {
        console.log('has blob');
        const fileExtension = blob.type.split('/')?.[1] || blob.type.split('.')?.[1];
        const fileName = `video.${fileExtension}`;
        const file = new File([blob], fileName, { type: blob.type });

        // console.log('background file name', fileName)
        // nativeMessageClient.sendMessage({
        //   progress: 1,
        //   type: 'text',
        //   data: 'fileName:' + fileName
        // });

        // const fileAsUint8 = new Uint8Array((await blob.arrayBuffer()));

        // nativeMessageTransceiver.send(fileAsUint8, 'video/mp4', async (message) => {
        //   console.log('sending data', message);
        //   console.log('byte length',new Blob([JSON.stringify(message)]).size);
        //   nativeMessageClient.sendMessage(message);
        // }, 0)

        await sendFileToServer(file)

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
