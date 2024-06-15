const { ethers } = require("ethers");
const { Token } = require("../Token/token.js");
const {
  getFactoryAddress,
  getRouterAddress,
  getProvider,
  Replacer,
  toBigIntWei,
  getWallet,
  getDeadline,
} = require("../utils.js");

// UniswapV2 imports
const factoryV2Abi = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerV2Abi = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairV2Abi = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");

// UniswapV3 imports
const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: routerV3Abi,
} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json");

const {
  factoryV3Abi,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json");

const factoryABI = [
  `  function getPool(
          address tokenA,
          address tokenB,
          uint24 fee
        ) external view returns (address pool)`,
];

class Dex {
  name;
  version;
  chainid;
  fullName;
  data;

  constructor(_name, _version, _chainid) {
    this.name = _name.toLowerCase();
    this.version = _version.toLowerCase();
    this.chainid = _chainid;
    this.fullName = `${this.name}${this.version}`;
    this.provider = getProvider(this.chainid);
    // Get data locally.
    this.factory = getFactoryAddress(this.name, this.version, this.chainid);
    this.router = getRouterAddress(this.name, this.version, this.chainid);
  }

  //**------------------------------------------ Contract Creation ------------------------------------------ */
  createFactoryContract() {
    let factoryContract;
    if (this.version == "v2") {
      factoryContract = new ethers.Contract(
        this.factory,
        factoryV2Abi,
        this.provider
      );
    } else if (this.version == "v3") {
      factoryContract = new ethers.Contract(
        this.factory,
        factoryABI,
        this.provider
      );
    }
    return factoryContract;
  }
  createRouterContract() {
    let routerContract;
    if (this.version == "v2") {
      routerContract = new ethers.Contract(
        this.router,
        routerV2Abi.abi,
        this.provider
      );
    } else if (this.version == "v3") {
      routerContract = new ethers.Contract(
        this.router,
        routerV3Abi,
        this.provider
      );
    }
    return routerContract;
  }
  /**------------------------------------------ Quotes ------------------------------------------ */
  /**
   *
   * @param {JSON} data: Params for swap on V2 or V3.
   * @returns: Number (in wei).
   */
  async getPrice(data = {}) {
    // Serialize with custom replacer function
    //console.log(`getPrice(): ${JSON.stringify(data, Replacer, 2)}`);
    let price;
    if (this.version == "v2") {
      price = await this.getQuoteV2(data["baseToken"], data["quoteToken"]);
    } else if (this.version == "v3") {
      price = await this.getQuoteV3(
        data["baseToken"],
        data["quoteToken"],
        data["fee"]
      );
    }
    return price;
  }

  //**------------------------------------------ Swaps ------------------------------------------ */

  async sqrtToPrice(sqrtPriceX96, baseToken, quoteToken) {
    const [decimals0, decimals1] =
      baseToken.address < quoteToken.address
        ? [baseToken.decimals, quoteToken.decimals]
        : [quoteToken.decimals, baseToken.decimals];
    let price;
    if ((await baseToken.address) > (await quoteToken.address)) {
      price = (Number(sqrtPriceX96) / 2 ** 96) ** 2 / 10 ** (await decimals1);
      price = 1 / Number(price);
    } else {
      price = (Number(sqrtPriceX96) / 2 ** 96) ** 2 * 10 ** (await decimals1);
    }
    return price;
  }

  //**------------------------------------------ Approvals ------------------------------------------ */

  async approveToken(tokenAddress, amountToApprove = -1) {
    const wallet = getWallet(this.provider);
    // Section of the ERC-20 Abi.
    const approvalABI = [
      {
        constant: false,
        inputs: [
          {
            name: "_spender",
            type: "address",
          },
          {
            name: "_value",
            type: "uint256",
          },
        ],
        name: "approve",
        outputs: [
          {
            name: "",
            type: "bool",
          },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    // If amountToApprove is -1, then approve max amount.
    if (amountToApprove < 0) {
      amountToApprove = ethers.MaxUint256;
    }
    // Create instance of token contract.
    const tokenContract = new ethers.Contract(
      tokenAddress,
      approvalABI,
      wallet
    );
    const tx = await tokenContract.approve(this.router, amountToApprove);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed.
    await tx.wait();
    console.log(`Approval successful [${tokenAddress}]`);
  }

  async checkApproval(tokenAddress) {
    const alloawnceABI = [
      {
        constant: true,
        inputs: [
          { name: "_owner", type: "address" },
          { name: "_spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];
    const tokenContract = new ethers.Contract(
      tokenAddress,
      alloawnceABI,
      this.provider
    );
    const allowance = await tokenContract.allowance(
      process.env.wallet_address,
      this.router
    );

    if (allowance > 0) {
      return [true, allowance];
    } else {
      return [false, allowance];
    }
  }
  //**------------------------------------------ Pools ------------------------------------------ */
  async getPoolAddress(token0, token1, feeTier) {
    const factoryContract = this.createFactoryContract();
    const poolAddress = await factoryContract.getPool(token0, token1, feeTier);
    return poolAddress;
  }

  log() {
    console.log(
      `-----------------------------------\nName: ${this.name}\nVersion: ${this.version}\nRouter: ${this.router}\nFactory: ${this.factory}`
    );
  }
}

module.exports = {
  Dex,
};
