import FakeWorker from '@root/src/pages/content/FakeWorker';
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
globalThis.Worker = FakeWorker;

console.log('Worker', Worker);

const init = async () => {
  // Message

  chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name === 'file-connection');

    port.onMessage.addListener(function (msg) {
      console.log('new message');
      console.log(msg);
    });

    // Use the port for communication
  });

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
