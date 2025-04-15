import React from 'react';
import './RankingModal.css';

function RankingModal({ rankings, userRank, onClose }) {
  return (
    <div className="ranking-modal">
      <h2>Course Rankings</h2>
      <p className="user-rank">Your Rank: {userRank}</p>
      <div className="ranking-list">
        {rankings && rankings.map((ranking, index) => (
          <div
            key={ranking.user_id}
            className={`ranking-item ${ranking.user_id === sessionStorage.getItem('user_id') ? 'highlight' : ''}`}
          >
            <div className="ranking-info">
              <span className="rank-number">{index + 1}.</span>
              <span className="user-name">{ranking.user_name || 'Anonymous'}</span>
            </div>
            <span className="points">{ranking.points} pts</span>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default RankingModal; 