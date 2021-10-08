import React from 'react'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary } from '../../components/Button'
import { HideableAutoColumn, HideableAutoColumnProps } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/hooks'
import { TYPE } from '../../theme'
import { BridgeStatusTag } from './BridgeStatusTag'
import { NETWORK_DETAIL } from '../../constants'

interface BridgeTransactionsSummaryProps extends HideableAutoColumnProps {
  transactions: BridgeTransactionSummary[]
  collectableTx: BridgeTransactionSummary
  filter: boolean
  onCollect: (tx: BridgeTransactionSummary) => void
  onFilter: (filter: boolean) => void
}

export const BridgeTransactionsSummary = ({
  show,
  transactions,
  collectableTx,
  filter,
  onCollect,
  onFilter
}: BridgeTransactionsSummaryProps) => {
  return (
    <HideableAutoColumn show={show}>
      <AdvancedDetailsFooter fullWidth padding="16px">
        <Table>
          <thead>
            <tr>
              <Th>Bridging</Th>
              <Th align="left">From</Th>
              <Th align="left">To</Th>
              <Th align="left">Status</Th>
            </tr>
          </thead>
          <tbody>
            {Object.values(transactions).map((tx, index) => {
              const { assetName, fromChainId, status, toChainId, value, pendingReason } = tx

              return (
                <tr key={index} style={{ lineHeight: '22px' }}>
                  <td>
                    <TYPE.main color="white" fontSize="14px" lineHeight="14px" fontWeight="600">
                      {`${value} ${assetName}`}
                    </TYPE.main>
                  </td>
                  <td align="left">
                    <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
                      {NETWORK_DETAIL[fromChainId].chainName}
                    </TYPE.main>
                  </td>
                  <td align="left">
                    <TYPE.main color="text4" fontSize="10px" lineHeight="12px" paddingLeft="9px">
                      {NETWORK_DETAIL[toChainId].chainName}
                    </TYPE.main>
                  </td>
                  <td align="left">
                    <BridgeStatusTag status={status} pendingReason={pendingReason} onCollect={() => onCollect(tx)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        {collectableTx && (
          <ButtonPrimary onClick={() => onCollect(collectableTx)} mt="12px">
            Collect
          </ButtonPrimary>
        )}
        <ButtonPrimary onClick={() => onFilter(filter)} mt="12px">
          Filter
        </ButtonPrimary>
      </AdvancedDetailsFooter>
    </HideableAutoColumn>
  )
}
