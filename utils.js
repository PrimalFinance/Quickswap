require("dotenv").config();
const fs = require("fs");
const { ethers, JsonRpcProvider } = require("ethers");
const { Token } = require("@uniswap/sdk-core");

const BASE_PATH = "Data\\address\\";
const DEXS_PATH = `${BASE_PATH}\\dex\\`;
const TOKENS_PATH = `${BASE_PATH}\\token\\tokens.json`;

/**-------------------------------------------------------------------------------------------- Provider Data -------------------------------------------------------------------------------------------- */
function getProviderUrl(chainId) {
  idMapping = {
    1: process.env.INFURA_ETHEREUM_URL,
    10: process.env.INFURA_OPTIMISM_URL,
    137: process.env.INFURA_POLYGON_URL,
    8453: process.env.INFURA_BASE_URL,
    42161: process.env.INFURA_ARBITRUM_URL,
  };
  return idMapping[chainId];
}

function getProvider(chainId) {
  const url = getProviderUrl(chainId);
  const provider = new JsonRpcProvider(url);
  return provider;
}

function getChainId(networkName) {
  if (networkName === "ethereum") {
    return 1;
  } else if (networkName === "optimism") {
    return 10;
  } else if (networkName === "polygon" || networkName === "polygon-pos") {
    return 137;
  } else if (
    networkName === "zkSync" ||
    networkName === "zksync" ||
    networkName === "zkSync-era"
  ) {
    return 324;
  } else if (networkName === "base") {
    return 8453;
  } else if (networkName === "arbitrum" || networkName === "arbitrum-one") {
    return 42161;
  }
}

function getWallet(provider) {
  const wallet = new ethers.Wallet(process.env.wallet_key, provider);
  return wallet;
}
/**-------------------------------------------------------------------------------------------- Tokens -------------------------------------------------------------------------------------------- */
function getTokenAddress(symbol, chainId) {
  const data = fs.readFileSync(TOKENS_PATH, "utf-8");
  const jsonData = JSON.parse(data);
  try {
    const address = jsonData[symbol]["address"][chainId];
    return address;
  } catch (error) {
    console.log(`[getTokenAddress()]: ${error}`);
  }
}
function getTokenDecimals(symbol) {
  const data = fs.readFileSync(TOKENS_PATH, "utf-8");
  const jsonData = JSON.parse(data);
  try {
    const decimals = jsonData[symbol]["decimals"];
    return decimals;
  } catch (error) {
    console.log(`[getTokenDecimals()]: ${error}`);
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

async function getTokenBalance(tokenAddress, provider) {
  const tokenABI = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ];
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
  const balance = await tokenContract.balanceOf(process.env.wallet_address);
  return balance;
}

async function addTokenInfo(
  symbol,
  tokenAddress,
  chainId,
  decimals = 18,
  sortOnExit = true
) {
  const filePath = `Data\\address\\token\\tokens.json`; // Path to token data.
  let fileData = fs.readFileSync(filePath, "utf-8"); // Read json into object.
  fileData = JSON.parse(fileData); // Parse object.
  const checkSummedAddress = ethers.getAddress(tokenAddress); // Convert 'tokenAddress' to check summed address.
  try {
    fileData[symbol]["address"][chainId] = checkSummedAddress;
    fileData[symbol]["decimals"] = decimals;
  } catch (e) {
    console.log(`E: ${e}`);
    fileData[symbol] = {
      address: {
        [chainId]: checkSummedAddress,
      },
      decimals: decimals,
    };
  }
  if (sortOnExit) {
    fileData = await sortTokenJson(fileData);
  }
  fileData = JSON.stringify(fileData, null, 2); // Convert JSON to string so it can be written to file.
  fs.writeFileSync(filePath, fileData, "utf-8");
}

/**
 * @description: Sort the "tokens.json" file by keys. So coins that come first alphabetically will be first in the JSON structure.
 *
 * @param {JSON} obj: JSON object recieved from reading file.
 * @returns {JSON}: Sorted JSON.
 */
async function sortTokenJson(obj) {
  // Create a new sorted object with 'ARB' as the first key
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  return sortedObj;
}

/**-------------------------------------------------------------------------------------------- Dexs -------------------------------------------------------------------------------------------- */
function getFactoryAddress(dexName, dexVersion, chainId) {
  let fileName;
  if (
    dexVersion == "v2" ||
    dexVersion == "V2" ||
    dexVersion == "2" ||
    dexVersion == 2
  ) {
    fileName = "dexV2.json";
  } else if (
    dexVersion == "v3" ||
    dexVersion == "V3" ||
    dexVersion == "3" ||
    dexVersion == 3
  ) {
    fileName = "dexV3.json";
  }
  const filePath = `${DEXS_PATH}\\${fileName}`;
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);
  try {
    const address = jsonData[dexName]["factory"][chainId];
    return address;
  } catch (error) {
    console.log(`[getFactoryAddress()]: ${error}`);
  }
}

function getRouterAddress(dexName, dexVersion, chainId) {
  let fileName;
  if (
    dexVersion == "v2" ||
    dexVersion == "V2" ||
    dexVersion == "2" ||
    dexVersion == 2
  ) {
    fileName = "dexV2.json";
  } else if (
    dexVersion == "v3" ||
    dexVersion == "V3" ||
    dexVersion == "3" ||
    dexVersion == 3
  ) {
    fileName = "dexV3.json";
  }
  const filePath = `${DEXS_PATH}\\${fileName}`;
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);
  try {
    const address = jsonData[dexName]["router"][chainId];
    return address;
  } catch (error) {
    console.log(`[getRouterAddress()]: ${error}`);
  }
}

function getUniversalRouterAddress(dexName, chainId) {
  const filePath = `${DEXS_PATH}\\universalRouter.json`;
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);
  try {
    const address = jsonData[dexName][chainId];
    return address;
  } catch (error) {
    console.log(`[getUniversalRouterAddress()]: ${error}`);
  }
}

function parseDexInfo(_dexInfo) {
  const dexName = _dexInfo.slice(0, -2);
  const dexVersion = _dexInfo.slice(-2);
  return [dexName, dexVersion];
}

/** -------------------------------------------------- Number formatting -------------------------------------------------- */
function formatPrice(num, decimals, multiply = false) {
  let finalValue;
  if (multiply) {
    finalValue = Number(num) * 10 ** decimals;
  } else {
    finalValue = Number(num) / 10 ** decimals;
  }
  return finalValue;
}

/** -------------------------------------------------- Wei Conversions -------------------------------------------------- */

function toBigIntWei(num, decimals) {
  console.log(`Number: ${num}   Decimals: ${decimals}`);
  let product = Number(num) * 10 ** decimals;
  if (!Number.isInteger(product)) {
    product = Math.trunc(product); // Remove decimals.
  }
  return BigInt(product);
}

function toWei(num, decimals = 18) {
  const finalValue = num * 10 ** decimals;
  return finalValue;
}

function fromWei(num, decimals) {
  const finalValue = Number(num) / 10 ** decimals;
  return finalValue;
}

function multiplyWei(num1, num2, decimals1, decimals2) {
  console.log(
    `============================\nNum1: ${num1}\nNum2: ${num2}\nDecimals1: ${decimals1}\nDecimals2: ${decimals2}`
  );
  const f1 = formatPrice(num1, decimals1);
  const f2 = formatPrice(num2, decimals2);

  console.log(`============================\nF1: ${f1}\nF2: ${f2}`);
  let product = f1 * f2;
  product = toBigIntWei(product, decimals1);
  return product;
}

/** -------------------------------------------------- Time & Date -------------------------------------------------- */
function getDeadline(seconds) {
  const deadline = Math.floor(Date.now() / 1000) + seconds;
  return deadline;
}

// Create a delay function
function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
/** -------------------------------------------------- Basic Utilities -------------------------------------------------- */
function Replacer(key, value) {
  // Check if the value is a BigInt
  if (typeof value === "bigint") {
    // Convert BigInt to string
    return value.toString();
  }
  // For other types, return the value as is
  return value;
}

module.exports = {
  //Provider Data
  getProvider,
  getProviderUrl,
  getChainId,
  getWallet,
  //Dex
  getFactoryAddress,
  getRouterAddress,
  getUniversalRouterAddress,
  parseDexInfo,
  // Number formating
  formatPrice,
  //Tokens
  getTokenAddress,
  getTokenDecimals,
  createToken,
  getTokenBalance,
  addTokenInfo,
  // Wei conversion
  fromWei,
  toBigIntWei,
  toWei,
  multiplyWei,
  // Time & Date
  delay,
  getDeadline,
  // Utilities
  Replacer,
};
