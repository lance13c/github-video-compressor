import bodyParser from 'body-parser'
import express, { Express, Request, Response } from 'express'
import fs from 'fs-extra'
import https from 'https'
import { sendDebugMessage } from 'main/dev_websockets'
import multer from 'multer'
import path from 'path'
import { generateHostKey, validateTokenMiddleware } from 'shared/utils/crypto.util'
import { fileURLToPath } from 'url'

interface TokenPayload {
  client: number
}

declare global {
  namespace Express {
    interface Request {
      client?: TokenPayload
    }
  }
}

export const startHttpFileServer = (port: number = 7779) => {
  // @ts-expect-error - import.meta.url is correct
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  sendDebugMessage('debug', `dirname: ${__dirname}`)
  const app: Express = express()
  const upload = multer({ dest: 'uploads/' }) // Configure Multer as needed

  // Middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  // File upload endpoint
  app.post('/upload', [validateTokenMiddleware, upload.single('file')], (req: Request, res: Response) => {
    if (!req.file) {
      sendDebugMessage('debug', 'No file received')
      return res.status(400).json('')
    }

    sendDebugMessage('debug', req.file.originalname)
    fs.move(req.file.path, path.join(__dirname, 'uploads', req.file.originalname), { overwrite: true })
      .then(() => res.json({ message: 'File uploaded successfully.' }))
      .catch(err => {
        sendDebugMessage('debug', err?.message)
        res.status(500).json('')
      })
  })

  // HTTP Options
  const { privateKey, publicKey } = generateHostKey()
  const caCert = privateKey

  // HTTPS options with requestCert and ca
  const httpsOptions = {
    key: privateKey,
    cert: publicKey,
    requestCert: true, // Request a certificate from clients
    rejectUnauthorized: true, // Only allow clients with valid certificates
    ca: [caCert], // Array of trusted CAs
  }

  // Create and start HTTPS server
  const server = https.createServer(httpsOptions, app).listen(port, () => {
    sendDebugMessage('debug', `HTTPS Server running on port ${port}`)
  })

  return server
}
