import React from 'react'
import ReactDom from 'react-dom/client'

import { AppRoutes } from './routes'
import { WindowStoreProvider } from './store'

import 'resources/styles/globals.sass'

ReactDom.createRoot(document.querySelector('app') as HTMLElement).render(
  <React.StrictMode>
    <WindowStoreProvider>
      <AppRoutes />
    </WindowStoreProvider>
  </React.StrictMode>,
)
