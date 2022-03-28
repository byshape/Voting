const { task } = require("hardhat/config");
const { types } = require("hardhat/config")

async function getContractAndSigner(contract) {
    const Voting = await ethers.getContractFactory("Voting");
    const voting = Voting.attach(contract);
    const [minter] = await ethers.getSigners();
    return [ voting, minter ];
}

task("getCandidates", "Returns all candidates")
.addParam("contract", "Voting address", undefined, types.string)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    const allCandidates = (await (await voting.connect(minter)).getCandidates());
    console.log(`All canidates:`);
    for(const candidate of allCandidates) {
        console.log(`Address: ${candidate[0]}, votes: ${candidate[1]}`);
    }
});

task("getVoters", "Returns all voters")
.addParam("contract", "Voting address", undefined, types.string)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    const allVoters = (await (await voting.connect(minter)).getVoters());
    console.log(`All voters:`);
    for(const voter of allVoters) {
        console.log(`Address: ${voter[0]}, choice: ${voter[1]}`);
    }
});

task("addCandidates", "Allows to add a list of candidates")
.addParam("contract", "Voting address", undefined, types.string)
.addVariadicPositionalParam("candidates", "Candidates", undefined, types.string)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    await (await voting.connect(minter)).addCandidates(taskArgs.candidates);
    console.log(`Canidates were added`);
});

task("startVoting", "Starts voting")
.addParam("contract", "Voting address", undefined, types.string)
.addParam("time", "Voting time, in seconds", undefined, types.int)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    await (await voting.connect(minter)).startVoting(taskArgs.time);
    console.log(`Voting was started`);
});

task("vote", "Allows to vote for a candidate")
.addParam("contract", "Voting address", undefined, types.string)
.addParam("id", "Candidate id", undefined, types.int)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    await (await voting.connect(minter)).vote(taskArgs.id, {value: ethers.utils.parseEther("0.01")});
    console.log(`Vote was accepted`);
});

task("finishVoting", "Finishes voting")
.addParam("contract", "Voting address", undefined, types.string)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    await (await voting.connect(minter)).finishVoting();
    console.log(`Voting was finished`);
});

task("withdraw", "Fee withdrawal")
.addParam("contract", "Voting address", undefined, types.string)
.setAction(async (taskArgs, { ethers: { getSigners } }, runSuper) => {
    let [voting, minter] = await getContractAndSigner(taskArgs.contract);
    await (await voting.connect(minter)).withdraw();
    console.log(`Withdrawal was successful`);
});
