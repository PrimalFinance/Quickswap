require("dotenv").config();
const axios = require("axios");
const {
  getWallet,
  getProvider,
  getTokenAddress,
  getTokenBalance,
} = require("../../utils");
const { TextToSpeech } = require("../../TTS/tts");

class OneInch {
  chainId;
  wallet;

  headers = {
    Authorization: `Bearer ${process.env.one_inch_key}`,
  };
  tts;
  useVoice;
  constructor(_chainId, _useVoice = true) {
    this.chainId = _chainId;
    this.wallet = getWallet(getProvider(_chainId));
    this.tts = new TextToSpeech();
    this.useVoice = _useVoice;
  }

  /*
   *======================================================
   * Router Approvals
   *======================================================
   */
  /**
   * @description: Swap 'tokenInAddress' for 'tokenOutAddress' based on 'amountIn'.
   *               Swap will revert if changes in price exceeds 'slippage'.
   *
   * @param {String} tokenInAddress: Address of the token used as input for the swap.
   * @param {String} tokenOutAddress: Address of the token used as output for the swap.
   * @param {Number} amountIn: Amount of 'tokenInAddress' to swap for 'tokenOutAddress'.
   * @param {Number} slippage: Threshold that price can change without transaction reverting.
   */
  async swapTokens(tokenInAddress, tokenOutAddress, amountIn, slippage = 1) {
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/swap`;
    const config = {
      headers: this.headers,
      params: {
        src: tokenInAddress,
        dst: tokenOutAddress,
        amount: amountIn,
        from: this.wallet.address,
        origin: this.wallet.address,
        slippage: slippage,
      },
    };
    try {
      const response = await axios.get(url, config);
      await this.wallet.sendTransaction(response.data.tx);
      if (this.useVoice) {
        this.tts.speak("Swapped Tokens");
      }
      console.log(response.data);
    } catch (error) {
      console.error(error);
      if (this.useVoice) {
        this.tts.speak("Error Swapping Tokens");
      }
    }
  }

  /*
   *======================================================
   * Router Approvals
   *======================================================
   */
  /**
   * @description: Approve the 1inch AggregatorV6 router to trade with tokens in wallet.
   *               If 'amountToApprove' is set to 0, the router will have unlimited access to a tokens balances.
   *
   * @param {String} tokenAddress: Address of token to approve.
   * @param {Number} amountToApprove: Amount to approve. *NOTE* Setting to 0 will approve unlimited.
   */
  async approveRouter(tokenAddress, amountToApprove = 0) {
    /**----------- 1inch Query -----------*/
    // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fapprove%2Ftransaction
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/approve/transaction`;

    let config;
    if (amountToApprove == 0) {
      config = {
        headers: this.headers,
        params: {
          tokenAddress: tokenAddress,
        },
      };
    } else {
      config = {
        headers: this.headers,
        params: {
          tokenAddress: tokenAddress,
          amount: amountToApprove,
        },
      };
    }

    try {
      const response = await axios.get(url, config);
      await this.wallet.sendTransaction(response.data);
      if (this.useVoice) {
        this.tts.speak("Approved Token");
      }
    } catch (error) {
      console.error(error);
      if (this.useVoice) {
        this.tts.speak("Error Approving Token");
      }
    }
  }

  /**
   * @description: Check how many tokens AggregatorV6 can make in a single swap.
   *
   * @param {String} tokenAddress: Address of token to check.
   * @returns {Number}: Number of tokens allowed to trade.
   */
  async getRouterAllowance(tokenAddress) {
    /**----------- 1inch Query -----------*/
    // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fapprove%2Fallowance
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/approve/allowance`;
    const config = {
      headers: this.headers,
      params: {
        tokenAddress: tokenAddress,
        walletAddress: this.wallet.address,
      },
    };
    try {
      const response = await axios.get(url, config);
      return response.data["allowance"];
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = {
  OneInch,
};
