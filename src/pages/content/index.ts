/**
 * DO NOT USE import someModule from '...';
 *
 * @issue-url https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
 *
 * Chrome extensions don't support modules in content scripts.
 * If you want to use other modules in content scripts, you need to import them via these files.
 *
 */

function createBlob(data) {
  return new Blob([data], { type: 'video/mp4' }); // Adjust the MIME type if necessary
}

function createBlobUrl(blob) {
  return URL.createObjectURL(blob);
}

function downloadVideo(data) {
  console.log('data', data);
  const blob = createBlob(data);
  const url = createBlobUrl(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'compressed_video.mp4'; // Name of the downloaded file
  document.body.appendChild(a);
  a.click();

  // Cleanup: revoke the object URL and remove the anchor element
  URL.revokeObjectURL(url);
  a.remove();
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function arrayBufferToBlob(arrayBuffer, mimeType) {
  return new Blob([arrayBuffer], { type: mimeType });
}

function blobToFile(blob, fileName) {
  return new File([blob], fileName, { type: blob.type });
}

function arrayBufferToFile(arrayBuffer, fileName, mimeType) {
  const blob = arrayBufferToBlob(arrayBuffer, mimeType);
  return blobToFile(blob, fileName);
}

const init = async () => {
  await import('@pages/content/ui');
  await import('@pages/content/injected');

  if (!(chrome && chrome.runtime && chrome.runtime.sendMessage)) {
    throw new Error('chrome.runtime.sendMessage is not available.');
  }

  // console.log('ffmpegModule:', ffmpegModule);
  // console.log('test2', test2);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const sendFileToBeCompressed = (file: File) => {
    console.log('chrome', chrome.runtime.sendMessage);
    // Make into promise
    return new Promise((resolve, reject) => {
      // Send message to background script
      console.log('before sending file');
      console.log('chrome', chrome);
      console.log('file', file);

      // console.log('arrayBuffer', arrayBuffer);
      // const blob = arrayBufferToBlob(arrayBuffer, 'video/mp4');
      // const reader = new FileReader(file, 'utf8');

      const port = chrome.runtime.connect({ name: 'file-connection' });

      port.postMessage({ fileName: file.name, file });

      port.onMessage.addListener(response => {
        console.log('response', response);
        resolve(response);
      });

      //   chrome?.runtime?.sendMessage?.({ action: 'processVideo', fileName: file.name }, response => {
      //     const arrayBuffer = response;
      //     const mimeType = 'video/mp4'; // Replace with the actual MIME type
      //     const fileName = 'output.mp4'; // Replace with the desired file name

      //     console.log('response', response);

      //     const file = arrayBufferToFile(arrayBuffer, fileName, mimeType);
      //     if (response) {
      //       resolve(file);
      //     } else {
      //       reject(response);
      //     }
      //   });
      // });
      return true;
    });
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
                  downloadVideo(compressedVideo);
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
};

init();
