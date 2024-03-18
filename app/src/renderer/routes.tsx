import { Route, Router } from 'electron-router-dom'

import { MainScreen, SetupScreen } from '~/src/renderer/screens'

export function AppRoutes() {
  return (
    <Router
      main={
        <>
          <Route path="/" element={<SetupScreen />} />
          <Route path="/main" element={<MainScreen />} />
        </>
      }
    />
  )
}
