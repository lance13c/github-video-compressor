import { exec } from 'child_process'
import { BrowserWindow, dialog } from 'electron'
import Store from 'electron-store'
import * as fs from 'fs'
import { sendDebugMessage } from 'main/dev_websockets'
import * as os from 'os'
import path from 'path'

import { makeAppSetup } from 'main/factories'
import { MainWindow } from 'main/windows'
import { IPC } from 'shared/constants/ipc'
import { APP_NAME } from 'shared/utils/constant'

// Initialize electron-store
const store = new Store()

const IPC_FFMPEG_INSTALLING = IPC.WINDOWS.SETUP.FFMPEG_INSTALLING

function executeCommand(command: string, log?: (log: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log?.(`Error executing command: ${error}`)
        console.error(`error`, `Error executing command: ${error}`)
        reject(error)
        return
      }

      log?.(`Command executed successfully: ${stdout}`)
      console.log('info', `Command executed successfully: ${stdout}`)
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

const checkFFmpegInstalled = (window?: BrowserWindow): Promise<boolean> => {
  return executeCommand('ffmpeg -version')
    .then(() => true) // ffmpeg is installed
    .catch(() => false) // ffmpeg is not installed
}

const installFFmpegMac = async (window: BrowserWindow) => {
  console.log('hit installFFmpegMac')
  const isInstalled = await checkFFmpegInstalled()
  if (isInstalled) {
    console.log('--------------- installed')
    await window.webContents.send(IPC_FFMPEG_INSTALLING, 'FFmpeg already installed')

    return
  }

  console.log('FFMpeg not already installed on Mac')

  promptUserForInstallation('ffmpeg is required but not installed. Would you like to install it now?', 'Install ffmpeg')
    .then(userAgreed => {
      if (userAgreed) {
        executeCommand('brew install ffmpeg', log => {
          window.webContents.send(log)
        }).catch(error => console.error(error))
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

const installFFmpegLinux = async (window: BrowserWindow) => {
  const isInstalled = await checkFFmpegInstalled()
  if (isInstalled) {
    window.webContents.send('FFmpeg already installed')

    return
  }

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

const installFFmpegWindows = async (window: BrowserWindow) => {
  const isInstalled = await checkFFmpegInstalled()
  if (isInstalled) {
    // Update storage that is already installed
    window.webContents.send('FFmpeg already installed')
    return
  }

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

const initFFmpegInstallation = async (window: BrowserWindow) => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin':
      return await installFFmpegMac(window)
    case 'win32':
      return await installFFmpegWindows(window)
    case 'linux':
      return await installFFmpegLinux(window)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

function checkAndCreateChromeExtensionManifest(app: Electron.App) {
  const platform = os.platform()

  const getChromeExtensionManifestPath = (platform: NodeJS.Platform) => {
    if (platform === 'win32') {
      const appDataPath = app.getPath('appData')
      return path.join(appDataPath, 'Google/Chrome/User Data/NativeMessagingHosts')
    } else if (platform === 'darwin') {
      return path.join(os.homedir(), `Library/Application\ Support/Google/Chrome/NativeMessagingHosts`)
    } else if (platform === 'linux') {
      return path.join(os.homedir(), '.config/google-chrome/NativeMessagingHosts')
    } else {
      throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  const manifestPath = getChromeExtensionManifestPath(platform)

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
    const sourceManifestPath = path.join(app.getAppPath(), '/src/resources/public', `${APP_NAME}.json`)
    fs.copyFileSync(sourceManifestPath, manifestPath)
    return true
  } else {
    return false
  }
}

// /Users/dominic.cicilio/Documents/repos/github-video-compressor/app/src/resources/public/com.dominic_cicilio.github_video_compressor.json
// /Users/dominic.cicilio/Documents/repos/github-video-compressor/app/src/resources/public/com.dominic_cicilio.github_video_compressor.json
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

  splashWindow.on('closed', () => (splashWindow = null))
}

export const checkSetup = async (app: Electron.App) => {
  console.log('hit checkSetup')
  const mainWindow = await makeAppSetup(MainWindow)
  await setTimeout(async () => {
    await checkAndCreateChromeExtensionManifest(app)
    await initFFmpegInstallation(mainWindow)
  }, 1000)
}
