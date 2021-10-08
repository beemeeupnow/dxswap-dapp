import { createAction } from '@reduxjs/toolkit'
import { BridgeNetworkInput } from './reducer'

export const typeInput = createAction<{ typedValue: string }>('bridge/typeInput')
export const selectCurrency = createAction<{ currencyId: string }>('bridge/selectCurrency')
export const swapBridgeNetworks = createAction('bridge/swapNetworks')
export const setToBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setToNetwork')
export const setFromBridgeNetwork = createAction<Partial<BridgeNetworkInput>>('bridge/setFromNetwork')
