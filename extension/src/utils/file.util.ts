import type { Command } from '@root/src/shared/types'

interface SendFileToServerOptions {
  file: File
  token: string
  port?: number
}

interface SendFileToServerReturn {
  file?: File
}

export const sendFileToServer: Command<SendFileToServerOptions, Promise<SendFileToServerReturn>> = async ({
  file,
  token,
  port = 7777,
}) => {
  const formData = new FormData()
  formData.append('file', file)

  console.log('token exists', !!token)

  const response = await fetch(`http://127.0.0.1:${port}/upload`, {
    method: 'POST',
    headers: {
      // Include the token in the Authorization header
      Authorization: `Bearer ${token}`,
    },
    body: formData, // Send the file in a FormData object
  })

  console.log('send file res', response)

  if (response.ok) {
    const blob = await response.blob()
    console.log('output blob size', blob.size)

    return {
      file: new File([blob], `output-${file.name}`, {
        type: file.type,
      }),
    }
  } else {
    // Handle error
    console.error('File upload failed:', response.statusText)
  }

  return {
    file: undefined,
  }
}

export const pingTest = async (port: number = 7777): Promise<Response> => {
  const res = await fetch(`http://127.0.0.1:${port}`)
  console.log(res)
  return res
}
