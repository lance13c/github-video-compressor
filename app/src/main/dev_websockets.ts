import WebSocket from 'ws'

const debugWebSocket = new WebSocket('ws://localhost:3333')

function generateRandomClientId() {
  const colors = ['red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'purple', 'orange', 'brown']
  const animals = ['lion', 'tiger', 'bear', 'flamingo', 'eagle', 'dolphin', 'shark', 'wolf', 'fox', 'deer']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${color} ${animal}`
}

const clientId = generateRandomClientId()

export function sendDebugMessage(type: string, data: string | Record<string, any> | null) {
  const message = {
    type: type,
    client_id: clientId,
    source: 'node_dev_server',
    data: data,
  }

  if (debugWebSocket.readyState === WebSocket.OPEN) {
    debugWebSocket.send(JSON.stringify(message))
  }
}

debugWebSocket.on('open', function open() {
  sendDebugMessage('info', 'Connected to debug server')
})

debugWebSocket.on('close', function close() {
  sendDebugMessage('info', 'Disconnected from debug server')
})
