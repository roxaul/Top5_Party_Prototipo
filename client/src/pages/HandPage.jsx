import { useState } from 'react';

/**
 * Componente de carta reutilizável.
 * Formato da carta (JSON pronto para persistência):
 * { id, text, theme, playerName }
 */
function CardFace({ card, index, isPlayed, isMyTurn, onPlay }) {
  return (
    <div
      className={`
        select-none rounded-3xl overflow-hidden shadow-xl
        transition-all duration-300
        ${isPlayed ? 'scale-95 opacity-60' : 'scale-100 opacity-100'}
      `}
      style={{ animation: 'cardSlideIn 0.3s ease forwards', animationDelay: `${index * 60}ms`, opacity: 0 }}
    >
      <div className={`
        border-2 rounded-3xl overflow-hidden
        ${isPlayed
          ? 'border-green-500 bg-gradient-to-br from-green-900 to-green-800'
          : 'border-party-border bg-gradient-to-br from-party-surface to-party-bg'
        }
      `}>
        {/* Barra de cor no topo */}
        <div className={`h-1.5 ${isPlayed ? 'bg-green-500' : 'bg-gradient-to-r from-party-purple to-party-violet'}`} />

        <div className="px-5 py-4 flex flex-col gap-2.5">

          {/* Linha 1: Pergunta (tema) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-party-violet flex-shrink-0">
              Pergunta
            </span>
            <div className="flex-1 h-px bg-party-border" />
          </div>
          <p className="text-slate-300 text-sm leading-snug -mt-1">
            {card.theme}
          </p>

          {/* Divisor */}
          <div className="h-px bg-party-border/60" />

          {/* Linha 2: Resposta */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex-shrink-0">
              Resposta
            </span>
            <div className="flex-1 h-px bg-party-border" />
          </div>
          <p className="text-white font-bold text-xl leading-snug -mt-1">
            {card.text}
          </p>

          {/* Divisor */}
          <div className="h-px bg-party-border/60" />

          {/* Linha 3: Quem respondeu + botão */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Respondeu
              </span>
              <p className="text-slate-300 text-sm font-semibold">{card.playerName}</p>
            </div>

            {isPlayed ? (
              <div className="flex items-center gap-1.5 text-green-400">
                <span className="text-xl">✓</span>
                <span className="text-sm font-semibold">Jogada!</span>
              </div>
            ) : isMyTurn ? (
              <button
                onClick={() => onPlay(card.id)}
                className="
                  bg-party-purple hover:bg-party-violet active:scale-90
                  text-white text-sm font-bold px-5 py-2.5 rounded-xl
                  transition-all duration-150 shadow-lg shadow-party-purple/30
                "
              >
                Jogar →
              </button>
            ) : (
              <span className="text-xs text-slate-600 italic border border-party-border/50 px-3 py-1.5 rounded-xl">
                aguarde
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HandPage({ hand, player, onPlayCard, turnInfo, isMyTurn, lobbyState }) {
  const [played, setPlayed] = useState(null);

  const currentTurnName = lobbyState?.players?.find(
    (p) => p.sessionId === turnInfo?.currentTurn
  )?.name ?? '...';

  const roundNumber = turnInfo?.roundNumber ?? 1;
  const totalRounds = turnInfo?.totalRounds ?? '?';

  function handlePlay(cardId) {
    if (!isMyTurn || played) return;
    setPlayed(cardId);
    onPlayCard(cardId);
    setTimeout(() => setPlayed(null), 1200);
  }

  if (hand.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh text-center px-8 gap-4">
        <div className="text-6xl">⏳</div>
        <p className="text-white font-bold text-xl">Aguardando próxima rodada...</p>
        <p className="text-slate-500 text-sm">Rodada {roundNumber} de {totalRounds}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh">

      {/* ── Banner de turno ── */}
      <div className={`px-5 pt-5 pb-3 ${isMyTurn ? 'bg-party-purple/10' : ''}`}>
        {isMyTurn ? (
          <div className="flex items-center gap-3 bg-party-purple rounded-2xl px-4 py-3">
            <span className="text-2xl">🃏</span>
            <div className="flex-1">
              <p className="text-white font-bold text-base leading-tight">Sua vez!</p>
              <p className="text-purple-200 text-xs">Escolha uma carta para jogar na mesa</p>
            </div>
            <span className="text-xs text-purple-200 bg-white/10 px-2 py-1 rounded-lg whitespace-nowrap">
              Rodada {roundNumber}/{totalRounds}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-party-surface border border-party-border rounded-2xl px-4 py-3">
            <span className="text-xl animate-pulse">⏳</span>
            <div className="flex-1">
              <p className="text-slate-400 text-xs uppercase tracking-widest">Aguardando</p>
              <p className="text-white font-bold text-base leading-tight">
                Vez de <span className="text-party-violet">{currentTurnName}</span>
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-party-bg px-2 py-1 rounded-lg">
              {roundNumber}/{totalRounds}
            </span>
          </div>
        )}
      </div>

      {/* ── Placar compacto ── */}
      {lobbyState?.scores && Object.keys(lobbyState.scores).length > 0 && (
        <div className="mx-5 mt-2 mb-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {lobbyState.players
              .filter((p) => p.connected)
              .sort((a, b) => (lobbyState.scores[b.sessionId] ?? 0) - (lobbyState.scores[a.sessionId] ?? 0))
              .map((p) => (
                <div
                  key={p.sessionId}
                  className={`flex-shrink-0 rounded-xl px-3 py-1.5 border text-xs flex items-center gap-1.5 ${
                    p.sessionId === player?.sessionId
                      ? 'bg-party-purple/20 border-party-purple text-white'
                      : 'bg-party-surface border-party-border text-slate-400'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[60px]">{p.name}</span>
                  <span className={`font-bold ${p.sessionId === player?.sessionId ? 'text-yellow-300' : 'text-white'}`}>
                    {lobbyState.scores[p.sessionId] ?? 0}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="px-5 pt-3 pb-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-party-violet font-semibold">Sua mão</p>
          <h2 className="text-xl font-bold text-white">{player?.name}</h2>
        </div>
        <div className="bg-party-surface border border-party-border rounded-xl px-3 py-1.5 text-center">
          <span className="text-xl font-bold text-party-violet leading-none">{hand.length}</span>
          <p className="text-xs text-slate-500 leading-none">carta{hand.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Cartas ── */}
      <div className="flex flex-col gap-4 px-5 pb-8 overflow-y-auto">
        {hand.map((card, idx) => (
          <CardFace
            key={card.id}
            card={card}
            index={idx}
            isPlayed={played === card.id}
            isMyTurn={isMyTurn}
            onPlay={handlePlay}
          />
        ))}
      </div>

      <style>{`
        @keyframes cardSlideIn {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
