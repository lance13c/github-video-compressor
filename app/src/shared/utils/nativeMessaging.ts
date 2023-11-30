// NativeMessagingHost.ts
import process from 'process'

export class NativeMessagingHost {
  constructor() {
    process.stdin.on('data', (data: Buffer) => {
      // Handle incoming data from the Chrome extension
      // For example, process and send back video file
      this.onDataReceived(data)
    })
  }

  sendMessage(message: any): void {
    const messageString = JSON.stringify(message)
    const messageLength = Buffer.alloc(4)
    messageLength.writeUInt32LE(messageString.length, 0)
    process.stdout.write(messageLength)
    process.stdout.write(messageString)
  }

  private onDataReceived(data: Buffer): void {
    // Implement specific logic for received data
    console.log('electron message:', data.toString('utf-8'))
  }
}
