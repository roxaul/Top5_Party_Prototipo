import { useState, useRef, useEffect } from 'react';

// ─── Truco helpers ────────────────────────────────────────────────────────────
const TRUCO_VALUES = [1, 3, 6, 9, 12];
function nextTrucoValue(v) {
  const idx = TRUCO_VALUES.indexOf(v);
  return idx >= 0 && idx < TRUCO_VALUES.length - 1 ? TRUCO_VALUES[idx + 1] : null;
}
const TRUCO_RAISE_LABEL = { 6: 'Pedir Seis', 9: 'Pedir Nove', 12: 'Pedir Doze' };

// ─── Carta individual ─────────────────────────────────────────────────────────
function GameCard({ card }) {
  return (
    <div
      className="w-full h-full rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #1c1c30 0%, #111120 100%)',
        border: '1px solid rgba(108,99,255,0.25)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Faixa superior colorida */}
      <div
        className="h-1.5 flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, #6c63ff, #a78bfa)' }}
      />

      <div className="flex flex-col flex-1 px-6 py-5 gap-4 min-h-0">

        {/* Pergunta */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-party-violet mb-1.5">
            Pergunta
          </p>
          <p className="text-slate-400 text-sm leading-snug line-clamp-2">{card.theme}</p>
        </div>

        <div className="h-px bg-white/5" />

        {/* Resposta — texto principal */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-400 mb-2">
            Resposta
          </p>
          <p className="text-white font-bold leading-tight" style={{ fontSize: 'clamp(1.1rem, 5vw, 1.5rem)' }}>
            {card.text}
          </p>
        </div>

        <div className="h-px bg-white/5" />

        {/* Autor */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400 mb-1">
            Respondeu
          </p>
          <p className="text-slate-300 text-sm font-semibold">{card.playerName}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HandPage({
  hand, player, onPlayCard, turnInfo, isMyTurn, lobbyState,
  trucoDecision, onCallTruco, onRespondTruco,
}) {
  const [activeIndex, setActiveIndex]     = useState(0);
  const [flyingUp, setFlyingUp]           = useState(false);
  const [playedId, setPlayedId]           = useState(null);
  const [dragDelta, setDragDelta]         = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]       = useState(false);
  const dragRef                           = useRef(null);

  const safeIndex       = Math.min(activeIndex, Math.max(0, hand.length - 1));
  const roundMultiplier = lobbyState?.roundMultiplier ?? 1;
  const trucoPending    = lobbyState?.trucoState === 'pending';
  const canCallTruco    = lobbyState?.status === 'playing' && !trucoPending && nextTrucoValue(roundMultiplier) !== null;
  const iAmTrucoCaller  = trucoDecision?.callerSessionId === player?.sessionId;

  const roundNumber     = turnInfo?.roundNumber ?? 1;
  const totalRounds     = turnInfo?.totalRounds ?? '?';
  const currentTurnName = lobbyState?.players?.find(
    (p) => p.sessionId === turnInfo?.currentTurn
  )?.name ?? '...';

  // Reset índice quando mão muda
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, hand.length - 1)));
  }, [hand.length]);

  function playCurrentCard() {
    if (!isMyTurn || playedId || hand.length === 0) return;
    const card = hand[safeIndex];
    if (!card) return;
    setPlayedId(card.id);
    setFlyingUp(true);
    setTimeout(() => {
      onPlayCard(card.id);
      setFlyingUp(false);
      setPlayedId(null);
      setActiveIndex((i) => Math.min(i, hand.length - 2));
    }, 380);
  }

  // ── Pointer handlers (unifica mouse + touch) ─────────────────────────────────
  function handlePointerDown(e) {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragDelta({ x: 0, y: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    setDragDelta({
      x: e.clientX - dragRef.current.x,
      y: e.clientY - dragRef.current.y,
    });
  }

  function handlePointerUp() {
    if (!dragRef.current) return;
    const { x, y } = dragDelta;

    if (y < -70 && Math.abs(x) < 60 && isMyTurn) {
      playCurrentCard();
    } else if (x < -50 && Math.abs(y) < 50) {
      setActiveIndex((i) => Math.min(i + 1, hand.length - 1));
    } else if (x > 50 && Math.abs(y) < 50) {
      setActiveIndex((i) => Math.max(i - 1, 0));
    }

    dragRef.current = null;
    setDragDelta({ x: 0, y: 0 });
    setIsDragging(false);
  }

  // ── Tela vazia ───────────────────────────────────────────────────────────────
  if (hand.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh text-center px-8 gap-3">
        <p className="text-white font-bold text-xl">Aguardando próxima rodada...</p>
        <p className="text-slate-500 text-sm">Rodada {roundNumber} de {totalRounds}</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-svh select-none overflow-hidden bg-party-bg">

      {/* ── Barra de status do turno ── */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        {isMyTurn ? (
          <div
            className="rounded-2xl px-5 py-3.5"
            style={{ background: 'linear-gradient(135deg, #6c63ff 0%, #5b53e0 100%)', boxShadow: '0 8px 24px rgba(108,99,255,0.35)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-200 mb-0.5">Sua vez</p>
                <p className="text-white font-bold text-sm leading-tight">Deslize a carta para cima</p>
              </div>
              <div className="flex items-center gap-2">
                {roundMultiplier > 1 && (
                  <span className="text-xs font-black text-orange-300 bg-orange-500/25 border border-orange-500/50 px-2.5 py-1 rounded-lg">
                    x{roundMultiplier}
                  </span>
                )}
                <span className="text-[11px] text-purple-200 bg-white/10 px-2.5 py-1 rounded-lg font-semibold">
                  {roundNumber}/{totalRounds}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-party-surface border border-party-border rounded-2xl px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Aguardando</p>
                <p className="text-white font-bold text-sm leading-tight">
                  Vez de <span className="text-party-violet">{currentTurnName}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {roundMultiplier > 1 && (
                  <span className="text-xs font-black text-orange-300 bg-orange-500/25 border border-orange-500/50 px-2.5 py-1 rounded-lg">
                    x{roundMultiplier}
                  </span>
                )}
                <span className="text-[11px] text-slate-500 bg-party-bg px-2.5 py-1 rounded-lg font-semibold">
                  {roundNumber}/{totalRounds}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Placar compacto ── */}
      {lobbyState?.scores && Object.keys(lobbyState.scores).length > 0 && (
        <div className="mx-4 mb-2 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
            {lobbyState.players
              .filter((p) => p.connected)
              .sort((a, b) => (lobbyState.scores[b.sessionId] ?? 0) - (lobbyState.scores[a.sessionId] ?? 0))
              .map((p) => (
                <div
                  key={p.sessionId}
                  className={`flex-shrink-0 rounded-xl px-3 py-1.5 border text-xs flex items-center gap-1.5 ${
                    p.sessionId === player?.sessionId
                      ? 'bg-party-purple/20 border-party-purple/60 text-white'
                      : 'bg-party-surface border-party-border text-slate-400'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[56px]">{p.name}</span>
                  <span className={`font-black tabular-nums ${p.sessionId === player?.sessionId ? 'text-yellow-300' : 'text-white'}`}>
                    {lobbyState.scores[p.sessionId] ?? 0}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Área do carrossel ── */}
      <div
        className="flex-1 relative flex items-center justify-center"
        style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {hand.map((card, idx) => {
          const offset = idx - safeIndex;
          if (Math.abs(offset) > 2) return null;

          const isActive     = offset === 0;
          const isBeingPlayed = isActive && playedId === card.id;

          const tx    = offset * 68;
          const ty    = Math.abs(offset) * 18;
          const rot   = offset * 7;
          const scale = isActive ? 1 : Math.max(0.72, 0.88 - Math.abs(offset) * 0.08);
          const zIndex = 10 - Math.abs(offset);

          let opacity;
          if (!isMyTurn) {
            opacity = isActive ? 0.38 : Math.max(0.12, 0.22 - Math.abs(offset) * 0.06);
          } else {
            opacity = isActive ? 1 : Math.max(0.28, 0.52 - Math.abs(offset) * 0.12);
          }

          let dragX = 0, dragY = 0;
          if (isActive && isDragging) {
            dragX = dragDelta.x * 0.12;
            dragY = Math.min(0, dragDelta.y * 0.75);
          }

          let finalTY = ty + dragY;
          let finalOpacity = opacity;
          if (isBeingPlayed && flyingUp) {
            finalTY = -340;
            finalOpacity = 0;
          }

          return (
            <div
              key={card.id}
              className="absolute"
              style={{
                width: 'min(260px, 68vw)',
                height: 'min(360px, 58vh)',
                transform: `translateX(${tx + dragX}px) translateY(${finalTY}px) rotate(${rot}deg) scale(${scale})`,
                opacity: finalOpacity,
                zIndex,
                transition: (isActive && isDragging) || isBeingPlayed
                  ? isBeingPlayed ? 'transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease' : 'none'
                  : 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
              }}
              onClick={(e) => {
                if (!isActive && Math.abs(dragDelta.x) < 8 && Math.abs(dragDelta.y) < 8) {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }
              }}
            >
              <GameCard card={card} />
            </div>
          );
        })}

        {/* Hint de deslize para cima — só quando é meu turno */}
        {isMyTurn && !playedId && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex flex-col items-center gap-1 opacity-50">
              <div className="w-px h-5 bg-gradient-to-t from-party-violet to-transparent" />
              <div
                className="w-5 h-px bg-party-violet"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />
            </div>
          </div>
        )}

        {/* Overlay quando não é meu turno */}
        {!isMyTurn && (
          <div className="absolute inset-x-0 bottom-0 pb-4 flex justify-center pointer-events-none">
            <div
              className="rounded-xl px-4 py-2 border border-party-border/60"
              style={{ background: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(6px)' }}
            >
              <p className="text-slate-400 text-xs text-center">
                Aguardando <span className="text-white font-semibold">{currentTurnName}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Paginação (dots + setas) ── */}
      {hand.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-3 flex-shrink-0">
          <button
            onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
            disabled={safeIndex === 0}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all disabled:opacity-20"
            style={{ background: '#2d2d44' }}
            aria-label="Carta anterior"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex gap-1.5">
            {hand.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className="rounded-full transition-all duration-200"
                style={{
                  width:  idx === safeIndex ? 16 : 6,
                  height: 6,
                  background: idx === safeIndex ? '#a78bfa' : '#2d2d44',
                }}
                aria-label={`Carta ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveIndex((i) => Math.min(i + 1, hand.length - 1))}
            disabled={safeIndex === hand.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all disabled:opacity-20"
            style={{ background: '#2d2d44' }}
            aria-label="Próxima carta"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Barra inferior: info + ações ── */}
      <div className="px-4 pb-8 pb-safe flex-shrink-0 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Sua mão</p>
          <p className="text-white text-sm font-semibold truncate">
            {player?.name} · {hand.length} carta{hand.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Truco pendente */}
        {trucoPending && !trucoDecision && (
          <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl px-3 py-2">
            <p className="text-orange-300 text-xs font-black tracking-widest">TRUCO</p>
          </div>
        )}

        {/* Botão Truco */}
        {canCallTruco && !trucoDecision && (
          <button
            onClick={onCallTruco}
            className="flex-shrink-0 font-black text-sm tracking-widest px-5 py-3 rounded-xl transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
            }}
          >
            TRUCO
          </button>
        )}

        {/* Botão Jogar (fallback para não-touch) */}
        {isMyTurn && (
          <button
            onClick={playCurrentCard}
            disabled={!!playedId}
            className="flex-shrink-0 font-bold text-sm px-5 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #5b53e0)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(108,99,255,0.4)',
            }}
          >
            Jogar
          </button>
        )}
      </div>

      {/* ── Modal de decisão Truco ── */}
      {trucoDecision && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4 pb-8" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
            style={{
              background: 'linear-gradient(160deg, #1c1c30, #111120)',
              border: '1.5px solid rgba(249,115,22,0.6)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.15)',
            }}
          >
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-400/70 mb-1">
                Desafio
              </p>
              <h2 className="text-4xl font-black tracking-wider text-orange-300">
                {trucoDecision.label ?? 'TRUCO'}
              </h2>
              <p className="text-slate-300 text-sm mt-2">
                <span className="text-white font-bold">{trucoDecision.callerName}</span>{' '}
                jogou o desafio
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Rodada passaria a valer{' '}
                <span className="text-orange-300 font-bold">{trucoDecision.proposedValue}</span>{' '}
                {trucoDecision.proposedValue !== 1 ? 'pontos' : 'ponto'}
              </p>
            </div>

            {iAmTrucoCaller ? (
              <div
                className="rounded-2xl px-4 py-4 text-center"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                <p className="text-orange-300 text-sm font-semibold">Aguardando resposta...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {nextTrucoValue(trucoDecision.proposedValue) !== null && (
                  <button
                    onClick={() => onRespondTruco('six')}
                    className="font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 text-white"
                    style={{ background: 'linear-gradient(135deg, #c2410c, #ea580c)' }}
                  >
                    {TRUCO_RAISE_LABEL[nextTrucoValue(trucoDecision.proposedValue)] ?? 'Subir aposta'}
                  </button>
                )}
                <button
                  onClick={() => onRespondTruco('accept')}
                  className="font-bold py-4 rounded-2xl text-base transition-all active:scale-95 text-white"
                  style={{ background: 'linear-gradient(135deg, #15803d, #166534)', boxShadow: '0 4px 16px rgba(21,128,61,0.3)' }}
                >
                  Aceitar — vale {trucoDecision.proposedValue} pontos
                </button>
                <button
                  onClick={() => onRespondTruco('flee')}
                  className="font-semibold py-3.5 rounded-2xl text-sm transition-all active:scale-95 text-red-400 border"
                  style={{ background: 'transparent', borderColor: 'rgba(220,38,38,0.25)' }}
                >
                  Fugir — adversário leva {trucoDecision.currentValue}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
