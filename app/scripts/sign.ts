import { exec } from 'child_process'
import { displayName, version } from '../package.json'

const appName = displayName.replace(/\s+/g, '') // Replace spaces in the display name
const appPath = `./dist/v${version}/mac-arm64/${appName}.app`

const signApp = () => {
  const command = `electron-osx-sign "${appPath}" --identity='Developer ID Application' --no-gatekeeper-assess`

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`)
      return
    }
    console.log(`Output: ${stdout}`)
  })
}

signApp()
