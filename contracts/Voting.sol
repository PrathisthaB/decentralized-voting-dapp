// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Decentralized Voting Application
/// @notice A tamper-proof voting smart contract with immutable vote recording.
/// @dev Deployed on Ethereum (tested on Goerli Testnet). Frontend built with React.js + Web3.js.
contract Voting {
    address public owner;
    bool public electionEnded;

    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    uint256 public candidatesCount;
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionEnded(uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the election admin can perform this action");
        _;
    }

    modifier electionActive() {
        require(!electionEnded, "Election has already ended");
        _;
    }

    constructor() {
        owner = msg.sender;
        electionEnded = false;
    }

    /// @notice Admin adds a candidate before voting starts
    function addCandidate(string memory _name, string memory _party) public onlyOwner electionActive {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    /// @notice Admin registers a wallet address as an eligible voter (MetaMask address)
    function registerVoter(address _voter) public onlyOwner electionActive {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter] = Voter(true, false, 0);
        emit VoterRegistered(_voter);
    }

    /// @notice Registered voter casts a vote for a candidate. Immutable once recorded.
    function vote(uint256 _candidateId) public electionActive {
        Voter storage sender = voters[msg.sender];
        require(sender.isRegistered, "You are not a registered voter");
        require(!sender.hasVoted, "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId);
    }

    /// @notice Ends the election. Results become final and public.
    function endElection() public onlyOwner electionActive {
        electionEnded = true;
        emit ElectionEnded(block.timestamp);
    }

    function getCandidate(uint256 _candidateId)
        public
        view
        returns (uint256, string memory, string memory, uint256)
    {
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.party, c.voteCount);
    }

    function getAllCandidatesCount() public view returns (uint256) {
        return candidatesCount;
    }

    function getWinner() public view returns (string memory winnerName, uint256 winningVoteCount) {
        require(electionEnded, "Election is still ongoing");
        uint256 winningId = 0;
        uint256 maxVotes = 0;
        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winningId = i;
            }
        }
        require(winningId != 0, "No votes cast yet");
        return (candidates[winningId].name, candidates[winningId].voteCount);
    }
}
