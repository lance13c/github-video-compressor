import { Route, Router } from 'electron-router-dom'

import { AboutScreen, AnotherScreen, InstallChromeExtension, MainScreen } from 'renderer/screens'

export function AppRoutes() {
  return (
    <Router
      main={
        <>
          <Route path="/" element={<MainScreen />} />
          <Route path="/anotherScreen" element={<AnotherScreen />} />
        </>
      }
      about={<Route path="/" element={<AboutScreen />} />}
      installChromeExtension={<Route path="/install-chrome-extension" element={<InstallChromeExtension />} />}
    />
  )
}
