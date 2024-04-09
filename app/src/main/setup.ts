import { exec } from 'child_process'
import { BrowserWindow } from 'electron'

import Store from 'electron-store'
import * as fs from 'fs'
import * as os from 'os'
import path from 'path'
import z from 'zod'
import { sendDebugMessage } from '~/src/main/dev_websockets'

import { makeAppSetup } from '~/src/main/factories'
import { MainWindow } from '~/src/main/windows'
import { INSTALL_STATUS, IPC } from '~/src/shared/constants/ipc'
import { APP_NAME, CHROME_EXTENSION_ID } from '~/src/shared/utils/constant'

// Initialize electron-store
const store = new Store()

const IPC_FFMPEG_STATUS = IPC.WINDOWS.SETUP.FFMPEG_INSTALL_STATUS
const IPC_FFMPEG_PATH = IPC.WINDOWS.SETUP.FFMPEG_PATH

function isExtensionInstalled(extensionId: string): boolean {
  try {
    const profileDirs = getProfileDirectories()

    for (const profileDir of profileDirs) {
      const extensionPath = getExtensionPath(extensionId, profileDir)
      if (fs.existsSync(extensionPath)) {
        return true
      }
    }

    return false
  } catch (e) {
    sendDebugMessage('error', `Error checking extension installation: ${e}`)
    return false
  }
}

function getProfileDirectories(): string[] {
  const profileDirs: string[] = []
  let chromeUserDataDir = ''
  let homeDir = ''
  let localAppData = ''

  switch (process.platform) {
    case 'win32':
      localAppData = process.env.LOCALAPPDATA!
      chromeUserDataDir = path.join(localAppData, 'Google', 'Chrome', 'User Data')
      profileDirs.push(path.join(chromeUserDataDir, 'Default'))
      break
    case 'darwin':
      homeDir = process.env.HOME!
      chromeUserDataDir = path.join(homeDir, 'Library', `Application\ Support`, 'Google', 'Chrome')
      profileDirs.push(path.join(chromeUserDataDir, 'Default'))
      break
    case 'linux':
      homeDir = process.env.HOME!
      chromeUserDataDir = path.join(homeDir, '.config', 'google-chrome')
      profileDirs.push(path.join(chromeUserDataDir, 'Default'))
      break
    default:
      sendDebugMessage('error', `Unsupported platform: ${process.platform}`)
      return profileDirs
  }

  // Check for additional profiles
  const profileDirPattern = /^Profile \d+$/
  const userDataDir = path.dirname(profileDirs[0])
  const additionalProfileDirs = fs.readdirSync(userDataDir).filter(dir => profileDirPattern.test(dir))
  profileDirs.push(...additionalProfileDirs.map(dir => path.join(userDataDir, dir)))

  return profileDirs
}

function getExtensionPath(extensionId: string, profileDir: string): string {
  const extensionDir = path.join(profileDir, 'Extensions', extensionId)

  // Check the default version directory
  try {
    const versionDirs = fs.readdirSync(extensionDir)
    if (versionDirs.length > 0) {
      return path.join(extensionDir, versionDirs[0])
    }
  } catch (e) {
    sendDebugMessage('error', `Error getting extension path: ${e}`)
  }

  return ''
}

function executeCommand(
  command: string,
  logCallbacks?: {
    onLog?: (log: string) => void
    onError?: (error: string) => void
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const execution = exec(command)

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

const checkFFmpegInstalled = async (window: BrowserWindow, path: string): Promise<boolean> => {
  return executeCommand(`${path} -version`)
    .then(res => {
      sendDebugMessage('info', 'FFmpeg is already installed')

      return true
    })
    .catch(err => {
      sendDebugMessage('error', `Error checking ffmpeg installation: ${err}`)
      return false
    })
}

const checkLS = async (window: BrowserWindow): Promise<boolean> => {
  return executeCommand('ls -l')
    .then(res => {
      sendDebugMessage('info', `ls: ` + res)
      return true
    })
    .catch(err => {
      sendDebugMessage('error', `Error checking LS installation: ${err}`)
      return false
    })
}

const ALLOWED_PLATFORMS = ['darwin', 'win32', 'linux']
const getChromeExtensionManifestPath = (app: Electron.App, platform: NodeJS.Platform) => {
  if (!ALLOWED_PLATFORMS.includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  if (platform === 'win32') {
    const appDataPath = app.getPath('appData')
    sendDebugMessage('info', `appDataPath: ${appDataPath}`)
    return path.join(appDataPath, `Google/Chrome/User\ Data/NativeMessagingHosts`)
  } else if (platform === 'darwin') {
    sendDebugMessage('info', `os.homedir(): ${os.homedir()}`)
    return path.join(os.homedir(), `Library/Application\ Support/Google/Chrome/NativeMessagingHosts`)
  } else if (platform === 'linux') {
    sendDebugMessage('info', `os.homedir(): ${os.homedir()}`)
    return path.join(os.homedir(), '.config/google-chrome/NativeMessagingHosts')
  }
}

function checkChromeExtensionManifest(app: Electron.App) {
  const platform = os.platform()
  try {
    const manifestPath = getChromeExtensionManifestPath(app, platform)

    // Check if manifestPath is defined for the current platform
    if (!manifestPath) {
      sendDebugMessage('error', `Platform ${platform} is not supported for Chrome extension manifest setup.`)

      throw new Error(`Platform ${platform} is not supported for Chrome extension manifest setup.`)
    }
    const manifestFile = path.join(manifestPath, `${APP_NAME}.json`)

    return !!fs.existsSync(manifestFile)
  } catch (e) {
    sendDebugMessage('error', `Error checking Chrome extension manifest: ${e}`)
    return false
  }
}

const createManifestFile = (app: Electron.App) => {
  const platform = os.platform()
  const manifestPath = getChromeExtensionManifestPath(app, platform)

  // Check if manifestPath is defined for the current platform
  if (!manifestPath) {
    sendDebugMessage('error', `Platform ${platform} is not supported for Chrome extension manifest setup.`)

    throw new Error(`Platform ${platform} is not supported for Chrome extension manifest setup.`)
  }

  const manifestFile = path.join(manifestPath, `${APP_NAME}.json`)

  sendDebugMessage('info', `Manifest file not found at ${manifestFile}`)
  if (!fs.existsSync(manifestPath)) {
    sendDebugMessage('info', `Creating directory ${manifestPath}`)
    fs.mkdirSync(manifestPath, { recursive: true })
  }
  const sourceManifestPath = path.join(app.getAppPath(), '/src/resources/public', `${APP_NAME}.json`)
  fs.copyFileSync(sourceManifestPath, manifestPath)

  const success = checkChromeExtensionManifest(app)
  if (success) {
    return true
  } else {
    return false
  }
}

const pathSchema = z.string().endsWith('ffmpeg')

export const checkSetup = async (app: Electron.App) => {
  const mainWindow = await makeAppSetup(MainWindow)
  mainWindow.webContents.on('did-finish-load', async () => {
    await checkLS(mainWindow)

    // Path Init
    const path = store.get('ffmpegPath')
    const parsedPath = pathSchema.safeParse(path)
    if (parsedPath.success) {
      const success = await checkFFmpegInstalled(mainWindow, parsedPath.data)
      if (success) {
        mainWindow.webContents.send(IPC_FFMPEG_STATUS, [INSTALL_STATUS.ALREADY_INSTALLED])
        mainWindow.webContents.send(IPC_FFMPEG_PATH, [parsedPath.data])
      }
    }

    // Manifest Init
    if (await checkChromeExtensionManifest(app)) {
      mainWindow.webContents.send(IPC.WINDOWS.SETUP.MANIFEST_STATUS, [INSTALL_STATUS.ALREADY_INSTALLED])
    } else {
      mainWindow.webContents.send(IPC.WINDOWS.SETUP.MANIFEST_STATUS, [INSTALL_STATUS.UNINSTALLED])
    }
    // await initFFmpegInstallation(mainWindow)
    // The window needs some time to start up

    // Check if chrome extension is installed
    if (isExtensionInstalled(CHROME_EXTENSION_ID)) {
      mainWindow.webContents.send(IPC.WINDOWS.SETUP.EXTENSION_STATUS, [INSTALL_STATUS.ALREADY_INSTALLED])
    } else {
      mainWindow.webContents.send(IPC.WINDOWS.SETUP.EXTENSION_STATUS, [INSTALL_STATUS.UNINSTALLED])
    }
  })

  mainWindow.webContents.on('ipc-message', async (event, channel, args) => {
    if (channel === IPC.WINDOWS.SETUP.FFMPEG_PATH) {
      const parsedPath = pathSchema.safeParse(args)
      if (!parsedPath.success) {
        mainWindow.webContents.send(IPC.WINDOWS.SETUP.FFMPEG_INSTALL_STATUS, [
          INSTALL_STATUS.FAILED,
          parsedPath.error.errors.map(e => e.message).join(','),
        ])

        return
      }

      const success = await checkFFmpegInstalled(mainWindow, parsedPath.data)
      if (success) {
        mainWindow.webContents.send(IPC_FFMPEG_STATUS, [INSTALL_STATUS.INSTALLED])
        store.set('ffmpegPath', parsedPath.data)
      } else {
        mainWindow.webContents.send(IPC_FFMPEG_STATUS, [INSTALL_STATUS.FAILED])
      }
    } else if (channel === IPC.WINDOWS.SETUP.ADD_MANIFEST) {
      const success = createManifestFile(app)
      if (success) {
        mainWindow.webContents.send(IPC.WINDOWS.SETUP.MANIFEST_STATUS, [INSTALL_STATUS.INSTALLED])
      } else {
        mainWindow.webContents.send(IPC.WINDOWS.SETUP.MANIFEST_STATUS, [INSTALL_STATUS.FAILED])
      }
    } else if (channel === IPC.WINDOWS.SETUP.VERIFY_EXTENSION) {
      if (isExtensionInstalled(CHROME_EXTENSION_ID)) {
        mainWindow.webContents.send(IPC.WINDOWS.SETUP.EXTENSION_STATUS, [INSTALL_STATUS.INSTALLED])
      } else {
        mainWindow.webContents.send(IPC.WINDOWS.SETUP.EXTENSION_STATUS, [INSTALL_STATUS.FAILED])
      }
    }
  })
}
