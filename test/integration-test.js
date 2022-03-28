const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration", function () {
    let admin, user, candidate1;
    let Voting, voting;
    let votingStatus;
  
    it("Gets signers", async function(){
      [admin, user, candidate1] = await ethers.getSigners();
    });
  
      votingStatus = {
        "NotStarted": 0,
        "Started": 1,
        "Finished": 2
      }

    it("Deploys voting", async function(){
      Voting = await ethers.getContractFactory("Voting", admin);
      voting = await Voting.deploy();
      await voting.deployed();
      expect(voting.address).to.be.not.equal("0x0000000000000000000000000000000000000000");
    
    });

    it("Adds a new candidate", async function () {
        await voting.connect(admin).addCandidates([candidate1.address]);
        let candidate = await voting.candidates(0);
        expect(candidate["account"]).to.be.equal(candidate1.address);
    });

    it("Starts voting", async function(){
        await voting.connect(admin).startVoting(3);
        expect(await voting.status()).to.be.equal(votingStatus.Started);
    });

    it("Votes for a candidate", async function () {
        await voting.connect(user).vote(0, {
          value: ethers.utils.parseEther("0.01")
        });
        let candidate = await voting.candidates(0);
        expect(candidate["votes"]).to.be.equal(1);
    });

    it("Finishes voting", async function(){
        await ethers.provider.send('evm_increaseTime', [5]);
        await voting.connect(user).finishVoting();
        expect(await voting.status()).to.be.equal(votingStatus.Finished);
    });

    it("Withdraws tokens", async function(){
        await voting.connect(admin).withdraw();
        expect(await ethers.provider.getBalance(voting.address)).to.be.equal(0);
      });


});