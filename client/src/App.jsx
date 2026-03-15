import { useGameSocket } from './hooks/useSocket';
import { SCREEN } from './constants/game';
import JoinPage        from './pages/JoinPage';
import LobbyPage       from './pages/LobbyPage';
import ThemeSelectPage from './pages/ThemeSelectPage';
import RankingPage     from './pages/RankingPage';
import HandPage        from './pages/HandPage';
import RoundResultPage from './pages/RoundResultPage';
import GameOverPage    from './pages/GameOverPage';

export default function App() {
  const {
    screen, player, lobbyState, hand, connected, isHost,
    roundResult, gameOver, turnInfo, isMyTurn,
    myThemeOptions, mySelectedTheme,
    joinGame, startGame, selectTheme, submitRanking, playCard,
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
      {screen === SCREEN.THEME_SELECT && (
        <ThemeSelectPage
          options={myThemeOptions}
          selectedTheme={mySelectedTheme}
          lobbyState={lobbyState}
          player={player}
          onSelect={selectTheme}
        />
      )}
      {screen === SCREEN.RANKING && (
        <RankingPage
          theme={mySelectedTheme ?? lobbyState.players.find(p => p.sessionId === player?.sessionId)?.selectedTheme}
          lobbyState={lobbyState}
          mySessionId={player?.sessionId}
          onSubmitRanking={submitRanking}
        />
      )}
      {screen === SCREEN.HAND && (
        <HandPage
          hand={hand}
          player={player}
          turnInfo={turnInfo}
          isMyTurn={isMyTurn}
          lobbyState={lobbyState}
          onPlayCard={playCard}
        />
      )}
      {screen === SCREEN.ROUND_RESULT && (
        <RoundResultPage
          result={roundResult}
          player={player}
          lobbyState={lobbyState}
        />
      )}
      {screen === SCREEN.GAME_OVER && (
        <GameOverPage
          result={gameOver}
          player={player}
        />
      )}
    </div>
  );
}
