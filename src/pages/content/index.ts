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

const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
// const baseURL_UMD = 'https://unpkg.com/@ffmpeg/core-mt@0.12.4/dist/umd';

(async () => {
  await import('@pages/content/ui');
  await import('@pages/content/injected');
  const { FFmpegWorker } = await import('@root/src/pages/content/FFmpeg-ES.js');

  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

  console.log('fetchFile', fetchFile);
  const ffmpeg = new FFmpegWorker();
  // ffmpeg.on('log', ({ type, message }) => {
  //   console.log('type', type);
  //   console.log('message', message);
  // });
  console.log('ffmpeg', ffmpeg);

  // console.log('init');

  // console.log('content loading...');

  debugger;
  const loaded = await ffmpeg.load();

  console.log('loaded?', loaded);

  console.log('content loaded');

  const processVideo = async (file: File) => {
    // Initialize FFmpeg
    console.log('initializing', file);
    if (!ffmpeg?.loaded) {
      throw new Error('ffmpeg not loaded');
      //await ffmpeg.load();
    }
    console.log('done loading');

    // Write the file to FFmpeg's virtual file system
    const tempFile = await fetchFile(file);
    console.log('tempFile', tempFile);
    await ffmpeg.writeFile({ path: 'temp.mov', data: tempFile });

    await ffmpeg.exec({ args: ['-i', 'temp.mov', 'output.mp4'] });

    // .catch(err => {
    //   console.log('err writing file', err);
    // });

    // const didItWork = await ffmpeg.console.log('happen', happen);

    const original = await ffmpeg.readFile({ path: 'temp.mov' });
    const compressed = await ffmpeg.readFile({ path: 'output.mp4' });

    console.log('original', original);
    console.log('compressed', compressed);

    // ffmpeg.writeFile('test.txt', 'Hello world123').catch(err => {
    //   console.log('err writing file', err);
    // });

    // const textTxt = await ffmpeg.readFile('text.txt').catch(err => {
    //   console.log('err reading file', err);
    // });

    // console.log('textTxt', textTxt);

    // const readTempFile = await ffmpeg.readFile('temp.file');
    // console.log('readTempFile', readTempFile);

    // console.log('before run file', file);
    // // Run FFmpeg command to compress the video

    // const output = await ffmpeg.readFile('temp.mov').catch(err => console.error(err));
    // const data = new Uint8Array(output as ArrayBuffer);
    // console.log('output', output);
    // console.log('data buffer', data.buffer);

    // console.log('after run');

    // Read the result
    // const data = await ffmpeg.readFile('output.mp4');
    // console.log('data after read', data);
    // console.log('data.buffer', data.buffer);

    // // Convert the data to a Blob
    // // const compressedFile = new Blob([data.buffer], { type: 'video/mp4' });
    // const compressedFile = new Blob([data?.buffer], { type: 'video/mp4' });

    // return data.buffer;
  };

  if (!(chrome && chrome.runtime && chrome.runtime.sendMessage)) {
    throw new Error('chrome.runtime.sendMessage is not available.');
  }

  // console.log('ffmpegModule:', ffmpegModule);
  // console.log('test2', test2);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const sendFileToBeCompressed = (file: File) => {
    console.log('chrome', chrome.runtime.sendMessage);
    // Make into promise
    console.log('before sending file');
    console.log('chrome', chrome);
    console.log('file', file);
    try {
      return processVideo(file)
        .then(response => {
          console.log('response', response);
          return response;
        })
        .catch(err => console.error(err));
    } catch (error) {
      console.log('error', error);
    }
  };

  // Function to add drag-and-drop event listeners to a textarea
  const addDragAndDropListeners = (textarea: HTMLTextAreaElement) => {
    // Prevent the default behavior for dragover
    textarea.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
    });

    // Handle the drop event
    textarea.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();

      // Ensure that dataTransfer is not null
      if (event.dataTransfer) {
        const files = event.dataTransfer.files;

        if (files) {
          // Iterate over the files
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check if the file type is a video
            if (file.type.startsWith('video/')) {
              console.log('Video file dropped:', file.name);

              // Additional handling for the file can be done here
            }
          }
        }
      }
    });
  };

  // Select all textarea elements
  const textareas = document.querySelectorAll('textarea');

  // Add drag-and-drop listeners to each textarea
  textareas.forEach(textarea => addDragAndDropListeners(textarea));

  // Find all file input elements on the page and add a change listener

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
              console.log('hit processVideo');
              sendFileToBeCompressed(file)
                .then(compressedVideo => {
                  console.log('finish compressed video');
                  console.log('compressedVideo', compressedVideo);
                  // downloadVideo(compressedVideo);
                })
                .catch(err => {
                  console.log('err', err);
                });

              // Perform further actions here
            }
          }
        }
      }
    });
  });
})();
