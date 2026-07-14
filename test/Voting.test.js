const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting, owner, voter1, voter2;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  it("should add candidates", async function () {
    await voting.addCandidate("Alice", "Independent");
    const count = await voting.getAllCandidatesCount();
    expect(count).to.equal(1);
  });

  it("should register a voter and allow them to vote once", async function () {
    await voting.addCandidate("Alice", "Independent");
    await voting.registerVoter(voter1.address);

    await voting.connect(voter1).vote(1);
    const candidate = await voting.getCandidate(1);
    expect(candidate[3]).to.equal(1); // voteCount

    await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
      "You have already voted"
    );
  });

  it("should reject votes from unregistered voters", async function () {
    await voting.addCandidate("Alice", "Independent");
    await expect(voting.connect(voter2).vote(1)).to.be.revertedWith(
      "You are not a registered voter"
    );
  });

  it("should end election and return the winner", async function () {
    await voting.addCandidate("Alice", "Independent");
    await voting.addCandidate("Bob", "Independent");
    await voting.registerVoter(voter1.address);
    await voting.registerVoter(voter2.address);

    await voting.connect(voter1).vote(1);
    await voting.connect(voter2).vote(1);

    await voting.endElection();
    const [winnerName, votes] = await voting.getWinner();
    expect(winnerName).to.equal("Alice");
    expect(votes).to.equal(2);
  });

  it("should reject non-owner actions (candidate add, voter register, end election)", async function () {
    await expect(
      voting.connect(voter1).addCandidate("Alice", "Independent")
    ).to.be.revertedWith("Only the election admin can perform this action");

    await expect(
      voting.connect(voter1).registerVoter(voter2.address)
    ).to.be.revertedWith("Only the election admin can perform this action");

    await expect(
      voting.connect(voter1).endElection()
    ).to.be.revertedWith("Only the election admin can perform this action");
  });

  it("should reject votes for an out-of-range candidate id", async function () {
    await voting.addCandidate("Alice", "Independent");
    await voting.registerVoter(voter1.address);

    await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Invalid candidate");
    await expect(voting.connect(voter1).vote(99)).to.be.revertedWith("Invalid candidate");
  });

  it("should block admin actions once the election has ended", async function () {
    await voting.addCandidate("Alice", "Independent");
    await voting.registerVoter(voter1.address);
    await voting.endElection();

    await expect(
      voting.addCandidate("Bob", "Independent")
    ).to.be.revertedWith("Election has already ended");

    await expect(
      voting.connect(voter1).vote(1)
    ).to.be.revertedWith("Election has already ended");
  });

  it("should prevent registering the same voter twice", async function () {
    await voting.registerVoter(voter1.address);
    await expect(voting.registerVoter(voter1.address)).to.be.revertedWith(
      "Voter already registered"
    );
  });
});
