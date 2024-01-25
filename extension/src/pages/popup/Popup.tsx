import logo from '@assets/img/icon-32.png'
import '@pages/popup/Popup.css'
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary'
import withSuspense from '@src/shared/hoc/withSuspense'
import useStorage from '@src/shared/hooks/useStorage'
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage'

const Popup = () => {
  const theme = useStorage(exampleThemeStorage)

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-logo">
          <img src={logo} alt="logo" />
        </div>
        <p>Github Video Compressor</p>
      </header>
    </div>
  )
}

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>)
