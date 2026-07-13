import React, { useRef, useState } from "react";

export default function CandidateCard({ candidate, maxVotes, canVote, onVote }) {
  const cardRef = useRef();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isVoting, setIsVoting] = useState(false);

  const fillPercent = maxVotes > 0 ? (candidate.voteCount / maxVotes) * 100 : 0;

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -12, y: px * 14 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const handleVote = async () => {
    setIsVoting(true);
    try {
      await onVote(candidate.id);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className="tilt-wrapper"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <div className="candidate-card-3d">
        <div className="card-glare" style={{ opacity: Math.min(Math.abs(tilt.x) + Math.abs(tilt.y), 10) / 14 }} />
        <div className="card-top">
          <span className="card-eyebrow">Certified Candidate</span>
          <h3>{candidate.name}</h3>
          <p className="party">{candidate.party}</p>
        </div>

        <div className="fill-gauge" aria-label={`${candidate.voteCount} votes`}>
          <div className="fill-gauge-track">
            <div
              className="fill-gauge-liquid"
              style={{ height: `${fillPercent}%` }}
            />
          </div>
          <span className="fill-gauge-count">{candidate.voteCount}</span>
        </div>

        {canVote && (
          <button
            className={`btn vote-btn ${isVoting ? "is-voting" : ""}`}
            onClick={handleVote}
            disabled={isVoting}
          >
            {isVoting ? "Sealing on-chain…" : "Cast Vote"}
          </button>
        )}
      </div>
    </div>
  );
}
