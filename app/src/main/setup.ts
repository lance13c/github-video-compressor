import { exec } from 'child_process'
import { BrowserWindow, dialog } from 'electron'
import Store from 'electron-store'
import * as fs from 'fs'
import { sendDebugMessage } from 'main/dev_websockets'
import * as os from 'os'
import * as path from 'path'
import { APP_NAME } from 'shared/utils/constant'

// Initialize electron-store
const store = new Store()

function executeCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        sendDebugMessage(`error`, `Error executing command: ${error}`)
        reject(error)
        return
      }
      sendDebugMessage('info', `Command executed successfully: ${stdout}`)
      resolve()
    })
  })
}

const promptUserForInstallation = (message: string, title: string): Promise<boolean> => {
  return dialog
    .showMessageBox({
      type: 'question',
      buttons: ['Yes', "No, I'll do it myself"],
      defaultId: 0,
      title: title,
      message: message,
    })
    .then(result => {
      return result.response === 0 // Returns true if 'Yes', false otherwise
    })
    .catch(err => {
      sendDebugMessage('error', `Error showing dialog: ${err}`)
      return false // Assume 'No' on error
    })
}

const checkFFmpegInstalled = (): Promise<boolean> => {
  return executeCommand('ffmpeg -version')
    .then(() => true) // ffmpeg is installed
    .catch(() => false) // ffmpeg is not installed
}

const installFFmpegMac = async () => {
  const isInstalled = await checkFFmpegInstalled()
  if (isInstalled) return

  promptUserForInstallation('ffmpeg is required but not installed. Would you like to install it now?', 'Install ffmpeg')
    .then(userAgreed => {
      if (userAgreed) {
        executeCommand('brew install ffmpeg').catch(error => console.error(error))
        return true
      } else {
        sendDebugMessage('info', 'User declined to install ffmpeg')
        return false
      }
    })
    .catch(() => {
      return false
    })
}

const installFFmpegLinux = async () => {
  const isInstalled = await checkFFmpegInstalled()
  if (isInstalled) return

  promptUserForInstallation(
    'ffmpeg is required but not installed. Would you like to install it now?',
    'Install ffmpeg',
  ).then(userAgreed => {
    if (userAgreed) {
      executeCommand('sudo apt update && sudo apt install -y ffmpeg').catch(error => console.error(error))
    } else {
      sendDebugMessage('info', 'User declined to install ffmpeg')
    }
  })
}

const installFFmpegWindows = async () => {
  const isInstalled = await checkFFmpegInstalled()
  if (isInstalled) return

  return promptUserForInstallation(
    'ffmpeg is required but not installed. Would you like to install it now using Chocolatey?',
    'Install ffmpeg',
  ).then(userAgreed => {
    if (userAgreed) {
      return executeCommand('choco install ffmpeg -y').catch(error => console.error(error))
    } else {
      sendDebugMessage('info', 'User declined to install ffmpeg')
    }
  })
}

const initFFmpegInstallation = async () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin':
      return await installFFmpegMac()
    case 'win32':
      return await installFFmpegWindows()
    case 'linux':
      return await installFFmpegLinux()
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

function checkAndCreateChromeExtensionManifest(app: Electron.App) {
  const platform = os.platform()

  const chromeExtensionManifestPath: Partial<Record<NodeJS.Platform, string>> = {
    win32: path.join(process.env.APPDATA!, 'Google/Chrome/User Data/Default/Extensions'),
    darwin: path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default/Extensions'),
    linux: path.join(os.homedir(), '.config/google-chrome/Default/Extensions'),
  }

  const manifestPath = chromeExtensionManifestPath[platform]

  // Check if manifestPath is defined for the current platform
  if (!manifestPath) {
    console.error(`Platform ${platform} is not supported for Chrome extension manifest setup.`)

    throw new Error(`Platform ${platform} is not supported for Chrome extension manifest setup.`)
  }

  const manifestFile = path.join(manifestPath, `${APP_NAME}.json`)

  if (!fs.existsSync(manifestFile)) {
    if (!fs.existsSync(manifestPath)) {
      fs.mkdirSync(manifestPath, { recursive: true })
    }
    const sourceManifestPath = path.join(app.getAppPath(), 'resources', 'manifest.json')
    fs.copyFileSync(sourceManifestPath, manifestFile)
    return true
  } else {
    return false
  }
}

const isFirstRun = (): boolean => {
  // Check if 'firstRun' key exists
  if (store.get('firstRun') === undefined) {
    // Set 'firstRun' to false since we're running the app for the first time
    store.set('firstRun', false)
    return true
  }
  return false
}

const showSplashScreen = () => {
  let splashWindow: BrowserWindow | null = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  splashWindow.loadFile('.') // Adjust the path as necessary

  splashWindow.on('closed', () => (splashWindow = null))
}

export const checkSetup = async (app: Electron.App) => {
  await checkAndCreateChromeExtensionManifest(app)
  await initFFmpegInstallation()

  isFirstRun() ? showSplashScreen() : null
}
