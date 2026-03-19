# Top 5 Party

> **"Você acha que conhece as preferências dos seus amigos? Prove."**

Top 5 Party é um **party game multiplayer local** onde cada jogador usa o próprio celular como controle — sem instalar nada. O PC ou Steam Deck vira a tela central do jogo. Basta estar na mesma rede Wi-Fi.

---

## Screenshots

### Mesa (PC / TV)

A tela da Mesa exibe uma **mesa oval de jogo** com os avatares dos jogadores distribuídos ao redor, cartas em leque no centro e placar lateral — projetada para ser lida a distância em uma TV.

| Lobby | Partida em andamento |
|-------|----------------------|
| ![Mesa lobby](docs/screenshots/mesa-lobby.png) | ![Mesa playing](docs/screenshots/mesa-playing.png) |

| Resultado da rodada | Fim de jogo |
|---------------------|-------------|
| ![Mesa round result](docs/screenshots/mesa-round-result.png) | ![Mesa game over](docs/screenshots/mesa-game-over.png) |

### Mão (celular)

Os jogadores usam o celular como controle. Design sem emojis, focado em legibilidade.

| Entrar | Lobby | Escolha de pergunta |
|--------|-------|---------------------|
| ![Join](docs/screenshots/mobile-join.png) | ![Lobby](docs/screenshots/mobile-lobby.png) | ![Theme select](docs/screenshots/mobile-theme-select.png) |

| Montar Top 5 | Mão de cartas | Resultado |
|--------------|---------------|-----------|
| ![Ranking](docs/screenshots/mobile-ranking.png) | ![Hand](docs/screenshots/mobile-hand.png) | ![Result](docs/screenshots/mobile-round-result.png) |

> Screenshots devem ser adicionados em `docs/screenshots/`. Resolução sugerida: 1280x720 para Mesa, 390x844 para Mobile.

---

## O Conceito

A premissa é simples e social: **todo mundo tem opiniões, e ninguém concorda com ninguém.**

Cada jogador escolhe uma pergunta exclusiva e lista seu Top 5 de respostas. As respostas viram cartas num baralho virtual, embaralhadas e redistribuídas — você pode acabar com a carta favorita do seu amigo na mão sem saber.

A mecânica central é de **vazas por turno** (trick-taking): cada jogador joga uma carta na sua vez. Quem jogar a carta de **maior valor** leva a rodada. O valor é determinado pela posição original na lista de quem a criou — `1º lugar = rank 5`, `5º lugar = rank 1`.

O segredo está em ler o que seu amigo colocou como favorito — e jogar (ou blefar) na hora certa.

---

## A Mecânica de Truco

Qualquer jogador pode gritar **TRUCO** a qualquer momento durante a fase de jogo. Isso pausa o turno e força os outros a decidir:

| Decisão | Consequência |
|---------|-------------|
| **Aceitar** | Rodada continua valendo os pontos elevados |
| **Fugir** | Quem pediu leva os pontos do nível atual, rodada encerra sem revelar cartas |
| **Contra-oferta** (Seis / Nove / Doze) | Os papéis se invertem — quem pediu agora precisa aceitar ou fugir |

**Progressão de pontos:** 1 → 3 → 6 → 9 → 12

A tensão está em não saber se a carta do adversário é um 5 ou um 1 — e decidir apostar nisso.

---

## Por que vai funcionar

| Ponto forte | Detalhe |
|-------------|---------|
| **Zero atrito para entrar** | Basta escanear o QR Code. Nenhum app para instalar |
| **Perguntas únicas por jogador** | Cada um escolhe entre 3 perguntas exclusivas — ninguém responde a mesma coisa |
| **Conteúdo gerado pelos próprios jogadores** | As cartas são as opiniões reais de quem está na mesa |
| **Blefe social real** | Truco com identidade cultural — qualquer jogador pode elevar a aposta a qualquer momento |
| **Persistência local** | Respostas e histórico de partidas salvos em PostgreSQL local para análise futura |
| **Funciona sem banco** | Se o PostgreSQL não estiver disponível, o jogo roda normalmente |
| **Steam Deck ready** | Pensado para rodar como host portátil numa mesa de bar ou sala |

---

## Fluxo de uma Partida

```
1. HOST abre /mesa no PC/Steam Deck
   └── QR Code aparece na tela grande

2. JOGADORES escaneiam com o celular (2 a 8 pessoas)
   └── Primeiro a entrar vira o Host da rodada

3. Host clica em "Iniciar Partida"

4. Cada jogador recebe 3 PERGUNTAS EXCLUSIVAS
   Ex: "Top 5 Filmes de Terror" / "Top 5 Destinos de Viagem" / "Top 5 Comidas do Verão"
   └── Cada um escolhe a sua — não são compartilhadas

5. Todos submetem seu Top 5 secretamente
   1º: O Iluminado  |  2º: Hereditário  |  3º: ...

6. Servidor embaralha e distribui as cartas
   └── Carta mostra: Pergunta | Resposta | Respondeu
   └── O RANK (1–5) fica oculto — só você sabe o da sua mão

7. Rodadas de vazas — em turnos
   └── Deslize a carta para cima para jogá-la
   └── A Mesa mostra quem está jogando e as cartas na mesa
   └── Qualquer jogador pode pedir TRUCO antes ou durante o turno

8. Resultado da rodada
   └── Rank revelado para todos
   └── Pontos aplicados (com multiplicador de Truco, se houver)
   └── Próxima rodada começa em 5 segundos

9. Após todas as rodadas → Vencedor anunciado
   └── Partida salva no banco local com todas as respostas e rodadas
```

---

## O que aparece em cada carta

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **PERGUNTA** | A questão que o jogador escolheu | *Top 5 Filmes de Terror* |
| **RESPOSTA** | O item que o jogador colocou na lista | *O Iluminado* |
| **RESPONDEU** | Quem escreveu essa resposta | *Maria* |

O **rank** (1–5) fica oculto durante o jogo e é revelado no resultado da rodada.

---

## Interface — Mão de Cartas (Mobile)

A tela do jogador funciona como uma mão de cartas de board game:

- **Leque**: a carta ativa fica centralizada e em destaque; as vizinhas aparecem nas laterais com escala e rotação reduzidas
- **Swipe horizontal**: navega entre as cartas da mão
- **Swipe para cima**: joga a carta selecionada — ela voa para a mesa com animação
- **Não é seu turno**: todas as cartas ficam transparentes (~38% de opacidade); um overlay indica quem está jogando
- **Botão TRUCO**: fixo na barra inferior, disponível a qualquer momento durante o jogo

---

## Arquitetura Técnica

```
┌──────────────────────────────────────────────────────────────┐
│                        Rede Wi-Fi Local                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Servidor Node.js (:3000)               │     │
│  │         Express + Socket.IO + PostgreSQL            │     │
│  │    Estado do jogo em memória + persistência local   │     │
│  └──────────────┬──────────────────────────┬───────────┘     │
│                 │                          │                  │
│  ┌──────────────▼──────────┐  ┌───────────▼─────────────┐   │
│  │   React App /mesa       │  │   React App / (mobile)  │   │
│  │   Tela da Mesa          │  │   Mão de cartas          │   │
│  │   Cartas + Placar + QR  │  │   Swipe + Truco          │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

| Componente | Tecnologia | Papel |
|---|---|---|
| **Servidor** | Node.js + Socket.IO + Express | Estado do jogo, turnos, pontuação, Truco |
| **Banco local** | PostgreSQL + `pg` | Persistência de respostas e histórico de partidas |
| **Mesa** | React + Vite + Tailwind CSS | Tela grande — cartas, placar, QR, Truco ao vivo |
| **Mão** | React + Vite + Tailwind CSS | Controle individual no celular — carrossel + swipe |

---

## Stack

| Componente | Tecnologia |
|---|---|
| Servidor | Node.js + Express + Socket.IO |
| Banco local | PostgreSQL via `pg` |
| Frontend | React 18 + Vite + Tailwind CSS |
| Config | `dotenv` |

---

## Estado do Protótipo

- [x] Servidor WebSocket local com QR Code automático
- [x] Lobby com reconexão automática (sessionId persistido no sessionStorage)
- [x] Host automático — primeiro jogador a entrar; re-designado em desconexão
- [x] Cada jogador recebe 3 perguntas exclusivas — seleção individual
- [x] Submissão de Top 5 por jogador para sua pergunta escolhida
- [x] Cartas com 3 campos: Pergunta | Resposta | Respondeu (formato JSON encapsulado)
- [x] Distribuição aleatória de cartas entre os jogadores
- [x] Turnos controlados pelo servidor — só quem está no turno joga
- [x] **Mecânica de Truco completa** — progressão 1/3/6/9/12, aceitar/fugir/contra-oferta, fuga sem revelar cartas
- [x] Pontuação por rodada com multiplicador de Truco aplicado ao vencedor
- [x] **Revelação sequencial de cartas**: cartas caem face-down, reveladas uma a uma com flip animation; vencedor pulsa dourado; +N flutua no placar
- [x] Resultado de rodada: rank revelado, pontos exibidos, placar atualizado
- [x] Game Over com pódio final
- [x] **Interface mobile Sunderfolk-style** — carrossel em leque, swipe-up para jogar, transparência quando aguardando
- [x] **Mesa com layout oval** — avatares ao redor, cartas em leque (160×222 px), sidebar de placar, reveal sequencial
- [x] Mesa React com QR code, indicador de turno, banners de Truco ao vivo, placar
- [x] Design premium sem emojis — hierarquia tipográfica com acentos CSS
- [x] **Camada de banco PostgreSQL local** — schema auto-criado, graceful degradation sem banco
- [x] **Repository pattern** — toda query SQL isolada em `server/repository.js`
- [x] Partida completa salva ao fim (jogadores, respostas, rodadas, cartas jogadas)
- [ ] Win condition configurável (ex: primeiro a X pontos)
- [ ] Timer de turno para evitar AFK
- [ ] Identidade visual por jogador (cor única por sessão)
- [ ] Mecânica de dedução — apostar na identidade do dono da carta
- [ ] Integração Unity como Mesa visual
- [ ] Busca de imagens por carta + cache local + shaders

---

## Setup Rápido

### Pré-requisitos

- Node.js v18+
- *(Opcional)* PostgreSQL rodando localmente

### Modo produção (recomendado para jogar)

```bash
# 1. Instalar dependências (só na primeira vez)
npm run install:all

# 2. Configurar banco (opcional — pule se não quiser persistência)
cp server/.env.example server/.env
# edite server/.env com sua senha do PostgreSQL
# no psql: CREATE DATABASE top5party;

# 3. Compilar e iniciar
npm start
```

| URL | Quem acessa |
|-----|-------------|
| `http://IP:3000/mesa` | PC / TV — tela da Mesa |
| `http://IP:3000` | Celular — escaneie o QR Code |

> Sempre que alterar código do cliente, rode `npm run build:client` antes de reiniciar o servidor.

### Modo desenvolvimento

```bash
# Terminal 1 — servidor Node.js (porta 3000)
npm run dev:server

# Terminal 2 — Vite com hot reload (porta 5173)
npm run dev:client
```

| URL | Quem acessa |
|-----|-------------|
| `http://localhost:5173/mesa` | Mesa (dev) |
| `http://localhost:5173` | Celular / player (dev) |

> Em dev, o Vite faz proxy de `/socket.io` e `/qr` para o servidor na porta 3000.

### Liberar porta travada

```bash
netstat -ano | findstr :3000   # anota o PID
taskkill /PID <PID> /F

# Ou mata todos os processos Node.js:
taskkill /IM node.exe /F
```

> Todos os dispositivos precisam estar na **mesma rede Wi-Fi**.

---

## Regras de Pontuação

| Situação | Pontos |
|----------|--------|
| Carta com maior rank na rodada (normal) | +1 |
| Truco aceito — vencedor da rodada | +3 |
| Seis aceito — vencedor da rodada | +6 |
| Nove aceito — vencedor da rodada | +9 |
| Doze aceito — vencedor da rodada | +12 |
| Fuga do Truco | Quem pediu leva o valor atual (antes da oferta) |
| Empate (mesmo rank) | Ninguém pontua |

**Rank das cartas:** posição na lista original do criador.
`1º lugar = rank 5` (favorito) · `5º lugar = rank 1` (menos favorito)

---

## Schema do Banco Local

| Tabela | O que guarda |
|--------|-------------|
| `players` | Jogadores únicos (upsert por session_id) |
| `games` | Cada partida — quem jogou, quando, quem venceu |
| `game_players` | Score final de cada jogador por partida |
| `answers` | Cada resposta do Top 5 (tema + texto + rank 1-5) |
| `rounds` | Cada rodada — vencedor, multiplicador, fuga de Truco |
| `round_cards` | Qual resposta foi jogada em qual rodada por quem |

**Migração para nuvem:** troque apenas as variáveis `DB_*` no `.env` — o código não muda.

---

## Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| Latência ação → tela | < 100ms (percepção instantânea) |
| Jogadores simultâneos | 2 a 8 |
| Orientação mobile | Portrait (retrato) |
| Plataformas host | Windows x64 e Linux (Steam Deck) |
| Banco | PostgreSQL local; graceful degradation sem banco |
| Formato das cartas | JSON encapsulado — pronto para persistência e cache |
