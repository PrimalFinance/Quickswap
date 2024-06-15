const fs = require("fs");
const PATH_TO_DATA = "Data\\";

class Data {
  constructor() {
    this.baseDataPath = `${PATH_TO_DATA}\\static-data`;
    this.tokensPath = `${this.baseDataPath}\\tokens`;
    this.dexPath = `${this.baseDataPath}\\dex-data`;
    this.abiPath = `${this.baseDataPath}\\abis`;
  }

  async getFactoryAddress(dexName, dexVersion, chainId) {
    const filePath = `${this.dexPath}\\dexs.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const routerAddress =
        jsonData[dexName][dexVersion][chainId]["factoryAddress"];
      return routerAddress;
    } catch (e) {
      console.log(`[getFactoryAddress() Error]: ${e}`);
      return "null";
    }
  }
  /**
   * @param {string} dexName
   * @param {string} dexVersion
   * @param {Number} chainId
   * @returns {string} address of dex router.
   */
  async getRouterAbi(dexName, dexVersion) {
    const filePath = `${this.abiPath}\\routerAbis.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const routerAbi = jsonData[dexName][dexVersion];
      return routerAbi;
    } catch (e) {
      console.log(`[getRouterAbi() Error]: ${e}`);
      return "null";
    }
  }

  /**
   * @param {string} dexName
   * @param {string} dexVersion
   * @param {Number} chainId
   * @returns {string} address of dex router.
   */
  async getRouterAddress(dexName, dexVersion, chainId) {
    const filePath = `${this.dexPath}\\dexData.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const routerAddress = jsonData[dexName]["router"][chainId];
      return routerAddress;
    } catch (e) {
      console.log(`[getRouterAddress() Error]: ${e}`);
      return "null";
    }
  }

  /**
   *
   * @returns: Abi for ERC-20 tokens.
   */
  async getTokenAbi() {
    const filePath = `${this.abiPath}\\erc20Abi.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const tokenAbi = jsonData;
      return tokenAbi;
    } catch (e) {
      console.log(`[getTokenAbi() Error]: ${e}`);
      return "null";
    }
  }

  async getTokenAddress(symbol, chainId) {
    const filePath = `${this.tokensPath}\\tokens.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const tokenAddress = jsonData[symbol]["address"][chainId];
      return tokenAddress;
    } catch (e) {
      console.log(`[getTokenAddress() Error]: ${e}`);
      return "null";
    }
  }
  /**
   * @param {string} symbol:
   * @param {Number} chainId:
   * @returns {string} address of token.
   */
  async getTokenDecimals(symbol, chainId) {
    const filePath = `${this.tokensPath}\\tokens.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const tokenDecimals = jsonData[symbol]["decimals"];
      return tokenDecimals;
    } catch (e) {
      console.log(`[getTokenDecimals() Error]: ${e}`);
      return "null";
    }
  }
  /**
   * @param {string} symbol:
   * @param {Number} chainId:
   * @returns {JSON} Key information about the token such as address & decimals..
   */
  async getTokenInfo(symbol) {
    const filePath = `${this.tokensPath}\\tokens.json`;
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    try {
      const tokenInfo = jsonData[symbol];
      return tokenInfo;
    } catch (e) {
      console.log(`[getTokenInfo() Error]: ${e}`);
      return "null";
    }
  }
}

module.exports = {
  Data,
};
