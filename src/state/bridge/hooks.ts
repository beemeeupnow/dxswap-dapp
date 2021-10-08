import { ChainId, Currency } from '@swapr/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { selectCurrency, typeInput, setFromBridgeNetwork, setToBridgeNetwork, swapBridgeNetworks } from './actions'
import { currencyId } from '../../utils/currencyId'
import { tryParseAmount } from '../swap/hooks'

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useBridgeActionHandlers(): {
  onCurrencySelection: (currency: Currency | string) => void
  onUserInput: (typedValue: string) => void
  onFromNetworkChange: (chainId: ChainId) => void
  onToNetworkChange: (chainId: ChainId) => void
  onSwapBridgeNetworks: () => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const { fromNetwork, toNetwork } = useBridgeState()

  const onFromNetworkChange = useCallback(
    (chainId: ChainId) => {
      if (chainId === toNetwork.chainId) {
        dispatch(swapBridgeNetworks())
        return
      }
      dispatch(
        setFromBridgeNetwork({
          chainId: chainId
        })
      )
    },
    [dispatch, toNetwork.chainId]
  )

  const onToNetworkChange = useCallback(
    (chainId: ChainId) => {
      if (chainId === fromNetwork.chainId) {
        dispatch(swapBridgeNetworks())
        return
      }
      dispatch(
        setToBridgeNetwork({
          chainId: chainId
        })
      )
    },
    [dispatch, fromNetwork.chainId]
  )

  const onSwapBridgeNetworks = useCallback(() => {
    dispatch(swapBridgeNetworks())
  }, [dispatch])

  const onCurrencySelection = useCallback(
    (currency: Currency | string) => {
      dispatch(
        selectCurrency({
          currencyId: currency instanceof Currency ? currencyId(currency) : currency
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ typedValue }))
    },
    [dispatch]
  )

  // const bridgeTransactionsSummary = useBridgeTransactionsSummary()

  // const onToggleTxsFilter = useCallback(
  //   (filter: boolean) => {
  //     dispatch(filterTxsList())

  //     const passed24h = new Date().getTime() - 1000 * 60 * 60 * 24

  //     if (filter) {
  //       return bridgeTransactionsSummary.filter(summary => {
  //         if (!summary.timestampResolved) return true
  //         return summary.timestampResolved >= passed24h
  //       })
  //     } else return bridgeTransactionsSummary
  //   },
  //   [bridgeTransactionsSummary, dispatch]
  // )

  return {
    onCurrencySelection,
    onUserInput,
    onFromNetworkChange,
    onToNetworkChange,
    onSwapBridgeNetworks
  }
}

export function useBridgeInfo() {
  const { account, chainId } = useActiveWeb3React()
  const { typedValue, currencyId, fromNetwork, toNetwork } = useBridgeState()

  const bridgeCurrency = useCurrency(currencyId)
  const parsedAmount = tryParseAmount(typedValue, bridgeCurrency ?? undefined, chainId)

  const [currencyBalance] = useCurrencyBalances(account ?? undefined, [bridgeCurrency ?? undefined])

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter amount'
  }

  if (!bridgeCurrency) {
    inputError = inputError ?? 'Select a token'
  }

  if (currencyBalance && parsedAmount && currencyBalance.lessThan(parsedAmount)) {
    inputError = 'Insufficient ' + parsedAmount.currency.symbol + ' balance'
  }

  return {
    bridgeCurrency,
    currencyBalance,
    parsedAmount,
    inputError,
    typedValue,
    fromNetwork,
    toNetwork
  }
}
