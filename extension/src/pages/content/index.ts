const PADDING = 6
function showSpinnerAtText(textArea: HTMLTextAreaElement, searchText: string): void {
  const spinner = document.createElement('div')
  spinner.classList.add('gvc-spinner')
  document.body.appendChild(spinner)

  // Calculate the position
  const index = textArea.value.indexOf(searchText)
  if (index !== -1) {
    spinner.style.display = 'block'
    spinner.style.position = 'absolute'
    const rect = textArea.getBoundingClientRect()
    spinner.style.left = `${rect.left + window.scrollX + PADDING}px`
    spinner.style.top = `${rect.top + window.scrollY + PADDING}px`
  }
}

function displayLoadingWithSpinner(textArea: HTMLTextAreaElement, loadingText: string = 'Loading'): void {
  const loadingIndicator = `\n\n${loadingText}...\n\n`
  const currentPos = textArea.selectionStart || textArea.value.length
  textArea.value = textArea.value.substring(0, currentPos) + loadingIndicator + textArea.value.substring(currentPos)
  textArea.selectionStart = textArea.selectionEnd = currentPos + loadingIndicator.length
  textArea.focus()

  showSpinnerAtText(textArea, `${loadingText}...`)
}

function updateLoadingText(textArea: HTMLTextAreaElement, currentLoadingText: string, newLoadingText: string): void {
  const currentLoadingIndicator = `${currentLoadingText}...`
  const newLoadingIndicator = `${newLoadingText}...`

  // Replace the current loading indicator with the new loading indicator
  textArea.value = textArea.value.replace(currentLoadingIndicator, newLoadingIndicator)

  // Move the spinner to the new text
  showSpinnerAtText(textArea, newLoadingIndicator)
}

function removeSpinner(): void {
  const spinner = document.querySelector('.gvc-spinner')
  if (spinner) {
    spinner.remove()
  }
}

function replaceLoadingWithMarkdownLink(
  textArea: HTMLTextAreaElement,
  name: string,
  href: string,
  loadingText: string = 'Loading',
): void {
  const markdownLink = `[${name}](${href})`
  const loadingIndicator = `${loadingText}...`

  // Replace the loading indicator with the markdown link
  textArea.value = textArea.value.replace(loadingIndicator, markdownLink)

  // Remove the spinner
  removeSpinner()

  // Move the cursor after the inserted markdown link
  const insertPos = textArea.value.indexOf(markdownLink) + markdownLink.length
  textArea.selectionStart = textArea.selectionEnd = insertPos
  textArea.focus()
}

// function injectMarkdownLink(textArea: HTMLTextAreaElement, name: string, href: string): void {
//   const markdownLink = `\n\n[${name}](${href})\n\n`

//   // Check if the browser supports `selectionStart` and `selectionEnd`

//   const startPos = textArea.selectionStart
//   const endPos = textArea.selectionEnd
//   const beforeText = textArea.value.substring(0, startPos)
//   const afterText = textArea.value.substring(endPos)

//   // Insert the markdown link where the cursor is, or at the end if no selection
//   textArea.value = beforeText + markdownLink + afterText

//   // Move the cursor to the end of the new link
//   textArea.selectionStart = textArea.selectionEnd = startPos + markdownLink.length

//   // Optionally, focus the textarea
//   textArea.focus()
// }

const getRepositoryId = () => {
  const repository_id = document
    .querySelector('meta[name="octolytics-dimension-repository_id"]')
    ?.getAttribute('content')
  if (!repository_id) {
    throw new Error('repository_id not found')
  }

  return repository_id
}

const getAuthenticityToken = () => {
  const authenticity_token = document.querySelector('.js-data-upload-policy-url-csrf')?.getAttribute('value')
  if (!authenticity_token) {
    throw new Error('authenticity_token not found')
  }

  return authenticity_token
}

type EventListenerFunction = (evt: Event) => void

const addEventListenerWrapper = (() => {
  const eventListenersMap = new Map<Element, Map<string, Set<EventListenerFunction>>>()

  return (
    element: Element,
    event: string,
    listener: EventListenerFunction,
    options?: boolean | AddEventListenerOptions,
  ) => {
    let eventsMap = eventListenersMap.get(element)
    if (!eventsMap) {
      eventsMap = new Map<string, Set<EventListenerFunction>>()
      eventListenersMap.set(element, eventsMap)
    }

    let listeners = eventsMap.get(event)
    if (!listeners) {
      listeners = new Set<EventListenerFunction>()
      eventsMap.set(event, listeners)
    }

    if (!listeners.has(listener)) {
      listeners.add(listener)
      element.addEventListener(event, listener, options)
    }
  }
})()

const fileSizeToMB = fileSize => {
  return (fileSize / (1024 * 1024)).toFixed(2)
}

;(async () => {
  await import('@pages/content/ui')
  await import('@pages/content/injected')
  const { execCommand } = await import('@root/src/utils/command.util')
  const { GithubUploader } = await import('@pages/content/GithubUploader')
  const githubUploader = new GithubUploader()

  const uploadFile = (textAreaElement: HTMLTextAreaElement, blob: Blob, fileName: string) => {
    if (blob) {
      const file = new File([blob], fileName, { type: blob.type })
      console.log('fileName', fileName)

      const repository_id = getRepositoryId()
      const authenticity_token = getAuthenticityToken()
      const randomNumber = Math.floor(Math.random() * 1000000000)

      githubUploader
        .startImageUpload({
          imageName: `v-${randomNumber}-${file.name}`,
          imageSize: file.size,
          authenticity_token,
          content_type: file.type,
          repository_id,
          file,
          imageUploadCompleteCallback: () => {
            console.log('Upload complete')
          },
        })
        .then(imageResponse => {
          console.log('imageResponse', imageResponse)
          if (!imageResponse) {
            throw new Error('imageResponse is invalid')
          }

          if (!textAreaElement) {
            window.alert(
              `The github compression extension does not know where to place the file. Please copy and paste the following link into the textarea instead.\n\nLink: [${file.name}](${imageResponse.href})`,
            )
            throw new Error('textAreaElement not found')
          }

          replaceLoadingWithMarkdownLink(
            textAreaElement,
            `${file.name}__${fileSizeToMB(file.size)}MB`,
            imageResponse.href,
            `Uploading [${fileName}]`,
          )
          console.debug('success')
        })
        .finally(() => {
          removeSpinner()
        })
    }
  }

  // const addDragAndDropListeners = () => {
  //   const textAreaElements = document.querySelectorAll('.js-upload-markdown-image textarea')

  //   textAreaElements.forEach(textAreaElement => {
  //     // Prevent the default behavior for dragover
  //     addEventListenerWrapper(textAreaElement, 'dragover', (event: DragEvent) => {
  //       event.preventDefault()
  //     })

  //     // Handle the drop event
  //     addEventListenerWrapper(textAreaElement, 'drop', (event: DragEvent) => {
  //       event.preventDefault()

  //       // Ensure that dataTransfer is not null
  //       if (event.dataTransfer) {
  //         const files = event.dataTransfer.files

  //         if (files) {
  //           // Iterate over the files
  //           for (let i = 0; i < files.length; i++) {
  //             const file = files[i]

  //             // Check if the file type is a video
  //             if (file.type.startsWith('video/')) {
  //               console.log('Video file dropped:', file.name)

  //               // Additional handling for the file can be done here
  //             }
  //           }
  //         }
  //       }
  //     })
  //   })
  // }

  const TRIGGER_SIZE = 50 * 1024 * 1024 // 100Mb
  const addFileUploadListeners = () => {
    const fileInputs = document.querySelectorAll('input[type=file]')
    console.log('fileInputs', fileInputs)

    fileInputs.forEach(fileInput => {
      addEventListenerWrapper(fileInput, 'change', (e: Event) => {
        const target = e.target as HTMLInputElement

        if (!target || target?.type !== 'file') {
          return
        }

        if (target && target.type === 'file') {
          const textAreaElement = document.querySelector(`.js-upload-markdown-image textarea`) as HTMLTextAreaElement

          if (!textAreaElement) {
            throw new Error('textAreaElement not found')
          }

          const files = target.files
          if (!files) {
            throw new Error('files not found')
          }

          // Iterate over the FileList
          for (let i = 0; i < files.length; i++) {
            const file = files.item(i)

            // Ignore files that are small
            if (file.size < TRIGGER_SIZE) return

            if (!file) {
              throw new Error('file not found')
            }

            if (file.type) {
              e.stopPropagation()
              e.preventDefault()

              // Check if the file type includes 'video'
              if (file.type.includes('video')) {
                e.stopPropagation()
                e.preventDefault()

                displayLoadingWithSpinner(textAreaElement, `Compressing [${file.name}]`)
                execCommand('compress_file', {
                  file,
                })
                  .then(({ file: compressedFile }) => {
                    console.log('compressedFile', compressedFile)
                    console.log('finish compressed video')
                    if (compressedFile) {
                      updateLoadingText(
                        textAreaElement,
                        `Compressing [${file.name}]`,
                        `Uploading [${compressedFile.name}]`,
                      )

                      uploadFile(textAreaElement, compressedFile, compressedFile.name)
                    }
                  })
                  .catch(err => {
                    console.log('err', err)
                  })
              }
            }
          }
        }
      })
    })
  }

  // Select the node that will be observed for mutations
  const targetNode = document.querySelector('.pull-discussion-timeline')
  console.log('selectNode', targetNode)

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList) {
    for (const mutation of mutationsList) {
      console.log('mutation', mutation)
      addFileUploadListeners()
      // addDragAndDropListeners()
    }
  }

  // Create an instance of MutationObserver
  const observer = new MutationObserver(callback)

  // Start observing the target node for configured mutations
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    attributeFilter: ['data-file-attachment-for'],
  })

  // init
  addFileUploadListeners()
  // addDragAndDropListeners()
})()
