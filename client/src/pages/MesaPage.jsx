import { useState, useEffect } from 'react';
import socket from '../socket';

const PHASE_LABELS = {
  lobby:          { label: 'Lobby',           color: 'bg-party-border text-slate-400'   },
  'theme-input':  { label: 'Escolhendo Tema', color: 'bg-yellow-500/20 text-yellow-300' },
  'ranking-input':{ label: 'Montando Top 5',  color: 'bg-blue-500/20 text-blue-300'     },
  playing:        { label: 'Jogando',          color: 'bg-party-purple text-white'       },
};

// Gerado uma vez para evitar piscar ao re-render
const QR_SRC = `/qr?t=${Date.now()}`;

export default function MesaPage() {
  const [connected, setConnected]   = useState(false);
  const [lobbyState, setLobbyState] = useState({ players: [], status: 'lobby', hostPlayerId: null, theme: null });
  const [cards, setCards]           = useState([]);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('host:join');
    });

    // Se o socket já estava conectado (ex: StrictMode remonta o componente),
    // o evento 'connect' não dispara de novo — registra como host imediatamente.
    if (socket.connected) {
      setConnected(true);
      socket.emit('host:join');
    }

    socket.on('disconnect', () => setConnected(false));

    socket.on('lobby:state',  (state) => setLobbyState(state));
    socket.on('lobby:update', (state) => setLobbyState(state));
    socket.on('game:started', (state) => setLobbyState(state));
    socket.on('room:reset',   (state) => { setLobbyState(state ?? { players: [], status: 'lobby', hostPlayerId: null, theme: null }); setCards([]); });

    socket.on('card:played', ({ playerName, card }) => {
      setCards((prev) => [...prev, { playerName, card, id: card.id + Date.now() }]);
    });

    return () => {
      ['connect', 'disconnect', 'lobby:state', 'lobby:update',
       'game:started', 'room:reset', 'card:played'].forEach((ev) => socket.off(ev));
    };
  }, []);

  const onlinePlayers = lobbyState.players.filter((p) => p.connected);
  const isLobby = lobbyState.status === 'lobby';
  const phase   = PHASE_LABELS[lobbyState.status] ?? PHASE_LABELS.lobby;

  function handleReset() {
    if (!window.confirm('Resetar a sala? Todos os jogadores serão mandados para a tela inicial.')) return;
    socket.emit('room:reset');
    setCards([]);
  }

  function handleTransferHost(sessionId) {
    socket.emit('host:transfer', { sessionId });
  }

  return (
    <div className="min-h-svh bg-party-bg text-white flex flex-col">

      {/* ── Header ── */}
      <header className="bg-party-surface border-b border-party-border px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-lg md:text-xl font-bold text-party-violet">🎮 Top 5 Party</h1>

        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {connected ? '● Online' : '● Offline'}
        </span>

        <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${phase.color}`}>
          {phase.label}
        </span>

        <span className="text-xs text-slate-500 font-medium">
          {onlinePlayers.length} jogador{onlinePlayers.length !== 1 ? 'es' : ''}
        </span>

        <button
          onClick={handleReset}
          className="ml-auto text-xs text-slate-500 hover:text-red-400 border border-party-border hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          Resetar Sala
        </button>

        {/* QR compacto no header — só aparece quando o jogo já começou */}
        {!isLobby && (
          <div className="text-center flex-shrink-0">
            <img src={QR_SRC} alt="QR Code" className="w-16 h-16 rounded-xl border border-party-border" />
            <small className="block text-xs text-slate-500 mt-0.5">{window.location.host}</small>
          </div>
        )}
      </header>

      {/* ── Banner do tema ── */}
      {lobbyState.theme && (
        <div className="border-b border-party-border bg-party-purple/10 px-4 md:px-8 py-3 flex items-center gap-3">
          <span className="text-party-violet text-xs uppercase tracking-widest font-semibold flex-shrink-0">Tema:</span>
          <span className="text-white font-bold text-base truncate">{lobbyState.theme}</span>
          {lobbyState.status === 'ranking-input' && (
            <span className="ml-auto flex-shrink-0 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
              {lobbyState.rankingsSubmitted ?? 0}/{lobbyState.rankingsTotal ?? onlinePlayers.length} enviaram
            </span>
          )}
        </div>
      )}

      {/* ── Corpo ── */}
      <main className="flex flex-col md:flex-row flex-1 gap-4 md:gap-6 p-4 md:p-8">

        {/* Painel de jogadores */}
        <aside className="w-full md:w-60 flex-shrink-0 bg-party-surface border border-party-border rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-widest text-party-violet font-semibold">
            Jogadores ({onlinePlayers.length})
          </h2>

          {lobbyState.players.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">
              Aguardando jogadores...
              <br />
              <span className="text-xs text-slate-600 mt-1 block">Escaneie o QR code</span>
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {lobbyState.players.map((p) => (
                <li
                  key={p.sessionId}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-party-bg transition-opacity ${
                    p.connected ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm flex-1 truncate">{p.name}</span>
                  {p.submittedRanking && <span className="text-green-400 text-xs flex-shrink-0">✓</span>}

                  {p.isHost ? (
                    <span className="text-base flex-shrink-0" title="Host atual">👑</span>
                  ) : (
                    /* Botão de transferir host — só no lobby, só aparece no hover */
                    isLobby && p.connected && (
                      <button
                        onClick={() => handleTransferHost(p.sessionId)}
                        title={`Tornar ${p.name} o host`}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs text-slate-400 hover:text-party-violet border border-party-border hover:border-party-violet px-1.5 py-0.5 rounded transition-all"
                      >
                        👑 dar
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Área central — QR grande no lobby, cartas durante o jogo */}
        <section className="flex-1 bg-party-surface border border-party-border rounded-2xl p-4 md:p-5 flex flex-col min-h-48">

          {isLobby ? (
            /* ── Tela de espera com QR grande ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Escaneie para entrar</h2>
                <p className="text-slate-500 text-sm">{window.location.host}</p>
              </div>

              <img
                src={QR_SRC}
                alt="QR Code para entrar na partida"
                className="w-56 h-56 md:w-72 md:h-72 rounded-2xl border-2 border-party-border shadow-2xl"
              />

              {onlinePlayers.length === 0 ? (
                <p className="text-slate-600 text-sm">Nenhum jogador ainda...</p>
              ) : (
                <p className="text-slate-400 text-sm">
                  <span className="text-party-violet font-bold">{onlinePlayers.length}</span>{' '}
                  jogador{onlinePlayers.length !== 1 ? 'es' : ''} na sala
                </p>
              )}
            </div>
          ) : (
            /* ── Mesa de cartas ── */
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs uppercase tracking-widest text-party-violet font-semibold">Mesa</h2>
                {cards.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {cards.length} carta{cards.length !== 1 ? 's' : ''} jogada{cards.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                  <div className="text-4xl opacity-20">🃏</div>
                  <p className="text-slate-500 text-sm">Aguardando jogadores jogarem cartas...</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 content-start overflow-y-auto">
                  {cards.map(({ id, playerName, card }) => (
                    <div
                      key={id}
                      className="w-32 md:w-40 bg-gradient-to-br from-party-surface to-party-bg border border-party-purple/50 rounded-xl p-4 flex flex-col gap-2 flex-shrink-0"
                      style={{ animation: 'cardDrop 0.35s ease' }}
                    >
                      <span className="text-sm font-semibold text-white leading-snug">{card.text}</span>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-party-border">
                        <span className="text-xs text-party-violet truncate">{playerName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <style>{`
        @keyframes cardDrop {
          from { transform: translateY(-20px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0) scale(1);        opacity: 1; }
        }
      `}</style>
    </div>
  );
}
