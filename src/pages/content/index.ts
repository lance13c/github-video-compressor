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

function getCookies(domain, callback) {
  chrome.cookies.getAll({ domain: domain }, function (cookies) {
    callback(cookies);
  });
}

(async () => {
  await import('@pages/content/ui');
  await import('@pages/content/injected');
  const { FileChunkReceiver, FileChunkSender } = await import('@root/src/pages/content/ContentFileChunkUtil');
  const sender = new FileChunkSender();
  const fileInputElement: HTMLInputElement | null = null;

  new FileChunkReceiver(({ blob, progress }) => {
    console.log('response', blob, progress);
    // Create a fileName based on the file extension

    if (blob) {
      const fileName = `video.${blob.type.split('/')[1]}`;
      console.log('fileName', fileName);
      console.log('downloading blob', blob, progress);

      downloadBlob(blob, fileName);
      // fileInputElement.add;
      console.log('download complete');
    }
  });

  // Send file to background.js to be compressed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendFileToBeCompressed = (file: File, options: Record<string, string> = {}) => {
    console.log('hit compress', file);
    try {
      return sender.sendFile(file);
    } catch (err) {
      console.error(err);
    }
  };

  // // Function to add drag-and-drop event listeners to a textarea
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

  const fileInputs = document.querySelectorAll('input[type=file]');
  // > 100Mb
  const TRIGGER_SIZE = 99 * 1024 * 1024;

  fileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target || target?.type !== 'file') {
        return;
      }

      if (target && target.type === 'file') {
        const files = target.files;

        console.log('files loaded', files);
        // Iterate over the FileList
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          console.log('file size', file.size);
          getCookies('github.com', cookies => {
            console.log('cookies', cookies);
            // const formData = new FormData();
            // formData.append('name', file.name);
            // formData.append('size', `${file.size}`);
            // formData.append('content_type', file.type);
            // formData.append('authenticity_token', 'COMePYvq-SRWtIaT4dNupSlsIrytAndPo2EGHw1z0q-hINsqIKQHO2KUhzWOKdOcH6eNO92vOAHXmXi9gRUarg');
            // formData.append('repository_id', '720251838');
          });
          // if (file.size > TRIGGER_SIZE) {
          // e.stopPropagation();
          // e.preventDefault();
          // fileInputElement = e.target as HTMLInputElement;

          // Check if the file type includes 'video'
          // if (file.type.includes('video')) {
          //   sendFileToBeCompressed(file)
          //     .then(response => {
          //       console.log('finish compressed video', response);
          //     })
          //     .catch(err => {
          //       console.log('err', err);
          //     });
          // }
          // }
        }
      }
    });
  });
})();
