# 📱 Top 5 Party — Cliente React

O cliente é a interface que os jogadores usam no celular e que o PC exibe como Mesa. É uma **Single Page Application** servida pelo próprio servidor Node.js — nenhum app precisa ser instalado. Basta abrir o navegador.

---

## Os dois modos em uma build só

O mesmo bundle React serve dois propósitos completamente diferentes, detectados por URL:

```js
// main.jsx
const Root = window.location.pathname === '/mesa' ? MesaPage : App;
ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
```

A detecção acontece **fora do React**, em `main.jsx`, evitando a violação das Rules of Hooks que ocorreria com um `return` condicional antes de `useState` no `App.jsx`.

| URL | Modo | Quem usa |
|-----|------|----------|
| `http://IP:3000` | **Mão** (controle mobile) | Celular de cada jogador |
| `http://IP:3000/mesa` | **Mesa** (tela principal) | PC / TV / Steam Deck |

Não há React Router — a detecção acontece uma única vez na renderização inicial. Isso mantém o bundle pequeno e elimina dependências desnecessárias para um caso de uso tão simples.

---

## Socket como Singleton

```js
// socket.js
const socket = io({ autoConnect: false, reconnection: true, ... });
export default socket;
```

Toda a aplicação compartilha **uma única instância** do Socket.IO client. Isso evita múltiplas conexões acidentais e garante que `App.jsx` e `MesaPage.jsx` usem o mesmo socket — o modo de uso (host ou jogador) é definido pelo evento que cada um emite ao conectar (`host:join` vs `player:join`).

`autoConnect: false` é proposital: a conexão só abre quando `socket.connect()` é chamado explicitamente no `useEffect`, evitando conexões durante SSR ou renderizações parciais.

---

## Fluxo de Telas (Modo Jogador)

As telas são controladas por um estado `screen` em `App.jsx`. Não há URL routing — as transições são disparadas por eventos do servidor:

```
'join'
  │  player:join emitido pelo usuário
  │  ◄── player:joined / player:rejoined (servidor)
  ▼
'lobby'
  │  ◄── phase:theme-input (servidor)
  ▼
'theme'
  │  theme:submit emitido pelo host
  │  ◄── phase:ranking-input (servidor)
  ▼
'ranking'
  │  ranking:submit emitido pelo jogador
  │  ◄── hand:update com cartas (servidor, via startPlaying)
  ▼
'hand'
```

A reconexão é tratada em `player:rejoined`: o servidor devolve `lobbyState.status` e o cliente escolhe a tela correta diretamente, sem passar pelo fluxo normal.

---

## Páginas — Responsabilidades

### `JoinPage`
Entrada no jogo. Apenas um input de nome e um botão. Desabilitado enquanto o socket não está conectado (feedback visual para o usuário).

### `LobbyPage`
Sala de espera com lista de jogadores em tempo real. O jogador com `isHost: true` vê o botão **"Iniciar Partida"** (requer mínimo 2 jogadores) — os outros veem os dots animados de "aguardando". Todos os jogadores, independente de ser host ou não, veem o card **"Como funciona"** com o fluxo da partida em 4 passos — elimina o tempo morto enquanto aguardam e alinha as expectativas antes do início.

### `ThemePage`
Dividida em dois estados dentro do mesmo componente:
- **Host** → input de texto + grade 2×4 de sugestões com emoji e toque fácil (`py-3 px-4`)
- **Não-host** → tela com o nome do host em destaque e um card "A seguir" com os próximos passos da partida, mantendo o jogador engajado enquanto espera

Não faz sentido criar dois componentes separados para o mesmo momento do jogo.

### `RankingPage`
Formulário com 5 campos de texto + botões ▲▼ para reordenar. Cada linha é visualmente distinta:
- Borda e fundo **color-coded por posição** — dourado (1º), prateado (2º), bronze (3º) — com destaque que aparece ao preencher o campo
- **Barra de progresso de preenchimento** (0→5) na parte superior, dando feedback instantâneo
- Botão de envio muda de label: `"Preencha todos os 5 campos"` → `"🚀 Enviar Top 5"` ao completar

Após submeter, troca para estado de aguardo com barra de progresso maior e lista de jogadores com ícone de status. O estado `submitted` é local — o servidor não precisa saber que o jogador viu a confirmação.

### `HandPage`
A mão do jogador. A ação principal é o botão **"Jogar"** explícito em cada carta — sem depender de gestos ocultos. O swipe up (delta > 60px) é mantido como atalho para usuários avançados, mas não é anunciado. Não há mais zona de drag/drop — esse padrão é confuso em telas touch.

Cada carta tem uma **faixa lateral colorida** (estilo baralho físico) que vira verde ao jogar. O feedback visual é imediato: a carta exibe um círculo ✓ antes de ser removida pelo servidor via `hand:update`.

### `MesaPage`
Modo PC/TV. Emite `host:join` ao conectar e ouve eventos de lobby e `card:played`. Exibe:
- **Badge de fase** color-coded: amarelo (escolhendo tema), azul (montando Top 5), roxo (jogando)
- **Banner do tema** entre o header e o conteúdo — aparece assim que um tema é definido e persiste em todas as fases seguintes
- **Contador de rankings** no banner durante a fase `ranking-input` (`X/Y enviaram`)
- **Indicador ✓** na lista de jogadores para quem já submeteu o Top 5
- QR Code via `<img src="/qr">`, lista de jogadores e cartas jogadas com animação de entrada

---

## Gerenciamento de Estado

Não há Redux, Zustand ou Context API. Todo o estado vive em `useState` no `App.jsx` e é passado via props. Isso é suficiente para a escala deste jogo — a árvore de componentes é rasa e os dados fluem em uma direção só.

```
App.jsx
├── screen, player, lobbyState, hand, connected  ← estado central
│
├── JoinPage(onJoin)
├── LobbyPage(player, lobbyState, isHost, onStartGame)
├── ThemePage(isHost, lobbyState, onSubmitTheme)
├── RankingPage(theme, lobbyState, mySessionId, onSubmitRanking)
├── HandPage(hand, player, onPlayCard)
└── MesaPage()  ← estado próprio, socket independente
```

`isHost` é derivado: `player?.sessionId === lobbyState.hostPlayerId` — não é armazenado, apenas calculado no render.

---

## Responsividade e Mobile

O app é otimizado para **portrait (retrato)** em celulares, do iPhone SE (375px) até modelos Plus/Max (430px+), e se adapta a tablets e desktops.

| Problema | Solução |
|----------|---------|
| iOS Safari 100vh bug | `min-height: 100svh` em todas as páginas — nunca esconde conteúdo atrás da barra do browser |
| iPhone notch / barra home | `env(safe-area-inset-bottom)` via utilitários `.pb-4-safe`, `.pb-8-safe` no Tailwind plugin |
| iOS auto-zoom em inputs | Todos os inputs usam `text-base` (16px mínimo) — abaixo disso o Safari dá zoom automático |
| Pull-to-refresh acidental no Android | `overscroll-behavior-y: none` no body |
| `user-scalable=no` (WCAG violation) | Removido; substituído por `viewport-fit=cover` para suporte ao notch |
| Touch targets pequenos | Botões de ação com mínimo `py-3` / `w-8 h-8` (≥ 44pt recomendado pela Apple HIG) |

A `MesaPage` usa `flex-col md:flex-row` — empilhado em portrait/tablet, lado a lado em landscape/desktop.

---

## Tailwind — Paleta do Jogo

Cores customizadas definidas em `tailwind.config.js`:

| Token | Hex | Uso |
|-------|-----|-----|
| `party-bg` | `#0f0f1a` | Fundo principal (quase preto azulado) |
| `party-surface` | `#1a1a2e` | Cards, painéis, inputs |
| `party-border` | `#2d2d44` | Bordas sutis |
| `party-purple` | `#6c63ff` | Cor de ação (botões, bordas de destaque) |
| `party-violet` | `#a78bfa` | Labels, badges, texto secundário |

---

## Dev × Produção

| Ambiente | Comando | Porta | Observação |
|----------|---------|-------|------------|
| **Desenvolvimento** | `npm run dev:client` (+ `npm run dev:server`) | 5173 (client) / 3000 (server) | Hot reload ativo. Proxy em `vite.config.js` redireciona `/socket.io` (WS) e `/qr` para `localhost:3000`. |
| **Produção** | `cd client && npm run build` → `npm start` | 3000 | Vite gera `client/dist/`. Express serve esse diretório. Tudo na mesma porta. |

### URLs corretas por ambiente

| O que acessar | Dev | Produção |
|---------------|-----|----------|
| Mesa (PC / TV) | `http://localhost:5173/mesa` | `http://IP:3000/mesa` |
| Jogador (celular) | `http://IP:5173` | `http://IP:3000` |

> ⚠️ A Mesa **deve** ser acessada com `/mesa` no caminho. Sem ele, o React renderiza a interface do jogador.

> ⚠️ Após qualquer mudança no código do cliente em produção, rode `npm run build` novamente. O servidor Express serve os arquivos de `client/dist/` — sem rebuild, o browser carrega a versão anterior.

A config do proxy está em `vite.config.js`. Em produção o proxy não existe — o cliente conecta diretamente ao mesmo host que serviu o HTML.

---

## Dependências

| Pacote | Uso |
|--------|-----|
| `react` + `react-dom` | UI declarativa com hooks |
| `socket.io-client` | Conexão WebSocket com o servidor |
| `vite` + `@vitejs/plugin-react` | Build e dev server com HMR |
| `tailwindcss` + `autoprefixer` + `postcss` | Estilização utilitária |
