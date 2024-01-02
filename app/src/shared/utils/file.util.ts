export const extensionMapping = (extension: string) => {
  if (extension === 'quicktime') return 'mov'

  return extension
}

export const mimeTypeToExtension = (mimeType: string) => {
  const extension = mimeType.split('/')[1] || mimeType.split('.')[1]

  return extension ? extensionMapping(extension) : null
}
