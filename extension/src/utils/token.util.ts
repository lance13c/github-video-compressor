export const setToken = (value: string) => {
  chrome.storage.session.set({ token: value }, () => {
    console.log('set token:', value)
    if (chrome.runtime.lastError) {
      console.error(`Error setting token: ${chrome.runtime.lastError}`)
    } else {
      console.log('Token set successfully')
    }
  })
}

export const getToken = async () => {
  return new Promise<string>((resolve, reject) => {
    chrome.storage.session.get(['token'], result => {
      if (chrome.runtime.lastError) {
        reject(`Error getting token: ${chrome.runtime.lastError}`)
      } else {
        if (!result.token) {
          throw new Error(`Error getting auth token`)
        }

        resolve(result.token)
      }
    })
  })
}
