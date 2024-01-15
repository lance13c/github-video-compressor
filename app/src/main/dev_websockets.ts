import WebSocket from 'ws'

let debugWebSocket: WebSocket | null = null

function generateRandomClientId() {
  const colors = ['red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'purple', 'orange', 'brown']
  const animals = ['lion', 'tiger', 'bear', 'flamingo', 'eagle', 'dolphin', 'shark', 'wolf', 'fox', 'deer']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${color} ${animal}`
}
const clientId = generateRandomClientId()

export const initWebSocketServer = () => {
  debugWebSocket = new WebSocket('ws://localhost:3333')

  debugWebSocket.on('open', function open() {
    sendDebugMessage('info', 'Connected to debug server')
  })

  debugWebSocket.on('close', function close() {
    sendDebugMessage('info', 'Disconnected from debug server')
  })
}

export function sendDebugMessage(type: string, data: string | Record<string, any> | null) {
  if (!debugWebSocket) return

  const message = {
    type: type,
    client_id: clientId,
    source: 'node_dev_server',
    data: data,
  }

  if (debugWebSocket.readyState === WebSocket.OPEN) {
    debugWebSocket.send(JSON.stringify(message))
  } else {
    setTimeout(() => {
      // Try again in 2 seconds
      sendDebugMessage(type, data)
    }, 2000)
  }
}
