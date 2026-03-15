import WaitingDots from '../components/WaitingDots';

const OPTION_STYLES = [
  { border: 'border-party-purple',  bg: 'bg-party-purple/15',  numBg: 'bg-party-purple',  emoji: '🎯' },
  { border: 'border-yellow-400',    bg: 'bg-yellow-400/15',    numBg: 'bg-yellow-500',    emoji: '⭐' },
  { border: 'border-emerald-400',   bg: 'bg-emerald-400/15',   numBg: 'bg-emerald-500',   emoji: '🎲' },
];

export default function ThemeSelectPage({ options = [], selectedTheme, lobbyState, player, onSelect }) {
  const { players = [], themeSelectsCount = 0 } = lobbyState;
  const connected = players.filter((p) => p.connected);
  const totalPlayers = connected.length;
  const alreadySelected = players.filter((p) => p.connected && p.selectedTheme);

  // Aguardando os outros (já escolheu)
  if (selectedTheme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-6 text-center gap-6">
        <div className="text-6xl">✅</div>
        <div>
          <h2 className="text-2xl font-bold text-party-violet">Tema escolhido!</h2>
          <p className="text-slate-400 text-sm mt-1">Aguardando os outros escolherem...</p>
        </div>

        {/* Card do tema escolhido */}
        <div className="w-full max-w-xs rounded-2xl border-2 border-party-purple bg-party-purple/15 p-5">
          <p className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-2">
            Sua pergunta
          </p>
          <p className="text-white font-bold text-lg leading-snug">{selectedTheme}</p>
          <p className="text-slate-400 text-xs mt-2">
            Em seguida, você vai montar seu Top 5 para essa pergunta
          </p>
        </div>

        {/* Progresso */}
        <div className="w-full max-w-xs bg-party-surface border border-party-border rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-party-violet font-semibold">Progresso</p>
            <span className="text-lg font-bold text-white tabular-nums">{themeSelectsCount}/{totalPlayers}</span>
          </div>
          <div className="h-2.5 bg-party-bg rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-party-purple transition-all duration-500 rounded-full"
              style={{ width: totalPlayers > 0 ? `${(themeSelectsCount / totalPlayers) * 100}%` : '0%' }}
            />
          </div>
          <ul className="flex flex-col gap-1.5">
            {connected.map((p) => (
              <li key={p.sessionId} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  p.selectedTheme ? 'bg-green-500/20 text-green-400' : 'bg-party-border text-slate-500'
                }`}>
                  {p.selectedTheme ? '✓' : '·'}
                </span>
                <span className={p.selectedTheme ? 'text-white' : 'text-slate-500'}>{p.name}</span>
                {p.sessionId === player?.sessionId && (
                  <span className="ml-1 text-xs text-party-violet">(você)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <WaitingDots />
      </div>
    );
  }

  // Escolha da pergunta
  return (
    <div className="flex flex-col min-h-svh px-5 py-8">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎯</div>
        <h2 className="text-xl font-bold text-party-violet">Escolha sua Pergunta</h2>
        <p className="text-slate-400 text-sm mt-1">
          Essas são <span className="text-white font-semibold">suas 3 perguntas exclusivas</span>.
          Escolha a que mais curtir!
        </p>
      </div>

      {/* Progresso dos outros */}
      {themeSelectsCount > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 bg-party-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-party-purple transition-all duration-300 rounded-full"
              style={{ width: `${(themeSelectsCount / totalPlayers) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums flex-shrink-0">
            {themeSelectsCount}/{totalPlayers} escolheram
          </span>
        </div>
      )}

      {/* As 3 opções */}
      <div className="flex flex-col gap-4">
        {options.map((option, i) => {
          const s = OPTION_STYLES[i] ?? OPTION_STYLES[0];
          return (
            <button
              key={i}
              onClick={() => onSelect(option)}
              className={`
                w-full text-left rounded-3xl border-2 p-5
                active:scale-[0.97] transition-all duration-150
                shadow-lg ${s.border} ${s.bg}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Número */}
                <div className={`${s.numBg} w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0 mt-0.5`}>
                  {i + 1}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                    Opção {i + 1}
                  </p>
                  <p className="text-white font-bold text-lg leading-snug">{option}</p>
                  <p className="text-slate-500 text-xs mt-1.5">
                    Toque para escolher esta pergunta
                  </p>
                </div>

                <span className="text-2xl flex-shrink-0 self-center">{s.emoji}</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        Cada jogador tem perguntas diferentes — escolha a sua!
      </p>
    </div>
  );
}
