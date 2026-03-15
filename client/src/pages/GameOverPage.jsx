const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameOverPage({ result, player }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh text-center px-8 gap-4">
        <div className="text-5xl animate-pulse">🏁</div>
        <p className="text-white font-bold text-xl">Fim de jogo!</p>
      </div>
    );
  }

  const { scores = [], winner } = result;
  const isWinner = winner?.sessionId === player?.sessionId;

  return (
    <div className="flex flex-col min-h-svh px-5 py-8">

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">{isWinner ? '🏆' : '🎮'}</div>
        <h1 className="text-3xl font-black text-white mb-1">
          {isWinner ? 'Você venceu!' : 'Fim de jogo!'}
        </h1>
        {winner && !isWinner && (
          <p className="text-slate-400 text-base">
            <span className="text-party-violet font-bold">{winner.name}</span> ganhou o jogo!
          </p>
        )}
        {winner && (
          <p className="text-slate-500 text-sm mt-1">
            {winner.score} rodada{winner.score !== 1 ? 's' : ''} vencida{winner.score !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Pódio */}
      <div className="flex flex-col gap-3 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-party-violet font-semibold text-center">
          Placar Final
        </h2>

        {scores.map((entry, i) => {
          const isMe = entry.sessionId === player?.sessionId;
          const medal = MEDALS[i] ?? null;
          return (
            <div
              key={entry.sessionId}
              className={`
                rounded-2xl border-2 px-4 py-4 flex items-center gap-4
                transition-all
                ${entry.isWinner
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-amber-400/10 shadow-lg shadow-yellow-400/20'
                  : isMe
                    ? 'border-party-purple bg-party-purple/10'
                    : 'border-party-border bg-party-surface'
                }
              `}
              style={{
                animation: 'popIn 0.4s ease forwards',
                animationDelay: `${i * 100}ms`,
                opacity: 0,
              }}
            >
              {/* Posição */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl
                bg-party-bg border border-party-border">
                {medal ?? <span className="text-slate-500 text-sm font-bold">{i + 1}</span>}
              </div>

              {/* Nome */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-base truncate ${entry.isWinner ? 'text-yellow-300' : 'text-white'}`}>
                  {entry.name}
                </p>
                {isMe && <p className="text-xs text-party-violet">você</p>}
              </div>

              {/* Pontos */}
              <div className="flex-shrink-0 text-right">
                <span className={`text-3xl font-black tabular-nums ${
                  entry.isWinner ? 'text-yellow-300' : 'text-white'
                }`}>
                  {entry.score}
                </span>
                <p className="text-xs text-slate-500">
                  rodada{entry.score !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem de encerramento */}
      <div className="text-center text-slate-600 text-sm">
        <p>Aguarde o host para jogar novamente</p>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.9) translateY(10px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
