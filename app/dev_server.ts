import { ChildProcess, exec } from 'child_process'
import chokidar from 'chokidar'
import { promisify } from 'util'
import WebSocket from 'ws'

const execAsync = promisify(exec)
const wss = new WebSocket.Server({ port: 3333 })
let buildProcess: ChildProcess | null = null

// Broadcast message to all clients
const broadcast = (message: string): void => {
  console.log('broadcast', message)
  wss.clients.forEach(client => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, err => {
          if (err) {
            console.error('client send error', err)
          }
        })
      }
    } catch (e) {
      console.error('client send error exception', e)
    }
  })
}

wss.on('connection', ws => {
  let clientId: null | string = null

  ws.on('message', (message: string) => {
    try {
      const parsedMessage = JSON.parse(message)
      const logPrefix = `[${parsedMessage.client_id} - ${parsedMessage.source.toUpperCase()} - ${parsedMessage.type}]`
      console.log(`${logPrefix}`, parsedMessage.data)
    } catch (e) {
      console.error('Error parsing message:', e)
    }
  })

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`)
  })
})

const runBuild = async () => {
  // Kill existing build process if it's running
  // if (buildProcess && !buildProcess.killed) {
  //   buildProcess.kill()
  // }

  // Start a new build process
  try {
    const { stdout, stderr } = await execAsync('electron-vite build')

    !!stdout && console.log(`stdout: ${stdout}`)
    !!stderr && console.error(`stderr: ${stderr}`)

    // Notify clients to refresh
    broadcast('refresh')
  } catch (e) {
    // @ts-ignore
    console.error(`exec error: ${e?.message}`)
  }
}

console.info('WebSocket server running on ws://localhost:3333')

// Watch 'src' directory for changes
runBuild()
console.info('Building WebSocket server')
console.info(`Watching 'src' directory for changes...`)
chokidar.watch('./src').on('all', (event, path) => {
  if (event !== 'change') return
  console.info(`File ${path} has been ${event}`)
  runBuild()
})
