import { GithubUploader } from '@pages/content/GithubUploader'
import { closeNativeApp, execCommand } from '@root/src/utils/command.util'

const MAX_FILE_SIZE_MB = 50 // Maximum file size in MB for triggering compression
const SPINNER_MARGIN = 6 // Margin for spinner placement in pixels

type DOMEventListener = (evt: Event) => void
const domEventListeners = new Map<Element, Map<string, Set<DOMEventListener>>>()

export const addDomEventListener = (
  targetElement: Element,
  eventType: string,
  eventListener: DOMEventListener,
  options?: boolean | AddEventListenerOptions,
) => {
  let eventTypeListeners = domEventListeners.get(targetElement)
  if (!eventTypeListeners) {
    eventTypeListeners = new Map<string, Set<DOMEventListener>>()
    domEventListeners.set(targetElement, eventTypeListeners)
  }

  let eventListeners = eventTypeListeners.get(eventType)
  if (!eventListeners) {
    eventListeners = new Set<DOMEventListener>()
    eventTypeListeners.set(eventType, eventListeners)
  }

  if (!eventListeners.has(eventListener)) {
    eventListeners.add(eventListener)
    targetElement.addEventListener(eventType, eventListener, options)
  }
}

export const clearAllDomEventListeners = () => {
  domEventListeners.forEach((eventTypeListeners, element) => {
    eventTypeListeners.forEach((eventListeners, eventType) => {
      eventListeners.forEach(listener => {
        element.removeEventListener(eventType, listener)
      })
      eventListeners.clear()
    })
  })
}

// Spinner Management Functions
function isSpinnerVisible(): boolean {
  return document.querySelectorAll('.gvc-spinner').length > 0
}

function placeSpinnerNearText(textArea: HTMLTextAreaElement, searchText: string): void {
  if (isSpinnerVisible()) {
    return
  }

  const spinner = document.createElement('div')
  spinner.classList.add('gvc-spinner')
  document.body.appendChild(spinner)

  // Position Calculation
  const matchIndex = textArea.value.indexOf(searchText)
  if (matchIndex !== -1) {
    spinner.style.display = 'block'
    spinner.style.position = 'absolute'
    const textAreaRect = textArea.getBoundingClientRect()
    spinner.style.left = `${textAreaRect.left + window.scrollX + SPINNER_MARGIN}px`
    spinner.style.top = `${textAreaRect.top + window.scrollY + SPINNER_MARGIN}px`
  }
}

function showLoadingSpinner(textArea: HTMLTextAreaElement, loadingText: string = 'Loading'): void {
  const loadingIndicator = `\n\n${loadingText}...\n\n`
  const currentPosition = textArea.selectionStart ?? textArea.value.length
  textArea.value =
    textArea.value.substring(0, currentPosition) + loadingIndicator + textArea.value.substring(currentPosition)
  textArea.selectionStart = textArea.selectionEnd = currentPosition + loadingIndicator.length
  textArea.focus()

  placeSpinnerNearText(textArea, loadingText)
}

function updateSpinnerLoadingText(
  textArea: HTMLTextAreaElement,
  currentLoadingText: string,
  newLoadingText: string,
): void {
  const currentIndicator = `${currentLoadingText}...`
  const newIndicator = `${newLoadingText}...`
  textArea.value = textArea.value.replace(currentIndicator, newIndicator)

  placeSpinnerNearText(textArea, newLoadingText)
}

function removeVisibleSpinners(): void {
  const spinners = document.querySelectorAll('.gvc-spinner')
  spinners.forEach(spinner => spinner.remove())
}

function insertMarkdownLink(
  textArea: HTMLTextAreaElement,
  linkText: string,
  linkUrl: string,
  placeholderText: string = 'Loading',
): void {
  const markdownLink = `[${linkText}](${linkUrl})`
  const loadingIndicator = `${placeholderText}...`
  textArea.value = textArea.value.replace(loadingIndicator, markdownLink)

  removeVisibleSpinners()

  const insertPosition = textArea.value.indexOf(markdownLink) + markdownLink.length
  textArea.selectionStart = textArea.selectionEnd = insertPosition
  textArea.focus()
}

// Helper Functions
const getRepositoryId = (): string => {
  const repoId = document.querySelector('meta[name="octolytics-dimension-repository_id"]')?.getAttribute('content')
  if (!repoId) {
    throw new Error('Repository ID not found')
  }
  return repoId
}

const getAuthenticityToken = (): string => {
  const token = document.querySelector('.js-data-upload-policy-url-csrf')?.getAttribute('value')
  if (!token) {
    throw new Error('Authenticity token not found')
  }
  return token
}

const fileSizeToMB = (fileSize: number): string => {
  return (fileSize / (1024 * 1024)).toFixed(2)
}

const uploadFileToGithub = async (textAreaElement: HTMLTextAreaElement, fileBlob: Blob, fileName: string) => {
  const uploader = new GithubUploader()

  if (fileBlob) {
    const file = new File([fileBlob], fileName, { type: fileBlob.type })
    console.debug('Uploading file:', fileName)

    const repoId = getRepositoryId()
    const csrfToken = getAuthenticityToken()
    const uniqueId = Math.floor(Math.random() * 1000000000)

    const imageResponse = await uploader.startImageUpload({
      imageName: `v-${uniqueId}-${file.name}`,
      imageSize: file.size,
      authenticity_token: csrfToken,
      content_type: file.type,
      repository_id: repoId,
      file,
      imageUploadCompleteCallback: () => {},
    })

    if (!imageResponse) {
      throw new Error('Invalid image response')
    }

    if (!textAreaElement) {
      console.warn(
        'Unable to locate the textarea for file placement. Please manually copy and paste this link:\n\nLink: [${file.name}](${imageResponse.href})',
      )
      throw new Error('Textarea element not found')
    }

    insertMarkdownLink(
      textAreaElement,
      `${file.name}__${fileSizeToMB(file.size)}MB`,
      imageResponse.href,
      `Uploading [${fileName}]`,
    )

    removeVisibleSpinners()
  }
}

export const getTextAreaElement = (inputElement: Element): HTMLTextAreaElement | undefined => {
  const textAreaId = inputElement.id.substring(3) // Assuming the format is 'fc-[textAreaId]'
  return document.getElementById(textAreaId) as HTMLTextAreaElement | undefined
}

const processFileUpload = async (file: File, textAreaElement: HTMLTextAreaElement, event: Event) => {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    event.preventDefault()
    event.stopPropagation()

    try {
      showLoadingSpinner(textAreaElement, `Compressing [${file.name}]`)
      const { file: compressedFile } = await execCommand('compress_file', { file })

      await updateSpinnerLoadingText(
        textAreaElement,
        `Compressing [${file.name}]`,
        `Uploading [${compressedFile.name}]`,
      )

      return await uploadFileToGithub(textAreaElement, compressedFile, compressedFile.name)
    } catch (err) {
      console.error('Error in file compression:', err)
    }
  }
}

const handleFileChange = async (files: FileList, textAreaElement: HTMLTextAreaElement, event: Event) => {
  if (!textAreaElement) {
    throw new Error('Textarea element not found')
  }

  if (!files) {
    throw new Error('No files found')
  }

  for (const file of Array.from(files)) {
    if (file.type.includes('video')) {
      await processFileUpload(file, textAreaElement, event)
    }
  }

  // Close app after all files are processed, only if there were any files to process.
  if (files.length > 0) {
    await closeNativeApp()
  }
}

export const handleTextAreaDrop = (event: DragEvent, textAreaElement: HTMLTextAreaElement): void => {
  if (event.dataTransfer) {
    const files = event.dataTransfer.files
    handleFileChange(files, textAreaElement, event)
  } else {
    console.warn('No files specified')
  }
}

export const handleFileInputElementChange = (event: Event, textAreaElement: HTMLTextAreaElement): void => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files?.length > 0) {
    handleFileChange(files, textAreaElement, event)
  } else {
    console.warn('No files specified')
  }
}

export const handleEventWithTextArea = <E extends Event>(
  targetTextArea: HTMLTextAreaElement,
  eventHandler: (event: E, textAreaElement: HTMLTextAreaElement) => void,
) => {
  return (event: E) => {
    eventHandler(event, targetTextArea)
  }
}
