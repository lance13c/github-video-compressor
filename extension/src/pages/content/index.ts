;(async () => {
  await import('@pages/content/ui')
  await import('@pages/content/injected')
  const { onFileInputChange, addEventListenerWrapper, removeAllEventListeners } = await import(
    '@root/src/pages/content/domains/github/ui.util'
  )

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

  const resetAllFileUploadListeners = () => {
    const fileInputs = document.querySelectorAll('input[type=file]')
    removeAllEventListeners()

    fileInputs.forEach(fileInput => {
      console.log('fileinput', fileInput)
      addEventListenerWrapper(fileInput, 'change', onFileInputChange)
    })
  }

  // Select the node that will be observed for mutations
  const targetNode = document.querySelector('.pull-discussion-timeline')
  console.log('selectNode', targetNode)

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList) {
    console.log('mutationsList', mutationsList)
    if (mutationsList.length > 0) {
      // When mutations are observed, add listeners to the file inputs
      resetAllFileUploadListeners()
    }
  }

  // Create an instance of MutationObserver
  const observer = new MutationObserver(callback)

  // Start observing the target node for configured mutations
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    // attributeFilter: ['data-file-attachment-for'],
  })

  // init
  resetAllFileUploadListeners()
  // addDragAndDropListeners()
})()
