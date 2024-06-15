const { getWallet, getProvider, getProviderUrl } = require("../../utils");
const axios = require("axios");
const fetch = require("isomorphic-fetch");

// 1inch Network: Aggregation Router V6
// These are trusted addresses according to the 1inch api. *See function "getRouterAddress()" for the full api call.*
// These are mapped locally to reduce the number of api calls.
// It is recommended to check on a network scanner to make sure they are still currently in use.
const trustedRouters = {
  1: "0x111111125421cA6dc452d289314280a0f8842A65",
  10: "0x111111125421cA6dc452d289314280a0f8842A65",
  137: "0x111111125421cA6dc452d289314280a0f8842A65",
  324: "0x6fd4383cb451173d5f9304f041c7bcbf27d561ff",
  8453: "0x111111125421cA6dc452d289314280a0f8842A65",
  42161: "0x111111125421cA6dc452d289314280a0f8842A65",
};

class OneInchV6 {
  chainId;
  baseUrl;
  rpcUrl;
  wallet;
  headers = {
    Authorization: `Bearer ${process.env.one_inch_key}`,
  };
  constructor(_chainId) {
    this.chainId = _chainId;
    this.baseUrl = "https://api.1inch.exchange/v4.0";
    this.rpcUrl = getProviderUrl(_chainId);
    this.wallet = getWallet(getProvider(_chainId));
  }

  async getQuote(fromTokenAddress, toTokenAddress, amountIn) {
    /**----------- 1inch Query -----------*/
    // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fquote
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/quote`;
    const config = {
      headers: this.headers,
      params: {
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountIn,
      },
    };

    try {
      const response = await axios.get(url, config);
      return response.data["dstAmount"];
    } catch (error) {
      console.error(error);
    }
  }

  async generateSwapData(
    fromTokenAddress,
    toTokenAddress,
    amountIn,
    from,
    //origin,
    slippage
  ) {
    /**----------- 1inch Query -----------*/
    // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fswap
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/swap`;
    const config = {
      headers: this.headers,
      params: {
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountIn,
        from: from,
        //origin: origin,
        slippage: slippage,
      },
    };

    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async approveRouter(tokenAddress, amountToApprove) {
    /**----------- 1inch Query -----------*/
    // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fapprove%2Ftransaction
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/approve/transaction`;
    console.log(`Type: ${typeof amountToApprove}   ${amountToApprove}`);

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
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async getRouterAllowance(tokenAddress, walletAddress) {
    /**----------- 1inch Query -----------*/
    // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fapprove%2Fallowance
    const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/approve/allowance`;
    const config = {
      headers: this.headers,
      params: {
        tokenAddress: tokenAddress,
        walletAddress: walletAddress,
      },
    };
    try {
      const response = await axios.get(url, config);
      return response.data["allowance"];
    } catch (error) {
      console.error(error);
    }
  }

  async getRouterAddress() {
    try {
      const routerAddress = trustedRouters[this.chainId];
      return routerAddress;
    } catch (e) {
      /**----------- 1inch Query -----------*/
      // Documentation: https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fapprove%2Fspender
      const url = `https://api.1inch.dev/swap/v6.0/${this.chainId}/approve/spender`;
      const config = {
        headers: this.headers,
        params: {},
      };

      try {
        const response = await axios.get(url, config);
        console.log(response.data);
        console.log(
          `[*Notice*]: Recommended to store locally to avoid API calls in the future. `
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  async broadcastTransaction(txnData) {
    const url = `https://api.1inch.dev/tx-gateway/v1.1/${this.chainId}/broadcast`;
    console.log(`Headers: ${JSON.stringify(this.headers, null, 2)}`);
    const config = {
      headers: this.headers,
      params: {
        rawTransaction: txnData,
      },
    };

    try {
      const response = await axios.post(url, config);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = {
  OneInchV6,
};
