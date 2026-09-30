// Serviço de sincronização offline-first.
//
// Fluxo:
//
// 1. Toda análise é salva primeiro no SQLite.
// 2. Quando há internet, análises pendentes são enviadas ao Supabase.
// 3. Exclusões também são registradas localmente.
// 4. Quando há internet, exclusões pendentes são enviadas ao Supabase.
// 5. Depois da exclusão bem-sucedida, a pendência é removida.
//
// Estratégia de conflito:
// "last write wins" via upsert.

import NetInfo from "@react-native-community/netinfo";

import { supabase } from "../config/supabase";

import {
  listarAnalisesPendentes,
  marcarComoSincronizado,
  salvarAnaliseSincronizada,

  listarExclusoesPendentes,
  removerExclusaoPendente,
} from "../database/db";

/**
 * Verifica se o dispositivo está conectado à internet.
 */
export async function estaConectado() {
  const estado = await NetInfo.fetch();

  return Boolean(
    estado.isConnected &&
    estado.isInternetReachable !== false
  );
}

/**
 * Envia para o Supabase todos os registros locais
 * ainda não sincronizados.
 */
export async function sincronizarPendentes() {
  const conectado = await estaConectado();

  if (!conectado) {
    return {
      enviados: 0,
      excluidos: 0,
      falhas: 0,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[Sync] Usuário não autenticado.");

    return {
      enviados: 0,
      excluidos: 0,
      falhas: 0,
    };
  }

  let enviados = 0;
  let excluidos = 0;
  let falhas = 0;

  /*
   * =========================================================
   * 1. SINCRONIZA ANÁLISES NOVAS/ALTERADAS
   * =========================================================
   */

  const pendentes = await listarAnalisesPendentes(user.id);

  for (const analise of pendentes) {
    try {
      const { error } = await supabase
        .from("analises_nutricionais")
        .upsert({
          id: analise.id,
          user_id: analise.user_id,

          codigo_barras: analise.codigo_barras,
          nome_produto: analise.nome_produto,

          calorias: analise.calorias,
          acucares: analise.acucares,
          sodio: analise.sodio,
          gorduras_saturadas:
            analise.gorduras_saturadas,

          status: analise.status,

          texto_bruto_ocr:
            analise.texto_bruto_ocr,

          criado_em: analise.criado_em,
        });

      if (error) {
        throw error;
      }

      await marcarComoSincronizado(analise.id);

      enviados += 1;

    } catch (err) {
      console.warn(
        `[Sync] Falha ao sincronizar análise ${analise.id}:`,
        err.message
      );

      falhas += 1;
    }
  }

  /*
   * =========================================================
   * 2. PROCESSA EXCLUSÕES PENDENTES
   * =========================================================
   */

  const exclusoes =
    await listarExclusoesPendentes();

  for (const exclusao of exclusoes) {
    try {
      const { error } = await supabase
        .from("analises_nutricionais")
        .delete()
        .eq("id", exclusao.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      /*
       * Só remove a pendência local depois que
       * o Supabase confirmou a exclusão.
       */
      await removerExclusaoPendente(
        exclusao.id
      );

      excluidos += 1;

    } catch (err) {
      console.warn(
        `[Sync] Falha ao excluir análise ${exclusao.id}:`,
        err.message
      );

      falhas += 1;
    }
  }

  return {
    enviados,
    excluidos,
    falhas,
  };
}

/**
 * Baixa do Supabase as análises do usuário
 * e garante que estejam disponíveis no SQLite.
 */
export async function baixarAnalisesDoSupabase(userId) {
  const conectado = await estaConectado();

  if (!conectado) {
    return {
      baixados: 0,
      falhas: 0,
    };
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("analises_nutricionais")
      .select(`
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
        criado_em
      `)
      .eq("user_id", userId)
      .order("criado_em", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    let baixados = 0;
    let falhas = 0;

    for (const analise of data ?? []) {
      try {
        await salvarAnaliseSincronizada(
          analise
        );

        baixados += 1;

      } catch (err) {
        console.warn(
          `[Sync] Falha ao salvar análise ${analise.id} no SQLite:`,
          err.message
        );

        falhas += 1;
      }
    }

    return {
      baixados,
      falhas,
    };

  } catch (err) {
    console.warn(
      "[Sync] Falha ao baixar análises do Supabase:",
      err.message
    );

    return {
      baixados: 0,
      falhas: 1,
    };
  }
}

/**
 * Registra um listener que tenta sincronizar
 * automaticamente quando a conexão volta.
 */
export function iniciarListenerDeSincronizacaoAutomatica() {
  let estavaOffline = false;

  const unsubscribe =
    NetInfo.addEventListener((estado) => {
      const online = Boolean(
        estado.isConnected &&
        estado.isInternetReachable !== false
      );

      if (online && estavaOffline) {
        sincronizarPendentes().catch(
          (err) =>
            console.warn(
              "[Sync] Erro na sincronização automática:",
              err.message
            )
        );
      }

      estavaOffline = !online;
    });

  return unsubscribe;
}