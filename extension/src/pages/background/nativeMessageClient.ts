type Listener = (...args: unknown[]) => void;

type Message = {
  type: 'text' | 'video/mp4' | 'video/mpeg' | 'video/ogg' | 'video/webm' | 'video/quicktime',
  progress: number, // 0-1
  data: string, // Files will be in binary chunks
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
    const messageString = JSON.stringify(message);
    const messageBuffer = new TextEncoder().encode(messageString);
    const lengthBuffer = new ArrayBuffer(4);
    new DataView(lengthBuffer).setUint32(0, messageBuffer.byteLength, true); // true for little-endian

    const combinedBuffer = new Uint8Array(lengthBuffer.byteLength + messageBuffer.byteLength);
    combinedBuffer.set(new Uint8Array(lengthBuffer), 0);
    combinedBuffer.set(messageBuffer, lengthBuffer.byteLength);
    console.log('hit send message');
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
