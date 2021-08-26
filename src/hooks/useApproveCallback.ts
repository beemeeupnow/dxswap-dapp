import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { Trade, TokenAmount, CurrencyAmount } from '@swapr/sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder, useHasPendingApproval } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin } from '../utils'
import { useTokenContract } from './useContract'
import { useActiveWeb3React } from './index'
import { useNativeCurrency } from './useNativeCurrency'
import { useSwapState } from '../state/swap/hooks'
import useENS from './useENS'
import { BigNumber, constants } from 'ethers'
import useTransactionDeadline from './useTransactionDeadline'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { account } = useActiveWeb3React()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)
  const nativeCurrency = useNativeCurrency()

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === nativeCurrency) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, nativeCurrency, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString())
    })

    return tokenContract
      .approve(spender, useExact ? amountToApprove.raw.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas)
      })
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: 'Approve ' + amountToApprove.currency.symbol,
          approval: { tokenAddress: token.address, spender: spender }
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade) {
  const { account } = useActiveWeb3React()
  const deadline = useTransactionDeadline()
  const { recipient: recipientAddressOrName } = useSwapState()
  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = useMemo(() => (!recipientAddressOrName ? account : recipientAddress), [
    account,
    recipientAddress,
    recipientAddressOrName
  ])
  const [addressToApprove, setAddressToApprove] = useState<string | undefined>()

  const amountToApprove = useMemo(() => (trade ? computeSlippageAdjustedAmounts(trade)[Field.INPUT] : undefined), [
    trade
  ])

  useEffect(() => {
    const fetchAddressToApprove = async () => {
      if (!trade) {
        setAddressToApprove(undefined)
        return
      }
      const swapTransaction = await trade.swapTransaction({
        recipient: recipient || constants.AddressZero,
        ttl: (deadline || BigNumber.from('1')).toNumber()
      })
      setAddressToApprove(swapTransaction.to)
    }
    fetchAddressToApprove()
  })

  return useApproveCallback(amountToApprove, addressToApprove)
}
