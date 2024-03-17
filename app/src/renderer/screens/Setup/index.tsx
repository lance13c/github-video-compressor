import { Progress } from '@/components/ui/progress'
import { GearIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
// The "App" comes from the context bridge in preload/index.ts
const { App } = window

export function SetupScreen() {
  const navigate = useNavigate()
  const store = useWindowStore().setup
  const [setupProgress, setSetupProgress] = useState(0)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [logs, setLogs] = useState('')

  useEffect(() => {
    console.log('init use effect')
    const removeChannel = App.whenFfmpegInstalling(log => {
      console.log('hit whenFfmpegInstalling')
      console.log(`${log}\n`)
      setLogs(preLogs => `${preLogs}${log}\n`)
    })

    return () => {
      removeChannel()
    }
  }, [])

  return (
    <Container>
      <h2 className="flex items-center">
        <GearIcon className="mr-2" />
        App Setup
      </h2>
      <Progress value={setupProgress} max={100} className="my-4" />
      <div className="flex max-h-[300px] overflow-auto w-full whitespace-break-spaces bg-white/80 border border-gray-200 rounded bg-blend-luminosity">
        <p>{logs}</p>
      </div>

      {/* <p className="text-green-500 flex items-center">
            <CheckIcon className="mr-2" />
            Setup Complete!
          </p> */}
    </Container>
  )
}
