/**
 * repository.js — Camada de Acesso a Dados (Data Access Layer).
 *
 * Padrão Repository: toda consulta SQL fica aqui.
 * A lógica de jogo (index.js) chama funções nomeadas de negócio,
 * sem saber nada sobre SQL.
 *
 * Migração futura para nuvem:
 *   1. Troque a connection string em db.js (ou adicione um segundo pool)
 *   2. Este arquivo não precisa mudar — apenas o pool que ele importa
 */

const { pool } = require('./db');

// ─── Jogadores ────────────────────────────────────────────────────────────────

/**
 * Cria ou atualiza o registro de um jogador.
 * Chamado sempre que um jogador entra na sala.
 */
async function upsertPlayer(sessionId, name) {
  await pool.query(
    `INSERT INTO players (session_id, name, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (session_id)
     DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
    [sessionId, name],
  );
}

// ─── Partidas ─────────────────────────────────────────────────────────────────

/**
 * Cria registro da partida. Retorna o UUID gerado.
 */
async function createGame(playerCount) {
  const { rows } = await pool.query(
    `INSERT INTO games (player_count) VALUES ($1) RETURNING id`,
    [playerCount],
  );
  return rows[0].id;
}

/**
 * Associa um jogador à partida com seu score final.
 */
async function addGamePlayer(gameId, sessionId, playerName, finalScore) {
  await pool.query(
    `INSERT INTO game_players (game_id, session_id, player_name, final_score)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (game_id, session_id)
     DO UPDATE SET final_score = EXCLUDED.final_score`,
    [gameId, sessionId, playerName, finalScore],
  );
}

/**
 * Registra o encerramento da partida com vencedor.
 */
async function finalizeGame(gameId, winnerSessionId) {
  await pool.query(
    `UPDATE games SET ended_at = NOW(), winner_session_id = $2 WHERE id = $1`,
    [gameId, winnerSessionId],
  );
}

// ─── Respostas (Top 5) ────────────────────────────────────────────────────────

/**
 * Persiste uma resposta do Top 5 de um jogador.
 * Retorna o UUID da resposta — usado para rastrear qual carta foi jogada
 * em qual rodada (round_cards).
 *
 * @param {string} gameId      - UUID da partida
 * @param {string} sessionId   - ID estável do jogador
 * @param {string} themeText   - Ex: "Top 5 Filmes de Terror"
 * @param {string} answerText  - Ex: "O Iluminado"
 * @param {number} rank        - 1 (menos favorito) a 5 (favorito)
 */
async function insertAnswer(gameId, sessionId, themeText, answerText, rank) {
  const { rows } = await pool.query(
    `INSERT INTO answers (game_id, session_id, theme_text, answer_text, rank)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [gameId, sessionId, themeText, answerText, rank],
  );
  return rows[0].id;
}

// ─── Rodadas ──────────────────────────────────────────────────────────────────

/**
 * Registra o resultado de uma rodada. Retorna o UUID da rodada.
 *
 * @param {string}  gameId           - UUID da partida
 * @param {number}  roundNumber      - Número sequencial da rodada
 * @param {string|null} winnerSid    - session_id do vencedor (null = empate)
 * @param {number}  multiplier       - Valor final dos pontos (1, 3, 6, 9 ou 12)
 * @param {boolean} trucoFled        - true quando alguém fugiu do Truco
 */
async function insertRound(gameId, roundNumber, winnerSid, multiplier, trucoFled = false) {
  const { rows } = await pool.query(
    `INSERT INTO rounds (game_id, round_number, winner_session_id, multiplier, truco_fled)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [gameId, roundNumber, winnerSid, multiplier, trucoFled],
  );
  return rows[0].id;
}

/**
 * Registra a carta jogada por um jogador em uma rodada.
 *
 * @param {string} roundId             - UUID da rodada
 * @param {string} answerId            - UUID da resposta (answer.id)
 * @param {string} playedBySessionId   - Quem jogou (pode ser diferente do autor)
 */
async function insertRoundCard(roundId, answerId, playedBySessionId) {
  await pool.query(
    `INSERT INTO round_cards (round_id, answer_id, played_by_session_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [roundId, answerId, playedBySessionId],
  );
}

// ─── Consultas úteis (analytics futuros) ────────────────────────────────────

/**
 * Retorna todas as respostas de um jogador ao longo do tempo.
 * Útil para análise de padrões de gosto.
 */
async function getPlayerAnswers(sessionId) {
  const { rows } = await pool.query(
    `SELECT a.theme_text, a.answer_text, a.rank, g.started_at
     FROM   answers a
     JOIN   games   g ON g.id = a.game_id
     WHERE  a.session_id = $1
     ORDER  BY g.started_at DESC`,
    [sessionId],
  );
  return rows;
}

/**
 * Retorna os temas mais escolhidos de todos os jogadores.
 */
async function getTopThemes(limit = 10) {
  const { rows } = await pool.query(
    `SELECT theme_text, COUNT(*) AS uses
     FROM   answers
     GROUP  BY theme_text
     ORDER  BY uses DESC
     LIMIT  $1`,
    [limit],
  );
  return rows;
}

module.exports = {
  upsertPlayer,
  createGame,
  addGamePlayer,
  finalizeGame,
  insertAnswer,
  insertRound,
  insertRoundCard,
  getPlayerAnswers,
  getTopThemes,
};
