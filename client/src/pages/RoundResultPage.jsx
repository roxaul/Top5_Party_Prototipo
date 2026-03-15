const RANK_STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];
const RANK_LABEL = ['', 'Menos favorito', 'Quase no fim', 'No meio', 'Logo depois', 'Favorito!'];
const RANK_COLOR = ['', 'text-slate-400', 'text-slate-300', 'text-amber-400', 'text-violet-300', 'text-yellow-300'];

/**
 * Card de resultado — exibe os 3 campos obrigatórios:
 * Pergunta | Resposta | Quem Respondeu + valor revelado (rank)
 */
function ResultCard({ entry, isWinner, isMe, index }) {
  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all
        ${isWinner
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/15 to-amber-400/5 shadow-lg shadow-yellow-400/20'
          : 'border-party-border bg-party-surface'
        }
      `}
      style={{ animation: 'slideUp 0.3s ease forwards', animationDelay: `${index * 80}ms`, opacity: 0 }}
    >
      {/* Faixa de rank lateral */}
      <div className="flex items-stretch">
        <div className={`w-12 flex-shrink-0 flex flex-col items-center justify-center gap-0.5 py-4
          ${isWinner ? 'bg-yellow-400/20' : 'bg-party-bg'}`}>
          <span className={`text-lg font-black leading-none ${RANK_COLOR[entry.rank] || 'text-white'}`}>
            {entry.rank}
          </span>
          <span className={`text-xs leading-none ${RANK_COLOR[entry.rank] || 'text-slate-400'}`}>
            {RANK_STARS[entry.rank]}
          </span>
          {isWinner && <span className="text-base mt-1">🏆</span>}
        </div>

        {/* Conteúdo: os 3 campos */}
        <div className="flex-1 px-4 py-3 flex flex-col gap-1.5 min-w-0">

          {/* Pergunta */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-party-violet">Pergunta</span>
            <p className="text-slate-400 text-xs leading-snug truncate">{entry.theme}</p>
          </div>

          {/* Resposta */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Resposta</span>
            <p className="text-white font-bold text-base leading-snug">{entry.text}</p>
          </div>

          {/* Quem respondeu */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Respondeu</span>
            <span className="text-slate-300 text-xs font-semibold">{entry.playerName}</span>
            {isMe && <span className="text-xs text-party-violet">(você)</span>}
          </div>

          {/* Valor */}
          <p className={`text-xs mt-0.5 ${RANK_COLOR[entry.rank] || 'text-slate-400'}`}>
            Valor: {RANK_LABEL[entry.rank] ?? entry.rank}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RoundResultPage({ result, player, lobbyState }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh text-center px-8 gap-4">
        <div className="text-5xl animate-pulse">⏳</div>
        <p className="text-white font-bold text-xl">Calculando resultado...</p>
      </div>
    );
  }

  const { roundNumber, totalRounds, cards = [], winner, scores = {}, playerNames = {} } = result;
  const isWinner = winner?.sessionId === player?.sessionId;

  const sortedCards = [...cards].sort((a, b) => b.rank - a.rank);

  return (
    <div className="flex flex-col min-h-svh px-5 py-8">

      {/* Cabeçalho */}
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-1">
          Rodada {roundNumber} de {totalRounds}
        </p>
        {winner ? (
          <>
            <div className="text-5xl mb-2">{isWinner ? '🏆' : '🎉'}</div>
            <h2 className="text-2xl font-bold text-white">
              {isWinner
                ? 'Você ganhou a rodada!'
                : <><span className="text-party-violet">{winner.name}</span> ganhou!</>
              }
            </h2>
          </>
        ) : (
          <>
            <div className="text-5xl mb-2">🤝</div>
            <h2 className="text-2xl font-bold text-white">Empate!</h2>
          </>
        )}
        <p className="text-slate-500 text-xs mt-1">Carta com maior valor vence</p>
      </div>

      {/* Cartas jogadas */}
      <div className="flex flex-col gap-3 mb-6">
        <h3 className="text-xs uppercase tracking-widest text-party-violet font-semibold">
          Cartas desta rodada
        </h3>
        {sortedCards.map((c, i) => (
          <ResultCard
            key={c.id}
            entry={c}
            isWinner={winner && c.playedBy === winner.sessionId}
            isMe={c.playedBy === player?.sessionId}
            index={i}
          />
        ))}
      </div>

      {/* Placar */}
      <div className="bg-party-surface border border-party-border rounded-2xl px-5 py-4">
        <h3 className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-3">
          Placar
        </h3>
        <div className="flex flex-col gap-2">
          {Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([sid, score], i) => {
              const name = playerNames[sid] ?? sid;
              const isMe = sid === player?.sessionId;
              return (
                <div key={sid} className={`flex items-center gap-3 rounded-xl px-3 py-2
                  ${isMe ? 'bg-party-purple/20' : 'bg-party-bg'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i === 0 ? 'bg-yellow-400 text-black' : 'bg-party-border text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <span className={`flex-1 text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-slate-300'}`}>
                    {name}{isMe && <span className="text-party-violet text-xs ml-1">(você)</span>}
                  </span>
                  <span className={`font-bold text-lg tabular-nums ${i === 0 ? 'text-yellow-300' : 'text-white'}`}>
                    {score}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600 animate-pulse">
        Próxima rodada em instantes...
      </p>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
