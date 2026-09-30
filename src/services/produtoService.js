import { supabase } from "../config/supabase";

import {
  buscarProdutoPorCodigo,
  inserirProduto,
} from "../database/db";

/**
 * Converte valores numéricos com segurança.
 */
function numeroOuNull(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

/**
 * Busca um produto no SQLite local.
 */
async function buscarNoSQLite(codigoBarras) {
  try {
    const produto = await buscarProdutoPorCodigo(codigoBarras);

    if (produto) {
      console.log("[Produto] Encontrado no SQLite:", codigoBarras);
    }

    return produto;
  } catch (error) {
    console.error("[Produto] Erro ao consultar SQLite:", error);
    return null;
  }
}

/**
 * Busca um produto no Supabase.
 */
async function buscarNoSupabase(codigoBarras) {
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        id,
        codigo_barras,
        tipo_codigo,
        nome_produto,
        calorias,
        acucares,
        sodio,
        gorduras_saturadas
      `)
      .eq("codigo_barras", codigoBarras)
      .maybeSingle();

    if (error) {
      console.error("[Produto] Erro no Supabase:", error);
      return null;
    }

    if (data) {
      console.log(
        "[Produto] Encontrado no Supabase:",
        codigoBarras
      );
    }

    return data;
  } catch (error) {
    console.error(
      "[Produto] Erro ao consultar Supabase:",
      error
    );

    return null;
  }
}

/**
 * Busca um produto na Open Food Facts.
 *
 * A API retorna os valores nutricionais relativos
 * a 100g/100ml quando disponíveis.
 */
async function buscarNaOpenFoodFacts(codigoBarras) {
  try {
    const url =
      `https://world.openfoodfacts.org/api/v3/product/${codigoBarras}` +
      `?fields=code,product_name,product_name_pt,nutriments`;

    console.log(
      "[Open Food Facts] Consultando:",
      codigoBarras
    );

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "NutriScan/1.0 (nutriscan@unifacef.com)",
      },
    });

    if (!response.ok) {
      console.log(
        "[Open Food Facts] Produto não encontrado ou erro HTTP:",
        response.status
      );

      return null;
    }

    const data = await response.json();

    if (!data.product) {
      console.log(
        "[Open Food Facts] Produto não encontrado:",
        codigoBarras
      );

      return null;
    }

    const produto = data.product;
    const nutriments = produto.nutriments || {};

    const calorias = numeroOuNull(
      nutriments["energy-kcal_100g"]
    );

    const acucares = numeroOuNull(
      nutriments["sugars_100g"]
    );

    const sodioGramas = numeroOuNull(
      nutriments["sodium_100g"]
    );

    const gordurasSaturadas = numeroOuNull(
      nutriments["saturated-fat_100g"]
    );

    /*
     * A Open Food Facts fornece sodium_100g em gramas.
     *
     * O NutriScan trabalha com sódio em mg.
     *
     * Exemplo:
     * 0.1 g = 100 mg
     */
    const sodio =
      sodioGramas !== null
        ? sodioGramas * 1000
        : null;

    const nomeProduto =
      produto.product_name_pt ||
      produto.product_name ||
      "Produto sem nome";

    const resultado = {
      id: `off-${codigoBarras}`,

      codigo_barras: codigoBarras,

      tipo_codigo: "ean13",

      nome_produto: nomeProduto,

      calorias,

      acucares,

      sodio,

      gorduras_saturadas: gordurasSaturadas,

      origem: "open_food_facts",
    };

    console.log(
      "[Open Food Facts] Produto encontrado:",
      resultado.nome_produto
    );

    return resultado;

  } catch (error) {
    console.error(
      "[Open Food Facts] Erro na consulta:",
      error
    );

    return null;
  }
}

/**
 * Salva um produto encontrado no SQLite.
 */
async function salvarNoSQLite(produto) {
  const agora = new Date().toISOString();

  await inserirProduto({
    id: produto.id,

    codigoBarras:
      produto.codigo_barras ||
      produto.codigoBarras,

    tipoCodigo:
      produto.tipo_codigo ||
      produto.tipoCodigo ||
      null,

    nomeProduto:
      produto.nome_produto ||
      produto.nomeProduto ||
      null,

    calorias:
      produto.calorias ?? null,

    acucares:
      produto.acucares ?? null,

    sodio:
      produto.sodio ?? null,

    gordurasSaturadas:
      produto.gorduras_saturadas ??
      produto.gordurasSaturadas ??
      null,

    criadoEm:
      produto.criado_em ||
      agora,

    atualizadoEm:
      agora,
  });
}

/**
 * FUNÇÃO PRINCIPAL
 *
 * Fluxo:
 *
 * SQLite
 *   ↓
 * Supabase
 *   ↓
 * Open Food Facts
 *   ↓
 * Cadastro manual
 */
export async function buscarProduto(codigoBarras) {

  if (!codigoBarras) {
    throw new Error(
      "Código de barras não informado."
    );
  }

  const codigo = String(codigoBarras).trim();

  console.log(
    "================================="
  );

  console.log(
    "[Produto] Iniciando busca:",
    codigo
  );

  /*
   * 1. SQLite
   */
  const produtoLocal =
    await buscarNoSQLite(codigo);

  if (produtoLocal) {

    console.log(
      "[Produto] Fonte: SQLite"
    );

    return {
      encontrado: true,
      produto: produtoLocal,
      origem: "sqlite",
      precisaCadastro: false,
    };
  }

  /*
   * 2. Supabase
   */
  const produtoSupabase =
    await buscarNoSupabase(codigo);

  if (produtoSupabase) {

    console.log(
      "[Produto] Salvando produto do Supabase no SQLite..."
    );

    await salvarNoSQLite(
      produtoSupabase
    );

    return {
      encontrado: true,
      produto: produtoSupabase,
      origem: "supabase",
      precisaCadastro: false,
    };
  }

  /*
   * 3. Open Food Facts
   */
  const produtoOFF =
    await buscarNaOpenFoodFacts(codigo);

  if (produtoOFF) {

    console.log(
      "[Produto] Salvando produto da Open Food Facts no SQLite..."
    );

    await salvarNoSQLite(
      produtoOFF
    );

    return {
      encontrado: true,
      produto: produtoOFF,
      origem: "open_food_facts",
      precisaCadastro: false,
    };
  }

  /*
   * 4. Não encontrado
   *
   * Neste caso a tela poderá oferecer
   * o cadastro manual.
   */
  console.log(
    "[Produto] Produto não encontrado."
  );

  return {
    encontrado: false,
    produto: null,
    origem: null,
    precisaCadastro: true,
  };
}