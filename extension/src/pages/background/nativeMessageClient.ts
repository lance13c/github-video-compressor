export class NativeMessagingClient {
    private port: chrome.runtime.Port;

    constructor(appId: string) {
        this.port = chrome.runtime.connectNative(appId);

        this.port.onMessage.addListener((message: unknown) => {
            console.log("Received message: ", message);
            // Handle the message from the Electron app
            this.onMessageReceived(message);
        });

        this.port.onDisconnect.addListener(() => {
            console.log("Disconnected from the native host.");
            this.onDisconnect();
        });
    }

    sendMessage(message: unknown): void {
        this.port.postMessage(message);
    }

    private onMessageReceived(message: unknown): void {
        // Implement specific logic for received message
        console.log("Received message: ", message);
    }

    private onDisconnect(): void {
        // Implement specific logic on disconnect

        // TODO
        // indicate the extension is disconnected from the app
    }
}
