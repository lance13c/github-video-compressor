import React from 'react'
import ReactDom from 'react-dom/client'

import { AppRoutes } from './routes'
import { WindowStoreProvider } from './store'

import { NextUIProvider } from '@nextui-org/react'

import '~/src/resources/styles/globals.sass'

ReactDom.createRoot(document.querySelector('app') as HTMLElement).render(
  <React.StrictMode>
    <WindowStoreProvider>
      <NextUIProvider>
        <AppRoutes />
      </NextUIProvider>
    </WindowStoreProvider>
  </React.StrictMode>,
)
