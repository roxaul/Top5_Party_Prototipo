export default function LobbyPage({ player, lobbyState }) {
  const { players = [], status } = lobbyState;
  const onlinePlayers = players.filter((p) => p.connected);

  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🃏</div>
        <h2 className="text-xl font-bold text-party-violet">Sala de Espera</h2>
        <p className="text-slate-400 text-sm mt-1">
          Olá, <span className="text-white font-semibold">{player?.name}</span>!
        </p>
      </div>

      {/* Status */}
      <div className="bg-party-surface border border-party-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-widest text-party-violet font-semibold">
            Jogadores
          </span>
          <span className="text-xs bg-party-purple/20 text-party-violet px-2 py-0.5 rounded-full font-medium">
            {onlinePlayers.length} online
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.sessionId}
              className={`flex items-center gap-3 py-2 px-3 rounded-xl bg-party-bg transition-opacity ${
                p.connected ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  p.connected ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-sm">
                {p.name}
                {p.sessionId === player?.sessionId && (
                  <span className="ml-2 text-xs text-party-violet">(você)</span>
                )}
              </span>
            </li>
          ))}

          {players.length === 0 && (
            <li className="text-slate-500 text-sm text-center py-4">
              Nenhum jogador ainda...
            </li>
          )}
        </ul>
      </div>

      {/* Aguardando host */}
      <div className="flex flex-col items-center gap-3 mt-auto pb-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-party-purple animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-slate-500 text-sm text-center">
          Aguardando o host iniciar a partida...
        </p>
        <p className="text-slate-600 text-xs text-center">
          Precisa de 3 a 8 jogadores
        </p>
      </div>
    </div>
  );
}
