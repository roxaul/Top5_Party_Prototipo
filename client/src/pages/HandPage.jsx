import { useState, useRef } from 'react';

export default function HandPage({ hand, player, onPlayCard }) {
  const [played, setPlayed] = useState(null);
  const touchStart = useRef({});

  function handlePlay(cardId) {
    if (played) return;
    setPlayed(cardId);
    onPlayCard(cardId);
    setTimeout(() => setPlayed(null), 900);
  }

  // Swipe up para jogar (gesto silencioso — tap é a ação principal)
  function handleTouchStart(e, cardId) {
    touchStart.current[cardId] = e.touches[0].clientY;
  }

  function handleTouchEnd(e, cardId) {
    const startY = touchStart.current[cardId];
    if (startY === undefined) return;
    const delta = startY - e.changedTouches[0].clientY;
    if (delta > 60) handlePlay(cardId);
    delete touchStart.current[cardId];
  }

  if (hand.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh text-center px-8 gap-4">
        <div className="text-6xl">⏳</div>
        <p className="text-white font-bold text-xl">Aguardando cartas</p>
        <p className="text-slate-500 text-sm">O host vai distribuir em breve...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-party-violet font-semibold">Sua mão</p>
          <h2 className="text-2xl font-bold text-white">{player?.name}</h2>
        </div>
        <div className="bg-party-surface border border-party-border rounded-2xl px-4 py-2 text-center min-w-[56px]">
          <span className="text-2xl font-bold text-party-violet leading-none">{hand.length}</span>
          <p className="text-xs text-slate-500 leading-none mt-0.5">carta{hand.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Dica contextual */}
      <div className="mx-5 mb-4">
        <p className="text-center text-xs text-slate-500 bg-party-surface border border-party-border rounded-full py-2">
          Toque em <span className="text-party-violet font-semibold">Jogar</span> para colocar a carta na mesa
        </p>
      </div>

      {/* Cartas */}
      <div className="flex flex-col gap-3 px-5 pb-8-safe overflow-y-auto">
        {hand.map((card) => {
          const isPlayed = played === card.id;
          return (
            <div
              key={card.id}
              onTouchStart={(e) => handleTouchStart(e, card.id)}
              onTouchEnd={(e) => handleTouchEnd(e, card.id)}
              className={`
                select-none rounded-2xl border overflow-hidden shadow-lg
                transition-all duration-200
                ${isPlayed
                  ? 'border-green-500 bg-green-900/20 scale-95'
                  : 'border-party-border bg-party-surface'
                }
              `}
            >
              <div className="flex items-stretch">
                {/* Faixa lateral colorida — visual de carta */}
                <div className={`w-1.5 flex-shrink-0 transition-colors ${isPlayed ? 'bg-green-500' : 'bg-party-purple'}`} />

                {/* Conteúdo */}
                <div className="flex-1 px-4 py-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-semibold text-white leading-snug block">
                      {card.text}
                    </span>
                    {card.theme && (
                      <span className="text-xs text-party-violet mt-0.5 block truncate">
                        {card.theme}
                      </span>
                    )}
                  </div>

                  {isPlayed ? (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-xl">✓</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePlay(card.id)}
                      className="
                        flex-shrink-0 bg-party-purple hover:bg-party-violet active:scale-90
                        text-white text-sm font-bold px-4 py-2.5 rounded-xl
                        transition-all duration-150
                      "
                    >
                      Jogar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
