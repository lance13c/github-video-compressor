import { Progress } from '@/components/ui/progress'
import { CheckIcon, GearIcon } from '@radix-ui/react-icons'
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

  useEffect(() => {
    console.log('init use effect')
    const removeChannel = App.whenFfmpegInstalling(data => {
      console.log('hit whenFfmpegInstalling')
      console.log(data)
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
      <p>Welcome to {App.username}! Let's get you set up.</p>
      <Progress value={setupProgress} max={100} className="my-4" />
      {isSetupComplete ? (
        <>
          <p className="text-green-500 flex items-center">
            <CheckIcon className="mr-2" />
            Setup Complete!
          </p>
        </>
      ) : (
        <p>Setting up...</p>
      )}
    </Container>
  )
}
