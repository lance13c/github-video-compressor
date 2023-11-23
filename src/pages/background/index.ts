import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
// import { storeFileEntryId, retrieveAndRestoreFileEntry } from './fileSystemStorageModule';
import createFFmpegCore from '@ffmpeg/core';
import { FFmpegCoreModule } from '@ffmpeg/types';
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

// Overrides WebWorker interface with fake worker that runs in the main thread.
// @ts-expect-error -- globalThis is defined
// globalThis.Worker = MockWebWorker;

// console.log('Worker2', Worker);

// const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';

const init = async () => {
  console.log('init');
  const ffmpeg: FFmpegCoreModule = await createFFmpegCore();
  console.log('ffmpeg', ffmpeg);

  ffmpeg.setLogger(log => {
    console.info('log', log);
  });

  // const writeFileResponse = await ffmpeg.FS.writeFile('hello.txt', 'Hello world!');
  // console.log('writeFileResponse', writeFileResponse);

  // const response = await ffmpeg.FS.readFile('hello.txt', { encoding: 'utf8' });
  // console.log('response', response);
  const arrayBuffer = new ArrayBuffer(8000);
  const uint8Array = new Uint8Array(arrayBuffer);
  console.log('original uint8Array', uint8Array.length);

  const writeFileResponse = await ffmpeg.FS.writeFile('hello.mp4', uint8Array);
  console.log('writeFileResponse', writeFileResponse);

  console.log('before directory', ffmpeg.FS.readdir('/')); // List files in the root directory
  console.log('before tmp', ffmpeg.FS.readdir('/tmp')); // List files in the root directory
  console.log('before dev', ffmpeg.FS.readdir('/dev')); // List files in the root directory
  console.log('before proc', ffmpeg.FS.readdir('/proc')); // List files in the root directory

  // Compress the hello.mov file to a .mp4 file, then print the file size
  const value = await ffmpeg.exec('-i', 'hello.mp4', '-vcodec', 'libx264', '-acodec', 'aac', 'output.mp4');
  console.log('value', value);

  console.log('after directory', ffmpeg.FS.readdir('/')); // List files in the root directory
  console.log('after tmp', ffmpeg.FS.readdir('/tmp')); // List files in the root directory
  console.log('after dev', ffmpeg.FS.readdir('/dev')); // List files in the root directory
  console.log('after proc', ffmpeg.FS.readdir('/proc')); // List files in the root directory

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
  // const output = ffmpeg.FS.readFile('output.mp4', { encoding: 'binary' });
  // console.log('output', output);
  // console.log('output length', output.length);
  console.log('hit after');

  // const response = await ffmpeg.FS.readFile('hello.mov', { encoding: 'utf8' });
  // console.log('response', response);

  //   // Message
  //   console.log('init start');
  //   const ffmpeg = new FFmpeg();
  //   ffmpeg.on('log', function (mes) {
  //     console.log('message:', mes);
  //   });
  //   console.log('loading...');
  //   const loaded = await ffmpeg.load({
  //     // coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
  //     // wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  //   });
  //   console.log('loaded', loaded);
  //   const processVideo = async (file: File) => {
  //     // Initialize FFmpeg
  //     console.log('initializing', file);
  //     if (!ffmpeg.loaded) {
  //       throw new Error('ffmpeg not loaded');
  //       //await ffmpeg.load();
  //     }
  //     console.log('done loading');
  //     // Write the file to FFmpeg's virtual file system
  //     const tempFile = await fetchFile(file);
  //     console.log('tempFile', tempFile);
  //     await ffmpeg.writeFile('temp.mp4', tempFile).catch(err => {
  //       console.log('err writing file', err);
  //     });
  //     const output = await ffmpeg.readFile('temp.mp4').catch(err => console.error(err));
  //     const data = new Uint8Array(output as ArrayBuffer);
  //     console.log('output', output);
  //     console.log('data buffer', data.buffer);
  //     return data.buffer;
  //   };
  //   // Create a fake .mov file
  //   const arrayBuffer = new ArrayBuffer(8000);
  //   const dataView = new DataView(arrayBuffer);
  //   for (let i = 0; i < 8000; i++) {
  //     dataView.setUint8(i, i % 256);
  //   }
  //   const mimeType = 'video/mp4'; // Replace with the actual MIME type
  //   const fileName = 'video.mp4'; // Replace with the desired file name
  //   const file = new File([arrayBuffer], fileName, { type: mimeType });
  //   await processVideo(file);
  //   console.log('finished');
  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //   console.log('message sender', sender);
  //   if (request.action === 'processVideo') {
  //     // Process the video file with FFmpeg
  //     // ...
  //     console.log('processing video...');
  //     console.log('request', request);
  //     const arrayBuffer = request?.arrayBuffer;
  //     const mimeType = 'video/mp4'; // Replace with the actual MIME type
  //     const fileName = 'video.mp4'; // Replace with the desired file name
  //     const file = arrayBufferToFile(arrayBuffer, fileName, mimeType);
  //     console.log('file', file);
  //     processVideo(file)
  //       .then(processedData => {
  //         console.log('done processing video');
  //         sendResponse({ status: 'Processed', data: processedData });
  //       })
  //       .catch(error => {
  //         console.log('error processing video', error);
  //         sendResponse({ status: 'Error', data: error });
  //       });
  //     // Send the processed file back
  //   }
  //   return true;
  // });
};

init();
reloadOnUpdate('pages/background');
