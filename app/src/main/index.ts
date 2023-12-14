import { app } from 'electron';
import WebSocket from 'ws';

import { NativeMessagingHost } from '../shared/utils/nativeMessagingHost';
import { makeAppWithSingleInstanceLock } from './factories';
import { registerAboutWindowCreationByIPC } from './windows';

const debugWebSocket = new WebSocket('ws://localhost:3333');
const clientId = generateRandomClientId();

function generateRandomClientId() {
  const colors = ["red", "blue", "green", "yellow", "pink", "black", "white", "purple", "orange", "brown"];
  const animals = ["lion", "tiger", "bear", "flamingo", "eagle", "dolphin", "shark", "wolf", "fox", "deer"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${color} ${animal}`;
}

function sendDebugMessage(type: string, data: string) {
  const message = {
    type: type,
    client_id: clientId,
    source: 'node_dev_server',
    data: data
  };

  if (debugWebSocket.readyState === WebSocket.OPEN) {
    debugWebSocket.send(JSON.stringify(message));
  }
}


debugWebSocket.on('open', function open() {
  sendDebugMessage('info', 'Connected to debug server');
});

debugWebSocket.on('close', function close() {
  sendDebugMessage('info', 'Disconnected from debug server');
});

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  try {
    // console.log('ad--------------------------f', tempIcon)
    const nativeMessagingHost = new NativeMessagingHost();

    nativeMessagingHost.addListener((data) => {
      sendDebugMessage('nativeMessagingHostData', data.toString());
    });

    // process.stdin.on('data', (data) => {
    //   sendDebugMessage('stdinData', data.toString());
    //   // Rest of your onDataReceived logic
    // });

    // console.log(JSON.stringify({test: '123abc'}))
    nativeMessagingHost.sendMessage({ text: 'Init ping' });
    let count = 1;
    const sendInterval = setInterval(() => {
      sendDebugMessage('info', `ping-${count}`);
      nativeMessagingHost.sendMessage({ text: `v3-ping-${count}` });
      // // SEnd this in stdin  { text: `console-${count}` }
      // const message = Buffer.from(JSON.stringify({ text: `console-${count}` }));
      // process.stdout.write(message);
      // console.log('test-ping')
      count += 1;
    }, 4000);

    process.stdin.on('end', () => {
      console.log('stdin closed, shutting down Electron app');
      sendDebugMessage('info', 'stdin closed, shutting down Electron app');
      clearInterval(sendInterval);
      app.quit();
    });

    registerAboutWindowCreationByIPC();
  } catch (e) {
    console.error('app error:', e);
    // @ts-ignore
    sendDebugMessage('error', e?.message || 'unknown');
  }
});
