const {
  getProvider,
  getWallet,
  toWei,
  toBigIntWei,
  delay,
  getTokenBalance,
} = require("../utils");
const { OneInch } = require("../Dex/1inch/1inch.js");
const { TextToSpeech } = require("../TTS/tts.js");

class Trader {
  baseToken;
  altToken;
  chainId;
  provider;
  wallet;
  tts;

  constructor(_baseToken, _altToken, _chainId) {
    this.baseToken = _baseToken;
    this.altToken = _altToken;
    this.chainId = _chainId;
    this.provider = getProvider(_chainId);
    this.wallet = getWallet(this.provider);
    this.oneInch = new OneInch(_chainId);
  }

  async test() {
    // await this.oneInch.approveRouter(
    //   "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
    // );
    // await this.preTradeChecks();
    // const balance = await getTokenBalance(
    //   this.baseToken.address,
    //   this.provider
    // );
    // console.log(`Balance: ${balance}`);
    // await this.oneInch.swapTokens(
    //   this.baseToken.address,
    //   this.altToken.address,
    //   balance
    // );
    this.tts.speak("Base Token purchased");
    //this.tts.getVoices();
  }

  /**
   * @description: Swap 'altToken' for 'baseToken'.
   *
   * @param {Number} amountIn: Amount of 'altToken' to swap for 'baseToken'. *NOT IN WEI*
   * @param {Boolean} useAltBalance: Override 'amountIn' and use the wallet's balance for 'altToken'.
   */
  async buyBase(amountIn, useAltBalance = false) {
    if (useAltBalance) {
      amountIn = await getTokenBalance(this.altToken.address, this.provider);
    } else {
      amountIn = toBigIntWei(amountIn, this.altToken.decimals);
    }
    // Execute swap
    await this.oneInch.swapTokens(
      this.altToken.address,
      this.baseToken.address,
      amountIn
    );
  }
  /**
   * @description: Sell 'baseToken' for 'altToken'.
   *
   * @param {Number} amountIn: Amount of 'baseToken' to swap for 'altToken'. *NOT IN WEI*
   * @param {Boolean} useBaseBalance: Override 'amountIn' and use the wallet's balance for 'baseToken'.
   */
  async sellBase(amountIn, useBaseBalance = true) {
    if (useBaseBalance) {
      amountIn = await getTokenBalance(this.baseToken.address, this.provider);
    } else {
      amountIn = toBigIntWei(amountIn, this.baseToken.decimals);
    }
    console.log(`AmountIn: ${amountIn}`);
    // Execute swap
    await this.oneInch.swapTokens(
      this.baseToken.address,
      this.altToken.address,
      amountIn
    );
  }

  async swapTokens(tokenInAddress, tokenOutAddress, amountIn) {
    const swapTxn = await this.OneInchV6.generateSwapData(
      tokenInAddress,
      tokenOutAddress,
      amountIn,
      this.wallet.address,
      1
    );
    console.log(`Swap: ${JSON.stringify(swapTxn, null, 2)}`);
    try {
      //await this.OneInchV6.broadcastTransaction(swapTxn["tx"]["data"]);
      await this.wallet.signTransaction(swapTxn);
      //const receipt = await txnResponse.wait();
      //console.log(`[Swap Receipt]: ${JSON.stringify(receipt, null, 2)}`);
      //   const txnResponse = await this.wallet.sendTransaction(swapTxn);
      //   const receipt = await txnResponse.wait();
      //   console.log(`[Swap Receipt]: ${JSON.stringify(receipt, null, 2)}`);
    } catch (e) {
      console.log(`[swapTokens()]: ${e}`);
    }
  }

  async preTradeChecks() {
    const d = 1;
    const baseAllowance = await this.oneInch.getRouterAllowance(
      this.baseToken.address
    );
    // Delays are added to prevent api limits being exceeded.
    await delay(d);
    if (baseAllowance === "0") {
      await this.oneInch.approveRouter(this.baseToken.address, 0);
    }
    await delay(d);
    const altAllowance = await this.oneInch.getRouterAllowance(
      this.altToken.address
    );
    await delay(d);
    if (altAllowance === "0") {
      await this.oneInch.approveRouter(this.altToken.address, 0);
    }
  }
}

module.exports = {
  Trader,
};
