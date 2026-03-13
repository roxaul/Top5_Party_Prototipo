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

// ─── Estado do Jogo ────────────────────────────────────────────────────────────
//
// sessions: Map<sessionId, { name, socketId, hand: Card[], connected: boolean }>
// lobby.players: Array<{ sessionId, name, connected }>

const sessions = new Map();

const lobby = {
  players: [],      // lista pública (sem dados internos das sessões)
  hostSocketId: null,
  status: 'lobby',  // 'lobby' | 'playing' | 'revealing'
};

function getLobbyState() {
  return {
    players: lobby.players.map(({ sessionId, name, connected }) => ({
      sessionId,
      name,
      connected,
    })),
    status: lobby.status,
    playerCount: lobby.players.length,
  };
}

function broadcastLobbyUpdate() {
  io.emit('lobby:update', getLobbyState());
}

// ─── Rotas HTTP ────────────────────────────────────────────────────────────────

// QR Code como imagem PNG
app.get('/qr', async (req, res) => {
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

// Mesa (tela do PC / Unity substituto para testes)
app.get('/mesa', (req, res) => {
  res.sendFile(path.join(__dirname, 'mesa.html'));
});

// Serve o React app (build de produção)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  // Não redirecionar rotas conhecidas do servidor
  if (req.path.startsWith('/socket.io') || req.path === '/qr' || req.path === '/mesa') return;
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ─── WebSocket ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Conectado: ${socket.id}`);

  // ── Host (Unity ou Mesa web) ──────────────────────────────────────────────
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
      // Reconexão: restaura sessão existente
      const session = sessions.get(sid);
      const oldSocketId = session.socketId;
      session.socketId = socket.id;
      session.connected = true;

      const player = lobby.players.find((p) => p.sessionId === sid);
      if (player) {
        player.connected = true;
        player.name = session.name; // preserva nome original
      }

      console.log(`[RECONEXÃO] ${session.name} (${sid})`);

      socket.data.sessionId = sid;
      socket.join('players');

      // Envia o estado atual da mão do jogador
      socket.emit('player:rejoined', {
        sessionId: sid,
        name: session.name,
        hand: session.hand,
      });
    } else {
      // Novo jogador
      sid = generateId();
      const sanitizedName = String(name || 'Jogador').slice(0, 24).trim() || 'Jogador';

      sessions.set(sid, {
        name: sanitizedName,
        socketId: socket.id,
        hand: [],
        connected: true,
      });

      lobby.players.push({ sessionId: sid, name: sanitizedName, connected: true });
      console.log(`[JOIN] ${sanitizedName} (${sid})`);

      socket.data.sessionId = sid;
      socket.join('players');

      socket.emit('player:joined', { sessionId: sid, name: sanitizedName });
    }

    broadcastLobbyUpdate();
  });

  // ── Jogador joga uma carta na mesa ────────────────────────────────────────
  socket.on('card:play', ({ cardId }) => {
    const sid = socket.data.sessionId;
    if (!sid || !sessions.has(sid)) return;

    const session = sessions.get(sid);
    const cardIndex = session.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const [card] = session.hand.splice(cardIndex, 1);
    console.log(`[CARTA] ${session.name} jogou: ${card.text}`);

    // Envia carta para a Mesa (host)
    io.to('host').emit('card:played', {
      playerId: sid,
      playerName: session.name,
      card,
    });

    // Confirma remoção da mão
    socket.emit('hand:update', { hand: session.hand });
  });

  // ── Desconexão ────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    const sid = socket.data.sessionId;

    if (sid && sessions.has(sid)) {
      const session = sessions.get(sid);
      session.connected = false;

      const player = lobby.players.find((p) => p.sessionId === sid);
      if (player) player.connected = false;

      broadcastLobbyUpdate();
      console.log(`[-] ${session.name} desconectado (${reason})`);
    } else if (socket.id === lobby.hostSocketId) {
      lobby.hostSocketId = null;
      console.log(`[-] Host desconectado`);
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

  // Imprime QR Code no terminal
  try {
    const qr = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log('\nEscaneie para conectar:\n');
    console.log(qr);
  } catch (e) {
    console.log(`\nAcesse: ${url}\n`);
  }
});
