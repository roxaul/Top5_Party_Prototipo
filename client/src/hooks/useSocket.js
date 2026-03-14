import { useState, useEffect } from 'react';
import socket from '../socket';
import {
  GAME_STATUS, SCREEN, SOCKET_EVENTS, SESSION_KEY, INITIAL_LOBBY_STATE,
} from '../constants/game';

// sessionStorage (não localStorage): limpa ao fechar o browser/aba,
// garantindo que o jogador sempre veja a tela de nome ao abrir o app.
// Dentro da mesma sessão de aba, quedas de rede ainda reconectam automaticamente.
const storage = sessionStorage;

export function useGameSocket() {
  const [screen, setScreen]         = useState(SCREEN.JOIN);
  const [player, setPlayer]         = useState(null);
  const [lobbyState, setLobbyState] = useState(INITIAL_LOBBY_STATE);
  const [hand, setHand]             = useState([]);
  const [connected, setConnected]   = useState(false);

  // ── Listeners de socket ────────────────────────────────────────────────────
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

    socket.on(SOCKET_EVENTS.PLAYER_REJOINED, ({ sessionId, name, hand: savedHand, lobbyState: ls }) => {
      const data = { sessionId, name };
      setPlayer(data);
      storage.setItem(SESSION_KEY, JSON.stringify(data));
      setHand(savedHand || []);
      if (ls) setLobbyState(ls);

      // Redireciona para a tela correta conforme a fase salva
      const status = ls?.status ?? GAME_STATUS.LOBBY;
      if (savedHand?.length > 0 || status === GAME_STATUS.PLAYING)  setScreen(SCREEN.HAND);
      else if (status === GAME_STATUS.RANKING_INPUT)                 setScreen(SCREEN.RANKING);
      else if (status === GAME_STATUS.THEME_INPUT)                   setScreen(SCREEN.THEME);
      else                                                            setScreen(SCREEN.LOBBY);
    });

    socket.on(SOCKET_EVENTS.LOBBY_UPDATE, (state) => setLobbyState(state));

    socket.on(SOCKET_EVENTS.PHASE_THEME_INPUT, (state) => {
      setLobbyState(state);
      setScreen(SCREEN.THEME);
    });

    socket.on(SOCKET_EVENTS.PHASE_RANKING_INPUT, (state) => {
      setLobbyState(state);
      setScreen(SCREEN.RANKING);
    });

    socket.on(SOCKET_EVENTS.GAME_STARTED, (state) => setLobbyState(state));

    socket.on(SOCKET_EVENTS.HAND_UPDATE, ({ hand: newHand }) => {
      setHand(newHand);
      if (newHand.length > 0) setScreen(SCREEN.HAND);
    });

    socket.on(SOCKET_EVENTS.ROOM_RESET, () => {
      storage.removeItem(SESSION_KEY);
      setPlayer(null);
      setLobbyState(INITIAL_LOBBY_STATE);
      setHand([]);
      setScreen(SCREEN.JOIN);
    });

    return () => {
      ['connect', 'disconnect',
        SOCKET_EVENTS.PLAYER_JOINED, SOCKET_EVENTS.PLAYER_REJOINED,
        SOCKET_EVENTS.LOBBY_UPDATE,  SOCKET_EVENTS.PHASE_THEME_INPUT,
        SOCKET_EVENTS.PHASE_RANKING_INPUT, SOCKET_EVENTS.GAME_STARTED,
        SOCKET_EVENTS.HAND_UPDATE,   SOCKET_EVENTS.ROOM_RESET,
      ].forEach((ev) => socket.off(ev));
    };
  }, []);

  // ── Reconexão automática com sessão da aba atual (queda de rede) ───────────
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

  // ── Ações ─────────────────────────────────────────────────────────────────
  function joinGame(name) {
    storage.removeItem(SESSION_KEY);
    socket.emit(SOCKET_EVENTS.PLAYER_JOIN, { name, sessionId: null });
  }

  function startGame()          { socket.emit(SOCKET_EVENTS.GAME_START); }
  function submitTheme(theme)   { socket.emit(SOCKET_EVENTS.THEME_SUBMIT,   { theme }); }
  function submitRanking(items) { socket.emit(SOCKET_EVENTS.RANKING_SUBMIT, { items }); }
  function playCard(cardId)     { socket.emit(SOCKET_EVENTS.CARD_PLAY,      { cardId }); }

  const isHost = player?.sessionId === lobbyState.hostPlayerId;

  return {
    screen, player, lobbyState, hand, connected, isHost,
    joinGame, startGame, submitTheme, submitRanking, playCard,
  };
}
