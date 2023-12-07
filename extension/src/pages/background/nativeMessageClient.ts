type Listener = (...args: unknown[]) => void;

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
        console.log('constructor message', message);

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

  sendMessage(message: Record<string, unknown>): void {
    // const messageString = JSON.stringify(message);
    // const messageLength = new TextEncoder().encode(messageString).length;
    // const buffer = new ArrayBuffer(4 + messageLength);
    // new DataView(buffer).setUint32(0, messageLength, true); // true for little-endian
    // new Uint8Array(buffer, 4).set(new TextEncoder().encode(messageString));

    const messageString = JSON.stringify(message);
    const messageBuffer = new TextEncoder().encode(messageString);
    const lengthBuffer = new ArrayBuffer(4);
    new DataView(lengthBuffer).setUint32(0, messageBuffer.byteLength, true); // true for little-endian

    const combinedBuffer = new Uint8Array(lengthBuffer.byteLength + messageBuffer.byteLength);
    combinedBuffer.set(new Uint8Array(lengthBuffer), 0);
    combinedBuffer.set(messageBuffer, lengthBuffer.byteLength);

    this.port.postMessage(combinedBuffer);
  }
  

  disconnect(): void {
    this.port.disconnect();
    this.port = null;
  }

  addListener(listener: (arg: unknown) => void): void {
    //   this.port.onMessage.addListener((...args) => {
    //     listener(args);
    //     return false;
    // });
  }

  removeListener(name: string): void {
    if (!this.listeners[name]) {
      console.warn('remove listener does not exist');

      return;
    }

    delete this.listeners[name];
  }
}
