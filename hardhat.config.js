require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("dotenv").config();

require("./tasks/voting-tasks.js");

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
  networks: {
    hardhat: {
    },
    rinkeby: {
      url: `${API_URL}`,
      accounts: [`${PRIVATE_KEY}`]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 40000
  }
};
