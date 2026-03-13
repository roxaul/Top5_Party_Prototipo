import { useState, useEffect } from 'react';
import socket from './socket';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import HandPage from './pages/HandPage';

const SESSION_KEY = 'top5party_session';

export default function App() {
  const [screen, setScreen] = useState('join');   // 'join' | 'lobby' | 'hand'
  const [player, setPlayer] = useState(null);      // { sessionId, name }
  const [lobbyState, setLobbyState] = useState({ players: [], status: 'lobby' });
  const [hand, setHand] = useState([]);
  const [connected, setConnected] = useState(false);

  // ── Conexão socket ────────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Novo jogador confirmado
    socket.on('player:joined', ({ sessionId, name }) => {
      const data = { sessionId, name };
      setPlayer(data);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      setScreen('lobby');
    });

    // Reconexão confirmada (sessão restaurada)
    socket.on('player:rejoined', ({ sessionId, name, hand: savedHand }) => {
      const data = { sessionId, name };
      setPlayer(data);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      setHand(savedHand || []);
      setScreen(savedHand?.length > 0 ? 'hand' : 'lobby');
    });

    // Atualização do lobby
    socket.on('lobby:update', (state) => setLobbyState(state));

    // Cartas recebidas
    socket.on('hand:update', ({ hand: newHand }) => {
      setHand(newHand);
      if (newHand.length > 0) setScreen('hand');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('player:joined');
      socket.off('player:rejoined');
      socket.off('lobby:update');
      socket.off('hand:update');
    };
  }, []);

  // ── Tentativa de reconexão com sessão salva ───────────────────────────────
  useEffect(() => {
    if (!connected) return;

    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { sessionId, name } = JSON.parse(saved);
        socket.emit('player:join', { name, sessionId });
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, [connected]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleJoin(name) {
    localStorage.removeItem(SESSION_KEY); // garante sessão nova
    socket.emit('player:join', { name, sessionId: null });
  }

  function handlePlayCard(cardId) {
    socket.emit('card:play', { cardId });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full flex flex-col">
      {/* Barra de status de conexão */}
      {!connected && (
        <div className="bg-red-600 text-white text-center text-xs py-1 font-semibold tracking-wide">
          Reconectando...
        </div>
      )}

      {screen === 'join'  && <JoinPage onJoin={handleJoin} connected={connected} />}
      {screen === 'lobby' && <LobbyPage player={player} lobbyState={lobbyState} />}
      {screen === 'hand'  && <HandPage hand={hand} player={player} onPlayCard={handlePlayCard} />}
    </div>
  );
}
