import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/fira-code/500.css'
import '@fontsource/fira-code/700.css'
import '@fontsource/fira-mono/500.css'
import '@fontsource/fira-mono/700.css'
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { NetworkContextName } from './constants'
import './i18n'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import MulticallUpdater from './state/multicall/updater'
import FeesUpdater from './state/fees/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import TokenListUpdater from './state/lists/updater'
import MultiChainLinksUpdater from './state/multi-chain-links/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
import getLibrary from './utils/getLibrary'
import { EcoBridgeProvider } from './services/EcoBridge/EcoBridgeProvider'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

if ('ethereum' in window) {
  ;(window.ethereum as any).autoRefreshOnNetworkChange = false
}

window.addEventListener('error', error => {
  console.error(`${error.message} @ ${error.filename}:${error.lineno}:${error.colno}`)
})

function Updaters() {
  return (
    <>
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <FeesUpdater />
      <TokenListUpdater />
    </>
  )
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <EcoBridgeProvider>
            <Updaters />
            <ThemeProvider>
              <ThemedGlobalStyle />
              <HashRouter>
                <MultiChainLinksUpdater />
                <App />
              </HashRouter>
            </ThemeProvider>
          </EcoBridgeProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </StrictMode>,
  document.getElementById('root')
)
