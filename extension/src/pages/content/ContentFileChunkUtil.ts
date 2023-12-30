// FileChunkReceiver.ts

import type { FileChunkMessage } from '@root/src/pages/background/BackgroundFileChunkUtil';
import { base64ToUint8Array, uint8ArrayToBase64 } from '@root/src/pages/background/binaryHelpers';
import { v4 as uuid } from 'uuid';


type SendingOptions = {
  id: string;
  chunkSize: number;
}

type ReceivingOptions = {
  chunkSize: number;
}

type Message = {
  blob?: Blob; fileName?: string; isComplete: boolean; progress?: number 
}

type Listener = (message: Message, close: () => void) => void



const createListener = (listener: Listener, options: ReceivingOptions = {
  chunkSize: 1024
}) => {
  const fileChunks: Uint8Array[] = [];

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    const close = () => {
          console.log("close", this);
          chrome.runtime.onMessage.addListener(this);
        
    }
    if (message.type === 'fileChunk') {
      const fileChunkMessage = message as FileChunkMessage;
      const chunkUint8 = base64ToUint8Array(fileChunkMessage.chunk);

      console.log('chunk length', chunkUint8);

      fileChunks.push(chunkUint8);

      if (fileChunkMessage.isComplete) {
        console.log('fileChunks', options.chunkSize);

        const blob = new Blob(fileChunks, { type: fileChunkMessage.fileType });
        console.log('blob', blob);
        const fileExtension = fileChunkMessage.fileType.split('/')?.[1] || fileChunkMessage.fileType.split('.')?.[1];
        const fileName = `compressed-video.${fileExtension}`;

        listener({
          blob,
          fileName,
          progress: 1,
          isComplete: fileChunkMessage.isComplete,
        },close
        );

        console.log('complete! send');
        // ... proceed to create URL and download
        // Optionally, you can use an event or callback to notify completion
      } else {
        listener({
          progress: fileChunkMessage.progress,
          isComplete: false,
        }, close);
      }

      sendResponse({ next: true });
    } else if (message.type === 'progress') {
      console.info('progress', message);
      sendResponse({ next: true });
    }
  })
}
  


const readFileChunk = async (file: File, start: number, end: number): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Read operation did not return an ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(start, end));
    });
  }



export const sendFile = async (file: File, options: SendingOptions = {
  id: uuid(),
  chunkSize: 1024
}): Promise<void> => {
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / options.chunkSize);

    for (let index = 0; index < totalChunks; index++) {
      const start = index * options.chunkSize;
      const end = Math.min(start + options.chunkSize, fileSize);
      const chunkUint8 = await readFileChunk(file, start, end);
      const base64Chunk = uint8ArrayToBase64(chunkUint8);
      console.info('chunk progress', end / fileSize);

      // In the content.js get the url of the browser tab
      // const url =

      const message: FileChunkMessage = {
        id: options.id,
        type: 'fileChunk',
        chunk: base64Chunk,
        progress: end / fileSize,
        fileType: file.type,
        isComplete: end >= fileSize,
        // @ts-expect-error -- window is valid global
        url: window.location.href,
      };

      chrome.runtime.sendMessage(message);
    }
  }

export const compressFile = async (file: File) => new Promise<Message>((resolve, reject) => {
    try {

  
    createListener((message, close) => {
      resolve(message)
      close();
    });
    

    sendFile(file);

      } catch (e) {
        reject(e)
      }
  })

