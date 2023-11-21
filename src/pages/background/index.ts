import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
// import { storeFileEntryId, retrieveAndRestoreFileEntry } from './fileSystemStorageModule';

reloadOnUpdate('pages/background');

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
