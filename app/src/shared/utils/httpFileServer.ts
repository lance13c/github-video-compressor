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
import { mimeTypeToExtension } from 'shared/utils/file.util'
import { fileURLToPath } from 'url'

ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

const isDevelopment = process.argv.includes('--development')
sendDebugMessage('debug', `isDevelopment: ${isDevelopment}`)

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
  const tempPath = electronApp.getPath('temp')
  // @ts-expect-error - import.meta.url is correct
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  sendDebugMessage('debug', `dirname: ${__dirname}`)

  // Setup uploads folder
  const uploadsDir = 'uploads/'

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const app: Express = express()
  app.use(cors())

  // Set up Multer to store files with original extensions
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      sendDebugMessage('debug - destination file name', file.filename)
      cb(null, 'uploads/') // Destination folder
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const extension = mimeTypeToExtension(file.mimetype) || 'unknown'

      sendDebugMessage('test file name', `${file.fieldname}-${uniqueSuffix}.${extension}`)
      sendDebugMessage('debug - file mime type', file.mimetype)
      cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`) // Preserve the file extension
    },
  })

  const upload = multer({ storage }) // Configure Multer as needed

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
    sendDebugMessage('debug - input path', inputPath)

    const outputFileName = req.file.originalname
    const outputPath = path.join(tempPath, outputFileName)

    sendDebugMessage('debug', `outputPath: ${outputPath}`)
    // Save the file locally
    // const inputPath = `${filesPath}/${req.file.originalname}`
    // fs.writeFileSync(inputPath, req.file.buffer)

    // check if file exists
    sendDebugMessage('debug', `inputPath exists: ${fs.existsSync(inputPath)}`)

    ffmpeg(inputPath)
      .noAudio()
      .videoCodec('libx264')
      .addOptions(['-crf 28', '-preset ultrafast', '-vf', 'scale=-1:720'])
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
        const outputFileExists = fs.existsSync(outputPath)

        sendDebugMessage('debug - output file exists', `${outputFileExists}`)
        if (outputFileExists) {
          // File processing finished, send the file
          // Download output file

          return res.status(200).download(outputPath, outputFileName, err => {
            if (err) {
              sendDebugMessage('debug', err?.message)
              return res.status(500).json({ message: 'Error processing file' })
            }

            // Delete files from temp directory
            fs.unlinkSync(inputPath)
            fs.unlinkSync(outputPath)
          })
        } else {
          return res.status(500).json({ message: 'Error processing file' })
        }
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
