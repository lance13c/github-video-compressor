export class NativeMessagingClient {
    private port: chrome.runtime.Port;

    constructor(appName: string) {
      try {
        console.log('appName', appName);
        this.port = chrome.runtime.connectNative(appName);

        this.port.onMessage.addListener((message: Buffer) => {
            this.onMessageReceived(message);
        });

        this.port.onDisconnect.addListener(() => {
            this.onDisconnect();
        });
      } catch (e) {
        console.error('error connecting to native app', e);
      }
    }

    sendMessage(message: unknown): void {
      try {
         this.port.postMessage(message);
      } catch(e) {
        console.error('error sending message', e);
      }
       
    }

    private onMessageReceived(message: Buffer): void {
        // Implement specific logic for received message
        // print buffer out as utf-8 encoded string
        try {
 console.log('message', message);
        } catch (e) {
            console.error('error parsing message', e);
        }
       
    }

    private onDisconnect(): void {
        // Implement specific logic on disconnect

        console.log('disconnect');

        // TODO
        // indicate the extension is disconnected from the app
    }
}
