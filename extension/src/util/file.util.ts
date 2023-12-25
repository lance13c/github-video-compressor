import { getToken } from "@root/src/pages/background/tokenManager";

export async function sendFileToServer(file: File, port: number = 7777): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  console.log("token before send", token);

  const response = await fetch(`http://127.0.0.1:${port}/upload`, {
    method: 'POST',
    headers: {
      // Include the token in the Authorization header
      'Authorization': `Bearer ${token}`
    },
    body: formData // Send the file in a FormData object
  });

  console.log("file sent:", response);

  return response;
}

export const pingTest = async (port: number = 7777): Promise<Response> => {
  const res = await fetch(`http://127.0.0.1:${port}`)
  console.log(res);
  return res;
}
