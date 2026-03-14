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
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
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

// ─── Estado do Jogo ────────────────────────────────────────────────────────────
//
// sessions : Map<sessionId, { name, socketId, hand: Card[], connected }>
// cardMeta : Map<cardId, { owner: sessionId, rank: 1-5, text, theme }>
//            (metadados ocultos — nunca enviados ao cliente durante o jogo)
// lobby.rankings : Map<sessionId, string[]>  (itens em ordem, índice 0 = favorito)

const sessions = new Map();
const cardMeta = new Map();

const lobby = {
  players: [],        // lista pública
  hostSocketId: null, // socket do PC/Mesa
  hostPlayerId: null, // sessionId do primeiro jogador mobile (pode iniciar)
  status: 'lobby',    // 'lobby' | 'theme-input' | 'ranking-input' | 'playing'
  theme: null,        // tema da rodada
  rankings: new Map(),// sessionId -> string[5]
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
      isHost: sessionId === lobby.hostPlayerId,
      submittedRanking: lobby.rankings.has(sessionId),
    })),
    status: lobby.status,
    playerCount: lobby.players.length,
    hostPlayerId: lobby.hostPlayerId,
    theme: lobby.theme,
    rankingsSubmitted: lobby.rankings.size,
    rankingsTotal: connectedPlayers().length,
  };
}

function broadcastLobbyUpdate() {
  io.emit('lobby:update', getLobbyState());
}

// Se o host atual desconectou, passa para o próximo jogador conectado
// (em ordem de entrada). Reconexão NÃO devolve o host.
function reassignHostIfNeeded(disconnectedSid) {
  if (lobby.hostPlayerId !== disconnectedSid) return;
  const next = lobby.players.find((p) => p.connected && p.sessionId !== disconnectedSid);
  lobby.hostPlayerId = next ? next.sessionId : null;
  if (next) {
    console.log(`[HOST] Host automático → ${next.name}`);
  } else {
    console.log('[HOST] Sem jogadores online — host vazio');
  }
}

function resetRoom() {
  sessions.clear();
  cardMeta.clear();
  lobby.players     = [];
  lobby.hostPlayerId = null;
  lobby.status      = 'lobby';
  lobby.theme       = null;
  lobby.rankings.clear();
  // hostSocketId mantido — a Mesa continua conectada
}

// ─── Montagem e distribuição do baralho ───────────────────────────────────────

function startPlaying() {
  lobby.status = 'playing';
  cardMeta.clear();

  // Monta todas as cartas a partir dos rankings
  // índice 0 = favorito (rank 5) … índice 4 = menos favorito (rank 1)
  const allCards = [];
  for (const [sid, items] of lobby.rankings.entries()) {
    items.forEach((text, index) => {
      const rank = 5 - index;
      const id = generateId();
      cardMeta.set(id, { owner: sid, rank, text, theme: lobby.theme });
      allCards.push({ id, text, theme: lobby.theme }); // versão pública (sem rank/owner)
    });
  }

  const deck = shuffled(allCards);
  const players = connectedPlayers();
  const cardsPerPlayer = Math.floor(deck.length / players.length);

  players.forEach((player, i) => {
    const session = sessions.get(player.sessionId);
    if (!session) return;
    const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    session.hand = hand;
    io.to(session.socketId).emit('hand:update', { hand });
  });

  console.log(`[GAME] Partida iniciada! ${allCards.length} cartas para ${players.length} jogadores.`);
  io.emit('game:started', getLobbyState());
}

// ─── Rotas HTTP ────────────────────────────────────────────────────────────────

app.get('/qr', async (_req, res) => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;
  try {
    const png = await QRCode.toBuffer(url, { width: 300, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (err) {
    res.status(500).send('Erro ao gerar QR Code');
  }
});

// /mesa é rota do React SPA (tratada pelo front-end)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/socket.io') || req.path === '/qr') return;
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ─── WebSocket ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Conectado: ${socket.id}`);

  // ── Mesa / Host (PC ou Unity) ─────────────────────────────────────────────
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
      // Reconexão
      const session = sessions.get(sid);
      session.socketId = socket.id;
      session.connected = true;

      const player = lobby.players.find((p) => p.sessionId === sid);
      if (player) {
        player.connected = true;
        player.name = session.name;
      }

      console.log(`[RECONEXÃO] ${session.name} (${sid})`);
      socket.data.sessionId = sid;
      socket.join('players');

      socket.emit('player:rejoined', {
        sessionId: sid,
        name: session.name,
        hand: session.hand,
        lobbyState: getLobbyState(),
      });
    } else {
      // Novo jogador
      sid = generateId();
      const sanitizedName = String(name || 'Jogador').slice(0, 24).trim() || 'Jogador';

      if (lobby.hostPlayerId === null) {
        lobby.hostPlayerId = sid; // sem host na sala → este jogador vira host
      }

      sessions.set(sid, { name: sanitizedName, socketId: socket.id, hand: [], connected: true });
      lobby.players.push({ sessionId: sid, name: sanitizedName, connected: true });
      console.log(`[JOIN] ${sanitizedName} (${sid})${lobby.hostPlayerId === sid ? ' [HOST]' : ''}`);

      socket.data.sessionId = sid;
      socket.join('players');
      socket.emit('player:joined', { sessionId: sid, name: sanitizedName });
    }

    broadcastLobbyUpdate();
  });

  // ── Host inicia → fase de escolha de tema ─────────────────────────────────
  socket.on('game:start', () => {
    const sid = socket.data.sessionId;
    if (sid !== lobby.hostPlayerId) return;
    if (lobby.status !== 'lobby') return;

    lobby.status = 'theme-input';
    lobby.theme = null;
    lobby.rankings.clear();

    console.log('[GAME] Fase: escolha de tema');
    io.emit('phase:theme-input', getLobbyState());
  });

  // ── Host submete o tema → fase de ranking ─────────────────────────────────
  socket.on('theme:submit', ({ theme }) => {
    const sid = socket.data.sessionId;
    if (sid !== lobby.hostPlayerId) return;
    if (lobby.status !== 'theme-input') return;

    const sanitized = String(theme || '').slice(0, 80).trim();
    if (!sanitized) return;

    lobby.theme = sanitized;
    lobby.status = 'ranking-input';
    lobby.rankings.clear();

    console.log(`[GAME] Tema definido: "${lobby.theme}"`);
    io.emit('phase:ranking-input', getLobbyState());
  });

  // ── Jogador submete seu Top 5 ─────────────────────────────────────────────
  socket.on('ranking:submit', ({ items }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;
    if (lobby.status !== 'ranking-input') return;
    if (lobby.rankings.has(sid)) return; // já submeteu

    if (!Array.isArray(items) || items.length !== 5) return;
    const sanitized = items.map((t) => String(t || '').slice(0, 60).trim());
    if (sanitized.some((t) => t === '')) return; // todos os campos obrigatórios

    lobby.rankings.set(sid, sanitized);
    console.log(`[RANKING] ${sessions.get(sid).name} submeteu Top 5`);

    broadcastLobbyUpdate(); // atualiza rankingsSubmitted para todos

    // Se todos os jogadores conectados submeteram, inicia o jogo
    if (lobby.rankings.size >= connectedPlayers().length) {
      startPlaying();
    }
  });

  // ── Jogador joga uma carta na mesa ────────────────────────────────────────
  socket.on('card:play', ({ cardId }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;

    const session = sessions.get(sid);
    const cardIndex = session.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const [card] = session.hand.splice(cardIndex, 1);
    const meta = cardMeta.get(card.id) || {};
    console.log(`[CARTA] ${session.name} jogou: ${card.text}`);

    io.to('host').emit('card:played', {
      playerId: sid,
      playerName: session.name,
      card,
      // metadados ocultos — visíveis apenas na revelação
      _meta: meta,
    });

    socket.emit('hand:update', { hand: session.hand });
  });

  // ── Mesa transfere o host para outro jogador ──────────────────────────────
  socket.on('host:transfer', ({ sessionId }) => {
    if (socket.id !== lobby.hostSocketId) return; // só a Mesa pode fazer isso
    if (!sessions.has(sessionId)) return;
    lobby.hostPlayerId = sessionId;
    console.log(`[HOST] Host transferido para ${sessions.get(sessionId).name}`);
    broadcastLobbyUpdate();
  });

  // ── Mesa reseta a sala ────────────────────────────────────────────────────
  socket.on('room:reset', () => {
    if (socket.id !== lobby.hostSocketId) return; // só a Mesa pode resetar
    resetRoom();
    console.log('[RESET] Sala resetada pela Mesa');
    io.emit('room:reset');                  // notifica todos os clientes
    socket.emit('lobby:state', getLobbyState()); // devolve estado vazio para a Mesa
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

      // Se estava em ranking-input e todos os restantes já submeteram, avança
      if (lobby.status === 'ranking-input' && lobby.rankings.size >= connectedPlayers().length) {
        startPlaying();
      } else {
        broadcastLobbyUpdate();
      }

      console.log(`[-] ${session.name} desconectado (${reason})`);
    } else if (socket.id === lobby.hostSocketId) {
      lobby.hostSocketId = null;
      console.log(`[-] Mesa desconectada`);
    }
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', async () => {
  const ip = getLocalIP();
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
  } catch (e) {
    console.log(`\nAcesse: ${url}\n`);
  }
});
