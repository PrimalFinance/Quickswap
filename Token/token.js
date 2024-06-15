class Token {
  address;
  decimals;

  constructor(_address, _decimals = 18) {
    this.address = _address;
    this.decimals = _decimals;
  }
}

module.exports = {
  Token,
};
