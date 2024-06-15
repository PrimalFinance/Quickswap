const { ethers } = require("ethers");
const { Dex } = require("../dex");

const {
  getWallet,
  toBigIntWei,
  Replacer,
  getDeadline,
} = require("../../utils");

class UniswapV2 extends Dex {
  constructor(_chainId) {
    super("uniswap", "v2", _chainId);
  }

  /**
   * @description: Swap tokens on V2 protocols.
   *
   * @param {Token} tokenIn
   * @param {Token} tokenOut
   * @param {Number} amountIn: Amount to swap of 'tokenIn' to 'tokenOut'.
   * @param {Number} amountOutMin: The minimum to recieve of 'tokenOut', otherwise transaction will revert.
   */
  async swapTokens(tokenIn, tokenOut, amountIn, amountOutMin) {
    const routerContract = this.createRouterContract();
    const wallet = getWallet(this.provider);
    const tokenInAllowance = await this.checkApproval(tokenIn.address);
    if (!tokenInAllowance[0]) {
      await this.approveToken(tokenIn.address, -1);
    }
    const txn = await routerContract.connect(wallet).swapExactTokensForTokens(
      amountIn, // Amount to swap of 'tokenIn'.
      amountOutMin, // Minimum amount of 'tokenOut' to recieve, otherwise txn will revert.
      [tokenIn.address, tokenOut.address], // Path for swap.
      wallet.address, // Recipient of 'tokenOut'.
      Math.floor(Date.now() / 1000) * (60 * 10), // Deadline for txn to expire.
      {
        gasLimit: 1000000,
      }
    );
    await txn.wait();
  }

  /**
   * @description: Get the price from V2 protocols. For the follwing explanations use the pair ETH/USDC as a reference.
   *
   * @param {Token} baseToken: Base token of the pair. (ETH)
   * @param {Token} quoteToken: Quote token of the pair. (USDC, since we are getting a quote for ETH in terms of USDC).
   * @param {*} amountIn: Amount to get quote for. *WARNING* Assumes values are in wei.
   * @returns {Number}: Quote for the pair.
   */
  async getQuote(baseToken, quoteToken, amountIn = 1) {
    const routerContract = this.createRouterContract();
    const path = [baseToken.address, quoteToken.address];
    amountIn = toBigIntWei(amountIn, baseToken.decimals);
    const quote = await routerContract.getAmountsOut(amountIn, path);
    return quote;
  }
}

module.exports = {
  UniswapV2,
};
