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

  sendMessage(message: unknown): void {
    try {
      this.port.postMessage(message);
    } catch (e) {
      console.error('error sending message', e);
    }
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
