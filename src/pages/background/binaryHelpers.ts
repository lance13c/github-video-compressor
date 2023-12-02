// binaryHelpers.ts

/**
 * Converts a Uint8Array to a Base64 string.
 * @param buffer The Uint8Array to convert.
 * @returns The Base64 string representation of the input.
 */
export function uint8ArrayToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array.
 * @param base64 The Base64 string to convert.
 * @returns The Uint8Array representation of the input.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
