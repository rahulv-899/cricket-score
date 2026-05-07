import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './App.css';

// Default player names list
const DEFAULT_PLAYERS = [
  'Nitish', 'Loki', 'Rahul', 'Dasa', 'B.aravind', 'R.V', 'Suresh', 'Vishal',
  'Mohan', 'Sanjay', 'Maran', 'Parthee', 'Rajesh', 'VickyG', 'Vicky',
  'Prasanth', 'Ram', 'Sakthi', 'Jacky', 'Kamesh'
];

// Player Names Modal Component
function PlayerNamesModal({ isOpen, onClose, onAddPlayers, team1Players = [], team2Players = [] }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [customPlayers, setCustomPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [targetTeam, setTargetTeam] = useState(null);

  const allPlayers = [...DEFAULT_PLAYERS, ...customPlayers];

  // Check which team a player belongs to
  const getPlayerTeam = (name) => {
    if (team1Players.some(p => p.name.toLowerCase() === name.toLowerCase())) return 1;
    if (team2Players.some(p => p.name.toLowerCase() === name.toLowerCase())) return 2;
    return null;
  };

  const togglePlayer = (name) => {
    // Don't allow selecting if already in a team
    if (getPlayerTeam(name)) return;
    
    setSelectedPlayers(prev => 
      prev.includes(name) 
        ? prev.filter(p => p !== name)
        : [...prev, name]
    );
  };

  const handleAddCustomPlayer = () => {
    if (newPlayerName.trim() && !allPlayers.includes(newPlayerName.trim())) {
      setCustomPlayers(prev => [...prev, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const handleAddToTeam = (team) => {
    if (selectedPlayers.length > 0) {
      onAddPlayers(selectedPlayers, team);
      setSelectedPlayers([]);
      setTargetTeam(null);
    }
  };

  const handleClose = () => {
    setSelectedPlayers([]);
    setTargetTeam(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="player-names-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Player Names</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="player-names-list">
          {allPlayers.map((name, idx) => {
            const playerTeam = getPlayerTeam(name);
            const isDisabled = playerTeam !== null;
            return (
              <div 
                key={name}
                className={`player-name-item ${selectedPlayers.includes(name) ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${playerTeam === 1 ? 'in-team1' : ''} ${playerTeam === 2 ? 'in-team2' : ''}`}
                onClick={() => togglePlayer(name)}
              >
                <span className="player-number">{idx + 1}.</span>
                <span className="player-name">{name}</span>
                {selectedPlayers.includes(name) && <span className="check-mark">✓</span>}
                {playerTeam && <span className="team-badge">T{playerTeam}</span>}
              </div>
            );
          })}
        </div>

        <div className="add-new-player">
          <input
            type="text"
            placeholder="Add new player..."
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPlayer()}
          />
          <button onClick={handleAddCustomPlayer}>+</button>
        </div>

        {selectedPlayers.length > 0 && (
          <div className="team-selection">
            <p className="selected-count">{selectedPlayers.length} player(s) selected</p>
            <div className="team-buttons">
              <button 
                className="team-btn team1-btn"
                onClick={() => handleAddToTeam(1)}
              >
                Add to Team 1
              </button>
              <button 
                className="team-btn team2-btn"
                onClick={() => handleAddToTeam(2)}
              >
                Add to Team 2
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Team Setup Component
function TeamSetup() {
  const { state, dispatch } = useApp();
  const [showPlayerNames, setShowPlayerNames] = useState(false);

  const handleAddPlayer = (team, name) => {
    if (name.trim()) {
      dispatch({ type: team === 1 ? 'ADD_PLAYER_TEAM1' : 'ADD_PLAYER_TEAM2', payload: name.trim() });
    }
  };

  const handleAddPlayersFromModal = (players, team) => {
    players.forEach(name => {
      // Check if player already exists in the team
      const teamPlayers = team === 1 ? state.team1.players : state.team2.players;
      if (!teamPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        handleAddPlayer(team, name);
      }
    });
  };

  const handleStartMatch = (battingTeam) => {
    if (state.team1.name && state.team2.name && 
        state.team1.players.length >= 1 && state.team2.players.length >= 1 &&
        state.overs > 0) {
      dispatch({ type: 'START_MATCH', payload: { battingTeam } });
    }
  };

  const canStart = state.team1.name && state.team2.name && 
                   state.team1.players.length >= 1 && state.team2.players.length >= 1 &&
                   state.overs > 0;

  return (
    <div className="setup-container">
      <h1>🏏 Cricket ScoreCard</h1>
      
      <div className="teams-grid">
        {/* Team 1 */}
        <div className="team-box">
          <input
            type="text"
            placeholder="Team 1 Name"
            value={state.team1.name}
            onChange={(e) => dispatch({ type: 'SET_TEAM1_NAME', payload: e.target.value })}
            className="team-name-input"
          />
          <div className="add-player-row">
            <input
              type="text"
              placeholder="Add player name"
              id="player1Input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddPlayer(1, e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button onClick={() => {
              const input = document.getElementById('player1Input');
              handleAddPlayer(1, input.value);
              input.value = '';
            }}>Add</button>
          </div>
          <ul className="players-list">
            {state.team1.players.map(p => (
              <li key={p.id}>
                {p.name}
                <button onClick={() => dispatch({ type: 'REMOVE_PLAYER_TEAM1', payload: p.id })}>×</button>
              </li>
            ))}
          </ul>
          <span className="player-count">{state.team1.players.length} players</span>
        </div>

        {/* Team 2 */}
        <div className="team-box">
          <input
            type="text"
            placeholder="Team 2 Name"
            value={state.team2.name}
            onChange={(e) => dispatch({ type: 'SET_TEAM2_NAME', payload: e.target.value })}
            className="team-name-input"
          />
          <div className="add-player-row">
            <input
              type="text"
              placeholder="Add player name"
              id="player2Input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddPlayer(2, e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button onClick={() => {
              const input = document.getElementById('player2Input');
              handleAddPlayer(2, input.value);
              input.value = '';
            }}>Add</button>
          </div>
          <ul className="players-list">
            {state.team2.players.map(p => (
              <li key={p.id}>
                {p.name}
                <button onClick={() => dispatch({ type: 'REMOVE_PLAYER_TEAM2', payload: p.id })}>×</button>
              </li>
            ))}
          </ul>
          <span className="player-count">{state.team2.players.length} players</span>
        </div>
      </div>

      <div className="overs-select">
        <label>Overs: </label>
        <input 
          type="number" 
          min="1" 
          max="50"
          placeholder="Enter overs"
          value={state.overs || ''} 
          onChange={(e) => dispatch({ type: 'SET_OVERS', payload: parseInt(e.target.value) || 0 })}
        />
        {!state.overs && state.team1.name && state.team2.name && state.team1.players.length >= 1 && state.team2.players.length >= 1 && (
          <span className="overs-error">⚠️ Please enter overs</span>
        )}
      </div>

      {canStart && (
        <div className="toss-section">
          <h3>Who is batting first?</h3>
          <div className="toss-buttons">
            <button onClick={() => handleStartMatch('team1')}>{state.team1.name}</button>
            <button onClick={() => handleStartMatch('team2')}>{state.team2.name}</button>
          </div>
        </div>
      )}

      {!canStart && (
        <p className="hint">
          {!state.team1.name || !state.team2.name 
            ? 'Add team names' 
            : state.team1.players.length < 1 || state.team2.players.length < 1 
              ? 'Add at least 1 player in each team'
              : !state.overs || state.overs <= 0
                ? 'Enter number of overs to play'
                : ''}
        </p>
      )}

      {/* Footer Button */}
      <div className="footer-btn-container">
        <button 
          className="player-names-btn"
          onClick={() => setShowPlayerNames(true)}
        >
          👥 Player Names
        </button>
      </div>

      {/* Player Names Modal */}
      <PlayerNamesModal
        isOpen={showPlayerNames}
        onClose={() => setShowPlayerNames(false)}
        onAddPlayers={handleAddPlayersFromModal}
        team1Players={state.team1.players}
        team2Players={state.team2.players}
      />
    </div>
  );
}

// Select Opening Players
function SelectPlayers() {
  const { state, dispatch } = useApp();
  
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);

  const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
  const bowlingTeam = state.battingTeam === 'team1' ? state.team2 : state.team1;
  
  // Single player mode - no non-striker needed
  const isSinglePlayer = battingTeam.players.length === 1;

  const handleStart = () => {
    if (striker && bowler && (nonStriker || isSinglePlayer)) {
      dispatch({
        type: 'SELECT_OPENING_PLAYERS',
        payload: { striker, nonStriker: isSinglePlayer ? null : nonStriker, bowler }
      });
    }
  };

  return (
    <div className="select-players">
      <h2>Select Opening Players</h2>
      
      <div className="selection-group">
        <h3>🏏 {battingTeam.name} - Select Batsmen</h3>
        <div className="player-select">
          <label>Striker:</label>
          <select value={striker?.id || ''} onChange={(e) => {
            const p = battingTeam.players.find(pl => pl.id === e.target.value);
            setStriker(p);
          }}>
            <option value="">Select striker</option>
            {battingTeam.players.filter(p => p.id !== nonStriker?.id).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {!isSinglePlayer && (
          <div className="player-select">
            <label>Non-Striker:</label>
            <select value={nonStriker?.id || ''} onChange={(e) => {
              const p = battingTeam.players.find(pl => pl.id === e.target.value);
              setNonStriker(p);
            }}>
              <option value="">Select non-striker</option>
              {battingTeam.players.filter(p => p.id !== striker?.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        {isSinglePlayer && (
          <p className="single-mode-hint">Playing Single (1 player only)</p>
        )}
      </div>

      <div className="selection-group">
        <h3>⚾ {bowlingTeam.name} - Select Bowler</h3>
        <div className="player-select">
          <label>Bowler:</label>
          <select value={bowler?.id || ''} onChange={(e) => {
            const p = bowlingTeam.players.find(pl => pl.id === e.target.value);
            setBowler(p);
          }}>
            <option value="">Select bowler</option>
            {bowlingTeam.players.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button 
        className="start-btn"
        onClick={handleStart}
        disabled={!striker || !bowler || (!nonStriker && !isSinglePlayer)}
      >
        Start Scoring
      </button>
    </div>
  );
}

// Live Scoring Component
function LiveScoring() {
  const { state, dispatch } = useApp();
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showPlaySingleModal, setShowPlaySingleModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [batsmanToSwap, setBatsmanToSwap] = useState(null); // striker or non-striker to be replaced
  const [activeTab, setActiveTab] = useState('scoring'); // 'scoring' | 'stats'
  const [selectedTeamStats, setSelectedTeamStats] = useState('first'); // 'first' | 'second'
  const [animation, setAnimation] = useState(null); // 'four' | 'six' | 'wicket' | 'win'

  const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
  const bowlingTeam = state.battingTeam === 'team1' ? state.team2 : state.team1;
  
  const currentOvers = Math.floor(state.balls / 6);
  const currentBalls = state.balls % 6;
  const totalBalls = state.overs * 6;
  // Street cricket: innings complete only when ALL batsmen are out (last one plays single)
  // Also complete if second innings team beats the target
  const targetBeaten = state.innings === 2 && state.firstInningsScore !== null && state.score > state.firstInningsScore;
  const isInningsComplete = state.balls >= totalBalls || state.wickets >= state.battingPlayers.length || targetBeaten;

  const availableBatsmen = state.battingPlayers.filter(
    p => p.id !== state.striker?.id && 
         p.id !== state.nonStriker?.id && 
         !state.outBatsmen.includes(p.id)
  );

  // Available batsmen for swap (includes retired batsmen and pavilion batsman who can come back)
  const swappableBatsmen = [
    ...state.battingPlayers.filter(
      p => p.id !== state.striker?.id && 
           p.id !== state.nonStriker?.id && 
           !state.outBatsmen.includes(p.id) &&
           p.id !== state.pavilionBatsman?.id  // Don't duplicate pavilion batsman
    ),
    // Include pavilion batsman if exists (they can be swapped in)
    ...(state.pavilionBatsman ? [state.pavilionBatsman] : [])
  ];

  // Calculate batting stats from ball-by-ball
  const getBatsmanStats = () => {
    const stats = {};
    state.ballByBall.forEach(ball => {
      const batsmanId = ball.striker?.id;
      if (!batsmanId) return;
      
      if (!stats[batsmanId]) {
        stats[batsmanId] = {
          id: batsmanId,
          name: ball.striker.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false
        };
      }
      
      // Only count runs scored by batsman (not extras like wides)
      if (!ball.isWide) {
        stats[batsmanId].runs += ball.runs;
        stats[batsmanId].balls += 1;
        if (ball.runs === 4) stats[batsmanId].fours += 1;
        if (ball.runs === 6) stats[batsmanId].sixes += 1;
      }
      
      if (ball.isWicket) {
        stats[batsmanId].isOut = true;
      }
    });
    
    // Add current batsmen if not in stats yet
    [state.striker, state.nonStriker].forEach(batsman => {
      if (batsman && !stats[batsman.id]) {
        stats[batsman.id] = {
          id: batsman.id,
          name: batsman.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false
        };
      }
    });
    
    return Object.values(stats).map(s => ({
      ...s,
      strikeRate: s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : '0.0',
      isBatting: s.id === state.striker?.id || s.id === state.nonStriker?.id
    }));
  };

  // Calculate bowling stats from ball-by-ball
  const getBowlerStats = () => {
    const stats = {};
    state.ballByBall.forEach(ball => {
      const bowlerId = ball.bowler?.id;
      if (!bowlerId) return;
      
      if (!stats[bowlerId]) {
        stats[bowlerId] = {
          id: bowlerId,
          name: ball.bowler.name,
          balls: 0,
          runs: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0
        };
      }
      
      // Legal delivery
      if (!ball.isWide && !ball.isNoBall) {
        stats[bowlerId].balls += 1;
      }
      
      stats[bowlerId].runs += ball.totalRuns || ball.runs;
      
      if (ball.isWicket) stats[bowlerId].wickets += 1;
      if (ball.isWide) stats[bowlerId].wides += 1;
      if (ball.isNoBall) stats[bowlerId].noBalls += 1;
    });
    
    return Object.values(stats).map(s => ({
      ...s,
      overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
      economy: s.balls > 0 ? ((s.runs / (s.balls / 6))).toFixed(2) : '0.00',
      isBowling: s.id === state.currentBowler?.id
    }));
  };

  // Get batting stats from any ball-by-ball array
  const getStatsFromBallByBall = (ballByBall) => {
    const batStats = {};
    const bowlStats = {};
    
    ballByBall.forEach(ball => {
      // Batting stats
      const batsmanId = ball.striker?.id;
      if (batsmanId) {
        if (!batStats[batsmanId]) {
          batStats[batsmanId] = {
            id: batsmanId,
            name: ball.striker.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false
          };
        }
        if (!ball.isWide) {
          batStats[batsmanId].runs += ball.runs;
          batStats[batsmanId].balls += 1;
          if (ball.runs === 4) batStats[batsmanId].fours += 1;
          if (ball.runs === 6) batStats[batsmanId].sixes += 1;
        }
        if (ball.isWicket) batStats[batsmanId].isOut = true;
      }
      
      // Bowling stats
      const bowlerId = ball.bowler?.id;
      if (bowlerId) {
        if (!bowlStats[bowlerId]) {
          bowlStats[bowlerId] = {
            id: bowlerId,
            name: ball.bowler.name,
            balls: 0,
            runs: 0,
            wickets: 0
          };
        }
        if (!ball.isWide && !ball.isNoBall) {
          bowlStats[bowlerId].balls += 1;
        }
        bowlStats[bowlerId].runs += ball.totalRuns || ball.runs;
        if (ball.isWicket) bowlStats[bowlerId].wickets += 1;
      }
    });
    
    return {
      batting: Object.values(batStats).map(s => ({
        ...s,
        strikeRate: s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : '0.0'
      })),
      bowling: Object.values(bowlStats).map(s => ({
        ...s,
        overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
        economy: s.balls > 0 ? ((s.runs / (s.balls / 6))).toFixed(2) : '0.00'
      }))
    };
  };

  // Calculate Man of the Match
  const getManOfTheMatch = () => {
    if (state.innings !== 2) return null;
    
    const firstInningsStats = getStatsFromBallByBall(state.firstInningsBallByBall || []);
    const secondInningsStats = getStatsFromBallByBall(state.ballByBall);
    
    const allBatsmen = [...firstInningsStats.batting, ...secondInningsStats.batting];
    const allBowlers = [...firstInningsStats.bowling, ...secondInningsStats.bowling];
    
    // Score: runs + (wickets * 25)
    let bestPlayer = null;
    let bestScore = 0;
    
    // Check batsmen
    allBatsmen.forEach(b => {
      const score = b.runs;
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = { name: b.name, runs: b.runs, wickets: 0, type: 'batsman' };
      }
    });
    
    // Check bowlers (3+ wickets is significant)
    allBowlers.forEach(b => {
      const score = b.wickets * 30;
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = { name: b.name, runs: 0, wickets: b.wickets, type: 'bowler' };
      }
    });
    
    return bestPlayer;
  };

  const recordBall = (runs, extras = {}) => {
    // Trigger animation for 4s and 6s
    if (runs === 4 && !extras.isWicket) {
      setAnimation('four');
      setTimeout(() => setAnimation(null), 1200);
    } else if (runs === 6 && !extras.isWicket) {
      setAnimation('six');
      setTimeout(() => setAnimation(null), 1500);
    }
    
    dispatch({
      type: 'RECORD_BALL',
      payload: { runs, ...extras }
    });
  };

  const handleWicket = (newBatsman) => {
    setAnimation('wicket');
    setTimeout(() => setAnimation(null), 1500);
    
    dispatch({
      type: 'RECORD_BALL',
      payload: { runs: 0, isWicket: true, newBatsman }
    });
    setShowWicketModal(false);
  };

  const handleBowlerChange = (newBowler) => {
    dispatch({ type: 'CHANGE_BOWLER', payload: newBowler });
    setShowBowlerModal(false);
  };

  // Auto-dismiss over complete popup if only 1 bowler
  useEffect(() => {
    if (state.showOverComplete && bowlingTeam.players.length === 1) {
      // Auto-continue with same bowler after brief delay
      const timer = setTimeout(() => {
        dispatch({ type: 'CHANGE_BOWLER', payload: state.currentBowler });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.showOverComplete, bowlingTeam.players.length]);

  // Trigger win animation when match completes
  useEffect(() => {
    if (state.innings === 2 && isInningsComplete && !animation) {
      setAnimation('win');
      setTimeout(() => setAnimation(null), 3000);
    }
  }, [state.innings, isInningsComplete]);

  const getBallDisplay = (ball) => {
    if (ball.isWicket) return 'W';
    if (ball.isWide) return `${ball.runs}wd`;
    if (ball.isNoBall) return `${ball.runs}nb`;
    return ball.runs;
  };

  return (
    <div className="scoring-container">
      {/* Event Animations */}
      {animation === 'four' && (
        <div className="event-overlay four-animation">
          <div className="event-content">
            <span className="event-icon">4️⃣</span>
            <span className="event-text">FOUR!</span>
          </div>
        </div>
      )}
      {animation === 'six' && (
        <div className="event-overlay six-animation">
          <div className="event-content">
            <span className="event-icon">6️⃣</span>
            <span className="event-text">MAXIMUM!</span>
            <div className="fireworks"></div>
          </div>
        </div>
      )}
      {animation === 'wicket' && (
        <div className="event-overlay wicket-animation">
          <div className="event-content">
            <span className="event-icon">🎯</span>
            <span className="event-text">WICKET!</span>
          </div>
        </div>
      )}
      {animation === 'win' && (
        <div className="event-overlay win-animation">
          <div className="event-content">
            <span className="event-icon">🏆</span>
            <span className="event-text">MATCH WON!</span>
            <div className="confetti"></div>
          </div>
        </div>
      )}

      {/* Over Complete Popup - only show if multiple bowlers */}
      {state.showOverComplete && bowlingTeam.players.length > 1 && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>🎉 Over Complete!</h2>
            <p>Select next bowler</p>
            <div className="bowler-list">
              {bowlingTeam.players.filter(p => p.id !== state.currentBowler?.id).map(p => (
                <button key={p.id} onClick={() => handleBowlerChange(p)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Wicket! 🏏</h2>
            <p>{state.striker?.name} is OUT</p>
            <p>Select new batsman:</p>
            <div className="batsman-list">
              {availableBatsmen.map(p => (
                <button key={p.id} onClick={() => handleWicket(p)}>
                  {p.name}
                </button>
              ))}
            </div>
            <button className="cancel-btn" onClick={() => setShowWicketModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Play Single Modal */}
      {showPlaySingleModal && (
        <div className="modal-overlay">
          <div className="modal play-single-modal">
            <h2>🏏 Play Single</h2>
            <p>Who goes to pavilion?</p>
            <div className="play-single-batsmen">
              <button 
                className="batsman-choice-btn"
                onClick={() => {
                  dispatch({ type: 'SET_PLAY_SINGLE', payload: state.nonStriker });
                  setShowPlaySingleModal(false);
                }}
              >
                <span className="batsman-role">Striker</span>
                <span className="batsman-name">{state.striker?.name}</span>
                <span className="batsman-action">goes to pavilion</span>
              </button>
              <button 
                className="batsman-choice-btn"
                onClick={() => {
                  dispatch({ type: 'SET_PLAY_SINGLE', payload: state.striker });
                  setShowPlaySingleModal(false);
                }}
              >
                <span className="batsman-role">Non-Striker</span>
                <span className="batsman-name">{state.nonStriker?.name}</span>
                <span className="batsman-action">goes to pavilion</span>
              </button>
            </div>
            <button 
              className="cancel-btn"
              onClick={() => setShowPlaySingleModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Swap Batsman Modal - Step 1: Choose which batsman to replace */}
      {showSwapModal && !batsmanToSwap && (
        <div className="modal-overlay">
          <div className="modal swap-modal">
            <h2>🔄 Swap Batsman</h2>
            <p>Who needs to be replaced?</p>
            <div className="swap-batsmen-list">
              <button 
                className="batsman-choice-btn"
                onClick={() => setBatsmanToSwap(state.striker)}
              >
                <span className="batsman-role">Striker</span>
                <span className="batsman-name">{state.striker?.name}</span>
              </button>
              {state.nonStriker && (
                <button 
                  className="batsman-choice-btn"
                  onClick={() => setBatsmanToSwap(state.nonStriker)}
                >
                  <span className="batsman-role">Non-Striker</span>
                  <span className="batsman-name">{state.nonStriker?.name}</span>
                </button>
              )}
            </div>
            <button 
              className="cancel-btn"
              onClick={() => setShowSwapModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Swap Batsman Modal - Step 2: Choose replacement player */}
      {showSwapModal && batsmanToSwap && (
        <div className="modal-overlay">
          <div className="modal swap-modal">
            <h2>🔄 Replace {batsmanToSwap.name}</h2>
            {swappableBatsmen.length > 0 ? (
              <>
                <p>Select new batsman:</p>
                <div className="swap-batsmen-list">
                  {swappableBatsmen.map(p => (
                    <button 
                      key={p.id}
                      className="batsman-choice-btn"
                      onClick={() => {
                        dispatch({ 
                          type: 'SWAP_BATSMAN', 
                          payload: { leavingBatsman: batsmanToSwap, newBatsman: p }
                        });
                        setBatsmanToSwap(null);
                        setShowSwapModal(false);
                      }}
                    >
                      <span className="batsman-name">{p.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-players-msg">No players available to swap in. All players are either batting or out.</p>
            )}
            <button 
              className="cancel-btn"
              onClick={() => {
                setBatsmanToSwap(null);
                setShowSwapModal(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Top Bar with action buttons (left) and Reset (right) */}
      <div className="top-bar">
        <div className="top-bar-left">
          {state.nonStriker && !isInningsComplete && (
            <button 
              className="play-single-btn-top"
              onClick={() => setShowPlaySingleModal(true)}
            >
              🏏 Play Single
            </button>
          )}
          {state.pavilionBatsman && !isInningsComplete && (
            <button 
              className="bring-back-btn-top"
              onClick={() => dispatch({ type: 'UNDO_PLAY_SINGLE' })}
            >
              ↩ Bring Back {state.pavilionBatsman.name}
            </button>
          )}
          {!isInningsComplete && (
            <button 
              className="swap-btn-top"
              onClick={() => setShowSwapModal(true)}
            >
              🔄 Swap
            </button>
          )}
        </div>
        <button className="reset-btn" onClick={() => {
          if (window.confirm('Reset entire match?')) {
            dispatch({ type: 'RESET' });
          }
        }}>
          Reset Match
        </button>
      </div>

      {/* Header */}
      <div className="score-header">
        <h2>{battingTeam.name} {state.innings === 2 ? '(2nd Innings)' : ''}</h2>
        <div className="main-score">
          <span className="runs">{state.score}</span>
          <span className="separator">/</span>
          <span className="wickets">{state.wickets}</span>
        </div>
        <div className="overs">({currentOvers}.{currentBalls} / {state.overs} ov)</div>
        {state.innings === 2 && state.firstInningsScore !== null && (
          <div className="target-info">Target: {state.firstInningsScore + 1} | Need: {state.firstInningsScore + 1 - state.score} runs</div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'scoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('scoring')}
        >
          🏏 Scoring
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Live Stats
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="stats-view">
          {/* Show both teams after match complete */}
          {state.innings === 2 && isInningsComplete ? (
            <>
              {/* Team Scores Header - Clickable */}
              <div className="match-scores-header">
                <div 
                  className={`team-score-box ${selectedTeamStats === 'first' ? 'selected' : ''}`}
                  onClick={() => setSelectedTeamStats('first')}
                >
                  <span className="team-name">{bowlingTeam.name}</span>
                  <span className="team-score">{state.firstInningsScore}/{state.firstInningsWickets}</span>
                </div>
                <div 
                  className={`team-score-box ${selectedTeamStats === 'second' ? 'selected' : ''}`}
                  onClick={() => setSelectedTeamStats('second')}
                >
                  <span className="team-name">{battingTeam.name}</span>
                  <span className="team-score">{state.score}/{state.wickets}</span>
                </div>
              </div>

              {/* Show selected team's stats */}
              {selectedTeamStats === 'first' ? (
                <div className="innings-stats">
                  <h3 className="innings-title">{bowlingTeam.name} - 1st Innings</h3>
                  <div className="stats-section">
                    <h4>🏏 Batting</h4>
                    <div className="stats-table">
                      <div className="stats-header">
                        <span className="col-name">Batsman</span>
                        <span className="col-stat">R</span>
                        <span className="col-stat">B</span>
                        <span className="col-stat">SR</span>
                      </div>
                      {getStatsFromBallByBall(state.firstInningsBallByBall || []).batting.map(b => (
                        <div key={b.id} className={`stats-row ${b.isOut ? 'out' : ''}`}>
                          <span className="col-name">{b.name} {!b.isOut && '*'}</span>
                          <span className="col-stat">{b.runs}</span>
                          <span className="col-stat">{b.balls}</span>
                          <span className="col-stat">{b.strikeRate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="stats-section">
                    <h4>⚾ Bowling</h4>
                    <div className="stats-table bowling-table">
                      <div className="stats-header bowling-header">
                        <span className="col-name">Bowler</span>
                        <span className="col-stat">O</span>
                        <span className="col-stat">R</span>
                        <span className="col-stat">W</span>
                      </div>
                      {getStatsFromBallByBall(state.firstInningsBallByBall || []).bowling.map(b => (
                        <div key={b.id} className="stats-row bowling-row">
                          <span className="col-name">{b.name}</span>
                          <span className="col-stat">{b.overs}</span>
                          <span className="col-stat">{b.runs}</span>
                          <span className="col-stat">{b.wickets}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="innings-stats">
                  <h3 className="innings-title">{battingTeam.name} - 2nd Innings</h3>
                  <div className="stats-section">
                    <h4>🏏 Batting</h4>
                    <div className="stats-table">
                      <div className="stats-header">
                        <span className="col-name">Batsman</span>
                        <span className="col-stat">R</span>
                        <span className="col-stat">B</span>
                        <span className="col-stat">SR</span>
                      </div>
                      {getStatsFromBallByBall(state.ballByBall).batting.map(b => (
                        <div key={b.id} className={`stats-row ${b.isOut ? 'out' : ''}`}>
                          <span className="col-name">{b.name} {!b.isOut && '*'}</span>
                          <span className="col-stat">{b.runs}</span>
                          <span className="col-stat">{b.balls}</span>
                          <span className="col-stat">{b.strikeRate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="stats-section">
                    <h4>⚾ Bowling</h4>
                    <div className="stats-table bowling-table">
                      <div className="stats-header bowling-header">
                        <span className="col-name">Bowler</span>
                        <span className="col-stat">O</span>
                        <span className="col-stat">R</span>
                        <span className="col-stat">W</span>
                      </div>
                      {getStatsFromBallByBall(state.ballByBall).bowling.map(b => (
                        <div key={b.id} className="stats-row bowling-row">
                          <span className="col-name">{b.name}</span>
                          <span className="col-stat">{b.overs}</span>
                          <span className="col-stat">{b.runs}</span>
                          <span className="col-stat">{b.wickets}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Current Innings Stats (during match) */}
              {/* Batting Stats */}
              <div className="stats-section">
                <h3>🏏 Batting</h3>
                <div className="stats-table">
                  <div className="stats-header">
                    <span className="col-name">Batsman</span>
                    <span className="col-stat">R</span>
                    <span className="col-stat">B</span>
                    <span className="col-stat">4s</span>
                    <span className="col-stat">6s</span>
                    <span className="col-stat">SR</span>
                  </div>
                  {getBatsmanStats().map(b => (
                    <div key={b.id} className={`stats-row ${b.isBatting ? 'active' : ''} ${b.isOut ? 'out' : ''}`}>
                      <span className="col-name">
                        {b.name} {b.isBatting ? (b.id === state.striker?.id ? '*' : '') : ''}
                        {b.isOut && <span className="out-badge">OUT</span>}
                      </span>
                      <span className="col-stat">{b.runs}</span>
                      <span className="col-stat">{b.balls}</span>
                      <span className="col-stat">{b.fours}</span>
                      <span className="col-stat">{b.sixes}</span>
                      <span className="col-stat">{b.strikeRate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bowling Stats */}
              <div className="stats-section">
                <h3>⚾ Bowling</h3>
                <div className="stats-table bowling-table">
                  <div className="stats-header bowling-header">
                    <span className="col-name">Bowler</span>
                    <span className="col-stat">O</span>
                    <span className="col-stat">R</span>
                    <span className="col-stat">W</span>
                    <span className="col-stat">Econ</span>
                  </div>
                  {getBowlerStats().map(b => (
                    <div key={b.id} className={`stats-row bowling-row ${b.isBowling ? 'active' : ''}`}>
                      <span className="col-name">
                        {b.name} {b.isBowling ? '*' : ''}
                      </span>
                      <span className="col-stat">{b.overs}</span>
                      <span className="col-stat">{b.runs}</span>
                      <span className="col-stat">{b.wickets}</span>
                      <span className="col-stat">{b.economy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras Summary */}
              <div className="extras-summary">
                <span>Extras: </span>
                <span>WD: {state.ballByBall.filter(b => b.isWide).length}</span>
                <span>NB: {state.ballByBall.filter(b => b.isNoBall).length}</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Current Players */}
          <div className="current-players">
            <div className="batsmen">
              <div className="player-row striker">
                <span className="label">🏏 Striker:</span>
                <span className="name">{state.striker?.name} *</span>
              </div>
              <div className="player-row">
                <span className="label">Non-Striker:</span>
                <span className="name">{state.nonStriker?.name || '(Playing Single)'}</span>
              </div>
            </div>
            <div className="bowler">
              <span className="label">⚾ Bowler:</span>
              <span className="name">{state.currentBowler?.name}</span>
            </div>
          </div>

          {/* This Over */}
          <div className="this-over">
            <span className="over-label">This Over:</span>
            <div className="balls">
              {state.currentOver.map((ball, idx) => (
                <span key={idx} className={`ball ${ball.isWicket ? 'wicket' : ''} ${ball.runs === 4 ? 'four' : ''} ${ball.runs === 6 ? 'six' : ''}`}>
                  {getBallDisplay(ball)}
                </span>
              ))}
            </div>
          </div>

          {!isInningsComplete ? (
            <>
              {/* Run Buttons */}
              <div className="run-buttons">
                {[0, 1, 2, 3, 4, 5, 6].map(runs => (
                  <button
                    key={runs}
                    className={`run-btn ${runs === 4 ? 'four' : ''} ${runs === 6 ? 'six' : ''}`}
                    onClick={() => recordBall(runs)}
                  >
                    {runs}
                  </button>
                ))}
              </div>

              {/* Extra Buttons */}
              <div className="extra-buttons">
                <button onClick={() => recordBall(1, { isWide: true })}>Wide</button>
                <button onClick={() => recordBall(0, { isNoBall: true })}>No Ball</button>
                <button className="wicket-btn" onClick={() => {
                  if (availableBatsmen.length > 0) {
                    setShowWicketModal(true);
                  } else {
                    dispatch({ type: 'RECORD_BALL', payload: { runs: 0, isWicket: true } });
                  }
                }}>
                  Wicket
                </button>
              </div>
            </>
          ) : (
            <div className="innings-complete">
              {state.innings === 1 ? (
                <>
                  <h2>🏏 First Innings Complete!</h2>
                  <p>{battingTeam.name}: {state.score}/{state.wickets}</p>
                  <p>Target for {bowlingTeam.name}: {state.score + 1} runs</p>
                  <button 
                    className="start-innings-btn"
                    onClick={() => dispatch({ type: 'START_SECOND_INNINGS' })}
                  >
                    Start Second Innings →
                  </button>
                </>
              ) : (
                <>
                  <h2>🏆 Match Complete!</h2>
                  {state.score > state.firstInningsScore ? (
                    <p className="winner">{battingTeam.name} wins by {state.battingPlayers.length - state.wickets} wicket(s)!</p>
                  ) : state.score < state.firstInningsScore ? (
                    <p className="winner">{bowlingTeam.name} wins by {state.firstInningsScore - state.score} run(s)!</p>
                  ) : (
                    <p className="winner">Match Tied!</p>
                  )}
                  
                  {/* Man of the Match */}
                  {getManOfTheMatch() && (
                    <div className="man-of-match">
                      <h3>🌟 Man of the Match</h3>
                      <p className="mom-name">{getManOfTheMatch().name}</p>
                      <p className="mom-stats">
                        {getManOfTheMatch().type === 'batsman' 
                          ? `${getManOfTheMatch().runs} runs` 
                          : `${getManOfTheMatch().wickets} wickets`}
                      </p>
                    </div>
                  )}
                  
                  <p className="view-stats-hint">View "Live Stats" tab for detailed scorecard</p>
                </>
              )}
            </div>
          )}

          {/* Undo Button - Always visible */}
          <button 
            className="undo-btn"
            onClick={() => dispatch({ type: 'UNDO_BALL' })}
            disabled={state.ballByBall.length === 0}
          >
            ↩ Undo Last Ball {state.ballByBall.length > 0 && state.ballByBall[state.ballByBall.length - 1]?.isWicket ? '(Wicket)' : ''}
          </button>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

function MainApp() {
  const { state, dispatch } = useApp();

  // Determine if match is actively in progress (not complete)
  const isMatchInProgress = state.step === 'scoring' && 
    !(state.innings === 2 && (
      state.balls >= state.overs * 6 || 
      state.wickets >= state.battingPlayers.length ||
      state.score > state.firstInningsScore
    ));

  const handleRefresh = () => {
    if (!isMatchInProgress) {
      if (window.confirm('Are you sure you want to start over?')) {
        dispatch({ type: 'RESET' });
      }
    }
  };

  return (
    <div className="app">
      {/* Global Refresh Button */}
      <div className="global-header">
        <button 
          className={`refresh-btn ${isMatchInProgress ? 'disabled' : ''}`}
          onClick={handleRefresh}
          disabled={isMatchInProgress}
          title={isMatchInProgress ? 'Cannot refresh during match' : 'Start over'}
        >
          🔄 Refresh
        </button>
      </div>

      {state.step === 'setup' && <TeamSetup />}
      {state.step === 'selectPlayers' && <SelectPlayers />}
      {state.step === 'scoring' && <LiveScoring />}
    </div>
  );
}

export default App;
