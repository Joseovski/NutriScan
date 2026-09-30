// Camada de acesso ao Expo SQLite — armazenamento local
// para funcionamento offline-first.

import * as SQLite from "expo-sqlite";

let dbInstance = null;

/**
 * Abre (ou cria) o banco local e garante que as tabelas existam.
 */
export async function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync(
    "nutriscan.db"
  );

  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;

    /*
     * ========================================================
     * TABELA DE PRODUTOS
     * ========================================================
     */

    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY NOT NULL,
      codigo_barras TEXT NOT NULL UNIQUE,
      tipo_codigo TEXT,
      nome_produto TEXT,
      calorias REAL,
      acucares REAL,
      sodio REAL,
      gorduras_saturadas REAL,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    /*
     * ========================================================
     * TABELA DE ANÁLISES
     * ========================================================
     */

    CREATE TABLE IF NOT EXISTS analises_nutricionais (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      codigo_barras TEXT,
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

    /*
     * ========================================================
     * TABELA DE EXCLUSÕES PENDENTES
     * ========================================================
     *
     * Guarda os IDs que foram excluídos localmente,
     * mas ainda precisam ser removidos do Supabase.
     */

    CREATE TABLE IF NOT EXISTS exclusoes_pendentes (
      id TEXT PRIMARY KEY NOT NULL,
      criado_em TEXT NOT NULL
    );
  `);

  /*
   * ==========================================================
   * MIGRAÇÕES
   * ==========================================================
   *
   * Garante compatibilidade com bancos antigos.
   */

  const colunas =
    await dbInstance.getAllAsync(
      `PRAGMA table_info(analises_nutricionais)`
    );

  const possuiUserId =
    colunas.some(
      (coluna) =>
        coluna.name === "user_id"
    );

  const possuiCodigoBarras =
    colunas.some(
      (coluna) =>
        coluna.name === "codigo_barras"
    );

  if (!possuiUserId) {
    await dbInstance.execAsync(`
      ALTER TABLE analises_nutricionais
      ADD COLUMN user_id TEXT;
    `);
  }

  if (!possuiCodigoBarras) {
    await dbInstance.execAsync(`
      ALTER TABLE analises_nutricionais
      ADD COLUMN codigo_barras TEXT;
    `);
  }

  return dbInstance;
}

/**
 * Retorna a conexão com o banco.
 */
function getDb() {
  if (!dbInstance) {
    throw new Error(
      "Banco de dados não inicializado. " +
      "Chame initDatabase() antes de usar."
    );
  }

  return dbInstance;
}

/**
 * ============================================================
 * PRODUTOS
 * ============================================================
 */

/**
 * Procura um produto pelo código de barras.
 */
export async function buscarProdutoPorCodigo(
  codigoBarras
) {
  const db = getDb();

  const produto =
    await db.getFirstAsync(
      `
        SELECT *
        FROM produtos
        WHERE codigo_barras = ?
        LIMIT 1
      `,
      [codigoBarras]
    );

  return produto || null;
}

/**
 * Insere um produto no banco local.
 *
 * Se o código de barras já existir,
 * atualiza os dados.
 */
export async function inserirProduto(
  produto
) {
  const db = getDb();

  await db.runAsync(
    `
      INSERT INTO produtos (
        id,
        codigo_barras,
        tipo_codigo,
        nome_produto,
        calorias,
        acucares,
        sodio,
        gorduras_saturadas,
        criado_em,
        atualizado_em
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(codigo_barras)
      DO UPDATE SET
        tipo_codigo =
          excluded.tipo_codigo,

        nome_produto =
          excluded.nome_produto,

        calorias =
          excluded.calorias,

        acucares =
          excluded.acucares,

        sodio =
          excluded.sodio,

        gorduras_saturadas =
          excluded.gorduras_saturadas,

        atualizado_em =
          excluded.atualizado_em
    `,
    [
      produto.id,
      produto.codigoBarras,
      produto.tipoCodigo,
      produto.nomeProduto,
      produto.calorias,
      produto.acucares,
      produto.sodio,
      produto.gordurasSaturadas,
      produto.criadoEm,
      produto.atualizadoEm,
    ]
  );
}

/**
 * Atualiza um produto existente.
 */
export async function atualizarProduto(
  produto
) {
  const db = getDb();

  await db.runAsync(
    `
      UPDATE produtos
      SET
        tipo_codigo = ?,
        nome_produto = ?,
        calorias = ?,
        acucares = ?,
        sodio = ?,
        gorduras_saturadas = ?,
        atualizado_em = ?
      WHERE codigo_barras = ?
    `,
    [
      produto.tipoCodigo,
      produto.nomeProduto,
      produto.calorias,
      produto.acucares,
      produto.sodio,
      produto.gordurasSaturadas,
      produto.atualizadoEm,
      produto.codigoBarras,
    ]
  );
}

/**
 * ============================================================
 * ANÁLISES
 * ============================================================
 */

/**
 * Insere uma nova análise no banco local.
 */
export async function inserirAnalise(
  analise
) {
  const db = getDb();

  await db.runAsync(
    `
      INSERT INTO analises_nutricionais (
        id,
        user_id,
        codigo_barras,
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
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0
      )
    `,
    [
      analise.id,
      analise.userId,
      analise.codigoBarras,
      analise.nomeProduto,
      analise.calorias,
      analise.acucares,
      analise.sodio,
      analise.gordurasSaturadas,
      analise.status,
      analise.textoBrutoOcr || null,
      analise.imagemUri || null,
      analise.criadoEm,
    ]
  );
}

/**
 * Retorna todas as análises salvas localmente
 * de determinado usuário.
 */
export async function listarAnalises(
  userId
) {
  const db = getDb();

  return db.getAllAsync(
    `
      SELECT *
      FROM analises_nutricionais
      WHERE user_id = ?
      ORDER BY criado_em DESC
    `,
    [userId]
  );
}

/**
 * Retorna apenas as análises ainda não sincronizadas.
 */
export async function listarAnalisesPendentes(
  userId
) {
  const db = getDb();

  return db.getAllAsync(
    `
      SELECT *
      FROM analises_nutricionais
      WHERE sincronizado = 0
      AND user_id = ?
      ORDER BY criado_em ASC
    `,
    [userId]
  );
}

/**
 * Marca uma análise como sincronizada.
 */
export async function marcarComoSincronizado(
  id
) {
  const db = getDb();

  await db.runAsync(
    `
      UPDATE analises_nutricionais
      SET sincronizado = 1
      WHERE id = ?
    `,
    [id]
  );
}

/**
 * Remove uma análise do histórico local.
 */
export async function excluirAnalise(
  id
) {
  const db = getDb();

  await db.runAsync(
    `
      DELETE FROM analises_nutricionais
      WHERE id = ?
    `,
    [id]
  );
}

/**
 * ============================================================
 * EXCLUSÕES PENDENTES
 * ============================================================
 */

/**
 * Registra uma exclusão que ainda precisa
 * ser enviada ao Supabase.
 */
export async function registrarExclusaoPendente(
  id
) {
  const db = getDb();

  await db.runAsync(
    `
      INSERT OR REPLACE INTO exclusoes_pendentes (
        id,
        criado_em
      )
      VALUES (?, ?)
    `,
    [
      id,
      new Date().toISOString(),
    ]
  );
}

/**
 * Lista todas as exclusões pendentes.
 */
export async function listarExclusoesPendentes() {
  const db = getDb();

  return db.getAllAsync(
    `
      SELECT
        id,
        criado_em
      FROM exclusoes_pendentes
      ORDER BY criado_em ASC
    `
  );
}

/**
 * Remove uma exclusão pendente
 * depois que ela foi enviada ao Supabase.
 */
export async function removerExclusaoPendente(
  id
) {
  const db = getDb();

  await db.runAsync(
    `
      DELETE FROM exclusoes_pendentes
      WHERE id = ?
    `,
    [id]
  );
}

/**
 * ============================================================
 * SINCRONIZAÇÃO
 * ============================================================
 */

/**
 * Salva uma análise recebida do Supabase
 * no SQLite.
 */
export async function salvarAnaliseSincronizada(
  analise
) {
  const db = getDb();

  await db.runAsync(
    `
      INSERT INTO analises_nutricionais (
        id,
        user_id,
        codigo_barras,
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
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        1
      )

      ON CONFLICT(id)
      DO UPDATE SET
        user_id =
          excluded.user_id,

        codigo_barras =
          excluded.codigo_barras,

        nome_produto =
          excluded.nome_produto,

        calorias =
          excluded.calorias,

        acucares =
          excluded.acucares,

        sodio =
          excluded.sodio,

        gorduras_saturadas =
          excluded.gorduras_saturadas,

        status =
          excluded.status,

        texto_bruto_ocr =
          excluded.texto_bruto_ocr,

        criado_em =
          excluded.criado_em,

        sincronizado = 1
    `,
    [
      analise.id,
      analise.user_id,
      analise.codigo_barras || null,
      analise.nome_produto,
      analise.calorias,
      analise.acucares,
      analise.sodio,
      analise.gorduras_saturadas,
      analise.status,
      analise.texto_bruto_ocr || null,
      null,
      analise.criado_em,
    ]
  );
}