import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express, Request, Response } from 'express'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import https from 'https'
import { sendDebugMessage } from 'main/dev_websockets'
import multer from 'multer'
import path from 'path'
import { generateHostKey, validateTokenMiddleware } from 'shared/utils/crypto.util'
import { fileURLToPath } from 'url'

ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

interface TokenPayload {
  client: number
}

declare global {
  namespace Express {
    interface Request {
      clientId?: TokenPayload
    }
  }
}

export const startHttpFileServer = (electronApp: Electron.App, port: number = 7779) => {
  const documentsPath = electronApp.getPath('documents')
  const filesPath = path.join(documentsPath, 'GithubVideoCompressor')
  // Create file directory if it doesn't exist
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath, { recursive: true })
  }
  // @ts-expect-error - import.meta.url is correct
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  sendDebugMessage('debug', `dirname: ${__dirname}`)
  const app: Express = express()
  app.use(cors())

  const upload = multer({ dest: 'uploads/' }) // Configure Multer as needed

  // Middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.get('/', (req, res) => {
    sendDebugMessage('debug', 'GET /')
    res.send('Hello World!')
  })

  // File upload endpoint
  app.post('/upload', [validateTokenMiddleware, upload.single('file')], (req: Request, res: Response) => {
    if (!req.file) {
      sendDebugMessage('debug', 'No file received')
      return res.status(400).json('')
    }

    sendDebugMessage('debug - name', req.file.originalname)
    sendDebugMessage('debug - path', req.file.path)
    // @ts-expect-error -- test token
    sendDebugMessage('debug - token', req?.token)
    sendDebugMessage('debug - file', req.file)
    // fs.move(req.file.path, path.join(__dirname, 'uploads', req.file.originalname), { overwrite: true })
    //   .then(() => res.status(200).json({ message: 'File uploaded successfully.' }))
    //   .catch(err => {
    //     sendDebugMessage('debug', err?.message)
    //     res.status(500).json('')
    //   })

    const inputPath = req.file.path

    const outputPath = path.join(filesPath, 'uploads', req.file.originalname)
    sendDebugMessage('debug', `outputPath: ${outputPath}`)

    ffmpeg(inputPath)
      .output(outputPath)
      .on('start', commandLine => {
        sendDebugMessage('debug', 'Spawned FFmpeg with command: ' + commandLine)
      })
      .on('codecData', data => {
        sendDebugMessage('debug', 'Input is ' + data.audio + ' audio with ' + data.video + ' video')
      })
      .on('error', (err: Error) => {
        sendDebugMessage('debug - error', err.message)
        res.status(500).json({ message: 'Error processing file' })
      })
      .on('end', () => {
        sendDebugMessage('debug', 'Processing finished !')
        // File processing finished, send the file
        return res.status(200).json({ message: 'File uploaded successfully.' })
      })
      .run()
  })

  // HTTP Options
  const { privateKey, publicKey } = generateHostKey()
  const caCert = privateKey

  // HTTPS options with requestCert and ca
  const httpsOptions: https.ServerOptions = {
    // key: privateKey,
    // cert: publicKey,
    // requestCert: true, // Request a certificate from clients
    // rejectUnauthorized: true, // Only allow clients with valid certificates
    // ca: [caCert], // Array of trusted CAs
  }

  // Create and start HTTPS server
  const server = app.listen(port, () => {
    sendDebugMessage('debug', `HTTP Server running on port ${port}`)
  })

  return {
    server,
  }
}
