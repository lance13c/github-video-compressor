import { Progress } from '@nextui-org/react'
import { useEffect, useState } from 'react'
import { Container } from '~/src/renderer/components'
import InstallStatusIcon from '~/src/renderer/components/InstallStatusButton'
import { useWindowStore } from '~/src/renderer/store'
import { INSTALL_STATUS, InstallStatus } from '~/src/shared/constants'
// The "App" comes from the context bridge in preload/index.ts
const { App } = window

export function SetupScreen() {
  const store = useWindowStore().setup
  const [setupProgress, setSetupProgress] = useState(0)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [logs, setLogs] = useState('')
  const [ffmpegInstallStatus, setFfmpegInstallStatus] = useState<InstallStatus>(INSTALL_STATUS.NONE)
  const [ffmpegInstallProgress, setFfmpegInstallProgress] = useState(0)

  useEffect(() => {
    console.log('init use effect')
    const removeChannel = App.onFfmpegInstallStatus(status => {
      setFfmpegInstallStatus(status)
    })

    return () => {
      removeChannel()
    }
  }, [])

  // Fake load until install status = 'installed'
  // Slowing increase the progress bar, non linearly
  useEffect(() => {
    if (ffmpegInstallStatus === INSTALL_STATUS.INSTALLING) {
      const interval = setInterval(() => {
        setFfmpegInstallProgress(progress => {
          if (progress >= 100) {
            clearInterval(interval)
            return 100
          }

          return progress + Math.random() * 10
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [ffmpegInstallStatus])

  return (
    <Container>
      <h2 className="flex items-center">
        {/* <GearIcon className="mr-2" /> */}
        App Setup
      </h2>

      <div className="flex max-h-[300px] overflow-auto w-full whitespace-break-spaces bg-white/80 border border-gray-200 rounded bg-blend-luminosity">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <InstallStatusIcon status={ffmpegInstallStatus} />
            <p>{ffmpegInstallStatus}</p>
          </div>
          <Progress value={setupProgress} minValue={100} maxValue={100} className="my-4" />
        </div>
      </div>

      {/* <p className="text-green-500 flex items-center">
            <CheckIcon className="mr-2" />
            Setup Complete!
          </p> */}
    </Container>
  )
}
