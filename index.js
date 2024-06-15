const readline = require("readline");
const { Trader } = require("./Trader/trader.js");
const {
  getChainId,
  getTokenAddress,
  getProvider,
  addTokenInfo,
  getTokenDecimals,
  createToken,
  getUniversalRouterAddress,
} = require("./utils.js");
const { TextToSpeech } = require("./TTS/tts.js");

class Token {
  address;
  decimals;
  constructor(_address, _decimals) {
    this.address = _address;
    this.decimals = _decimals;
  }
}

const WETH = new Token("0x4200000000000000000000000000000000000006", 18);
const BRETT = new Token("0x532f27101965dd16442E59d40670FaF5eBB142E4", 18);
const USDC = new Token("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6);
const CRV = new Token("0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978", 18);
const RETT = new Token("0x7BB68a91B7b68121C416BC94e2354171244466d0", 18);

async function execute(instruction) {
  const chainId = getChainId("base"); // Get chain Id.
  const token0 = RETT;
  const token1 = WETH;
  const trader = new Trader(token0, token1, chainId);

  const PURCHASE_AMOUNT = 0.005;

  if (instruction == 1) {
    await trader.buyBase(PURCHASE_AMOUNT, false);
  } else if (instruction == 2) {
    await trader.sellBase(0, true);
  } else if (instruction == 3) {
    await trader.preTradeChecks();
  }
}

async function main() {
  /**----- Trade Instructions -----*/
  execute(2);
}
main();
