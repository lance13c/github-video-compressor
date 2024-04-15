import { Accordion, AccordionItem, Button, Divider, Input, Link, Snippet, Tooltip } from '@nextui-org/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FaFile } from 'react-icons/fa'
import { IoExtensionPuzzleOutline, IoInformationCircleOutline } from 'react-icons/io5'
import { TbSquareRoundedNumber1, TbSquareRoundedNumber2, TbSquareRoundedNumber3 } from 'react-icons/tb'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { Container } from '~/src/renderer/components'
import StatusIcon from '~/src/renderer/components/StatusIcon'
import manifestFile from '~/src/resources/public/com.dominic_cicilio.github_video_compressor.json'
import { INSTALL_STATUS, InstallStatus } from '~/src/shared/constants'
import { CHROME_EXTENSION_PUBLICATION_URL } from '~/src/shared/utils/constant'

const { App } = window

export function SetupScreen() {
  const [ffmpegInstallStatus, setFfmpegInstallStatus] = useState<InstallStatus>(INSTALL_STATUS.NONE)
  const [extensionInstallStatus, setExtensionInstallStatus] = useState<InstallStatus>(INSTALL_STATUS.NONE)
  const [ffmpegPath, setFFmpegPath] = useState('')
  const [isVerifyingFFmpegPath, setIsVerifyingFFmpegPath] = useState(false)
  const [manifestInstallStatus, setManifestInstallStatus] = useState<InstallStatus>(INSTALL_STATUS.NONE)

  useEffect(() => {
    const removeChannel = App.onFfmpegInstallStatus((_, [status, message = '']) => {
      if (status === INSTALL_STATUS.INSTALLED) {
        toast('FFmpeg is successfully linked')
      } else if (status === INSTALL_STATUS.FAILED || status === INSTALL_STATUS.UNINSTALLED) {
        toast(`Invalid ffmpeg path. Please try again. ${message}`, { type: 'error' })
      }

      setIsVerifyingFFmpegPath(false)
      setFfmpegInstallStatus(status)
    })

    // Init path from store
    const removePathChannel = App.onFfmpegPath((_, path = '') => {
      setFFmpegPath(path)
    })

    // Init manifest status
    const removeManifestChannel = App.onManifestInstallStatus((_, [status, message = '']) => {
      if (status === INSTALL_STATUS.INSTALLED) {
        toast('Manifest file is successfully added')
      } else if (status === INSTALL_STATUS.FAILED) {
        toast(`Failed to add manifest file. ${message}`, { type: 'error' })
      }

      setManifestInstallStatus(status)
    })

    // Init extension status
    const removeExtensionChannel = App.onExtensionInstallStatus((_, [status, message = '']) => {
      setExtensionInstallStatus(status)
    })

    return () => {
      removeChannel()
      removePathChannel()
      removeManifestChannel()
      removeExtensionChannel()
    }
  }, [])

  const handleOnFFmpegPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value
    setFFmpegPath(path)
  }

  const verifyAndSetFFmpegPath = useCallback(() => {
    setIsVerifyingFFmpegPath(true)
    App.setFfmpegPath(ffmpegPath)
  }, [ffmpegPath])

  const verifyChromeExtensionIsInstalled = useCallback(() => {
    App.verifyChromeExtensionIsInstalled()
  }, [])

  const everythingIsInstalled = useMemo(
    () =>
      (ffmpegInstallStatus === INSTALL_STATUS.INSTALLED || ffmpegInstallStatus === INSTALL_STATUS.ALREADY_INSTALLED) &&
      (extensionInstallStatus === INSTALL_STATUS.INSTALLED ||
        extensionInstallStatus === INSTALL_STATUS.ALREADY_INSTALLED) &&
      (manifestInstallStatus === INSTALL_STATUS.INSTALLED ||
        manifestInstallStatus === INSTALL_STATUS.ALREADY_INSTALLED),
    [ffmpegInstallStatus, extensionInstallStatus, manifestInstallStatus],
  )

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
                <StatusIcon status={ffmpegInstallStatus} />
              </div>
            </div>
          }>
          <div className="relative flex gap-4 h-fit">
            <Divider orientation="vertical" className="ml-[7px] h-auto" />
            <div className="relative flex flex-col gap-2 pb-2 text-sm text-gray-600  !overflow-visible">
              <p className="text-sm text-gray-600">
                This app uses your installed version of ffmpeg to compress the videos. Please link your ffmpeg below.
              </p>
              <ol className="flex flex-col gap-4">
                <li className="flex items-start min-h-8">
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex gap-2">
                      <TbSquareRoundedNumber1 size={14} />
                      Download and install ffmpeg.
                    </div>
                    <div className="flex flex-col pl-5 text-sm gap-1">
                      <Snippet color="primary" size="sm">
                        brew install ffmpeg
                      </Snippet>
                      <span>
                        or
                        <Link
                          className="pl-1"
                          href="https://ffmpeg.org/download.html"
                          size="sm"
                          isExternal
                          showAnchorIcon>
                          Install ffmpeg here
                        </Link>
                      </span>
                    </div>
                  </div>
                </li>
                <li className="flex flex-col gap-2 min-h-8">
                  <div className="flex items-center gap-2">
                    <TbSquareRoundedNumber2 size={14} />
                    Link path to ffmpeg binary
                  </div>
                  <div className="flex pl-5 gap-2 items-center">
                    <Tooltip content="Pro tip" className="text-black">
                      <div>
                        <IoInformationCircleOutline size={18} />
                      </div>
                    </Tooltip>
                    Use
                    <Snippet color="primary" size="sm">
                      which ffmpeg
                    </Snippet>{' '}
                    to grab the path from the terminal.
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
                <StatusIcon status={manifestInstallStatus} />
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
                <StatusIcon status={extensionInstallStatus} />
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
              <Button
                onClick={verifyChromeExtensionIsInstalled}
                size="sm"
                color="primary"
                variant="solid"
                className="max-w-[200px]">
                Verify
              </Button>
              <IoExtensionPuzzleOutline className="b-0 text-primary-300/20" size={70} />
            </div>
          </div>
        </AccordionItem>
      </Accordion>
      {everythingIsInstalled && (
        <div className="text-gray-800 text-sm flex flex-col gap-2 max-w-[60%] rounded-lg">
          <p>Congrats everything is installed 🎉</p>
          <p className="font-semibold">You must close the application for the compressing to work.</p>
          <p>
            This will now compress videos 50Mb and greater when attaching them to Github pull requests. The application
            will only run when the chrome extension needs it.
          </p>
        </div>
      )}
    </Container>
  )
}
