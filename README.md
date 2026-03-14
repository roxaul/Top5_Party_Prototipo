# 🎮 Top 5 Party

> **"Você acha que conhece as preferências dos seus amigos? Prove."**

Top 5 Party é um **party game multiplayer local** onde cada jogador usa o próprio celular como controle — sem instalar nada. O PC ou Steam Deck vira a tela central do jogo. Basta estar na mesma rede Wi-Fi.

---

## O Conceito

A premissa é simples e social: **todo mundo tem opiniões, e ninguém concorda com ninguém.**

A cada rodada, os jogadores respondem a um tema com sua lista pessoal de Top 5 — do mais ao menos favorito. As respostas viram cartas físicas num baralho virtual, embaralhadas e redistribuídas anonimamente. Você não sabe de quem é a carta que está na sua mão.

A mecânica central é de **vazas** (trick-taking): quem jogar a carta de maior valor leva a rodada. O valor de uma carta é determinado pela posição original na lista de quem a criou — um **1º lugar vale 5 pontos**, um **5º lugar vale 1 ponto**. O segredo é descobrir o que seu amigo colocou como favorito — e jogar na hora certa.

### O Twist: a Aposta

Antes de jogar uma carta, o jogador pode **apostar na identidade do dono**. Acertou? Bônus de pontos. Errou? Penalidade. Isso transforma cada jogada num momento de tensão social: *"Isso aqui parece coisa do João... ou será da Mari?"*

---

## Por que vai funcionar

| Ponto forte | Detalhe |
|-------------|---------|
| **Zero atrito para entrar** | Basta escanear o QR Code. Nenhum app para instalar |
| **Conteúdo gerado pelos próprios jogadores** | As cartas são as opiniões reais de quem está na mesa |
| **Imagens geradas automaticamente** | Cada carta busca uma imagem real na web e aplica um shader artístico (óleo, pixel art ou cel-shading) — visual único em cada partida |
| **Funciona offline** | Após o download das imagens, o jogo roda sem internet |
| **Steam Deck ready** | Pensado para rodar no Steam Deck como host portátil numa mesa de bar ou sala |

---

## Fluxo de uma Partida

```
┌─────────────────────────────────────────────────────────────┐
│  1. HOST abre o jogo no PC/Steam Deck                        │
│     └── QR Code aparece na tela grande                       │
│                                                              │
│  2. JOGADORES escaneiam com o celular (3 a 8 pessoas)        │
│     └── Primeiro a entrar vira o HOST da rodada              │
│                                                              │
│  3. HOST escolhe o TEMA no celular                           │
│     Ex: "Top 5 Músicas para Churrasco"                       │
│                                                              │
│  4. TODOS submetem seu Top 5 secretamente                    │
│     1º: Bruno Mars  2º: Seu Jorge  3º: ...                   │
│                                                              │
│  5. Servidor embaralha tudo e distribui as cartas            │
│     └── Você pode estar com a carta favorita do João         │
│                                                              │
│  6. Rodada de VAZAS começa                                   │
│     └── Toque em "Jogar" ou deslize a carta para cima        │
│     └── Antes de jogar: aposte em quem criou a carta         │
│                                                              │
│  7. REVELAÇÃO: a tela grande mostra o dono + valor real      │
│     └── Pontuação atualizada, próxima rodada                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual — A Feature que Diferencia

Quando um jogador digita *"Pizza de Calabresa"*, o sistema não exibe só texto. Ele:

1. Faz uma busca na **Google Custom Search API** com Safe Search ativado
2. Baixa a imagem encontrada
3. Aplica um **shader artístico** via Unity Shader Graph — transformando qualquer foto em arte no estilo **Pintura a Óleo**, **Pixel Art** ou **Cel-shading**
4. Salva em cache local para não repetir a busca

O resultado: cartas com visual consistente e artístico, independente de onde a imagem veio. Baixa resolução? Não importa — o shader esconde isso com estilo.

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
| **Mesa** | Unity 2022 LTS + Shader Graph | Gráficos, áudio, animações, shaders nas cartas |
| **Servidor** | Node.js + Socket.IO + Express | Estado do jogo, WebSocket, serve o app mobile |
| **Mão** | React + Vite + Tailwind CSS | Controle individual no celular |

Detalhes técnicos de cada camada: [`server/README.md`](server/README.md) · [`client/README.md`](client/README.md)

---

## Stack

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Engine | Unity 2022 LTS | Shader Graph para estilização visual sem IA |
| Servidor | Node.js + Socket.IO | Melhor biblioteca WebSocket para JS, estável e amplamente documentada |
| Frontend | React + Vite + Tailwind CSS | UI responsiva e leve, hot reload em dev |
| Comunicação Unity | SocketIOUnity (C#) | Padrão da indústria para Unity + WebSocket |
| Imagens | Google Custom Search API | Filtro por licença + Safe Search strict |

---

## Estado Atual do Protótipo

O protótipo cobre a camada Node.js + React completa:

- [x] Servidor WebSocket local com QR Code automático
- [x] Lobby com reconexão automática (sessionId no localStorage)
- [x] Designação automática de Host (primeiro jogador)
- [x] Guia "Como funciona" exibido no lobby para todos os jogadores
- [x] Tela de escolha de tema (host) com sugestões em grid 2 colunas
- [x] Tela de espera do tema com mini-guia "O que vem a seguir" para não-hosts
- [x] Submissão de Top 5 com posições color-coded (ouro/prata/bronze) e barra de preenchimento
- [x] Montagem do baralho a partir das respostas dos jogadores
- [x] Distribuição de cartas e fase de jogo (toque em "Jogar" ou swipe up)
- [x] Mesa React com QR code, lista de jogadores, badge de fase e banner do tema
- [x] Layout responsivo: portrait no celular, landscape no PC/tablet
- [x] Suporte a safe-area iOS (notch, barra home) e 100svh
- [ ] Fase de revelação com animação
- [ ] Pontuação, placar e mecânica de aposta
- [ ] Integração Unity como Mesa
- [ ] Busca de imagens + cache + shaders

---

## Setup Rápido

### Modo produção (recomendado para jogar)

```bash
# 1. Instalar dependências (só na primeira vez)
npm run install:all

# 2. Compilar o cliente React
cd client && npm run build && cd ..

# 3. Iniciar o servidor
npm start
```

| URL | Quem acessa |
|-----|-------------|
| `http://IP:3000/mesa` | PC / TV — tela da Mesa (QR code + cartas) |
| `http://IP:3000` | Celular — escaneie o QR Code para entrar |

> ⚠️ Sempre que alterar código do cliente, repita o passo 2 (`npm run build`) antes de reiniciar o servidor — caso contrário o browser continuará servindo a versão antiga.

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

### Parar o servidor

```bash
# No terminal onde o servidor roda: Ctrl+C

# Se o terminal foi fechado e a porta 3000 ainda está ocupada:
netstat -ano | findstr :3000   # anote o PID
taskkill /PID <PID> /F

# Ou para matar todos os processos Node.js:
taskkill /IM node.exe /F
```

> Todos os dispositivos precisam estar na **mesma rede Wi-Fi**.
> Node.js v18+ necessário.

---

## Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| Latência ação → tela | < 100ms (percepção instantânea) |
| Jogadores simultâneos | 3 a 8 |
| Orientação mobile | Portrait (retrato) |
| Plataformas host | Windows x64 e Linux (Steam Deck) |
| Consumo de API | Cache agressivo para não estourar cotas gratuitas |

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| API de imagens paga / cota limitada | Alto | Cache local agressivo; placeholders artísticos como fallback |
| Firewall do Windows bloqueando o servidor | Alto | Script instalador com exceção automática ou tutorial na primeira execução |
| Imagens impróprias escapando do Safe Search | Médio | Safe Search strict na API; host pode banir imagem manualmente na Mesa |
| Performance no Steam Deck | Baixo | Shaders são muito mais leves que IA generativa; meta é 60 FPS estável |
