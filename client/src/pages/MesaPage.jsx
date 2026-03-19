import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';

const QR_SRC = `/qr?t=${Date.now()}`;

const RANK_ACCENT = ['', '#475569', '#64748b', '#f59e0b', '#8b5cf6', '#facc15'];
const RANK_TEXT   = ['', 'text-slate-400', 'text-slate-300', 'text-amber-400', 'text-violet-300', 'text-yellow-300'];
const RANK_LABEL  = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];
const PODIUM_ICON = ['1º', '2º', '3º'];

// Timing da revelação
const FLIP_HALF        = 300;  // ms — metade do flip (1→0 ou 0→1)
const REVEAL_INTERVAL  = 750;  // ms — intervalo entre revelar cada carta
const REVEAL_DELAY     = 600;  // ms — pausa antes de começar a revelar

function getSeats(n) {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: 50 + 43 * Math.cos(a), y: 50 + 45 * Math.sin(a) };
  });
}

// ─── Carta na mesa ─────────────────────────────────────────────────────────────
function TableCard({ card, rank, index, total, isWinner, showRank, isFlipping, fromAngle, pulseWinner }) {
  const spacing  = total > 1 ? Math.min(72, 360 / (total - 1)) : 0;
  const xOff     = total > 1 ? (index - (total - 1) / 2) * spacing : 0;
  const maxAngle = Math.min(30, total * 4.5);
  const fanAngle = total > 1 ? (index / (total - 1) - 0.5) * maxAngle : 0;
  const accent   = showRank ? (RANK_ACCENT[rank] ?? '#6c63ff') : 'rgba(108,99,255,0.35)';

  // Direção de entrada baseada no ângulo do assento do jogador
  const flyX   = Math.round(Math.cos(fromAngle ?? -Math.PI / 2) * 200);
  const flyY   = Math.round(Math.sin(fromAngle ?? -Math.PI / 2) * 200);
  const flyRot = Math.round(-flyX * 0.04);

  return (
    <div
      style={{
        position: 'absolute',
        width: 160,
        height: 222,
        left: `calc(50% + ${xOff}px - 80px)`,
        top: 0,
        transform: `rotate(${fanAngle}deg)`,
        transformOrigin: 'center bottom',
        zIndex: 10 + index,
      }}
    >
      {/* Animação de entrada — voa da direção do jogador */}
      <div
        style={{
          '--fly-x': `${flyX}px`,
          '--fly-y': `${flyY}px`,
          '--fly-rot': `${flyRot}deg`,
          animation: 'cardSlam 0.55s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Animação de flip na revelação */}
        <div
          style={{
            animation: isFlipping
              ? `cardFlip ${FLIP_HALF * 2}ms ease-in-out both`
              : 'none',
          }}
        >
          <div
            className={`w-full rounded-2xl overflow-hidden flex flex-col shadow-xl transition-shadow duration-500
              ${pulseWinner ? 'shadow-yellow-400/70 ring-2 ring-yellow-400' : isWinner && showRank ? 'shadow-black/70 ring-2 ring-yellow-400/60' : 'shadow-black/70'}`}
            style={{
              height: 222,
              background: 'linear-gradient(160deg, #1d1145 0%, #0d0820 100%)',
              border: `2px solid ${pulseWinner ? '#facc15' : isWinner && showRank ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.09)'}`,
              animation: pulseWinner ? 'winnerPulse 0.6s ease infinite alternate' : 'none',
              transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            }}
          >
            {/* Barra de rank — topo */}
            <div
              className="h-1.5 w-full flex-shrink-0"
              style={{ background: accent, transition: 'background 0.4s ease' }}
            />

            <div className="flex flex-col flex-1 p-3 gap-2 min-h-0">
              {/* Pergunta */}
              <div className="rounded-xl px-2.5 py-2" style={{ background: 'rgba(0,0,0,0.35)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: accent, transition: 'color 0.4s ease' }}>
                  Pergunta
                </p>
                <p className="text-white/65 text-[11px] leading-tight line-clamp-2">{card.theme}</p>
              </div>

              <div className="h-px bg-white/8" />

              {/* Resposta — herói */}
              <div className="flex-1 flex items-center justify-center px-1">
                <p className="text-white font-black text-[15px] leading-snug text-center">{card.text}</p>
              </div>

              <div className="h-px bg-white/8" />

              {/* Rodapé: quem respondeu + rank/? */}
              <div className="flex items-end justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-wider text-amber-400/70 leading-none mb-1">
                    Respondeu
                  </p>
                  <p className="text-white/70 text-[11px] font-semibold truncate leading-tight">
                    {card.playerName}
                  </p>
                </div>

                {/* Rank ou ? — troca no meio do flip */}
                <div className="flex-shrink-0 relative" style={{ width: 38, height: 42 }}>
                  <div
                    className="absolute inset-0 flex flex-col items-end justify-center"
                    style={{
                      opacity: showRank ? 1 : 0,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <p className={`text-2xl font-black leading-none ${RANK_TEXT[rank] ?? 'text-white'}`}>{rank}</p>
                    <p className={`text-[9px] leading-none ${RANK_TEXT[rank] ?? 'text-slate-500'}`}>
                      {RANK_LABEL[rank] ?? ''}
                    </p>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      opacity: showRank ? 0 : 1,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/30 border border-white/10">
                      <p className="text-white/20 text-base font-black leading-none">?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de rank — fundo */}
            <div
              className="h-1.5 w-full flex-shrink-0"
              style={{ background: accent, transition: 'background 0.4s ease' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar do jogador ao redor da mesa ───────────────────────────────────────
function PlayerSeat({ player, score, isCurrentTurn, showScore, isTrucoCaller }) {
  const initials = player.name.slice(0, 2).toUpperCase();
  return (
    <div className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${!player.connected ? 'opacity-25' : ''}`}>
      <div className="relative">
        {isCurrentTurn && (
          <>
            <div className="absolute -inset-4 rounded-full bg-party-purple/25 blur-xl animate-pulse pointer-events-none" />
            <div className="absolute -inset-2.5 rounded-full border-2 border-party-purple animate-ping opacity-60 pointer-events-none" />
          </>
        )}
        {isTrucoCaller && (
          <div className="absolute -inset-3 rounded-full border-2 border-red-500 animate-ping opacity-70 pointer-events-none" />
        )}
        <div
          className={`relative w-16 h-16 rounded-full flex items-center justify-center
            font-black text-xl text-white z-10 border-2 transition-all duration-300
            bg-gradient-to-br from-party-purple to-party-violet
            ${isTrucoCaller ? 'border-red-500 scale-110 shadow-lg shadow-red-700/60' :
              isCurrentTurn ? 'border-party-violet scale-110 shadow-lg shadow-party-purple/70' : 'border-white/10'}`}
        >
          {initials}
          {player.isHost && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider text-party-violet leading-none bg-[#06041a] px-1 rounded">
              host
            </span>
          )}
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#06041a] ${player.connected ? 'bg-green-400' : 'bg-red-500'}`} />
          {showScore && (
            <span className="absolute -bottom-1 -left-1 min-w-[24px] h-6 bg-[#0f0928] border border-party-border rounded-full flex items-center justify-center text-[11px] font-black text-yellow-300 px-1">
              {score ?? 0}
            </span>
          )}
        </div>
      </div>
      <p className={`text-xs font-bold text-center max-w-[88px] truncate leading-tight ${isTrucoCaller ? 'text-red-400' : isCurrentTurn ? 'text-white' : 'text-slate-400'}`}>
        {player.name}
      </p>
      {isTrucoCaller && (
        <p className="text-[10px] font-black uppercase tracking-wider text-red-400 animate-pulse leading-none">Truco!</p>
      )}
      {!isTrucoCaller && isCurrentTurn && (
        <p className="text-[10px] font-black uppercase tracking-wider text-party-violet animate-pulse leading-none">vez!</p>
      )}
    </div>
  );
}

// ─── Linha do placar ──────────────────────────────────────────────────────────
function ScoreRow({ player, score, rank, isCurrentTurn, maxScore, showDelta }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <li className={`relative rounded-xl px-3 py-2.5 transition-all duration-300 ${
      showDelta ? 'bg-yellow-400/15 ring-1 ring-yellow-400/60' :
      isCurrentTurn ? 'bg-party-purple/20 ring-1 ring-party-purple/50' : 'bg-white/4'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm font-black w-7 text-center flex-shrink-0 text-slate-500">
          {rank <= 2 ? PODIUM_ICON[rank] : `${rank + 1}.`}
        </span>
        <span className={`flex-1 font-bold text-sm truncate ${isCurrentTurn || showDelta ? 'text-white' : 'text-slate-300'}`}>
          {player.name}
        </span>
        <div className="relative flex items-center">
          <span className={`font-black text-xl tabular-nums transition-colors duration-300 ${showDelta ? 'text-yellow-300' : rank === 0 ? 'text-yellow-300' : 'text-white'}`}>
            {score}
          </span>
          {showDelta && (
            <span
              className="absolute -top-5 right-0 font-black text-sm text-yellow-300 pointer-events-none"
              style={{ animation: 'scoreDelta 1.8s ease forwards' }}
            >
              +1
            </span>
          )}
        </div>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${showDelta || rank === 0 ? 'bg-yellow-400' : 'bg-party-purple/70'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

// ─── MesaPage ─────────────────────────────────────────────────────────────────
export default function MesaPage() {
  const [connected, setConnected]         = useState(false);
  const [lobbyState, setLobbyState]       = useState({ players: [], status: 'lobby', hostPlayerId: null });
  const [cards, setCards]                 = useState([]);   // { card, rank, id, fromAngle }
  const [turnInfo, setTurnInfo]           = useState(null);
  const [roundResult, setRoundResult]     = useState(null);
  const [gameOver, setGameOver]           = useState(null);
  const [trucoBanner, setTrucoBanner]     = useState(false);
  const [trucoCooldown, setTrucoCooldown] = useState(false);
  const [trucoState, setTrucoState]       = useState(null); // { callerId, callerName, newMultiplier } | null

  // Estado da revelação sequencial
  const [revealedSet, setRevealedSet]     = useState(new Set());   // índices já revelados
  const [flippingIndex, setFlippingIndex] = useState(null);        // índice virando agora
  const [revealDone, setRevealDone]       = useState(false);       // todas reveladas
  const [winnerDelta, setWinnerDelta]     = useState(null);        // sessionId do vencedor para animação +1

  // Ref para evitar closure stale no handler de card:played
  const lobbyStateRef = useRef(lobbyState);
  useEffect(() => { lobbyStateRef.current = lobbyState; }, [lobbyState]);

  // Ref das cartas jogadas para recuperar fromAngle na fase de resultado
  const cardsRef = useRef(cards);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  useEffect(() => {
    socket.connect();
    socket.on('connect',    () => { setConnected(true); socket.emit('host:join'); });
    socket.on('disconnect', () => setConnected(false));
    if (socket.connected)    { setConnected(true); socket.emit('host:join'); }

    socket.on('lobby:state',        s => setLobbyState(s));
    socket.on('lobby:update',       s => setLobbyState(s));
    socket.on('game:started',       s => { setLobbyState(s); setCards([]); setRoundResult(null); });
    socket.on('phase:theme-select', s => setLobbyState(s?.lobbyState ?? s));
    socket.on('turn:update',        info => setTurnInfo(info));

    socket.on('phase:playing', s => {
      setLobbyState(s);
      setCards([]);
      setRoundResult(null);
      setTrucoState(null);
      setRevealedSet(new Set());
      setFlippingIndex(null);
      setRevealDone(false);
    });

    socket.on('card:played', ({ playerId, card, _meta }) => {
      // Calcula o ângulo do assento do jogador para a animação de entrada
      const players = lobbyStateRef.current.players;
      const n       = players.length;
      const idx     = players.findIndex(p => p.sessionId === playerId);
      const fromAngle = idx >= 0 && n > 0
        ? (2 * Math.PI * idx / n) - Math.PI / 2
        : -Math.PI / 2;

      setCards(prev => [...prev, {
        card,
        rank: _meta?.rank ?? 0,
        id: card.id + Date.now(),
        fromAngle,
      }]);
    });

    socket.on('phase:round-result', result => {
      setRoundResult(result);
      setTrucoState(null);
      setLobbyState(prev => ({ ...prev, status: 'round-result', scores: result.scores }));
    });
    socket.on('phase:game-over',    result => setGameOver(result));
    socket.on('mesa:truco',         () => triggerTrucoBanner());
    socket.on('truco:called',       data  => { setTrucoState(data); triggerTrucoBanner(); });
    socket.on('truco:resolved',     ()    => setTrucoState(null));

    socket.on('room:reset', state => {
      setLobbyState(state ?? { players: [], status: 'lobby' });
      setCards([]); setTurnInfo(null); setRoundResult(null); setGameOver(null);
      setTrucoState(null);
      setRevealedSet(new Set()); setFlippingIndex(null); setRevealDone(false);
    });

    return () => {
      ['connect','disconnect','lobby:state','lobby:update','game:started','phase:playing',
       'phase:theme-select','turn:update','card:played','phase:round-result',
       'phase:game-over','mesa:truco','room:reset',
       'truco:called','truco:resolved'].forEach(ev => socket.off(ev));
    };
  }, []);

  // ── Revelação sequencial quando o resultado da rodada chega ──────────────────
  useEffect(() => {
    if (!roundResult) return;

    const total    = roundResult.cards.length;
    const timeouts = [];

    setRevealedSet(new Set());
    setFlippingIndex(null);
    setRevealDone(false);

    for (let i = 0; i < total; i++) {
      const t = REVEAL_DELAY + i * REVEAL_INTERVAL;

      // 1. Inicia o flip
      timeouts.push(setTimeout(() => setFlippingIndex(i), t));

      // 2. No meio do flip: mostra o rank
      timeouts.push(setTimeout(() => {
        setRevealedSet(prev => new Set([...prev, i]));
      }, t + FLIP_HALF));

      // 3. Fim do flip: limpa o flipping
      timeouts.push(setTimeout(() => setFlippingIndex(null), t + FLIP_HALF * 2));
    }

    // Depois que tudo revelou: mostra o banner do vencedor
    const doneAt = REVEAL_DELAY + total * REVEAL_INTERVAL + FLIP_HALF * 2 + 300;
    timeouts.push(setTimeout(() => setRevealDone(true), doneAt));

    return () => timeouts.forEach(clearTimeout);
  }, [roundResult]);

  // Quando todas as cartas foram reveladas: dispara animação de +1 no vencedor
  useEffect(() => {
    if (!revealDone || !roundResult?.winner) return;
    setWinnerDelta(roundResult.winner.sessionId);
    const t = setTimeout(() => setWinnerDelta(null), 1800);
    return () => clearTimeout(t);
  }, [revealDone, roundResult]);

  const triggerTrucoBanner = useCallback(() => {
    setTrucoBanner(true);
    setTimeout(() => setTrucoBanner(false), 2200);
  }, []);

  function handleTruco() {
    if (trucoCooldown) return;
    socket.emit('mesa:truco');
    triggerTrucoBanner();
    setTrucoCooldown(true);
    setTimeout(() => setTrucoCooldown(false), 10_000);
  }

  function handleReset() {
    if (!window.confirm('Resetar a sala? Todos os jogadores serão mandados para a tela inicial.')) return;
    socket.emit('room:reset');
    setCards([]); setRoundResult(null); setGameOver(null);
  }

  const onlinePlayers     = lobbyState.players.filter(p => p.connected);
  const isLobby           = lobbyState.status === 'lobby';
  const isPlaying         = lobbyState.status === 'playing';
  const isResult          = lobbyState.status === 'round-result';
  const isGameOver        = lobbyState.status === 'game-over';
  const showSidebar       = isPlaying || isResult || isGameOver;
  const seats             = getSeats(lobbyState.players.length);
  const currentTurnPlayer = onlinePlayers.find(p => p.sessionId === turnInfo?.currentTurn);

  // Durante round-result usa os scores do resultado (já atualizados) para exibição
  const activeScores = (isResult && roundResult?.scores) ? roundResult.scores : (lobbyState.scores ?? {});

  const sortedPlayers = [...onlinePlayers].sort(
    (a, b) => (activeScores[b.sessionId] ?? 0) - (activeScores[a.sessionId] ?? 0)
  );
  const maxScore = sortedPlayers[0] ? (activeScores[sortedPlayers[0].sessionId] ?? 0) : 1;

  const progressPct = lobbyState.status === 'theme-select'
    ? Math.round(((lobbyState.themeSelectsCount ?? 0) / Math.max(1, onlinePlayers.length)) * 100)
    : Math.round(((lobbyState.rankingsSubmitted ?? 0) / Math.max(1, lobbyState.rankingsTotal ?? onlinePlayers.length)) * 100);

  // Durante a fase playing: cartas face-down (sem rank)
  // Durante round-result: usa roundResult.cards com revelação sequencial
  const displayCards = (isResult && roundResult)
    ? roundResult.cards.map((c, i) => {
        const played = cardsRef.current.find(pc => pc.card.id === c.id);
        const isWinner = roundResult.winner?.sessionId === c.playedBy;
        return {
          id: c.id,
          card: { text: c.text, theme: c.theme, playerName: c.playerName },
          rank: c.rank,
          isWinner,
          fromAngle: played?.fromAngle ?? -Math.PI / 2,
          showRank: revealedSet.has(i),
          isFlipping: flippingIndex === i,
          pulseWinner: isWinner && revealDone,
        };
      })
    : cards.map(c => ({
        ...c,
        isWinner: false,
        showRank: false,      // face-down enquanto joga
        isFlipping: false,
      }));

  const fanWidth = displayCards.length > 0
    ? Math.min(600, 160 + (displayCards.length - 1) * Math.min(72, 360 / Math.max(1, displayCards.length - 1)) + 120)
    : 320;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#06041a] flex flex-col select-none">

      {/* ── Truco Banner ── */}
      {trucoBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ animation: 'trucoPop 2.2s ease forwards' }}>
          <p className="font-black text-white text-[10rem] leading-none tracking-tighter drop-shadow-2xl"
            style={{ textShadow: '0 0 80px #6c63ff, 0 0 40px #6c63ff, 0 4px 0 rgba(0,0,0,0.8)' }}>
            TRUCO!
          </p>
        </div>
      )}

      {/* ── Brilho ambiente ── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[50vh] rounded-full bg-party-purple/5 blur-3xl" />
      </div>

      {/* ── Header ── */}
      <header className="flex-shrink-0 z-30 flex items-center gap-3 px-5 py-2.5 bg-black/55 backdrop-blur-md border-b border-white/6">
        <span className="font-black text-party-violet text-base tracking-tight">Top 5 Party</span>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
        <div className="h-3.5 w-px bg-white/10" />
        <span className="text-xs text-slate-500 font-medium">
          {isLobby && 'Aguardando jogadores'}
          {lobbyState.status === 'theme-select' && `Escolhendo temas · ${lobbyState.themeSelectsCount ?? 0}/${onlinePlayers.length}`}
          {lobbyState.status === 'ranking-input' && `Montando Top 5 · ${lobbyState.rankingsSubmitted ?? 0}/${lobbyState.rankingsTotal ?? onlinePlayers.length}`}
          {(isPlaying || isResult) && turnInfo && `Rodada ${turnInfo.roundNumber} de ${turnInfo.totalRounds}${(lobbyState.roundMultiplier ?? 1) > 1 ? ` · ${lobbyState.roundMultiplier}x` : ''}`}
          {isGameOver && 'Fim de Jogo'}
        </span>
        {isPlaying && currentTurnPlayer && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-party-violet font-semibold">Vez de {currentTurnPlayer.name}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">{cards.length}/{onlinePlayers.length} cartas</span>
          </>
        )}
        {isResult && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">
              {revealDone ? 'Revelação completa' : `Revelando… ${revealedSet.size}/${displayCards.length}`}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2.5">
          {!isLobby && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-2.5 py-1.5">
              <img src={QR_SRC} alt="QR" className="w-9 h-9 rounded-lg" />
              <p className="text-[10px] text-slate-500 leading-tight">{window.location.host}</p>
            </div>
          )}
          <button onClick={handleReset}
            className="text-xs text-slate-600 hover:text-red-400 border border-white/8 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-all duration-200">
            Resetar Sala
          </button>
        </div>
      </header>

      {/* ── Corpo ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar de placar ── */}
        {showSidebar && (
          <aside className="w-60 flex-shrink-0 z-20 flex flex-col gap-3 p-3 bg-black/35 backdrop-blur border-r border-white/5">
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold px-1 mb-2">Placar</p>
              <ul className="flex flex-col gap-1.5">
                {sortedPlayers.map((p, i) => (
                  <ScoreRow key={p.sessionId} player={p}
                    score={activeScores[p.sessionId] ?? 0}
                    rank={i}
                    isCurrentTurn={isPlaying && turnInfo?.currentTurn === p.sessionId}
                    maxScore={maxScore}
                    showDelta={winnerDelta === p.sessionId} />
                ))}
              </ul>
            </div>
            {(isPlaying || isResult) && (
              <div className="mt-auto">
                <button onClick={handleTruco} disabled={trucoCooldown}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-200
                    ${trucoCooldown
                      ? 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                      : 'bg-gradient-to-br from-party-purple to-party-violet text-white shadow-lg shadow-party-purple/40 hover:scale-[1.03] active:scale-95'}`}>
                  {trucoCooldown ? 'Aguarde…' : 'TRUCO!'}
                </button>
                {trucoCooldown && (
                  <p className="text-center text-[10px] text-slate-600 mt-1.5">Disponível em instantes</p>
                )}
              </div>
            )}
          </aside>
        )}

        {/* ── Mesa principal ── */}
        <main className="flex-1 relative overflow-hidden">

          {/* Superfície oval */}
          <div className="absolute rounded-[50%] pointer-events-none" style={{
            left: '18%', right: '18%', top: '10%', bottom: '10%',
            background: 'radial-gradient(ellipse at 43% 38%, #1c1142 0%, #110c2e 50%, #090619 100%)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.55)',
          }} />
          <div className="absolute rounded-[50%] pointer-events-none" style={{
            left: '17%', right: '17%', top: '9%', bottom: '9%',
            border: '3px solid rgba(124,58,237,0.15)',
            boxShadow: '0 0 50px rgba(124,58,237,0.07)',
          }} />
          <div className="absolute rounded-[50%] pointer-events-none" style={{
            left: '31%', right: '31%', top: '23%', bottom: '23%',
            border: '1px solid rgba(255,255,255,0.03)',
          }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[5]">
            <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border border-white/7" />
            </div>
          </div>

          {/* ── Jogadores ao redor ── */}
          {lobbyState.players.map((player, i) => {
            const pos = seats[i];
            if (!pos) return null;
            return (
              <div key={player.sessionId} className="absolute z-20"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
                <PlayerSeat player={player}
                  score={lobbyState.scores?.[player.sessionId] ?? 0}
                  isCurrentTurn={isPlaying && turnInfo?.currentTurn === player.sessionId}
                  showScore={isPlaying || isResult || isGameOver}
                  isTrucoCaller={trucoState?.callerId === player.sessionId} />
              </div>
            );
          })}

          {/* ── Conteúdo central ── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4">

            {/* LOBBY */}
            {isLobby && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="bg-black/50 rounded-3xl p-3 border border-white/10 shadow-2xl backdrop-blur">
                  <img src={QR_SRC} alt="QR Code" className="w-56 h-56 rounded-xl block" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl drop-shadow">Escaneie para entrar</p>
                  <p className="text-slate-500 text-sm mt-0.5">{window.location.host}</p>
                </div>
                {onlinePlayers.length > 0 && (
                  <div className="bg-party-purple/20 border border-party-purple/30 rounded-2xl px-6 py-2.5">
                    <p className="text-party-violet font-bold text-base">
                      {onlinePlayers.length} jogador{onlinePlayers.length !== 1 ? 'es' : ''} na sala
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* THEME-SELECT / RANKING-INPUT */}
            {(lobbyState.status === 'theme-select' || lobbyState.status === 'ranking-input') && (
              <div className="flex flex-col items-center gap-4 text-center bg-black/45 backdrop-blur-md rounded-3xl px-12 py-8 border border-white/8">
                <div>
                  <p className="text-white font-bold text-2xl">
                    {lobbyState.status === 'theme-select' ? 'Escolhendo perguntas…' : 'Montando os Top 5…'}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    {lobbyState.status === 'theme-select'
                      ? `${lobbyState.themeSelectsCount ?? 0} de ${onlinePlayers.length} escolheram`
                      : `${lobbyState.rankingsSubmitted ?? 0} de ${lobbyState.rankingsTotal ?? onlinePlayers.length} enviaram`}
                  </p>
                </div>
                <div className="w-64 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-party-purple to-party-violet transition-all duration-700"
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {/* PLAYING / RESULT */}
            {(isPlaying || isResult) && (
              <div className="flex flex-col items-center gap-4">

                {/* Banner do vencedor — só aparece após revelação completa */}
                {isResult && roundResult && revealDone && (
                  <div
                    className={`px-8 py-3 rounded-2xl border-2 text-center backdrop-blur
                      ${roundResult.winner
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/25'
                        : 'border-white/20 bg-white/5'}`}
                    style={{ animation: 'fadeSlideDown 0.5s ease' }}
                  >
                    {roundResult.winner ? (
                      <p className="text-yellow-300 font-black text-2xl">
                        {roundResult.winner.name} venceu a rodada!
                      </p>
                    ) : (
                      <p className="text-white font-black text-2xl">Empate!</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1 animate-pulse">Próxima rodada em instantes…</p>
                  </div>
                )}

                {/* Banner de Truco pendente */}
                {trucoState && isPlaying && (
                  <div className="px-6 py-3 rounded-2xl border-2 border-red-500/60 bg-red-500/10 text-center backdrop-blur"
                    style={{ animation: 'fadeSlideDown 0.4s ease' }}>
                    <p className="text-red-400 font-black text-xl">
                      {trucoState.callerName} pediu {trucoState.newMultiplier === 2 ? 'Truco' : 'Seis'}!
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Aguardando resposta dos jogadores…
                    </p>
                  </div>
                )}

                {/* Badge de multiplicador */}
                {(lobbyState.roundMultiplier ?? 1) > 1 && (
                  <div className="px-5 py-2 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-center">
                    <p className="text-yellow-300 font-black text-2xl leading-none">{lobbyState.roundMultiplier}x</p>
                    <p className="text-yellow-400/60 text-[10px] uppercase tracking-widest">pontos em jogo</p>
                  </div>
                )}

                {/* Indicador de revelação em andamento */}
                {isResult && roundResult && !revealDone && (
                  <div className="px-6 py-2 rounded-2xl border border-white/10 bg-white/4 text-center">
                    <p className="text-slate-400 text-sm font-semibold">Revelando cartas…</p>
                  </div>
                )}

                {/* Leque de cartas */}
                {displayCards.length === 0 ? (
                  <div className="text-center opacity-30 py-12">
                    <p className="text-slate-500">Aguardando jogadores…</p>
                  </div>
                ) : (
                  <div className="relative" style={{ width: fanWidth, height: 240 }}>
                    {displayCards.map(({ id, card, rank, isWinner, showRank, isFlipping, fromAngle, pulseWinner }, index) => (
                      <TableCard key={id}
                        card={card}
                        rank={rank}
                        index={index}
                        total={displayCards.length}
                        isWinner={isWinner}
                        showRank={showRank}
                        isFlipping={isFlipping}
                        fromAngle={fromAngle}
                        pulseWinner={pulseWinner} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GAME OVER */}
            {isGameOver && gameOver && (
              <div className="flex flex-col items-center gap-5 bg-black/60 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl w-80"
                style={{ animation: 'fadeSlideDown 0.5s ease' }}>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Campeão</p>
                  {gameOver.winner
                    ? <h2 className="text-3xl font-black text-yellow-300">{gameOver.winner.name}</h2>
                    : <h2 className="text-3xl font-black text-white">Empate!</h2>}
                </div>
                <div className="w-full flex flex-col gap-2">
                  {(gameOver.scores ?? []).map((entry, i) => (
                    <div key={entry.sessionId}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5
                        ${entry.isWinner ? 'border-yellow-400/50 bg-yellow-400/8' : 'border-white/8 bg-white/4'}`}>
                      <span className={`text-sm font-black flex-shrink-0 w-8 text-center ${i < 3 ? 'text-white' : 'text-slate-500'}`}>
                        {i <= 2 ? PODIUM_ICON[i] : `${i + 1}.`}
                      </span>
                      <span className="flex-1 text-sm font-bold text-white truncate">{entry.name}</span>
                      <span className={`font-black text-2xl tabular-nums ${entry.isWinner ? 'text-yellow-300' : 'text-white'}`}>
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <style>{`
        @keyframes cardSlam {
          0%   { opacity: 0; transform: translateX(var(--fly-x)) translateY(var(--fly-y)) scale(0.45) rotate(var(--fly-rot, 0deg)); }
          65%  { opacity: 1; transform: translateX(0) translateY(3px) scale(1.04) rotate(0deg); }
          82%  { transform: translateY(-1px) scale(0.99); }
          100% { transform: none; }
        }
        @keyframes cardFlip {
          0%   { transform: scaleX(1); }
          38%  { transform: scaleX(0); }
          62%  { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes trucoPop {
          0%   { opacity: 0; transform: scale(0.5); }
          15%  { opacity: 1; transform: scale(1.05); }
          25%  { transform: scale(1); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: scale(1.15); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes scoreDelta {
          0%   { opacity: 0; transform: translateY(0px) scale(0.7); }
          15%  { opacity: 1; transform: translateY(-4px) scale(1.2); }
          60%  { opacity: 1; transform: translateY(-16px) scale(1); }
          100% { opacity: 0; transform: translateY(-28px) scale(0.9); }
        }
        @keyframes winnerPulse {
          from { box-shadow: 0 0 20px rgba(250,204,21,0.5), 0 0 40px rgba(250,204,21,0.2); }
          to   { box-shadow: 0 0 40px rgba(250,204,21,0.9), 0 0 80px rgba(250,204,21,0.4); }
        }
      `}</style>
    </div>
  );
}
