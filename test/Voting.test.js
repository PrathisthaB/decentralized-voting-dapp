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
});
