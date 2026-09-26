// Camada de acesso ao Expo SQLite — armazenamento local para
// funcionamento offline-first.

import * as SQLite from "expo-sqlite";

let dbInstance = null;

/**
 * Abre (ou cria) o banco local e garante que a tabela exista.
 * Também garante que a coluna user_id exista em bancos já criados.
 */
export async function initDatabase() {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync("nutriscan.db");

  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS analises_nutricionais (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      nome_produto TEXT,
      calorias REAL,
      acucares REAL,
      sodio REAL,
      gorduras_saturadas REAL,
      status TEXT NOT NULL,
      texto_bruto_ocr TEXT,
      imagem_uri TEXT,
      criado_em TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Migração para bancos que já existiam antes da criação do user_id.
  const colunas = await dbInstance.getAllAsync(
    `PRAGMA table_info(analises_nutricionais)`
  );

  const possuiUserId = colunas.some(
    (coluna) => coluna.name === "user_id"
  );

  if (!possuiUserId) {
    await dbInstance.execAsync(`
      ALTER TABLE analises_nutricionais
      ADD COLUMN user_id TEXT;
    `);
  }

  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    throw new Error(
      "Banco de dados não inicializado. Chame initDatabase() antes de usar."
    );
  }

  return dbInstance;
}

/**
 * Insere uma nova análise no banco local.
 */
export async function inserirAnalise(analise) {
  const db = getDb();

  await db.runAsync(
    `INSERT INTO analises_nutricionais
      (
        id,
        user_id,
        nome_produto,
        calorias,
        acucares,
        sodio,
        gorduras_saturadas,
        status,
        texto_bruto_ocr,
        imagem_uri,
        criado_em,
        sincronizado
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      analise.id,
      analise.userId,
      analise.nomeProduto,
      analise.calorias,
      analise.acucares,
      analise.sodio,
      analise.gordurasSaturadas,
      analise.status,
      analise.textoBrutoOcr,
      analise.imagemUri,
      analise.criadoEm,
    ]
  );
}

/**
 * Retorna todas as análises salvas localmente.
 */
export async function listarAnalises(userId) {
  const db = getDb();

  return db.getAllAsync(
    `SELECT * FROM analises_nutricionais
     WHERE user_id = ?
     ORDER BY criado_em DESC`,
    [userId]
  );
}

/**
 * Retorna apenas as análises ainda não sincronizadas.
 */
export async function listarAnalisesPendentes(userId) {
  const db = getDb();

  return db.getAllAsync(
    `SELECT * FROM analises_nutricionais
     WHERE sincronizado = 0
       AND user_id = ?`,
    [userId]
  );
}

/**
 * Marca uma análise como sincronizada.
 */
export async function marcarComoSincronizado(id) {
  const db = getDb();

  await db.runAsync(
    `UPDATE analises_nutricionais
     SET sincronizado = 1
     WHERE id = ?`,
    [id]
  );
}

/**
 * Remove uma análise do histórico local.
 */
export async function excluirAnalise(id) {
  const db = getDb();

  await db.runAsync(
    `DELETE FROM analises_nutricionais
     WHERE id = ?`,
    [id]
  );
}
export async function salvarAnaliseSincronizada(analise) {
  const db = getDb();

  await db.runAsync(
    `INSERT INTO analises_nutricionais
      (
        id,
        user_id,
        nome_produto,
        calorias,
        acucares,
        sodio,
        gorduras_saturadas,
        status,
        texto_bruto_ocr,
        imagem_uri,
        criado_em,
        sincronizado
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       user_id = excluded.user_id,
       nome_produto = excluded.nome_produto,
       calorias = excluded.calorias,
       acucares = excluded.acucares,
       sodio = excluded.sodio,
       gorduras_saturadas = excluded.gorduras_saturadas,
       status = excluded.status,
       texto_bruto_ocr = excluded.texto_bruto_ocr,
       criado_em = excluded.criado_em,
       sincronizado = 1`,
    [
      analise.id,
      analise.user_id,
      analise.nome_produto,
      analise.calorias,
      analise.acucares,
      analise.sodio,
      analise.gorduras_saturadas,
      analise.status,
      analise.texto_bruto_ocr,
      null,
      analise.criado_em,
    ]
  );
}