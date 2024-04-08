import { Accordion, AccordionItem, Button, Divider, Input, Link, Snippet } from '@nextui-org/react'
import { useCallback, useEffect, useState } from 'react'
import { FaFile } from 'react-icons/fa'
import { IoExtensionPuzzleOutline } from 'react-icons/io5'
import { TbSquareRoundedNumber1, TbSquareRoundedNumber2, TbSquareRoundedNumber3 } from 'react-icons/tb'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { Container } from '~/src/renderer/components'
import InstallStatusIcon from '~/src/renderer/components/InstallStatusButton'
import { useWindowStore } from '~/src/renderer/store'
import manifestFile from '~/src/resources/public/com.dominic_cicilio.github_video_compressor.json'
import { INSTALL_STATUS, InstallStatus } from '~/src/shared/constants'
import { CHROME_EXTENSION_PUBLICATION_URL } from '~/src/shared/utils/constant'

const { App } = window

export function SetupScreen() {
  const store = useWindowStore().setup
  const [setupProgress, setSetupProgress] = useState(0)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [logs, setLogs] = useState('')
  const [ffmpegInstallStatus, setFfmpegInstallStatus] = useState<InstallStatus>(INSTALL_STATUS.NONE)
  const [ffmpegInstallProgress, setFfmpegInstallProgress] = useState(0)
  const [hasFFmpegPath, setHasFFmpegPath] = useState(false)
  const [ffmpegPath, setFFmpegPath] = useState('')
  const [isVerifyingFFmpegPath, setIsVerifyingFFmpegPath] = useState(false)

  useEffect(() => {
    const removeChannel = App.onFfmpegInstallStatus((_, [status, message = '']) => {
      console.log('status', status)
      console.log('message', message)
      if (status === INSTALL_STATUS.INSTALLED) {
        toast('FFmpeg is successfully linked')
      } else if (status === INSTALL_STATUS.FAILED || status === INSTALL_STATUS.UNINSTALLED) {
        toast(`Invalid ffmpeg path. Please try again. ${message}`, { type: 'error' })
      }

      console.log('status', status)
      setIsVerifyingFFmpegPath(false)
      setFfmpegInstallStatus(status)
    })

    // Init path from store
    const removePathChannel = App.onFfmpegPath((_, path = '') => {
      setFFmpegPath(path)
    })

    return () => {
      removeChannel()
      removePathChannel()
    }
  }, [])

  const handleOnFFmpegPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value
    setFFmpegPath(path)
  }

  const verifyAndSetFFmpegPath = useCallback(() => {
    console.log('verifyAndSetFFmpegPath')
    setIsVerifyingFFmpegPath(true)
    App.setFfmpegPath(ffmpegPath)
  }, [ffmpegPath])

  const autoDetectFFmpegPath = () => {
    // trigger which ffmpeg in terminal and return the path
  }

  return (
    <Container>
      <ToastContainer stacked position="bottom-right" limit={3} newestOnTop />
      <h1 className="flex items-center text-2xl text-gray-800 mb-2">Github Video Compressor Setup</h1>
      <Accordion
        style={{
          paddingLeft: '0px',
          paddingRight: '0px',
        }}
        showDivider={false}
        isCompact>
        <AccordionItem
          key="link"
          aria-label="Link ffmpeg"
          title={
            <div className="flex items-center gap-1">
              <TbSquareRoundedNumber1 />

              <div className="pl-2 relative flex items-center gap-2">
                <p className="font-medium text-sm">Install and Link ffmpeg</p>
                <InstallStatusIcon status={ffmpegInstallStatus} />
              </div>
            </div>
          }>
          <div className="relative flex gap-4 h-fit">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />
            <div className="relative flex flex-col gap-2 pb-2 text-sm text-gray-600  !overflow-visible">
              <p className="text-sm text-gray-600">
                This app uses your installed version of ffmpeg to compress the videos. Please link your ffmpeg below.
              </p>
              <ol>
                <li className="flex items-center min-h-8">
                  <div className="flex items-center gap-2">
                    <TbSquareRoundedNumber1 size={14} />
                    Download ffmpeg from
                  </div>
                  <div className="flex gap-1">
                    <Link className="pl-1" href="https://ffmpeg.org/download.html" size="sm" isExternal showAnchorIcon>
                      Install ffmpeg here
                    </Link>
                  </div>
                </li>
                <li className="flex flex-col gap-2 min-h-8">
                  <div className="flex items-center gap-2">
                    <TbSquareRoundedNumber2 size={14} />
                    Link path to ffmpeg binary
                  </div>
                  <div className="flex items-end gap-2 pl-5">
                    <Input
                      size="sm"
                      variant="faded"
                      placeholder="Link FFmpeg"
                      label="FFmpeg Path"
                      labelPlacement="outside"
                      onChange={handleOnFFmpegPathChange}
                      value={ffmpegPath}
                    />
                    <Button
                      isDisabled={!ffmpegPath || isVerifyingFFmpegPath}
                      isLoading={isVerifyingFFmpegPath}
                      onClick={verifyAndSetFFmpegPath}
                      size="sm"
                      color="primary"
                      variant="solid">
                      Verify
                    </Button>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </AccordionItem>
        <AccordionItem
          key="add-manifest"
          aria-label="Add manifest file"
          title={
            <div className="flex items-center gap-1">
              <TbSquareRoundedNumber2 />

              <div className="pl-2 relative flex items-center gap-2">
                <p className="font-medium text-sm">Add Manifest File</p>
                {/* <InstallStatusIcon status={ffmpegInstallStatus} /> */}
              </div>
            </div>
          }>
          <div className="relative flex gap-4 h-fit">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />
            <div className="relative flex flex-col gap-2 pb-2 text-sm text-gray-600">
              <p className="text-sm text-gray-600">This allows the chrome extension to talk with and boot the app.</p>
              <Button size="sm" color="primary" variant="solid" className="max-w-[200px]">
                Add Manifest File
              </Button>
              <Accordion
                style={{
                  paddingLeft: '0px',
                  paddingRight: '0px',
                }}
                isCompact>
                <AccordionItem
                  key="manifest-file-info"
                  aria-label="manifest-file"
                  title={<span className="text-sm">What file is being added?</span>}>
                  <div className="relative flex gap-4 h-fit">
                    <Divider orientation="vertical" className="ml-[7px] h-auto" />
                    <div className="relative flex flex-col gap-2 pb-2 text-sm ">
                      <p className="text-sm">
                        This adds the{' '}
                        <Link
                          size="sm"
                          href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging">
                          native messaging
                        </Link>{' '}
                        manifest file to the appropriate directory. This allows the chrome extension to talk with and
                        boot the app.
                      </p>
                      <h3 className="text-xs font-semibold flex gap-1 items-baseline">
                        <FaFile size={8} />
                        Manifest File
                      </h3>
                      <Snippet color="primary" hideSymbol>
                        <div className="text-xs whitespace-pre-wrap text-black font-mono select-text">
                          {JSON.stringify(manifestFile, null, 2)}
                        </div>
                      </Snippet>
                    </div>
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </AccordionItem>
        <AccordionItem
          key="install-chrome-extension"
          aria-label="install-chrome-extension"
          title={
            <div className="flex items-center gap-1">
              <TbSquareRoundedNumber3 />

              <div className="pl-2 relative flex items-center gap-2">
                <p className="font-medium text-sm">Install Chrome Extension</p>
                {/* <InstallStatusIcon status={ffmpegInstallStatus} /> */}
              </div>
            </div>
          }>
          <div className="relative flex gap-4 h-fit items-end">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />

            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <p>The last part is to install the chrome extension.</p>

              <Snippet size="sm" color="primary" hideSymbol>
                {CHROME_EXTENSION_PUBLICATION_URL}
              </Snippet>
              <Link color="primary" href={CHROME_EXTENSION_PUBLICATION_URL} size="sm" isExternal showAnchorIcon>
                Install Chrome Extension
              </Link>
              <IoExtensionPuzzleOutline className="b-0 text-primary-300/20" size={70} />
            </div>
          </div>
        </AccordionItem>
      </Accordion>
    </Container>
  )
}
