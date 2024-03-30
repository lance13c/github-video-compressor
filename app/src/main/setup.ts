import { exec } from 'child_process'
import { BrowserWindow, dialog } from 'electron'
// import { exec } from 'sudo-prompt'

import Store from 'electron-store'
import * as fs from 'fs'
import * as os from 'os'
import path from 'path'
import { sendDebugMessage } from '~/src/main/dev_websockets'

import { makeAppSetup } from '~/src/main/factories'
import { MainWindow } from '~/src/main/windows'
import { INSTALL_STATUS, IPC } from '~/src/shared/constants/ipc'
import { APP_NAME } from '~/src/shared/utils/constant'

// Initialize electron-store
const store = new Store()

const IPC_FFMPEG_STATUS = IPC.WINDOWS.SETUP.FFMPEG_INSTALL_STATUS

function executeCommand(
  command: string,
  logCallbacks?: {
    onLog?: (log: string) => void
    onError?: (error: string) => void
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const execution = exec(command)
    // if (error) {
    //   sendDebugMessage('error', `Error executing command: ${command}`)
    //   reject()
    // } else {
    //   sendDebugMessage('info', 'Command executed successfully')
    //   resolve()
    // }

    // if (stdout) {
    //   sendDebugMessage('info', stdout)
    //   logCallbacks?.onLog?.(stdout)
    // }

    // if (stderr) {
    //   sendDebugMessage('error', stderr)
    //   logCallbacks?.onError?.(stderr)
    // }

    // if (error) {
    //   sendDebugMessage('error', error)
    //   reject()
    // }
    // })

    execution.stdout?.on('data', data => {
      sendDebugMessage('info', data.toString())
      logCallbacks?.onLog?.(`${data.toString()}\n`)
    })

    execution.stderr?.on('data', data => {
      sendDebugMessage('error', `Error: ${data.toString()}`)
      logCallbacks?.onError?.(`Error: ${data.toString()}\n`)
    })

    execution.on('exit', code => {
      if (code === 0 || code === 1 || code === -1) {
        sendDebugMessage('info', 'Command executed successfully')
        resolve()
      } else {
        sendDebugMessage('error', `Error executing command: ${command}`)
        reject()
      }
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
      sendDebugMessage('info', `User selected: ${result.response === 0 ? 'Yes' : 'No'}`)
      return result.response === 0 // Returns true if 'Yes', false otherwise
    })
    .catch(err => {
      sendDebugMessage('error', `Error showing dialog: ${err}`)
      return false // Assume 'No' on error
    })
}

const checkFFmpegInstalled = async (window: BrowserWindow): Promise<boolean> => {
  return executeCommand('ffmpeg -version')
    .then(res => {
      sendDebugMessage('info', 'FFmpeg is already installed')
      window.webContents.send(IPC_FFMPEG_STATUS, INSTALL_STATUS.INSTALLED)
      return true
    })
    .catch(err => {
      sendDebugMessage('error', `Error checking ffmpeg installation: ${err}`)
      window.webContents.send(IPC_FFMPEG_STATUS, INSTALL_STATUS.UNINSTALLED)
      return false
    })
}

const installFFmpegMac = async (window: BrowserWindow) => {
  promptUserForInstallation('ffmpeg is required but not installed. Would you like to install it now?', 'Install ffmpeg')
    .then(async userAgreed => {
      if (userAgreed) {
        await executeCommand('brew install ffmpeg', {
          onLog: mes => {
            sendDebugMessage('info', mes)
            window.webContents.send(IPC_FFMPEG_STATUS, INSTALL_STATUS.INSTALLING)
          },
          onError: mes => {
            sendDebugMessage('error', mes)
            window.webContents.send(IPC_FFMPEG_STATUS, INSTALL_STATUS.FAILED)
          },
        }).catch(error => console.error(error))
        console.log('hit after execution')
        await checkFFmpegInstalled(window)

        return true
      } else {
        sendDebugMessage('info', 'User declined to install ffmpeg')
        return false
      }
    })
    .catch((e: any) => {
      sendDebugMessage('error', `${e?.message}`)
      return false
    })
}

const installFFmpegLinux = async (window: BrowserWindow) => {
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
  return promptUserForInstallation(
    'ffmpeg is required but not installed. Would you like to install it now using Chocolatey?',
    'Install ffmpeg',
  ).then(userAgreed => {
    if (userAgreed) {
      sendDebugMessage('info', 'User agreed to install ffmpeg')
      return executeCommand('choco install ffmpeg -y').catch(error => console.error(error))
    } else {
      sendDebugMessage('info', 'User declined to install ffmpeg')
    }
  })
}

const ALLOWED_PLATFORMS = ['darwin', 'win32', 'linux']

const initFFmpegInstallation = async (window: BrowserWindow) => {
  const platform = os.platform()

  if (!ALLOWED_PLATFORMS.includes(platform)) {
    window.webContents.send(IPC_FFMPEG_STATUS, INSTALL_STATUS.FAILED)

    throw new Error(`Unsupported platform: ${platform}`)
  }

  if (await checkFFmpegInstalled(window)) return

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
      sendDebugMessage('info', `appDataPath: ${appDataPath}`)
      return path.join(appDataPath, 'Google/Chrome/User Data/NativeMessagingHosts')
    } else if (platform === 'darwin') {
      sendDebugMessage('info', `os.homedir(): ${os.homedir()}`)
      return path.join(os.homedir(), `Library/Application\ Support/Google/Chrome/NativeMessagingHosts`)
    } else if (platform === 'linux') {
      sendDebugMessage('info', `os.homedir(): ${os.homedir()}`)
      return path.join(os.homedir(), '.config/google-chrome/NativeMessagingHosts')
    } else {
      sendDebugMessage('error', `Unsupported platform: ${platform}`)
      throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  const manifestPath = getChromeExtensionManifestPath(platform)

  // Check if manifestPath is defined for the current platform
  if (!manifestPath) {
    sendDebugMessage('error', `Platform ${platform} is not supported for Chrome extension manifest setup.`)

    throw new Error(`Platform ${platform} is not supported for Chrome extension manifest setup.`)
  }

  const manifestFile = path.join(manifestPath, `${APP_NAME}.json`)

  if (!fs.existsSync(manifestFile)) {
    sendDebugMessage('info', `Manifest file not found at ${manifestFile}`)
    if (!fs.existsSync(manifestPath)) {
      sendDebugMessage('info', `Creating directory ${manifestPath}`)
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
  mainWindow.webContents.on('did-finish-load', async () => {
    await checkAndCreateChromeExtensionManifest(app)
    await initFFmpegInstallation(mainWindow)
    // The window needs some time to start up
  })
}
