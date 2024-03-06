import { Route, Router } from 'electron-router-dom'

import { InstallChromeExtension, MainScreen, SetupScreen } from 'renderer/screens'

export function AppRoutes() {
  return (
    <Router
      main={
        <>
          <Route path="/" element={<MainScreen />} />
        </>
      }
      setup={<Route path="/setup" element={<SetupScreen />} />}
      installChromeExtension={<Route path="/install-chrome-extension" element={<InstallChromeExtension />} />}
    />
  )
}
