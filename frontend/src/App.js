import React, { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract-config";
import BallotBox3D from "./components/BallotBox3D";
import CandidateCard from "./components/CandidateCard";
import "./App.css";

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [electionEnded, setElectionEnded] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [voterStatus, setVoterStatus] = useState({ isRegistered: false, hasVoted: false });
  const [status, setStatus] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateParty, setNewCandidateParty] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [winner, setWinner] = useState(null);
  const [voteSignal, setVoteSignal] = useState(0);
  const [connecting, setConnecting] = useState(false);

  const loadCandidates = useCallback(async (votingContract) => {
    const count = await votingContract.methods.getAllCandidatesCount().call();
    const list = [];
    for (let i = 1; i <= count; i++) {
      const c = await votingContract.methods.getCandidate(i).call();
      list.push({ id: c[0], name: c[1], party: c[2], voteCount: Number(c[3]) });
    }
    setCandidates(list);
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not detected — install the browser extension to continue.");
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Instance = new Web3(window.ethereum);
      const votingContract = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      setContract(votingContract);
      setAccount(accounts[0]);

      const ownerAddress = await votingContract.methods.owner().call();
      setIsOwner(ownerAddress.toLowerCase() === accounts[0].toLowerCase());

      const ended = await votingContract.methods.electionEnded().call();
      setElectionEnded(ended);

      const voter = await votingContract.methods.voters(accounts[0]).call();
      setVoterStatus({ isRegistered: voter.isRegistered, hasVoted: voter.hasVoted });

      await loadCandidates(votingContract);
      setStatus("Wallet connected. Ballot ready.");
    } catch (err) {
      setStatus("Could not connect wallet: " + err.message);
    } finally {
      setConnecting(false);
    }
  }, [loadCandidates]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setStatus("Adding candidate…");
      await contract.methods.addCandidate(newCandidateName, newCandidateParty).send({ from: account });
      setNewCandidateName("");
      setNewCandidateParty("");
      await loadCandidates(contract);
      setStatus("Candidate certified.");
    } catch (err) {
      setStatus("Error adding candidate: " + err.message);
    }
  };

  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setStatus("Registering voter…");
      await contract.methods.registerVoter(registerAddress).send({ from: account });
      setRegisterAddress("");
      setStatus("Voter registered.");
    } catch (err) {
      setStatus("Error registering voter: " + err.message);
    }
  };

  const handleVote = async (candidateId) => {
    if (!contract) return;
    try {
      setStatus("Submitting your vote to the blockchain…");
      await contract.methods.vote(candidateId).send({ from: account });
      setVoterStatus((prev) => ({ ...prev, hasVoted: true }));
      setVoteSignal((s) => s + 1);
      await loadCandidates(contract);
      setStatus("Vote sealed on-chain. Thank you for voting.");
    } catch (err) {
      setStatus("Error casting vote: " + err.message);
    }
  };

  const handleEndElection = async () => {
    if (!contract) return;
    try {
      setStatus("Ending election…");
      await contract.methods.endElection().send({ from: account });
      setElectionEnded(true);
      setStatus("Election ended. Results are now final.");
    } catch (err) {
      setStatus("Error ending election: " + err.message);
    }
  };

  const handleGetWinner = async () => {
    if (!contract) return;
    try {
      const result = await contract.methods.getWinner().call();
      setWinner({ name: result[0], votes: result[1] });
    } catch (err) {
      setStatus("Error fetching winner: " + err.message);
    }
  };

  const maxVotes = candidates.reduce((m, c) => Math.max(m, c.voteCount), 0);

  return (
    <div className="app">
      <div className="grain-overlay" />

      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">On-chain election ledger</span>
          <h1>
            Every vote,
            <br />
            <em>sealed in glass.</em>
          </h1>
          <p className="hero-sub">
            A tamper-proof ballot box built on Ethereum. Once a vote drops in, it
            cannot be changed, hidden, or miscounted.
          </p>

          {!account ? (
            <button className="btn primary" onClick={connectWallet} disabled={connecting}>
              {connecting ? "Opening MetaMask…" : "Connect Wallet to Begin"}
            </button>
          ) : (
            <div className="account-chip">
              <span className="dot" />
              <span className="mono">{shortAddr(account)}</span>
              {isOwner && <span className="badge">Admin</span>}
              {electionEnded && <span className="badge ended">Closed</span>}
            </div>
          )}
        </div>

        <BallotBox3D voteSignal={voteSignal} glow={!!account && !electionEnded} />
      </header>

      {status && <div className="status-bar">{status}</div>}

      {account && isOwner && !electionEnded && (
        <section className="panel admin-panel">
          <span className="eyebrow">Election Admin</span>
          <form onSubmit={handleAddCandidate} className="form-row">
            <input
              placeholder="Candidate name"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              required
            />
            <input
              placeholder="Party / affiliation"
              value={newCandidateParty}
              onChange={(e) => setNewCandidateParty(e.target.value)}
              required
            />
            <button type="submit" className="btn">Certify Candidate</button>
          </form>

          <form onSubmit={handleRegisterVoter} className="form-row">
            <input
              placeholder="Voter wallet address (0x…)"
              value={registerAddress}
              onChange={(e) => setRegisterAddress(e.target.value)}
              required
            />
            <button type="submit" className="btn">Register Voter</button>
          </form>

          <button className="btn danger" onClick={handleEndElection}>
            Close Election
          </button>
        </section>
      )}

      {account && (
        <section className="panel candidates-section">
          <span className="eyebrow">Candidates</span>
          {candidates.length === 0 && (
            <p className="empty-state">No candidates certified yet. Check back once the admin adds one.</p>
          )}
          <div className="candidate-grid">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                maxVotes={maxVotes}
                canVote={!electionEnded && !voterStatus.hasVoted && voterStatus.isRegistered}
                onVote={handleVote}
              />
            ))}
          </div>

          {voterStatus.hasVoted && (
            <p className="voted-msg">Your vote is recorded on the blockchain and cannot be altered.</p>
          )}
          {!voterStatus.isRegistered && !isOwner && (
            <p className="warn-msg">You're not registered to vote yet. Contact the election admin.</p>
          )}
        </section>
      )}

      {account && electionEnded && (
        <section className="panel results-section">
          <span className="eyebrow">Results</span>
          <button className="btn" onClick={handleGetWinner}>Reveal Winner</button>
          {winner && (
            <p className="winner">
              Winner: <strong>{winner.name}</strong> — {winner.votes} votes
            </p>
          )}
        </section>
      )}

      <footer className="footer">
        <span className="mono">Voting.sol</span> · Ethereum · Web3.js · React
      </footer>
    </div>
  );
}

export default App;
