const HDWalletProvider = require('truffle-hdwallet-provider');
const readline = require('readline-sync');

const apiKey = 'v3/ea555dd56ce44c4ebb025fef5698abdd';
const mnemonic = readline.question('Enter your 12 word mnemonic\n');

module.exports = {
  networks: {
    live: this.kovan,
    development: this.ganachecli,
    main: {
      provider: () => new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/' + apiKey),
      network_id: '1'
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/' + apiKey),
      network_id: '3'
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/' + apiKey),
      network_id: '4'
    },
    kovan: {
      provider: () => new HDWalletProvider(mnemonic, 'https://kovan.infura.io/' + apiKey),
      network_id: '42'
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*'
    },
    ganachecli: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    testrpc: this.ganachecli
  }
};
