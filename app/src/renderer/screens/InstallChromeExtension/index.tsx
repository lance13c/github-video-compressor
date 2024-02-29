import { useEffect } from 'react'

import { Container, Heading } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { CHROME_EXTENSION_PUBLICATION_URL } from 'shared/utils/constant'

const { App } = window

export function InstallChromeExtension() {
  const store = useWindowStore().about

  useEffect(() => {
    App.whenAboutWindowClose(() => {
      store.setAboutWindowState(false)
    })
  }, [])

  return (
    <Container>
      <Heading>Install the Chrome Extension</Heading>

      <link href={CHROME_EXTENSION_PUBLICATION_URL}>Go To Chrome Extension Install Page</link>
    </Container>
  )
}
