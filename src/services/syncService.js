// Serviço de sincronização: implementa a arquitetura offline-first.
//
// Fluxo:
//  1. Toda análise é sempre salva primeiro no SQLite local (nunca depende de rede).
//  2. Quando há conexão com a internet, os registros marcados como
//     "não sincronizado" são enviados ao Supabase.
//  3. Após o envio bem-sucedido, o registro local é marcado como sincronizado.
//
// Estratégia de conflito: "last write wins" via upsert, usando o mesmo
// UUID gerado no client como chave primária tanto no SQLite quanto no Supabase.

import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../config/supabase";
import { listarAnalisesPendentes, marcarComoSincronizado, salvarAnaliseSincronizada, } from "../database/db";

/**
 * Verifica se o dispositivo está com conexão à internet no momento.
 */
export async function estaConectado() {
  const estado = await NetInfo.fetch();
  return Boolean(estado.isConnected && estado.isInternetReachable !== false);
}

/**
 * Envia para o Supabase todos os registros locais ainda não sincronizados.
 * Deve ser chamado: (a) logo após salvar uma nova análise, e (b) sempre
 * que a conectividade for restabelecida.
 *
 * @returns {Promise<{enviados: number, falhas: number}>}
 */
export async function sincronizarPendentes() {
  const conectado = await estaConectado();

  if (!conectado) {
    return { enviados: 0, falhas: 0 };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[Sync] Usuário não autenticado.");
    return { enviados: 0, falhas: 0 };
  }

  const pendentes = await listarAnalisesPendentes(user.id);

  let enviados = 0;
  let falhas = 0;

  for (const analise of pendentes) {
    try {
      const { error } = await supabase
        .from("analises_nutricionais")
        .upsert({
          id: analise.id,
          user_id: analise.user_id,
          nome_produto: analise.nome_produto,
          calorias: analise.calorias,
          acucares: analise.acucares,
          sodio: analise.sodio,
          gorduras_saturadas: analise.gorduras_saturadas,
          status: analise.status,
          texto_bruto_ocr: analise.texto_bruto_ocr,
          criado_em: analise.criado_em,
        });

      if (error) throw error;

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

  return { enviados, falhas };
}

/**
 * Baixa do Supabase as análises do usuário e garante que
 * elas também estejam disponíveis no SQLite local.
 */
export async function baixarAnalisesDoSupabase(userId) {
  const conectado = await estaConectado();

  if (!conectado) {
    return { baixados: 0, falhas: 0 };
  }

  try {
    const { data, error } = await supabase
      .from("analises_nutricionais")
      .select(
        "id,user_id,nome_produto,calorias,acucares,sodio,gorduras_saturadas,status,texto_bruto_ocr,criado_em"
      )
      .eq("user_id", userId)
      .order("criado_em", { ascending: false });

    if (error) {
      throw error;
    }

    let baixados = 0;
    let falhas = 0;

    for (const analise of data ?? []) {
      try {
        await salvarAnaliseSincronizada(analise);
        baixados += 1;
      } catch (err) {
        console.warn(
          `[Sync] Falha ao salvar análise ${analise.id} no SQLite:`,
          err.message
        );
        falhas += 1;
      }
    }

    return { baixados, falhas };
  } catch (err) {
    console.warn(
      "[Sync] Falha ao baixar análises do Supabase:",
      err.message
    );

    return { baixados: 0, falhas: 1 };
  }
}

/**
 * Registra um listener que tenta sincronizar automaticamente sempre que
 * a conectividade do dispositivo mudar de "offline" para "online".
 * Retorna a função de "unsubscribe" (chamar ao desmontar o componente raiz).
 */
export function iniciarListenerDeSincronizacaoAutomatica() {
  let estavaOffline = false;

  const unsubscribe = NetInfo.addEventListener((estado) => {
    const online = Boolean(estado.isConnected && estado.isInternetReachable !== false);

    if (online && estavaOffline) {
      // Voltou a ficar online: tenta sincronizar o que estiver pendente.
      sincronizarPendentes().catch((err) =>
        console.warn("[Sync] Erro na sincronização automática:", err.message)
      );
    }

    estavaOffline = !online;
  });

  return unsubscribe;
}
