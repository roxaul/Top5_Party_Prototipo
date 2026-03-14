import WaitingDots from '../components/WaitingDots';
import { GAME_STATUS } from '../constants/game';

const HOW_TO_PLAY = [
  { icon: '🎯', text: 'O host escolhe um tema' },
  { icon: '✍️', text: 'Você monta seu Top 5' },
  { icon: '🃏', text: 'Suas respostas viram cartas' },
  { icon: '🎮', text: 'Jogue cartas na mesa!' },
];

export default function LobbyPage({ player, lobbyState, isHost, onStartGame }) {
  const { players = [], status } = lobbyState;
  const onlinePlayers = players.filter((p) => p.connected);
  const canStart = isHost && onlinePlayers.length >= 2 && status === GAME_STATUS.LOBBY;

  return (
    <div className="flex flex-col min-h-svh px-6 pt-8 pb-4-safe">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🃏</div>
        <h2 className="text-xl font-bold text-party-violet">Sala de Espera</h2>
        <p className="text-slate-400 text-sm mt-1">
          Olá,{' '}
          <span className="text-white font-semibold">{player?.name}</span>
          {isHost && (
            <span className="ml-2 text-xs bg-party-purple/30 text-party-violet px-2 py-0.5 rounded-full">
              👑 Host
            </span>
          )}
          !
        </p>
      </div>

      {/* Lista de jogadores */}
      <div className="bg-party-surface border border-party-border rounded-2xl p-5 mb-4">
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
              className={`flex items-center gap-3 py-3 px-3 rounded-xl bg-party-bg transition-opacity ${
                p.connected ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm flex-1">
                {p.name}
                {p.sessionId === player?.sessionId && (
                  <span className="ml-2 text-xs text-party-violet">(você)</span>
                )}
              </span>
              {p.isHost && (
                <span className="text-xs bg-party-purple/20 text-party-violet px-1.5 py-0.5 rounded-full">
                  👑
                </span>
              )}
            </li>
          ))}

          {players.length === 0 && (
            <li className="text-slate-500 text-sm text-center py-4">
              Nenhum jogador ainda...
            </li>
          )}
        </ul>
      </div>

      {/* Como jogar — visível para todos enquanto esperam */}
      <div className="bg-party-surface border border-party-border rounded-2xl p-4 mb-4">
        <p className="text-xs uppercase tracking-widest text-party-violet font-semibold mb-3">
          Como funciona
        </p>
        <ol className="flex flex-col gap-2">
          {HOW_TO_PLAY.map(({ icon, text }, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Rodapé */}
      <div className="flex flex-col items-center gap-3 mt-auto">
        {isHost ? (
          <>
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="
                w-full
                bg-party-purple hover:bg-party-violet active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white font-bold py-4 rounded-2xl text-base
                transition-all duration-150
              "
            >
              🚀 Iniciar Partida
            </button>
            {onlinePlayers.length < 2 && (
              <p className="text-slate-500 text-xs text-center">
                Aguardando ao menos 2 jogadores para começar
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <WaitingDots />
            <p className="text-slate-500 text-sm text-center">
              Aguardando o host iniciar a partida...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
