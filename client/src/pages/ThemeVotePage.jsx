import { useState } from 'react';
import WaitingDots from '../components/WaitingDots';

const OPTION_COLORS = [
  { border: 'border-party-purple',  bg: 'bg-party-purple/20',  glow: 'shadow-party-purple/40',  num: 'bg-party-purple'  },
  { border: 'border-yellow-400',    bg: 'bg-yellow-400/20',    glow: 'shadow-yellow-400/40',    num: 'bg-yellow-500'    },
  { border: 'border-emerald-400',   bg: 'bg-emerald-400/20',   glow: 'shadow-emerald-400/40',   num: 'bg-emerald-500'   },
];

export default function ThemeVotePage({ lobbyState, player, isHost, onVote, onForce }) {
  const [myVote, setMyVote] = useState(null);

  const { themeOptions = [], themeVotesCount = 0, players = [] } = lobbyState;
  const connected = players.filter((p) => p.connected);
  const totalVoters = connected.length;
  const alreadyVoted = players.filter((p) => p.connected && p.hasVoted);

  function handleVote(i) {
    if (myVote !== null) return;
    setMyVote(i);
    onVote(i);
  }

  if (myVote !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-6 text-center gap-6">
        <div className="text-6xl">🗳️</div>
        <div>
          <h2 className="text-2xl font-bold text-party-violet">Voto registrado!</h2>
          <p className="text-slate-400 text-sm mt-1">Aguardando os outros votarem...</p>
        </div>

        {/* Card do voto escolhido */}
        <div className={`w-full max-w-xs rounded-2xl border-2 p-5 ${OPTION_COLORS[myVote].border} ${OPTION_COLORS[myVote].bg}`}>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Meu voto</p>
          <p className="text-white font-bold text-lg leading-snug">{themeOptions[myVote]}</p>
        </div>

        {/* Progresso */}
        <div className="w-full max-w-xs bg-party-surface border border-party-border rounded-2xl px-5 py-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-party-violet font-semibold">Votos</p>
            <span className="text-lg font-bold text-white tabular-nums">{themeVotesCount}/{totalVoters}</span>
          </div>
          <div className="h-2.5 bg-party-bg rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-party-purple transition-all duration-500 rounded-full"
              style={{ width: totalVoters > 0 ? `${(themeVotesCount / totalVoters) * 100}%` : '0%' }}
            />
          </div>
          <ul className="flex flex-col gap-1.5">
            {connected.map((p) => (
              <li key={p.sessionId} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  p.hasVoted ? 'bg-green-500/20 text-green-400' : 'bg-party-border text-slate-500'
                }`}>
                  {p.hasVoted ? '✓' : '·'}
                </span>
                <span className={p.hasVoted ? 'text-white' : 'text-slate-500'}>{p.name}</span>
                {p.sessionId === player?.sessionId && (
                  <span className="ml-1 text-xs text-party-violet">(você)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <button
            onClick={onForce}
            className="text-sm text-slate-400 border border-party-border hover:border-party-violet hover:text-party-violet px-4 py-2 rounded-xl transition-colors"
          >
            Avançar com votos atuais
          </button>
        )}

        <WaitingDots />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh px-5 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🗳️</div>
        <h2 className="text-xl font-bold text-party-violet">Vote no Tema</h2>
        <p className="text-slate-400 text-sm mt-1">
          Escolha o tema que mais curtir — o mais votado vence!
        </p>
      </div>

      {/* Progresso de votos */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-party-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-party-purple transition-all duration-300 rounded-full"
            style={{ width: totalVoters > 0 ? `${(themeVotesCount / totalVoters) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-slate-500 tabular-nums">{themeVotesCount}/{totalVoters} votos</span>
      </div>

      {/* Opções */}
      <div className="flex flex-col gap-4">
        {themeOptions.map((option, i) => {
          const col = OPTION_COLORS[i];
          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              className={`
                w-full text-left rounded-2xl border-2 p-5
                active:scale-[0.97] transition-all duration-150
                shadow-lg ${col.glow}
                ${col.border} ${col.bg}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full ${col.num} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {i + 1}
                </span>
                <span className="text-white font-bold text-base leading-snug">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {isHost && themeVotesCount > 0 && (
        <button
          onClick={onForce}
          className="mt-6 text-sm text-slate-400 border border-party-border hover:border-party-violet hover:text-party-violet px-4 py-2 rounded-xl transition-colors self-center"
        >
          Avançar com votos atuais
        </button>
      )}
    </div>
  );
}
