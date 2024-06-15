const { ethers } = require("ethers");
const { Dex } = require("../dex");
const {
  getWallet,
  toBigIntWei,
  Replacer,
  getDeadline,
} = require("../../utils");

const poolABI = [
  `  function slot0(
          ) external view returns
          (uint160 sqrtPriceX96,
          int24 tick,
          uint16 observationIndex,
          uint16 observationCardinality,
          uint16 observationCardinalityNext,
          uint8 feeProtocol,
          bool unlocked)`,
];

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

class UniswapV3 extends Dex {
  constructor(_chainId) {
    super("uniswap", "v3", _chainId);
  }

  /**
   * @description: Get the price from V3 protocols. For the follwing explanations use the pair ETH/USDC as a reference.
   *
   * @param {Token} baseToken: Base token of the pair. (ETH)
   * @param {Token} quoteToken: Quote token of the pair. (USDC, since we are getting a quote for ETH in terms of USDC).
   * @param {Number} feeTier: Fee tier of the liquidity pool. *Notice: 0.01% -> 100, 0.05% -> 500, 0.3% -> 3000, 1% -> 10000
   * @returns {Number}: Quote for the pair.
   */
  async getQuote(baseToken, quoteToken, feeTier) {
    try {
      const poolAddress = await this.getPoolAddress(
        baseToken.address,
        quoteToken.address,
        feeTier
      );

      console.log(`Pool Address: ${poolAddress}`);
      if (poolAddress != NULL_ADDRESS) {
        const pool = new ethers.Contract(poolAddress, poolABI, this.provider);
        const slot0 = pool.slot0();
        const { sqrtPriceX96 } = await slot0;
        console.log(`Sqrt: ${sqrtPriceX96}`);
        const price = await this.sqrtToPrice(
          sqrtPriceX96,
          baseToken,
          quoteToken
        );
        return price;
      } else {
        console.log(
          `[getQuoteV3()] Pool does not exist. Address: ${poolAddress}  Fee Tier: ${feeTier}`
        );
        return "N/A";
      }
    } catch (error) {
      console.log(error, "[getQuoteV3()]");
    }
  }

  /**
   *
   * @param {Token} tokenIn
   * @param {Token} tokenOut
   * @param {Number} feeTier
   * @param {Number} amountIn
   * @param {Number} amountOutMin
   */
  async swapTokens(tokenIn, tokenOut, feeTier, amountIn, amountOutMin) {
    const routerContract = this.createRouterContract();
    const wallet = getWallet(this.provider);
    const deadline = getDeadline(60);
    // Check if token is allowed by router.
    const tokenInAllowance = await this.checkApproval(tokenIn.address);
    // Approve token for swap router.
    if (!tokenInAllowance[0]) {
      await this.approveToken(tokenIn.address, -1);
    }
    const params = {
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      fee: feeTier,
      recipient: wallet.address,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0,
    };

    console.log(`JSON: ${JSON.stringify(params, Replacer, 2)}`);
    const txn = await routerContract.connect(wallet).exactInputSingle(params, {
      gasLimit: 1000000,
    });
    await txn.wait();
  }
}

module.exports = {
  UniswapV3,
};
