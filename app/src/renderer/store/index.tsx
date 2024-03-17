import { createContext, useContext, useState } from 'react'

export interface WindowStore {
  about: {
    isOpen: boolean
    setAboutWindowState: (value: boolean) => void
  }
  setup: {
    isFfmpegInstalled: boolean
    setFfmpegInstalledState: (value: boolean) => void
  }
}

const WindowStoreContext = createContext({} as WindowStore)

export function useWindowStore() {
  return useContext(WindowStoreContext)
}

export function WindowStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    about: { isOpen: false, setAboutWindowState },
    setup: { isFfmpegInstalled: false, setFfmpegInstalledState },
  })

  function setAboutWindowState(value: boolean) {
    setState(state => ({
      ...state,
      about: {
        ...state.about,
        isOpen: value,
      },
    }))
  }

  function setFfmpegInstalledState(value: boolean) {
    setState(state => ({
      ...state,
      setup: {
        ...state.setup,
        isFfmpegInstalled: value,
      },
    }))
  }

  return <WindowStoreContext.Provider value={state}>{children}</WindowStoreContext.Provider>
}
