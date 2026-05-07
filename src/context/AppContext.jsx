import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

const initialState = {
  step: 'setup', // 'setup' | 'selectPlayers' | 'scoring'
  team1: { name: '', players: [] },
  team2: { name: '', players: [] },
  overs: 0,
  battingTeam: null, // 'team1' | 'team2'
  // Innings tracking
  innings: 1,
  firstInningsScore: null,
  firstInningsWickets: null,
  firstInningsBallByBall: [],
  firstInningsBattingTeam: null,
  matchComplete: false,
  // Scoring state
  score: 0,
  wickets: 0,
  balls: 0,
  striker: null,
  nonStriker: null,
  currentBowler: null,
  ballByBall: [],
  showOverComplete: false,
  battingPlayers: [], // players who can bat
  bowlingPlayers: [], // players who can bowl
  outBatsmen: [], // batsmen who are out
  currentOver: [], // balls in current over for display
  pavilionBatsman: null, // batsman sent to pavilion via Play Single (can be brought back)
  pavilionBatsmanWasStriker: null, // track if pavilion batsman was striker before
  retiredBatsmen: [], // batsmen who retired/were swapped out (not out, just left)
};

const loadState = () => {
  try {
    const saved = localStorage.getItem('cricketScoringState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with initialState to ensure new fields have defaults
      return { ...initialState, ...parsed };
    }
    return initialState;
  } catch {
    return initialState;
  }
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TEAM1_NAME':
      return { ...state, team1: { ...state.team1, name: action.payload } };
    
    case 'SET_TEAM2_NAME':
      return { ...state, team2: { ...state.team2, name: action.payload } };
    
    case 'SET_OVERS':
      return { ...state, overs: action.payload };
    
    case 'ADD_PLAYER_TEAM1':
      return { 
        ...state, 
        team1: { 
          ...state.team1, 
          players: [...state.team1.players, { id: uuidv4(), name: action.payload }] 
        } 
      };
    
    case 'ADD_PLAYER_TEAM2':
      return { 
        ...state, 
        team2: { 
          ...state.team2, 
          players: [...state.team2.players, { id: uuidv4(), name: action.payload }] 
        } 
      };
    
    case 'REMOVE_PLAYER_TEAM1':
      return {
        ...state,
        team1: {
          ...state.team1,
          players: state.team1.players.filter(p => p.id !== action.payload)
        }
      };
    
    case 'REMOVE_PLAYER_TEAM2':
      return {
        ...state,
        team2: {
          ...state.team2,
          players: state.team2.players.filter(p => p.id !== action.payload)
        }
      };
    
    case 'START_MATCH':
      const battingTeamData = action.payload.battingTeam === 'team1' ? state.team1 : state.team2;
      const bowlingTeamData = action.payload.battingTeam === 'team1' ? state.team2 : state.team1;
      return {
        ...state,
        step: 'selectPlayers',
        battingTeam: action.payload.battingTeam,
        battingPlayers: battingTeamData.players,
        bowlingPlayers: bowlingTeamData.players,
      };
    
    case 'SELECT_OPENING_PLAYERS':
      return {
        ...state,
        step: 'scoring',
        striker: action.payload.striker,
        nonStriker: action.payload.nonStriker,
        currentBowler: action.payload.bowler,
      };
    
    case 'RECORD_BALL': {
      const { runs, isWicket, isWide, isNoBall, newBatsman } = action.payload;
      const isLegal = !isWide && !isNoBall;
      const newBalls = isLegal ? state.balls + 1 : state.balls;
      const totalRuns = runs;
      
      // Check if over is complete (6 legal balls)
      const overComplete = isLegal && (state.balls % 6 === 5);
      
      // Rotate strike on odd runs (1, 3, 5) - but NOT on wide balls
      const shouldRotate = !isWide && (runs % 2 === 1);
      
      let newStriker = state.striker;
      let newNonStriker = state.nonStriker;
      let newOutBatsmen = [...state.outBatsmen];
      let playingSingle = state.nonStriker === null;
      
      if (isWicket) {
        newOutBatsmen.push(state.striker.id);
        if (newBatsman) {
          // New batsman comes in
          newStriker = newBatsman;
        } else {
          // Street cricket: last batsman plays single (non-striker comes to strike)
          newStriker = state.nonStriker;
          newNonStriker = null;
          playingSingle = true;
        }
      } else if (shouldRotate && !playingSingle) {
        // Only rotate if not playing single
        newStriker = state.nonStriker;
        newNonStriker = state.striker;
      }
      
      // Build ball record
      const ballRecord = {
        id: uuidv4(),
        runs,
        isWicket,
        isWide,
        isNoBall,
        striker: state.striker,
        nonStriker: state.nonStriker,
        bowler: state.currentBowler,
        totalRuns,
        ballNumber: state.balls + 1,
      };
      
      // Current over display
      let newCurrentOver = [...state.currentOver, ballRecord];
      if (overComplete) {
        newCurrentOver = [];
      }
      
      // Handle end of over - no strike change if playing single
      let finalStriker = newStriker;
      let finalNonStriker = newNonStriker;
      if (overComplete && !playingSingle) {
        finalStriker = newNonStriker;
        finalNonStriker = newStriker;
      }
      
      // Only show over complete popup if there are more overs to bowl
      const totalBallsInMatch = state.overs * 6;
      const allWicketsDown = (isWicket ? state.wickets + 1 : state.wickets) >= state.battingPlayers.length;
      const inningsComplete = newBalls >= totalBallsInMatch || allWicketsDown;
      const shouldShowOverComplete = overComplete && !inningsComplete;
      
      return {
        ...state,
        score: state.score + totalRuns,
        wickets: isWicket ? state.wickets + 1 : state.wickets,
        balls: newBalls,
        striker: finalStriker,
        nonStriker: finalNonStriker,
        ballByBall: [...state.ballByBall, ballRecord],
        currentOver: newCurrentOver,
        showOverComplete: shouldShowOverComplete,
        outBatsmen: newOutBatsmen,
      };
    }
    
    case 'UNDO_BALL': {
      if (state.ballByBall.length === 0) return state;
      
      const lastBall = state.ballByBall[state.ballByBall.length - 1];
      const newBallByBall = state.ballByBall.slice(0, -1);
      const isLegal = !lastBall.isWide && !lastBall.isNoBall;
      
      // Restore out batsmen if wicket was undone
      let newOutBatsmen = [...state.outBatsmen];
      if (lastBall.isWicket) {
        newOutBatsmen = newOutBatsmen.filter(id => id !== lastBall.striker.id);
      }
      
      // Restore current over - if currentOver is empty (over just finished), 
      // we need to reconstruct from ballByBall
      let newCurrentOver;
      if (state.currentOver.length === 0) {
        // Over just finished, reconstruct the previous over's balls (excluding the one we're undoing)
        // Find all balls from the current over in ballByBall
        const newBalls = isLegal ? state.balls - 1 : state.balls;
        const currentOverNumber = Math.floor((newBalls - 1) / 6);
        // Get balls that belong to this over (based on their legal ball count)
        let legalBallCount = 0;
        newCurrentOver = [];
        for (const ball of newBallByBall) {
          const ballIsLegal = !ball.isWide && !ball.isNoBall;
          if (ballIsLegal) legalBallCount++;
          const ballOverNumber = Math.floor((legalBallCount - 1) / 6);
          if (ballOverNumber === currentOverNumber) {
            newCurrentOver.push(ball);
          }
        }
      } else {
        newCurrentOver = state.currentOver.slice(0, -1);
      }
      
      return {
        ...state,
        score: state.score - lastBall.totalRuns,
        wickets: lastBall.isWicket ? state.wickets - 1 : state.wickets,
        balls: isLegal ? state.balls - 1 : state.balls,
        striker: lastBall.striker,
        nonStriker: lastBall.nonStriker,
        ballByBall: newBallByBall,
        currentOver: newCurrentOver,
        showOverComplete: false,
        outBatsmen: newOutBatsmen,
      };
    }
    
    case 'CHANGE_BOWLER':
      return {
        ...state,
        currentBowler: action.payload,
        showOverComplete: false,
      };
    
    case 'DISMISS_OVER_POPUP':
      return { ...state, showOverComplete: false };
    
    case 'START_SECOND_INNINGS': {
      const newBattingTeam = state.battingTeam === 'team1' ? 'team2' : 'team1';
      const newBattingTeamData = newBattingTeam === 'team1' ? state.team1 : state.team2;
      const newBowlingTeamData = newBattingTeam === 'team1' ? state.team2 : state.team1;
      return {
        ...state,
        innings: 2,
        firstInningsScore: state.score,
        firstInningsWickets: state.wickets,
        firstInningsBallByBall: state.ballByBall,
        firstInningsBattingTeam: state.battingTeam,
        battingTeam: newBattingTeam,
        battingPlayers: newBattingTeamData.players,
        bowlingPlayers: newBowlingTeamData.players,
        score: 0,
        wickets: 0,
        balls: 0,
        striker: null,
        nonStriker: null,
        currentBowler: null,
        ballByBall: [],
        currentOver: [],
        outBatsmen: [],
        showOverComplete: false,
        step: 'selectPlayers',
        pavilionBatsman: null,
        pavilionBatsmanWasStriker: null,
        retiredBatsmen: [],
      };
    }
    
    case 'SET_PLAY_SINGLE': {
      // Voluntary single batsman mode - chosen batsman continues as striker
      // The other batsman goes to pavilion (NOT out, can be brought back)
      const stayingBatsman = action.payload;
      const leavingBatsman = stayingBatsman.id === state.striker?.id 
        ? state.nonStriker 
        : state.striker;
      // Remember if the leaving batsman was the striker
      const wasStriker = state.striker?.id === leavingBatsman?.id;
      return {
        ...state,
        striker: stayingBatsman,
        nonStriker: null,
        pavilionBatsman: leavingBatsman,
        pavilionBatsmanWasStriker: wasStriker,
      };
    }
    
    case 'UNDO_PLAY_SINGLE': {
      // Bring back the batsman who was sent to pavilion to their ORIGINAL position
      if (!state.pavilionBatsman) return state;
      
      // Restore to original positions
      if (state.pavilionBatsmanWasStriker) {
        // Pavilion batsman was striker before, restore them to striker
        return {
          ...state,
          striker: state.pavilionBatsman,
          nonStriker: state.striker,
          pavilionBatsman: null,
          pavilionBatsmanWasStriker: null,
        };
      } else {
        // Pavilion batsman was non-striker before, restore them to non-striker
        return {
          ...state,
          nonStriker: state.pavilionBatsman,
          pavilionBatsman: null,
          pavilionBatsmanWasStriker: null,
        };
      }
    }
    
    case 'SWAP_BATSMAN': {
      // Replace a batsman with another player (retire hurt / substitute)
      const { leavingBatsman, newBatsman } = action.payload;
      const isStriker = state.striker?.id === leavingBatsman.id;
      return {
        ...state,
        striker: isStriker ? newBatsman : state.striker,
        nonStriker: !isStriker ? newBatsman : state.nonStriker,
        // Store leaving batsman so they can potentially come back
        retiredBatsmen: [...(state.retiredBatsmen || []), leavingBatsman],
      };
    }
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, null, loadState);

  useEffect(() => {
    localStorage.setItem('cricketScoringState', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
