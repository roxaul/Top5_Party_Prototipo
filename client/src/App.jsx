import { useGameSocket } from './hooks/useSocket';
import { SCREEN } from './constants/game';
import JoinPage    from './pages/JoinPage';
import LobbyPage   from './pages/LobbyPage';
import ThemePage   from './pages/ThemePage';
import RankingPage from './pages/RankingPage';
import HandPage    from './pages/HandPage';

export default function App() {
  const {
    screen, player, lobbyState, hand, connected, isHost,
    joinGame, startGame, submitTheme, submitRanking, playCard,
  } = useGameSocket();

  return (
    <div className="min-h-svh flex flex-col">
      {!connected && (
        <div className="bg-red-600 text-white text-center text-xs py-1 font-semibold tracking-wide">
          Reconectando...
        </div>
      )}

      {screen === SCREEN.JOIN && (
        <JoinPage onJoin={joinGame} connected={connected} />
      )}
      {screen === SCREEN.LOBBY && (
        <LobbyPage
          player={player}
          lobbyState={lobbyState}
          isHost={isHost}
          onStartGame={startGame}
        />
      )}
      {screen === SCREEN.THEME && (
        <ThemePage
          isHost={isHost}
          lobbyState={lobbyState}
          onSubmitTheme={submitTheme}
        />
      )}
      {screen === SCREEN.RANKING && (
        <RankingPage
          theme={lobbyState.theme}
          lobbyState={lobbyState}
          mySessionId={player?.sessionId}
          onSubmitRanking={submitRanking}
        />
      )}
      {screen === SCREEN.HAND && (
        <HandPage hand={hand} player={player} onPlayCard={playCard} />
      )}
    </div>
  );
}
