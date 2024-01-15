;(async () => {
  await import('@pages/content/ui')
  await import('@pages/content/injected')
  const {
    onFileInputChange,
    addEventListenerWrapper,
    removeAllEventListeners,
    getTextAreaElement,
    handleEventWithTextArea,
    onTextAreaDrop,
  } = await import('@root/src/pages/content/domains/github/ui.util')

  const resetAllFileUploadListeners = () => {
    const fileInputs = document.querySelectorAll('input[type=file]')
    removeAllEventListeners()

    fileInputs.forEach(fileInput => {
      const textAreaElement = getTextAreaElement(fileInput)
      if (!textAreaElement) {
        throw new Error('Could not find text area element')
      }

      // File Input
      addEventListenerWrapper(fileInput, 'change', handleEventWithTextArea(textAreaElement, onFileInputChange))

      // Drag and Drop
      addEventListenerWrapper(textAreaElement, 'dragover', (event: DragEvent) => {
        event.stopPropagation()
        event.preventDefault()
      })
      addEventListenerWrapper(textAreaElement, 'drop', handleEventWithTextArea(textAreaElement, onTextAreaDrop))
    })
  }

  // Select the node that will be observed for mutations
  const targetNode = document.querySelector('.pull-discussion-timeline')

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList) {
    if (mutationsList.length > 0) {
      // When any mutations are observed, add listeners to the file inputs
      resetAllFileUploadListeners()
    }
  }

  // Create an instance of MutationObserver
  const observer = new MutationObserver(callback)

  // Start observing the target node for configured mutations
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
  })

  resetAllFileUploadListeners()
})()
