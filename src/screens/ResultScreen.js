import React, { useEffect, useRef } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import {
  STATUS,
  STATUS_LABEL,
  STATUS_COLOR,
  classifyProduct,
  analisarNutrientes,
} from "../services/classificationService";

import { supabase } from "../config/supabase";
import { inserirAnalise } from "../database/db";

export default function ResultScreen({ route, navigation }) {
  const analiseSalva = useRef(false);

  const {
    analise,
    produto,
    erro,
    textoBruto,
    codigoBarras,
    tipoCodigo,
    origem,
  } = route.params || {};

  /*
   * ============================================================
   * SALVAR ANÁLISE NO HISTÓRICO
   * ============================================================
   */

  useEffect(() => {
    async function salvarAnaliseNoHistorico() {
      // Só salva quando existe um produto
      if (!produto) {
        return;
      }

      // Evita salvar duas vezes caso a tela seja renderizada novamente
      if (analiseSalva.current) {
        return;
      }

      analiseSalva.current = true;

      try {
        /*
         * Recupera o usuário atualmente logado
         */
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.warn(
            "[ResultScreen] Usuário não autenticado. " +
            "A análise não será salva no histórico."
          );

          return;
        }

        const userId = session.user.id;

        /*
         * ========================================================
         * NORMALIZAÇÃO DOS DADOS DO PRODUTO
         * ========================================================
         *
         * O produto pode vir do SQLite/Supabase usando snake_case
         * ou do cadastro usando camelCase.
         */

        const nomeProduto =
          produto.nome_produto ??
          produto.nomeProduto ??
          "Produto sem nome";

        const codigo =
          produto.codigo_barras ??
          produto.codigoBarras ??
          codigoBarras ??
          null;

        const calorias =
          produto.calorias ?? null;

        const acucares =
          produto.acucares ?? null;

        const sodio =
          produto.sodio ?? null;

        const gordurasSaturadas =
          produto.gorduras_saturadas ??
          produto.gordurasSaturadas ??
          null;

        /*
         * ========================================================
         * CLASSIFICAÇÃO
         * ========================================================
         */

        const valores = {
          acucares,
          sodio,
          gordurasSaturadas,
        };

        const statusClassificacao =
          classifyProduct(valores);

        /*
         * Caso não seja possível classificar,
         * usamos "indeterminado".
         */
        const status =
          statusClassificacao ??
          STATUS.INDETERMINADO ??
          "indeterminado";

        /*
         * ========================================================
         * CRIAÇÃO DO REGISTRO DO HISTÓRICO
         * ========================================================
         */

        const novaAnalise = {
          id:
            `analise-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,

          userId,

          codigoBarras: codigo,

          nomeProduto,

          calorias,

          acucares,

          sodio,

          gordurasSaturadas,

          status,

          textoBrutoOcr: textoBruto ?? null,

          imagemUri: null,

          criadoEm: new Date().toISOString(),

          sincronizado: 0,
        };

        await inserirAnalise(novaAnalise);

        console.log(
          "[ResultScreen] Análise salva no histórico:",
          novaAnalise
        );
      } catch (error) {
        console.warn(
          "[ResultScreen] Erro ao salvar análise no histórico:",
          error
        );
      }
    }

    salvarAnaliseNoHistorico();
  }, [produto, codigoBarras, textoBruto]);

  /*
   * ============================================================
   * CASO TENHA OCORRIDO UM ERRO
   * ============================================================
   */

  if (erro) {
    return (
      <View style={styles.container}>
        <View style={styles.erroContainer}>
          <Text style={styles.erroTitulo}>
            Erro
          </Text>

          <Text style={styles.erroTexto}>
            {erro}
          </Text>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.botaoTexto}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /*
   * ============================================================
   * QUANDO EXISTE UM PRODUTO
   * ============================================================
   */

  if (produto) {
    /*
     * Normaliza os dados para funcionar tanto com
     * snake_case quanto camelCase.
     */

    const nomeProduto =
      produto.nome_produto ??
      produto.nomeProduto ??
      "Produto sem nome";

    const codigo =
      produto.codigo_barras ??
      produto.codigoBarras ??
      codigoBarras ??
      "-";

    const tipo =
      produto.tipo_codigo ??
      produto.tipoCodigo ??
      tipoCodigo ??
      "-";

    const calorias =
      produto.calorias ?? null;

    const acucares =
      produto.acucares ?? null;

    const sodio =
      produto.sodio ?? null;

    const gordurasSaturadas =
      produto.gorduras_saturadas ??
      produto.gordurasSaturadas ??
      null;

    /*
     * Classificação geral
     */

    const valores = {
      acucares,
      sodio,
      gordurasSaturadas,
    };

    const status =
      classifyProduct(valores);

    /*
     * Classificação individual dos nutrientes
     */

    const classificacoes =
      analisarNutrientes(valores);

    /*
     * Texto explicativo
     */

    function gerarExplicacao() {
      if (!status) {
        return (
          "Não há informações nutricionais suficientes " +
          "para classificar este produto."
        );
      }

      if (status === STATUS.SAUDAVEL) {
        return (
          "Os nutrientes analisados estão dentro dos " +
          "limites considerados saudáveis."
        );
      }

      if (status === STATUS.MODERADO) {
        return (
          "O produto apresenta alguns nutrientes em níveis " +
          "moderados. Consuma com atenção e equilíbrio."
        );
      }

      if (status === STATUS.EVITAR) {
        return (
          "O produto apresenta pelo menos um nutriente " +
          "acima do limite definido para a classificação. " +
          "Considere limitar o consumo."
        );
      }

      return (
        "Não foi possível determinar uma classificação " +
        "com os dados disponíveis."
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* ======================================================
            CABEÇALHO
        ====================================================== */}

        <View style={styles.header}>
          <Text style={styles.titulo}>
            Resultado da Análise
          </Text>

          <Text style={styles.subtitulo}>
            Produto encontrado
          </Text>
        </View>

        {/* ======================================================
            PRODUTO
        ====================================================== */}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Produto
          </Text>

          <Text style={styles.nomeProduto}>
            {nomeProduto}
          </Text>

          <Text style={styles.info}>
            Código: {codigo}
          </Text>

          <Text style={styles.info}>
            Tipo: {tipo}
          </Text>

          {origem ? (
            <Text style={styles.info}>
              Fonte: {origem}
            </Text>
          ) : null}
        </View>

        {/* ======================================================
            INFORMAÇÕES NUTRICIONAIS
        ====================================================== */}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Informações nutricionais
          </Text>

          <View style={styles.linha}>
            <Text style={styles.nutriente}>
              Calorias
            </Text>

            <Text style={styles.valor}>
              {calorias ?? "--"} kcal
            </Text>
          </View>

          <View style={styles.linha}>
            <Text style={styles.nutriente}>
              Açúcares
            </Text>

            <Text style={styles.valor}>
              {acucares ?? "--"} g
            </Text>
          </View>

          <View style={styles.linha}>
            <Text style={styles.nutriente}>
              Sódio
            </Text>

            <Text style={styles.valor}>
              {sodio ?? "--"} mg
            </Text>
          </View>

          <View style={styles.linha}>
            <Text style={styles.nutriente}>
              Gorduras saturadas
            </Text>

            <Text style={styles.valor}>
              {gordurasSaturadas ?? "--"} g
            </Text>
          </View>
        </View>

        {/* ======================================================
            CLASSIFICAÇÃO GERAL
        ====================================================== */}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Classificação
          </Text>

          <View
            style={[
              styles.classificacaoBox,
              {
                backgroundColor:
                  STATUS_COLOR[status] ||
                  "#757575",
              },
            ]}
          >
            <Text style={styles.classificacaoTexto}>
              {STATUS_LABEL[status] ||
                "Indeterminado"}
            </Text>
          </View>

          <Text style={styles.explicacao}>
            {gerarExplicacao()}
          </Text>
        </View>

        {/* ======================================================
            CLASSIFICAÇÃO POR NUTRIENTE
        ====================================================== */}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Análise dos nutrientes
          </Text>

          {/* Açúcares */}

          <View style={styles.nutrienteBox}>
            <View style={styles.nutrienteHeader}>
              <Text style={styles.nutrienteNome}>
                Açúcares
              </Text>

              <Text
                style={[
                  styles.nutrienteStatus,
                  {
                    color:
                      STATUS_COLOR[
                      classificacoes.acucares
                      ] || "#757575",
                  },
                ]}
              >
                {STATUS_LABEL[
                  classificacoes.acucares
                ] || "Indeterminado"}
              </Text>
            </View>

            <Text style={styles.nutrienteValor}>
              {acucares ?? "--"} g
            </Text>
          </View>

          {/* Sódio */}

          <View style={styles.nutrienteBox}>
            <View style={styles.nutrienteHeader}>
              <Text style={styles.nutrienteNome}>
                Sódio
              </Text>

              <Text
                style={[
                  styles.nutrienteStatus,
                  {
                    color:
                      STATUS_COLOR[
                      classificacoes.sodio
                      ] || "#757575",
                  },
                ]}
              >
                {STATUS_LABEL[
                  classificacoes.sodio
                ] || "Indeterminado"}
              </Text>
            </View>

            <Text style={styles.nutrienteValor}>
              {sodio ?? "--"} mg
            </Text>
          </View>

          {/* Gorduras saturadas */}

          <View style={styles.nutrienteBox}>
            <View style={styles.nutrienteHeader}>
              <Text style={styles.nutrienteNome}>
                Gorduras saturadas
              </Text>

              <Text
                style={[
                  styles.nutrienteStatus,
                  {
                    color:
                      STATUS_COLOR[
                      classificacoes.gordurasSaturadas
                      ] || "#757575",
                  },
                ]}
              >
                {STATUS_LABEL[
                  classificacoes.gordurasSaturadas
                ] || "Indeterminado"}
              </Text>
            </View>

            <Text style={styles.nutrienteValor}>
              {gordurasSaturadas ?? "--"} g
            </Text>
          </View>
        </View>

        {/* ======================================================
            TEXTO OCR, SE EXISTIR
        ====================================================== */}

        {textoBruto ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>
              Texto identificado
            </Text>

            <Text style={styles.textoOcr}>
              {textoBruto}
            </Text>
          </View>
        ) : null}

        {/* ======================================================
            BOTÕES
        ====================================================== */}

        <TouchableOpacity
          style={styles.botaoEditar}
          onPress={() =>
            navigation.navigate("CadastroProduto", {
              codigoBarras: codigo,
              tipoCodigo: tipo,
              produto: produto,
              modoEdicao: true,
            })
          }
        >
          <Text style={styles.botaoEditarTexto}>
            ✏️ Editar produto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botao}
          onPress={() =>
            navigation.navigate("Camera")
          }
        >
          <Text style={styles.botaoTexto}>
            Nova análise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() =>
            navigation.navigate("Historico")
          }
        >
          <Text style={styles.botaoSecundarioTexto}>
            Ver histórico
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.botaoVoltarTexto}>
            Voltar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /*
   * ============================================================
   * CASO TENHA UMA ANÁLISE ANTIGA
   * ============================================================
   */

  if (analise) {
    const status = analise.status;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.titulo}>
            Resultado da Análise
          </Text>

          <Text style={styles.subtitulo}>
            Análise realizada
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Classificação
          </Text>

          <View
            style={[
              styles.classificacaoBox,
              {
                backgroundColor:
                  STATUS_COLOR[status] ||
                  "#757575",
              },
            ]}
          >
            <Text style={styles.classificacaoTexto}>
              {STATUS_LABEL[status] ||
                "Indeterminado"}
            </Text>
          </View>
        </View>

        {analise.textoBrutoOcr ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>
              Texto identificado
            </Text>

            <Text style={styles.textoOcr}>
              {analise.textoBrutoOcr}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.botao}
          onPress={() =>
            navigation.navigate("Camera")
          }
        >
          <Text style={styles.botaoTexto}>
            Nova análise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() =>
            navigation.navigate("Historico")
          }
        >
          <Text style={styles.botaoSecundarioTexto}>
            Ver histórico
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /*
   * ============================================================
   * CASO TENHA SOMENTE O CÓDIGO DE BARRAS
   * ============================================================
   */

  return (
    <View style={styles.container}>
      <View style={styles.erroContainer}>
        <Text style={styles.titulo}>
          Código de barras
        </Text>

        <Text style={styles.codigoGrande}>
          {codigoBarras || "Não informado"}
        </Text>

        <TouchableOpacity
          style={styles.botao}
          onPress={() =>
            navigation.navigate("Camera")
          }
        >
          <Text style={styles.botaoTexto}>
            Nova análise
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/*
 * ==============================================================
 * ESTILOS
 * ==============================================================
 */

const styles = StyleSheet.create({

  botaoEditar: {
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#1F3864",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },

  botaoEditarTexto: {
    color: "#1F3864",
    fontSize: 16,
    fontWeight: "700",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 18,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
  },

  subtitulo: {
    fontSize: 14,
    color: "#777777",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  cardTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
  },

  nomeProduto: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F3864",
    marginBottom: 8,
  },

  info: {
    fontSize: 13,
    color: "#666666",
    marginTop: 3,
  },

  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  nutriente: {
    fontSize: 14,
    color: "#444444",
  },

  valor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
  },

  classificacaoBox: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  classificacaoTexto: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  explicacao: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 21,
    marginTop: 12,
  },

  nutrienteBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  nutrienteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nutrienteNome: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },

  nutrienteStatus: {
    fontSize: 13,
    fontWeight: "700",
  },

  nutrienteValor: {
    fontSize: 13,
    color: "#666666",
    marginTop: 5,
  },

  textoOcr: {
    fontSize: 13,
    lineHeight: 20,
    color: "#555555",
  },

  botao: {
    backgroundColor: "#1F3864",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoSecundario: {
    backgroundColor: "#E8EDF5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },

  botaoSecundarioTexto: {
    color: "#1F3864",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoVoltar: {
    paddingVertical: 12,
    alignItems: "center",
  },

  botaoVoltarTexto: {
    color: "#666666",
    fontSize: 14,
  },

  erroContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  erroTitulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#C62828",
    marginBottom: 12,
  },

  erroTexto: {
    fontSize: 15,
    color: "#555555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  codigoGrande: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F3864",
    marginVertical: 20,
  },
});