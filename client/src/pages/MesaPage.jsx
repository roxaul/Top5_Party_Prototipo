import { useState, useEffect } from 'react';
import socket from '../socket';

const PHASE_LABELS = {
  lobby:           { label: 'Lobby',              color: 'bg-party-border text-slate-400'   },
  'theme-select':  { label: 'Escolhendo Pergunta', color: 'bg-yellow-500/20 text-yellow-300' },
  'ranking-input': { label: 'Montando Top 5',      color: 'bg-blue-500/20 text-blue-300'     },
  playing:         { label: 'Jogando',             color: 'bg-party-purple text-white'       },
  'round-result':  { label: 'Resultado',           color: 'bg-amber-500/20 text-amber-300'   },
  'game-over':     { label: 'Fim de Jogo',         color: 'bg-green-500/20 text-green-300'   },
};

const RANK_STAR = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];
const RANK_COLOR = ['', 'text-slate-400', 'text-slate-300', 'text-amber-400', 'text-violet-300', 'text-yellow-300'];

const QR_SRC = `/qr?t=${Date.now()}`;

export default function MesaPage() {
  const [connected, setConnected]       = useState(false);
  const [lobbyState, setLobbyState]     = useState({ players: [], status: 'lobby', hostPlayerId: null, theme: null });
  const [cards, setCards]               = useState([]);       // cartas jogadas na rodada atual
  const [turnInfo, setTurnInfo]         = useState(null);
  const [roundResult, setRoundResult]   = useState(null);
  const [gameOver, setGameOver]         = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('host:join');
    });

    if (socket.connected) {
      setConnected(true);
      socket.emit('host:join');
    }

    socket.on('disconnect', () => setConnected(false));

    socket.on('lobby:state',  (state) => setLobbyState(state));
    socket.on('lobby:update', (state) => setLobbyState(state));
    socket.on('game:started',      (state) => { setLobbyState(state); setCards([]); setRoundResult(null); });
    socket.on('phase:playing',     (state) => { setLobbyState(state); setCards([]); setRoundResult(null); });
    socket.on('phase:theme-select',(state) => { setLobbyState(state?.lobbyState ?? state); });

    socket.on('turn:update', (info) => setTurnInfo(info));

    socket.on('card:played', ({ playerName, card, _meta }) => {
      setCards((prev) => [...prev, { playerName, card, rank: _meta?.rank ?? 0, id: card.id + Date.now() }]);
    });

    socket.on('phase:round-result', (result) => {
      setRoundResult(result);
    });

    socket.on('phase:game-over', (result) => {
      setGameOver(result);
    });

    socket.on('room:reset', (state) => {
      setLobbyState(state ?? { players: [], status: 'lobby', hostPlayerId: null, theme: null });
      setCards([]);
      setTurnInfo(null);
      setRoundResult(null);
      setGameOver(null);
    });

    return () => {
      ['connect', 'disconnect', 'lobby:state', 'lobby:update',
       'game:started', 'phase:playing', 'phase:theme-select', 'turn:update',
       'card:played', 'phase:round-result', 'phase:game-over', 'room:reset',
      ].forEach((ev) => socket.off(ev));
    };
  }, []);

  const onlinePlayers = lobbyState.players.filter((p) => p.connected);
  const isLobby  = lobbyState.status === 'lobby';
  const isPlaying = lobbyState.status === 'playing';
  const isResult  = lobbyState.status === 'round-result';
  const isGameOver = lobbyState.status === 'game-over';
  const phase = PHASE_LABELS[lobbyState.status] ?? PHASE_LABELS.lobby;

  const currentTurnPlayer = onlinePlayers.find(
    (p) => p.sessionId === turnInfo?.currentTurn
  );

  function handleReset() {
    if (!window.confirm('Resetar a sala? Todos os jogadores serão mandados para a tela inicial.')) return;
    socket.emit('room:reset');
    setCards([]);
    setRoundResult(null);
    setGameOver(null);
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

        {(isPlaying || isResult) && turnInfo && (
          <span className="text-xs text-slate-400 font-medium">
            Rodada {turnInfo.roundNumber}/{turnInfo.totalRounds}
          </span>
        )}

        <span className="text-xs text-slate-500 font-medium">
          {onlinePlayers.length} jogador{onlinePlayers.length !== 1 ? 'es' : ''}
        </span>

        <button
          onClick={handleReset}
          className="ml-auto text-xs text-slate-500 hover:text-red-400 border border-party-border hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          Resetar Sala
        </button>

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

      {/* ── Banner de turno ── */}
      {isPlaying && currentTurnPlayer && (
        <div className="border-b border-party-border bg-party-purple/5 px-4 md:px-8 py-2 flex items-center gap-3">
          <span className="text-2xl animate-pulse">🃏</span>
          <span className="text-sm text-slate-400">Vez de</span>
          <span className="text-white font-bold text-base">{currentTurnPlayer.name}</span>
          <span className="ml-auto text-xs text-slate-500">
            {cards.length} de {onlinePlayers.length} jogaram esta rodada
          </span>
        </div>
      )}

      {/* ── Corpo ── */}
      <main className="flex flex-col md:flex-row flex-1 gap-4 md:gap-6 p-4 md:p-8">

        {/* ── Painel lateral: jogadores + placar ── */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-3">
          {/* Jogadores */}
          <div className="bg-party-surface border border-party-border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-widest text-party-violet font-semibold">
              Jogadores ({onlinePlayers.length})
            </h2>

            {lobbyState.players.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Escaneie o QR code</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {lobbyState.players.map((p) => (
                  <li
                    key={p.sessionId}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl bg-party-bg transition-opacity ${
                      p.connected ? 'opacity-100' : 'opacity-40'
                    } ${turnInfo?.currentTurn === p.sessionId && isPlaying ? 'ring-1 ring-party-purple' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                    {turnInfo?.currentTurn === p.sessionId && isPlaying && (
                      <span className="text-sm">🃏</span>
                    )}
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    {p.isHost && <span className="text-base flex-shrink-0" title="Host atual">👑</span>}
                    {isLobby && p.connected && !p.isHost && (
                      <button
                        onClick={() => handleTransferHost(p.sessionId)}
                        title={`Tornar ${p.name} o host`}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs text-slate-400 hover:text-party-violet border border-party-border hover:border-party-violet px-1.5 py-0.5 rounded transition-all"
                      >
                        👑
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Placar — visível quando o jogo estiver rolando */}
          {(isPlaying || isResult || isGameOver) && lobbyState.scores && (
            <div className="bg-party-surface border border-party-border rounded-2xl p-4">
              <h2 className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-3">
                Placar
              </h2>
              <ul className="flex flex-col gap-1.5">
                {onlinePlayers
                  .sort((a, b) => (lobbyState.scores[b.sessionId] ?? 0) - (lobbyState.scores[a.sessionId] ?? 0))
                  .map((p, i) => (
                    <li key={p.sessionId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-party-bg">
                      <span className={`text-sm font-bold flex-shrink-0 w-5 text-center ${i === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {i === 0 ? '🥇' : i + 1}
                      </span>
                      <span className="text-sm flex-1 truncate">{p.name}</span>
                      <span className={`font-bold text-base tabular-nums ${i === 0 ? 'text-yellow-300' : 'text-white'}`}>
                        {lobbyState.scores[p.sessionId] ?? 0}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>

        {/* ── Área central ── */}
        <section className="flex-1 bg-party-surface border border-party-border rounded-2xl p-4 md:p-5 flex flex-col min-h-64">

          {/* Lobby: QR grande */}
          {isLobby && (
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
              <p className="text-slate-400 text-sm">
                <span className="text-party-violet font-bold">{onlinePlayers.length}</span>{' '}
                jogador{onlinePlayers.length !== 1 ? 'es' : ''} na sala
              </p>
            </div>
          )}

          {/* Jogo ativo: mesa de cartas desta rodada */}
          {(isPlaying || isResult) && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs uppercase tracking-widest text-party-violet font-semibold">
                  Mesa — Rodada {turnInfo?.roundNumber ?? '?'}/{turnInfo?.totalRounds ?? '?'}
                </h2>
                {cards.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {cards.length}/{onlinePlayers.length} jogaram
                  </span>
                )}
              </div>

              {/* Resultado da rodada */}
              {isResult && roundResult && (
                <div className={`mb-4 rounded-2xl border-2 p-4 text-center
                  ${roundResult.winner ? 'border-yellow-400 bg-yellow-400/10' : 'border-party-border bg-party-surface'}`}>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Resultado</p>
                  {roundResult.winner ? (
                    <p className="text-white font-bold text-xl">
                      🏆 <span className="text-yellow-300">{roundResult.winner.name}</span> venceu a rodada!
                    </p>
                  ) : (
                    <p className="text-white font-bold text-xl">🤝 Empate!</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1 animate-pulse">Próxima rodada em instantes...</p>
                </div>
              )}

              {/* Cartas na mesa */}
              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                  <div className="text-5xl opacity-20">🃏</div>
                  <p className="text-slate-500 text-sm">Aguardando jogadores jogarem cartas...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start overflow-y-auto">
                  {cards.map(({ id, playerName, card, rank }) => (
                    <div
                      key={id}
                      className={`rounded-2xl border-2 overflow-hidden flex flex-col shadow-lg
                        ${rank === 5 ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/10 to-amber-400/5 shadow-yellow-400/20' :
                          rank === 4 ? 'border-violet-500 bg-gradient-to-br from-violet-900/30 to-party-bg' :
                          rank === 3 ? 'border-amber-600 bg-gradient-to-br from-amber-900/30 to-party-bg' :
                          'border-party-border bg-party-surface'
                        }
                      `}
                      style={{ animation: 'cardDrop 0.35s ease' }}
                    >
                      {/* Topo colorido */}
                      <div className={`h-1.5 ${
                        rank >= 4 ? 'bg-gradient-to-r from-yellow-400 to-amber-400' : 'bg-party-purple'
                      }`} />

                      <div className="p-4 flex flex-col gap-2 flex-1">
                        {/* Pergunta */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-party-violet mb-0.5">Pergunta</p>
                          <p className="text-slate-400 text-xs leading-snug">{card.theme}</p>
                        </div>
                        {/* Resposta */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-0.5">Resposta</p>
                          <p className="text-white font-bold text-base leading-snug">{card.text}</p>
                        </div>
                        {/* Rodapé: jogador + rank */}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-party-border/50">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Respondeu</p>
                            <p className="text-slate-300 text-xs font-semibold">{card.playerName}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-black ${RANK_COLOR[rank] || 'text-slate-400'}`}>
                              {rank > 0 ? rank : '?'}
                            </span>
                            <p className={`text-xs ${RANK_COLOR[rank] || 'text-slate-400'}`}>
                              {rank > 0 ? RANK_STAR[rank] : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Fim de jogo */}
          {isGameOver && gameOver && (
            <div className="flex-1 flex flex-col gap-6 py-4">
              <div className="text-center">
                <div className="text-5xl mb-2">🏆</div>
                <h2 className="text-3xl font-black text-white">
                  {gameOver.winner ? (
                    <><span className="text-yellow-300">{gameOver.winner.name}</span> venceu!</>
                  ) : 'Fim de jogo!'}
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                {(gameOver.scores ?? []).map((entry, i) => (
                  <div
                    key={entry.sessionId}
                    className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-3
                      ${entry.isWinner
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-party-border bg-party-bg'
                      }`}
                  >
                    <span className="text-2xl w-8 text-center flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                    </span>
                    <span className="flex-1 font-bold text-lg text-white truncate">{entry.name}</span>
                    <span className={`font-black text-2xl tabular-nums ${entry.isWinner ? 'text-yellow-300' : 'text-white'}`}>
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fases intermediárias sem área central especial */}
          {(lobbyState.status === 'theme-select' || lobbyState.status === 'ranking-input') && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
              <div className="text-5xl opacity-40">
                {lobbyState.status === 'theme-select' ? '🎯' : '📝'}
              </div>
              <p className="text-slate-400 text-lg font-semibold">
                {lobbyState.status === 'theme-select'
                  ? 'Jogadores escolhendo sua pergunta...'
                  : 'Jogadores montando seus Top 5...'
                }
              </p>
              {lobbyState.status === 'theme-select' && (
                <p className="text-slate-600 text-sm">
                  {lobbyState.themeSelectsCount ?? 0}/{onlinePlayers.length} escolheram
                </p>
              )}
              {lobbyState.status === 'ranking-input' && (
                <p className="text-slate-600 text-sm">
                  {lobbyState.rankingsSubmitted ?? 0}/{lobbyState.rankingsTotal ?? onlinePlayers.length} enviaram
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <style>{`
        @keyframes cardDrop {
          from { transform: translateY(-16px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0) scale(1);        opacity: 1; }
        }
      `}</style>
    </div>
  );
}
