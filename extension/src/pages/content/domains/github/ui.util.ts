import { GithubUploader } from '@pages/content/GithubUploader'
import { execCommand } from '@root/src/utils/command.util'

const TRIGGER_SIZE = 50 * 1024 * 1024 // 100Mb
const PADDING = 6 // 6px

type EventListenerFunction = (evt: Event) => void
const eventListenersMap = new Map<Element, Map<string, Set<EventListenerFunction>>>()

export const addEventListenerWrapper = (
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

export const removeAllEventListeners = () => {
  eventListenersMap.forEach((eventsMap, element) => {
    eventsMap.forEach((listeners, event) => {
      listeners.forEach(listener => {
        element.removeEventListener(event, listener)
      })
      listeners.clear() // Clear the set after removing all listeners
    })
  })
}

function spinnerExists(): boolean {
  return document.querySelectorAll('.gvc-spinner').length > 0
}

function showSpinnerAtText(textArea: HTMLTextAreaElement, searchText: string): void {
  if (spinnerExists()) {
    // Only show one spinner at a time
    return
  }

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
  const spinners = document.querySelectorAll('.gvc-spinner')
  console.log('removeSpinner')
  console.log('spinners', spinners.length)
  if (spinners.length > 0) {
    spinners.forEach(spinner => spinner.remove())
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

const fileSizeToMB = fileSize => {
  return (fileSize / (1024 * 1024)).toFixed(2)
}

const uploadFile = (textAreaElement: HTMLTextAreaElement, blob: Blob, fileName: string) => {
  const githubUploader = new GithubUploader()

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

        removeSpinner()
      })
  }
}

export const onFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement

  if (!target || target?.type !== 'file') {
    return
  }

  // issuecomment-
  // fc-issuecomment-1892704184-body

  if (target && target.type === 'file') {
    console.log('input element', e.target)

    // Check trigger size
    e.stopPropagation()
    e.preventDefault()

    const inputId = target.id
    // remove first 3 characters of inputId
    const textAreaId = inputId.substring(3, inputId.length) // Removes fc- from 'fc-issuecomment-1892704184'
    const textAreaElement = document.getElementById(textAreaId) as HTMLTextAreaElement

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
      if (!file) {
        throw new Error('file not found')
      }

      if (file.type) {
        // Check if the file type includes 'video'
        if (file.type.includes('video')) {
          e.stopPropagation()
          e.preventDefault()

          if (file.size > TRIGGER_SIZE) {
            displayLoadingWithSpinner(textAreaElement, `Compressing [${file.name}]`)
            execCommand('compress_file', {
              file,
            })
              .then(({ file: compressedFile }) => {
                console.log('compressedFile', compressedFile)
                console.log('finish compressed video')
                if (compressedFile) {
                  updateLoadingText(textAreaElement, `Compressing [${file.name}]`, `Uploading [${compressedFile.name}]`)

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
  }
}
