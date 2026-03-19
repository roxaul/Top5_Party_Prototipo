import { useState, useEffect } from 'react';
import socket from '../socket';
import {
  GAME_STATUS, SCREEN, SOCKET_EVENTS, SESSION_KEY, INITIAL_LOBBY_STATE,
} from '../constants/game';

const storage = sessionStorage;

export function useGameSocket() {
  const [screen, setScreen]             = useState(SCREEN.JOIN);
  const [player, setPlayer]             = useState(null);
  const [lobbyState, setLobbyState]     = useState(INITIAL_LOBBY_STATE);
  const [hand, setHand]                 = useState([]);
  const [connected, setConnected]       = useState(false);
  const [roundResult, setRoundResult]   = useState(null);
  const [gameOver, setGameOver]         = useState(null);
  const [turnInfo, setTurnInfo]         = useState(null);
  // Opções de tema personalizadas (3 únicas por jogador)
  const [myThemeOptions, setMyThemeOptions] = useState([]);
  const [mySelectedTheme, setMySelectedTheme] = useState(null);
  // { callerId, callerName, currentMultiplier, newMultiplier } | null
  const [trucoState, setTrucoState] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, ({ sessionId, name }) => {
      const data = { sessionId, name };
      setPlayer(data);
      storage.setItem(SESSION_KEY, JSON.stringify(data));
      setScreen(SCREEN.LOBBY);
    });

    socket.on(SOCKET_EVENTS.PLAYER_REJOINED, ({
      sessionId, name, hand: savedHand, lobbyState: ls,
      themeOptions, selectedTheme,
    }) => {
      const data = { sessionId, name };
      setPlayer(data);
      storage.setItem(SESSION_KEY, JSON.stringify(data));
      setHand(savedHand || []);
      if (ls) setLobbyState(ls);
      if (themeOptions?.length)  setMyThemeOptions(themeOptions);
      if (selectedTheme)         setMySelectedTheme(selectedTheme);

      const status = ls?.status ?? GAME_STATUS.LOBBY;
      if      (status === GAME_STATUS.GAME_OVER)    setScreen(SCREEN.GAME_OVER);
      else if (status === GAME_STATUS.ROUND_RESULT) setScreen(SCREEN.ROUND_RESULT);
      else if (savedHand?.length > 0 || status === GAME_STATUS.PLAYING) setScreen(SCREEN.HAND);
      else if (status === GAME_STATUS.RANKING_INPUT) setScreen(SCREEN.RANKING);
      else if (status === GAME_STATUS.THEME_SELECT)  setScreen(SCREEN.THEME_SELECT);
      else                                           setScreen(SCREEN.LOBBY);
    });

    socket.on(SOCKET_EVENTS.LOBBY_UPDATE, (state) => setLobbyState(state));

    // phase:theme-select chega com opções personalizadas
    socket.on(SOCKET_EVENTS.PHASE_THEME_SELECT, ({ options, lobbyState: ls }) => {
      setMyThemeOptions(options ?? []);
      setMySelectedTheme(null);
      if (ls) setLobbyState(ls);
      setScreen(SCREEN.THEME_SELECT);
    });

    socket.on(SOCKET_EVENTS.PHASE_RANKING_INPUT, (state) => {
      setLobbyState(state);
      setScreen(SCREEN.RANKING);
    });

    socket.on(SOCKET_EVENTS.GAME_STARTED, (state) => {
      setLobbyState(state);
      setRoundResult(null);
      setScreen(SCREEN.HAND);
    });

    socket.on(SOCKET_EVENTS.PHASE_PLAYING, (state) => {
      setLobbyState(state);
      setRoundResult(null);
      setScreen(SCREEN.HAND);
    });

    socket.on(SOCKET_EVENTS.TURN_UPDATE, (info) => setTurnInfo(info));

    socket.on(SOCKET_EVENTS.HAND_UPDATE, ({ hand: newHand }) => {
      setHand(newHand);
    });

    socket.on(SOCKET_EVENTS.PHASE_ROUND_RESULT, (result) => {
      setRoundResult(result);
      setScreen(SCREEN.ROUND_RESULT);
    });

    socket.on(SOCKET_EVENTS.PHASE_GAME_OVER, (result) => {
      setGameOver(result);
      setScreen(SCREEN.GAME_OVER);
    });

    socket.on(SOCKET_EVENTS.TRUCO_CALLED, (data) => setTrucoState(data));
    socket.on(SOCKET_EVENTS.TRUCO_RESOLVED, () => setTrucoState(null));

    socket.on(SOCKET_EVENTS.ROOM_RESET, () => {
      storage.removeItem(SESSION_KEY);
      setPlayer(null);
      setLobbyState(INITIAL_LOBBY_STATE);
      setHand([]);
      setRoundResult(null);
      setGameOver(null);
      setTurnInfo(null);
      setMyThemeOptions([]);
      setMySelectedTheme(null);
      setTrucoState(null);
      setScreen(SCREEN.JOIN);
    });

    return () => {
      [
        'connect', 'disconnect',
        SOCKET_EVENTS.PLAYER_JOINED,      SOCKET_EVENTS.PLAYER_REJOINED,
        SOCKET_EVENTS.LOBBY_UPDATE,       SOCKET_EVENTS.PHASE_THEME_SELECT,
        SOCKET_EVENTS.PHASE_RANKING_INPUT, SOCKET_EVENTS.GAME_STARTED,
        SOCKET_EVENTS.PHASE_PLAYING,      SOCKET_EVENTS.TURN_UPDATE,
        SOCKET_EVENTS.HAND_UPDATE,        SOCKET_EVENTS.PHASE_ROUND_RESULT,
        SOCKET_EVENTS.PHASE_GAME_OVER,    SOCKET_EVENTS.ROOM_RESET,
        SOCKET_EVENTS.TRUCO_CALLED,       SOCKET_EVENTS.TRUCO_RESOLVED,
      ].forEach((ev) => socket.off(ev));
    };
  }, []);

  // Reconexão automática (queda de rede)
  useEffect(() => {
    if (!connected) return;
    const saved = storage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const { sessionId, name } = JSON.parse(saved);
      socket.emit(SOCKET_EVENTS.PLAYER_JOIN, { name, sessionId });
    } catch {
      storage.removeItem(SESSION_KEY);
    }
  }, [connected]);

  // Ações
  function joinGame(name) {
    storage.removeItem(SESSION_KEY);
    socket.emit(SOCKET_EVENTS.PLAYER_JOIN, { name, sessionId: null });
  }

  function startGame()          { socket.emit(SOCKET_EVENTS.GAME_START); }

  function selectTheme(theme) {
    setMySelectedTheme(theme);
    socket.emit(SOCKET_EVENTS.THEME_SELECT, { theme });
  }

  function submitRanking(items)  { socket.emit(SOCKET_EVENTS.RANKING_SUBMIT, { items }); }
  function playCard(cardId)      { socket.emit(SOCKET_EVENTS.CARD_PLAY,      { cardId }); }
  function callTruco()           { socket.emit(SOCKET_EVENTS.TRUCO_CALL); }
  function respondTruco(accept)  { socket.emit(SOCKET_EVENTS.TRUCO_RESPOND,  { accept }); }

  const isHost   = player?.sessionId === lobbyState.hostPlayerId;
  const isMyTurn = turnInfo?.currentTurn === player?.sessionId;

  return {
    screen, player, lobbyState, hand, connected, isHost,
    roundResult, gameOver, turnInfo, isMyTurn,
    myThemeOptions, mySelectedTheme,
    trucoState,
    joinGame, startGame, selectTheme, submitRanking, playCard,
    callTruco, respondTruco,
  };
}
