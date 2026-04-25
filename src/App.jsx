import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './App.css';

// Team Setup Component
function TeamSetup() {
  const { state, dispatch } = useApp();

  const handleAddPlayer = (team, name) => {
    if (name.trim()) {
      dispatch({ type: team === 1 ? 'ADD_PLAYER_TEAM1' : 'ADD_PLAYER_TEAM2', payload: name.trim() });
    }
  };

  const handleStartMatch = (battingTeam) => {
    if (state.team1.name && state.team2.name && 
        state.team1.players.length >= 2 && state.team2.players.length >= 1) {
      dispatch({ type: 'START_MATCH', payload: { battingTeam } });
    }
  };

  const canStart = state.team1.name && state.team2.name && 
                   state.team1.players.length >= 1 && state.team2.players.length >= 1;

  return (
    <div className="setup-container">
      <h1>🏏 Cricket Scorer</h1>
      
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
        <select value={state.overs} onChange={(e) => dispatch({ type: 'SET_OVERS', payload: parseInt(e.target.value) })}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
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
        <p className="hint">Add team names + at least 1 player in each team</p>
      )}
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
  const [activeTab, setActiveTab] = useState('scoring'); // 'scoring' | 'stats'

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

  const recordBall = (runs, extras = {}) => {
    dispatch({
      type: 'RECORD_BALL',
      payload: { runs, ...extras }
    });
  };

  const handleWicket = (newBatsman) => {
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

  const getBallDisplay = (ball) => {
    if (ball.isWicket) return 'W';
    if (ball.isWide) return `${ball.runs}wd`;
    if (ball.isNoBall) return `${ball.runs}nb`;
    return ball.runs;
  };

  return (
    <div className="scoring-container">
      {/* Over Complete Popup */}
      {state.showOverComplete && (
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

      {/* Top Bar with Reset */}
      <div className="top-bar">
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
                  <p>{bowlingTeam.name}: {state.firstInningsScore}/{state.firstInningsWickets}</p>
                  <p>{battingTeam.name}: {state.score}/{state.wickets}</p>
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
  const { state } = useApp();

  return (
    <div className="app">
      {state.step === 'setup' && <TeamSetup />}
      {state.step === 'selectPlayers' && <SelectPlayers />}
      {state.step === 'scoring' && <LiveScoring />}
    </div>
  );
}

export default App;
