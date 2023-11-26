import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
// import { storeFileEntryId, retrieveAndRestoreFileEntry } from './fileSystemStorageModule';
import createFFmpegCore from '@ffmpeg/core';
import { FFmpegCoreModule } from '@ffmpeg/types';
import {
  BackgroundFileChunkReceiver,
  BackgroundFileChunkSender,
} from '@root/src/pages/background/BackgroundFileChunkUtil';

const init = async () => {
  console.log('init');
  const ffmpeg: FFmpegCoreModule = await createFFmpegCore();
  const fileChunkSender = new BackgroundFileChunkSender();

  const processVideo = async (blob: Blob, fileName: string) => {
    // const writeFileResponse = await ffmpeg.FS.writeFile('hello.mp4', uint8Array);
    // console.log('writeFileResponse', writeFileResponse);

    // get uint8Array for /dist/icon-128.png

    const arrayBufferImage = await blob.arrayBuffer();
    const uint8ArrayImage = new Uint8Array(arrayBufferImage);
    console.log('original uint8ArrayImage', uint8ArrayImage);

    const writeFileResponse = await ffmpeg.FS.writeFile(fileName, uint8ArrayImage);
    console.log('writeFileResponse', writeFileResponse);

    console.log('before directory', ffmpeg.FS.readdir('/')); // List files in the root directory
    // console.log('before tmp', ffmpeg.FS.readdir('/tmp')); // List files in the root directory
    // console.log('before dev', ffmpeg.FS.readdir('/dev')); // List files in the root directory
    // console.log('before proc', ffmpeg.FS.readdir('/proc')); // List files in the root directory

    // Compress the hello.mov file to a .mp4 file, then print the file size
    const outputVideoFileName = 'output-video.mp4';
    // const value = await ffmpeg.exec('-i', fileName, '-b:v', '2000k', '-b:a', '96k', outputVideoFileName);
    // -c:v h264_nvenc -preset fast
    const value = await ffmpeg.exec(
      '-i',
      fileName,
      '-vf',
      'scale=1280:-1',
      '-c:v',
      'libx264',
      '-crf',
      '26',
      '-preset',
      'ultrafast',
      '-an',
      outputVideoFileName,
    );

    // const value = await ffmpeg.exec('-i', 'hello.mp4', '-vcodec', 'libx264', '-acodec', 'aac', 'output.mp4');
    console.log('value', value);

    console.log('after directory', ffmpeg.FS.readdir('/')); // List files in the root directory
    // console.log('after tmp', ffmpeg.FS.readdir('/tmp')); // List files in the root directory
    // console.log('after dev', ffmpeg.FS.readdir('/dev')); // List files in the root directory
    // console.log('after proc', ffmpeg.FS.readdir('/proc')); // List files in the root directory

    try {
      const version = await ffmpeg.exec('-version');
      console.log('FFmpeg Version:', version);
    } catch (error) {
      console.error('Error executing FFmpeg:', error);
    }

    // await ffmpeg.exec('-i', 'hello.mov', 'output.mp4');
    const output = ffmpeg.FS.readFile(outputVideoFileName, { encoding: 'binary' });
    if (typeof output === 'string') {
      throw new Error('output is string');
    }
    console.log('output', output);
    // Make output into file and put into downloaded file

    // console.log('output length', output.length);
    console.log('hit after');

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
  });
};

init();
reloadOnUpdate('pages/background');
