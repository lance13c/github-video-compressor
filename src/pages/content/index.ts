/**
 * DO NOT USE import someModule from '...';
 *
 * @issue-url https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
 *
 * Chrome extensions don't support modules in content scripts.
 * If you want to use other modules in content scripts, you need to import them via these files.
 *
 */

// function createBlob(data) {
//   return new Blob([data], { type: 'video/mp4' }); // Adjust the MIME type if necessary
// }

// function createBlobUrl(blob) {
//   return URL.createObjectURL(blob);
// }

// function downloadVideo(data) {
//   console.log('data', data);
//   const blob = createBlob(data);
//   const url = createBlobUrl(blob);
//   const a = document.createElement('a');

//   a.href = url;
//   a.download = 'compressed_video.mp4'; // Name of the downloaded file
//   document.body.appendChild(a);
//   a.click();

//   // Cleanup: revoke the object URL and remove the anchor element
//   URL.revokeObjectURL(url);
//   a.remove();
// }

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

// const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
// const baseURL_UMD = 'https://unpkg.com/@ffmpeg/core-mt@0.12.4/dist/umd';

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = fileName; // Name of the downloaded file
  document.body.appendChild(a);
  a.click();

  // Cleanup: revoke the object URL and remove the anchor element
  URL.revokeObjectURL(url);
  a.remove();
};

(async () => {
  await import('@pages/content/ui');
  await import('@pages/content/injected');
  const { FileChunkReceiver } = await import('@pages/content/FileChunkReceiver');
  const fileChunkReceiver = new FileChunkReceiver(({ blob, progress }) => {
    console.log('response', blob, progress);
    // Create a fileName based on the file extension

    if (blob) {
      const fileName = `video.${blob.type.split('/')[1]}`;
      console.log('fileName', fileName);
      console.log('downloading blob', blob, progress);
      downloadBlob(blob, fileName);
      console.log('download complete');
    }
  });

  // // Function to add drag-and-drop event listeners to a textarea
  // const addDragAndDropListeners = (textarea: HTMLTextAreaElement) => {
  //   // Prevent the default behavior for dragover
  //   textarea.addEventListener('dragover', (event: DragEvent) => {
  //     event.preventDefault();
  //   });

  //   // Handle the drop event
  //   textarea.addEventListener('drop', (event: DragEvent) => {
  //     event.preventDefault();

  //     // Ensure that dataTransfer is not null
  //     if (event.dataTransfer) {
  //       const files = event.dataTransfer.files;

  //       if (files) {
  //         // Iterate over the files
  //         for (let i = 0; i < files.length; i++) {
  //           const file = files[i];

  //           // Check if the file type is a video
  //           if (file.type.startsWith('video/')) {
  //             console.log('Video file dropped:', file.name);

  //             // Additional handling for the file can be done here
  //           }
  //         }
  //       }
  //     }
  //   });
  // };

  // // Select all textarea elements
  // const textareas = document.querySelectorAll('textarea');

  // // Add drag-and-drop listeners to each textarea
  // textareas.forEach(textarea => addDragAndDropListeners(textarea));

  // // Find all file input elements on the page and add a change listener

  const fileInputs = document.querySelectorAll('input[type=file]');

  fileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('content loaded');
      console.log(e);
      // Ensure the target of the event is an HTMLInputElement
      const target = e.target as HTMLInputElement;

      console.log(target);

      // Check if the target is a file input
      if (target && target.type === 'file') {
        const files = target.files;

        if (files) {
          console.log('files loaded', files);
          // Iterate over the FileList
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check if the file type includes 'video'
            if (file.type.includes('video')) {
              console.log('Video file detected:', file.name);
              // console.log('hit processVideo');

              // convert video to uint8Array and print it out

              file.arrayBuffer().then(ab => {
                const value = new Uint8Array(ab);
                console.log('hit uint8Array');
                console.log(value);
              });

              // console.log(Uint8Array())

              // sendFileToBeCompressed(file)
              //   .then(compressedVideo => {
              //     console.log('finish compressed video');
              //     console.log('compressedVideo', compressedVideo);
              //     // downloadVideo(compressedVideo);
              //   })
              //   .catch(err => {
              //     console.log('err', err);
              //   });
              // Perform further actions here
            }
          }
        }
      }
    });
  });

  // Init setting of the current tab.

  // On tab focus change, update the current tab.

  // Only if the website is github
  if (window.location.href.includes('github')) {
    chrome.runtime.sendMessage({ type: 'initTab' }, response => {
      if (response.success) {
        console.log('initTab success');
      }
    });
  }

  console.log('fileChunkReceiver', fileChunkReceiver);
})();
