import { createReadStream, createWriteStream, readdirSync } from 'fs'
import { sendDebugMessage } from 'main/dev_websockets'
import { join } from 'path'
import { generateHostKey } from 'shared/utils/crypto.util'
import { Server, type SFTPWrapper } from 'ssh2'

export enum SFTPStatusCode {
  OK = 0,
  EOF = 1,
  NO_SUCH_FILE = 2,
  PERMISSION_DENIED = 3,
  FAILURE = 4,
  BAD_MESSAGE = 5,
  NO_CONNECTION = 6,
  CONNECTION_LOST = 7,
  OP_UNSUPPORTED = 8,
}

enum Flags {
  READ = 0,
  WRITE = 1,
}

export const startSFTP = () => {
  const { privateKey, publicKey } = generateHostKey()

  let sftpServer = new Server(
    {
      hostKeys: [privateKey.toString()],
    },
    client => {
      sendDebugMessage('debug', 'Client connected!')

      client.on('authentication', ctx => {
        // Handle authentication here
        ctx.accept() // or ctx.reject() to reject the connection
      })

      client.on('ready', () => {
        sendDebugMessage('debug', 'Client authenticated!')

        client.on('session', (accept, reject) => {
          let session = accept()
          session.once('sftp', handleSFTPStream)
        })
      })

      client.on('end', () => {
        sendDebugMessage('debug', 'Client disconnected')
      })
    }
  )

  return {
    sftpServer,
    publicKey,
    privateKey,
  }
}

const handleSFTPStream = (...args: any[]): void => {
  const { accept, reject } = args as unknown as {
    accept: () => void
    reject: () => void
  }

  const sftpStream = accept() as unknown as SFTPWrapper

  // Handle open directory request
  sftpStream.on('OPENDIR', (reqid, path) => {
    try {
      const files = readdirSync(path)
      sftpStream.handle(reqid, Buffer.from('dir-handle'))
      // @ts-expect-error -- Unknown files
      sendDebugMessage('debug files', files?.length)
      sftpStream.name(
        reqid,
        // @ts-expect-error -- unknown if files exist
        files?.map?.(file => ({
          filename: file,
          longname: file,
          attrs: {},
        }))
      )
    } catch (err) {
      sftpStream.status(reqid, SFTPStatusCode.FAILURE)
    }
  })

  // Mapping of file handles to read/write streams
  const fileHandles = new Map()

  // Handle open file request
  sftpStream.on('OPEN', (reqid, filename, flags, attrs) => {
    sendDebugMessage('flags', `${flags}`)
    try {
      const handle = Buffer.from(`file-handle-${filename}`)
      if (Flags.READ) {
        const readStream = createReadStream(join(__dirname, filename))
        fileHandles.set(handle.toString(), readStream)
      } else if (Flags.WRITE) {
        const writeStream = createWriteStream(join(__dirname, filename))
        fileHandles.set(handle.toString(), writeStream)
      }
      sftpStream.handle(reqid, handle)
    } catch (err) {
      sftpStream.status(reqid, SFTPStatusCode.FAILURE)
    }
  })

  // Handle file read request
  sftpStream.on('READ', (reqid, handle, offset, length) => {
    const stream = fileHandles.get(handle.toString())
    if (stream && stream.readable) {
      const buffer = Buffer.alloc(length)
      const bytesRead = stream.read(buffer, 0, length, offset)
      if (bytesRead > 0) {
        sftpStream.data(reqid, buffer.slice(0, bytesRead))
      } else {
        sftpStream.status(reqid, SFTPStatusCode.EOF)
      }
    } else {
      sftpStream.status(reqid, SFTPStatusCode.FAILURE)
    }
  })

  // Handle file write request
  sftpStream.on('WRITE', (reqid, handle, offset, data) => {
    const stream = fileHandles.get(handle.toString())
    if (stream && stream.writable) {
      stream.write(data, 'binary', err => {
        if (err) {
          sendDebugMessage('error', err)
          sftpStream.status(reqid, SFTPStatusCode.FAILURE)
        } else {
          sendDebugMessage('debug', 'write success')
          sftpStream.status(reqid, SFTPStatusCode.OK)
        }
      })
    } else {
      sftpStream.status(reqid, SFTPStatusCode.FAILURE)
    }
  })

  // Handle close file or directory request
  sftpStream.on('CLOSE', (reqid, handle) => {
    const stream = fileHandles.get(handle.toString())
    if (stream) {
      stream.close(() => {
        fileHandles.delete(handle.toString())
        sftpStream.status(reqid, SFTPStatusCode.OK)
      })
    } else {
      sftpStream.status(reqid, SFTPStatusCode.FAILURE)
    }
  })
}
