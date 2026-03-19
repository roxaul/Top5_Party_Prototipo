import { useState } from 'react';

const LABELS = [
  { pos: '1º', label: 'Favorito absoluto', border: 'border-yellow-400/70',  bg: 'bg-yellow-400/5'  },
  { pos: '2º', label: 'Logo depois',       border: 'border-slate-400/60',   bg: 'bg-slate-400/5'   },
  { pos: '3º', label: 'No meio',           border: 'border-amber-600/60',   bg: 'bg-amber-600/5'   },
  { pos: '4º', label: 'Quase no fim',      border: 'border-party-border',   bg: ''                 },
  { pos: '5º', label: 'Menos favorito',    border: 'border-party-border',   bg: ''                 },
];

// Cada item tem um id estável para que o React mantenha o foco correto
// ao reordenar — key={index} em listas reordenáveis causa salto de foco
const INITIAL_ITEMS = () =>
  LABELS.map((_, i) => ({ id: i, value: '' }));

export default function RankingPage({ theme, lobbyState, onSubmitRanking, mySessionId }) {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [submitted, setSubmitted] = useState(false);

  const { rankingsSubmitted = 0, rankingsTotal = 0 } = lobbyState;

  function handleChange(index, value) {
    const next = items.map((item, i) => i === index ? { ...item, value } : item);
    setItems(next);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = items.map((item) => item.value.trim());
    if (trimmed.some((t) => t === '')) return;
    onSubmitRanking(trimmed);
    setSubmitted(true);
  }

  // Movimenta item para cima/baixo mantendo os ids estáveis
  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  const filledCount = items.filter((item) => item.value.trim() !== '').length;
  const allFilled = filledCount === LABELS.length;

  if (submitted) {
    const pct = rankingsTotal > 0 ? (rankingsSubmitted / rankingsTotal) * 100 : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-6 text-center gap-5">
        <div>
          <h2 className="text-2xl font-bold text-party-violet">Top 5 enviado!</h2>
          <p className="text-slate-400 text-sm mt-1">Aguardando os outros jogadores...</p>
        </div>

        {/* Barra de progresso grande */}
        <div className="w-full max-w-xs bg-party-surface border border-party-border rounded-2xl px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-party-violet font-semibold">
              Progresso
            </p>
            <span className="text-lg font-bold text-white tabular-nums">
              {rankingsSubmitted}/{rankingsTotal}
            </span>
          </div>

          <div className="h-3 bg-party-bg rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-party-purple transition-all duration-700 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="flex flex-col gap-2">
            {lobbyState.players.filter((p) => p.connected).map((p) => (
              <li key={p.sessionId} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  p.submittedRanking ? 'bg-green-500/20 text-green-400' : 'bg-party-border text-slate-500'
                }`}>
                  {p.submittedRanking ? '✓' : '·'}
                </span>
                <span className={p.submittedRanking ? 'text-white' : 'text-slate-500'}>
                  {p.name}
                  {p.sessionId === mySessionId && (
                    <span className="ml-1 text-xs text-party-violet">(você)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh pt-8 px-6 pb-8-safe">
      {/* Header com tema fixo */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-party-violet">Monte seu Top 5</h2>
        <div className="mt-2 bg-party-surface border border-party-purple/40 rounded-xl px-4 py-2 inline-block max-w-full">
          <p className="text-white font-semibold text-sm">{theme}</p>
        </div>
      </div>

      {/* Mini progresso de preenchimento */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-party-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-party-purple transition-all duration-300 rounded-full"
            style={{ width: `${(filledCount / LABELS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 tabular-nums w-10 text-right">{filledCount}/5</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {items.map((item, index) => {
          const { pos, label, border, bg } = LABELS[index];
          const isFilled = item.value.trim() !== '';
          return (
            <div
              key={item.id}
              className={`
                flex items-center gap-2 border rounded-xl px-3 transition-colors duration-200
                ${isFilled ? `${border} ${bg}` : 'border-party-border bg-party-surface'}
              `}
            >
              {/* Posição */}
              <span className="text-xs font-black text-slate-500 flex-shrink-0 w-6 text-center py-3">{pos}</span>

              {/* Input */}
              <input
                type="text"
                value={item.value}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={label}
                maxLength={60}
                className="
                  flex-1 bg-transparent text-white placeholder-slate-600
                  text-base focus:outline-none min-w-0 py-3.5
                "
              />

              {/* Reordenar */}
              <div className="flex flex-col flex-shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="w-9 h-8 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 text-sm active:scale-90 transition-transform"
                  aria-label="mover para cima"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === LABELS.length - 1}
                  className="w-9 h-8 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 text-sm active:scale-90 transition-transform"
                  aria-label="mover para baixo"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="submit"
          disabled={!allFilled}
          className="
            mt-3 bg-party-purple hover:bg-party-violet active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-bold py-4 rounded-xl text-base
            transition-all duration-150
          "
        >
          {allFilled ? 'Enviar Top 5' : `Preencha todos os ${LABELS.length} campos`}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-600">
        {rankingsSubmitted}/{rankingsTotal} jogadores já enviaram
      </p>
    </div>
  );
}
