/**
 * db.js — Conexão PostgreSQL + criação automática do schema.
 *
 * Design:
 *  • O banco é OPCIONAL. Se o PostgreSQL não estiver disponível,
 *    o jogo continua funcionando normalmente (isEnabled() → false).
 *  • Configuração via variáveis de ambiente (ver .env.example).
 *  • Futuro: trocar apenas a connection string para apontar para
 *    um banco na nuvem — a camada de repositório não muda.
 */

const { Pool } = require('pg');

// ─── Pool de conexões ─────────────────────────────────────────────────────────

const pool = new Pool({
  host:                    process.env.DB_HOST     || 'localhost',
  port:                    Number(process.env.DB_PORT) || 5432,
  database:                process.env.DB_NAME     || 'top5party',
  user:                    process.env.DB_USER     || 'postgres',
  password:                process.env.DB_PASSWORD || 'postgres',
  max:                     5,
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis: 3_000,
});

let _enabled = false;

/** Retorna true somente quando a conexão foi estabelecida com sucesso. */
const isEnabled = () => _enabled;

// ─── Schema DDL ───────────────────────────────────────────────────────────────
//
// Convenções:
//  • session_id  → chave estável gerada no cliente (não o socket ID)
//  • UUID v4     → chave primária de entidades de jogo
//  • TIMESTAMPTZ → sempre UTC

const SCHEMA_SQL = `
  -- Jogadores únicos (upsert a cada entrada)
  CREATE TABLE IF NOT EXISTS players (
    session_id  VARCHAR(36)  PRIMARY KEY,
    name        VARCHAR(24)  NOT NULL,
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
  );

  -- Partidas
  CREATE TABLE IF NOT EXISTS games (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    player_count      SMALLINT     NOT NULL,
    started_at        TIMESTAMPTZ  DEFAULT NOW(),
    ended_at          TIMESTAMPTZ,
    winner_session_id VARCHAR(36)
  );

  -- Participação: jogador x partida (score final capturado aqui)
  CREATE TABLE IF NOT EXISTS game_players (
    game_id      UUID        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    session_id   VARCHAR(36) NOT NULL,
    player_name  VARCHAR(24) NOT NULL,
    final_score  SMALLINT    DEFAULT 0,
    PRIMARY KEY (game_id, session_id)
  );

  -- Respostas do Top 5 de cada jogador em cada partida
  -- rank: 1 = menos favorito, 5 = favorito
  CREATE TABLE IF NOT EXISTS answers (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id      UUID          NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    session_id   VARCHAR(36)   NOT NULL,
    theme_text   VARCHAR(120)  NOT NULL,
    answer_text  VARCHAR(60)   NOT NULL,
    rank         SMALLINT      NOT NULL CHECK (rank BETWEEN 1 AND 5),
    created_at   TIMESTAMPTZ   DEFAULT NOW()
  );

  -- Rodadas de cada partida
  CREATE TABLE IF NOT EXISTS rounds (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id           UUID        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number      SMALLINT    NOT NULL,
    winner_session_id VARCHAR(36),
    multiplier        SMALLINT    DEFAULT 1,
    truco_fled        BOOLEAN     DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
  );

  -- Cartas jogadas em cada rodada
  -- answer_id → rastreia exatamente qual resposta foi jogada por qual jogador
  CREATE TABLE IF NOT EXISTS round_cards (
    round_id             UUID        NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    answer_id            UUID        NOT NULL REFERENCES answers(id),
    played_by_session_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (round_id, answer_id)
  );

  -- Índices de consulta frequente
  CREATE INDEX IF NOT EXISTS idx_answers_game        ON answers(game_id);
  CREATE INDEX IF NOT EXISTS idx_answers_session     ON answers(session_id);
  CREATE INDEX IF NOT EXISTS idx_rounds_game         ON rounds(game_id);
  CREATE INDEX IF NOT EXISTS idx_round_cards_round   ON round_cards(round_id);
`;

// ─── Bootstrap ───────────────────────────────────────────────────────────────

/**
 * Tenta conectar ao banco. Se falhar, o servidor continua sem persistência.
 * Deve ser chamado uma vez na inicialização.
 */
async function connect() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    _enabled = true;
    console.log('[DB] PostgreSQL conectado');

    await pool.query(SCHEMA_SQL);
    console.log('[DB] Schema verificado/criado');
  } catch (err) {
    _enabled = false;
    console.warn(`[DB] PostgreSQL indisponível — jogo roda sem persistência. (${err.message})`);
  }
}

module.exports = { pool, connect, isEnabled };
