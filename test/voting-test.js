const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let admin, user, user2, candidate1, candidate2, candidate3;
  let Voting, voting;
  let TestCandidate, testCandidate;
  let votingStatus;

  before(async function(){
    [admin, user, user2, user3, candidate1, candidate2, candidate3] = await ethers.getSigners();

    votingStatus = {
      "NotStarted": 0,
      "Started": 1,
      "Finished": 2
    }

    Voting = await ethers.getContractFactory("Voting", admin);
    voting = await Voting.deploy();
    await voting.deployed();

    TestCandidate = await ethers.getContractFactory("TestCandidate", admin);
    testCandidate = await TestCandidate.deploy();
    await testCandidate.deployed();
  
  });

  it("Allows the owner to add a new candidate", async function () {
    await expect(voting.connect(admin).addCandidates([candidate1.address])).to.emit(voting, "CandidateAdded").withArgs(0, candidate1.address);
    let candidate = await voting.candidates(0);
    expect(candidate["account"]).to.be.equal(candidate1.address);
  });

  it("Allows the owner to add several new candidates", async function () {
    await expect(voting.connect(admin).addCandidates([candidate2.address, candidate3.address])).to.emit(voting, "CandidateAdded").withArgs(2, candidate3.address);
    let candidate = await voting.candidates(2);
    expect(candidate["account"]).to.be.equal(candidate3.address);
  });

  it("Doesn't allow non-owner to add a new candidate", async function () {
    await expect(voting.connect(user).addCandidates([candidate2.address])).to.be.revertedWith("Ownable: caller is not the owner");
    let allCandidates = await voting.getCandidates();
    expect(allCandidates.length).to.be.equal(3);
  });

  it("Doesn't allow owner to sent empty candidates list", async function () {
    await expect(voting.connect(admin).addCandidates([])).to.be.revertedWith("No candidates provided");
    let allCandidates = await voting.getCandidates();
    expect(allCandidates.length).to.be.equal(3);
  });

  it("Doesn't allow user to vote for a candidate before voting was started", async function () {
    let candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
    await expect(voting.connect(user).vote(0)).to.be.revertedWith("Voting is not running");
    let voters = await voting.getVoters();
    expect(voters.length).to.be.equal(0);
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
  });

  it("Doesn't allow user to finish voting before it was started", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.NotStarted);
    await expect(voting.connect(user).finishVoting()).to.be.revertedWith("Voting is not running to be finished");
    expect(await voting.status()).to.be.equal(votingStatus.NotStarted);
  });

  it("Doesn't allow user to start voting", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.NotStarted);
    await expect(voting.connect(user).startVoting(15)).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await voting.status()).to.be.equal(votingStatus.NotStarted);
  });

  it("Doesn't allow owner to start voting with zero voting time", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.NotStarted);
    await expect(voting.connect(admin).startVoting(0)).to.be.revertedWith("Invalid voting time");
  });

  it("Allows the owner to start voting", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.NotStarted);
    await expect(voting.connect(admin).startVoting(15)).to.emit(voting, "VotingStarted");
    expect(await voting.status()).to.be.equal(votingStatus.Started);
  });

  it("Doesn't allow owner to start voting twice", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.Started);
    await expect(voting.connect(admin).startVoting(15)).to.be.revertedWith("Voting can't be started");
  });

  it("Doesn't allow user to vote for a candidate without sending 0.01 ETH", async function () {
    let candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
    await expect(voting.connect(user).vote(0)).to.be.revertedWith("You should send voting rate to vote");
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
  });

  it("Doesn't allow user to vote for a candidate with sending amount different from 0.01 ETH", async function () {
    let candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
    await expect(voting.connect(user).vote(0, {
      value: ethers.utils.parseEther("0.02")
    })).to.be.revertedWith("You should send voting rate to vote");
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
  });

  it("Doesn't allow user to vote for a candidate with sendidng invalid candidate id", async function () {
    let candidate = await voting.candidates(0);
    let allCandidates = await voting.getCandidates();
    expect(candidate["votes"]).to.be.equal(0);
    await expect(voting.connect(user).vote(allCandidates.length, {
      value: ethers.utils.parseEther("0.01")
    })).to.be.revertedWith("Invalid candidate id");
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
  });

  it("Doesn't allow user to finish voting before voting time ended", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.Started);
    await expect(voting.connect(user).finishVoting()).to.be.revertedWith("Time is not finished yet");
    expect(await voting.status()).to.be.equal(votingStatus.Started);
  });

  it("Allows user to vote for a candidate", async function () {
    let candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(0);
    await expect(voting.connect(user).vote(0, {
      value: ethers.utils.parseEther("0.01")
    })).to.emit(voting, "Vote").withArgs(0, user.address);
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(1);
    let voters = await voting.getVoters();
    expect(voters.length).to.be.equal(1);

    candidate = await voting.candidates(1);
    expect(candidate["votes"]).to.be.equal(0);
    await expect(voting.connect(user2).vote(1, {
      value: ethers.utils.parseEther("0.01")
    })).to.emit(voting, "Vote").withArgs(1, user2.address);
    candidate = await voting.candidates(1);
    expect(candidate["votes"]).to.be.equal(1);
    voters = await voting.getVoters();
    expect(voters.length).to.be.equal(2);

    await expect(voting.connect(user3).vote(0, {
      value: ethers.utils.parseEther("0.01")
    })).to.emit(voting, "Vote").withArgs(0, user3.address);
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(2);
    voters = await voting.getVoters();
    expect(voters.length).to.be.equal(3);

    await expect(voting.connect(candidate2).vote(1, {
      value: ethers.utils.parseEther("0.01")
    })).to.emit(voting, "Vote").withArgs(1, candidate2.address);
    candidate = await voting.candidates(1);
    expect(candidate["votes"]).to.be.equal(2);
    voters = await voting.getVoters();
    expect(voters.length).to.be.equal(4);
  });

  it("Doesn't allow user to vote for a candidate more than once", async function () {
    let candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(2);
    await expect(voting.connect(user).vote(0, {
      value: ethers.utils.parseEther("0.01")
    })).to.be.revertedWith("You have voted already");
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(2);
  });

  it("Doesn't allow user to vote for a candidate when voting time ended", async function () {
    let candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(2);
    await ethers.provider.send('evm_increaseTime', [15]);
    await expect(voting.connect(user2).vote(0, {
      value: ethers.utils.parseEther("0.01")
    })).to.be.revertedWith("Voting is over");
    candidate = await voting.candidates(0);
    expect(candidate["votes"]).to.be.equal(2);
  });

  it("Doesnt't allow owner to withdraw tokens before voting finished", async function(){
    let votingBalance = await ethers.provider.getBalance(voting.address);
    await expect(voting.connect(admin).withdraw()).to.be.revertedWith("You can't make withdrawal until voting is finished");
    expect(await ethers.provider.getBalance(voting.address)).to.be.equal(votingBalance);
  });

  it("Allows any user to finish voting when voting time ended", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.Started);
    let votingBalance = await ethers.provider.getBalance(voting.address);
    let candidateBalance = await ethers.provider.getBalance(candidate1.address);
    await expect(voting.connect(user).finishVoting()).to.emit(voting, "VotingEnded").withArgs(0, candidate1.address, 2);
    expect(await voting.status()).to.be.equal(votingStatus.Finished);
    expect(await ethers.provider.getBalance(candidate1.address)).to.be.equal(BigInt(candidateBalance) + BigInt(votingBalance * 0.9));
    expect(await ethers.provider.getBalance(voting.address)).to.be.equal(BigInt(votingBalance * 0.1));
  });

  it("Doesn't allow owner to start voting after it was ended", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.Finished);
    await expect(voting.connect(admin).startVoting(10)).to.be.revertedWith("Voting can't be started");
    expect(await voting.status()).to.be.equal(votingStatus.Finished);
  });

  it("Doesn't allow user to finish voting after it was ended", async function(){
    expect(await voting.status()).to.be.equal(votingStatus.Finished);
    await expect(voting.connect(user).finishVoting()).to.be.revertedWith("Voting is not running to be finished");
  });

  it("Doesnt't allow non-owner to withdraw tokens after voting finished", async function(){
    let votingBalance = await ethers.provider.getBalance(voting.address);
    await expect(voting.connect(user).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await ethers.provider.getBalance(voting.address)).to.be.equal(votingBalance);
  });

  it("Allows owner to withdraw tokens after voting finished", async function(){
    let votingBalance = await ethers.provider.getBalance(voting.address);
    await expect(voting.connect(admin).withdraw()).to.emit(voting, "Transfer").withArgs(voting.address, admin.address, votingBalance);
    expect(await ethers.provider.getBalance(voting.address)).to.be.equal(0);
  });

  it("Doesnt't allow owner to withdraw tokens twice", async function(){
    await expect(voting.connect(admin).withdraw()).to.be.revertedWith("Nothing to withdraw");
  });

  it("Doesn't allow winner to do anything on receve", async function(){
    Voting = await ethers.getContractFactory("Voting", admin);
    voting = await Voting.deploy();
    await voting.deployed();

    TestCandidate = await ethers.getContractFactory("TestCandidate", admin);
    testCandidate = await TestCandidate.deploy();
    await testCandidate.deployed();

    await expect(voting.connect(admin).addCandidates([testCandidate.address])).to.emit(voting, "CandidateAdded").withArgs(0, testCandidate.address);
    await expect(voting.connect(admin).startVoting(5)).to.emit(voting, "VotingStarted");
    await expect(voting.connect(user).vote(0, {
      value: ethers.utils.parseEther("0.01")
    })).to.emit(voting, "Vote").withArgs(0, user.address);
    await ethers.provider.send('evm_increaseTime', [15]);
    let votingBalance = await ethers.provider.getBalance(voting.address);
    await expect(voting.connect(user).finishVoting()).to.be.revertedWith("Failed to send Ether");
    expect(await ethers.provider.getBalance(voting.address)).to.be.equal(votingBalance);
  });

  it("Doesn't allow owner to do anything on receve", async function(){
    TestOwner = await ethers.getContractFactory("TestOwner", admin);
    testOwner = await TestOwner.deploy();
    await testOwner.deployed();
    let votingAddress = await testOwner.voting();
    voting = await ethers.getContractAt("Voting", votingAddress);

    await expect(testOwner.addCandidates([candidate1.address])).to.emit(voting, "CandidateAdded").withArgs(0, candidate1.address);
    await expect(testOwner.startVoting(5)).to.emit(voting, "VotingStarted");
    await expect(voting.connect(user).vote(0, {
      value: ethers.utils.parseEther("0.01")
    })).to.emit(voting, "Vote").withArgs(0, user.address);
    await ethers.provider.send('evm_increaseTime', [15]);
    await expect(voting.finishVoting()).to.emit(voting, "VotingEnded").withArgs(0, candidate1.address, 1);
    let votingBalance = await ethers.provider.getBalance(voting.address);
    await expect(testOwner.withdraw()).to.be.revertedWith("Failed to withdraw Ether");
    expect(await ethers.provider.getBalance(voting.address)).to.be.equal(votingBalance);
  });
});