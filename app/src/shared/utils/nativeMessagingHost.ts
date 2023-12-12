// NativeMessagingHost.ts
import process from 'process';
import { Listener } from 'shared/utils/NativeFileTransceiver';

const objectToStdMessage = (message: Record<string, any>): Buffer => {
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  const data = Buffer.concat([header, buffer]);

  return data;
};

export class NativeMessagingHost {
  private listeners: Listener[] = [];

  constructor() {
    process.stdin.on('data', (data: Buffer) => {
      // Handle incoming data from the Chrome extension
      // For example, process and send back video file
      this.onDataReceived(data);
    });
  }

  sendMessage(message: Record<string, any>): void {
    try {
      const data = objectToStdMessage(message);
      process.stdout.write(data);
    } catch (e) {
      const error = objectToStdMessage({ message: e?.message || '' });
      process.stderr.write(error);
    }
  }

  addListener(listener: Listener): void {
    this.listeners.push(listener);
  }

  private onDataReceived(data: Buffer): void {
    // this.sendMessage({ receivedMessage: data.toString('utf-8') });
    // console.log(data);

    // this.listeners.forEach(listener => {
    //   listener(data);
    // });
  }
}
