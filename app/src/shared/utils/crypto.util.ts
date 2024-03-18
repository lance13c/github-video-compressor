import { generateKeyPairSync, randomBytes } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { sendDebugMessage } from '~/src/main/dev_websockets'

export const generateSecretKey = (length: number = 64): string => {
  return randomBytes(length).toString('hex')
}

let secret = generateSecretKey()

export const generateHostKey = () => {
  const keyPair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })

  return {
    privateKey: keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' }),
    publicKey: keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' }),
  }
}

interface TokenPayload {
  clientId: string
}

export const generateToken = (payload: TokenPayload, expiresIn: string | number = '1h'): string => {
  return jwt.sign(payload, secret, { expiresIn })
}

// Middleware to validate JWT token
export const validateTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      sendDebugMessage('debug', 'No authorization header')
      return res.status(400).json('')
    }

    const token = authHeader.split(' ')[1] // Assuming Bearer token format: "Bearer TOKEN"

    if (!token) {
      sendDebugMessage('debug', 'Token is missing')
      return res.status(400).json('')
    }

    const verifiedToken = jwt.verify(token, secret)
    if (!verifiedToken) {
      sendDebugMessage('error', 'Invalid token')
      return res.status(400).json('')
    }

    // @ts-expect-error -- valid token
    req.token = verifiedToken // Add the decoded token payload to the request object

    next() // Proceed to the next middleware/function
  } catch (error) {
    // @ts-expect-error -- valid message
    sendDebugMessage('debug', `Error validating token: ${error?.message}`)
    return res.status(400).json('')
  }
}

// Generate secret
// Add to valid secrets
// send secret to client
// send authorization header with jwt token signed with secret
// verified token with secret on server
