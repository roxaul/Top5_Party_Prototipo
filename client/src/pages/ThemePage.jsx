import { useState } from 'react';
import WaitingDots from '../components/WaitingDots';

const SUGGESTIONS = [
  'Filmes de Terror',
  'Comidas do Verão',
  'Séries da Netflix',
  'Músicas para Festa',
  'Destinos de Viagem',
  'Super-Heróis',
  'Jogos de Video Game',
  'Sobremesas',
];

export default function ThemePage({ isHost, onSubmitTheme, lobbyState }) {
  const [theme, setTheme] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = theme.trim();
    if (!trimmed) return;
    onSubmitTheme(trimmed);
  }

  function applySuggestion(s) {
    setTheme(`Top 5 ${s}`);
  }

  const hostName = lobbyState.players.find((p) => p.isHost)?.name ?? 'o host';

  if (!isHost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-6 text-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            <span className="text-party-violet">{hostName}</span> está
          </h2>
          <h2 className="text-2xl font-bold text-white">escolhendo o tema</h2>
          <p className="text-slate-500 text-sm mt-3">
            Fique ligado — você vai precisar montar seu Top 5 em seguida!
          </p>
        </div>

        <WaitingDots />

        {/* Preview do que vem a seguir */}
        <div className="w-full max-w-xs bg-party-surface border border-party-border rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-3 text-left">
            A seguir
          </p>
          <ol className="flex flex-col gap-2 text-left">
            <li className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-5 h-5 rounded-full bg-party-purple/30 flex items-center justify-center text-xs text-party-violet font-bold flex-shrink-0">1</span>
              Host anuncia o tema
            </li>
            <li className="flex items-center gap-2 text-sm text-white font-medium">
              <span className="w-5 h-5 rounded-full bg-party-purple flex items-center justify-center text-xs text-white font-bold flex-shrink-0">2</span>
              Você monta seu Top 5
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-5 h-5 rounded-full bg-party-purple/30 flex items-center justify-center text-xs text-party-violet font-bold flex-shrink-0">3</span>
              Jogue suas cartas na mesa
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-party-violet">Escolha o Tema</h2>
        <p className="text-slate-400 text-sm mt-1">
          Todos vão ranquear seus Top 5 para este tema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-8">
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder='Ex: "Top 5 Filmes de Terror"'
          maxLength={80}
          autoFocus
          className="
            bg-party-bg border border-party-border rounded-xl px-4 py-3.5
            text-white placeholder-slate-600 text-base
            focus:outline-none focus:border-party-purple focus:ring-2 focus:ring-party-purple/30
            transition
          "
        />
        <button
          type="submit"
          disabled={!theme.trim()}
          className="
            bg-party-purple hover:bg-party-violet active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-bold py-4 rounded-xl text-base
            transition-all duration-150
          "
        >
          Confirmar Tema
        </button>
      </form>

      {/* Sugestões com toque fácil */}
      <div>
        <p className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-3">
          Sugestões
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTIONS.map((label) => (
            <button
              key={label}
              onClick={() => applySuggestion(label)}
              className="
                text-sm
                bg-party-surface border border-party-border
                hover:border-party-purple active:scale-95
                text-slate-300 px-4 py-3 rounded-xl text-left
                transition-all duration-150
              "
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
