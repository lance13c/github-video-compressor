import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, Container, Heading } from 'renderer/components'
import { useWindowStore } from 'renderer/store'

// The "App" comes from the context bridge in preload/index.ts
const { App } = window

export function MainScreen() {
  const navigate = useNavigate()
  const store = useWindowStore().about

  useEffect(() => {
    App.sayHelloFromBridge()

    // App.whenAboutWindowClose(({ message }) => {
    //   console.log(message)

    //   store.setAboutWindowState(false)
    // })
  }, [])

  function openAboutWindow() {
    // App.createAboutWindow()
    store.setAboutWindowState(true)
  }

  return (
    <Container>
      <Heading>Hi, {App.username || 'there'}! 👋</Heading>

      <h2>It's time to build something awesome! ✨</h2>

      <nav>
        <Button className={store.isOpen ? 'disabled' : ''} onClick={openAboutWindow}>
          Open About Window
        </Button>

        <Button onClick={() => navigate('setupScreen')}>Go to setup screen</Button>
      </nav>
    </Container>
  )
}
