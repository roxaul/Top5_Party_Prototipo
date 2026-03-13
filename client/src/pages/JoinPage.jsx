import { useState } from 'react';

export default function JoinPage({ onJoin, connected }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0 || !connected) return;
    onJoin(trimmed);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      {/* Logo / título */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🎮</div>
        <h1 className="text-3xl font-bold text-party-violet tracking-tight">Top 5 Party</h1>
        <p className="text-slate-400 text-sm mt-2">O jogo das preferências</p>
      </div>

      {/* Card de entrada */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-party-surface border border-party-border rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
      >
        <label className="text-xs uppercase tracking-widest text-party-violet font-semibold">
          Seu apelido
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Lúcio, Jão, Fê..."
          maxLength={24}
          autoFocus
          className="
            bg-party-bg border border-party-border rounded-xl px-4 py-3
            text-white placeholder-slate-600 text-base
            focus:outline-none focus:border-party-purple focus:ring-2 focus:ring-party-purple/30
            transition
          "
        />

        <button
          type="submit"
          disabled={!connected || name.trim().length === 0}
          className="
            bg-party-purple hover:bg-party-violet active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-bold py-3 rounded-xl text-base
            transition-all duration-150
          "
        >
          Entrar na partida
        </button>

        {!connected && (
          <p className="text-center text-xs text-slate-500">Conectando ao servidor...</p>
        )}
      </form>
    </div>
  );
}
