// Fases do jogo — correspondem ao lobby.status no servidor
export const GAME_STATUS = {
  LOBBY:         'lobby',
  THEME_INPUT:   'theme-input',
  RANKING_INPUT: 'ranking-input',
  PLAYING:       'playing',
};

// Nomes das telas React
export const SCREEN = {
  JOIN:    'join',
  LOBBY:   'lobby',
  THEME:   'theme',
  RANKING: 'ranking',
  HAND:    'hand',
};

// Eventos Socket.IO — evita strings mágicas espalhadas pelo código
export const SOCKET_EVENTS = {
  // cliente → servidor
  HOST_JOIN:       'host:join',
  PLAYER_JOIN:     'player:join',
  GAME_START:      'game:start',
  THEME_SUBMIT:    'theme:submit',
  RANKING_SUBMIT:  'ranking:submit',
  CARD_PLAY:       'card:play',

  // cliente → servidor (mesa)
  ROOM_RESET:           'room:reset',

  // servidor → cliente
  PLAYER_JOINED:        'player:joined',
  PLAYER_REJOINED:      'player:rejoined',
  LOBBY_STATE:          'lobby:state',
  LOBBY_UPDATE:         'lobby:update',
  PHASE_THEME_INPUT:    'phase:theme-input',
  PHASE_RANKING_INPUT:  'phase:ranking-input',
  GAME_STARTED:         'game:started',
  HAND_UPDATE:          'hand:update',
  CARD_PLAYED:          'card:played',
};

export const SESSION_KEY = 'top5party_session';

export const INITIAL_LOBBY_STATE = {
  players:           [],
  status:            GAME_STATUS.LOBBY,
  hostPlayerId:      null,
  theme:             null,
  rankingsSubmitted: 0,
  rankingsTotal:     0,
};
