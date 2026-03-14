# 🖥️ Top 5 Party — Servidor

O servidor é a **espinha dorsal** do Top 5 Party. Ele não é apenas um relay de mensagens — ele é quem conhece o estado completo do jogo, gerencia as sessões, monta o baralho e decide quando avançar de fase. Os clientes (Mesa e celulares) são apenas *views* do que o servidor sabe.

---

## Responsabilidades

```
┌──────────────────────────────────────────────────────┐
│                   Node.js Server                      │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Express   │  │  Socket.IO   │  │  Game State │  │
│  │  HTTP/Static│  │  WebSocket   │  │  In-Memory  │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
│         │                │                 │          │
│   Serve React      Mensagens em       sessions Map    │
│   app + QR PNG     tempo real         lobby object    │
│                                       cardMeta Map    │
└──────────────────────────────────────────────────────┘
```

---

## Conceitos Fundamentais

### Estado em memória

Não há banco de dados. Todo o estado do jogo vive em duas estruturas:

**`sessions`** — `Map<sessionId, Session>`: tudo que o servidor sabe sobre um jogador específico. Inclui dados que **nunca são enviados ao cliente** (como o socketId atual e a mão completa do jogador).

```js
sessions.get(sid) // =>
{
  name: 'João',
  socketId: 'abc123',  // socket atual (muda na reconexão)
  hand: [{ id, text, theme }],
  connected: true
}
```

**`lobby`** — objeto singleton com o estado global visível da partida:

```js
{
  players: [],        // lista pública dos jogadores
  hostSocketId: null, // socket da Mesa/Unity
  hostPlayerId: null, // sessionId do primeiro jogador mobile
  status: 'lobby',    // fase atual
  theme: null,        // tema da rodada
  rankings: Map(),    // sessionId → string[5]
}
```

**`cardMeta`** — `Map<cardId, CardMeta>`: os **metadados ocultos** de cada carta (dono e posição no ranking). Nunca enviados ao celular durante o jogo — só revelados na fase de revelação pela Mesa.

```js
cardMeta.get(cardId) // =>
{
  owner: 'sessionId_do_criador',
  rank: 5,            // 5 = favorito, 1 = menos favorito
  text: 'Bruno Mars',
  theme: 'Top 5 Músicas para Churrasco'
}
```

---

### Separação público × privado

Essa é uma decisão de design central. O servidor mantém dois tipos de dados:

| Tipo | Onde fica | Enviado a quem |
|------|-----------|----------------|
| Nome, status de conexão, isHost | `lobby.players` | Todos (broadcast) |
| SocketId, mão completa | `sessions` | Nunca enviado diretamente |
| Owner e rank da carta | `cardMeta` | Apenas na revelação, apenas à Mesa |
| Cartas na mão (sem metadata) | `session.hand` | Apenas ao próprio jogador |

---

### Sessões e Reconexão

Cada jogador recebe um `sessionId` gerado no primeiro acesso, que é salvo no `localStorage` do navegador. Se a conexão cair:

1. O cliente reabre o navegador → envia `player:join` com o `sessionId` salvo
2. O servidor encontra a sessão existente no Map → atualiza o `socketId` para o socket novo
3. Reenvia a mão atual via `player:rejoined` incluindo o `lobbyState` (fase atual)
4. O cliente reposiciona o jogador na tela correta sem nenhuma ação manual

> O `socketId` muda a cada conexão WebSocket. O `sessionId` é o identificador estável do jogador.

---

### Máquina de estados (fases do jogo)

O campo `lobby.status` controla a fase atual. Transições só ocorrem sob condições específicas:

```
   lobby
     │
     │ game:start (apenas hostPlayerId)
     ▼
 theme-input
     │
     │ theme:submit (apenas hostPlayerId)
     ▼
ranking-input ──► (todos enviaram ranking) ──► startPlaying()
                                                      │
                                                      ▼
                                                   playing
```

Eventos emitidos em cada transição são broadcast para todos os conectados, permitindo que cada cliente redirecione para a tela correta.

**Reatribuição automática de host:** ao desconectar, se o jogador era o host, `reassignHostIfNeeded()` passa o host para o próximo jogador conectado (em ordem de entrada). Reconexão **não** devolve o host — quem assumiu continua com ele. A Mesa também pode transferir o host manualmente via `host:transfer`.

---

### Montagem do Baralho

Quando todos os jogadores submetem seu `ranking:submit`, a função `startPlaying()` executa:

1. **Converte rankings em cartas** — para cada jogador, seus 5 itens viram 5 cartas. O índice na lista determina o valor: `rank = 5 - índice` (índice 0 = favorito = rank 5)

2. **Registra metadados ocultos** no `cardMeta` Map — `owner` e `rank` ficam no servidor

3. **Embaralha** o deck com Fisher-Yates shuffle

4. **Distribui igualmente** — `floor(totalCartas / nJogadores)` cartas por jogador. Com N jogadores cada um enviando 5 itens, o total é sempre `N × 5`, divisível por N → cada jogador sempre recebe exatamente 5 cartas

5. Envia via `hand:update` **apenas a versão pública** da carta (sem `owner`/`rank`) para cada jogador

---

### QR Code

A rota `/qr` detecta o IP local da máquina usando `os.networkInterfaces()`, filtrando apenas interfaces IPv4 não-loopback. Gera um PNG com a biblioteca `qrcode` apontando para `http://IP:3000`. A Mesa exibe esse PNG diretamente com `<img src="/qr">`.

---

## Estrutura do Arquivo

```
index.js
│
├── Utilitários           getLocalIP(), generateId(), shuffled()
├── Estado do jogo        sessions, cardMeta, lobby
├── getLobbyState()       snapshot público do estado (sem dados privados)
├── broadcastLobbyUpdate() helper para broadcast do lobby
├── startPlaying()        montagem e distribuição do baralho
├── Rotas HTTP            /qr, static SPA
└── WebSocket handlers
    ├── host:join
    ├── player:join        (inclui lógica de reconexão)
    ├── game:start
    ├── theme:submit
    ├── ranking:submit     (dispara startPlaying quando todos enviaram)
    ├── card:play
    ├── host:transfer      (Mesa transfere o host para outro jogador)
    ├── room:reset         (Mesa expulsa todos e reseta o estado)
    └── disconnect         (reatribui host automaticamente se o host saiu)
```

---

## Dependências

| Pacote | Uso |
|--------|-----|
| `express` | Servidor HTTP, rota `/qr`, servir o React build |
| `socket.io` | WebSocket bidirecional com suporte a rooms e reconexão |
| `qrcode` | Geração do QR Code como PNG e como ASCII no terminal |

---

## Comandos

```bash
# Desenvolvimento (hot reload via nodemon ou node --watch)
npm run dev:server          # porta 3000

# Produção (requer build do cliente antes)
cd client && npm run build && cd ..
npm start                   # porta 3000, serve client/dist/

# Parar o servidor
# Ctrl+C no terminal, ou se a porta estiver travada:
netstat -ano | findstr :3000    # anota o PID
taskkill /PID <PID> /F          # mata pelo PID
taskkill /IM node.exe /F        # ou mata todos os processos Node
```

---

## Escalabilidade e Limitações

Este servidor é intencionalmente **simples e local**:

- **Sem persistência** — reiniciar o servidor apaga tudo
- **Uma partida por vez** — não há suporte a múltiplas salas simultâneas
- **Sem autenticação** — qualquer pessoa na rede pode entrar
- **Limite de 3–8 jogadores** — validação de UI apenas (sem hard limit no servidor ainda)

Essas limitações são intencionais para um party game local. O objetivo é **zero configuração**, não escala de produção.
