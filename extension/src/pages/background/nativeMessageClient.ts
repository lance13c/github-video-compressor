type Listener = (...args: unknown[]) => void;

type Message = {
  type: 'text' | 'video/mp4' | 'video/mpeg' | 'video/ogg' | 'video/webm' | 'video/quicktime',
  progress: number, // 0-1
  data: string, // Files will be in binary chunks
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class NativeMessagingClient {
  private port: chrome.runtime.Port;
  private listeners: Listener[] = [];
  private appName: string;

  constructor(appName: string) {
    this.appName = appName;
    try {
      console.log('appName', this.appName);
      this.port = chrome.runtime.connectNative(this.appName);

      this.port.onMessage.addListener(message => {
        console.log('on message:', message);

        return false;
      });

      // this.port.onDisconnect.addListener(() => {
      //   // console.log(`${this.appName} disconnected`);
      //   // this.disconnect();
      // });
    } catch (e) {
      console.error('error connecting to native app', e);
    }
  }

  sendMessage(message: Message): void {
   // Convert the message to a JSON string and then to a Uint8Array
    const messageString = JSON.stringify(message);
    const messageBuffer = new TextEncoder().encode(messageString);

    // Create a new ArrayBuffer for the length and set the length (little-endian)
    const lengthBuffer = new Uint8Array(new ArrayBuffer(4));
    new DataView(lengthBuffer.buffer).setUint32(0, messageBuffer.byteLength, true);

    // Combine the length and message into a single Uint8Array
    const combinedBuffer = new Uint8Array(lengthBuffer.byteLength + messageBuffer.byteLength);
    combinedBuffer.set(lengthBuffer, 0);
    combinedBuffer.set(messageBuffer, lengthBuffer.byteLength);

    console.log('lengthBuffer', lengthBuffer)

    console.log('send message');
    this.port.postMessage(combinedBuffer);
  }
  
  disconnect(): void {
    this.port.disconnect();
    this.port = null;
  }

  addListener = (listener: (message: Message) => void) => {
      this.port.onMessage.addListener((message) => {
        listener(message);
        return false;
    });
  }

  removeListener(name: string): void {
    if (!this.listeners[name]) {
      console.warn('remove listener does not exist');

      return;
    }

    delete this.listeners[name];
  }
}
