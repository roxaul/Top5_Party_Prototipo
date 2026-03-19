import { useState, useRef, useEffect } from 'react';

// Paleta de cores por carta (para diferenciar visualmente sem revelar rank)
const CARD_PALETTES = [
  { grad: 'from-violet-950 via-violet-900 to-indigo-950', border: 'border-violet-500/50', accent: '#7c3aed', dot: 'bg-violet-500' },
  { grad: 'from-blue-950 via-blue-900 to-cyan-950',       border: 'border-blue-500/50',   accent: '#2563eb', dot: 'bg-blue-500'   },
  { grad: 'from-fuchsia-950 via-pink-900 to-rose-950',    border: 'border-fuchsia-500/50',accent: '#a21caf', dot: 'bg-fuchsia-500'},
  { grad: 'from-emerald-950 via-teal-900 to-cyan-950',    border: 'border-emerald-500/50',accent: '#059669', dot: 'bg-emerald-500'},
  { grad: 'from-amber-950 via-orange-900 to-red-950',     border: 'border-amber-500/50',  accent: '#d97706', dot: 'bg-amber-500'  },
];

// ─── Carta individual (design estilo baralho premium) ──────────────────────────
function PlayingCard({ card, offset, isActive, isThrowing, onClick, paletteIndex }) {
  const abs = Math.abs(offset);
  if (abs > 2) return null; // só mostra -2..+2

  const p = CARD_PALETTES[paletteIndex % CARD_PALETTES.length];

  const tx       = offset * 110;
  const scale    = isActive ? 1 : 0.86 - abs * 0.04;
  const ry       = offset * -14;
  const opacity  = isActive ? 1 : 0.65 - abs * 0.15;
  const zIdx     = isActive ? 50 : 30 - abs * 10;
  const throwTY  = isThrowing ? -900 : 0;
  const throwRot = isThrowing ? 25 : 0;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        width: 210,
        transform: `translateX(${tx}px) translateY(${throwTY}px) scale(${scale}) rotateY(${ry}deg) rotate(${throwRot}deg)`,
        opacity,
        zIndex: zIdx,
        transition: isThrowing
          ? 'transform 0.5s cubic-bezier(0.4,0,1,1), opacity 0.4s ease'
          : 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        cursor: isActive ? 'default' : 'pointer',
        transformOrigin: 'center bottom',
        perspective: 800,
      }}
    >
      {/* Sombra de profundidade */}
      <div
        className={`w-full rounded-3xl border-2 ${p.border} bg-gradient-to-br ${p.grad} flex flex-col overflow-hidden`}
        style={{
          boxShadow: isActive
            ? `0 30px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07), 0 0 40px ${p.accent}33`
            : '0 12px 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Barra de cor no topo */}
        <div className="h-1.5 w-full" style={{ background: p.accent }} />

        <div className="px-4 pt-3 pb-3 flex flex-col gap-2.5">
          {/* Cantos superiores — rank oculto (estilo carta de baralho) */}
          <div className="flex items-center justify-between">
            <CardCorner />
            <CardCorner flipped />
          </div>

          {/* Pergunta */}
          <div className="bg-black/25 rounded-xl px-3 py-2">
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: p.accent }}>
              Pergunta
            </p>
            <p className="text-white/75 text-xs leading-snug line-clamp-2">{card.theme}</p>
          </div>

          {/* Divisor decorativo */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Resposta — texto herói */}
          <div className="flex items-center justify-center py-3 px-2 min-h-[72px]">
            <p className="text-white font-black text-[1.15rem] leading-tight text-center">{card.text}</p>
          </div>

          {/* Divisor decorativo */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Respondeu */}
          <div className="bg-black/25 rounded-xl px-3 py-2">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400/80 mb-1">
              Respondeu
            </p>
            <p className="text-white/75 text-xs font-semibold">{card.playerName}</p>
          </div>

          {/* Cantos inferiores — rank oculto (invertido) */}
          <div className="flex items-center justify-between rotate-180">
            <CardCorner />
            <CardCorner flipped />
          </div>
        </div>

        {/* Barra de cor no fundo */}
        <div className="h-1.5 w-full" style={{ background: p.accent }} />
      </div>
    </div>
  );
}

function CardCorner({ flipped }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-7 h-7 rounded-lg bg-black/35 border border-white/10 flex items-center justify-center">
        <span className="text-white/30 text-sm font-black select-none">?</span>
      </div>
    </div>
  );
}

// ─── Dots indicadores ──────────────────────────────────────────────────────────
function CardDots({ total, active, onDot }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDot(i)}
          className={`rounded-full transition-all duration-200 ${
            i === active ? 'w-5 h-2.5 bg-party-violet' : 'w-2 h-2 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

// ─── HandPage principal ────────────────────────────────────────────────────────
export default function HandPage({ hand, player, onPlayCard, turnInfo, isMyTurn, lobbyState, trucoState, onCallTruco, onRespondTruco }) {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [throwing, setThrowing]     = useState(null);
  const touchRef = useRef({ x: 0, y: 0 });

  const roundNumber    = turnInfo?.roundNumber ?? 1;
  const totalRounds    = turnInfo?.totalRounds ?? '?';
  const currentTurnName = lobbyState?.players?.find(
    (p) => p.sessionId === turnInfo?.currentTurn
  )?.name ?? '...';

  const roundMultiplier = lobbyState?.roundMultiplier ?? 1;
  const iAmTrucoCaller  = trucoState?.callerId === player?.sessionId;
  const iNeedToRespond  = trucoState !== null && !iAmTrucoCaller;
  // Pode chamar truco se: nenhum truco pendente, multiplier < 4, fase playing
  const canCallTruco    = trucoState === null && roundMultiplier < 4;
  const trucoLabel      = roundMultiplier === 1 ? 'Truco!' : 'Seis!';

  // Garante que activeIdx não saia do range quando a mão encolhe
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(0, hand.length - 1)));
  }, [hand.length]);

  function handlePlay() {
    const card = hand[activeIdx];
    if (!card || !isMyTurn || throwing) return;
    setThrowing(card.id);
    setTimeout(() => {
      onPlayCard(card.id);
      setThrowing(null);
    }, 520);
  }

  function onTouchStart(e) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;

    if (Math.abs(dy) > 80 && dy < 0 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      // Swipe UP → jogar carta ativa
      handlePlay();
      return;
    }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      // Swipe horizontal → navegar cartas
      if (dx < 0) setActiveIdx((i) => Math.min(i + 1, hand.length - 1));
      else         setActiveIdx((i) => Math.max(i - 1, 0));
    }
  }

  if (hand.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh text-center px-8 gap-4">
        <p className="text-white font-bold text-xl">Aguardando próxima rodada...</p>
        <p className="text-slate-500 text-sm">Rodada {roundNumber} de {totalRounds}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh overflow-hidden relative" style={{ userSelect: 'none' }}>

      {/* ── Overlay de decisão do Truco ── */}
      {iNeedToRespond && trucoState && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6 gap-6">
          <div className="text-center">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">
              {trucoState.newMultiplier === 2 ? 'Pedido de Truco' : 'Pedido de Seis'}
            </p>
            <p className="text-white font-black text-3xl leading-tight">
              <span className="text-party-violet">{trucoState.callerName}</span>
              {trucoState.newMultiplier === 2 ? ' quer Truco!' : ' quer Seis!'}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Rodada passaria a valer{' '}
              <span className="text-yellow-300 font-bold">{trucoState.newMultiplier} ponto{trucoState.newMultiplier > 1 ? 's' : ''}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => onRespondTruco(true)}
              className="w-full py-4 rounded-2xl font-black text-white text-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-900/50 transition-all"
            >
              Aceitar
            </button>
            <button
              onClick={() => onRespondTruco(false)}
              className="w-full py-4 rounded-2xl font-black text-white text-lg bg-red-700 hover:bg-red-600 active:scale-95 shadow-lg shadow-red-900/50 transition-all"
            >
              Fugir
            </button>
          </div>
        </div>
      )}

      {/* Banner de aguardo para quem pediu truco */}
      {iAmTrucoCaller && (
        <div className="fixed top-0 inset-x-0 z-40 bg-party-purple/90 backdrop-blur px-4 py-3 text-center">
          <p className="text-white font-black text-base">Aguardando resposta…</p>
          <p className="text-purple-200 text-xs">Rodada pausada até todos decidirem</p>
        </div>
      )}

      {/* ── Banner de turno ── */}
      <div className={`px-4 pt-5 pb-3 flex-shrink-0 ${isMyTurn ? 'bg-party-purple/10' : ''}`}>
        {isMyTurn ? (
          <div className="flex items-center gap-3 bg-party-purple rounded-2xl px-4 py-3 shadow-lg shadow-party-purple/30">
            <div className="flex-1">
              <p className="text-white font-black text-base leading-tight">Sua vez!</p>
              <p className="text-purple-200 text-xs">Deslize a carta para cima ou toque em Jogar</p>
            </div>
            <span className="text-xs text-purple-200 bg-white/10 px-2.5 py-1.5 rounded-xl whitespace-nowrap font-semibold">
              {roundNumber}/{totalRounds}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-party-surface border border-party-border rounded-2xl px-4 py-3">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <p className="text-slate-400 text-xs uppercase tracking-widest">Aguardando</p>
              <p className="text-white font-bold text-base">
                Vez de <span className="text-party-violet">{currentTurnName}</span>
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-party-bg px-2 py-1.5 rounded-xl font-semibold">
              {roundNumber}/{totalRounds}
            </span>
          </div>
        )}
      </div>

      {/* ── Placar compacto ── */}
      {lobbyState?.scores && Object.keys(lobbyState.scores).length > 0 && (
        <div className="px-4 mt-2 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {lobbyState.players
              .filter((p) => p.connected)
              .sort((a, b) => (lobbyState.scores[b.sessionId] ?? 0) - (lobbyState.scores[a.sessionId] ?? 0))
              .map((p) => (
                <div
                  key={p.sessionId}
                  className={`flex-shrink-0 rounded-xl px-3 py-1.5 border text-xs flex items-center gap-1.5 ${
                    p.sessionId === player?.sessionId
                      ? 'bg-party-purple/20 border-party-purple'
                      : 'bg-party-surface border-party-border'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[60px] text-white">{p.name}</span>
                  <span className={`font-black ${p.sessionId === player?.sessionId ? 'text-yellow-300' : 'text-white'}`}>
                    {lobbyState.scores[p.sessionId] ?? 0}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Info: carta X de Y ── */}
      <div className="px-4 mt-3 flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-slate-500">
          <span className="text-white font-semibold">{player?.name}</span> · {hand.length} carta{hand.length !== 1 ? 's' : ''} na mão
        </p>
        <p className="text-xs text-slate-600">
          {activeIdx + 1} / {hand.length}
        </p>
      </div>

      {/* ── Área das cartas (fan/carousel) ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ perspective: 900 }}
      >
        {/* Container relativo com altura fixa para o carrossel */}
        <div className="relative flex items-center justify-center" style={{ width: '100%', height: 320 }}>
          {hand.map((card, i) => (
            <PlayingCard
              key={card.id}
              card={card}
              offset={i - activeIdx}
              isActive={i === activeIdx}
              isThrowing={throwing === card.id}
              onClick={() => i !== activeIdx && setActiveIdx(i)}
              paletteIndex={i}
            />
          ))}
        </div>

        {/* Dots */}
        <CardDots total={hand.length} active={activeIdx} onDot={setActiveIdx} />

        {/* Navegar com setas (acessibilidade + alternativa ao swipe) */}
        {hand.length > 1 && (
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={() => setActiveIdx((i) => Math.max(i - 1, 0))}
              disabled={activeIdx === 0}
              className="w-10 h-10 rounded-full bg-party-surface border border-party-border flex items-center justify-center text-white disabled:opacity-30 transition-opacity active:scale-90"
            >
              ←
            </button>
            <span className="text-slate-500 text-xs">{activeIdx + 1}/{hand.length}</span>
            <button
              onClick={() => setActiveIdx((i) => Math.min(i + 1, hand.length - 1))}
              disabled={activeIdx === hand.length - 1}
              className="w-10 h-10 rounded-full bg-party-surface border border-party-border flex items-center justify-center text-white disabled:opacity-30 transition-opacity active:scale-90"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* ── Botão flutuante de Truco ── */}
      {canCallTruco && (
        <button
          onClick={onCallTruco}
          className="fixed bottom-28 right-5 z-30 w-16 h-16 rounded-full font-black text-white text-sm
            bg-gradient-to-br from-red-600 to-orange-500
            shadow-xl shadow-red-900/60 active:scale-90 transition-transform
            flex items-center justify-center leading-tight text-center"
        >
          {trucoLabel}
        </button>
      )}

      {/* Badge de multiplicador */}
      {roundMultiplier > 1 && (
        <div className="fixed bottom-28 left-5 z-30 bg-yellow-400/20 border border-yellow-400/50 rounded-2xl px-3 py-2 text-center">
          <p className="text-yellow-300 font-black text-lg leading-none">{roundMultiplier}x</p>
          <p className="text-yellow-400/70 text-[9px] uppercase tracking-wider">pontos</p>
        </div>
      )}

      {/* ── Botão de jogar / status ── */}
      <div className="px-5 pb-8 pt-4 flex-shrink-0">
        {isMyTurn ? (
          <button
            onClick={handlePlay}
            disabled={!!throwing}
            className="
              w-full py-4 rounded-2xl font-black text-white text-lg
              bg-party-purple hover:bg-party-violet active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-xl shadow-party-purple/40
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {throwing ? (
              <span className="animate-bounce text-sm">···</span>
            ) : (
              <>
                <span>Jogar carta</span>
                <span className="text-purple-200 text-sm">↑ swipe up</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-full py-4 rounded-2xl bg-party-surface border border-party-border text-center">
            <p className="text-slate-500 text-sm">
              Aguardando <span className="text-party-violet font-semibold">{currentTurnName}</span> jogar...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
