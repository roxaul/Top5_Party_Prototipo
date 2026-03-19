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

A mecânica central é de **vazas por turno** (trick-taking): cada jogador joga uma carta na sua vez. Quem jogar a carta de **maior valor** leva a rodada. O valor de uma carta é determinado pela posição original na lista de quem a criou — um **1º lugar vale rank 5**, um **5º lugar vale rank 1**.

O segredo está em saber o que seu amigo colocou como favorito — e jogar na hora certa.

### O Twist: Truco

A qualquer momento durante o jogo, um jogador pode apertar o botão de **Truco** no celular. O jogo pausa. Os outros jogadores recebem um pop-up: **Aceitar** ou **Fugir**.

- Se **fugirem**: quem pediu leva os pontos da rodada na hora — sem revelar as cartas.
- Se **aceitarem**: a rodada passa a valer o dobro. Quem tiver coragem pode pedir **Seis** e dobrar de novo.

| Situação | Pontos em jogo |
|----------|----------------|
| Normal | 1 |
| Truco aceito | 2 |
| Seis aceito | 4 |

### A Aposta *(planejado)*

Antes de jogar uma carta, o jogador pode **apostar na identidade do dono**. Acertou? Bônus de pontos. Errou? Penalidade. Isso transforma cada jogada num momento de tensão social: *"Isso aqui parece coisa do João... ou será da Mari?"*

---

## Por que vai funcionar

| Ponto forte | Detalhe |
|-------------|---------|
| **Zero atrito para entrar** | Basta escanear o QR Code. Nenhum app para instalar |
| **Perguntas únicas por jogador** | Cada um escolhe entre 3 perguntas exclusivas — ninguém responde a mesma coisa |
| **Conteúdo gerado pelos próprios jogadores** | As cartas são as opiniões reais de quem está na mesa |
| **Imagens geradas automaticamente** *(planejado)* | Cada carta busca uma imagem real e aplica shader artístico — visual único em cada partida |
| **Funciona offline** | Após o download das imagens, o jogo roda sem internet |
| **Steam Deck ready** | Pensado para rodar como host portátil numa mesa de bar ou sala |

---

## Fluxo de uma Partida

```
┌─────────────────────────────────────────────────────────────┐
│  1. HOST abre o jogo no PC/Steam Deck em /mesa               │
│     └── QR Code aparece na tela grande                       │
│                                                              │
│  2. JOGADORES escaneiam com o celular (2 a 8 pessoas)        │
│     └── Primeiro a entrar vira o HOST da rodada              │
│                                                              │
│  3. HOST clica em "Iniciar Partida"                          │
│                                                              │
│  4. Cada jogador recebe 3 PERGUNTAS EXCLUSIVAS suas          │
│     Ex: Jogador A vê: "Top 5 Filmes de Terror" /             │
│                       "Top 5 Destinos de Viagem" /           │
│                       "Top 5 Comidas do Verão"               │
│     └── Cada um escolhe a pergunta que mais curtir           │
│     └── As perguntas NÃO são compartilhadas entre jogadores  │
│                                                              │
│  5. TODOS submetem seu Top 5 secretamente                    │
│     1º: O Iluminado  2º: Hereditário  3º: ...                │
│                                                              │
│  6. Servidor embaralha tudo e distribui as cartas            │
│     └── Cada carta mostra: Pergunta | Resposta | Respondeu   │
│     └── O VALOR (rank 1-5) fica oculto na mão                │
│                                                              │
│  7. Rodada de VAZAS começa — turnos em ordem                 │
│     └── A Mesa indica de quem é a vez                        │
│     └── Só quem está no turno pode jogar                     │
│     └── Qualquer jogador pode pedir TRUCO a qualquer momento │
│          ├── Aceito: rodada vale o dobro                     │
│          └── Fuga: caller leva os pontos, sem revelar cartas │
│     └── Maior rank vence a rodada → pontos × multiplicador   │
│                                                              │
│  8. RESULTADO da rodada: cartas reveladas uma a uma          │
│     └── Vencedor brilha, +N sobe no placar                   │
│     └── Próxima rodada em 5 segundos                         │
│                                                              │
│  9. Após todas as rodadas → VENCEDOR anunciado               │
└─────────────────────────────────────────────────────────────┘
```

---

## O que aparece em cada carta

Toda carta exibe **3 campos obrigatórios**:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **PERGUNTA** | A questão que o jogador escolheu responder | *Top 5 Filmes de Terror* |
| **RESPOSTA** | O item que o jogador colocou na lista | *O Iluminado* |
| **RESPONDEU** | Quem escreveu essa resposta | *Maria* |

O **valor/rank** (1–5) fica oculto durante o jogo e é revelado apenas quando a carta é jogada na Mesa e no resultado da rodada.

> O formato das cartas é JSON puro — pronto para persistência em banco de dados e cache agressivo.

---

## Visual — A Feature que Diferencia *(planejado)*

Quando um jogador digita *"Pizza de Calabresa"*, o sistema não exibe só texto. Ele:

1. Faz uma busca na **Google Custom Search API** com Safe Search ativado
2. Baixa a imagem encontrada
3. Aplica um **shader artístico** via Unity Shader Graph — estilo Pintura a Óleo, Pixel Art ou Cel-shading
4. Salva em cache local para não repetir a busca

> Imagens são cacheadas localmente. Se a cota da API acabar ou a internet cair, o jogo usa placeholders artísticos e continua funcionando.

---

## Arquitetura Técnica

O sistema opera em **Tríade Local** — tudo na mesma rede, sem servidor externo:

```
┌─────────────────────────────────────────────────────────┐
│                      Rede Wi-Fi Local                    │
│                                                          │
│   ┌──────────────┐        ┌─────────────────────────┐   │
│   │  Unity (PC)  │◄──────►│   Servidor Node.js      │   │
│   │    Mesa      │        │   Express + Socket.IO   │   │
│   │  Host Visual │        │   Porta 3000            │   │
│   └──────────────┘        └────────────┬────────────┘   │
│                                        │                  │
│                           ┌────────────▼────────────┐   │
│                           │   React App (Mão)        │   │
│                           │   Acessado no celular    │   │
│                           └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

| Componente | Tecnologia | Papel |
|---|---|---|
| **Mesa** | Unity 2022 LTS + Shader Graph *(planejado)* | Gráficos, áudio, animações, shaders nas cartas |
| **Servidor** | Node.js + Socket.IO + Express | Estado do jogo, turnos, pontuação, WebSocket |
| **Mão** | React + Vite + Tailwind CSS | Controle individual no celular |

---

## Stack

| Componente | Tecnologia |
|---|---|
| Engine visual | Unity 2022 LTS *(planejado)* |
| Servidor | Node.js + Socket.IO |
| Frontend mobile | React + Vite + Tailwind CSS |
| Comunicação Unity | SocketIOUnity (C#) *(planejado)* |
| Imagens | Google Custom Search API *(planejado)* |

---

## Estado Atual do Protótipo

Camada Node.js + React completamente implementada:

- [x] Servidor WebSocket local com QR Code automático
- [x] Lobby com reconexão automática (sessionId no sessionStorage)
- [x] Designação automática de Host (primeiro jogador a entrar)
- [x] **Cada jogador recebe 3 perguntas exclusivas** — seleção individual, não compartilhada
- [x] **Submissão de Top 5** por jogador para sua pergunta escolhida
- [x] **Cartas com 3 campos**: Pergunta | Resposta | Respondeu (formato JSON pronto para banco)
- [x] Distribuição aleatória de cartas entre os jogadores
- [x] **Turnos controlados**: só quem está no turno pode jogar; Mesa indica a vez em tempo real
- [x] **Mecânica de Truco completa**: chamada do celular, overlay de decisão, multiplicador 1→2→4, fuga sem revelar cartas, escalada para Seis
- [x] **Pontuação por rodada com multiplicador**: maior rank ganha a vaza (+1×, +2× ou +4×)
- [x] **Revelação sequencial de cartas**: cartas caem face-down, reveladas uma a uma com flip animation; vencedor pulsa dourado; +N flutua no placar
- [x] **Tela de resultado por rodada**: resultado normal ou por fuga do Truco
- [x] **Tela de Game Over** com pódio final e vencedor
- [x] Mesa React com QR code, avatares ao redor da mesa oval, indicador de turno e placar ao vivo
- [x] Placar compacto visível na mão do jogador durante o jogo
- [x] Layout responsivo: portrait no celular, landscape no PC/tablet
- [x] Suporte a safe-area iOS (notch, barra home) e 100svh
- [x] **Mesa com layout de mesa oval** — avatares ao redor, cartas em leque (160×222 px), sidebar de placar
- [x] **Botão TRUCO! cosmético** na Mesa com cooldown e overlay fullscreen animado
- [x] Design sem emojis — texto limpo em todas as telas
- [ ] Mecânica de aposta (adivinhar o dono da carta antes de jogar)
- [ ] Integração Unity como Mesa
- [ ] Busca de imagens por carta + cache local + shaders

---

## Setup Rápido

### Modo produção (recomendado para jogar)

```bash
# 1. Instalar dependências (só na primeira vez)
npm run install:all

# 2. Compilar o cliente React e iniciar o servidor
npm start
```

| URL | Quem acessa |
|-----|-------------|
| `http://IP:3000/mesa` | PC / TV — tela da Mesa (QR code + cartas + placar) |
| `http://IP:3000` | Celular — escaneie o QR Code para entrar |

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

> Em dev, o Vite faz proxy de `/socket.io` e `/qr` para o servidor na porta 3000. Ambos os terminais precisam estar rodando.

### Liberar porta travada

```bash
netstat -ano | findstr :3000   # anota o PID
taskkill /PID <PID> /F

# Ou mata todos os Node.js:
taskkill /IM node.exe /F
```

> Todos os dispositivos precisam estar na **mesma rede Wi-Fi**. Node.js v18+ necessário.

---

## Regras de Pontuação

| Situação | Pontos |
|----------|--------|
| Carta com maior rank (rodada normal) | +1 ponto |
| Carta com maior rank (Truco aceito) | +2 pontos |
| Carta com maior rank (Seis aceito) | +4 pontos |
| Adversário foge do Truco | +1 ponto ao caller (sem revelar cartas) |
| Adversário foge do Seis | +2 pontos ao caller (sem revelar cartas) |
| Empate (mesmo rank) | Ninguém ganha ponto |
| Adivinhar o dono da carta *(planejado)* | +bônus |
| Errar a aposta *(planejado)* | −penalidade |

**Rank das cartas:** posição na lista original do criador.
`1º lugar = rank 5` (mais favorito) · `5º lugar = rank 1` (menos favorito)

---

## Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| Latência ação → tela | < 100ms (percepção instantânea) |
| Jogadores simultâneos | 2 a 8 |
| Orientação mobile | Portrait (retrato) |
| Plataformas host | Windows x64 e Linux (Steam Deck) |
| Formato das cartas | JSON puro (pronto para persistência e cache agressivo) |

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| API de imagens paga / cota limitada | Alto | Cache local agressivo no disco; placeholders artísticos como fallback |
| Firewall do Windows bloqueando o servidor | Alto | Script instalador com exceção automática ou tutorial na primeira execução |
| Imagens impróprias escapando do Safe Search | Médio | Safe Search strict na API; host pode banir imagem manualmente na Mesa |
| Performance no Steam Deck | Baixo | Shaders são muito mais leves que IA generativa; meta é 60 FPS estável |
