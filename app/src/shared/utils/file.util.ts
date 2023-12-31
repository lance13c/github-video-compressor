export const mimeTypeToExtension = (mimeType: string) => {
  const extension = mimeType.split('/')[1] || mimeType.split('.')[1]

  return extension ? extension : null
}
