const isValidDomain = (): boolean => {
  const domain = window.location.hostname
  return domain === 'github.com'
}

const init = async () => {
  await import('@pages/content/ui')
  // await import('@pages/content/injected')
  const {
    handleFileInputElementChange,
    addDomEventListener,
    clearAllDomEventListeners,
    getTextAreaElement,
    handleEventWithTextArea,
    handleTextAreaDrop,
  } = await import('@root/src/pages/content/domains/github/ui.util')

  const resetAllFileUploadListeners = () => {
    const fileInputs = document.querySelectorAll('input[type=file]')
    clearAllDomEventListeners()

    fileInputs.forEach(fileInput => {
      const textAreaElement = getTextAreaElement(fileInput)
      if (!textAreaElement) {
        throw new Error('Could not find text area element')
      }

      // File Input
      addDomEventListener(fileInput, 'change', handleEventWithTextArea(textAreaElement, handleFileInputElementChange))

      // Drag and Drop
      addDomEventListener(textAreaElement, 'dragover', (event: DragEvent) => {
        event.stopPropagation()
        event.preventDefault()
      })
      addDomEventListener(textAreaElement, 'drop', handleEventWithTextArea(textAreaElement, handleTextAreaDrop))
    })
  }

  if (isValidDomain()) {
    // Callback function to execute when mutations are observed
    const callback = function (mutationsList) {
      if (mutationsList.length > 0) {
        // When any mutations are observed, add listeners to the file inputs
        resetAllFileUploadListeners()
      }
    }

    // Create an instance of MutationObserver
    const observer = new MutationObserver(callback)

    // Select the node that will be observed for mutations
    let targetNode = document.querySelector('.pull-discussion-timeline')
    if (!targetNode) {
      // Backup: Draft PR
      targetNode = document.querySelector('.timeline-comment-wrapper')
    }

    // Start observing the target node for configured mutations
    if (observer && targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
      })
      resetAllFileUploadListeners()
    }
  }
}

init()

let url = location.href
document.body.addEventListener(
  'click',
  () => {
    requestAnimationFrame(() => {
      if (url !== location.href && isValidDomain()) {
        url = location.href

        // URL change, retrigger init
        init()
      }
    })
  },
  true,
)
