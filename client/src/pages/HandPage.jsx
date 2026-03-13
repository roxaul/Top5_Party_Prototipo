import { useState } from 'react';

export default function HandPage({ hand, player, onPlayCard }) {
  const [dragging, setDragging] = useState(null);   // cardId sendo arrastado
  const [played, setPlayed]     = useState(null);    // cardId recém jogado (feedback)

  function handlePlay(cardId) {
    if (played) return;
    setPlayed(cardId);
    onPlayCard(cardId);
    setTimeout(() => setPlayed(null), 800);
  }

  // ── Suporte a drag-and-up (simula arrastar para a mesa) ───────────────────
  function handleDragStart(e, cardId) {
    setDragging(cardId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e) {
    e.preventDefault();
    if (dragging) {
      handlePlay(dragging);
      setDragging(null);
    }
  }

  function handleDragOver(e) { e.preventDefault(); }

  // ── Touch: swipe up para jogar ────────────────────────────────────────────
  const touchStart = {};

  function handleTouchStart(e, cardId) {
    touchStart[cardId] = e.touches[0].clientY;
  }

  function handleTouchEnd(e, cardId) {
    const startY = touchStart[cardId];
    if (startY === undefined) return;
    const delta = startY - e.changedTouches[0].clientY;
    if (delta > 60) {
      handlePlay(cardId);
    }
    delete touchStart[cardId];
  }

  if (hand.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-center px-8">
        <div className="text-5xl mb-4">🃏</div>
        <p className="text-slate-300 font-semibold text-lg">Sua mão está vazia</p>
        <p className="text-slate-500 text-sm mt-2">Aguarde o host distribuir as cartas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <p className="text-xs uppercase tracking-widest text-party-violet font-semibold">
          Sua mão · {player?.name}
        </p>
        <h2 className="text-xl font-bold mt-0.5">
          {hand.length} carta{hand.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {/* Instrução */}
      <p className="text-center text-xs text-slate-500 mb-4">
        Arraste para cima ou toque para jogar uma carta
      </p>

      {/* Zona de drop (mesa virtual) */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`mx-5 mb-4 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center transition-colors ${
          dragging
            ? 'border-party-purple bg-party-purple/10'
            : 'border-party-border'
        }`}
      >
        <span className="text-xs text-slate-500">
          {dragging ? '⬆ Solte aqui para jogar' : '🃏 Zona da mesa'}
        </span>
      </div>

      {/* Cartas */}
      <div className="flex flex-col gap-3 px-5 pb-8 overflow-y-auto">
        {hand.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragEnd={() => setDragging(null)}
            onTouchStart={(e) => handleTouchStart(e, card.id)}
            onTouchEnd={(e) => handleTouchEnd(e, card.id)}
            onClick={() => handlePlay(card.id)}
            className={`
              select-none cursor-grab active:cursor-grabbing
              bg-party-surface border rounded-2xl p-5
              flex items-center gap-4 shadow-md
              transition-all duration-150 active:scale-95
              ${played === card.id
                ? 'border-green-500 bg-green-900/30 scale-95'
                : 'border-party-border hover:border-party-purple'
              }
              ${dragging === card.id ? 'opacity-50 rotate-3 scale-105' : ''}
            `}
          >
            {/* Ícone decorativo */}
            <span className="text-3xl flex-shrink-0">🃏</span>

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-base font-semibold text-white leading-tight truncate">
                {card.text}
              </span>
              {card.theme && (
                <span className="text-xs text-party-violet truncate">
                  Tema: {card.theme}
                </span>
              )}
            </div>

            {played === card.id && (
              <span className="text-green-400 text-xl flex-shrink-0">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
