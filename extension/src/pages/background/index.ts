import { BackgroundFileChunkReceiver } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { NativeMessageTransceiver } from '@root/src/pages/background/NativeMessageTranceiver';
import { NativeMessagingClient } from '@root/src/pages/background/nativeMessageClient';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

const init = async () => {
  console.log('init');
  console.log('window.navigator.hardwareConcurrency', globalThis.navigator.hardwareConcurrency);
  try {
    const nativeMessageClient = new NativeMessagingClient('com.dominic_cicilio.github_video_compressor');
    const nativeMessageTransceiver = new NativeMessageTransceiver({
      chunkSizeIn: 1024,
      chunkSizeOut: 1024,
    });

    const dataStream = nativeMessageTransceiver.createDataStream(nativeMessageClient.addListener)

    dataStream.onProgress((progress, total) => {
      console.log('extension progress', progress, total);
    })

    dataStream.onComplete((message) => {
      console.log('extension complete', message);
    })

    new BackgroundFileChunkReceiver(async blob => {
      console.log('hit background file receiver');

      if (blob) {
        console.log('has blob');
        const fileExtension = blob.type.split('/')?.[1] || blob.type.split('.')?.[1];
        const fileName = `video.${fileExtension}`;

        // console.log('background file name', fileName)
        nativeMessageClient.sendMessage({
          progress: 1,
          type: 'text',
          data: 'fileName:' + fileName
        });

        const fileAsUint8 = new Uint8Array((await blob.arrayBuffer()));

        nativeMessageTransceiver.send(fileAsUint8, 'video/mp4', (message) => {
          console.log('sending data', message);
          nativeMessageClient.sendMessage(message);
        })

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
