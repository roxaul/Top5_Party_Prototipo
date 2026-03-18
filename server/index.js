const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 10000,
  pingInterval: 5000,
});

const PORT = process.env.PORT || 3000;

// ─── Utilitários ──────────────────────────────────────────────────────────────

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Truco: progressão de valores ────────────────────────────────────────────
// Normal → Truco → Seis → Nove → Doze
const TRUCO_VALUES = [1, 3, 6, 9, 12];
const TRUCO_LABELS = { 1: 'Normal', 3: 'Truco', 6: 'Seis', 9: 'Nove', 12: 'Doze' };

function nextTrucoValue(current) {
  const idx = TRUCO_VALUES.indexOf(current);
  return idx >= 0 && idx < TRUCO_VALUES.length - 1 ? TRUCO_VALUES[idx + 1] : null;
}

// ─── Pool de perguntas/temas ──────────────────────────────────────────────────

const THEME_POOL = [
  'Top 5 Filmes de Terror',
  'Top 5 Comidas do Verão',
  'Top 5 Séries da Netflix',
  'Top 5 Músicas para Festa',
  'Top 5 Destinos de Viagem',
  'Top 5 Super-Heróis',
  'Top 5 Jogos de Video Game',
  'Top 5 Sobremesas',
  'Top 5 Animais Fofos',
  'Top 5 Músicas dos Anos 90',
  'Top 5 Personagens de Anime',
  'Top 5 Filmes de Ação',
  'Top 5 Comidas Italianas',
  'Top 5 Jogos de Tabuleiro',
  'Top 5 Apps no Celular',
  'Top 5 Países para Visitar',
  'Top 5 Heróis Brasileiros',
  'Top 5 Sabores de Sorvete',
  'Top 5 Séries de Anime',
  'Top 5 Filmes de Comédia',
  'Top 5 Bandas de Rock',
  'Top 5 Esportes Radicais',
  'Top 5 Pratos do Churrasco',
  'Top 5 Filmes Românticos',
  'Top 5 Coisas para Fazer no Fim de Semana',
  'Top 5 Coisas Assustadoras',
  'Top 5 Personagens de Disney',
  'Top 5 Vilões de Filmes',
  'Top 5 Músicas Brasileiras',
  'Top 5 Invenções Incríveis',
];

/**
 * Distribui 3 perguntas exclusivas por jogador (sem repetição entre jogadores,
 * se o pool for grande o suficiente).
 * Retorna Map<sessionId, string[]>
 */
function assignThemeOptions(playerIds) {
  const pool = shuffled([...THEME_POOL]);
  const result = new Map();
  let idx = 0;
  for (const sid of playerIds) {
    // Garante 3 opções por jogador; repete o pool se necessário
    const opts = [];
    for (let k = 0; k < 3; k++) {
      opts.push(pool[idx % pool.length]);
      idx++;
    }
    result.set(sid, opts);
  }
  return result;
}

// ─── Estado do Jogo ────────────────────────────────────────────────────────────
//
// sessions  : Map<sessionId, { name, socketId, hand: Card[], connected }>
// cardMeta  : Map<cardId, { owner: sessionId, ownerName, rank: 1-5, text, theme }>
//             (rank é oculto — nunca enviado ao cliente durante o jogo)
//
// Formato de carta pública (enviada ao cliente):
// { id, text, theme, playerName }   — JSON pronto para persistência
//
// Formato completo (para banco/cache):
// { id, text, theme, playerName, rank }   — gerado via buildCardRecord()

const sessions = new Map();
const cardMeta = new Map();

const lobby = {
  players:            [],
  hostSocketId:       null,
  hostPlayerId:       null,
  // 'lobby' | 'theme-select' | 'ranking-input' | 'playing' | 'round-result' | 'game-over'
  status:             'lobby',
  playerThemeOptions: new Map(), // sessionId → string[3]  (opções personalizadas)
  selectedThemes:     new Map(), // sessionId → string     (tema escolhido)
  rankings:           new Map(), // sessionId → string[5]
  // fase de jogo
  turnOrder:          [],
  currentTurn:        null,
  roundCards:         new Map(), // sessionId → { card, meta }
  scores:             new Map(), // sessionId → number
  roundNumber:        0,
  totalRounds:        0,
  // truco
  roundMultiplier:    1,         // pontos em jogo na rodada atual (1, 3, 6, 9 ou 12)
  trucoCaller:        null,      // sessionId de quem pediu
  trucoProposedValue: null,      // valor proposto (próximo nível)
  trucoState:         null,      // null | 'pending'
};

function connectedPlayers() {
  return lobby.players.filter((p) => p.connected);
}

function getLobbyState() {
  return {
    players: lobby.players.map(({ sessionId, name, connected }) => ({
      sessionId,
      name,
      connected,
      isHost:          sessionId === lobby.hostPlayerId,
      submittedRanking: lobby.rankings.has(sessionId),
      selectedTheme:   lobby.selectedThemes.has(sessionId),
      score:           lobby.scores.get(sessionId) ?? 0,
    })),
    status:             lobby.status,
    playerCount:        lobby.players.length,
    hostPlayerId:       lobby.hostPlayerId,
    themeSelectsCount:  lobby.selectedThemes.size,
    rankingsSubmitted:  lobby.rankings.size,
    rankingsTotal:      connectedPlayers().length,
    currentTurn:        lobby.currentTurn,
    roundNumber:        lobby.roundNumber,
    totalRounds:        lobby.totalRounds,
    scores:             Object.fromEntries(lobby.scores),
    roundMultiplier:    lobby.roundMultiplier,
    trucoCaller:        lobby.trucoCaller,
    trucoState:         lobby.trucoState,
  };
}

function broadcastLobbyUpdate() {
  io.emit('lobby:update', getLobbyState());
}

function reassignHostIfNeeded(disconnectedSid) {
  if (lobby.hostPlayerId !== disconnectedSid) return;
  const next = lobby.players.find((p) => p.connected && p.sessionId !== disconnectedSid);
  lobby.hostPlayerId = next ? next.sessionId : null;
  console.log(next ? `[HOST] Host automático → ${next.name}` : '[HOST] Sem jogadores online');
}

function resetRoom() {
  sessions.clear();
  cardMeta.clear();
  lobby.players             = [];
  lobby.hostPlayerId        = null;
  lobby.status              = 'lobby';
  lobby.playerThemeOptions.clear();
  lobby.selectedThemes.clear();
  lobby.rankings.clear();
  lobby.turnOrder           = [];
  lobby.currentTurn         = null;
  lobby.roundCards.clear();
  lobby.scores.clear();
  lobby.roundNumber         = 0;
  lobby.totalRounds         = 0;
  lobby.roundMultiplier     = 1;
  lobby.trucoCaller         = null;
  lobby.trucoProposedValue  = null;
  lobby.trucoState          = null;
}

// ─── Montagem do baralho ──────────────────────────────────────────────────────
//
// Cada carta no formato JSON adequado para persistência:
// { id, text, theme, playerName, rank }
// "rank" fica em cardMeta (oculto durante o jogo).

function buildPublicCard(id, text, theme, playerName) {
  return { id, text, theme, playerName };
}

function startPlaying() {
  lobby.status = 'playing';
  cardMeta.clear();
  lobby.scores.clear();
  lobby.roundNumber = 0;
  lobby.roundCards.clear();

  const allCards = [];
  for (const [sid, items] of lobby.rankings.entries()) {
    const playerName = sessions.get(sid)?.name ?? '?';
    const theme      = lobby.selectedThemes.get(sid) ?? '?';

    items.forEach((text, index) => {
      const rank = 5 - index; // índice 0 = favorito → rank 5
      const id   = generateId();
      cardMeta.set(id, { owner: sid, ownerName: playerName, rank, text, theme });
      allCards.push(buildPublicCard(id, text, theme, playerName));
    });
  }

  const deck    = shuffled(allCards);
  const players = connectedPlayers();
  const cardsPerPlayer = Math.floor(deck.length / players.length);

  lobby.totalRounds = cardsPerPlayer;
  lobby.turnOrder   = players.map((p) => p.sessionId);
  players.forEach((p) => lobby.scores.set(p.sessionId, 0));

  players.forEach((player, i) => {
    const session = sessions.get(player.sessionId);
    if (!session) return;
    const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    session.hand = hand;
    io.to(session.socketId).emit('hand:update', { hand });
  });

  lobby.currentTurn = lobby.turnOrder[0];

  console.log(`[GAME] ${allCards.length} cartas, ${cardsPerPlayer} rodadas, ${players.length} jogadores`);
  io.emit('game:started', getLobbyState());
  io.emit('turn:update', {
    currentTurn: lobby.currentTurn,
    roundNumber:  lobby.roundNumber + 1,
    totalRounds:  lobby.totalRounds,
  });
}

// ─── Fim de rodada ─────────────────────────────────────────────────────────────

function endRound() {
  let winner  = null;
  let maxRank = -1;

  for (const [sid, { meta }] of lobby.roundCards.entries()) {
    if (meta.rank > maxRank) { maxRank = meta.rank; winner = sid; }
  }

  const pointsThisRound = lobby.roundMultiplier;
  if (winner) lobby.scores.set(winner, (lobby.scores.get(winner) || 0) + pointsThisRound);

  const roundResult = {
    roundNumber: lobby.roundNumber + 1,
    totalRounds: lobby.totalRounds,
    pointsWon:   pointsThisRound,
    // Cada entrada em formato JSON completo (pronto para persistência)
    cards: Array.from(lobby.roundCards.entries()).map(([sid, { card, meta }]) => ({
      id:         card.id,
      text:       card.text,
      theme:      card.theme,
      playerName: card.playerName,
      rank:       meta.rank,       // revelado ao fim da rodada
      playedBy:   sid,
    })),
    winner: winner
      ? { sessionId: winner, name: sessions.get(winner)?.name ?? '?' }
      : null,
    scores:      Object.fromEntries(lobby.scores),
    playerNames: Object.fromEntries(
      Array.from(sessions.entries()).map(([sid, s]) => [sid, s.name])
    ),
  };

  lobby.roundNumber++;
  lobby.roundCards.clear();
  lobby.roundMultiplier    = 1;
  lobby.trucoCaller        = null;
  lobby.trucoProposedValue = null;
  lobby.trucoState         = null;
  lobby.status = 'round-result';

  io.emit('phase:round-result', roundResult);

  setTimeout(() => {
    if (lobby.status !== 'round-result') return;
    if (lobby.roundNumber >= lobby.totalRounds) endGame();
    else startNextRound();
  }, 5000);
}

function startNextRound() {
  lobby.status             = 'playing';
  lobby.currentTurn        = lobby.turnOrder[0];
  lobby.roundMultiplier    = 1;
  lobby.trucoCaller        = null;
  lobby.trucoProposedValue = null;
  lobby.trucoState         = null;
  io.emit('phase:playing', getLobbyState());
  io.emit('turn:update', {
    currentTurn: lobby.currentTurn,
    roundNumber:  lobby.roundNumber + 1,
    totalRounds:  lobby.totalRounds,
  });
}

function endGame() {
  lobby.status = 'game-over';
  let topScore = -1, topPlayer = null;
  for (const [sid, score] of lobby.scores.entries()) {
    if (score > topScore) { topScore = score; topPlayer = sid; }
  }

  io.emit('phase:game-over', {
    scores: lobby.turnOrder.map((sid) => ({
      sessionId: sid,
      name:      sessions.get(sid)?.name ?? '?',
      score:     lobby.scores.get(sid) || 0,
      isWinner:  sid === topPlayer,
    })).sort((a, b) => b.score - a.score),
    winner: topPlayer
      ? { sessionId: topPlayer, name: sessions.get(topPlayer)?.name ?? '?', score: topScore }
      : null,
  });
}

// ─── Avança turno (pula desconectados) ────────────────────────────────────────

function advanceTurn(currentSid) {
  const currentIndex = lobby.turnOrder.indexOf(currentSid);
  let ni = currentIndex + 1;
  while (ni < lobby.turnOrder.length) {
    const p = lobby.players.find((x) => x.sessionId === lobby.turnOrder[ni]);
    if (p?.connected) break;
    ni++;
  }
  if (ni < lobby.turnOrder.length) {
    lobby.currentTurn = lobby.turnOrder[ni];
    io.emit('turn:update', {
      currentTurn: lobby.currentTurn,
      roundNumber:  lobby.roundNumber + 1,
      totalRounds:  lobby.totalRounds,
    });
  } else {
    endRound();
  }
}

// ─── Rotas HTTP ────────────────────────────────────────────────────────────────

app.get('/qr', async (_req, res) => {
  const ip  = getLocalIP();
  const url = `http://${ip}:${PORT}`;
  try {
    const png = await QRCode.toBuffer(url, { width: 300, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch {
    res.status(500).send('Erro ao gerar QR Code');
  }
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/socket.io') || req.path === '/qr') return;
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ─── WebSocket ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Conectado: ${socket.id}`);

  // ── Mesa / Host ───────────────────────────────────────────────────────────
  socket.on('host:join', () => {
    lobby.hostSocketId = socket.id;
    socket.join('host');
    console.log(`[HOST] ${socket.id}`);
    socket.emit('lobby:state', getLobbyState());
  });

  // ── Jogador entra ─────────────────────────────────────────────────────────
  socket.on('player:join', ({ name, sessionId }) => {
    let sid = sessionId;

    if (sid && sessions.has(sid)) {
      const session = sessions.get(sid);
      session.socketId  = socket.id;
      session.connected = true;
      const player = lobby.players.find((p) => p.sessionId === sid);
      if (player) { player.connected = true; player.name = session.name; }
      socket.data.sessionId = sid;
      socket.join('players');
      socket.emit('player:rejoined', {
        sessionId: sid,
        name:      session.name,
        hand:      session.hand,
        lobbyState: getLobbyState(),
        // Reenvia opções pessoais de tema (caso ainda esteja nessa fase)
        themeOptions: lobby.playerThemeOptions.get(sid) ?? [],
        selectedTheme: lobby.selectedThemes.get(sid) ?? null,
      });
      console.log(`[RECONEXÃO] ${session.name}`);
    } else {
      sid = generateId();
      const sanitizedName = String(name || 'Jogador').slice(0, 24).trim() || 'Jogador';
      if (lobby.hostPlayerId === null) lobby.hostPlayerId = sid;
      sessions.set(sid, { name: sanitizedName, socketId: socket.id, hand: [], connected: true });
      lobby.players.push({ sessionId: sid, name: sanitizedName, connected: true });
      console.log(`[JOIN] ${sanitizedName} (${sid})${lobby.hostPlayerId === sid ? ' [HOST]' : ''}`);
      socket.data.sessionId = sid;
      socket.join('players');
      socket.emit('player:joined', { sessionId: sid, name: sanitizedName });
    }

    broadcastLobbyUpdate();
  });

  // ── Host inicia → seleção individual de tema ──────────────────────────────
  socket.on('game:start', () => {
    const sid = socket.data.sessionId;
    if (sid !== lobby.hostPlayerId) return;
    if (lobby.status !== 'lobby') return;

    lobby.status = 'theme-select';
    lobby.playerThemeOptions.clear();
    lobby.selectedThemes.clear();

    // Distribui 3 perguntas únicas por jogador
    const players = connectedPlayers();
    const optionsMap = assignThemeOptions(players.map((p) => p.sessionId));
    for (const [psid, opts] of optionsMap) {
      lobby.playerThemeOptions.set(psid, opts);
    }

    // Notifica cada jogador com suas opções pessoais
    for (const player of players) {
      const session = sessions.get(player.sessionId);
      if (!session) continue;
      io.to(session.socketId).emit('phase:theme-select', {
        options:    lobby.playerThemeOptions.get(player.sessionId),
        lobbyState: getLobbyState(),
      });
    }
    // Notifica a Mesa
    io.to('host').emit('phase:theme-select', getLobbyState());

    console.log('[GAME] Fase: seleção individual de tema');
  });

  // ── Jogador seleciona o próprio tema ──────────────────────────────────────
  socket.on('theme:select', ({ theme }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;
    if (lobby.status !== 'theme-select') return;
    if (lobby.selectedThemes.has(sid)) return;

    const opts = lobby.playerThemeOptions.get(sid) ?? [];
    if (!opts.includes(theme)) return; // tema inválido (não estava nas opções)

    lobby.selectedThemes.set(sid, theme);
    console.log(`[TEMA] ${sessions.get(sid).name} escolheu: "${theme}"`);
    broadcastLobbyUpdate();

    if (lobby.selectedThemes.size >= connectedPlayers().length) {
      lobby.status = 'ranking-input';
      lobby.rankings.clear();
      console.log('[GAME] Todos escolheram tema → ranking-input');
      io.emit('phase:ranking-input', getLobbyState());
    }
  });

  // ── Jogador submete seu Top 5 ─────────────────────────────────────────────
  socket.on('ranking:submit', ({ items }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;
    if (lobby.status !== 'ranking-input') return;
    if (lobby.rankings.has(sid)) return;
    if (!Array.isArray(items) || items.length !== 5) return;

    const sanitized = items.map((t) => String(t || '').slice(0, 60).trim());
    if (sanitized.some((t) => t === '')) return;

    lobby.rankings.set(sid, sanitized);
    console.log(`[RANKING] ${sessions.get(sid).name} submeteu Top 5`);
    broadcastLobbyUpdate();

    if (lobby.rankings.size >= connectedPlayers().length) startPlaying();
  });

  // ── Jogador joga uma carta na mesa ────────────────────────────────────────
  socket.on('card:play', ({ cardId }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;
    if (lobby.status !== 'playing') return;
    if (sid !== lobby.currentTurn) return;

    const session  = sessions.get(sid);
    const cardIndex = session.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const [card] = session.hand.splice(cardIndex, 1);
    const meta   = cardMeta.get(card.id) || {};
    lobby.roundCards.set(sid, { card, meta });

    console.log(`[CARTA] ${session.name} jogou: "${card.text}" (${card.theme}) rank=${meta.rank}`);

    io.to('host').emit('card:played', {
      playerId:   sid,
      playerName: session.name,
      card,        // inclui text, theme, playerName
      _meta:       meta, // rank revelado apenas na Mesa
    });

    socket.emit('hand:update', { hand: session.hand });
    advanceTurn(sid);
  });

  // ── Jogador pede Truco ────────────────────────────────────────────────────
  socket.on('truco:call', () => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;
    if (lobby.status !== 'playing') return;
    if (lobby.trucoState === 'pending') return;   // já há uma decisão pendente

    const proposed = nextTrucoValue(lobby.roundMultiplier);
    if (!proposed) return;  // já está no máximo (12)

    lobby.trucoCaller        = sid;
    lobby.trucoProposedValue = proposed;
    lobby.trucoState         = 'pending';

    const callerName = sessions.get(sid)?.name ?? '?';
    const label      = TRUCO_LABELS[proposed] ?? String(proposed);
    console.log(`[TRUCO] ${callerName} pediu ${label}! ${lobby.roundMultiplier} → ${proposed}`);

    io.emit('phase:truco-decision', {
      callerSessionId: sid,
      callerName,
      currentValue:    lobby.roundMultiplier,
      proposedValue:   proposed,
      label,
      lobbyState:      getLobbyState(),
    });
  });

  // ── Jogador responde ao Truco ─────────────────────────────────────────────
  socket.on('truco:respond', ({ response }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;
    if (lobby.trucoState !== 'pending') return;
    if (sid === lobby.trucoCaller) return;  // quem pediu não pode responder

    const responderName = sessions.get(sid)?.name ?? '?';

    if (response === 'flee') {
      // Quem pediu Truco leva os pontos do nível ATUAL (antes da oferta)
      const caller     = lobby.trucoCaller;
      const points     = lobby.roundMultiplier;
      lobby.scores.set(caller, (lobby.scores.get(caller) || 0) + points);

      const callerName = sessions.get(caller)?.name ?? '?';
      console.log(`[TRUCO] ${responderName} fugiu! ${callerName} leva ${points} ponto(s)`);

      lobby.roundMultiplier    = 1;
      lobby.trucoCaller        = null;
      lobby.trucoProposedValue = null;
      lobby.trucoState         = null;
      lobby.roundNumber++;
      lobby.roundCards.clear();
      lobby.status = 'round-result';

      io.emit('phase:round-result', {
        roundNumber: lobby.roundNumber,
        totalRounds: lobby.totalRounds,
        pointsWon:   points,
        cards:       [],
        winner:      { sessionId: caller, name: callerName },
        scores:      Object.fromEntries(lobby.scores),
        playerNames: Object.fromEntries(Array.from(sessions.entries()).map(([s, v]) => [s, v.name])),
        trucoFled:   true,
        fledBy:      responderName,
      });

      setTimeout(() => {
        if (lobby.status !== 'round-result') return;
        if (lobby.roundNumber >= lobby.totalRounds) endGame();
        else startNextRound();
      }, 5000);

    } else if (response === 'accept') {
      lobby.roundMultiplier    = lobby.trucoProposedValue;
      lobby.trucoCaller        = null;
      lobby.trucoProposedValue = null;
      lobby.trucoState         = null;

      console.log(`[TRUCO] ${responderName} aceitou! Multiplicador: ${lobby.roundMultiplier}`);

      io.emit('truco:result', {
        outcome:       'accepted',
        accepterName:  responderName,
        newMultiplier: lobby.roundMultiplier,
        label:         TRUCO_LABELS[lobby.roundMultiplier] ?? String(lobby.roundMultiplier),
        lobbyState:    getLobbyState(),
      });

    } else if (response === 'six') {
      // Contra-oferta: o papel de quem pede se inverte
      const nextNext = nextTrucoValue(lobby.trucoProposedValue);
      if (!nextNext) {
        // Máximo atingido → equivalente a aceitar
        lobby.roundMultiplier    = lobby.trucoProposedValue;
        lobby.trucoCaller        = null;
        lobby.trucoProposedValue = null;
        lobby.trucoState         = null;
        io.emit('truco:result', {
          outcome:       'accepted',
          accepterName:  responderName,
          newMultiplier: lobby.roundMultiplier,
          label:         TRUCO_LABELS[lobby.roundMultiplier] ?? String(lobby.roundMultiplier),
          lobbyState:    getLobbyState(),
        });
        return;
      }

      lobby.trucoCaller        = sid;  // quem contra-ofertou agora é o "chamador"
      lobby.trucoProposedValue = nextNext;
      // trucoState permanece 'pending'

      const newLabel = TRUCO_LABELS[nextNext] ?? String(nextNext);
      console.log(`[TRUCO] ${responderName} contra-ofertou: ${newLabel}!`);

      io.emit('phase:truco-decision', {
        callerSessionId: sid,
        callerName:      responderName,
        currentValue:    lobby.roundMultiplier,
        proposedValue:   nextNext,
        label:           newLabel,
        lobbyState:      getLobbyState(),
      });
    }
  });

  // ── Mesa transfere o host ─────────────────────────────────────────────────
  socket.on('host:transfer', ({ sessionId }) => {
    if (socket.id !== lobby.hostSocketId) return;
    if (!sessions.has(sessionId)) return;
    lobby.hostPlayerId = sessionId;
    console.log(`[HOST] Transferido para ${sessions.get(sessionId).name}`);
    broadcastLobbyUpdate();
  });

  // ── Mesa reseta a sala ────────────────────────────────────────────────────
  socket.on('room:reset', () => {
    if (socket.id !== lobby.hostSocketId) return;
    resetRoom();
    console.log('[RESET] Sala resetada');
    io.emit('room:reset');
    socket.emit('lobby:state', getLobbyState());
  });

  // ── Desconexão ────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    const sid = socket.data.sessionId;

    if (sid && sessions.has(sid)) {
      const session = sessions.get(sid);
      session.connected = false;
      const player = lobby.players.find((p) => p.sessionId === sid);
      if (player) player.connected = false;

      reassignHostIfNeeded(sid);

      if (lobby.status === 'playing' && lobby.currentTurn === sid) {
        console.log(`[TURNO] ${session.name} desconectou no seu turno — avançando`);
        advanceTurn(sid);
      }
      if (lobby.status === 'ranking-input' && lobby.rankings.size >= connectedPlayers().length) {
        startPlaying();
      }
      if (lobby.status === 'theme-select' && lobby.selectedThemes.size >= connectedPlayers().length) {
        lobby.status = 'ranking-input';
        lobby.rankings.clear();
        io.emit('phase:ranking-input', getLobbyState());
      }

      broadcastLobbyUpdate();
      console.log(`[-] ${session.name} desconectado (${reason})`);
    } else if (socket.id === lobby.hostSocketId) {
      lobby.hostSocketId = null;
      console.log(`[-] Mesa desconectada`);
    }
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', async () => {
  const ip  = getLocalIP();
  const url = `http://${ip}:${PORT}`;

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        🎮  Top 5 Party  🎮            ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Local:   http://localhost:${PORT}       ║`);
  console.log(`║  Rede:    ${url.padEnd(27)}║`);
  console.log(`║  Mesa:    ${(url + '/mesa').padEnd(27)}║`);
  console.log(`║  QR Code: ${(url + '/qr').padEnd(27)}║`);
  console.log('╚══════════════════════════════════════╝');

  try {
    const qr = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log('\nEscaneie para conectar:\n');
    console.log(qr);
  } catch {
    console.log(`\nAcesse: ${url}\n`);
  }
});
