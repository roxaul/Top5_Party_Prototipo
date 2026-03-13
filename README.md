# 🎮 Top 5 Party

Party game multiplayer local onde o PC funciona como a tela principal (**Mesa**) e os smartphones dos jogadores funcionam como controles individuais (**Mão**).

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Iniciar](#como-iniciar)
- [Como Jogar (Fluxo Atual)](#como-jogar-fluxo-atual)
- [Eventos WebSocket](#eventos-websocket)
- [Próximos Passos](#próximos-passos)

---

## Visão Geral

O jogo é baseado em uma dinâmica social de adivinhação de preferências — **"Top 5"**. Cada jogador submete listas de preferências sobre um tema (ex: *"Top 5 Filmes de Terror"*), as respostas são embaralhadas em cartas e distribuídas entre os jogadores. Ninguém sabe de quem é a carta que tem na mão.

A mecânica de pontuação é baseada em vazas: quem jogar a carta de **maior valor** (posição no ranking original do dono) vence a rodada.

---

## Arquitetura

O sistema opera em uma **Tríade Local** — tudo roda na mesma rede Wi-Fi, sem necessidade de internet para o gameplay:

```
┌─────────────────────────────────────────────────────────┐
│                      Rede Wi-Fi Local                    │
│                                                          │
│   ┌──────────────┐        ┌─────────────────────────┐   │
│   │  Unity (PC)  │◄──────►│   Servidor Node.js      │   │
│   │    Mesa      │        │   Express + Socket.io   │   │
│   │  (Host)      │        │   Porta 3000            │   │
│   └──────────────┘        └────────────┬────────────┘   │
│                                        │                  │
│                           ┌────────────▼────────────┐   │
│                           │   React App (Mão)        │   │
│                           │   Servido pelo Node.js   │   │
│                           │   Acessado no celular    │   │
│                           └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

| Componente | Tecnologia | Papel |
|---|---|---|
| **Host / Mesa** | Unity (futuro) / HTML (atual) | Tela principal, gráficos, estado do jogo |
| **Servidor** | Node.js + Socket.io + Express | Ponte WebSocket, serve o app mobile |
| **Mão (Controle)** | React + Vite + TailwindCSS | Interface do jogador no celular |

---

## Estrutura do Projeto

```
top5party/
│
├── package.json              # Scripts raiz (install:all, start, build)
├── .gitignore
│
├── server/                   # Servidor Node.js
│   ├── package.json
│   ├── index.js              # Servidor principal (HTTP + WebSocket)
│   └── mesa.html             # Tela da Mesa para testes (sem Unity)
│
└── client/                   # App mobile (React)
    ├── package.json
    ├── vite.config.js        # Proxy para o servidor em desenvolvimento
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx          # Ponto de entrada React
        ├── App.jsx           # Gerenciamento de telas + lógica de reconexão
        ├── socket.js         # Instância do Socket.io-client
        ├── index.css         # Estilos globais (Tailwind)
        └── pages/
            ├── JoinPage.jsx  # Tela de entrada (digitar nome)
            ├── LobbyPage.jsx # Sala de espera (ver jogadores conectados)
            └── HandPage.jsx  # Mão do jogador (ver e jogar cartas)
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Todos os dispositivos (PC + celulares) na **mesma rede Wi-Fi**
- Navegador moderno nos celulares (Chrome, Safari, Firefox)

---

## Instalação

Na raiz do projeto, instale as dependências do servidor e do cliente de uma vez:

```bash
npm run install:all
```

Ou manualmente:

```bash
# Servidor
cd server
npm install

# Cliente
cd ../client
npm install
```

---

## Como Iniciar

### Modo Desenvolvimento (recomendado para testes)

Abra **dois terminais**:

**Terminal 1 — Servidor:**
```bash
cd server
node index.js
```

O terminal exibirá o IP da máquina e um **QR Code**:

```
╔══════════════════════════════════════╗
║        🎮  Top 5 Party  🎮            ║
╠══════════════════════════════════════╣
║  Local:   http://localhost:3000       ║
║  Rede:    http://192.168.1.10:3000   ║
║  Mesa:    http://192.168.1.10:3000/mesa║
║  QR Code: http://192.168.1.10:3000/qr ║
╚══════════════════════════════════════╝
```

**Terminal 2 — Cliente React (hot reload):**
```bash
cd client
npm run dev
```

### Modo Produção

Gera o build do cliente e sobe apenas o servidor (que já serve os arquivos):

```bash
npm start
```

---

## Como Acessar Cada Parte

| Quem | URL | Descrição |
|---|---|---|
| **Mesa (PC)** | `http://localhost:3000/mesa` | Tela principal — vê jogadores e cartas jogadas |
| **Jogador (celular)** | `http://192.168.x.x:3000` | Escaneia o QR Code ou digita o IP |
| **QR Code** | `http://192.168.x.x:3000/qr` | Imagem PNG do QR Code para exibir na Mesa |

> O IP exato é exibido no terminal ao iniciar o servidor.

---

## Como Jogar (Fluxo Atual)

```
1. Host abre a Mesa no PC (localhost:3000/mesa)

2. Jogadores escaneiam o QR Code com o celular
   └── Digitam seu apelido → entram no Lobby

3. Mesa exibe os jogadores conectados em tempo real
   └── Indicador verde/vermelho mostra quem está online

4. [Futuro] Host inicia a partida via Unity
   └── Cartas são distribuídas para a Mão de cada jogador

5. Jogador vê as cartas na Mão
   └── Arrasta a carta para cima  →  carta vai para a Mesa
   └── Ou clica na carta          →  mesmo efeito

6. Mesa exibe as cartas jogadas com o nome de quem jogou
```

### Reconexão Automática

Se o celular bloquear, o app fechar ou a conexão cair, ao reabrir o navegador o jogador é **reconectado automaticamente à mesma sessão** — sem perder as cartas na mão. O `sessionId` fica salvo no `localStorage` do navegador.

---

## Eventos WebSocket

A comunicação entre servidor, Mesa e celulares usa Socket.io. Abaixo os eventos implementados:

### Cliente → Servidor

| Evento | Payload | Descrição |
|---|---|---|
| `host:join` | — | Mesa (Unity/Web) se registra como host |
| `player:join` | `{ name, sessionId }` | Jogador entra (sessionId null = novo jogador) |
| `card:play` | `{ cardId }` | Jogador joga uma carta da mão |

### Servidor → Cliente

| Evento | Payload | Descrição |
|---|---|---|
| `player:joined` | `{ sessionId, name }` | Confirmação de entrada (novo jogador) |
| `player:rejoined` | `{ sessionId, name, hand }` | Confirmação de reconexão + estado da mão |
| `lobby:state` | `{ players, status }` | Estado inicial enviado ao host |
| `lobby:update` | `{ players, status }` | Atualização broadcast ao conectar/desconectar |
| `hand:update` | `{ hand }` | Atualiza as cartas na mão do jogador |
| `card:played` | `{ playerId, playerName, card }` | Notifica a Mesa que uma carta foi jogada |

---

## Próximos Passos

- [ ] **RF.05/06** — Telas de input de tema e ranking no celular
- [ ] **RF.07/08** — Lógica de embaralhamento e distribuição de cartas
- [ ] **RF.10/11** — Integração com Google Custom Search API + cache de imagens
- [ ] **RF.12** — Shaders de estilização no Unity (Pintura a Óleo / Pixel Art)
- [ ] **Integração Unity** — Conectar a engine como host via `SocketIOUnity` (C#)
- [ ] **Pontuação** — Implementar mecânica de vazas e apostas
- [ ] **Firewall** — Script de instalação com exceção automática no Windows
