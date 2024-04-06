import { Accordion, AccordionItem, Divider, Input, Link } from '@nextui-org/react'
import { useEffect, useState } from 'react'
import { TbSquareRoundedNumber1, TbSquareRoundedNumber2, TbSquareRoundedNumber3 } from 'react-icons/tb'
import { Container } from '~/src/renderer/components'
import InstallStatusIcon from '~/src/renderer/components/InstallStatusButton'
import { useWindowStore } from '~/src/renderer/store'
import { INSTALL_STATUS, InstallStatus } from '~/src/shared/constants'
import { CHROME_EXTENSION_PUBLICATION_URL } from '~/src/shared/utils/constant'

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
      <h1 className="flex items-center text-2xl text-gray-800 mb-2">App Setup</h1>
      <Accordion showDivider={false} isCompact>
        <AccordionItem
          key="link"
          aria-label="Link ffmpeg"
          title={
            <div className="flex items-center gap-1">
              <TbSquareRoundedNumber1 />

              <div className="pl-2 relative flex items-center gap-2">
                <p className="font-medium text-sm">Installation</p>
                <InstallStatusIcon status={ffmpegInstallStatus} />
              </div>
            </div>
          }>
          <div className="relative flex gap-4 h-fit">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />
            <div className="relative flex flex-col gap-2 pb-2 text-sm text-gray-600  !overflow-visible">
              <ol>
                <li className="list-item">
                  Download ffmpeg if it is not already installed.{' '}
                  <Link href="https://ffmpeg.org/download.html" size="sm" isExternal showAnchorIcon>
                    Install ffmpeg here
                  </Link>
                </li>
                <li>Link ffmpeg</li>
                <li>Install Chrome Extension</li>
              </ol>

              <p className="text-sm text-gray-600">
                We use your installed version of ffmpeg to compress the videos. Please link your ffmpeg
              </p>
              <Input variant="faded" placeholder="Link ffmpeg" />
            </div>
          </div>
        </AccordionItem>
        <AccordionItem
          key="add-manifest"
          aria-label="Add manifest file"
          title={
            <div className="flex items-center gap-1">
              <TbSquareRoundedNumber2 />

              <p className="font-medium text-sm">Add Manifest File</p>
              <InstallStatusIcon status={ffmpegInstallStatus} />
            </div>
          }>
          <div className="relative flex gap-4 h-fit">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />
            <div className="relative flex flex-col gap-2 pb-2 text-sm text-gray-600  !overflow-visible">
              <p className="text-sm text-gray-600">Allows the chrome extension to talk with app.</p>
            </div>
          </div>
        </AccordionItem>
        <AccordionItem
          key="install-chrome-extension"
          aria-label="install-chrome-extension"
          title={
            <div className="flex items-center gap-1">
              <TbSquareRoundedNumber3 />

              <p className="font-medium text-sm">Install Chrome Extension</p>
              <InstallStatusIcon status={ffmpegInstallStatus} />
            </div>
          }>
          <div className="relative flex gap-4 h-fit">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />

            <div className="text-sm text-gray-600">
              <p>Install Chrome Extension</p>
              <Link color="secondary" href={CHROME_EXTENSION_PUBLICATION_URL} size="sm" isExternal showAnchorIcon>
                Get Chrome Extension
              </Link>
            </div>
          </div>
        </AccordionItem>
      </Accordion>
    </Container>
  )
}
