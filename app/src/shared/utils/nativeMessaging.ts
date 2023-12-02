// NativeMessagingHost.ts
import process from 'process';

const objectToStdMessage = (message: Record<string, any>): Buffer => {
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  const data = Buffer.concat([header, buffer]);

  return data;
};

export class NativeMessagingHost {
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

  private onDataReceived(data: Buffer): void {
    // Implement specific logic for received data
    // const message = `received test --- ${data.toString('utf-8')}`
    // console.log(message)
    // convert to uint8 array
    // const encodedMessage = new TextEncoder().encode(message)
    // this.sendMessage(encodedMessage)
  }
}
