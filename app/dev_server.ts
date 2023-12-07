import { ChildProcess, exec } from 'child_process';
import chokidar from 'chokidar';
import { promisify } from 'util';
import WebSocket from 'ws';

const execAsync = promisify(exec);
const wss = new WebSocket.Server({ port: 3333 });
let buildProcess: ChildProcess | null = null;


// Broadcast message to all clients
const broadcast = (message: string): void => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', (message: string) => {
        try {
            const parsedMessage = JSON.parse(message);
            console.log('Received:', parsedMessage.data);
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const runBuild = async () => {
    // Kill existing build process if it's running
    if (buildProcess && !buildProcess.killed) {
        buildProcess.kill();
    }

    // Start a new build process
    try {
      const { stdout, stderr } = await execAsync('electron-vite build');
      
        !!stdout && console.log(`stdout: ${stdout}`);
        !!stderr && console.error(`stderr: ${stderr}`);

        // Notify clients to refresh
        broadcast('refresh');
    } catch (e) {
      // @ts-ignore
      console.error(`exec error: ${e?.message}`);
    }
};


console.info('WebSocket server running on ws://localhost:3333');

// Watch 'src' directory for changes
runBuild();
console.info('Building WebSocket server');
console.info(`Watching 'src' directory for changes...`);
chokidar.watch('./src').on('all', (event, path) => {
    if (event !== 'change') return;
    console.info(`File ${path} has been ${event}`);
    runBuild();
});

