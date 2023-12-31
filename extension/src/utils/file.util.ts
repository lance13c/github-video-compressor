import { getToken } from '@utils/token.util'

export async function sendFileToServer(
  file: File,
  port: number = 7777,
): Promise<{
  file?: File
}> {
  const formData = new FormData()
  formData.append('file', file)

  const token = await getToken()
  console.log('token before send', token)

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
