import { BackgroundFileChunkReceiver, BackgroundFileChunkSender } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { NativeMessageTransceiver } from '@root/src/pages/background/NativeMessageTransceiver';
import { NativeMessagingClient } from '@root/src/pages/background/nativeMessageClient';
import { setToken } from '@root/src/pages/background/tokenManager';
import { pingTest, sendFileToServer } from '@root/src/util/file.util';
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
    const fileChunkSender = new BackgroundFileChunkSender();

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

        await pingTest();
      }
    })

    new BackgroundFileChunkReceiver(async (blob, tabId) => {
      console.log('hit background file receiver');

      if (blob) {
        console.log('has blob');
        const fileExtension = blob.type.split('/')?.[1] || blob.type.split('.')?.[1];
        const fileName = `video.${fileExtension}`;
        const file = new File([blob], fileName, { type: blob.type });


        const {file: compressedFile} = await sendFileToServer(file)

        console.log('message sent complete:', compressedFile?.name);

        // convert file to uint8 array
        const compressedFileData = await compressedFile.arrayBuffer()
        const uint8ArrayCompressedFileData = new Uint8Array(compressedFileData);

        await fileChunkSender.sendFile({
          data: uint8ArrayCompressedFileData,
          fileType: compressedFile.type,
          tabId
        });
      }
    });
  } catch (err) {
    console.error('error in background:', err);
  }
};

init();
reloadOnUpdate('pages/background');
