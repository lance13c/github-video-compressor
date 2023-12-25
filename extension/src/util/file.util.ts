import { getToken } from "@root/src/pages/background/secretManager";

export async function sendFileToServer(file: File, port: number = 7779): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  console.log("token before send", token);

  const response = await fetch(`localhost:${port}/upload`, {
    method: 'POST',
    headers: {
      // Include the token in the Authorization header
      'Authorization': `Bearer ${token}`
    },
    body: formData // Send the file in a FormData object
  });

  return response;
}
