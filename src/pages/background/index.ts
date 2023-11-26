import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
// import { storeFileEntryId, retrieveAndRestoreFileEntry } from './fileSystemStorageModule';
import createFFmpegCore from '@ffmpeg/core';
import { FFmpegCoreModule } from '@ffmpeg/types';
import {
  BackgroundFileChunkReceiver,
  BackgroundFileChunkSender,
} from '@root/src/pages/background/BackgroundFileChunkUtil';

// Extract frame number from logs
// function extractCurrentFrame(log: string): number | null {
//   const regex = new RegExp(/frame=\s*(\d+)/);
//   const frameMatch = regex.exec(log)?.[1];
//   if (frameMatch) {
//     return parseInt(frameMatch, 10);
//   }
//   return null;
// }

const init = async () => {
  console.log('init');
  const ffmpeg: FFmpegCoreModule = await createFFmpegCore();
  const fileChunkSender = new BackgroundFileChunkSender();
  // let currentTabId: number = -1;

  const processVideo = async (blob: Blob, fileName: string) => {
    const arrayBufferImage = await blob.arrayBuffer();
    const uint8ArrayImage = new Uint8Array(arrayBufferImage);
    console.log('original uint8ArrayImage', uint8ArrayImage);

    const writeFileResponse = await ffmpeg.FS.writeFile(fileName, uint8ArrayImage);
    console.log('writeFileResponse', writeFileResponse);

    const outputVideoFileName = 'output-video.mp4';
    // -c:v h264_nvenc -preset fast
    await ffmpeg.exec(
      '-i',
      fileName,
      '-vf',
      'scale=1280:-1',
      '-c:v',
      'libx264',
      '-crf',
      '28',
      '-preset',
      'ultrafast',
      '-an',
      outputVideoFileName,
    );

    const output = ffmpeg.FS.readFile(outputVideoFileName, { encoding: 'binary' });
    if (typeof output === 'string') {
      throw new Error('output is string');
    }
    console.log('output', output);
    // Make output into file and put into downloaded file

    console.log('hit after sending file');
    return {
      data: output,
      fileName: outputVideoFileName,
    };
  };

  new BackgroundFileChunkReceiver(async (blob, tabId) => {
    console.log('hit background file receiver');
    if (blob) {
      console.log('has blob');
      const fileExtension = blob.type.split('/')?.[1] || blob.type.split('.')?.[1];
      const fileName = `video.${fileExtension}`;
      const { data: output } = await processVideo(blob, fileName);

      await fileChunkSender.sendFile({ data: output, tabId, fileType: 'video/mp4' });
    }
  });

  ffmpeg.setLogger(log => {
    console.info(log?.message);

    // if (log?.message) {
    //   const frame = extractCurrentFrame(log.message);
    //   chrome.runtime.sendMessage(currentTabId, { type: 'progress', frame });
    // }
  });
};

init();
reloadOnUpdate('pages/background');
