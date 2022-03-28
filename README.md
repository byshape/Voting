# Description
This is a smart contract for voting. Its main features:
* The owner can add candidates
* The owner can start a time-limited voting
* Users can vote for a candidate, participation costs 0.01 ETH
* The owner can finish voting, the winner gets the whole pot minus 10% commission
* The owner can withdraw commission
* There is a function for viewing the list of candidates and votes received
* There is a function for viewing the list of voters and their choices

## Launch instructions
Run this command in terminal
```
npm install --save-dev hardhat
```
When installation process is finished, run:
* `npx hardhat test` to run tests
* `npx hardhat coverage --solcoverjs ./.solcover.js` to get coverage report
* `npx hardhat run --network rinkeby scripts/deploy.js` to deploy smart contract to the rinkeby testnet
* `npx hardhat help` to get the list of available tasks, including tasks for interaction with deployed voting contract: getCandidates, getVoters, addCandidates, startVoting, vote, finishVoting, withdraw
