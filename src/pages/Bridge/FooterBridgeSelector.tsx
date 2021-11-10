import React, { useState } from 'react'
import styled from 'styled-components'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ShowMoreButton } from '../../components/Button'
import { HideableAutoColumn } from '../../components/Column'
import { Table, Th } from '../../components/Table'
import { BridgeOption } from './BridgeOption'

interface FooterBridgeSelectorProps {
  show: boolean
  selectedBridge: string
  onBridgeChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const StyledTable = styled(Table)`
  border-spacing: 0 8px;
`

const Footer = styled(AdvancedDetailsFooter)`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  box-shadow: none;
`

const StyledHideableAutoColumn = styled(HideableAutoColumn)`
  display: flex;
  justify-content: center;
  width: 100%;
`

const bridges = [
  {
    name: 'Swapr Fast Exit',
    fee: 0.1,
    gas: 11,
    time: '~ 1 min'
  },
  {
    name: 'Connext',
    fee: 0.15,
    gas: 13,
    time: '10 min'
  },
  {
    name: 'Hopper',
    fee: 0.3,
    gas: 15,
    time: '12 min'
  },
  {
    name: 'Arbitrum Bridge',
    fee: 0.03,
    gas: 9,
    time: '6 days'
  },
  {
    name: 'Swapr Fast Exit 2',
    fee: 0.1,
    gas: 11,
    time: '~ 1 min'
  },
  {
    name: 'Connext 2',
    fee: 0.15,
    gas: 13,
    time: '10 min'
  },
  {
    name: 'Hopper 2',
    fee: 0.3,
    gas: 15,
    time: '12 min'
  },
  {
    name: 'Arbitrum Bridge 2',
    fee: 0.03,
    gas: 9,
    time: '6 days'
  }
]

export const FooterBridgeSelector = ({ show, selectedBridge, onBridgeChange }: FooterBridgeSelectorProps) => {
  const [showMore, setShowMore] = useState(false)
  const bridgesAmount = bridges.length
  const isAllItemsVisible = showMore || bridgesAmount <= 4
  const numberOfItems = isAllItemsVisible ? bridgesAmount : 4

  return (
    <StyledHideableAutoColumn show={show}>
      <Footer fullWidth padding="0">
        <StyledTable>
          <thead>
            <tr>
              <Th>Bridge</Th>
              <Th align="right">Fee</Th>
              <Th align="right">Gas</Th>
              <Th align="right">Time</Th>
            </tr>
          </thead>
          <tbody>
            {bridges.slice(0, numberOfItems).map((bridge, index) => {
              const { name, fee, gas, time } = bridge

              return (
                <BridgeOption
                  key={index}
                  checked={selectedBridge === name}
                  label={name}
                  value={name}
                  onChange={onBridgeChange}
                  fee={fee}
                  gas={gas}
                  time={time}
                />
              )
            })}
          </tbody>
        </StyledTable>
        {!isAllItemsVisible && (
          <ShowMoreButton isOpen={isAllItemsVisible} onClick={() => setShowMore(true)}>
            +{bridgesAmount - numberOfItems} more bridges
          </ShowMoreButton>
        )}
      </Footer>
    </StyledHideableAutoColumn>
  )
}
