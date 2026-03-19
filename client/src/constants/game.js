// Fases do jogo — correspondem ao lobby.status no servidor
export const GAME_STATUS = {
  LOBBY:         'lobby',
  THEME_SELECT:  'theme-select',
  RANKING_INPUT: 'ranking-input',
  PLAYING:       'playing',
  ROUND_RESULT:  'round-result',
  GAME_OVER:     'game-over',
};

// Nomes das telas React
export const SCREEN = {
  JOIN:          'join',
  LOBBY:         'lobby',
  THEME_SELECT:  'theme-select',
  RANKING:       'ranking',
  HAND:          'hand',
  ROUND_RESULT:  'round-result',
  GAME_OVER:     'game-over',
};

// Eventos Socket.IO
export const SOCKET_EVENTS = {
  // cliente → servidor
  HOST_JOIN:          'host:join',
  PLAYER_JOIN:        'player:join',
  GAME_START:         'game:start',
  THEME_SELECT:       'theme:select',
  RANKING_SUBMIT:     'ranking:submit',
  CARD_PLAY:          'card:play',
  TRUCO_CALL:         'truco:call',
  TRUCO_RESPOND:      'truco:respond',

  // cliente → servidor (mesa)
  ROOM_RESET:         'room:reset',

  // servidor → cliente
  PLAYER_JOINED:      'player:joined',
  PLAYER_REJOINED:    'player:rejoined',
  LOBBY_STATE:        'lobby:state',
  LOBBY_UPDATE:       'lobby:update',
  PHASE_THEME_SELECT: 'phase:theme-select',
  PHASE_RANKING_INPUT:'phase:ranking-input',
  GAME_STARTED:       'game:started',
  TURN_UPDATE:        'turn:update',
  HAND_UPDATE:        'hand:update',
  CARD_PLAYED:        'card:played',
  PHASE_ROUND_RESULT: 'phase:round-result',
  PHASE_GAME_OVER:    'phase:game-over',
  PHASE_PLAYING:      'phase:playing',
  TRUCO_CALLED:       'truco:called',
  TRUCO_RESOLVED:     'truco:resolved',
};

export const SESSION_KEY = 'top5party_session';

export const INITIAL_LOBBY_STATE = {
  players:          [],
  status:           GAME_STATUS.LOBBY,
  hostPlayerId:     null,
  themeSelectsCount: 0,
  rankingsSubmitted: 0,
  rankingsTotal:    0,
  currentTurn:      null,
  roundNumber:      0,
  totalRounds:      0,
  scores:           {},
  roundMultiplier:  1,
  truco:            null,
};
