require("dotenv").config();
const { SwapRouter } = require("@uniswap/universal-router-sdk");
const {
  TradeType,
  Ether,
  Token,
  CurrencyAmount,
  Percent,
} = require("@uniswap/sdk-core");
const { Trade: V2Trade } = require("@uniswap/v2-sdk");
const {
  Pool,
  nearestUsableTick,
  TickMath,
  TICK_SPACINGS,
  FeeAmount,
  Trade: V3Trade,
  Route: RouteV3,
} = require("@uniswap/v3-sdk");
const { MixedRouteTrade, Trade: RouterTrade } = require("@uniswap/router-sdk");
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
const JSBI = require("jsbi");
const erc20Abi = require("../../Data/abi/erc20ABI.json");
const {
  getTokenAddress,
  getTokenDecimals,
  getProvider,
  getChainId,
  toWei,
  getWallet,
  getUniversalRouterAddress,
} = require("../../utils");
const { ethers } = require("ethers");

class UniversalRouter {
  token0;
  token1;
  chainId;
  provider;
  token0Contract;
  token1Contract;
  ETHER;
  RECIPIENT = process.env.wallet_address;

  constructor(_chainId) {
    this.chainId = _chainId;
    this.provider = getProvider(this.chainId);
    this.ETHER = Ether.onChain(_chainId);
  }

  async swapV2() {}

  async getPool(tokenA, tokenB, feeAmount) {
    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    const poolAddress = Pool.getAddress(token0, token1, feeAmount);

    console.log(`Pool Address: ${poolAddress}`);
    const contract = new ethers.Contract(
      poolAddress,
      IUniswapV3Pool.abi,
      this.provider
    );

    let liquidity = await contract.liquidity();
    console.log(`Liquidity: ${liquidity}    Fee: ${feeAmount}`);

    let { sqrtPriceX96, tick } = await contract.slot0();

    liquidity = JSBI.BigInt(liquidity.toString());
    sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString());
    const minTick = nearestUsableTick(
      TickMath.MIN_TICK,
      TICK_SPACINGS[feeAmount]
    );
    const maxTick = nearestUsableTick(
      TickMath.MAX_TICK,
      TICK_SPACINGS[feeAmount]
    );
    console.log(`MinTick: ${minTick}     MaxTick: ${maxTick}`);

    const isValidTick = (tick) => tick % TICK_SPACINGS[feeAmount] === 0;

    console.log(
      `isValid: ${isValidTick(minTick)}\nisValidMax: ${isValidTick(maxTick)}`
    );

    return new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
      {
        index: minTick,
        liquidityNet: liquidity,
        liquidityGross: liquidity,
      },
      {
        index: maxTick,
        liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
        liquidityGross: liquidity,
      },
    ]);
  }

  swapOptions(options) {
    return Object.assign(
      {
        slippageTolerance: new Percent(5, 100),
        recipient: RECIPIENT,
      },
      options
    );
  }

  buildTrade(trades) {
    return new RouterTrade({
      v2Routes: trades
        .filter((trade) => trade instanceof V2Trade)
        .map((trade) => ({
          routev2: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      v3Routes: trades
        .filter((trade) => trade instanceof V3Trade)
        .map((trade) => ({
          routev3: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      mixedRoutes: trades
        .filter((trade) => trade instanceof MixedRouteTrade)
        .map((trade) => ({
          mixedRoute: trade.route,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      tradeType: trades[0].tradeType,
    });
  }

  /**-------------------------------- Swap Routes -------------------------------- */
  async swapV3(tokenIn, tokenOut, amountIn, routerAddress) {
    const wallet = getWallet(this.provider);
    const poolAddress = await this.getPool(tokenIn, tokenOut, FeeAmount.MEDIUM);
    console.log(poolAddress);
    //     const input = toWei(amountIn, tokenIn.decimals);
    //     const trade = await V3Trade.fromRoute(
    //       new RouteV3([poolAddress], tokenIn, tokenOut),
    //       CurrencyAmount.fromRawAmount(this.ETHER, input),
    //       TradeType.EXACT_INPUT
    //     );
    //     const routerTrade = this.buildTrade([trade]);
    //     const opts = this.swapOptions({});
    //     const params = SwapRouter.swapERC20CallParameters(routerTrade, opts);

    //     const txn = await wallet.sendTransaction({
    //       data: params.calldata,
    //       to: routerAddress,
    //       value: params.value,
    //       from: this.RECIPIENT,
    //     });
    //     const receipt = await txn.wait();
    //   }
  }
}

async function createToken(symbol, chainId) {
  return new Token(
    chainId,
    await getTokenAddress(symbol, chainId),
    await getTokenDecimals(symbol),
    symbol,
    ""
  );
}

module.exports = {
  UniversalRouter,
  createToken,
};
