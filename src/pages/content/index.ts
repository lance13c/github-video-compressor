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

function injectMarkdownLink(textArea: HTMLTextAreaElement, name: string, href: string): void {
  const markdownLink = `[${name}](${href})`;

  // Check if the browser supports `selectionStart` and `selectionEnd`
  if ('selectionStart' in textArea && 'selectionEnd' in textArea) {
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;
    const beforeText = textArea.value.substring(0, startPos);
    const afterText = textArea.value.substring(endPos);

    // Insert the markdown link where the cursor is, or at the end if no selection
    textArea.value = beforeText + markdownLink + afterText;

    // Move the cursor to the end of the new link
    textArea.selectionStart = textArea.selectionEnd = startPos + markdownLink.length;
  } else {
    // For older browsers, just append at the end
    // @ts-expect-error -- for older browsers
    textArea.value += markdownLink;
  }

  // Optionally, focus the textarea
  textArea.focus();
}

(async () => {
  await import('@pages/content/ui');
  await import('@pages/content/injected');
  const { FileChunkReceiver, FileChunkSender } = await import('@root/src/pages/content/ContentFileChunkUtil');
  const { GithubUploader } = await import('@root/src/pages/background/GithubUploader');
  const sender = new FileChunkSender();

  const authenticity_token = document.querySelector('.js-data-upload-policy-url-csrf')?.getAttribute('value');
  if (!authenticity_token) {
    throw new Error('authenticity_token not found');
  }

  const repository_id = document
    .querySelector('meta[name="octolytics-dimension-repository_id"]')
    ?.getAttribute('content');
  if (!repository_id) {
    throw new Error('repository_id not found');
  }

  // octolytics-dimension-repository_id -> element id to get the repository id

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

  const fileInputs = document.querySelectorAll('input[type=file]');
  // > 100Mb
  // const TRIGGER_SIZE = 99 * 1024 * 1024;

  fileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;

      if (!target || target?.type !== 'file') {
        return;
      }

      if (target && target.type === 'file') {
        // const fileAttachmentInputName = (e.target as HTMLInputElement).getAttribute('id');
        const textAreaElement = document.querySelector(`.js-upload-markdown-image textarea`) as HTMLTextAreaElement;
        // console.log('textArea', textAreaElement);

        if (!textAreaElement) {
          throw new Error('textAreaElement not found');
        }

        const files = target.files;

        console.log('files loaded', files);
        // Iterate over the FileList
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // if (file.size > TRIGGER_SIZE) {
          e.stopPropagation();
          e.preventDefault();

          // Check if the file type includes 'video'
          if (file.type.includes('video')) {
            const githubUploader = new GithubUploader();
            e.stopPropagation();
            e.preventDefault();
            // debugger;
            githubUploader
              .startImageUpload({
                imageName: file.name,
                imageSize: file.size,
                authenticity_token,
                content_type: file.type,
                repository_id: '720251838',
                file,
                imageUploadCompleteCallback: () => {
                  console.log('Upload complete');
                },
              })
              .then(imageResponse => {
                console.log('imageResponse', imageResponse);
                if (!imageResponse) {
                  throw new Error('imageResponse is invalid');
                }

                injectMarkdownLink(textAreaElement, file.name, imageResponse.href);
              });
          }
          // sendFileToBeCompressed(file)
          //   .then(response => {
          //     console.log('finish compressed video', response);
          //   })
          //   .catch(err => {
          //     console.log('err', err);
          //   });
          // }
        }
      }
    });
  });
})();
