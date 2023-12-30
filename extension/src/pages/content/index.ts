// const downloadBlob = (blob: Blob, fileName: string) => {
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');


//   a.href = url;
//   a.download = fileName; // Name of the downloaded file
//   document.body.appendChild(a);
//   a.click();

//   // Cleanup: revoke the object URL and remove the anchor element
//   URL.revokeObjectURL(url);
//   a.remove();
// };

function injectMarkdownLink(textArea: HTMLTextAreaElement, name: string, href: string): void {
  const markdownLink = `\n\n[${name}](${href})\n\n`;

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

const getRepositoryId = () => {

  // @ts-expect-error -- document is valid repository id
  const repository_id = document
    .querySelector('meta[name="octolytics-dimension-repository_id"]')
    ?.getAttribute('content');
  if (!repository_id) {
    throw new Error('repository_id not found');
  }

  return repository_id;
}

const getAuthenticityToken = () => {
  // @ts-expect-error -- document is valid repository id
  const authenticity_token = document.querySelector('.js-data-upload-policy-url-csrf')?.getAttribute('value');
  if (!authenticity_token) {
    throw new Error('authenticity_token not found');
  }

  return authenticity_token;
}

(async () => {
  await import('@pages/content/ui');
  await import('@pages/content/injected');
  const { FileChunkReceiver, FileChunkSender } = await import('@root/src/pages/content/ContentFileChunkUtil')
  const { GithubUploader } = await import('@root/src/pages/background/GithubUploader');
  const githubUploader = new GithubUploader();
  const sender = new FileChunkSender();
  let textAreaElement: HTMLTextAreaElement;

  

  // Send file to background.js to be compressed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendFileToBeCompressed = async (file: File, options: Record<string, string> = {}) => {
    console.log('hit compress', file);
    try {
      return sender.sendFile(file);
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  new FileChunkReceiver(({ blob, progress }) => {
    console.log('response', blob, progress);

    if (blob) {
      const fileName = `video.${blob.type.split('/')[1]}`;
      const file = new File([blob], fileName, { type: blob.type });
      console.log('fileName', fileName);

      const repository_id = getRepositoryId();
      const authenticity_token = getAuthenticityToken();

      githubUploader
        .startImageUpload({
          imageName: file.name,
          imageSize: file.size,
          authenticity_token,
          content_type: file.type,
          repository_id,
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

          if (!textAreaElement) {
            window.alert(
              `The github compression extension does not know where to place the file. Please copy and paste the following link into the textarea instead.\n\nLink: [${file.name}](${imageResponse.href})`,
            );
            throw new Error('textAreaElement not found');
          }

          injectMarkdownLink(textAreaElement, file.name, imageResponse.href);
          console.debug('success');
        });
    }
  });


// Inject the responding image into the correct textarea element.
// This would be easiest if done with await messages, so the textarea is grabbed local to the element.

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
  console.log("fileInputs", fileInputs);
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
        textAreaElement = document.querySelector(`.js-upload-markdown-image textarea`) as HTMLTextAreaElement;
        // console.log('textArea', textAreaElement);

        if (!textAreaElement) {
          throw new Error('textAreaElement not found');
        }

        const files = target.files as unknown as File[];

        // Iterate over the FileList
        for (const file in files) {
          if (file.type)
          // const file = files[i];
          // if (file.size > TRIGGER_SIZE) {
          e.stopPropagation();
          e.preventDefault();

          // Check if the file type includes 'video'
          if (file.type.includes('video')) {
            e.stopPropagation();
            e.preventDefault();

            sendFileToBeCompressed(file)
              .then(() => {
                console.log('finish compressed video');
              })
              .catch(err => {
                console.log('err', err);
              });
          }
        }
      }
    });
  });
})();


// 1. Sync text areas with the file to upload
// 2. Send file type information, so the correct file type is saved.

// Sending a file could be async, currently it is not. 
// It would make it easier if the function could be pure.
