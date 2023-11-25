import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
// import { storeFileEntryId, retrieveAndRestoreFileEntry } from './fileSystemStorageModule';
import createFFmpegCore from '@ffmpeg/core';
import { FFmpegCoreModule } from '@ffmpeg/types';
import { FileChunkSender } from '@root/src/pages/background/FileChunkSender';
// function readFileAsArrayBuffer(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = () => reject(reader.error);
//     reader.readAsArrayBuffer(file);
//   });
// }

// function arrayBufferToBlob(arrayBuffer, mimeType) {
//   return new Blob([arrayBuffer], { type: mimeType });
// }

// function blobToFile(blob, fileName) {
//   return new File([blob], fileName, { type: blob.type });
// }

// function arrayBufferToFile(arrayBuffer, fileName, mimeType) {
//   const blob = arrayBufferToBlob(arrayBuffer, mimeType);
//   return blobToFile(blob, fileName);
// }

const init = async () => {
  console.log('init');
  const ffmpeg: FFmpegCoreModule = await createFFmpegCore();
  let currentTabId = -1;
  const fileChunkSender = new FileChunkSender();

  console.log('ffmpeg', ffmpeg);

  ffmpeg.setLogger(log => {
    console.info(log?.message);
  });

  const processVideo = async () => {
    // const writeFileResponse = await ffmpeg.FS.writeFile('hello.mp4', uint8Array);
    // console.log('writeFileResponse', writeFileResponse);

    // get uint8Array for /dist/icon-128.png
    const response = await fetch('https://samplelib.com/lib/preview/mp4/sample-5s.mp4');
    // const response = await fetch('https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_480_1_5MG.mp4');
    console.log('response', response);
    const blob = await response.blob();
    const arrayBufferImage = await blob.arrayBuffer();
    const uint8ArrayImage = new Uint8Array(arrayBufferImage);
    console.log('original uint8ArrayImage', uint8ArrayImage);

    const writeFileResponse = await ffmpeg.FS.writeFile('input.mp4', uint8ArrayImage);
    console.log('writeFileResponse', writeFileResponse);

    console.log('before directory', ffmpeg.FS.readdir('/')); // List files in the root directory
    // console.log('before tmp', ffmpeg.FS.readdir('/tmp')); // List files in the root directory
    // console.log('before dev', ffmpeg.FS.readdir('/dev')); // List files in the root directory
    // console.log('before proc', ffmpeg.FS.readdir('/proc')); // List files in the root directory

    // Compress the hello.mov file to a .mp4 file, then print the file size
    const value = await ffmpeg.exec('-i', 'input.mp4', 'output.avi');

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
    // try {
    //   const codecs = await ffmpeg.exec('-codecs');
    //   console.log('FFmpeg codecs:', codecs);
    // } catch (error) {
    //   console.error('Error executing FFmpeg codecs:', error);
    // }

    // await ffmpeg.exec('-i', 'hello.mov', 'output.mp4');
    const output = ffmpeg.FS.readFile('output.avi', { encoding: 'binary' });
    console.log('output', output);
    // Make output into file and put into downloaded file
    const blobOutput = new Blob([output], { type: 'video/avi' });

    // console.log('output length', output.length);
    console.log('hit after');

    await fileChunkSender.sendFile({ blob: blobOutput, tabId: currentTabId });

    console.log('hit after sending file');
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'initTab') {
      console.log('hit init');
      currentTabId = sender.tab.id;
      sendResponse({ success: true });
      processVideo();

      return;
    }
  });
};

init();
reloadOnUpdate('pages/background');
