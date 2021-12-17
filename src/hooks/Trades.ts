import { Currency, CurrencyAmount, Pair, UniswapV2RoutablePlatform, Token, UniswapV2Trade, Percent } from '@swapr/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useIsMultihop } from '../state/user/hooks'
import { sortTradesByExecutionPrice } from '../utils/prices'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

function useAllCommonPairs(
  currencyA?: Currency,
  currencyB?: Currency,
  platform: UniswapV2RoutablePlatform = UniswapV2RoutablePlatform.SWAPR
): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = useMemo(() => (chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []), [chainId])

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...basePairs
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
        : [],
    [tokenA, tokenB, bases, basePairs]
  )

  const allPairs = usePairs(allPairCombinations, platform)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency,
  platform: UniswapV2RoutablePlatform = UniswapV2RoutablePlatform.SWAPR
): UniswapV2Trade | undefined {
  const { chainId } = useActiveWeb3React()
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut, platform)
  const multihop = useIsMultihop()

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0 && chainId && platform.supportsChain(chainId)) {
      const bestTrades = UniswapV2Trade.bestTradeExactIn(
        currencyAmountIn,
        currencyOut,
        new Percent('3'),
        allowedPairs,
        {
          maxHops: multihop ? 3 : 1,
          maxNumResults: 1
        }
      )

      // console.log(bestTrades)
      return bestTrades ?? undefined
    }
    return undefined
  }, [currencyAmountIn, currencyOut, allowedPairs, chainId, platform, multihop])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount,
  platform: UniswapV2RoutablePlatform = UniswapV2RoutablePlatform.SWAPR
): UniswapV2Trade | undefined {
  const { chainId } = useActiveWeb3React()
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency, platform)
  const multihop = useIsMultihop()

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0 && chainId && platform.supportsChain(chainId)) {
      return (
        UniswapV2Trade.bestTradeExactOut(currencyIn, currencyAmountOut, new Percent('3'), allowedPairs, {
          maxHops: multihop ? 3 : 1,
          maxNumResults: 1
        }) ?? undefined
      )
    }
    return undefined
  }, [currencyIn, currencyAmountOut, allowedPairs, chainId, platform, multihop])
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 * for each supported platform. Order is by lowest price ascending.
 */
export function useTradeExactInAllPlatforms(
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency
): (UniswapV2Trade | undefined)[] {
  const bestTrades = [
    useTradeExactIn(currencyAmountIn, currencyOut, UniswapV2RoutablePlatform.SWAPR),
    useTradeExactIn(currencyAmountIn, currencyOut, UniswapV2RoutablePlatform.UNISWAP),
    useTradeExactIn(currencyAmountIn, currencyOut, UniswapV2RoutablePlatform.SUSHISWAP),
    useTradeExactIn(currencyAmountIn, currencyOut, UniswapV2RoutablePlatform.HONEYSWAP),
    useTradeExactIn(currencyAmountIn, currencyOut, UniswapV2RoutablePlatform.BAOSWAP),
    useTradeExactIn(currencyAmountIn, currencyOut, UniswapV2RoutablePlatform.LEVINSWAP)
  ]

  return sortTradesByExecutionPrice(bestTrades).filter(trade => !!trade)
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 * for each supported platform. Order is by lowest price ascending.
 */
export function useTradeExactOutAllPlatforms(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount
): (UniswapV2Trade | undefined)[] {
  const bestTrades = [
    useTradeExactOut(currencyIn, currencyAmountOut, UniswapV2RoutablePlatform.SWAPR),
    useTradeExactOut(currencyIn, currencyAmountOut, UniswapV2RoutablePlatform.UNISWAP),
    useTradeExactOut(currencyIn, currencyAmountOut, UniswapV2RoutablePlatform.SUSHISWAP),
    useTradeExactOut(currencyIn, currencyAmountOut, UniswapV2RoutablePlatform.HONEYSWAP),
    useTradeExactOut(currencyIn, currencyAmountOut, UniswapV2RoutablePlatform.BAOSWAP),
    useTradeExactOut(currencyIn, currencyAmountOut, UniswapV2RoutablePlatform.LEVINSWAP)
  ]
  return sortTradesByExecutionPrice(bestTrades).filter(trade => !!trade)
}
